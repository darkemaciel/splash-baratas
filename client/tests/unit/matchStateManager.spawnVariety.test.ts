import { describe, expect, test } from "bun:test";
import { MatchStateManager } from "../../src/systems/MatchStateManager";
import { SPAWN_INTERVAL_MS } from "../../src/config/gameConfig";
import type { Roach } from "../../src/entities/Roach";

const POLL_STEP_MS = 50;
const MAX_POLL_ITERATIONS = 5000;

// shelfIndex=1, slotIndex=0 → região "left" (3 candidatos), verificado em
// gameConfig.spawnRegions.test.ts — alvo fixo e determinístico para os testes de isolamento
// abaixo, para que "antes" e "depois" de um restart sempre comparem a mesma região.
const ISOLATED_TARGET_ID = "food-1-0";

/**
 * Avança `manager` em passos pequenos até que `targetId` seja a única comida ainda presente —
 * protege `targetId` de ser roubado (elimina sua barata assim que ela spawna) enquanto deixa as
 * outras 8 comidas serem roubadas naturalmente, em qualquer ordem. Passos pequenos evitam que dois
 * roubos caiam na mesma chamada de tick() (specs/010-variacao-pontos-spawn, T008/T017).
 */
function isolateSpecificTarget(manager: MatchStateManager, targetId: string, startAt = 0): number {
  let now = startAt;
  let iterations = 0;
  while (
    manager
      .getSnapshot()
      .foodItems.some((item) => item.id !== targetId && item.state === "present")
  ) {
    now += POLL_STEP_MS;
    manager.tick(now);
    const protectedRoach = manager
      .getSnapshot()
      .activeRoaches.find((roach) => roach.targetFoodItemId === targetId);
    if (protectedRoach) {
      manager.tryEliminateRoach(protectedRoach.id, protectedRoach.spawnedAt);
    }
    iterations++;
    if (iterations > MAX_POLL_ITERATIONS) {
      throw new Error("isolateSpecificTarget não convergiu — possível regressão no loop de roubo");
    }
  }
  return now;
}

/**
 * Com um único alvo isolado, força `spawnCount` spawns consecutivos para ele, eliminando cada
 * barata imediatamente após spawnar (libera a comida de novo, sem deixá-la ser roubada).
 */
function collectRepeatedSpawnsForSingleTarget(
  manager: MatchStateManager,
  startNow: number,
  spawnCount: number,
): Roach[] {
  const roaches: Roach[] = [];
  let now = startNow;
  for (let i = 0; i < spawnCount; i++) {
    now += SPAWN_INTERVAL_MS;
    manager.tick(now);
    const roach = manager.getSnapshot().activeRoaches[0];
    if (!roach) {
      throw new Error(`Nenhuma barata spawnou na iteração ${i} (now=${now})`);
    }
    roaches.push(roach);
    manager.tryEliminateRoach(roach.id, roach.spawnedAt);
  }
  return roaches;
}

describe("Variedade de pontos de spawn para o mesmo alvo (US1, FR-001, FR-004)", () => {
  test("mais de 1 ponto de spawn distinto aparece ao longo de 30+ spawns do mesmo alvo", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    const isolatedAt = isolateSpecificTarget(manager, ISOLATED_TARGET_ID);
    const roaches = collectRepeatedSpawnsForSingleTarget(manager, isolatedAt, 30);

    const distinctPoints = new Set(roaches.map((roach) => `${roach.spawnPoint.x},${roach.spawnPoint.y}`));
    expect(distinctPoints.size).toBeGreaterThan(1);
  });
});

describe("Sem repetição consecutiva óbvia (US3, FR-005)", () => {
  test("dois spawns consecutivos para o mesmo alvo nunca usam o mesmo ponto, quando há alternativa", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    const isolatedAt = isolateSpecificTarget(manager, ISOLATED_TARGET_ID);
    const roaches = collectRepeatedSpawnsForSingleTarget(manager, isolatedAt, 30);

    for (let i = 1; i < roaches.length; i++) {
      const previous = roaches[i - 1]!;
      const current = roaches[i]!;
      const isSamePoint =
        previous.spawnPoint.x === current.spawnPoint.x && previous.spawnPoint.y === current.spawnPoint.y;
      expect(isSamePoint).toBe(false);
    }
  });

  test("após restart(), a regra de não-repetição não é restringida pelo ponto usado antes do restart", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    const isolatedAt = isolateSpecificTarget(manager, ISOLATED_TARGET_ID);
    const [firstRoach] = collectRepeatedSpawnsForSingleTarget(manager, isolatedAt, 1);

    // Reinicia a partida — lastSpawnPointByTarget deve ser limpo mesmo que o mesmo targetId
    // volte a existir, presente, na nova partida (spec.md Edge Cases).
    manager.restart(1_000_000);
    expect(manager.getSnapshot().foodItems.find((item) => item.id === ISOLATED_TARGET_ID)?.state).toBe(
      "present",
    );

    const reIsolatedAt = isolateSpecificTarget(manager, ISOLATED_TARGET_ID, 1_000_000);
    const roachesAfterRestart = collectRepeatedSpawnsForSingleTarget(manager, reIsolatedAt, 30);

    // Não é proibido repetir o ponto de antes do restart — só não pode ser sempre proibido. Entre
    // 30 spawns pós-restart, pelo menos um deve coincidir com o ponto usado antes do restart.
    const sawSamePointAsBeforeRestart = roachesAfterRestart.some(
      (roach) => roach.spawnPoint.x === firstRoach!.spawnPoint.x && roach.spawnPoint.y === firstRoach!.spawnPoint.y,
    );
    expect(sawSamePointAsBeforeRestart).toBe(true);
  });
});

describe("SC-001: ao menos 8 posições de spawn distintas em uma partida típica", () => {
  test("uma partida simulada de ~2 minutos observa pelo menos 8 pontos de spawn distintos", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    const distinctPoints = new Set<string>();
    manager.on("roach:spawned", (roach) => {
      distinctPoints.add(`${roach.spawnPoint.x},${roach.spawnPoint.y}`);
    });

    let now = 0;
    const totalDurationMs = 120_000;
    while (now < totalDurationMs) {
      now += SPAWN_INTERVAL_MS;
      manager.tick(now);
      // Simula um jogador que nunca deixa uma comida ser roubada: elimina toda barata ativa assim
      // que ela aparece, mantendo as 9 comidas sempre presentes e candidatas (SC-001).
      for (const roach of manager.getSnapshot().activeRoaches) {
        manager.tryEliminateRoach(roach.id, roach.spawnedAt);
      }
    }

    expect(distinctPoints.size).toBeGreaterThanOrEqual(8);
  });
});
