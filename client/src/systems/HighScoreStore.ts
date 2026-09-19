import { HIGH_SCORE_RANKING_MAX_ENTRIES, HIGH_SCORE_STORAGE_KEY } from "../config/gameConfig";

export interface RankingEntry {
  readonly name: string;
  readonly score: number;
}

export interface RecordScoreResult {
  readonly ranking: readonly RankingEntry[];
  readonly position: number | null;
}

/**
 * specs/012-high-score-local (research.md §2): referencia `localStorage` como identificador
 * global solto (não `window.localStorage`) — funciona igual em navegador e simplifica testes, que
 * só precisam popular `globalThis.localStorage`, sem também simular `window`.
 */
function isStorageAvailable(): boolean {
  return typeof localStorage !== "undefined";
}

function isValidEntry(value: unknown): value is RankingEntry {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const { name, score } = value as { name?: unknown; score?: unknown };
  return (
    typeof name === "string" && typeof score === "number" && Number.isFinite(score) && score >= 0
  );
}

/**
 * FR-007/FR-009/FR-010: nunca lança, e trata ausência, exceção, formato inesperado (incluindo o
 * ranking de números puros salvo por uma versão anterior desta feature, antes de guardar o nome do
 * jogador) ou valores inválidos como "ranking vazio" (`[]`). Sempre devolve o resultado ordenado da
 * maior para a menor pontuação.
 */
function readStoredRanking(): RankingEntry[] {
  if (!isStorageAvailable()) {
    return [];
  }
  try {
    const raw = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    if (raw === null) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isValidEntry)) {
      return [];
    }
    return [...parsed].sort((a, b) => b.score - a.score);
  } catch {
    return [];
  }
}

/** FR-006/FR-007: `[]` significa "nenhuma partida concluída ainda" neste navegador. */
export function getRanking(): readonly RankingEntry[] {
  return readStoredRanking();
}

/**
 * FR-002/FR-003/FR-004/FR-009: insere `{ name, score }` no ranking salvo quando há espaço livre
 * (menos de `HIGH_SCORE_RANKING_MAX_ENTRIES` entradas) ou quando `score` supera a menor entrada
 * atual — removendo essa menor entrada para manter o tamanho máximo. Em empate ou pontuação menor
 * com o ranking já cheio, nada é alterado. O retorno reflete o resultado desta partida mesmo que a
 * escrita em `localStorage` falhe silenciosamente.
 */
export function recordScore(name: string, score: number): RecordScoreResult {
  const current = readStoredRanking();
  const isFull = current.length >= HIGH_SCORE_RANKING_MAX_ENTRIES;
  const lowest = current.length > 0 ? current[current.length - 1]!.score : null;
  const entersRanking = !isFull || (lowest !== null && score > lowest);

  if (!entersRanking) {
    return { ranking: current, position: null };
  }

  const entry: RankingEntry = { name, score };
  const updated = [...current, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, HIGH_SCORE_RANKING_MAX_ENTRIES);

  if (isStorageAvailable()) {
    try {
      localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // FR-009: falha de escrita não trava o fim de partida, apenas não persiste desta vez.
    }
  }

  return { ranking: updated, position: updated.indexOf(entry) + 1 };
}
