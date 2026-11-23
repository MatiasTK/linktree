'use client';

import { Button, Input } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { Lock } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data: { success: boolean; error?: string } = await res.json();

      if (data.success) {
        window.location.href = '/admin';
      } else {
        setError(data.error || 'Wrong password. Try again.');
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="board !block !p-6 sm:!p-8">
          <div className="flex items-center justify-between mb-8">
            <span className="keycap" aria-hidden>
              <Lock size={14} />
            </span>
            <span className="font-mono text-[13px] text-muted-foreground">matiastk / admin</span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-[-0.04em] leading-none">Sign in</h1>
          <p className="mt-3 text-foreground/75">Enter the admin password to edit your links.</p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-8">
            <FormField label="Password">
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
                autoFocus
                error={!!error}
              />
            </FormField>

            {error && (
              <p role="alert" className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" isLoading={loading}>
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
