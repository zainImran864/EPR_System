// LoginScreen.jsx — EPR System unauthenticated entry
// Centered card with the horizontal lockup, email + password, primary CTA.

import React, { useState } from 'react';
import { Button, Input } from './Primitives';

export function LoginScreen({ onSubmit, schoolName = 'School ERP' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit?.({ email, password });
    } catch (err) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
        padding: 'var(--space-8)',
      }}>
        <header style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <img
            src="../../assets/logo-lockup.svg"
            alt={schoolName}
            style={{ height: 48, marginBottom: 'var(--space-4)' }}
          />
          <h1 style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--color-text)',
            margin: 0,
          }}>
            Sign in to {schoolName}
          </h1>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
            marginTop: 'var(--space-2)',
            marginBottom: 0,
          }}>
            Use your school-issued account to continue.
          </p>
        </header>

        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu.pk"
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
          />

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 'var(--text-sm)',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
              <input type="checkbox" />
              Remember me
            </label>
            <a href="#" style={{ color: 'var(--color-primary)' }}>Forgot password?</a>
          </div>

          <Button type="submit" variant="primary" size="lg" loading={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <footer style={{
          marginTop: 'var(--space-6)',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-muted)',
        }}>
          Need help? Contact your school administrator.
        </footer>
      </div>
    </div>
  );
}
