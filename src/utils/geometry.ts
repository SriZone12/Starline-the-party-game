import { Point, GameNode, DrawnStroke } from '../types/game';

export function getDistance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function closestPointOnSegment(p: Point, v: Point, w: Point): Point {
  const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return { x: v.x, y: v.y };
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return {
    x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y)
  };
}

/**
 * Computes minimum distance from point p to segment v-w
 */
function distToSegmentSquared(p: Point, v: Point, w: Point): number {
  const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return (p.x - v.x) * (p.x - v.x) + (p.y - v.y) * (p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = v.x + t * (w.x - v.x);
  const projY = v.y + t * (w.y - v.y);
  return (p.x - projX) * (p.x - projX) + (p.y - projY) * (p.y - projY);
}

/**
 * Calculates the exact intersection point and whether two segments cross.
 */
export function checkSegmentsIntersection(
  p1: Point, p2: Point,
  p3: Point, p4: Point
): { intersects: boolean; point?: Point } {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;

  const denom = d1x * d2y - d1y * d2x;

  if (Math.abs(denom) > 1e-7) {
    const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
    const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;

    // Standard segment crossing: t in [0, 1] and u in [0, 1]
    if (t >= -0.01 && t <= 1.01 && u >= -0.01 && u <= 1.01) {
      return {
        intersects: true,
        point: {
          x: p1.x + t * d1x,
          y: p1.y + t * d1y
        }
      };
    }
  }

  // Also check if segments are extremely close (within line stroke width of 4.5px)
  const dSq1 = distToSegmentSquared(p1, p3, p4);
  const dSq2 = distToSegmentSquared(p2, p3, p4);
  const dSq3 = distToSegmentSquared(p3, p1, p2);
  const dSq4 = distToSegmentSquared(p4, p1, p2);
  const minDist = Math.sqrt(Math.min(dSq1, dSq2, dSq3, dSq4));

  if (minDist < 4.5) {
    return {
      intersects: true,
      point: {
        x: (p1.x + p2.x + p3.x + p4.x) / 4,
        y: (p1.y + p2.y + p3.y + p4.y) / 4
      }
    };
  }

  return { intersects: false };
}

/**
 * Tests the entire current path against all existing committed strokes.
 * Skips only the immediate launch anchor points that reside inside the source node's circular radius.
 */
export function checkEntirePathIntersection(
  path: Point[],
  existingStrokes: DrawnStroke[],
  sourceNode: GameNode,
  targetNode: GameNode
): { hasIntersection: boolean; point?: Point; strokeId?: string } {
  if (path.length < 2) {
    return { hasIntersection: false };
  }

  const safeLaunchRadius = sourceNode.radius * 0.95;

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];

    // If both points of the segment are inside the source node's initial radius, skip
    const dist1 = getDistance(p1, sourceNode);
    const dist2 = getDistance(p2, sourceNode);
    if (dist1 <= safeLaunchRadius && dist2 <= safeLaunchRadius) {
      continue;
    }

    // Check against every segment of all committed strokes
    for (const stroke of existingStrokes) {
      const pts = stroke.points;
      for (let j = 0; j < pts.length - 1; j++) {
        const q1 = pts[j];
        const q2 = pts[j + 1];

        // If stroke ended at sourceNode, ignore only the segment terminating right inside sourceNode center
        if (stroke.toNode === sourceNode.id) {
          const qDist1 = getDistance(q1, sourceNode);
          const qDist2 = getDistance(q2, sourceNode);
          if (qDist1 <= safeLaunchRadius && qDist2 <= safeLaunchRadius) {
            continue;
          }
        }

        const result = checkSegmentsIntersection(p1, p2, q1, q2);
        if (result.intersects && result.point) {
          // Verify collision is outside the initial source node body
          if (getDistance(result.point, sourceNode) > safeLaunchRadius * 0.7) {
            return {
              hasIntersection: true,
              point: result.point,
              strokeId: stroke.id
            };
          }
        }
      }
    }

    // Self-intersection check (only for loops spaced at least 4 segments apart)
    if (path.length > 5) {
      for (let j = 0; j < i - 3; j++) {
        const q1 = path[j];
        const q2 = path[j + 1];
        const selfResult = checkSegmentsIntersection(p1, p2, q1, q2);
        if (selfResult.intersects && selfResult.point) {
          if (getDistance(selfResult.point, sourceNode) > safeLaunchRadius) {
            return {
              hasIntersection: true,
              point: selfResult.point
            };
          }
        }
      }
    }
  }

  return { hasIntersection: false };
}

export function checkPathHitsOtherNodes(
  path: Point[],
  nodes: GameNode[],
  sourceNodeId: number,
  targetNodeId: number,
  margin: number = 2
): { hasHit: boolean; point?: Point; nodeId?: number } {
  if (path.length < 2) {
    return { hasHit: false };
  }

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];

    for (const node of nodes) {
      if (node.id === sourceNodeId || node.id === targetNodeId) {
        continue;
      }

      const touchRadius = node.radius + margin;
      if (distToSegmentSquared(node, p1, p2) <= touchRadius * touchRadius) {
        return {
          hasHit: true,
          point: closestPointOnSegment(node, p1, p2),
          nodeId: node.id
        };
      }
    }
  }

  return { hasHit: false };
}

/**
 * Generates scattered nodes with minimum separation and edge margins.
 * Dense skies use a jittered grid so 69 stars fit even on small screens.
 */
export function generateRandomNodes(
  count: number,
  viewWidth: number,
  viewHeight: number,
  radius: number = 28
): GameNode[] {
  if (count >= 50) {
    return generateDenseNodes(count, viewWidth, viewHeight, radius);
  }

  const nodes: GameNode[] = [];
  const maxAttempts = 1800;

  // Safe zone margins to avoid top HUD and screen edges
  const marginTop = Math.max(90, viewHeight * 0.14);
  const marginBottom = Math.max(70, viewHeight * 0.10);
  const marginSide = Math.max(55, viewWidth * 0.09);

  const usableWidth = viewWidth - marginSide * 2;
  const usableHeight = viewHeight - marginTop - marginBottom;

  const minDistance = Math.max(
    radius * 2.7,
    (Math.min(usableWidth, usableHeight) / Math.sqrt(count)) * 0.85
  );

  for (let i = 1; i <= count; i++) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < maxAttempts) {
      attempts++;
      const testX = marginSide + Math.random() * usableWidth;
      const testY = marginTop + Math.random() * usableHeight;

      let collides = false;
      for (const node of nodes) {
        const dist = getDistance({ x: testX, y: testY }, node);
        if (dist < minDistance) {
          collides = true;
          break;
        }
      }

      if (!collides) {
        nodes.push({
          id: i,
          x: testX,
          y: testY,
          radius
        });
        placed = true;
      }
    }

    if (!placed) {
      nodes.push({
        id: i,
        x: marginSide + Math.random() * usableWidth,
        y: marginTop + Math.random() * usableHeight,
        radius
      });
    }
  }

  return nodes;
}

function generateDenseNodes(
  count: number,
  viewWidth: number,
  viewHeight: number,
  radius: number
): GameNode[] {
  const marginTop = Math.max(90, viewHeight * 0.12);
  const marginBottom = Math.max(32, viewHeight * 0.04);
  const marginSide = Math.max(32, viewWidth * 0.04);

  const usableWidth = Math.max(1, viewWidth - marginSide * 2);
  const usableHeight = Math.max(1, viewHeight - marginTop - marginBottom);
  const aspect = usableWidth / usableHeight;

  const cols = Math.max(1, Math.ceil(Math.sqrt(count * aspect)));
  const rows = Math.max(1, Math.ceil(count / cols));
  const cellWidth = usableWidth / cols;
  const cellHeight = usableHeight / rows;
  const minCell = Math.min(cellWidth, cellHeight);

  const denseRadius = Math.max(7, Math.min(radius, minCell / 3.4));
  const nodeGap = Math.max(7, denseRadius * 0.55);
  const minDistance = Math.min(minCell * 0.9, denseRadius * 2 + nodeGap);
  const jitterX = Math.max(0, (cellWidth - minDistance) / 2);
  const jitterY = Math.max(0, (cellHeight - minDistance) / 2);

  const cells: Array<{ x: number; y: number }> = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({
        x: marginSide + (col + 0.5) * cellWidth,
        y: marginTop + (row + 0.5) * cellHeight
      });
    }
  }

  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  return cells.slice(0, count).map((cell, index) => ({
    id: index + 1,
    x: cell.x + (Math.random() * 2 - 1) * jitterX,
    y: cell.y + (Math.random() * 2 - 1) * jitterY,
    radius: denseRadius
  }));
}
