import { useState, useEffect } from 'react';

export function useCountUp(target: number, durationMs: number = 800): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setCount(0);
      return;
    }
    let startTime: number | null = null;
    let animFrame: number;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      // Ease out quad
      const easedProgress = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(easedProgress * target));

      if (progress < 1) {
        animFrame = requestAnimationFrame(updateCount);
      } else {
        setCount(target);
      }
    };

    animFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animFrame);
  }, [target, durationMs]);

  return count;
}
