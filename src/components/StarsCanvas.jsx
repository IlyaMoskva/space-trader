import { useState, useEffect, useRef } from 'react';

function StarsCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(), y: Math.random(),
      z: Math.random() * 2 + 0.2,
      speed: Math.random() * 0.0002 + 0.00005,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.x -= s.speed;
        if (s.x < 0) { s.x = 1; s.y = Math.random(); }
        const size = s.z * 0.8;
        const alpha = Math.min(1, s.z * 0.5);
        ctx.fillStyle = `rgba(180,180,255,${alpha})`;
        ctx.fillRect(Math.floor(s.x * canvas.width), Math.floor(s.y * canvas.height), Math.ceil(size), Math.ceil(size));
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="stars-canvas" />;
}


export default StarsCanvas;
