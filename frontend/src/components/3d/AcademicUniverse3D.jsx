import React, { useRef, useEffect, useState } from "react";

const CAMPUS_NODES = [
  { name: "AAU", full: "Addis Ababa Univ", city: "Addis Ababa", color: "#0F7A52", phi: 0.6, theta: 0.8, size: 7 },
  { name: "ASTU", full: "Adama Science & Tech", city: "Adama", color: "#D99A00", phi: 1.4, theta: 2.1, size: 6.5 },
  { name: "Jimma", full: "Jimma University", city: "Jimma", color: "#2563EB", phi: 2.2, theta: 3.6, size: 6 },
  { name: "Hawassa", full: "Hawassa University", city: "Hawassa", color: "#059669", phi: 1.1, theta: 4.8, size: 6 },
  { name: "Bahir Dar", full: "Bahir Dar University", city: "Bahir Dar", color: "#7C3AED", phi: 2.7, theta: 1.2, size: 5.5 },
  { name: "Gondar", full: "University of Gondar", city: "Gondar", color: "#EA580C", phi: 0.9, theta: 5.4, size: 5.5 },
  { name: "AASTU", full: "Addis Ababa Sci & Tech", city: "Addis Ababa", color: "#0284C7", phi: 2.0, theta: 0.3, size: 6 },
  { name: "Haramaya", full: "Haramaya University", city: "Dire Dawa", color: "#16A34A", phi: 1.7, theta: 3.1, size: 5 },
];

export default function AcademicUniverse3D({ onSelectCampus }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId;
    let width = container.clientWidth || 480;
    let height = container.clientHeight || 480;

    const handleResize = () => {
      if (!container || !canvas) return;
      width = container.clientWidth || 480;
      height = container.clientHeight || 480;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const radius = Math.min(width, height) * 0.38;
    const centerX = width / 2;
    const centerY = height / 2;

    // Node objects with 3D sphere positions
    const nodes = CAMPUS_NODES.map((campus) => {
      const x = radius * Math.sin(campus.phi) * Math.cos(campus.theta);
      const y = radius * Math.cos(campus.phi);
      const z = radius * Math.sin(campus.phi) * Math.sin(campus.theta);
      return {
        ...campus,
        baseX: x,
        baseY: y,
        baseZ: z,
      };
    });

    // Ambient stars / particle constellation
    const starCount = 38;
    const stars = [];
    for (let i = 0; i < starCount; i++) {
      const sRadius = radius * (0.4 + Math.random() * 0.9);
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      stars.push({
        baseX: sRadius * Math.sin(phi) * Math.cos(theta),
        baseY: sRadius * Math.sin(phi) * Math.sin(theta),
        baseZ: sRadius * Math.cos(phi),
        size: Math.random() * 1.8 + 1,
        color: Math.random() > 0.4 ? "#0F7A52" : "#D99A00",
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    let rotX = 0.25;
    let rotY = 0;
    let targetRotX = 0.25;
    let targetRotY = 0;
    let time = 0;

    let projectedNodes = [];

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const normX = mouseX / rect.width - 0.5;
      const normY = mouseY / rect.height - 0.5;

      targetRotY = normX * 1.4;
      targetRotX = normY * 1.2;

      // Check hover on nodes
      let found = null;
      for (const p of projectedNodes) {
        if (p.z > -radius * 0.4) {
          const dx = mouseX - p.x2d;
          const dy = mouseY - p.y2d;
          if (Math.sqrt(dx * dx + dy * dy) < (p.renderedSize + 12)) {
            found = p;
            break;
          }
        }
      }
      setHoveredNode(found);
    };

    const handleClick = () => {
      if (hoveredNode && onSelectCampus) {
        onSelectCampus(hoveredNode);
      }
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    const render = () => {
      time += 0.015;

      rotY += (targetRotY - rotY) * 0.05 + 0.007; // Natural gentle spin
      rotX += (targetRotX - rotX) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      // Core pulsating radial glow
      const corePulse = 0.65 + Math.sin(time * 2.5) * 0.15;
      const coreGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        10,
        centerX,
        centerY,
        radius * 1.1
      );
      coreGrad.addColorStop(0, `rgba(15, 122, 82, ${corePulse * 0.35})`);
      coreGrad.addColorStop(0.45, `rgba(217, 154, 0, ${corePulse * 0.15})`);
      coreGrad.addColorStop(0.85, `rgba(37, 99, 235, ${corePulse * 0.06})`);
      coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Draw 3D gyroscopic orbital rings
      const drawRing = (r, tiltX, tiltY, strokeColor, lineWidth = 1.2, dash = []) => {
        ctx.save();
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = strokeColor;
        if (dash.length) ctx.setLineDash(dash);

        ctx.beginPath();
        const steps = 64;
        let started = false;
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          const rx = r * Math.cos(angle);
          const rz = r * Math.sin(angle);
          const ry = 0;

          // Apply rotation
          const x1 = rx * Math.cos(tiltY) - rz * Math.sin(tiltY);
          const z1 = rz * Math.cos(tiltY) + rx * Math.sin(tiltY);

          const y2 = ry * Math.cos(tiltX) - z1 * Math.sin(tiltX);
          const z2 = z1 * Math.cos(tiltX) + ry * Math.sin(tiltX);

          const fov = 350;
          const scale = fov / (fov + z2);
          const x2d = centerX + x1 * scale;
          const y2d = centerY + y2 * scale;

          if (!started) {
            ctx.moveTo(x2d, y2d);
            started = true;
          } else {
            ctx.lineTo(x2d, y2d);
          }
        }
        ctx.stroke();
        ctx.restore();
      };

      // Equatorial & inclined rings
      drawRing(radius * 1.15, rotX + 0.3, rotY + time * 0.2, "rgba(15, 122, 82, 0.4)", 1.4);
      drawRing(radius * 0.95, -rotX * 0.8 + 0.6, -rotY * 0.9 + time * 0.35, "rgba(217, 154, 0, 0.35)", 1.2, [6, 6]);
      drawRing(radius * 1.3, rotX * 0.5 - 0.4, rotY * 0.7 - time * 0.15, "rgba(37, 99, 235, 0.25)", 1);

      // Project ambient stars
      stars.forEach((star) => {
        let x1 = star.baseX * cosY - star.baseZ * sinY;
        let z1 = star.baseZ * cosY + star.baseX * sinY;
        let y1 = star.baseY * cosX - z1 * sinX;
        let z2 = z1 * cosX + star.baseY * sinX;

        const fov = 350;
        const scale = fov / (fov + z2);
        const x2d = centerX + x1 * scale;
        const y2d = centerY + y1 * scale;
        const alpha = Math.max(0.1, (z2 + radius) / (2 * radius)) * star.alpha;

        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x2d, y2d, star.size * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Project university nodes
      const projected = nodes.map((node) => {
        let x1 = node.baseX * cosY - node.baseZ * sinY;
        let z1 = node.baseZ * cosY + node.baseX * sinY;
        let y1 = node.baseY * cosX - z1 * sinX;
        let z2 = z1 * cosX + node.baseY * sinX;

        // Subtle floating wave
        const floatWave = Math.sin(time * 2 + node.phi * 3) * 3;
        y1 += floatWave;

        const fov = 350;
        const scale = fov / (fov + z2);
        const x2d = centerX + x1 * scale;
        const y2d = centerY + y1 * scale;
        const depthAlpha = Math.max(0.25, Math.min(1, (z2 + radius * 0.8) / (radius * 1.6)));

        return {
          ...node,
          x2d,
          y2d,
          z: z2,
          scale,
          depthAlpha,
          renderedSize: node.size * scale * (hoveredNode?.name === node.name ? 1.4 : 1),
        };
      });

      projected.sort((a, b) => a.z - b.z);
      projectedNodes = projected;

      // Draw constellation connections between close nodes
      ctx.lineWidth = 1;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const n1 = projected[i];
          const n2 = projected[j];
          const dx = n1.x2d - n2.x2d;
          const dy = n1.y2d - n2.y2d;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < radius * 0.9) {
            const lineAlpha = (1 - dist / (radius * 0.9)) * 0.28 * Math.min(n1.depthAlpha, n2.depthAlpha);
            ctx.strokeStyle = `rgba(15, 122, 82, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(n1.x2d, n1.y2d);
            ctx.lineTo(n2.x2d, n2.y2d);
            ctx.stroke();
          }
        }
      }

      // Draw lines connecting nodes to the center core
      projected.forEach((node) => {
        if (node.z > 0) {
          ctx.strokeStyle = `rgba(217, 154, 0, ${node.depthAlpha * 0.15})`;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(node.x2d, node.y2d);
          ctx.stroke();
        }
      });

      // Draw Central Knowledge Orb
      const centerPulse = 18 + Math.sin(time * 3) * 2;
      const centerGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        2,
        centerX,
        centerY,
        centerPulse
      );
      centerGrad.addColorStop(0, "#FFFFFF");
      centerGrad.addColorStop(0.3, "#0F7A52");
      centerGrad.addColorStop(0.8, "#0A5C3E");
      centerGrad.addColorStop(1, "rgba(10, 92, 62, 0)");

      ctx.fillStyle = centerGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, centerPulse * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw nodes and badges
      projected.forEach((node) => {
        const isHovered = hoveredNode?.name === node.name;

        // Outer glow
        const glowRadius = node.renderedSize * (isHovered ? 3.5 : 2.2);
        const nodeGlow = ctx.createRadialGradient(
          node.x2d,
          node.y2d,
          node.renderedSize * 0.5,
          node.x2d,
          node.y2d,
          glowRadius
        );
        nodeGlow.addColorStop(0, `${node.color}${Math.floor(node.depthAlpha * 220).toString(16).padStart(2, "0")}`);
        nodeGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = nodeGlow;
        ctx.beginPath();
        ctx.arc(node.x2d, node.y2d, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Node core
        ctx.fillStyle = isHovered ? "#FFFFFF" : node.color;
        ctx.beginPath();
        ctx.arc(node.x2d, node.y2d, node.renderedSize, 0, Math.PI * 2);
        ctx.fill();

        // Node outline
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.globalAlpha = node.depthAlpha;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Label pill (render if node is towards foreground or hovered)
        if (node.z > -radius * 0.3 || isHovered) {
          const fontSize = Math.max(10, Math.min(13, 11 * node.scale));
          ctx.font = `600 ${fontSize}px Inter, sans-serif`;
          const textWidth = ctx.measureText(node.name).width;
          const pillPaddingX = 6;
          const pillHeight = fontSize + 6;
          const pillX = node.x2d - textWidth / 2 - pillPaddingX;
          const pillY = node.y2d + node.renderedSize + 4;

          // Pill background
          ctx.fillStyle = isHovered
            ? "rgba(15, 122, 82, 0.95)"
            : `rgba(23, 33, 58, ${node.depthAlpha * 0.85})`;
          ctx.beginPath();
          ctx.roundRect
            ? ctx.roundRect(pillX, pillY, textWidth + pillPaddingX * 2, pillHeight, 6)
            : ctx.rect(pillX, pillY, textWidth + pillPaddingX * 2, pillHeight);
          ctx.fill();

          // Pill border
          ctx.strokeStyle = isHovered ? "#D99A00" : `rgba(255, 255, 255, ${node.depthAlpha * 0.25})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // Pill text
          ctx.fillStyle = "#FFFFFF";
          ctx.fillText(node.name, node.x2d - textWidth / 2, pillY + fontSize);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [hoveredNode, onSelectCampus]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[420px] sm:h-[480px] lg:h-[540px] flex items-center justify-center select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        title="Interactive 3D Ethiopian Academic Universe — Move mouse to explore campuses"
      />

      {/* Floating active campus tooltip / card */}
      {hoveredNode && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-2xl border border-highland/40 bg-surface/95 px-4 py-2.5 shadow-2xl backdrop-blur-md animate-fade-in-up dark:bg-dark-surface/95 dark:border-highland/50">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-xs shadow-md"
            style={{ backgroundColor: hoveredNode.color }}
          >
            {hoveredNode.name}
          </div>
          <div className="text-left">
            <p className="font-semibold text-xs text-ink dark:text-white leading-tight">
              {hoveredNode.full}
            </p>
            <p className="text-[11px] text-muted dark:text-dark-muted flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-highland" />
              {hoveredNode.city} • Verified Campus Portal
            </p>
          </div>
        </div>
      )}

      {/* Hint badge at top */}
      <div className="pointer-events-none absolute top-3 right-3 rounded-full border border-line/80 bg-white/70 px-2.5 py-1 text-[10px] font-medium text-muted backdrop-blur-sm dark:border-dark-border dark:bg-dark-surface/70 dark:text-dark-muted flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-highland animate-ping" />
        Interactive 3D Campus Universe
      </div>
    </div>
  );
}
