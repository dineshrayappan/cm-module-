import React, { useState } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, AlertCircle, CheckCircle2, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(identifier, password);
      if (!res.success) {
        setError(res.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (username, pass) => {
    setIdentifier(username);
    setPassword(pass);
    setError(null);
    setLoading(true);
    try {
      const res = await login(username, pass);
      if (!res.success) {
        setError(res.message || 'Quick login failed.');
      }
    } catch (err) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '24px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e2e8f0',
        padding: '36px',
        overflow: 'hidden'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
            marginBottom: '14px'
          }}>
            <ShieldCheck size={30} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            TexCompliant™
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
            Garment Factory Compliance & Audit Management System
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            color: '#dc2626',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '20px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <User size={16} />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. admin, auditor, supervisor"
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 150ms ease'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <Lock size={16} />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '11px 12px 11px 38px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 150ms ease'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#1e40af',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(30, 64, 175, 0.2)',
              transition: 'background-color 150ms ease'
            }}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Persona Access for Testing */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{
            fontSize: '11.5px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            color: '#64748b',
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            Select Role to Login
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Admin Persona */}
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'admin123')}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #bfdbfe',
                backgroundColor: '#eff6ff',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e40af' }}>
                  ADMIN
                </div>
                <div style={{ fontSize: '11.5px', color: '#3b82f6' }}>
                  Full Access: Users, Requirements, Depts, Audits, NC/CAP, Reports
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', backgroundColor: '#dbeafe', color: '#1e40af' }}>
                admin / admin123
              </span>
            </button>

            {/* Auditor Persona */}
            <button
              type="button"
              onClick={() => handleQuickLogin('auditor', 'auditor123')}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #bbf7d0',
                backgroundColor: '#f0fdf4',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#15803d' }}>
                  INTERNAL AUDITOR
                </div>
                <div style={{ fontSize: '11.5px', color: '#16a34a' }}>
                  Audits, Checklists, Create NC, Review CAP, Verify Evidence, Close NC
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#15803d' }}>
                auditor / auditor123
              </span>
            </button>

            {/* Supervisor Persona */}
            <button
              type="button"
              onClick={() => handleQuickLogin('supervisor', 'supervisor123')}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid #fed7aa',
                backgroundColor: '#fff7ed',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#c2410c' }}>
                  SUPERVISOR
                </div>
                <div style={{ fontSize: '11.5px', color: '#ea580c' }}>
                  Assigned Dept Tasks, Compliance, Respond to NC, Submit CAP, Upload Evidence
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', backgroundColor: '#ffedd5', color: '#c2410c' }}>
                supervisor / supervisor123
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
