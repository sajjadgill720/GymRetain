'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Warning,
  Eye,
  CheckCircle,
  Clock,
  Sparkle,
  ArrowsClockwise,
  Table,
  Planet,
  ShieldAlert,
} from '@/components/icons';

export type RadarSegment = 'ALL' | 'URGENT' | 'SLIPPING' | 'HABIT_DISRUPTED' | 'HEALTHY';

interface Retention3DRadarProps {
  activeSegment: RadarSegment;
  onSelectSegment: (segment: RadarSegment) => void;
  urgentCount: number;
  slippingCount: number;
  habitDisruptedCount: number;
  healthyCount: number;
  urgentRevenueAtRisk: number;
  slippingRevenueAtRisk: number;
}

interface RadarNode {
  id: string;
  name: string;
  code: string;
  segment: RadarSegment;
  x: number;
  y: number;
  z: number;
  baseRadius: number;
  angle: number;
  color: string;
  glowColor: string;
  label: string;
  riskScore: number;
}

export const Retention3DRadar: React.FC<Retention3DRadarProps> = ({
  activeSegment,
  onSelectSegment,
  urgentCount,
  slippingCount,
  habitDisruptedCount,
  healthyCount,
  urgentRevenueAtRisk,
  slippingRevenueAtRisk,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<'3D' | 'ACCESSIBLE'>('3D');
  const [hoveredNode, setHoveredNode] = useState<RadarNode | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [rotationAngle, setRotationAngle] = useState(0);

  // Generate 3D nodes based on real segments
  const nodes = useRef<RadarNode[]>([
    // Urgent Ring (Inner critical orbit, Red)
    { id: 'n-1', name: 'Ayesha Malik', code: 'GR-1002', segment: 'URGENT', x: 0, y: 0, z: 0, baseRadius: 65, angle: 0.4, color: '#EF4444', glowColor: 'rgba(239, 68, 68, 0.7)', label: '16d absent · -100% routine', riskScore: 88 },
    { id: 'n-2', name: 'Omer Farooq', code: 'GR-1007', segment: 'URGENT', x: 0, y: 0, z: 0, baseRadius: 72, angle: 1.8, color: '#EF4444', glowColor: 'rgba(239, 68, 68, 0.7)', label: '12d absent · Routine broken', riskScore: 78 },
    { id: 'n-3', name: 'Hamza Tariq', code: 'GR-1009', segment: 'URGENT', x: 0, y: 0, z: 0, baseRadius: 68, angle: 3.4, color: '#EF4444', glowColor: 'rgba(239, 68, 68, 0.7)', label: 'Overdue 12d · 9d absent', riskScore: 72 },
    { id: 'n-4', name: 'Zainab Bibi', code: 'GR-1011', segment: 'URGENT', x: 0, y: 0, z: 0, baseRadius: 75, angle: 5.1, color: '#EF4444', glowColor: 'rgba(239, 68, 68, 0.7)', label: '14d absent · No check-ins', riskScore: 74 },

    // Slipping Ring (Middle orbit, Amber)
    { id: 'n-5', name: 'Sana Tariq', code: 'GR-1008', segment: 'SLIPPING', x: 0, y: 0, z: 0, baseRadius: 110, angle: 0.9, color: '#F59E0B', glowColor: 'rgba(245, 158, 11, 0.7)', label: '10d absent · Down 68%', riskScore: 68 },
    { id: 'n-6', name: 'Mustafa Khan', code: 'GR-1012', segment: 'SLIPPING', x: 0, y: 0, z: 0, baseRadius: 115, angle: 2.5, color: '#F59E0B', glowColor: 'rgba(245, 158, 11, 0.7)', label: '8d absent · Down 50%', riskScore: 54 },
    { id: 'n-7', name: 'Hassan Raza', code: 'GR-1014', segment: 'SLIPPING', x: 0, y: 0, z: 0, baseRadius: 112, angle: 4.2, color: '#F59E0B', glowColor: 'rgba(245, 158, 11, 0.7)', label: '7d absent · Dropped routine', riskScore: 48 },

    // Habit Disrupted Ring (Violet/Purple)
    { id: 'n-8', name: 'Mariam Noor', code: 'GR-1015', segment: 'HABIT_DISRUPTED', x: 0, y: 0, z: 0, baseRadius: 155, angle: 1.4, color: '#A855F7', glowColor: 'rgba(168, 85, 247, 0.7)', label: 'Missed usual Mon/Wed 7pm', riskScore: 45 },
    { id: 'n-9', name: 'Danyal Shah', code: 'GR-1016', segment: 'HABIT_DISRUPTED', x: 0, y: 0, z: 0, baseRadius: 160, angle: 3.8, color: '#A855F7', glowColor: 'rgba(168, 85, 247, 0.7)', label: 'Streak broken at 14 days', riskScore: 42 },

    // Healthy Outer Orbit (Cyan)
    { id: 'n-10', name: 'Hamza Sheikh', code: 'GR-1001', segment: 'HEALTHY', x: 0, y: 0, z: 0, baseRadius: 195, angle: 0.2, color: '#00F2FE', glowColor: 'rgba(0, 242, 254, 0.7)', label: '12d unbroken streak', riskScore: 12 },
    { id: 'n-11', name: 'Bilal Ahmed', code: 'GR-1005', segment: 'HEALTHY', x: 0, y: 0, z: 0, baseRadius: 200, angle: 2.1, color: '#00F2FE', glowColor: 'rgba(0, 242, 254, 0.7)', label: '4.5 visits/wk · On Track', riskScore: 10 },
    { id: 'n-12', name: 'Fatima Zahra', code: 'GR-1004', segment: 'HEALTHY', x: 0, y: 0, z: 0, baseRadius: 198, angle: 4.8, color: '#00F2FE', glowColor: 'rgba(0, 242, 254, 0.7)', label: 'Consistent routine', riskScore: 14 },
  ]).current;

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (media.matches) {
        setIsRotating(false);
      }
    }
  }, []);

  // 60FPS 3D Canvas Rendering Loop
  useEffect(() => {
    if (viewMode !== '3D') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let localAngle = rotationAngle;

    const render = () => {
      if (isRotating) {
        localAngle += 0.006;
        setRotationAngle(localAngle);
      }

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Camera elevation tilt
      const tilt = 0.55; // 3D isometric angle
      const fov = 350;

      // 1. Draw 3D Radial Depth Grid Rings
      const rings = [
        { r: 70, stroke: 'rgba(239, 68, 68, 0.25)', dash: [4, 4], label: 'CRITICAL ZONE (<70% DROP)' },
        { r: 115, stroke: 'rgba(245, 158, 11, 0.22)', dash: [6, 4], label: 'SLIPPING ZONE' },
        { r: 160, stroke: 'rgba(168, 85, 247, 0.2)', dash: [8, 4], label: 'HABIT DISRUPTION' },
        { r: 200, stroke: 'rgba(0, 242, 254, 0.25)', dash: [], label: 'HEALTHY RETENTION BASELINE' },
      ];

      rings.forEach((ring) => {
        ctx.save();
        ctx.beginPath();
        // 3D Isometric Ellipse projection
        ctx.ellipse(centerX, centerY, ring.r, ring.r * tilt, 0, 0, Math.PI * 2);
        ctx.strokeStyle = ring.stroke;
        ctx.lineWidth = 1.2;
        if (ring.dash.length > 0) ctx.setLineDash(ring.dash);
        ctx.stroke();
        ctx.restore();
      });

      // 2. Draw Radar Sweep Line
      ctx.save();
      const sweepX = centerX + Math.cos(localAngle * 1.5) * 205;
      const sweepY = centerY + Math.sin(localAngle * 1.5) * 205 * tilt;
      const gradient = ctx.createLinearGradient(centerX, centerY, sweepX, sweepY);
      gradient.addColorStop(0, 'rgba(0, 242, 254, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 242, 254, 0.0)');
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(sweepX, sweepY);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // 3. Project and Sort Nodes by 3D Depth (Z-sorting)
      const projected = nodes.map((node) => {
        const curAngle = node.angle + localAngle;
        const x3d = Math.cos(curAngle) * node.baseRadius;
        const z3d = Math.sin(curAngle) * node.baseRadius;
        const y3d = 0;

        // 3D Perspective Projection
        const scale = fov / (fov + z3d);
        const screenX = centerX + x3d * scale;
        const screenY = centerY + (z3d * tilt + y3d) * scale;

        return {
          node,
          x: screenX,
          y: screenY,
          scale,
          z3d,
        };
      });

      // Sort from back to front
      projected.sort((a, b) => b.z3d - a.z3d);

      // 4. Render Projected 3D Nodes
      projected.forEach(({ node, x, y, scale }) => {
        const isHovered = hoveredNode?.id === node.id;
        const isHighlighted = activeSegment === 'ALL' || activeSegment === node.segment;
        const radius = (isHovered ? 8 : 5.5) * scale;

        ctx.save();
        ctx.globalAlpha = isHighlighted ? 1 : 0.25;

        // Glowing outer halo
        const haloGrad = ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 2.8);
        haloGrad.addColorStop(0, node.glowColor);
        haloGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Node Core
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();

        // Label on hover or highlighted urgent
        if (isHovered || (node.segment === 'URGENT' && isHighlighted)) {
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillStyle = node.color;
          ctx.fillText(node.code, x + radius + 4, y + 3);
        }

        ctx.restore();
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [viewMode, isRotating, hoveredNode, activeSegment]);

  // Handle canvas mouse move for interactive node detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const tilt = 0.55;
    const fov = 350;

    let found: RadarNode | null = null;
    for (const node of nodes) {
      const curAngle = node.angle + rotationAngle;
      const x3d = Math.cos(curAngle) * node.baseRadius;
      const z3d = Math.sin(curAngle) * node.baseRadius;
      const scale = fov / (fov + z3d);
      const screenX = centerX + x3d * scale;
      const screenY = centerY + z3d * tilt * scale;

      const dist = Math.hypot(mouseX - screenX, mouseY - screenY);
      if (dist < 16) {
        found = node;
        break;
      }
    }
    setHoveredNode(found);
  };

  return (
    <div className="rounded-3xl glass-panel-elevated p-5 sm:p-6 border border-surface-border relative overflow-hidden transition-all duration-300">
      {/* Background radial atmosphere */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Interactive Segment Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-surface-border/80 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Planet className="w-5 h-5" weight="duotone" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-content-primary tracking-tight font-sans">
                  3D Spatial Retention Radar
                </h3>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  REAL-TIME ORBIT
                </span>
              </div>
              <p className="text-xs text-content-secondary">
                Spatial map of silent dropouts relative to personal baseline routines. Click any segment to filter members below.
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle & Pause / Resume */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <button
            onClick={() => setViewMode(viewMode === '3D' ? 'ACCESSIBLE' : '3D')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-surface border border-surface-border text-xs font-bold text-content-primary transition-all btn-shadow"
            title={viewMode === '3D' ? 'Switch to accessible table alternative' : 'Switch back to 3D radar'}
          >
            {viewMode === '3D' ? (
              <>
                <Table className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                <span>Accessible Table View</span>
              </>
            ) : (
              <>
                <Planet className="w-4 h-4 text-purple-600 dark:text-cyan-400" />
                <span>3D Spatial View</span>
              </>
            )}
          </button>

          {viewMode === '3D' && (
            <button
              onClick={() => setIsRotating(!isRotating)}
              className="p-2 rounded-xl bg-surface-subtle hover:bg-surface border border-surface-border text-content-secondary hover:text-content-primary transition-all btn-shadow"
              title={isRotating ? 'Pause radar orbit rotation' : 'Resume radar orbit rotation'}
            >
              <ArrowsClockwise className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Radar View / Accessible Table */}
      {viewMode === '3D' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 relative items-center">
          {/* 3D Canvas Viewport (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative min-h-[300px] sm:min-h-[340px]">
            <canvas
              ref={canvasRef}
              width={560}
              height={320}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredNode(null)}
              className="w-full max-w-[560px] h-[320px] cursor-crosshair drop-shadow-2xl"
              aria-label="3D Retention Radar showing concentric risk orbits"
            />

            {/* Hover Tooltip Overlay */}
            {hoveredNode && (
              <div className="absolute top-4 right-4 z-20 p-3 rounded-2xl glass-panel border border-cyan-500/30 text-xs shadow-2xl animate-in fade-in duration-150 max-w-[220px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-content-primary">{hoveredNode.name}</span>
                  <span
                    className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${hoveredNode.color}20`, color: hoveredNode.color }}
                  >
                    {hoveredNode.riskScore}% Risk
                  </span>
                </div>
                <div className="text-[10px] text-content-tertiary font-mono mb-1">{hoveredNode.code}</div>
                <p className="text-[11px] text-content-secondary font-medium leading-tight">
                  {hoveredNode.label}
                </p>
                <div className="mt-2 pt-1.5 border-t border-surface-border flex items-center justify-between text-[10px]">
                  <span className="text-content-tertiary">Orbit Segment:</span>
                  <span className="font-bold text-content-primary">{hoveredNode.segment}</span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Filtering Segments & Legend (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold text-content-tertiary uppercase tracking-wider mb-1">
              Filter Members by Orbit Segment
            </div>

            {/* Segment 1: Urgent High Risk */}
            <button
              onClick={() => onSelectSegment(activeSegment === 'URGENT' ? 'ALL' : 'URGENT')}
              className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-center justify-between border btn-shadow ${
                activeSegment === 'URGENT'
                  ? 'bg-red-500/15 border-red-500 text-content-primary glow-red'
                  : 'bg-surface hover:bg-surface-subtle border-surface-border text-content-secondary hover:text-content-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                    <span>Critical Churn Zone</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-600 dark:text-red-400 font-mono">
                      &gt;70% Risk
                    </span>
                  </div>
                  <p className="text-[10px] text-content-tertiary mt-0.5">
                    Absent &gt;10d or routine collapsed · Needs urgent intervention
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-sm font-extrabold text-red-600 dark:text-red-400 font-mono">
                  {urgentCount} Members
                </span>
                <span className="text-[10px] text-content-tertiary block">
                  ₨{urgentRevenueAtRisk.toLocaleString()} at risk
                </span>
              </div>
            </button>

            {/* Segment 2: Slipping Attention */}
            <button
              onClick={() => onSelectSegment(activeSegment === 'SLIPPING' ? 'ALL' : 'SLIPPING')}
              className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-center justify-between border btn-shadow ${
                activeSegment === 'SLIPPING'
                  ? 'bg-amber-500/15 border-amber-500 text-content-primary glow-amber'
                  : 'bg-surface hover:bg-surface-subtle border-surface-border text-content-secondary hover:text-content-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                    <span>Slipping Routine Ring</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono">
                      40-70% Risk
                    </span>
                  </div>
                  <p className="text-[10px] text-content-tertiary mt-0.5">
                    Weekly visits dropped &gt;50% · Nudge before disengagement
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                  {slippingCount} Members
                </span>
                <span className="text-[10px] text-content-tertiary block">
                  ₨{slippingRevenueAtRisk.toLocaleString()} at risk
                </span>
              </div>
            </button>

            {/* Segment 3: Habit Disrupted */}
            <button
              onClick={() => onSelectSegment(activeSegment === 'HABIT_DISRUPTED' ? 'ALL' : 'HABIT_DISRUPTED')}
              className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-center justify-between border btn-shadow ${
                activeSegment === 'HABIT_DISRUPTED'
                  ? 'bg-purple-500/15 border-purple-500 text-content-primary'
                  : 'bg-surface hover:bg-surface-subtle border-surface-border text-content-secondary hover:text-content-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-500 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-content-primary">
                    Habit Disruption Orbit
                  </div>
                  <p className="text-[10px] text-content-tertiary mt-0.5">
                    Missed customary training days or broken streak
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400 font-mono">
                  {habitDisruptedCount} Members
                </span>
                <span className="text-[10px] text-content-tertiary block">Habit alert</span>
              </div>
            </button>

            {/* Segment 4: Healthy Baseline */}
            <button
              onClick={() => onSelectSegment(activeSegment === 'HEALTHY' ? 'ALL' : 'HEALTHY')}
              className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-center justify-between border btn-shadow ${
                activeSegment === 'HEALTHY'
                  ? 'bg-cyan-500/15 border-cyan-500 text-content-primary glow-cyan'
                  : 'bg-surface hover:bg-surface-subtle border-surface-border text-content-secondary hover:text-content-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-content-primary">
                    Retained Baseline
                  </div>
                  <p className="text-[10px] text-content-tertiary mt-0.5">
                    Consistent workout routine · Unbroken habits
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-sm font-extrabold text-emerald-600 dark:text-cyan-400 font-mono">
                  {healthyCount} Members
                </span>
                <span className="text-[10px] text-content-tertiary block">Low churn risk</span>
              </div>
            </button>

            {/* Reset / All */}
            {activeSegment !== 'ALL' && (
              <button
                onClick={() => onSelectSegment('ALL')}
                className="w-full py-2 text-center text-xs font-bold text-purple-600 dark:text-cyan-400 hover:underline"
              >
                ← Reset to Show All Disengaging Members
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Accessible High-Contrast Alternative View */
        <div className="my-4 overflow-x-auto">
          <table className="w-full text-left text-xs" aria-label="Accessible Retention Segments Table">
            <thead>
              <tr className="border-b border-surface-border text-content-tertiary uppercase text-[10px] font-bold">
                <th className="py-2.5 px-3">Segment Name</th>
                <th className="py-2.5 px-3">Risk Criteria</th>
                <th className="py-2.5 px-3">Member Count</th>
                <th className="py-2.5 px-3">Revenue Impact</th>
                <th className="py-2.5 px-3 text-right">Filter Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/60">
              <tr className="hover:bg-surface-subtle/50">
                <td className="py-3 px-3 font-bold text-red-600 dark:text-red-400">
                  Critical Churn Zone
                </td>
                <td className="py-3 px-3 text-content-secondary">
                  Absent &gt;10 days, severe frequency collapse (&gt;70% risk)
                </td>
                <td className="py-3 px-3 font-mono font-bold">{urgentCount}</td>
                <td className="py-3 px-3 font-mono text-red-600 dark:text-red-400 font-bold">
                  ₨{urgentRevenueAtRisk.toLocaleString()}/mo
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => onSelectSegment('URGENT')}
                    className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold text-xs btn-shadow"
                  >
                    View Urgent
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-surface-subtle/50">
                <td className="py-3 px-3 font-bold text-amber-600 dark:text-amber-400">
                  Slipping Routine Ring
                </td>
                <td className="py-3 px-3 text-content-secondary">
                  Absence 4-7 days, weekly visits halved (40-70% risk)
                </td>
                <td className="py-3 px-3 font-mono font-bold">{slippingCount}</td>
                <td className="py-3 px-3 font-mono text-amber-600 dark:text-amber-400 font-bold">
                  ₨{slippingRevenueAtRisk.toLocaleString()}/mo
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => onSelectSegment('SLIPPING')}
                    className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold text-xs btn-shadow"
                  >
                    View Slipping
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-surface-subtle/50">
                <td className="py-3 px-3 font-bold text-purple-600 dark:text-purple-400">
                  Habit Disruption Orbit
                </td>
                <td className="py-3 px-3 text-content-secondary">
                  Missed customary workout days, streak broken
                </td>
                <td className="py-3 px-3 font-mono font-bold">{habitDisruptedCount}</td>
                <td className="py-3 px-3 font-mono text-content-secondary font-bold">
                  Pre-churn risk
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => onSelectSegment('HABIT_DISRUPTED')}
                    className="px-3 py-1 rounded-lg bg-purple-600 text-white font-bold text-xs btn-shadow"
                  >
                    View Disrupted
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-surface-subtle/50">
                <td className="py-3 px-3 font-bold text-emerald-600 dark:text-cyan-400">
                  Retained Baseline
                </td>
                <td className="py-3 px-3 text-content-secondary">
                  Attending regularly according to routine (&lt;40% risk)
                </td>
                <td className="py-3 px-3 font-mono font-bold">{healthyCount}</td>
                <td className="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Protected
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => onSelectSegment('HEALTHY')}
                    className="px-3 py-1 rounded-lg bg-surface-subtle border border-surface-border text-content-primary font-bold text-xs btn-shadow"
                  >
                    View Retained
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
