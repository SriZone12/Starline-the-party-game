import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameNode, DrawnStroke, Player, Point } from '../types/game';
import {
  checkEntirePathIntersection,
  checkPathHitsOtherNodes,
  getDistance
} from '../utils/geometry';
import { soundEngine, triggerHaptic } from '../utils/audio';

interface GameCanvasProps {
  nodes: GameNode[];
  completedStrokes: DrawnStroke[];
  activePlayer: Player;
  currentNodeId: number;
  targetNodeId: number;
  totalNodes: number;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  onStrokeCompleted: (stroke: DrawnStroke) => void;
  onIntersectionTriggered: (intersectionPoint: Point, currentPath: Point[]) => void;
  isPaused: boolean;
}

interface CanvasPalette {
  background: string;
  speck: string;
  speckBright: string;
  nodeFill: string;
  nodeMutedLine: string;
  nodeText: string;
  nodeMuted: string;
  danger: string;
  target: string;
  coloredInk: string;
}

const CANVAS_PALETTE: CanvasPalette = {
  background: '#08041A',
  speck: 'rgba(255, 247, 234, 0.28)',
  speckBright: 'rgba(255, 95, 178, 0.72)',
  nodeFill: '#190D3C',
  nodeMutedLine: 'rgba(206, 195, 236, 0.38)',
  nodeText: '#FFF7EA',
  nodeMuted: '#B9ACDD',
  danger: '#FF6B8A',
  target: '#FFD166',
  coloredInk: '#140B23'
};

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace('#', '');
  const normalized = value.length === 3
    ? value.split('').map(char => char + char).join('')
    : value;
  const parsed = Number.parseInt(normalized, 16);
  if (Number.isNaN(parsed)) return `rgba(255, 247, 234, ${alpha})`;
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function tracePath(ctx: CanvasRenderingContext2D, points: Point[]) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
}

function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.24, y - size * 0.24);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size * 0.24, y + size * 0.24);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.24, y + size * 0.24);
  ctx.lineTo(x - size, y);
  ctx.lineTo(x - size * 0.24, y - size * 0.24);
  ctx.closePath();
  ctx.fill();
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  nodes,
  completedStrokes,
  activePlayer,
  currentNodeId,
  targetNodeId,
  totalNodes,
  soundEnabled,
  vibrateEnabled,
  onStrokeCompleted,
  onIntersectionTriggered,
  isPaused
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activePath, setActivePath] = useState<Point[]>([]);
  const activePathRef = useRef<Point[]>([]);
  const isDraggingRef = useRef<boolean>(false);
  const [dragFeedback, setDragFeedback] = useState<string | null>(null);
  const [dpr, setDpr] = useState<number>(1);

  const currentNode = nodes.find(n => n.id === currentNodeId);
  const targetNode = nodes.find(n => n.id === targetNodeId);
  const sourceTargetDistance =
    currentNode && targetNode ? getDistance(currentNode, targetNode) : 0;
  const targetSnapTolerance = targetNode
    ? Math.max(
        targetNode.radius * 1.2,
        Math.min(targetNode.radius * 1.7, sourceTargetDistance * 0.7)
      )
    : 0;

  const triggerNodeCollision = (path: Point[]) => {
    if (!currentNode || !targetNode) return false;

    const hit = checkPathHitsOtherNodes(
      path,
      nodes,
      currentNode.id,
      targetNode.id
    );

    if (!hit.hasHit || !hit.point) return false;

    isDraggingRef.current = false;
    activePathRef.current = [];
    setActivePath([]);

    soundEngine.playIntersectionBuzzer();
    if (vibrateEnabled) triggerHaptic('warning');

    onIntersectionTriggered(hit.point, path);
    return true;
  };

  useEffect(() => {
    soundEngine.enabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const deviceDpr = Math.min(window.devicePixelRatio || 1, 2.5);
      setDpr(deviceDpr);
      canvas.width = Math.floor(window.innerWidth * deviceDpr);
      canvas.height = Math.floor(window.innerHeight * deviceDpr);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    window.addEventListener('orientationchange', updateCanvasSize);
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      window.removeEventListener('orientationchange', updateCanvasSize);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPaused || !currentNode || !targetNode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const distToSource = getDistance({ x, y }, currentNode);
    const nearestOtherNode = nodes.reduce<GameNode | null>((nearest, node) => {
      if (node.id === currentNode.id) return nearest;
      if (!nearest) return node;
      return getDistance(node, currentNode) < getDistance(nearest, currentNode)
        ? node
        : nearest;
    }, null);
    const nearestClearance = nearestOtherNode
      ? Math.max(
          currentNode.radius * 1.15,
          getDistance(currentNode, nearestOtherNode) - nearestOtherNode.radius - 4
        )
      : currentNode.radius * 1.7;
    const touchTolerance = Math.min(
      currentNode.radius * 1.7,
      sourceTargetDistance * 0.6,
      nearestClearance
    );

    if (distToSource <= touchTolerance) {
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}

      isDraggingRef.current = true;

      const initialPoints: Point[] = [
        { x: currentNode.x, y: currentNode.y },
        { x, y }
      ];
      activePathRef.current = initialPoints;
      setActivePath(initialPoints);
      setDragFeedback(null);

      if (vibrateEnabled) triggerHaptic('light');
    } else {
      setDragFeedback(`Begin at star ${currentNodeId}`);
      setTimeout(() => setDragFeedback(null), 1800);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || isPaused || !currentNode || !targetNode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const currentPt: Point = { x, y };

    const currentPath = activePathRef.current;
    if (currentPath.length === 0) return;

    const lastPt = currentPath[currentPath.length - 1];
    const dist = getDistance(lastPt, currentPt);

    if (dist < 3) return;

    const updatedPath = [...currentPath, currentPt];
    activePathRef.current = updatedPath;

    if (triggerNodeCollision(updatedPath)) return;

    const intersection = checkEntirePathIntersection(
      updatedPath,
      completedStrokes,
      currentNode,
      targetNode
    );

    if (intersection.hasIntersection && intersection.point) {
      isDraggingRef.current = false;
      activePathRef.current = [];
      setActivePath([]);

      soundEngine.playIntersectionBuzzer();
      if (vibrateEnabled) triggerHaptic('warning');

      onIntersectionTriggered(intersection.point, updatedPath);
      return;
    }

    setActivePath(updatedPath);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !currentNode || !targetNode) {
      isDraggingRef.current = false;
      activePathRef.current = [];
      setActivePath([]);
      return;
    }

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const canvas = canvasRef.current;
    if (!canvas) {
      isDraggingRef.current = false;
      activePathRef.current = [];
      setActivePath([]);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const releasePt: Point = { x, y };

    const distToTarget = getDistance(releasePt, targetNode);

    if (distToTarget <= targetSnapTolerance) {
      const finalPoints = [
        ...activePathRef.current,
        { x: targetNode.x, y: targetNode.y }
      ];

      if (triggerNodeCollision(finalPoints)) return;

      const intersection = checkEntirePathIntersection(
        finalPoints,
        completedStrokes,
        currentNode,
        targetNode
      );

      if (intersection.hasIntersection && intersection.point) {
        isDraggingRef.current = false;
        activePathRef.current = [];
        setActivePath([]);

        soundEngine.playIntersectionBuzzer();
        if (vibrateEnabled) triggerHaptic('warning');

        onIntersectionTriggered(intersection.point, finalPoints);
        return;
      }

      const newStroke: DrawnStroke = {
        id: `stroke_${currentNode.id}_${targetNode.id}_${Date.now()}`,
        fromNode: currentNode.id,
        toNode: targetNode.id,
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        playerColor: activePlayer.color,
        points: finalPoints,
        hadIntersection: false,
        timestamp: Date.now()
      };

      soundEngine.playNodeConnect(targetNode.id, totalNodes);
      if (vibrateEnabled) triggerHaptic('success');
      onStrokeCompleted(newStroke);
    } else {
      setDragFeedback(`Reach star ${targetNode.id} to complete the line`);
      setTimeout(() => setDragFeedback(null), 1800);
    }

    isDraggingRef.current = false;
    activePathRef.current = [];
    setActivePath([]);
  };

  const handlePointerCancel = () => {
    isDraggingRef.current = false;
    activePathRef.current = [];
    setActivePath([]);
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = CANVAS_PALETTE.background;
    ctx.fillRect(0, 0, width, height);

    const pinkGlow = ctx.createRadialGradient(
      width * 0.08,
      -height * 0.1,
      0,
      width * 0.08,
      0,
      Math.max(width, height) * 0.78
    );
    pinkGlow.addColorStop(0, 'rgba(255, 95, 178, 0.18)');
    pinkGlow.addColorStop(0.55, 'rgba(255, 95, 178, 0.035)');
    pinkGlow.addColorStop(1, 'rgba(255, 95, 178, 0)');
    ctx.fillStyle = pinkGlow;
    ctx.fillRect(0, 0, width, height);

    const cyanGlow = ctx.createRadialGradient(
      width * 0.92,
      height * 0.04,
      0,
      width * 0.92,
      0,
      Math.max(width, height) * 0.68
    );
    cyanGlow.addColorStop(0, 'rgba(92, 225, 255, 0.16)');
    cyanGlow.addColorStop(0.5, 'rgba(92, 225, 255, 0.03)');
    cyanGlow.addColorStop(1, 'rgba(92, 225, 255, 0)');
    ctx.fillStyle = cyanGlow;
    ctx.fillRect(0, 0, width, height);

    const violetGlow = ctx.createRadialGradient(
      width * 0.5,
      height * 1.12,
      0,
      width * 0.5,
      height,
      Math.max(width, height) * 0.72
    );
    violetGlow.addColorStop(0, 'rgba(176, 140, 255, 0.18)');
    violetGlow.addColorStop(1, 'rgba(176, 140, 255, 0)');
    ctx.fillStyle = violetGlow;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 96; i++) {
      const sx = (i * 137.5 + 42 * 23) % width;
      const sy = (i * 219.3 + 42 * 47) % height;
      const size = i % 13 === 0 ? 2 : i % 7 === 0 ? 1.4 : i % 3 === 0 ? 1 : 0.65;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fillStyle =
        i % 19 === 0
          ? CANVAS_PALETTE.speckBright
          : i % 11 === 0
            ? 'rgba(92, 225, 255, 0.5)'
            : CANVAS_PALETTE.speck;
      ctx.fill();
    }

    [
      [0.13, 0.24, 6, 'rgba(255, 95, 178, 0.26)'],
      [0.86, 0.16, 5, 'rgba(255, 209, 102, 0.28)'],
      [0.73, 0.8, 5, 'rgba(92, 225, 255, 0.22)'],
      [0.24, 0.86, 6, 'rgba(176, 140, 255, 0.26)'],
      [0.51, 0.09, 4, 'rgba(255, 247, 234, 0.24)']
    ].forEach(([x, y, size, color]) => {
      ctx.fillStyle = color as string;
      drawSparkle(ctx, width * (x as number), height * (y as number), size as number);
    });

    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.2,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.78
    );
    vignette.addColorStop(0, 'rgba(2, 5, 11, 0)');
    vignette.addColorStop(1, 'rgba(3, 1, 12, 0.74)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    completedStrokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke.playerColor;
      ctx.shadowColor = stroke.playerColor;

      tracePath(ctx, stroke.points);
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 12;
      ctx.shadowBlur = 24;
      ctx.stroke();

      tracePath(ctx, stroke.points);
      ctx.globalAlpha = 0.92;
      ctx.lineWidth = 5.5;
      ctx.shadowBlur = 14;
      ctx.stroke();

      tracePath(ctx, stroke.points);
      ctx.globalAlpha = 0.72;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 247, 234, 0.92)';
      ctx.stroke();
      ctx.restore();

      if (stroke.hadIntersection && stroke.intersectionPoint) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          stroke.intersectionPoint.x,
          stroke.intersectionPoint.y,
          9,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 107, 138, 0.18)';
        ctx.shadowColor = CANVAS_PALETTE.danger;
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = CANVAS_PALETTE.danger;
        drawSparkle(ctx, stroke.intersectionPoint.x, stroke.intersectionPoint.y, 6);
        ctx.fillStyle = CANVAS_PALETTE.background;
        drawSparkle(ctx, stroke.intersectionPoint.x, stroke.intersectionPoint.y, 2.4);
        ctx.restore();
      }
    });

    if (activePath.length > 1) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = activePlayer.color;
      ctx.shadowColor = activePlayer.color;

      tracePath(ctx, activePath);
      ctx.globalAlpha = 0.24;
      ctx.lineWidth = 13;
      ctx.shadowBlur = 26;
      ctx.stroke();

      tracePath(ctx, activePath);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 5;
      ctx.shadowBlur = 16;
      ctx.stroke();

      tracePath(ctx, activePath);
      ctx.globalAlpha = 0.72;
      ctx.lineWidth = 1.4;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 247, 234, 0.92)';
      ctx.stroke();

      const head = activePath[activePath.length - 1];
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = activePlayer.color;
      ctx.fill();
      ctx.restore();
    }

    const time = Date.now() / 1000;

    nodes.forEach(node => {
      const isCompleted = node.id < currentNodeId;
      const isCurrent = node.id === currentNodeId;
      const isTarget = node.id === targetNodeId;
      const stroke = isCompleted
        ? completedStrokes.find(s => s.toNode === node.id)
        : undefined;
      const ringColor = stroke ? stroke.playerColor : CANVAS_PALETTE.nodeMutedLine;

      ctx.save();

      const ringScale = Math.min(1, node.radius / 23);
      const haloGap = Math.max(5, 15 * ringScale);
      const innerGap = Math.max(3, 8 * ringScale);
      const targetGap = Math.max(3, 9 * ringScale);

      if (isTarget) {
        const targetPulse = node.radius + targetGap + Math.sin(time * 2.4) * 2;
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.rotate(time * 0.5);
        ctx.beginPath();
        ctx.setLineDash([5, 6]);
        ctx.arc(0, 0, targetPulse, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + haloGap, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.16)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (isCurrent) {
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.rotate(-time * 0.8);
        ctx.beginPath();
        ctx.setLineDash([3, 7]);
        ctx.arc(0, 0, node.radius + innerGap, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(activePlayer.color, 0.75);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + haloGap, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(activePlayer.color, 0.2);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      const pulse = isCurrent ? 1 + Math.sin(time * 2.5) * 0.025 : 1;
      const radius = node.radius * pulse;

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

      if (isCurrent) {
        ctx.fillStyle = activePlayer.color;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowColor = activePlayer.color;
        ctx.shadowBlur = 30;
      } else if (isTarget) {
        ctx.fillStyle = CANVAS_PALETTE.target;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.shadowColor = 'rgba(255, 209, 102, 0.8)';
        ctx.shadowBlur = 30;
      } else if (isCompleted) {
        ctx.fillStyle = stroke ? hexToRgba(stroke.playerColor, 0.2) : CANVAS_PALETTE.nodeFill;
        ctx.strokeStyle = ringColor;
        ctx.shadowColor = ringColor;
        ctx.shadowBlur = 16;
      } else {
        ctx.fillStyle = CANVAS_PALETTE.nodeFill;
        ctx.strokeStyle = CANVAS_PALETTE.nodeMutedLine;
        ctx.shadowBlur = 0;
      }

      ctx.lineWidth = isCurrent || isTarget ? 3 : isCompleted ? 2.4 : 1.8;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const numberSize = Math.max(
        7,
        Math.round(node.radius * (node.id >= 100 ? 0.6 : node.id >= 10 ? 0.56 : 0.68))
      );
      ctx.font = `400 ${numberSize}px "Bungee", "Space Grotesk", system-ui, sans-serif`;

      if (isCurrent || isTarget) {
        ctx.fillStyle = CANVAS_PALETTE.coloredInk;
      } else if (isCompleted) {
        ctx.fillStyle = CANVAS_PALETTE.nodeText;
      } else {
        ctx.fillStyle = CANVAS_PALETTE.nodeMuted;
      }

      ctx.fillText(`${node.id}`, node.x, node.y + 0.5);
      ctx.restore();
    });
  }, [
    nodes,
    completedStrokes,
    activePath,
    activePlayer,
    currentNodeId,
    targetNodeId,
    dpr
  ]);

  useEffect(() => {
    let animId: number;
    const loop = () => {
      render();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [render]);

  return (
    <div
      className="relative h-full w-full touch-none select-none overflow-hidden bg-[var(--bg)]"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className="block h-full w-full cursor-crosshair touch-none"
      />

      {dragFeedback && (
        <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-xl border-2 border-[rgba(255,95,178,0.45)] bg-[rgba(30,16,67,0.96)] px-4 py-2.5 text-center text-xs font-bold text-[var(--ink)] shadow-[0_5px_0_rgba(2,0,10,0.45),0_20px_48px_-16px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <span className="h-2 w-2 shrink-0 rotate-45 rounded-[2px] bg-[var(--pink)] shadow-[0_0_12px_var(--pink)]" />
          {dragFeedback}
        </div>
      )}
    </div>
  );
};
