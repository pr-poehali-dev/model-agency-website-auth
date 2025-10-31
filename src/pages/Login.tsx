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

      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', data.user.email);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('userName', data.user.fullName);
      localStorage.setItem('authToken', data.token);
      
      addAuditLog(data.user.email, 'Вход в систему', 'Успешная авторизация', 'auth');
      navigate('/dashboard');
    } catch (err) {
      setError('Ошибка подключения к серверу');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-accent/30 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-md p-10 bg-card/95 backdrop-blur-xl border border-border shadow-2xl relative z-10 rounded-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mb-6 shadow-lg shadow-primary/50">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 36V12L16 24L24 12L32 24L40 12V36H36V20L32 26L24 16L16 26L12 20V36H8Z" fill="hsl(var(--primary-foreground))"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-3 text-foreground tracking-tight">MBA Corporation</h1>
          <p className="text-sm tracking-[0.3em] text-muted-foreground uppercase font-light">Professional Models Agency</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent h-12 rounded-xl backdrop-blur-sm"
              placeholder="example@mba-corp.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium text-sm">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent h-12 rounded-xl backdrop-blur-sm"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="text-destructive-foreground text-sm text-center bg-destructive/20 p-3 rounded-xl border border-destructive/30 backdrop-blur-sm">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
          >
            {loading ? 'Вход...' : 'Sign In'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Login;