import {
  allFoodStolen,
  applyEliminationScore,
  createEmptyMatch,
  createMatch,
  findFoodItem,
  findRoach,
  foodRemainingCount,
  foodTotalCount,
  presentFoodItemsWithoutActiveRoach,
  removeRoach,
  resetComboStreak,
  riskLevel,
  shelfIndexFromId,
  type Match,
  type MatchStatus,
  type RiskLevel,
} from "../entities/Match";
import { markStolen, type FoodItem } from "../entities/FoodItem";
import {
  createRoach,
  eliminate,
  hasReachedTarget,
  markReachedTarget,
  type Roach,
} from "../entities/Roach";
import { foodItemPosition, nearestSpawnPoint, SPAWN_INTERVAL_MS, TRAVEL_DURATION_MS } from "../config/gameConfig";

export interface MatchSnapshot {
  readonly shelves: ReadonlyArray<{ readonly id: string; readonly foodItemIds: readonly string[] }>;
  readonly foodItems: ReadonlyArray<Readonly<FoodItem>>;
  readonly activeRoaches: ReadonlyArray<Readonly<Roach>>;
  readonly status: MatchStatus;
  /** HUD de progresso/risco (specs/002-hud-progresso-risco): nunca um valor fixo, sempre recontado. */
  readonly foodRemainingCount: number;
  readonly foodTotalCount: number;
  readonly riskLevel: RiskLevel;
  /** specs/004-sistema-pontuacao: cópia direta de match.score, não derivado (FR-001). */
  readonly score: number;
}

export type MatchEventName =
  | "match:started"
  | "roach:spawned"
  | "roach:eliminated"
  | "food:stolen"
  | "match:lost";

export interface MatchEventPayloads {
  "match:started": MatchSnapshot;
  "roach:spawned": Roach;
  "roach:eliminated": { roachId: string };
  "food:stolen": { foodItemId: string };
  "match:lost": MatchSnapshot;
}

/**
 * Única fronteira entre a camada de domínio (TypeScript puro) e as scenes do Phaser
 * (contracts/domain-api.md). Nenhum método aceita ou retorna tipos do Phaser; a comunicação de
 * estado usa um pub-sub baseado em EventTarget nativo, nunca Phaser.Events (Princípios I e II).
 */
export class MatchStateManager {
  private match: Match = createEmptyMatch();
  private readonly events = new EventTarget();
  private lastSpawnAt = 0;

  getSnapshot(): MatchSnapshot {
    return {
      shelves: this.match.shelves.map((shelf) => ({ id: shelf.id, foodItemIds: [...shelf.foodItemIds] })),
      foodItems: this.match.foodItems.map((item) => ({ ...item })),
      activeRoaches: this.match.activeRoaches.map((roach) => ({ ...roach })),
      status: this.match.status,
      foodRemainingCount: foodRemainingCount(this.match),
      foodTotalCount: foodTotalCount(this.match),
      riskLevel: riskLevel(this.match),
      score: this.match.score,
    };
  }

  on<E extends MatchEventName>(event: E, handler: (detail: MatchEventPayloads[E]) => void): () => void {
    const listener = (evt: Event) => handler((evt as CustomEvent<MatchEventPayloads[E]>).detail);
    this.events.addEventListener(event, listener);
    return () => this.events.removeEventListener(event, listener);
  }

  private emit<E extends MatchEventName>(event: E, detail: MatchEventPayloads[E]): void {
    this.events.dispatchEvent(new CustomEvent(event, { detail }));
  }

  /** FR-001, FR-002: cria uma nova Match com 3 prateleiras / 9 comidas presentes, sem baratas. */
  start(now: number = Date.now()): void {
    this.match = createMatch();
    this.lastSpawnAt = now;
    this.emit("match:started", this.getSnapshot());
  }

  /** FR-013: reinício restaura comidas/prateleiras e remove baratas, mesmo a partir de 'lost'. */
  restart(now: number = Date.now()): void {
    this.start(now);
  }

  /**
   * FR-003/FR-005/FR-009/FR-021: spawna baratas na cadência fixa, sem exceder uma barata ativa
   * por comida presente. FR-007/FR-008: baratas cujo tempo de viagem se esgota roubam a comida.
   * FR-010/FR-014: ao roubar a última comida, a partida entra em derrota e para de spawnar.
   */
  tick(now: number): void {
    if (this.match.status !== "playing") {
      return;
    }

    if (now - this.lastSpawnAt >= SPAWN_INTERVAL_MS) {
      const candidates = presentFoodItemsWithoutActiveRoach(this.match);
      if (candidates.length > 0) {
        const target = candidates[Math.floor(Math.random() * candidates.length)]!;
        const shelfIndex = shelfIndexFromId(target.shelfId);
        const targetPosition = foodItemPosition(shelfIndex, target.slotIndex);
        const spawnPoint = nearestSpawnPoint(targetPosition);
        const roach = createRoach(
          `roach-${target.id}-${now}`,
          target.id,
          spawnPoint,
          now,
          TRAVEL_DURATION_MS,
        );
        this.match.activeRoaches.push(roach);
        this.lastSpawnAt = now;
        this.emit("roach:spawned", { ...roach });
      }
    }

    for (const roach of [...this.match.activeRoaches]) {
      if (roach.state === "active" && hasReachedTarget(roach, now)) {
        markReachedTarget(roach);
        const foodItem = findFoodItem(this.match, roach.targetFoodItemId);
        if (foodItem) {
          markStolen(foodItem);
        }
        removeRoach(this.match, roach.id);
        resetComboStreak(this.match); // FR-008a: qualquer roubo reinicia o combo, incondicionalmente
        this.emit("food:stolen", { foodItemId: roach.targetFoodItemId });

        if (allFoodStolen(this.match)) {
          this.match.status = "lost";
          this.emit("match:lost", this.getSnapshot());
          break;
        }
      }
    }
  }

  /**
   * FR-006/FR-015/FR-017: elimina a barata se ainda estiver ativa e o clique tiver ocorrido
   * antes ou exatamente no instante em que ela alcançaria o alvo (empate favorece o clique).
   */
  tryEliminateRoach(roachId: string, clientTimestamp: number): boolean {
    const roach = findRoach(this.match, roachId);
    if (!roach || roach.state !== "active") {
      return false;
    }
    const deadline = roach.spawnedAt + roach.travelDurationMs;
    if (clientTimestamp > deadline) {
      return false;
    }
    const eliminated = eliminate(roach);
    if (eliminated) {
      applyEliminationScore(this.match, clientTimestamp, roach.spawnedAt);
      removeRoach(this.match, roachId);
      this.emit("roach:eliminated", { roachId });
    }
    return eliminated;
  }

  /** specs/004-sistema-pontuacao (FR-008b): clique sem acertar nenhuma barata reinicia o combo. */
  registerMissedClick(): void {
    resetComboStreak(this.match);
  }
}

/**
 * Instância única compartilhada entre as scenes do Phaser — a única forma de as scenes lerem ou
 * mudarem o estado da partida, nunca por acesso direto a `Match`/entidades (Princípio II).
 */
export const matchStateManager = new MatchStateManager();
