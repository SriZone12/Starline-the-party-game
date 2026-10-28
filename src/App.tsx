import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Player, GameSettings, GameNode, DrawnStroke, GameStateMode, Point, DareItem } from './types/game';
import { SetupLobby, PRESET_COLORS } from './components/SetupLobby';
import { GameCanvas } from './components/GameCanvas';
import { TurnHeader } from './components/TurnHeader';
import { DareModal } from './components/DareModal';
import { CelebrationModal } from './components/CelebrationModal';
import { DareEditorModal } from './components/DareEditorModal';
import { RulesModal } from './components/RulesModal';
import { ExitConfirmModal } from './components/ExitConfirmModal';
import { generateRandomNodes } from './utils/geometry';
import { loadSavedCustomDares, saveCustomDares, pickRandomDare } from './utils/dares';
import { soundEngine } from './utils/audio';
import { Sparkles, Home } from 'lucide-react';

interface CompletedDareRecord {
  id: string;
  playerId: string;
  dareText: string;
  fromNode: number;
  toNode: number;
  timestamp: number;
}

const INITIAL_PLAYERS: Player[] = [
  { id: 'p1', name: 'Player 1', color: PRESET_COLORS[0].color, glowColor: PRESET_COLORS[0].glow },
  { id: 'p2', name: 'Player 2', color: PRESET_COLORS[1].color, glowColor: PRESET_COLORS[1].glow },
  { id: 'p3', name: 'Player 3', color: PRESET_COLORS[2].color, glowColor: PRESET_COLORS[2].glow }
];

export default function App() {
  const [gameState, setGameState] = useState<GameStateMode>('LOBBY');
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [settings, setSettings] = useState<GameSettings>({
    nodeCount: 16,
    nodeSize: 'medium',
    enabledCategories: {
      party: true,
      physical: true,
      social: true,
      custom: true
    },
    customDares: loadSavedCustomDares(),
    allowDareSwap: true,
    soundEnabled: true,
    vibrateEnabled: true
  });

  const [nodes, setNodes] = useState<GameNode[]>([]);
  const [completedStrokes, setCompletedStrokes] = useState<DrawnStroke[]>([]);
  const [completedDares, setCompletedDares] = useState<CompletedDareRecord[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<number>(1);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);

  // Active dare state when a line or star is hit
  const [pendingIntersection, setPendingIntersection] = useState<{
    point: Point;
    path: Point[];
    dare: DareItem;
  } | null>(null);

  // Modals
  const [isDareEditorOpen, setIsDareEditorOpen] = useState<boolean>(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isInspectingArt, setIsInspectingArt] = useState<boolean>(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState<boolean>(false);

  const activePlayer = players[activePlayerIndex % players.length];
  const nextPlayer = players[(activePlayerIndex + 1) % players.length];
  const targetNodeId = currentNodeId + 1;

  // Node radius in pixels based on screen size and setting
  const getNodeRadius = () => {
    const isMobile = (typeof window !== 'undefined' ? window.innerWidth : 1200) < 600;
    const base = isMobile ? 23 : 28;
    switch (settings.nodeSize) {
      case 'small': return base - 4;
      case 'large': return base + 5;
      case 'medium':
      default: return base;
    }
  };

  const prevDimensionsRef = useRef<{ w: number; h: number }>({
    w: typeof window !== 'undefined' ? window.innerWidth : 1200,
    h: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // Automatically rescale existing nodes and paths when screen orientation or dimensions change
  useEffect(() => {
    const handleViewportResize = () => {
      const newW = window.innerWidth;
      const newH = window.innerHeight;
      const oldW = prevDimensionsRef.current.w;
      const oldH = prevDimensionsRef.current.h;

      if (newW > 0 && newH > 0 && oldW > 0 && oldH > 0 && (newW !== oldW || newH !== oldH)) {
        const scaleX = newW / oldW;
        const scaleY = newH / oldH;

        setNodes(prev => prev.map(node => ({
          ...node,
          x: Math.max(30, Math.min(newW - 30, node.x * scaleX)),
          y: Math.max(75, Math.min(newH - 45, node.y * scaleY)),
        })));

        setCompletedStrokes(prev => prev.map(stroke => ({
          ...stroke,
          points: stroke.points.map(pt => ({
            x: Math.max(10, Math.min(newW - 10, pt.x * scaleX)),
            y: Math.max(60, Math.min(newH - 20, pt.y * scaleY))
          })),
          intersectionPoint: stroke.intersectionPoint ? {
            x: Math.max(10, Math.min(newW - 10, stroke.intersectionPoint.x * scaleX)),
            y: Math.max(60, Math.min(newH - 20, stroke.intersectionPoint.y * scaleY))
          } : undefined
        })));

        prevDimensionsRef.current = { w: newW, h: newH };
      }
    };

    window.addEventListener('resize', handleViewportResize);
    window.addEventListener('orientationchange', handleViewportResize);
    return () => {
      window.removeEventListener('resize', handleViewportResize);
      window.removeEventListener('orientationchange', handleViewportResize);
    };
  }, []);

  // Start new round
  const handleStartGame = useCallback(() => {
    const width = window.innerWidth || 1200;
    const height = window.innerHeight || 800;
    const radius = getNodeRadius();
    prevDimensionsRef.current = { w: width, h: height };

    const newNodes = generateRandomNodes(settings.nodeCount, width, height, radius);
    setNodes(newNodes);
    setCompletedStrokes([]);
    setCompletedDares([]);
    setCurrentNodeId(1);
    setActivePlayerIndex(0);
    setPendingIntersection(null);
    setIsInspectingArt(false);
    setGameState('PLAYING');
  }, [settings.nodeCount, settings.nodeSize]);

  // Handle successful stroke without intersection
  const handleStrokeCompleted = (stroke: DrawnStroke) => {
    setCompletedStrokes(prev => [...prev, stroke]);

    if (stroke.toNode >= settings.nodeCount) {
      // Completed all nodes!
      setGameState('COMPLETED');
    } else {
      setCurrentNodeId(stroke.toNode);
      setActivePlayerIndex(prev => (prev + 1) % players.length);
    }
  };

  // Handle line intersection detection - opens dare popup immediately
  const handleIntersectionTriggered = (intersectionPoint: Point, currentPath: Point[]) => {
    const dare = pickRandomDare(
      settings.enabledCategories,
      settings.customDares,
      pendingIntersection?.dare?.id
    );

    setPendingIntersection({
      point: intersectionPoint,
      path: currentPath,
      dare
    });

    setGameState('DARE_POPUP');
  };

  // When user chooses "Yes, Match Node N -> N+1" on the post-dare popup
  const handleConfirmMatchNodes = () => {
    if (!pendingIntersection) return;

    // Record the completed dare
    const dareRecord: CompletedDareRecord = {
      id: `dare_${Date.now()}`,
      playerId: activePlayer.id,
      dareText: pendingIntersection.dare.text,
      fromNode: currentNodeId,
      toNode: targetNodeId,
      timestamp: Date.now()
    };
    setCompletedDares(prev => [...prev, dareRecord]);

    // Connect the nodes together with the drawn stroke
    const targetNode = nodes.find(n => n.id === targetNodeId);
    let finalPoints = pendingIntersection.path;
    if (targetNode) {
      finalPoints = [...pendingIntersection.path, { x: targetNode.x, y: targetNode.y }];
    }

    const matchedStroke: DrawnStroke = {
      id: `stroke_matched_${currentNodeId}_${targetNodeId}_${Date.now()}`,
      fromNode: currentNodeId,
      toNode: targetNodeId,
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      playerColor: activePlayer.color,
      points: finalPoints,
      hadIntersection: true,
      intersectionPoint: pendingIntersection.point,
      dareText: pendingIntersection.dare.text,
      timestamp: Date.now()
    };

    setCompletedStrokes(prev => [...prev, matchedStroke]);
    soundEngine.playNodeConnect(targetNodeId, settings.nodeCount);
    setPendingIntersection(null);

    if (targetNodeId >= settings.nodeCount) {
      setGameState('COMPLETED');
    } else {
      setCurrentNodeId(targetNodeId);
      setActivePlayerIndex(prev => (prev + 1) % players.length);
      setGameState('PLAYING');
    }
  };

  // When user chooses "No, Try Weaving Again" or "No, Pass Device"
  const handleDeclineMatchNodes = (passTurnToNext: boolean) => {
    if (!pendingIntersection) return;

    // Record the completed dare
    const dareRecord: CompletedDareRecord = {
      id: `dare_${Date.now()}`,
      playerId: activePlayer.id,
      dareText: pendingIntersection.dare.text,
      fromNode: currentNodeId,
      toNode: targetNodeId,
      timestamp: Date.now()
    };
    setCompletedDares(prev => [...prev, dareRecord]);
    setPendingIntersection(null);

    // Target node is NOT connected - node remains at currentNodeId
    if (passTurnToNext) {
      setActivePlayerIndex(prev => (prev + 1) % players.length);
    }
    setGameState('PLAYING');
  };

  // Swap dare
  const handleSwapDare = () => {
    if (!pendingIntersection) return;
    const newDare = pickRandomDare(
      settings.enabledCategories,
      settings.customDares,
      pendingIntersection.dare.id
    );
    setPendingIntersection(prev => (prev ? { ...prev, dare: newDare } : null));
  };

  // Undo last stroke
  const handleUndoLastStroke = () => {
    if (completedStrokes.length === 0) return;
    const updated = [...completedStrokes];
    const popped = updated.pop();
    if (popped) {
      setCompletedStrokes(updated);
      setCurrentNodeId(popped.fromNode);
      setActivePlayerIndex(prev => (prev - 1 + players.length) % players.length);
    }
  };

  // Exit to Home Screen (Setup Lobby) after confirmation
  const handleExitToHome = () => {
    setIsExitConfirmOpen(false);
    setGameState('LOBBY');
    setCompletedStrokes([]);
    setCompletedDares([]);
    setCurrentNodeId(1);
    setPendingIntersection(null);
    setIsInspectingArt(false);
  };

  const handleRequestExitToHome = () => {
    setIsExitConfirmOpen(true);
  };

  // Save custom dares
  const handleSaveCustomDares = (dares: DareItem[]) => {
    saveCustomDares(dares);
    setSettings(prev => ({ ...prev, customDares: dares }));
  };

  // Per-player dare counts
  const playerDareCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    completedDares.forEach(d => {
      counts[d.playerId] = (counts[d.playerId] || 0) + 1;
    });
    return counts;
  }, [completedDares]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[var(--bg)] text-[var(--ink)] select-none font-sans">
      {/* 1. Pre-Game Setup Lobby */}
      {gameState === 'LOBBY' && (
        <SetupLobby
          players={players}
          onUpdatePlayers={setPlayers}
          settings={settings}
          onUpdateSettings={setSettings}
          onStartGame={handleStartGame}
          onOpenDareEditor={() => setIsDareEditorOpen(true)}
          onOpenRules={() => setIsRulesModalOpen(true)}
        />
      )}

      {/* 2. Active Play View (Canvas & Turn HUD) */}
      {(gameState === 'PLAYING' || gameState === 'DARE_POPUP' || gameState === 'COMPLETED') && (
        <div className="relative w-full h-full">
          {/* Top Pass-and-Play Turn HUD */}
          <TurnHeader
            activePlayer={activePlayer}
            currentNode={currentNodeId}
            targetNode={targetNodeId}
            totalNodes={settings.nodeCount}
            completedStrokesCount={completedStrokes.length}
            daresTriggeredCount={completedDares.length}
            soundEnabled={settings.soundEnabled}
            onToggleSound={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
            onUndoLastStroke={handleUndoLastStroke}
            canUndo={completedStrokes.length > 0 && gameState === 'PLAYING'}
            onExitToHome={handleRequestExitToHome}
            onOpenRules={() => setIsRulesModalOpen(true)}
          />

          {/* Interactive Game Canvas */}
          <GameCanvas
            nodes={nodes}
            completedStrokes={completedStrokes}
            activePlayer={activePlayer}
            currentNodeId={currentNodeId}
            targetNodeId={targetNodeId}
            totalNodes={settings.nodeCount}
            soundEnabled={settings.soundEnabled}
            vibrateEnabled={settings.vibrateEnabled}
            onStrokeCompleted={handleStrokeCompleted}
            onIntersectionTriggered={handleIntersectionTriggered}
            isPaused={gameState !== 'PLAYING'}
          />

          {/* Floating Inspect Art Back-to-Summary bar */}
          {gameState === 'COMPLETED' && isInspectingArt && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsInspectingArt(false)}
                className="btn btn-primary px-4 py-2.5 text-xs"
              >
                <Sparkles className="h-4 w-4" />
                <span>Show summary</span>
              </button>

              <button
                type="button"
                onClick={handleRequestExitToHome}
                className="btn btn-secondary px-3.5 py-2.5 text-xs"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Home</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Dare Modal (Triggered on Line Intersection) */}
      {gameState === 'DARE_POPUP' && pendingIntersection && (
        <DareModal
          player={activePlayer}
          nextPlayer={nextPlayer}
          dare={pendingIntersection.dare}
          fromNode={currentNodeId}
          toNode={targetNodeId}
          onConfirmMatchNodes={handleConfirmMatchNodes}
          onDeclineMatchNodes={handleDeclineMatchNodes}
          onSwapDare={handleSwapDare}
          allowSwap={settings.allowDareSwap}
        />
      )}

      {/* 4. Cooperative Constellation Complete Celebration */}
      {gameState === 'COMPLETED' && !isInspectingArt && (
        <CelebrationModal
          players={players}
          completedStrokes={completedStrokes}
          totalDaresCount={completedDares.length}
          playerDareCounts={playerDareCounts}
          totalNodes={settings.nodeCount}
          onPlayAgain={handleStartGame}
          onInspectArt={() => setIsInspectingArt(true)}
          onExitToHome={handleRequestExitToHome}
        />
      )}

      {/* 5. Custom Dare Editor Modal */}
      {isDareEditorOpen && (
        <DareEditorModal
          customDares={settings.customDares}
          onSaveCustomDares={handleSaveCustomDares}
          onClose={() => setIsDareEditorOpen(false)}
        />
      )}

      {/* 6. Rules & Tutorial Modal */}
      {isRulesModalOpen && (
        <RulesModal onClose={() => setIsRulesModalOpen(false)} />
      )}

      {/* 7. Exit Game Confirmation */}
      {isExitConfirmOpen && (
        <ExitConfirmModal
          onConfirm={handleExitToHome}
          onCancel={() => setIsExitConfirmOpen(false)}
        />
      )}
    </main>
  );
}
