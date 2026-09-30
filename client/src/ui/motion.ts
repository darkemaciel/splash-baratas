/**
 * specs/017-design-system-grotesco (FR-023, research §7): preferência de movimento reduzido do
 * sistema, lida uma vez no carregamento do módulo (mesmo padrão de `isPortraitViewport` em
 * gameConfig.ts). `typeof window` guarda o caminho de teste (bun test roda sem DOM).
 */
export const prefersReducedMotion: boolean =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

/** Duração de uma transição de interface — 0 com movimento reduzido. */
export function uiTweenMs(ms: number): number {
  return prefersReducedMotion ? 0 : ms;
}
