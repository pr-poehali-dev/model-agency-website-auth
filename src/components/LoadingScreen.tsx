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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 animate-fade-out">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-6 animate-scale-in">
          <div className="absolute inset-0 rounded-full border-4 border-slate-600/30 animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src="https://cdn.poehali.dev/projects/25df84be-2a57-474f-bb58-132a6c9f8811/files/25a217aa-0e77-43ca-953f-816ac4922ceb.jpg"
              alt="MBA Corp"
              className="w-24 h-24 rounded-lg animate-float"
            />
          </div>
          <div className="absolute inset-0 rounded-full border-t-4 border-slate-400 animate-spin-slow"></div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 animate-fade-in-up">MBA Corp.</h2>
        <p className="text-slate-400 animate-fade-in-up-delay">Professional Models Agency</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
