import React, { useRef, useEffect } from "react";

export default function AIOrb3D({ isTyping = false, size = 180 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;

    // Particle nodes for the 3D-projected sphere
    const nodeCount = 42;
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;
      nodes.push({
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi),
        baseX: radius * Math.cos(theta) * Math.sin(phi),
        baseY: radius * Math.sin(theta) * Math.sin(phi),
        baseZ: radius * Math.cos(phi),
        size: Math.random() * 2 + 1.5,
      });
    }

    // Outer orbital rings
    let rotX = 0.3;
    let rotY = 0;
    let rotZ = 0;

    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0.3;
    let targetRotY = 0;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRotY = x * 1.5;
      targetRotX = y * 1.5;
    };

    window.addEventListener("mousemove", handleMouseMove);

    let time = 0;

    const render = () => {
      time += isTyping ? 0.045 : 0.018;

      rotY += (targetRotY - rotY) * 0.05 + (isTyping ? 0.025 : 0.012);
      rotX += (targetRotX - rotX) * 0.05;
      rotZ = Math.sin(time * 0.5) * 0.2;

      ctx.clearRect(0, 0, size, size);

      // Core pulsating radial glow
      const glowPulse = isTyping
        ? 0.7 + Math.sin(time * 6) * 0.2
        : 0.5 + Math.sin(time * 2) * 0.1;

      const radialGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.1,
        centerX,
        centerY,
        radius * 1.3
      );
      radialGrad.addColorStop(0, `rgba(15, 122, 82, ${glowPulse * 0.45})`);
      radialGrad.addColorStop(0.5, `rgba(217, 154, 0, ${glowPulse * 0.2})`);
      radialGrad.addColorStop(1, "rgba(15, 122, 82, 0)");

      ctx.fillStyle = radialGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Project 3D nodes to 2D
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const projected = nodes.map((node) => {
        // Y rotation
        let x1 = node.baseX * cosY - node.baseZ * sinY;
        let z1 = node.baseZ * cosY + node.baseX * sinY;
        // X rotation
        let y1 = node.baseY * cosX - z1 * sinX;
        let z2 = z1 * cosX + node.baseY * sinX;

        // Subtle wave pulse
        const wave = Math.sin(time * 3 + x1 * 0.05) * (isTyping ? 5 : 2);
        x1 += wave;
        y1 += wave;

        const fov = 200;
        const scale = fov / (fov + z2);
        const x2d = centerX + x1 * scale;
        const y2d = centerY + y1 * scale;
        const alpha = Math.max(0.15, Math.min(1, (z2 + radius) / (2 * radius)));

        return { x2d, y2d, z: z2, scale, alpha, size: node.size * scale };
      });

      // Sort by depth
      projected.sort((a, b) => a.z - b.z);

      // Draw constellation connection lines
      ctx.lineWidth = 0.8;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x2d - projected[j].x2d;
          const dy = projected[i].y2d - projected[j].y2d;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < radius * 0.6) {
            const lineAlpha = (1 - dist / (radius * 0.6)) * 0.25 * projected[i].alpha;
            ctx.strokeStyle = `rgba(15, 122, 82, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].x2d, projected[i].y2d);
            ctx.lineTo(projected[j].x2d, projected[j].y2d);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const p of projected) {
        ctx.beginPath();
        ctx.arc(p.x2d, p.y2d, Math.max(1, p.size), 0, Math.PI * 2);
        // Emerald with occasional gold accent
        if (p.z > 0 && Math.random() > 0.6) {
          ctx.fillStyle = `rgba(217, 154, 0, ${p.alpha * 0.9})`;
        } else {
          ctx.fillStyle = `rgba(15, 122, 82, ${p.alpha * 0.9})`;
        }
        ctx.shadowColor = "rgba(15, 122, 82, 0.6)";
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw outer rotating gyroscopic rings
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `rgba(15, 122, 82, ${isTyping ? 0.6 : 0.35})`;
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        radius * 1.15,
        radius * 0.45,
        rotY * 0.8 + time * 0.3,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      ctx.strokeStyle = `rgba(217, 154, 0, ${isTyping ? 0.5 : 0.25})`;
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY,
        radius * 1.25,
        radius * 0.38,
        -rotX * 0.6 - time * 0.4,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isTyping, size]);

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="cursor-pointer transition-transform duration-300 hover:scale-105"
      />
    </div>
  );
}
