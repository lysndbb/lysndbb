import React, { useEffect, useRef } from 'react';

export const LeavesCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const leafColors = [
      'rgba(230, 126, 34, 0.65)',
      'rgba(211, 84, 0, 0.65)',
      'rgba(241, 196, 15, 0.6)',
      'rgba(186, 74, 0, 0.7)',
      'rgba(120, 40, 31, 0.6)'
    ];

    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      angle: number;
      angleSpeed: number;
      color: string;
    }

    const particles: Particle[] = Array.from({ length: 24 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      size: Math.random() * 6 + 6,
      speedX: Math.random() * 1.5 - 0.2,
      speedY: Math.random() * 1.2 + 0.8,
      angle: Math.random() * Math.PI * 2,
      angleSpeed: (Math.random() - 0.5) * 0.04,
      color: leafColors[Math.floor(Math.random() * leafColors.length)]
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.angle += p.angleSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) p.x = -20;
        if (p.x < -20) p.x = width + 20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      aria-hidden="true"
    />
  );
};
