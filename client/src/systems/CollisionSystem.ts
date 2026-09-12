import type { Point } from "../config/gameConfig";
import type { Roach } from "../entities/Roach";

export interface RoachHitTestInput {
  readonly roach: Roach;
  readonly position: Point;
  readonly visualRadius: number;
}

/**
 * Hit-testing direto por geometria (círculo), sem física do Phaser — Princípio V da
 * constitution (contracts/domain-api.md §CollisionSystem).
 */
export function hitTestRoach(
  pointer: Point,
  position: Point,
  visualRadius: number,
  paddingPx: number,
): boolean {
  const dx = pointer.x - position.x;
  const dy = pointer.y - position.y;
  const radius = visualRadius + paddingPx;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * FR-018: quando múltiplas baratas se sobrepõem, um clique afeta no máximo uma — a mais "acima"
 * na pilha visual, aqui representada pela última da lista (ordem de renderização/spawn).
 */
export function pickTopmostHit(
  pointer: Point,
  candidates: readonly RoachHitTestInput[],
  paddingPx: number,
): Roach | undefined {
  for (let i = candidates.length - 1; i >= 0; i--) {
    const candidate = candidates[i]!;
    if (hitTestRoach(pointer, candidate.position, candidate.visualRadius, paddingPx)) {
      return candidate.roach;
    }
  }
  return undefined;
}
