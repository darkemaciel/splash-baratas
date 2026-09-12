import { describe, expect, test } from "bun:test";
import { MatchStateManager } from "../../src/systems/MatchStateManager";
import { SPAWN_INTERVAL_MS, TRAVEL_DURATION_MS } from "../../src/config/gameConfig";

describe("Constância de frequência/velocidade (FR-016)", () => {
  test("SPAWN_INTERVAL_MS e TRAVEL_DURATION_MS não mudam entre o primeiro e o último spawn de uma partida", () => {
    expect(SPAWN_INTERVAL_MS).toBe(2500);
    expect(TRAVEL_DURATION_MS).toBe(3000);

    const manager = new MatchStateManager();
    manager.start(0);

    manager.tick(SPAWN_INTERVAL_MS);
    const firstRoach = manager.getSnapshot().activeRoaches[0]!;
    expect(firstRoach.travelDurationMs).toBe(TRAVEL_DURATION_MS);

    manager.tick(SPAWN_INTERVAL_MS * 2);
    const secondRoach = manager
      .getSnapshot()
      .activeRoaches.find((roach) => roach.id !== firstRoach.id)!;
    expect(secondRoach.travelDurationMs).toBe(TRAVEL_DURATION_MS);
    expect(secondRoach.spawnedAt - firstRoach.spawnedAt).toBe(SPAWN_INTERVAL_MS);
  });
});
