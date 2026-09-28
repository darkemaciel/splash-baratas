/**
 * specs/017-design-system-grotesco (research §9, FR-024): formatação de números e tempo do texto da
 * interface. Fica na camada de UI — a função de domínio `formatElapsedTime` (mm:ss) não muda.
 * Separador fixo, sem `Intl`, para não variar com o locale do navegador. Puro, sem `import phaser`.
 */

/** 1250 → "1.250" */
export function formatThousands(n: number): string {
  const sign = n < 0 ? "-" : "";
  const digits = String(Math.trunc(Math.abs(n)));
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** 45_000 → "0:45"; 723_000 → "12:03"; negativo → "0:00" */
export function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
