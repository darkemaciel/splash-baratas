import { describe, expect, test } from "bun:test";
import { MatchStateManager } from "../../src/systems/MatchStateManager";

describe("Roach spawn targeting (FR-004, FR-009)", () => {
  test("uma barata recém-spawnada mira uma comida ainda presente e o alvo nunca muda", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    manager.tick(2500);

    const snapshot = manager.getSnapshot();
    expect(snapshot.activeRoaches.length).toBe(1);

    const roach = snapshot.activeRoaches[0]!;
    const targetFood = snapshot.foodItems.find((item) => item.id === roach.targetFoodItemId);
    expect(targetFood).toBeDefined();
    expect(targetFood!.state).toBe("present");

    manager.tick(2600);
    const laterSnapshot = manager.getSnapshot();
    const sameRoach = laterSnapshot.activeRoaches.find((r) => r.id === roach.id);
    expect(sameRoach).toBeDefined();
    expect(sameRoach!.targetFoodItemId).toBe(roach.targetFoodItemId);
  });
});
