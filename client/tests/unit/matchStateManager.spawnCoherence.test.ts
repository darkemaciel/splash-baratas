import { describe, expect, test } from "bun:test";
import { MatchStateManager } from "../../src/systems/MatchStateManager";
import { foodItemPosition, spawnPointCandidates, SPAWN_INTERVAL_BASE_MS } from "../../src/config/gameConfig";
import { shelfIndexFromId } from "../../src/entities/Match";

describe("Coerência região/alvo em tick() (US2, FR-003, spec.md US2 AC1/AC2)", () => {
  test("todo spawnPoint pertence exatamente à região coerente do próprio alvo da barata", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    let checkedCount = 0;
    manager.on("roach:spawned", (roach) => {
      const foodItem = manager.getSnapshot().foodItems.find((item) => item.id === roach.targetFoodItemId);
      if (!foodItem) {
        throw new Error(`Comida-alvo ${roach.targetFoodItemId} não encontrada no snapshot`);
      }
      const shelfIndex = shelfIndexFromId(foodItem.shelfId);
      const targetPosition = foodItemPosition(shelfIndex, foodItem.slotIndex);
      const candidates = spawnPointCandidates(targetPosition);

      const belongsToCoherentRegion = candidates.some(
        (point) => point.x === roach.spawnPoint.x && point.y === roach.spawnPoint.y,
      );
      expect(belongsToCoherentRegion).toBe(true);
      checkedCount++;
    });

    let now = 0;
    const totalDurationMs = 120_000;
    while (now < totalDurationMs) {
      now += SPAWN_INTERVAL_BASE_MS;
      manager.tick(now);
      for (const roach of manager.getSnapshot().activeRoaches) {
        manager.tryEliminateRoach(roach.id, roach.spawnedAt);
      }
    }

    // Garante que o teste de fato exercitou spawns suficientes para ser significativo.
    expect(checkedCount).toBeGreaterThan(20);
  });
});
