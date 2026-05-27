import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { addAuditLog } from '@/lib/auditLog';

const API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка авторизации');
        setLoading(false);
        return;
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('userName', data.user.fullName);
      if (data.user.createdAt) localStorage.setItem('userCreatedAt', data.user.createdAt);
      if (data.user.photoUrl) {
        localStorage.setItem('userPhotoUrl', data.user.photoUrl);
      } else {
        localStorage.removeItem('userPhotoUrl');
      }
      
      addAuditLog(data.user.email, 'Вход в систему', 'Успешная авторизация', 'auth');
      navigate('/dashboard');
    } catch (err) {
      setError('Ошибка подключения к серверу');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, hsl(var(--glow-primary) / 0.22), transparent 50%), radial-gradient(circle at 85% 80%, hsl(var(--glow-accent) / 0.18), transparent 55%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--border) / 0.08) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }}
      />

      <Card className="glass-strong w-full max-w-md p-10 relative z-10 rounded-3xl border-border/40">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/90 to-accent/70 mb-6 ring-1 ring-border/60 shadow-[0_8px_32px_-8px_hsl(var(--glow-primary)/0.45)]">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 36V12L16 24L24 12L32 24L40 12V36H36V20L32 26L24 16L16 26L12 20V36H8Z" fill="hsl(var(--primary-foreground))"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-3 text-foreground tracking-tight">MBA Corporation</h1>
          <p className="text-sm tracking-[0.3em] text-muted-foreground uppercase font-light">Professional Models Agency</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground/90 font-medium text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring focus:border-transparent h-12 rounded-xl backdrop-blur-sm"
              placeholder="example@mba-corp.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground/90 font-medium text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background/40 border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-ring focus:border-transparent h-12 rounded-xl backdrop-blur-sm"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-xl border border-destructive/30 backdrop-blur-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-12 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg ring-1 ring-border/40"
          >
            {loading ? 'Вход...' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Login;