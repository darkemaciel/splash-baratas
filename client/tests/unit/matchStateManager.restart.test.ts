import { describe, expect, test } from "bun:test";
import { MatchStateManager } from "../../src/systems/MatchStateManager";
import { TOTAL_FOOD_ITEMS } from "../../src/config/gameConfig";

describe("MatchStateManager.restart (FR-013)", () => {
  test("restart() restaura todas as comidas e remove baratas ativas", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    manager.tick(2500);
    expect(manager.getSnapshot().activeRoaches.length).toBe(1);

    manager.restart(9999);

    const snapshot = manager.getSnapshot();
    expect(snapshot.status).toBe("playing");
    expect(snapshot.activeRoaches.length).toBe(0);
    expect(snapshot.foodItems.length).toBe(TOTAL_FOOD_ITEMS);
    expect(snapshot.foodItems.every((item) => item.state === "present")).toBe(true);
  });

  test("reinícios repetidos em sequência rápida produzem sempre um estado limpo", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    manager.restart(10);
    manager.restart(20);
    manager.restart(30);

    const snapshot = manager.getSnapshot();
    expect(snapshot.activeRoaches.length).toBe(0);
    expect(snapshot.foodItems.every((item) => item.state === "present")).toBe(true);
  });
});
