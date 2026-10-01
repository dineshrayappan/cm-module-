import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import complianceBg from '../assets/compliance_bg.jpg';

export const LoginPage = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your Employee ID or Work Email.');
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
        setError(res.message || 'Login failed. Please verify credentials.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.48), rgba(15, 23, 42, 0.68)), url(${complianceBg})`,
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
        maxWidth: '430px',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        padding: '40px 36px',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Compliance Module Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1.2px',
            color: '#047857',
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '20px',
            padding: '4px 10px',
            textTransform: 'uppercase',
            marginBottom: '14px'
          }}>
            <ShieldCheck size={14} style={{ color: '#059669' }} />
            COMPLIANCE MODULE
          </div>
          <h1 style={{
            fontSize: '26px',
            fontWeight: 700,
            color: '#0f172a',
            margin: '0 0 6px 0',
            letterSpacing: '-0.4px',
            lineHeight: 1.2
          }}>
            Welcome Back
          </h1>
          <p style={{
            fontSize: '13.5px',
            color: '#64748b',
            margin: 0,
            fontWeight: 400
          }}>
            Sign in to access your compliance workspace
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
          {/* Employee ID / Email Field */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '6px'
            }}>
              Employee ID or Work Email
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onFocus={() => setFocusedField('identifier')}
              onBlur={() => setFocusedField(null)}
              placeholder="e.g. ADM-001 or admin@factory.com"
              autoComplete="username"
              style={{
                width: '100%',
                height: '44px',
                padding: '0 14px',
                borderRadius: '8px',
                border: focusedField === 'identifier' ? '1.5px solid #0f172a' : '1px solid #cbd5e1',
                backgroundColor: '#edf4fc',
                fontSize: '14px',
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
                  fontSize: '14px',
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

          {/* Sign In Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 24px',
                backgroundColor: loading ? '#475569' : '#0b1329',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14.5px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(11, 19, 41, 0.2)',
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
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Footer info note */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          Garment Manufacturing Quality & ISO Compliance System
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
