"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Database, Loader2, Lock } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md shadow-xl border-gray-200 dark:border-slate-800 dark:bg-slate-950">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="p-3 bg-blue-600 rounded-2xl text-white mb-4">
            <Database size={32} />
          </div>
          <CardTitle className="text-2xl font-bold dark:text-gray-100">MongoDB WebGUI</CardTitle>
          <CardDescription className="text-center dark:text-gray-400">
            Enter your credentials to access the dashboard. 
            <br />
            <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">
              Hint: Check your server console for the auto-generated password.
            </span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <Lock size={16} />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username" className="dark:text-gray-300">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="dark:bg-slate-900 dark:border-slate-800 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="dark:bg-slate-900 dark:border-slate-800 dark:text-gray-100"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
              Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
