import { useEffect, useState } from 'react';

const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background animate-fade-out overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-80"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, hsl(var(--glow-primary) / 0.18), transparent 50%), radial-gradient(circle at 80% 80%, hsl(var(--glow-accent) / 0.14), transparent 55%)',
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
      <div className="relative text-center">
        <div className="relative w-32 h-32 mx-auto mb-6 animate-scale-in">
          <div className="absolute inset-0 rounded-full border-4 border-border/40 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-24 h-24 rounded-2xl animate-float ring-1 ring-border/60 shadow-[0_8px_32px_-8px_hsl(var(--glow-primary)/0.35)] flex items-center justify-center bg-gradient-to-br from-card via-muted to-background"
            >
              <span
                className="text-2xl font-bold tracking-[0.18em] text-transparent bg-clip-text bg-gradient-to-br from-foreground via-primary to-accent"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                MBA
              </span>
            </div>
          </div>
          <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin-slow" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight animate-fade-in-up">MBA Corp.</h2>
        <p className="text-muted-foreground animate-fade-in-up-delay">Professional Models Agency</p>
      </div>
    </div>
  );
};

export default LoadingScreen;