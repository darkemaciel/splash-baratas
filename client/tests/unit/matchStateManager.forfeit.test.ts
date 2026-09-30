import { describe, expect, test } from "bun:test";
import { MatchStateManager } from "../../src/systems/MatchStateManager";
import { elapsedMs } from "../../src/entities/Match";
import { TOTAL_FOOD_ITEMS } from "../../src/config/gameConfig";

// specs/018-navegacao-pausa-fim (contracts/navigation.md § Domínio, FR-005/FR-006): o jogador
// encerra a partida em andamento pelo mesmo caminho de uma derrota.

/** Deixa a partida com uma comida roubada e pontos zerados, avançando só pelo tick(). */
function matchWithOneStolenFood(): MatchStateManager {
  const manager = new MatchStateManager();
  manager.start(0);
  manager.tick(2500); // spawna a primeira barata
  manager.tick(20_000); // tempo de viagem esgotado: rouba a comida
  return manager;
}

describe("MatchStateManager.forfeit", () => {
  test("encerra a partida em andamento sem mexer em pontos nem comidas", () => {
    const manager = matchWithOneStolenFood();
    const before = manager.getSnapshot();
    expect(before.status).toBe("playing");

    expect(manager.forfeit(30_000)).toBe(true);

    const after = manager.getSnapshot();
    expect(after.status).toBe("lost");
    expect(after.endedAt).toBe(30_000);
    expect(after.score).toBe(before.score);
    expect(after.foodItems).toEqual(before.foodItems);
  });

  test("emite match:lost uma única vez e é idempotente", () => {
    const manager = matchWithOneStolenFood();
    let emissions = 0;
    manager.on("match:lost", () => {
      emissions += 1;
    });

    expect(manager.forfeit(30_000)).toBe(true);
    expect(manager.forfeit(31_000)).toBe(false);

    expect(emissions).toBe(1);
    expect(manager.getSnapshot().endedAt).toBe(30_000);
  });

  test("não faz nada antes de a partida começar", () => {
    const manager = new MatchStateManager();
    expect(manager.getSnapshot().status).toBe("notStarted");

    expect(manager.forfeit(1000)).toBe(false);
    expect(manager.getSnapshot().status).toBe("notStarted");
  });

  test("depois de encerrada, tick() não cria baratas nem rouba comidas", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    manager.forfeit(1000);

    manager.tick(60_000);

    const snapshot = manager.getSnapshot();
    expect(snapshot.activeRoaches.length).toBe(0);
    expect(snapshot.foodItems.every((item) => item.state === "present")).toBe(true);
  });

  test("o tempo decorrido fica congelado no instante do encerramento", () => {
    const manager = new MatchStateManager();
    manager.start(5000);
    manager.forfeit(12_000);

    expect(elapsedMs(manager.getSnapshot(), 22_000)).toBe(7000);
  });

  test("restart() depois de forfeit volta ao estado inicial", () => {
    const manager = matchWithOneStolenFood();
    manager.forfeit(30_000);

    manager.restart(40_000);

    const snapshot = manager.getSnapshot();
    expect(snapshot.status).toBe("playing");
    expect(snapshot.score).toBe(0);
    expect(snapshot.endedAt).toBeNull();
    expect(snapshot.foodItems.length).toBe(TOTAL_FOOD_ITEMS);
    expect(snapshot.foodItems.every((item) => item.state === "present")).toBe(true);
  });
});
