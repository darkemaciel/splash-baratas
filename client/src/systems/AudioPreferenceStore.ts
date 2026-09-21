import { AUDIO_MUTE_STORAGE_KEY } from "../config/gameConfig";

/**
 * specs/014-mute-som-jogo (research.md §2): mesmo padrão defensivo de systems/HighScoreStore.ts —
 * referencia `localStorage` como identificador global solto, funciona igual em navegador e
 * simplifica testes.
 */
function isStorageAvailable(): boolean {
  return typeof localStorage !== "undefined";
}

/**
 * FR-007/Clarifications Q1/Q2: nunca lança, e trata ausência, exceção ou valor salvo em formato
 * inesperado como "som ativo" (`false`) — o padrão seguro tanto na primeira visita quanto quando o
 * armazenamento está indisponível ou corrompido.
 */
export function getMuted(): boolean {
  if (!isStorageAvailable()) {
    return false;
  }
  try {
    const raw = localStorage.getItem(AUDIO_MUTE_STORAGE_KEY);
    if (raw === null) {
      return false;
    }
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "boolean" ? parsed : false;
  } catch {
    return false;
  }
}

/**
 * FR-007/Clarifications Q2: tenta persistir `muted`; se a escrita falhar (indisponível, quota
 * excedida, modo privado), a chamada não lança — o controle continua funcionando apenas na sessão
 * atual, sem persistir.
 */
export function setMuted(muted: boolean): void {
  if (!isStorageAvailable()) {
    return;
  }
  try {
    localStorage.setItem(AUDIO_MUTE_STORAGE_KEY, JSON.stringify(muted));
  } catch {
    // Clarifications Q2: falha de escrita não trava o toggle, apenas não persiste desta vez.
  }
}
