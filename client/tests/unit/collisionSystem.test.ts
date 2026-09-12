import { describe, expect, test } from "bun:test";
import { hitTestRoach, pickTopmostHit, type RoachHitTestInput } from "../../src/systems/CollisionSystem";
import { createRoach } from "../../src/entities/Roach";

describe("CollisionSystem (FR-018, research.md §4)", () => {
  test("hitTestRoach aceita cliques dentro do raio + padding e rejeita fora dele", () => {
    const position = { x: 100, y: 100 };
    const visualRadius = 20;
    const paddingPx = 6;

    expect(hitTestRoach({ x: 100, y: 100 }, position, visualRadius, paddingPx)).toBe(true);
    expect(hitTestRoach({ x: 100, y: 125 }, position, visualRadius, paddingPx)).toBe(true); // 25 <= 26
    expect(hitTestRoach({ x: 100, y: 130 }, position, visualRadius, paddingPx)).toBe(false); // 30 > 26
  });

  test("pickTopmostHit afeta no máximo uma barata quando há sobreposição", () => {
    const bottom = createRoach("r1", "food-0-0", { x: 0, y: 0 }, 0, 3000);
    const top = createRoach("r2", "food-0-1", { x: 0, y: 0 }, 0, 3000);

    const candidates: RoachHitTestInput[] = [
      { roach: bottom, position: { x: 100, y: 100 }, visualRadius: 20 },
      { roach: top, position: { x: 100, y: 100 }, visualRadius: 20 },
    ];

    const hit = pickTopmostHit({ x: 100, y: 100 }, candidates, 6);
    expect(hit).toBeDefined();
    expect(hit!.id).toBe("r2");
  });

  test("pickTopmostHit retorna undefined quando nenhuma barata é atingida", () => {
    const roach = createRoach("r1", "food-0-0", { x: 0, y: 0 }, 0, 3000);
    const candidates: RoachHitTestInput[] = [{ roach, position: { x: 100, y: 100 }, visualRadius: 20 }];

    const hit = pickTopmostHit({ x: 500, y: 500 }, candidates, 6);
    expect(hit).toBeUndefined();
  });
});
