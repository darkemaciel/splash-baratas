import { describe, expect, test } from "bun:test";
import { MatchStateManager } from "../../src/systems/MatchStateManager";

describe("MatchStateManager.tryEliminateRoach (FR-006, FR-015, FR-017)", () => {
  test("elimina a barata quando o clique ocorre antes da chegada, e a comida permanece", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    manager.tick(2500);

    const roach = manager.getSnapshot().activeRoaches[0]!;
    const deadline = roach.spawnedAt + roach.travelDurationMs;

    const ok = manager.tryEliminateRoach(roach.id, deadline - 100);
    expect(ok).toBe(true);

    const snapshot = manager.getSnapshot();
    expect(snapshot.activeRoaches.length).toBe(0);
    const food = snapshot.foodItems.find((item) => item.id === roach.targetFoodItemId)!;
    expect(food.state).toBe("present");
  });

  test("clicar em uma barata já eliminada não tem efeito colateral", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    manager.tick(2500);

    const roach = manager.getSnapshot().activeRoaches[0]!;
    const deadline = roach.spawnedAt + roach.travelDurationMs;

    expect(manager.tryEliminateRoach(roach.id, deadline - 100)).toBe(true);
    expect(manager.tryEliminateRoach(roach.id, deadline - 50)).toBe(false);
  });

  test("empate exato entre clique e chegada favorece o clique", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    manager.tick(2500);

    const roach = manager.getSnapshot().activeRoaches[0]!;
    const deadline = roach.spawnedAt + roach.travelDurationMs;

    const ok = manager.tryEliminateRoach(roach.id, deadline);
    expect(ok).toBe(true);
    expect(manager.getSnapshot().activeRoaches.length).toBe(0);
  });

  test("clique após a barata já ter roubado a comida (tick já processou) não tem efeito", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    manager.tick(2500);

    const roach = manager.getSnapshot().activeRoaches[0]!;
    const deadline = roach.spawnedAt + roach.travelDurationMs;

    manager.tick(deadline); // resolve o roubo primeiro
    const ok = manager.tryEliminateRoach(roach.id, deadline);
    expect(ok).toBe(false);
  });
});
