import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { initialData } from './initialData.js';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabaseClient = null;
let isSupabaseConfigured = false;

const isPlaceholder = !SUPABASE_URL ||
  SUPABASE_URL.includes('your-project-ref') ||
  SUPABASE_URL.includes('your-supabase') ||
  SUPABASE_URL.includes('placeholder') ||
  SUPABASE_KEY.includes('your-');

if (!isPlaceholder && SUPABASE_URL.startsWith('http')) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    isSupabaseConfigured = true;
    console.log('[DB] Connected to Supabase Cloud PostgreSQL at:', SUPABASE_URL);
  } catch (err) {
    console.warn('[DB] Supabase initialization failed, falling back to local memory store:', err.message);
  }
} else {
  console.log('[DB] Running with local high-performance store pre-seeded with 30+ compliance records.');
}

// In-Memory Data Store clone from initialData
class LocalDataStore {
  constructor() {
    this.data = JSON.parse(JSON.stringify(initialData));
  }

  // Filter helper matching mongo/sql like properties
  _match(item, filter) {
    if (!filter || Object.keys(filter).length === 0) return true;
    for (const key of Object.keys(filter)) {
      const filterVal = filter[key];
      if (filterVal === undefined || filterVal === null || filterVal === '') continue;
      
      // If array includes
      if (Array.isArray(filterVal)) {
        if (!filterVal.includes(item[key])) return false;
      } else if (typeof filterVal === 'string' && filterVal.startsWith('LIKE:')) {
        const query = filterVal.replace('LIKE:', '').toLowerCase();
        if (!item[key] || !String(item[key]).toLowerCase().includes(query)) return false;
      } else if (typeof filterVal === 'object' && filterVal !== null) {
        if (filterVal.$ne !== undefined && item[key] === filterVal.$ne) return false;
        if (filterVal.$gte !== undefined && item[key] < filterVal.$gte) return false;
        if (filterVal.$lte !== undefined && item[key] > filterVal.$lte) return false;
      } else {
        if (item[key] !== filterVal) return false;
      }
    }
    return true;
  }

  find(table, filter = {}, options = {}) {
    const list = this.data[table] || [];
    let results = list.filter(item => {
      if (item.is_deleted && !filter.include_deleted) return false;
      return this._match(item, filter);
    });

    // Sorting
    if (options.sortBy) {
      const order = options.sortOrder === 'asc' ? 1 : -1;
      results.sort((a, b) => {
        const valA = a[options.sortBy] || '';
        const valB = b[options.sortBy] || '';
        if (valA > valB) return order;
        if (valA < valB) return -order;
        return 0;
      });
    }

    // Pagination
    if (options.limit) {
      const offset = options.offset || 0;
      results = results.slice(offset, offset + options.limit);
    }

    return JSON.parse(JSON.stringify(results));
  }

  count(table, filter = {}) {
    const list = this.data[table] || [];
    return list.filter(item => {
      if (item.is_deleted && !filter.include_deleted) return false;
      return this._match(item, filter);
    }).length;
  }

  findOne(table, filter = {}) {
    const list = this.data[table] || [];
    const item = list.find(it => {
      if (it.is_deleted && !filter.include_deleted) return false;
      return this._match(it, filter);
    });
    return item ? JSON.parse(JSON.stringify(item)) : null;
  }

  findById(table, id) {
    return this.findOne(table, { id });
  }

  insert(table, item) {
    if (!this.data[table]) {
      this.data[table] = [];
    }
    const newDoc = {
      ...item,
      id: item.id || `gen-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.data[table].unshift(newDoc);
    return JSON.parse(JSON.stringify(newDoc));
  }

  update(table, filter, updateData) {
    const list = this.data[table] || [];
    let updatedCount = 0;
    for (let i = 0; i < list.length; i++) {
      if (this._match(list[i], filter)) {
        list[i] = {
          ...list[i],
          ...updateData,
          updated_at: new Date().toISOString()
        };
        updatedCount++;
      }
    }
    return updatedCount;
  }

  updateById(table, id, updateData) {
    const list = this.data[table] || [];
    const index = list.findIndex(it => it.id === id);
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      ...updateData,
      updated_at: new Date().toISOString()
    };
    return JSON.parse(JSON.stringify(list[index]));
  }

  deleteById(table, id, soft = true) {
    const list = this.data[table] || [];
    const index = list.findIndex(it => it.id === id);
    if (index === -1) return false;

    if (soft) {
      list[index].is_deleted = true;
      list[index].updated_at = new Date().toISOString();
    } else {
      list.splice(index, 1);
    }
    return true;
  }
}

export const localStore = new LocalDataStore();

// Universal DB Interface
export const db = {
  isSupabase: () => isSupabaseConfigured,
  supabase: supabaseClient,

  async find(table, filter = {}, options = {}) {
    if (isSupabaseConfigured) {
      try {
        let query = supabaseClient.from(table).select('*');
        for (const key of Object.keys(filter)) {
          if (filter[key] !== undefined && filter[key] !== null && filter[key] !== '') {
            query = query.eq(key, filter[key]);
          }
        }
        if (options.sortBy) {
          query = query.order(options.sortBy, { ascending: options.sortOrder === 'asc' });
        }
        if (options.limit) {
          const from = options.offset || 0;
          query = query.range(from, from + options.limit - 1);
        }
        const { data, error } = await query;
        if (!error && data) return data;
      } catch (e) {
        console.warn(`[DB] Supabase query fallback on ${table}:`, e.message);
      }
    }
    return localStore.find(table, filter, options);
  },

  async findById(table, id) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseClient.from(table).select('*').eq('id', id).single();
        if (!error && data) return data;
      } catch (e) {}
    }
    return localStore.findById(table, id);
  },

  async findOne(table, filter = {}) {
    if (isSupabaseConfigured) {
      try {
        let query = supabaseClient.from(table).select('*');
        for (const key of Object.keys(filter)) {
          query = query.eq(key, filter[key]);
        }
        const { data, error } = await query.limit(1).maybeSingle();
        if (!error && data) return data;
      } catch (e) {}
    }
    return localStore.findOne(table, filter);
  },

  async count(table, filter = {}) {
    if (isSupabaseConfigured) {
      try {
        let query = supabaseClient.from(table).select('*', { count: 'exact', head: true });
        for (const key of Object.keys(filter)) {
          query = query.eq(key, filter[key]);
        }
        const { count, error } = await query;
        if (!error && count !== null) return count;
      } catch (e) {}
    }
    return localStore.count(table, filter);
  },

  async insert(table, item) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseClient.from(table).insert([item]).select().single();
        if (!error && data) return data;
      } catch (e) {}
    }
    return localStore.insert(table, item);
  },

  async updateById(table, id, updateData) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseClient.from(table).update(updateData).eq('id', id).select().single();
        if (!error && data) return data;
      } catch (e) {}
    }
    return localStore.updateById(table, id, updateData);
  },

  async deleteById(table, id, soft = true) {
    if (isSupabaseConfigured) {
      try {
        if (soft) {
          const { error } = await supabaseClient.from(table).update({ is_deleted: true }).eq('id', id);
          if (!error) return true;
        } else {
          const { error } = await supabaseClient.from(table).delete().eq('id', id);
          if (!error) return true;
        }
      } catch (e) {}
    }
    return localStore.deleteById(table, id, soft);
  },

  // Audit logging utility
  async logAction({ userId, userEmail, userRole, action, entityType, entityId, entityName, oldValue, newValue, req }) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress || '127.0.0.1';
    const logDoc = {
      user_id: userId || null,
      user_email: userEmail || 'system',
      user_role: userRole || 'system',
      action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName || '',
      old_value: oldValue || null,
      new_value: newValue || null,
      ip_address: ipAddress,
      created_at: new Date().toISOString()
    };
    return this.insert('auditLogs', logDoc);
  },

  // In-app Notification utility
  async sendNotification({
    userId,
    role,
    title,
    message,
    type = 'task',
    priority = 'Normal',
    link = '',
    stage = 'general',
    entity_type = null,
    entity_id = null,
    entity_code = ''
  }) {
    const notif = {
      user_id: userId || null,
      role: role || null,
      title,
      message,
      type,
      priority,
      link,
      stage,
      entity_type,
      entity_id,
      entity_code,
      read_status: false,
      created_at: new Date().toISOString()
    };
    return this.insert('notifications', notif);
  }
};
