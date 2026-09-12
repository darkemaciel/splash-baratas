import { describe, expect, test } from "bun:test";
import { MatchStateManager } from "../../src/systems/MatchStateManager";

describe("Derrota da partida (FR-010, FR-014, SC-004)", () => {
  test("a partida entra em 'lost' exatamente quando a última comida é roubada, e para de spawnar", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    let lostEmitted = false;
    manager.on("match:lost", () => {
      lostEmitted = true;
    });

    let t = 0;
    const maxT = 200_000;
    while (manager.getSnapshot().status === "playing" && t < maxT) {
      t += 100;
      manager.tick(t);
    }

    const snapshot = manager.getSnapshot();
    expect(snapshot.status).toBe("lost");
    expect(lostEmitted).toBe(true);
    expect(snapshot.foodItems.every((item) => item.state === "stolen")).toBe(true);
    expect(snapshot.activeRoaches.length).toBe(0);

    const roachCountAfterLoss = manager.getSnapshot().activeRoaches.length;
    manager.tick(t + 50_000);
    expect(manager.getSnapshot().activeRoaches.length).toBe(roachCountAfterLoss);
    expect(manager.getSnapshot().status).toBe("lost");
  });
});
