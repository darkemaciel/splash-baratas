import { describe, expect, test } from "bun:test";
import { MatchStateManager } from "../../src/systems/MatchStateManager";
import { SPAWN_INTERVAL_BASE_MS, TOTAL_FOOD_ITEMS } from "../../src/config/gameConfig";

describe("MatchStateManager spawn cadence (FR-003, FR-009, FR-021)", () => {
  test("uma nova barata surge no máximo a cada SPAWN_INTERVAL_BASE_MS, sem alvos duplicados ou repetidos", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    manager.tick(SPAWN_INTERVAL_BASE_MS);
    expect(manager.getSnapshot().activeRoaches.length).toBe(1);

    manager.tick(SPAWN_INTERVAL_BASE_MS * 2);
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
