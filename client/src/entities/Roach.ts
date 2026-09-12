import type { Point } from "../config/gameConfig";

export type RoachState = "active" | "eliminated" | "reachedTarget";

export interface Roach {
  readonly id: string;
  /** Fixo desde o spawn — nunca reatribuído (FR-004). */
  readonly targetFoodItemId: string;
  readonly spawnPoint: Point;
  readonly spawnedAt: number;
  readonly travelDurationMs: number;
  state: RoachState;
}

export function createRoach(
  id: string,
  targetFoodItemId: string,
  spawnPoint: Point,
  spawnedAt: number,
  travelDurationMs: number,
): Roach {
  return { id, targetFoodItemId, spawnPoint, spawnedAt, travelDurationMs, state: "active" };
}

export function progress(roach: Roach, now: number): number {
  const elapsed = now - roach.spawnedAt;
  return Math.min(1, Math.max(0, elapsed / roach.travelDurationMs));
}

export function positionAt(roach: Roach, now: number, targetPosition: Point): Point {
  const t = progress(roach, now);
  return {
    x: roach.spawnPoint.x + (targetPosition.x - roach.spawnPoint.x) * t,
    y: roach.spawnPoint.y + (targetPosition.y - roach.spawnPoint.y) * t,
  };
}

export function hasReachedTarget(roach: Roach, now: number): boolean {
  return now - roach.spawnedAt >= roach.travelDurationMs;
}

/**
 * FR-017: empate entre clique e chegada no mesmo instante favorece sempre o clique — por isso
 * eliminate() tem precedência e é um no-op silencioso se a barata já não estiver 'active'
 * (cobre tanto "já eliminada" quanto "já chegou ao alvo").
 */
export function eliminate(roach: Roach): boolean {
  if (roach.state !== "active") {
    return false;
  }
  roach.state = "eliminated";
  return true;
}

export function markReachedTarget(roach: Roach): void {
  if (roach.state !== "active") {
    return;
  }
  roach.state = "reachedTarget";
}
