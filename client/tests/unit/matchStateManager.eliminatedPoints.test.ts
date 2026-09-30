import { describe, expect, test } from "bun:test";
import { COMBO_WINDOW_MS, SPAWN_INTERVAL_FLOOR_MS } from "../../src/config/gameConfig";
import { comboBonusPoints } from "../../src/entities/Match";
import { MatchStateManager } from "../../src/systems/MatchStateManager";

// specs/019-pontuacao-flutuante (contracts/floating-score.md § Domínio, FR-001/FR-013): o evento
// "roach:eliminated" passa a informar os pontos daquela eliminação, sem mudar nenhuma regra.

function managerWithRoach(): MatchStateManager {
  const manager = new MatchStateManager();
  manager.start(0);
  manager.tick(2500);
  return manager;
}

describe('MatchStateManager — pontos no evento "roach:eliminated"', () => {
  test("points é igual ao aumento da pontuação da partida", () => {
    const manager = managerWithRoach();
    const received: number[] = [];
    manager.on("roach:eliminated", ({ points }) => received.push(points));
    const before = manager.getSnapshot().score;
    const roach = manager.getSnapshot().activeRoaches[0]!;

    manager.tryEliminateRoach(roach.id, roach.spawnedAt + 1000);

    expect(received).toHaveLength(1);
    expect(received[0]).toBe(manager.getSnapshot().score - before);
    expect(received[0]!).toBeGreaterThan(0);
  });

  test("em combo, a soma dos points é o score final e o 2º inclui o bônus de combo", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    const received: number[] = [];
    manager.on("roach:eliminated", ({ points }) => received.push(points));

    manager.tick(2500);
    const first = manager.getSnapshot().activeRoaches[0]!;
    const firstAt = first.spawnedAt + 1600;
    manager.tryEliminateRoach(first.id, firstAt);

    // Próxima barata nasce no próximo ciclo de spawn; elimina dentro da janela de combo.
    const nextTick = firstAt + SPAWN_INTERVAL_FLOOR_MS + 1500;
    manager.tick(nextTick);
    const second = manager.getSnapshot().activeRoaches[0]!;
    const secondAt = Math.min(second.spawnedAt + 1600, firstAt + COMBO_WINDOW_MS - 1);
    manager.tryEliminateRoach(second.id, secondAt);

    expect(received).toHaveLength(2);
    expect(received[0]! + received[1]!).toBe(manager.getSnapshot().score);
    expect(received[1]! - received[0]!).toBeGreaterThanOrEqual(comboBonusPoints(2) - comboBonusPoints(1));
  });

  test("eliminação depois do prazo não emite o evento", () => {
    const manager = managerWithRoach();
    let emitted = 0;
    manager.on("roach:eliminated", () => {
      emitted += 1;
    });
    const roach = manager.getSnapshot().activeRoaches[0]!;

    const ok = manager.tryEliminateRoach(roach.id, roach.spawnedAt + roach.travelDurationMs + 1);

    expect(ok).toBe(false);
    expect(emitted).toBe(0);
  });

  test("points inclui o bônus de reação (rápido > lento)", () => {
    const pointsFor = (reactionMs: number): number => {
      const manager = managerWithRoach();
      let points = 0;
      manager.on("roach:eliminated", (payload) => {
        points = payload.points;
      });
      const roach = manager.getSnapshot().activeRoaches[0]!;
      manager.tryEliminateRoach(roach.id, roach.spawnedAt + reactionMs);
      return points;
    };

    expect(pointsFor(100)).toBeGreaterThan(pointsFor(2000));
  });
});
