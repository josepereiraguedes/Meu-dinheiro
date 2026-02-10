import React, { useEffect, useState } from 'react';

// Simple CSS-based Confetti to avoid heavy libraries
export const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // vw
      y: -10, // above screen
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 5,
      tilt: Math.random() * 45 - 22.5,
      delay: Math.random() * 0.5,
      duration: Math.random() * 2 + 2,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}vw`,
            top: `-20px`,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.tilt}deg)`,
            animation: `fall ${p.duration}s linear ${p.delay}s forwards`,
            opacity: 0.8,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { top: -20px; transform: rotate(0deg) translateX(0); }
          25% { transform: rotate(45deg) translateX(20px); }
          50% { transform: rotate(90deg) translateX(-20px); }
          75% { transform: rotate(135deg) translateX(20px); }
          100% { top: 105vh; transform: rotate(180deg) translateX(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};