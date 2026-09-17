import { describe, expect, test } from "bun:test";
import { MatchStateManager } from "../../src/systems/MatchStateManager";

describe("Cronômetro de tempo de sobrevivência — orquestração (FR-002, FR-004, FR-006)", () => {
  test("start(now) fixa startedAt = now e endedAt = null", () => {
    const manager = new MatchStateManager();
    manager.start(1000);
    const snapshot = manager.getSnapshot();
    expect(snapshot.startedAt).toBe(1000);
    expect(snapshot.endedAt).toBeNull();
  });

  test("o tick(now) que rouba a última comida fixa endedAt = now exatamente, e ticks posteriores não alteram mais esse valor", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    let t = 0;
    const maxT = 200_000;
    while (manager.getSnapshot().status === "playing" && t < maxT) {
      t += 100;
      manager.tick(t);
    }

    const snapshotAfterLoss = manager.getSnapshot();
    expect(snapshotAfterLoss.status).toBe("lost");
    expect(snapshotAfterLoss.endedAt).toBe(t);

    manager.tick(t + 50_000);
    expect(manager.getSnapshot().endedAt).toBe(t);
  });

  test("restart(newNow) após uma partida encerrada redefine startedAt/endedAt, independente da partida anterior", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    let t = 0;
    const maxT = 200_000;
    while (manager.getSnapshot().status === "playing" && t < maxT) {
      t += 100;
      manager.tick(t);
    }
    expect(manager.getSnapshot().status).toBe("lost");
    expect(manager.getSnapshot().endedAt).not.toBeNull();

    manager.restart(999_000);
    const snapshotAfterRestart = manager.getSnapshot();
    expect(snapshotAfterRestart.startedAt).toBe(999_000);
    expect(snapshotAfterRestart.endedAt).toBeNull();
  });
});
