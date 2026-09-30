/**
 * specs/017-design-system-grotesco (research §4, contracts/ui-kit.md § ui/shape.ts): converte os
 * raios de borda do design system (formato CSS `border-radius`, com cantos elípticos diferentes)
 * num polígono para `Graphics.fillPoints/strokePoints`. `fillRoundedRect` do Phaser só aceita
 * cantos circulares, o que deixaria as bolhas "carimbadas". Puro, sem `import phaser` — testável
 * com `bun test`.
 */

export interface ShapePoint {
  x: number;
  y: number;
}

/** Cantos na ordem do CSS: superior esquerdo, superior direito, inferior direito, inferior esquerdo. */
type Corners = [number, number, number, number];

function parseLength(token: string, reference: number): number {
  const value = Number.parseFloat(token);
  if (Number.isNaN(value)) {
    return 0;
  }
  return token.trim().endsWith("%") ? (value / 100) * reference : value;
}

/** Expande 1 a 4 valores como o CSS: [a] → a a a a; [a b] → a b a b; [a b c] → a b c b. */
function expandCorners(tokens: string[], reference: number): Corners {
  const values = tokens.map((t) => parseLength(t, reference));
  const [a = 0, b = a, c = a, d = b] = values;
  return [a, b, c, d];
}

function parseRadii(radii: string, width: number, height: number): { rx: Corners; ry: Corners } {
  const [horizontalPart = "0", verticalPart] = radii.split("/");
  const horizontalTokens = horizontalPart.trim().split(/\s+/).filter(Boolean);
  const verticalTokens = (verticalPart ?? horizontalPart).trim().split(/\s+/).filter(Boolean);
  return {
    rx: expandCorners(horizontalTokens, width),
    ry: expandCorners(verticalTokens, height),
  };
}

/**
 * Polígono fechado (implicitamente) de um retângulo `width × height` com cantos em quarto de elipse.
 * Ponto (0,0) = canto superior esquerdo da caixa. Percorre os cantos no sentido horário da tela,
 * começando pelo início do canto superior esquerdo.
 */
export function bubblePoints(
  width: number,
  height: number,
  radii: string,
  segmentsPerCorner = 8,
): ShapePoint[] {
  const { rx, ry } = parseRadii(radii, width, height);

  // Mesmo ajuste do CSS: se a soma dos raios de um lado passa do lado, todos os raios são
  // reduzidos pelo mesmo fator (o menor entre os quatro lados).
  const sums = [
    { sum: rx[0] + rx[1], side: width },
    { sum: rx[3] + rx[2], side: width },
    { sum: ry[0] + ry[3], side: height },
    { sum: ry[1] + ry[2], side: height },
  ];
  let factor = 1;
  for (const { sum, side } of sums) {
    if (sum > side && sum > 0) {
      factor = Math.min(factor, side / sum);
    }
  }
  const sx = rx.map((r) => r * factor) as Corners;
  const sy = ry.map((r) => r * factor) as Corners;

  const corners: Array<{ cx: number; cy: number; rx: number; ry: number; start: number }> = [
    { cx: sx[0], cy: sy[0], rx: sx[0], ry: sy[0], start: Math.PI },
    { cx: width - sx[1], cy: sy[1], rx: sx[1], ry: sy[1], start: Math.PI * 1.5 },
    { cx: width - sx[2], cy: height - sy[2], rx: sx[2], ry: sy[2], start: 0 },
    { cx: sx[3], cy: height - sy[3], rx: sx[3], ry: sy[3], start: Math.PI * 0.5 },
  ];

  const points: ShapePoint[] = [];
  for (const corner of corners) {
    for (let i = 0; i <= segmentsPerCorner; i++) {
      const theta = corner.start + (i / segmentsPerCorner) * (Math.PI / 2);
      points.push({
        x: Math.min(width, Math.max(0, corner.cx + corner.rx * Math.cos(theta))),
        y: Math.min(height, Math.max(0, corner.cy + corner.ry * Math.sin(theta))),
      });
    }
  }
  return points;
}

/** Pílula: raio de metade da altura em todos os cantos. */
export function pillPoints(width: number, height: number, segmentsPerCorner = 8): ShapePoint[] {
  return bubblePoints(width, height, `${height / 2}px`, segmentsPerCorner);
}
