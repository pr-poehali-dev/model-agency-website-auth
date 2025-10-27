import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { addAuditLog } from '@/lib/auditLog';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userEmail', email);
    addAuditLog(email, 'Вход в систему', 'Успешная авторизация', 'auth');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary to-background opacity-50"></div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-2 border-muted rounded-full opacity-20"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border-2 border-muted rounded-full opacity-15"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-muted rounded-full opacity-10"></div>

      <Card className="w-full max-w-md p-8 bg-card/95 backdrop-blur-sm border-border shadow-2xl relative z-10 animate-scale-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2 text-foreground">MBA Corp.</h1>
          <p className="text-sm tracking-[0.3em] text-muted-foreground uppercase">Professional Models Agency</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
              placeholder="example@mba-corp.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
              placeholder="••••••••"
              required
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 transition-all duration-300 hover:scale-[1.02]"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <button className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">
            Forgot password?
          </button>
          <div className="text-xs text-muted-foreground border-t border-border pt-4 mt-4">
            <p className="mb-2">Test accounts:</p>
            <p>Admin: admin@mba-corp.com</p>
            <p>Manager: manager@mba-corp.com</p>
            <p>Viewer: viewer@mba-corp.com</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;