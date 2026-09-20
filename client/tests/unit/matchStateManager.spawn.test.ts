import { describe, expect, test } from "bun:test";
import { MatchStateManager } from "../../src/systems/MatchStateManager";
import {
  DIFFICULTY_RAMP_DURATION_MS,
  SPAWN_INTERVAL_BASE_MS,
  SPAWN_INTERVAL_FLOOR_MS,
  TOTAL_FOOD_ITEMS,
} from "../../src/config/gameConfig";

describe("MatchStateManager spawn cadence (FR-003, FR-009, FR-021)", () => {
  test("uma nova barata surge no máximo a cada SPAWN_INTERVAL_BASE_MS", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    manager.tick(SPAWN_INTERVAL_BASE_MS);
    expect(manager.getSnapshot().activeRoaches.length).toBe(1);

    // specs/013-teto-baratas-simultaneas: ROACH_CAP_BASE=1 impede uma segunda barata simultânea
    // aqui (survivalMs=5000, bem antes de DIFFICULTY_RAMP_DURATION_MS) — a cadência de spawn
    // continua satisfeita, mas o teto bloqueia a criação até a primeira ser eliminada ou roubar.
    manager.tick(SPAWN_INTERVAL_BASE_MS * 2);
    expect(manager.getSnapshot().activeRoaches.length).toBe(1);
  });

  test("sem alvos duplicados quando o teto já permite 2 baratas simultâneas (FR-009)", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    // specs/013-teto-baratas-simultaneas: a partir de DIFFICULTY_RAMP_DURATION_MS o teto já é
    // ROACH_CAP_MAX=2, permitindo a segunda barata coexistir com a primeira.
    manager.tick(DIFFICULTY_RAMP_DURATION_MS);
    manager.tick(DIFFICULTY_RAMP_DURATION_MS + SPAWN_INTERVAL_FLOOR_MS);
    const snapshot = manager.getSnapshot();
    expect(snapshot.activeRoaches.length).toBe(2);

    const targets = snapshot.activeRoaches.map((roach) => roach.targetFoodItemId);
    expect(new Set(targets).size).toBe(targets.length);
  });

  test("nunca excede uma barata ativa por comida presente, mesmo após muitos ticks", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    for (
      let t = SPAWN_INTERVAL_BASE_MS;
      t <= SPAWN_INTERVAL_BASE_MS * (TOTAL_FOOD_ITEMS + 2);
      t += SPAWN_INTERVAL_BASE_MS
    ) {
      manager.tick(t);
      const snapshot = manager.getSnapshot();
      expect(snapshot.activeRoaches.length).toBeLessThanOrEqual(TOTAL_FOOD_ITEMS);
      const targets = snapshot.activeRoaches.map((roach) => roach.targetFoodItemId);
      expect(new Set(targets).size).toBe(targets.length);
    }
  });
});
