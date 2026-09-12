import { describe, expect, test } from "bun:test";
import { MatchStateManager } from "../../src/systems/MatchStateManager";

describe("MatchStateManager food theft (FR-007, FR-008, SC-003)", () => {
  test("quando o tempo de viagem se esgota sem clique, apenas a comida-alvo é removida", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    manager.tick(2500); // spawn

    const spawnSnapshot = manager.getSnapshot();
    const roach = spawnSnapshot.activeRoaches[0]!;
    const targetId = roach.targetFoodItemId;
    const deadline = roach.spawnedAt + roach.travelDurationMs;

    let stolenPayload: { foodItemId: string } | undefined;
    manager.on("food:stolen", (payload) => {
      stolenPayload = payload;
    });

    manager.tick(deadline); // esgota o tempo de viagem

    const snapshot = manager.getSnapshot();
    const targetFood = snapshot.foodItems.find((item) => item.id === targetId)!;
    expect(targetFood.state).toBe("stolen");
    expect(snapshot.activeRoaches.find((r) => r.id === roach.id)).toBeUndefined();
    expect(stolenPayload).toEqual({ foodItemId: targetId });

    const otherFoods = snapshot.foodItems.filter((item) => item.id !== targetId);
    expect(otherFoods.every((item) => item.state === "present")).toBe(true);
  });
});
