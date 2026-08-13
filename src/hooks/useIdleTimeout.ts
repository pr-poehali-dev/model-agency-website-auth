import { useCallback, useEffect, useRef, useState } from 'react';

interface UseIdleTimeoutOptions {
  timeoutMs: number;
  warningMs: number;
  onTimeout: () => void;
  enabled?: boolean;
}

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'wheel',
] as const;

export const useIdleTimeout = ({
  timeoutMs,
  warningMs,
  onTimeout,
  enabled = true,
}: UseIdleTimeoutOptions) => {
  const [isWarning, setIsWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const lastActivityRef = useRef(Date.now());
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const reset = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsWarning(false);
    setSecondsLeft(0);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
    };

    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, handleActivity, { passive: true }),
    );

    return () => {
      ACTIVITY_EVENTS.forEach((evt) =>
        window.removeEventListener(evt, handleActivity),
      );
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      const idleFor = Date.now() - lastActivityRef.current;
      const remaining = timeoutMs - idleFor;

      if (remaining <= 0) {
        setIsWarning(false);
        onTimeoutRef.current();
        return;
      }

      if (remaining <= warningMs) {
        setIsWarning(true);
        setSecondsLeft(Math.ceil(remaining / 1000));
      } else {
        setIsWarning(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [enabled, timeoutMs, warningMs]);

  return { isWarning, secondsLeft, reset };
};

export default useIdleTimeout;
