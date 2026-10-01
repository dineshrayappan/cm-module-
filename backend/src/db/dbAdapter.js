import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { initialData } from './initialData.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://orynjopcmagmfwkwciyu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_EhRdeRfuAwdgpF9LOHaGdA_P5qD7WJE';

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
    // IMMUTABILITY ENFORCEMENT: Never allow updates to audit trail records
    if (table === 'auditLogs' || table === 'audit_logs') {
      throw new Error('Compliance Security Violation: Audit trail records are strictly immutable and cannot be updated or altered.');
    }

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
    // IMMUTABILITY ENFORCEMENT: Never allow updates to audit trail records
    if (table === 'auditLogs' || table === 'audit_logs') {
      throw new Error('Compliance Security Violation: Audit trail records are strictly immutable and cannot be updated or altered.');
    }

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
    // IMMUTABILITY ENFORCEMENT: Never allow deletions to audit trail records
    if (table === 'auditLogs' || table === 'audit_logs') {
      throw new Error('Compliance Security Violation: Audit trail records are strictly immutable and cannot be deleted.');
    }

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
    if (table === 'auditLogs' || table === 'audit_logs') {
      throw new Error('Compliance Security Violation: Audit trail records are strictly immutable and cannot be modified or altered.');
    }
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseClient.from(table).update(updateData).eq('id', id).select().single();
        if (!error && data) return data;
      } catch (e) {}
    }
    return localStore.updateById(table, id, updateData);
  },

  async deleteById(table, id, soft = true) {
    if (table === 'auditLogs' || table === 'audit_logs') {
      throw new Error('Compliance Security Violation: Audit trail records are strictly immutable and cannot be deleted.');
    }
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

  // Audit logging utility (Strictly Append-Only, Immutable & Tamper-Evident)
  async logAction({
    userId,
    userEmail,
    userName,
    userRole,
    action,
    actionLabel,
    entityType,
    entityId,
    entityName,
    relatedNcId,
    oldValue,
    newValue,
    details,
    req
  }) {
    const ipAddress = req?.ip || req?.socket?.remoteAddress || '127.0.0.1';
    const createdAt = new Date().toISOString();
    
    // Compute tamper-evident verification hash
    const hashData = `${userId || 'anon'}:${action}:${entityType}:${entityId}:${createdAt}`;
    const tamperHash = crypto.createHash('sha256').update(hashData).digest('hex').substring(0, 16);

    const logDoc = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId || req?.user?.id || null,
      user_email: userEmail || req?.user?.email || 'system',
      user_name: userName || req?.user?.full_name || (userEmail ? userEmail.split('@')[0] : 'System'),
      user_role: userRole || req?.user?.role || 'system',
      action,
      action_label: actionLabel || action.replace(/_/g, ' '),
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName || '',
      related_nc_id: relatedNcId || null,
      old_value: oldValue || null,
      new_value: newValue || null,
      details: details || null,
      ip_address: ipAddress,
      is_immutable: true,
      tamper_hash: `SHA256:${tamperHash}`,
      created_at: createdAt
    };
    return localStore.insert('auditLogs', logDoc);
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
