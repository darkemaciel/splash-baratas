import { describe, expect, test } from "bun:test";
import { bubblePoints, pillPoints } from "../../src/ui/shape";
import { RAIO } from "../../src/config/theme";

// specs/017-design-system-grotesco (contracts/ui-kit.md § ui/shape.ts): polígono da forma de bolha
// a partir de raios no formato CSS border-radius.

const EPS = 1e-9;

function withinBounds(points: { x: number; y: number }[], w: number, h: number): boolean {
  return points.every((p) => p.x >= -EPS && p.x <= w + EPS && p.y >= -EPS && p.y <= h + EPS);
}

describe("bubblePoints — limites e contagem", () => {
  test("todos os pontos ficam dentro de [0,w]×[0,h] para as bolhas do design system", () => {
    for (const radii of Object.values(RAIO)) {
      const points = bubblePoints(220, 60, radii);
      expect(withinBounds(points, 220, 60)).toBe(true);
    }
  });

  test("número de pontos = 4 × (segmentsPerCorner + 1)", () => {
    expect(bubblePoints(100, 50, "10px").length).toBe(4 * (8 + 1));
    expect(bubblePoints(100, 50, "10px", 3).length).toBe(4 * (3 + 1));
  });

  test("raio zero gera o retângulo (cantos exatos)", () => {
    const points = bubblePoints(100, 50, "0px", 1);
    const corners = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
      { x: 0, y: 50 },
    ];
    for (const corner of corners) {
      expect(points.some((p) => Math.abs(p.x - corner.x) < EPS && Math.abs(p.y - corner.y) < EPS)).toBe(true);
    }
  });
});

describe("bubblePoints — interpretação dos raios", () => {
  test("% horizontal é relativo à largura e % vertical à altura", () => {
    // canto superior esquerdo com 50% / 50% num 200×100: raio horizontal 100, vertical 50.
    // O canto começa em (0, 50) e termina em (100, 0).
    const points = bubblePoints(200, 100, "50% 0% 0% 0% / 50% 0% 0% 0%", 4);
    const first = points[0]!;
    const lastOfCorner = points[4]!;
    expect(first.x).toBeCloseTo(0, 6);
    expect(first.y).toBeCloseTo(50, 6);
    expect(lastOfCorner.x).toBeCloseTo(100, 6);
    expect(lastOfCorner.y).toBeCloseTo(0, 6);
  });

  test("sem '/', o raio vertical é igual ao horizontal", () => {
    const a = bubblePoints(200, 100, "20px 10px 30px 5px");
    const b = bubblePoints(200, 100, "20px 10px 30px 5px / 20px 10px 30px 5px");
    expect(a).toEqual(b);
  });

  test("valores com 1, 2 e 3 itens expandem como no CSS", () => {
    expect(bubblePoints(200, 100, "10px")).toEqual(bubblePoints(200, 100, "10px 10px 10px 10px"));
    expect(bubblePoints(200, 100, "10px 20px")).toEqual(bubblePoints(200, 100, "10px 20px 10px 20px"));
    expect(bubblePoints(200, 100, "10px 20px 30px")).toEqual(bubblePoints(200, 100, "10px 20px 30px 20px"));
  });

  test("raios que somam mais que o lado são escalados pelo mesmo fator", () => {
    // 80px + 80px no topo de uma caixa de 100 → fator 100/160; lateral 80+80 em 50 → 50/160 (menor, vence).
    const scaled = bubblePoints(100, 50, "80px", 2);
    const equivalent = bubblePoints(100, 50, `${80 * (50 / 160)}px`, 2);
    for (let i = 0; i < scaled.length; i++) {
      expect(scaled[i]!.x).toBeCloseTo(equivalent[i]!.x, 6);
      expect(scaled[i]!.y).toBeCloseTo(equivalent[i]!.y, 6);
    }
    expect(withinBounds(scaled, 100, 50)).toBe(true);
  });
});

describe("pillPoints", () => {
  test("equivale a bubblePoints com raio de metade da altura", () => {
    expect(pillPoints(160, 28)).toEqual(bubblePoints(160, 28, "14px"));
  });

  test("é simétrica em relação ao centro horizontal", () => {
    const points = pillPoints(100, 40, 8);
    const xs = points.map((p) => p.x);
    expect(Math.min(...xs)).toBeCloseTo(0, 6);
    expect(Math.max(...xs)).toBeCloseTo(100, 6);
  });
});
