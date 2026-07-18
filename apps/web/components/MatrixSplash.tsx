'use client';

import { useEffect, useRef, useState } from 'react';

export default function MatrixSplash() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Only show once per session to avoid annoying the user on every navigation
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      setVisible(false);
      return;
    }
    sessionStorage.setItem('hasSeenSplash', 'true');

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix characters: Binary
    const chars = '01';
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize) + 1;
    const drops: number[] = Array(columns).fill(1);

    // Drawing function
    const draw = () => {
      // Black background with slight opacity to create fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Green text for the matrix rain
      ctx.fillStyle = '#22c55e'; // Tailwind green-500
      ctx.font = `${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random binary char
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        
        // Draw the character
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset drop to top randomly
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        // Move drop down
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33); // ~30fps

    // Start fading out at 3.5s
    const fadeOutTimer = setTimeout(() => {
      setFading(true);
    }, 3500);

    // Completely hide and unmount at 4s
    const unmountTimer = setTimeout(() => {
      setVisible(false);
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    }, 4000);

    return () => {
      clearInterval(interval);
      clearTimeout(fadeOutTimer);
      clearTimeout(unmountTimer);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-500 pointer-events-none ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
