import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your username or employee ID.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await login(identifier.trim(), password);
      if (res && res.success === false) {
        setError(res.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setRoleCredentials = (role, user, pass) => {
    setIdentifier(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      backgroundImage: `linear-gradient(rgba(241, 245, 249, 0.42), rgba(241, 245, 249, 0.42)), url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=80')`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      padding: '24px',
      boxSizing: 'border-box',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* Floating Pristine Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#ffffff',
        borderRadius: '22px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        padding: '42px 38px',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Brand Header */}
        <div style={{ marginBottom: '26px' }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1.4px',
            color: '#059669',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            GARMAX
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 6px 0',
            letterSpacing: '-0.5px',
            lineHeight: 1.2
          }}>
            Welcome back
          </h1>
          <p style={{
            fontSize: '13.5px',
            color: '#64748b',
            margin: 0,
            fontWeight: 400
          }}>
            Sign in to your workspace
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '11px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            color: '#b91c1c',
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '20px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '6px'
            }}>
              Username
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onFocus={() => setFocusedField('username')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. admin, auditor, supervisor"
              autoComplete="username"
              style={{
                width: '100%',
                height: '44px',
                padding: '0 14px',
                borderRadius: '8px',
                border: focusedField === 'username' ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                backgroundColor: '#edf4fc',
                fontSize: '14.5px',
                color: '#0f172a',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 150ms ease, background-color 150ms ease'
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '6px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 42px 0 14px',
                  borderRadius: '8px',
                  border: focusedField === 'password' ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                  backgroundColor: '#edf4fc',
                  fontSize: '14.5px',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  letterSpacing: showPassword ? 'normal' : '2px',
                  transition: 'border-color 150ms ease, background-color 150ms ease'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Left-Aligned Clean Sign In Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '11px 26px',
                backgroundColor: loading ? '#475569' : '#0b1329',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(11, 19, 41, 0.18)',
                transition: 'background-color 150ms ease, transform 100ms ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#1e293b';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#0b1329';
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Discreet Quick Persona Switcher for pair-programming & QA */}
        <div style={{
          marginTop: '32px',
          paddingTop: '20px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{
            fontSize: '11px',
            color: '#94a3b8',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Quick login:</span>
            <span style={{ fontSize: '10px', color: '#cbd5e1' }}>Single click switch</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setRoleCredentials('admin', 'admin', 'admin123')}
              style={{
                flex: 1,
                padding: '7px 8px',
                borderRadius: '6px',
                border: identifier === 'admin' ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                backgroundColor: identifier === 'admin' ? '#eff6ff' : '#f8fafc',
                color: identifier === 'admin' ? '#1d4ed8' : '#475569',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 120ms ease'
              }}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setRoleCredentials('auditor', 'auditor', 'auditor123')}
              style={{
                flex: 1,
                padding: '7px 8px',
                borderRadius: '6px',
                border: identifier === 'auditor' ? '1px solid #86efac' : '1px solid #e2e8f0',
                backgroundColor: identifier === 'auditor' ? '#f0fdf4' : '#f8fafc',
                color: identifier === 'auditor' ? '#15803d' : '#475569',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 120ms ease'
              }}
            >
              Auditor
            </button>
            <button
              type="button"
              onClick={() => setRoleCredentials('supervisor', 'supervisor', 'supervisor123')}
              style={{
                flex: 1,
                padding: '7px 8px',
                borderRadius: '6px',
                border: identifier === 'supervisor' ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                backgroundColor: identifier === 'supervisor' ? '#fff7ed' : '#f8fafc',
                color: identifier === 'supervisor' ? '#c2410c' : '#475569',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 120ms ease'
              }}
            >
              Supervisor
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
