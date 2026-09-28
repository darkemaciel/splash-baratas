import { describe, expect, test } from "bun:test";
import {
  floatingScorePosition,
  rotatedBounds,
  type FloatingScoreLayoutInput,
} from "../../src/ui/floatingScoreLayout";

// specs/019-pontuacao-flutuante (contracts/floating-score.md § Kit de UI, FR-002/FR-008): o número
// nasce acima da pata, vai para o lado dela quando não há espaço no topo, fica sempre inteiro na
// tela e nunca sobrepõe a pata.

const paw = { halfWidth: 20, halfHeight: 35 };
const base = {
  textWidth: 90,
  textHeight: 50,
  paw,
  riseReserved: 48,
  gap: 8,
  margin: 4,
};

function input(px: number, py: number, overrides: Partial<FloatingScoreLayoutInput> = {}): FloatingScoreLayoutInput {
  return { px, py, screenWidth: 960, screenHeight: 600, ...base, ...overrides };
}

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function numberRect(pos: { x: number; y: number }, w = base.textWidth, h = base.textHeight): Rect {
  return { left: pos.x - w / 2, right: pos.x + w / 2, top: pos.y - h / 2, bottom: pos.y + h / 2 };
}

function pawRect(px: number, py: number): Rect {
  return { left: px - paw.halfWidth, right: px + paw.halfWidth, top: py - paw.halfHeight, bottom: py + paw.halfHeight };
}

function intersects(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

describe("floatingScorePosition", () => {
  test("no meio da tela, nasce centrado no ponteiro e acima da pata com o respiro", () => {
    const pos = floatingScorePosition(input(480, 300));
    expect(pos.x).toBe(480);
    expect(pos.y + base.textHeight / 2).toBeCloseTo(300 - paw.halfHeight - base.gap, 6);
  });

  test("perto das bordas laterais, o texto fica inteiro", () => {
    for (const px of [5, 955]) {
      const rect = numberRect(floatingScorePosition(input(px, 300)));
      expect(rect.left).toBeGreaterThanOrEqual(base.margin);
      expect(rect.right).toBeLessThanOrEqual(960 - base.margin);
    }
  });

  test("perto do topo vai para o lado direito da pata; no canto direito, para o esquerdo", () => {
    const right = numberRect(floatingScorePosition(input(480, 40)));
    expect(right.left).toBeGreaterThanOrEqual(480 + paw.halfWidth);
    expect(intersects(right, pawRect(480, 40))).toBe(false);

    const left = numberRect(floatingScorePosition(input(950, 40)));
    expect(left.right).toBeLessThanOrEqual(950 - paw.halfWidth);
    expect(intersects(left, pawRect(950, 40))).toBe(false);
  });

  test("em toda a tela, nunca sobrepõe a pata e sempre cabe (paisagem e retrato)", () => {
    for (const [screenWidth, screenHeight] of [
      [960, 600],
      [480, 960],
    ] as const) {
      for (let px = 0; px <= screenWidth; px += 10) {
        for (let py = 0; py <= screenHeight; py += 10) {
          const pos = floatingScorePosition(input(px, py, { screenWidth, screenHeight }));
          const rect = numberRect(pos);
          expect(intersects(rect, pawRect(px, py))).toBe(false);
          expect(rect.left).toBeGreaterThanOrEqual(base.margin - 1e-9);
          expect(rect.right).toBeLessThanOrEqual(screenWidth - base.margin + 1e-9);
          expect(rect.top - base.riseReserved).toBeGreaterThanOrEqual(base.margin - 1e-9);
          expect(rect.bottom).toBeLessThanOrEqual(screenHeight - base.margin + 1e-9);
        }
      }
    }
  });

  test("sem subida (movimento reduzido), cabe acima mais perto do topo", () => {
    // Com subida de 48 o número iria para o lado; sem subida, ainda cabe acima da pata.
    const py = base.margin + base.textHeight + base.gap + paw.halfHeight + 10;
    const withRise = floatingScorePosition(input(480, py));
    const withoutRise = floatingScorePosition(input(480, py, { riseReserved: 0 }));
    expect(withRise.x).not.toBe(480);
    expect(withoutRise.x).toBe(480);
    expect(withoutRise.y + base.textHeight / 2).toBeCloseTo(py - paw.halfHeight - base.gap, 6);
  });
});

describe("rotatedBounds", () => {
  test("0° mantém, 90° troca, e o sinal do ângulo não importa", () => {
    expect(rotatedBounds(100, 50, 0)).toEqual({ width: 100, height: 50 });
    const quarter = rotatedBounds(100, 50, 90);
    expect(quarter.width).toBeCloseTo(50, 6);
    expect(quarter.height).toBeCloseTo(100, 6);
    const neg = rotatedBounds(80, 40, -25);
    const pos = rotatedBounds(80, 40, 25);
    expect(neg.width).toBeCloseTo(pos.width, 9);
    expect(neg.height).toBeCloseTo(pos.height, 9);
  });
});
