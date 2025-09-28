import React, { useEffect, useRef } from 'react';
import './HeartAnimation.css';

interface Particle {
  x: number;
  y: number;
  X: number;
  Y: number;
  R: number;
  S: number;
  q: number;
  D: number;
  F: number;
  f: string;
}

const HeartAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Heart animation variables
    const trails: Particle[][] = [];
    const heartPoints: number[][] = [];

    // Calculate heart path points
    const Y = 6.3;
    for (let i = 0; i < Y; i += 0.2) {
      heartPoints.push([
        canvas.width / 2 + 180 * Math.pow(Math.sin(i), 3),
        canvas.height / 2 + 10 * (-(15 * Math.cos(i) - 5 * Math.cos(2 * i) - 2 * Math.cos(3 * i) - Math.cos(4 * i)))
      ]);
    }

    // Create particles
    const numTrails = 32;
    const particlesPerTrail = 32;

    for (let i = 0; i < numTrails; i++) {
      const trail: Particle[] = [];
      for (let k = 0; k < particlesPerTrail; k++) {
        const particle: Particle = {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          X: 0,
          Y: 0,
          R: (1 - k / particlesPerTrail) + 1,
          S: Math.random() + 1,
          q: Math.floor(Math.random() * particlesPerTrail),
          D: i % 2 * 2 - 1,
          F: Math.random() * 0.2 + 0.7,
          f: `hsla(${i / numTrails * 80 + 280}, ${Math.random() * 40 + 60}%, ${Math.random() * 60 + 20}%, 0.1)`
        };
        trail.push(particle);
      }
      trails.push(trail);
    }

    // Animation loop
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      trails.forEach((trail) => {
        const headParticle = trail[0];
        const targetPoint = heartPoints[headParticle.q];

        if (targetPoint) {
          const dx = headParticle.x - targetPoint[0];
          const dy = headParticle.y - targetPoint[1];
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 10) {
            if (Math.random() > 0.95) {
              headParticle.q = Math.floor(Math.random() * particlesPerTrail);
            } else {
              if (Math.random() > 0.99) headParticle.D *= -1;
              headParticle.q += headParticle.D;
              headParticle.q %= particlesPerTrail;
              if (headParticle.q < 0) headParticle.q += particlesPerTrail;
            }
          }

          headParticle.X += -dx / distance * headParticle.S;
          headParticle.Y += -dy / distance * headParticle.S;
        }

        headParticle.x += headParticle.X;
        headParticle.y += headParticle.Y;

        // Draw head particle
        ctx.fillStyle = headParticle.f;
        ctx.beginPath();
        ctx.arc(headParticle.x, headParticle.y, headParticle.R, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();

        headParticle.X *= headParticle.F;
        headParticle.Y *= headParticle.F;

        // Draw trail particles
        for (let k = 1; k < trail.length; k++) {
          const particle = trail[k];
          const prevParticle = trail[k - 1];

          particle.x -= (particle.x - prevParticle.x) * 0.7;
          particle.y -= (particle.y - prevParticle.y) * 0.7;

          ctx.fillStyle = particle.f;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.R, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="heart-canvas" />;
};

export default HeartAnimation;
