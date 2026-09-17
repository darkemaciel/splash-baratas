import {
  COMBO_BONUS_STEP_POINTS,
  COMBO_WINDOW_MS,
  FOOD_ITEMS_PER_SHELF,
  REACTION_BONUS_TIERS,
  SCORE_BASE_POINTS,
  SHELF_COUNT,
} from "../config/gameConfig";
import { createFoodItem, type FoodItem } from "./FoodItem";
import { createShelf, type Shelf } from "./Shelf";
import type { Roach } from "./Roach";

export type MatchStatus = "notStarted" | "playing" | "lost";

export interface Match {
  shelves: Shelf[];
  foodItems: FoodItem[];
  activeRoaches: Roach[];
  status: MatchStatus;
  /** specs/004-sistema-pontuacao: pontuação acumulada da partida corrente (FR-001). */
  score: number;
  /** specs/004-sistema-pontuacao: nº de eliminações consecutivas sem falha (FR-006). */
  comboStreak: number;
  /** specs/004-sistema-pontuacao: timestamp da última eliminação pontuada, para detectar estouro da janela de combo (FR-008c). */
  lastEliminationAt: number | null;
  /** specs/007-tempo-de-sobrevivencia: timestamp de início da partida corrente (FR-002). */
  startedAt: number;
  /** specs/007-tempo-de-sobrevivencia: timestamp da derrota; `null` enquanto a partida não termina (FR-004). */
  endedAt: number | null;
}

export function createMatch(now: number = Date.now()): Match {
  const shelves: Shelf[] = [];
  const foodItems: FoodItem[] = [];

  for (let shelfIndex = 0; shelfIndex < SHELF_COUNT; shelfIndex++) {
    const shelfId = `shelf-${shelfIndex}`;
    const foodItemIds: string[] = [];
    for (let slotIndex = 0; slotIndex < FOOD_ITEMS_PER_SHELF; slotIndex++) {
      const foodItem = createFoodItem(`food-${shelfIndex}-${slotIndex}`, shelfId, slotIndex);
      foodItems.push(foodItem);
      foodItemIds.push(foodItem.id);
    }
    shelves.push(createShelf(shelfId, foodItemIds));
  }

  return {
    shelves,
    foodItems,
    activeRoaches: [],
    status: "playing",
    score: 0,
    comboStreak: 0,
    lastEliminationAt: null,
    startedAt: now,
    endedAt: null,
  };
}

export function createEmptyMatch(): Match {
  return {
    shelves: [],
    foodItems: [],
    activeRoaches: [],
    status: "notStarted",
    score: 0,
    comboStreak: 0,
    lastEliminationAt: null,
    startedAt: 0,
    endedAt: null,
  };
}

export function findFoodItem(match: Match, foodItemId: string): FoodItem | undefined {
  return match.foodItems.find((item) => item.id === foodItemId);
}

export function findRoach(match: Match, roachId: string): Roach | undefined {
  return match.activeRoaches.find((roach) => roach.id === roachId);
}

/** FR-009: nunca mais de uma Roach ativa mirando a mesma FoodItem. */
export function hasActiveRoachTargeting(match: Match, foodItemId: string): boolean {
  return match.activeRoaches.some((roach) => roach.targetFoodItemId === foodItemId);
}

export function presentFoodItemsWithoutActiveRoach(match: Match): FoodItem[] {
  return match.foodItems.filter(
    (item) => item.state === "present" && !hasActiveRoachTargeting(match, item.id),
  );
}

/** FR-010 / SC-004: a partida termina em derrota exatamente quando todas as comidas somem. */
export function allFoodStolen(match: Match): boolean {
  return match.foodItems.every((item) => item.state === "stolen");
}

export type RiskLevel = "safe" | "elevated" | "critical";

/** FR-002 (HUD): total real de comidas da partida corrente — nunca um valor fixo. */
export function foodTotalCount(match: Match): number {
  return match.foodItems.length;
}

/** FR-002/FR-003 (HUD): comidas ainda presentes, recontadas a cada leitura para nunca divergir do estado real. */
export function foodRemainingCount(match: Match): number {
  return match.foodItems.filter((item) => item.state === "present").length;
}

/**
 * FR-005 (HUD): três níveis de risco visual. 'critical' tem prioridade sobre a proporção quando
 * resta exatamente uma comida; caso contrário o limiar é a proporção de comidas restantes.
 */
export function riskLevel(match: Match): RiskLevel {
  const remaining = foodRemainingCount(match);
  if (remaining === 1) {
    return "critical";
  }
  const total = foodTotalCount(match);
  const ratio = total === 0 ? 0 : remaining / total;
  return ratio > 0.5 ? "safe" : "elevated";
}

export function removeRoach(match: Match, roachId: string): void {
  match.activeRoaches = match.activeRoaches.filter((roach) => roach.id !== roachId);
}

/** Deriva o índice numérico de uma prateleira a partir do id gerado por createMatch (`shelf-N`). */
export function shelfIndexFromId(shelfId: string): number {
  const parsed = Number(shelfId.split("-")[1]);
  if (Number.isNaN(parsed)) {
    throw new Error(`Id de prateleira inválido: ${shelfId}`);
  }
  return parsed;
}

/**
 * specs/004-sistema-pontuacao (FR-002, FR-012): soma a pontuação de uma eliminação ao `Match` e
 * retorna o total de pontos ganhos nesta eliminação. Nesta etapa (US1) só a pontuação base é
 * aplicada — o bônus de reação (US2) e o de combo (US3) são somados aqui em fases posteriores.
 */
/**
 * specs/004-sistema-pontuacao (FR-004, FR-005, research.md §2): bônus por faixas fixas, avaliadas
 * em ordem crescente com limite inclusivo — no limite exato de uma faixa, o bônus dela ainda se
 * aplica. Fora de todas as faixas, o bônus é zero.
 */
export function reactionBonusPoints(reactionMs: number): number {
  for (const tier of REACTION_BONUS_TIERS) {
    if (reactionMs <= tier.maxMs) {
      return tier.bonus;
    }
  }
  return 0;
}

/**
 * specs/004-sistema-pontuacao (FR-007, research.md §3): cresce linearmente a partir da 2ª
 * eliminação da sequência — a 1ª (`comboStreakAfterIncrement === 1`) não recebe bônus de combo.
 */
export function comboBonusPoints(comboStreakAfterIncrement: number): number {
  return COMBO_BONUS_STEP_POINTS * Math.max(0, comboStreakAfterIncrement - 1);
}

/** specs/004-sistema-pontuacao (FR-008): reinicia a sequência de combo sem afetar score/lastEliminationAt. */
export function resetComboStreak(match: Match): void {
  match.comboStreak = 0;
}

/**
 * specs/007-tempo-de-sobrevivencia (data-model.md § "Funções puras adicionadas"): tempo decorrido
 * desde o início da partida. Uma vez que `endedAt` deixa de ser `null`, o valor retornado ignora
 * `now` e passa a ser sempre o mesmo (FR-005 — tempo final estático).
 */
export function elapsedMs(match: Pick<Match, "startedAt" | "endedAt">, now: number): number {
  const end = match.endedAt ?? now;
  return Math.max(0, end - match.startedAt);
}

/**
 * specs/007-tempo-de-sobrevivencia (research.md §6): sempre "MM:SS", zero-padded, sem rollover
 * para horas — cobre "dezenas de minutos" (Edge Case da spec, FR-008) sem introduzir uma terceira
 * unidade.
 */
export function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function applyEliminationScore(match: Match, now: number, spawnedAt: number): number {
  // FR-008c: estourar a janela de tempo desde a última eliminação reinicia a sequência antes de
  // contar esta eliminação como início de uma nova.
  if (match.lastEliminationAt !== null && now - match.lastEliminationAt > COMBO_WINDOW_MS) {
    resetComboStreak(match);
  }
  match.comboStreak += 1;

  const points =
    SCORE_BASE_POINTS + reactionBonusPoints(now - spawnedAt) + comboBonusPoints(match.comboStreak);
  match.score += points;
  match.lastEliminationAt = now;
  return points;
}
