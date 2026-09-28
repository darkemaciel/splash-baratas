/**
 * specs/019-pontuacao-flutuante (research §2/§3, contracts/floating-score.md): onde nasce o "+N!".
 * Acima da pata do gato; quando não cabe acima (no topo da tela, contando a subida), ao lado dela;
 * sempre inteiro na tela e nunca sobrepondo a pata. Puro, sem `import phaser` — testável com
 * `bun test`. Tamanhos chegam como caixas envolventes já giradas (`rotatedBounds`), então aqui tudo
 * são retângulos alinhados aos eixos.
 */

export interface FloatingScoreLayoutInput {
  /** Ponto do clique (centro da pata). */
  px: number;
  py: number;
  /** Caixa envolvente do número (já considerando a inclinação). */
  textWidth: number;
  textHeight: number;
  /** Meia-caixa envolvente da pata durante o tapa (escala + giro). */
  paw: { halfWidth: number; halfHeight: number };
  /** Quanto o número sobe durante a animação (0 com movimento reduzido). */
  riseReserved: number;
  screenWidth: number;
  screenHeight: number;
  /** Respiro entre o número e a pata. */
  gap: number;
  /** Distância mínima das bordas da tela. */
  margin: number;
}

/** Caixa envolvente de um retângulo `width × height` girado por `angleDeg`. */
export function rotatedBounds(width: number, height: number, angleDeg: number): { width: number; height: number } {
  const theta = (Math.abs(angleDeg) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(theta));
  const sin = Math.abs(Math.sin(theta));
  return { width: width * cos + height * sin, height: width * sin + height * cos };
}

export function floatingScorePosition(input: FloatingScoreLayoutInput): { x: number; y: number } {
  const { px, py, textWidth: w, textHeight: h, paw, riseReserved, screenWidth, screenHeight, gap, margin } = input;

  const minX = margin + w / 2;
  const maxX = screenWidth - margin - w / 2;
  const clampX = (x: number): number => Math.min(Math.max(x, minX), maxX);
  // O topo do número precisa continuar na tela até o fim da subida.
  const minY = margin + riseReserved + h / 2;
  const maxY = screenHeight - margin - h / 2;
  const clampY = (y: number): number => Math.min(Math.max(y, minY), maxY);

  // 1. Acima da pata: base do número `gap` acima do topo da pata.
  const aboveY = py - paw.halfHeight - gap - h / 2;
  if (aboveY >= minY) {
    return { x: clampX(px), y: Math.min(aboveY, maxY) };
  }

  // 2. Sem espaço acima: ao lado da pata, na altura dela — à direita, ou à esquerda se não couber.
  const rightX = px + paw.halfWidth + gap + w / 2;
  const leftX = px - paw.halfWidth - gap - w / 2;
  const sideX = rightX <= maxX ? rightX : leftX;
  return { x: clampX(sideX), y: clampY(py) };
}
