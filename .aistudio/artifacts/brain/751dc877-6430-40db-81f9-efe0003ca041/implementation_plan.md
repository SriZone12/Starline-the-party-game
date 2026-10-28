# Constellation Dares: Numbers & Lines Party Game

A tactile, collaborative same-device party game where players weave glowing lines between randomly scattered numbered nodes in ascending order, avoiding line intersections under the penalty of hilarious party dares.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following core mechanics and configurations are locked in based on your preferences:

- **Confirmed: Freehand Drag Path with Line Weaving**: Players drag their finger or stylus smoothly across the canvas from node $N$ to node $N+1$, allowing creative maneuvers around existing lines.
- **Confirmed: Turn-Based Pass & Play Rotation**: Players take turns sequentially on the same device. The active player is celebrated with their signature vibrant color theme, custom name, and avatar badge.
- **Confirmed: Dare Deck & Custom Dare Editor**: Pre-game configuration provides three built-in dare themes (Party Social, Silly Physical, Quick Wit) plus an interactive Custom Dare Editor to add, remove, or customize challenges.
- **Confirmed: Purely Collaborative Gameplay**: No eliminations, winners, or losers. The collective mission is to complete the entire constellation together, culminating in a celebratory finale showcase.

---

## 1. Overview & Core Concept

- **What It Does**: Before starting, players configure the round (number of players 2–8 with names and colors, number of nodes from 8 to 40, and dare pool). Numbered circular nodes with glowing halos spawn randomly across the screen with collision-free distribution. Players pass the device each turn, dragging from the current node to the next in ascending order ($1 \to 2 \to 3 \to \dots \to N$). If the drawn path intersects any existing path, a dramatic Dare Modal triggers! Once completed, the line is preserved, and play proceeds to the next teammate.
- **Target Audience**: Groups of friends, families, partygoers, and casual gamers sharing a phone or tablet.
- **Key Value**: Low-stress, laughter-filled cooperative tactile puzzle with high suspense and instant tactile feedback.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Title & Lobby Setup Screen**:
   - Clean game title with animated constellation line hero lockup.
   - **Player Setup**: Add/remove players (2 to 8), name customization, and distinct high-contrast color badges (Neon Cyan, Electric Magenta, Solar Amber, Emerald Glow, Vivid Violet, Coral Red, Azure Blue, Lime Spark).
   - **Game Settings**: Node count slider/selector (8, 12, 16, 20, 24, 30, 40), node radius size, and line collision sensitivity.
   - **Dare Deck Manager**: Toggle categories (Party Fun, Physical Mini-Games, Brain Teasers) and open the Custom Dare Editor to add personal inside-joke dares.
   - Primary action: `"Start Constellation"`.

2. **Active Canvas Playfield**:
   - **Full-Viewport Low-Occlusion Canvas**: Crisp dark space table (`#090D16` deep void with subtle star dust / grid texture) where numbered nodes illuminate like cosmic stars.
   - **Turn Banner (Top 12% Ergonomic Zone)**: Shows whose turn it is (`"Alex's Turn: Connect 4 → 5"`), their active color swatch, and a pass-device prompt.
   - **Interactive Node States**:
     - *Completed*: Filled with connecting player's color, pulsing line attachment.
     - *Source Node*: Brightly pulsating target ring, tactile anchor.
     - *Target Node*: Soft magnetic glow inviting the player's drag.
     - *Upcoming Nodes*: Subdued white/neutral halos with clear numbers.
   - **Freehand Line Weaving**: As the player drags, a smooth trail rendered in their player color follows their finger. Real-time path simplification and collision raycasting against previous strokes.
   - **Tactile Canvas Controls**: Bottom right quiet controls for Undo Current Stroke, Reset Round, and Pause/Rules.

3. **Dare Modal & Event Trigger**:
   - Triggered immediately if the current stroke crosses an existing line segment.
   - Dramatic visual pop (amber/rose pulse, haptic vibrate, playful synthesized buzzer).
   - Shows the active player's name and the drawn dare card.
   - Two clear actions: `"Dare Completed!"` (proceeds and validates the stroke) and `"Draw Another Dare"` (for family/safety adjustment).

4. **Constellation Complete Celebration**:
   - Final line connection triggers a starry burst effect and harmonious ascending chime chord.
   - Displays the finished interconnected geometric art piece unobstructed.
   - Summary telemetry: Total nodes connected, dares conquered, MVP line weaver, and one-tap options to Save Snapshot (PNG download) or Play Another Round.

### Visual Identity & Theme

- **Palette**: Dark cosmic backdrop (`#070A11`), surface card panels (`#111827`), hairline borders (`#1F2937`). Player colors are selected from vibrant, high-contrast, colorblind-friendly accents:
  - Player 1: `#06B6D4` (Cyan)
  - Player 2: `#EC4899` (Pink)
  - Player 3: `#F59E0B` (Amber)
  - Player 4: `#10B981` (Emerald)
  - Player 5: `#8B5CF6` (Purple)
  - Player 6: `#F97316` (Orange)
- **Typography**: Display headlines in `Plus Jakarta Sans`, tabular figures in `JetBrains Mono` / `font-mono tabular-nums` for crisp numerical node clarity.
- **Audio & Haptics**: Procedural Web Audio API sound generator (chimes on node snap, melodic line drag tones, playful warning buzzer on line intersection, fanfare on victory) + browser vibration API (`navigator.vibrate`) for Android devices.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Geometry Line Intersection Algorithm**:
  - *Chosen Approach*: Continuous 2D segment-segment intersection test ($p_1, p_2 \times q_1, q_2$) between the newly drawn polyline segments and all previously committed path segments. Also includes path simplification (Ramer-Douglas-Peucker / minimum step sampling) so long drags remain performant at 60fps without lagging.
  - *Why*: Accurate, zero external heavy physics dependencies, instantaneous detection the exact moment a line crosses another.
- **Decision 2: Intersected Line State Continuity**:
  - *Chosen Approach*: In accordance with prompt requirement 3 ("after performing the dare the game continues with the existing intersected line state"), crossing a line does NOT cancel the player's line or fail the level. Instead, the dare triggers, and upon clicking `"Dare Completed!"`, the game keeps the intersected line in place and advances the turn to the next player.
  - *Why*: Keeps the party fun moving forward cooperatively rather than causing frustrating resets.
- **Decision 3: Node Placement Distribution**:
  - *Chosen Approach*: Poisson-disc/rejection sampling with boundary padding so numbers never overlap, never spawn off-screen, and have sufficient breathing room for finger weaving.
- **Decision 4: Pass-and-Play Device Rotation**:
  - *Chosen Approach*: Clean turn banner with option to flip orientation or show clear player handoff banner so players sitting around a table or passing a phone can play seamlessly.

---

## 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                    App State Machine                         │
│  [ SETUP_LOBBY ] ──> [ ACTIVE_PLAY ] ──> [ CONSTELLATION_WIN ] │
│                             │                                │
│                     (Line Crosses)                           │
│                             ▼                                │
│                     [ DARE_POPUP ]                           │
└────────────────────────────────┬─────────────────────────────┘
                                 │
     ┌───────────────────────────┴───────────────────────────┐
     ▼                                                       ▼
┌─────────────────────────┐               ┌──────────────────────────────┐
│  Game Engine (Canvas)   │               │   Multiplayer & Dare Deck    │
│  - Node Generator       │               │   - Active Player Rotator    │
│  - Pointer / Touch Drag │               │   - Custom Dare List Store   │
│  - Segment Cross Test   │               │   - Audio Synthesizer (Tone) │
│  - Path Simplifier      │               │   - Android Vibration Bridge │
└─────────────────────────┘               └──────────────────────────────┘
```

### Core Entities & Data Structures

```typescript
interface NodePoint {
  id: number; // 1, 2, 3, ... N
  x: number;
  y: number;
  radius: number;
}

interface Player {
  id: string;
  name: string;
  color: string;
}

interface DrawnSegment {
  fromNodeId: number;
  toNodeId: number;
  playerId: string;
  playerColor: string;
  points: { x: number; y: number }[];
  hadIntersection: boolean;
  dareText?: string;
}

interface DareItem {
  id: string;
  category: 'party' | 'physical' | 'social' | 'custom';
  text: string;
}
```

### Plan Execution Sequence
1. Set application metadata and sync HTML title.
2. Build audio synthesizer engine (Web Audio API sound effects for node touch, line drawing, intersection buzzer, dare fanfares).
3. Implement 2D geometry module (line segment intersection, node clearance generation, touch coordinate normalizer).
4. Build Game Canvas with high-DPI scaling, smooth pointer events (touch & mouse), and glow rendering.
5. Build Pre-game Configuration screen (players, node count, dare selection & custom dare editor).
6. Build Turn Manager, Dare Popup Modal, and Constellation Celebration with PNG canvas export.
7. Verify build and compilation with `compile_applet`.
