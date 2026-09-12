import { describe, expect, test } from "bun:test";
import { MatchStateManager } from "../../src/systems/MatchStateManager";
import { SHELF_COUNT, TOTAL_FOOD_ITEMS } from "../../src/config/gameConfig";

describe("MatchStateManager.start (FR-001, FR-002)", () => {
  test("cria uma nova Match jogável com prateleiras/comidas presentes e sem baratas", () => {
    const manager = new MatchStateManager();

    let startedPayload: { status: string } | undefined;
    manager.on("match:started", (snapshot) => {
      startedPayload = snapshot;
    });

    manager.start(0);

    const snapshot = manager.getSnapshot();
    expect(snapshot.status).toBe("playing");
    expect(snapshot.shelves.length).toBe(SHELF_COUNT);
    expect(snapshot.foodItems.length).toBe(TOTAL_FOOD_ITEMS);
    expect(snapshot.foodItems.every((item) => item.state === "present")).toBe(true);
    expect(snapshot.activeRoaches.length).toBe(0);
    expect(startedPayload).toBeDefined();
    expect(startedPayload!.status).toBe("playing");
  });
});
