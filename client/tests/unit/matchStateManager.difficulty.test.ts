import { describe, expect, test } from "bun:test";
import { MatchStateManager } from "../../src/systems/MatchStateManager";
import {
  DIFFICULTY_RAMP_DURATION_MS,
  SPAWN_INTERVAL_BASE_MS,
  SPAWN_INTERVAL_FLOOR_MS,
  TRAVEL_DURATION_BASE_MS,
  TRAVEL_DURATION_FLOOR_MS,
} from "../../src/config/gameConfig";
import type { Roach } from "../../src/entities/Roach";

const POLL_STEP_MS = 25;
// Margem de tolerância para comparar valores dinâmicos com base/piso, dado o discretismo do
// polling (o spawn real dispara no primeiro passo em que a condição se torna verdadeira, não
// exatamente no instante teórico).
const TOLERANCE_MS = POLL_STEP_MS * 3;

/**
 * Avança `manager` em passos pequenos e fixos, a partir de `startAt`, mantendo a partida em
 * andamento indefinidamente (elimina toda barata assim que ela spawna, como em specs/010) e
 * registra cada `Roach` spawnada, na ordem de criação.
 */
function simulateSurvivalCollectingSpawns(
  manager: MatchStateManager,
  totalDurationMs: number,
  startAt = 0,
): Roach[] {
  const roaches: Roach[] = [];
  const unsubscribe = manager.on("roach:spawned", (roach) => {
    roaches.push(roach);
    manager.tryEliminateRoach(roach.id, roach.spawnedAt);
  });

  let now = startAt;
  const endAt = startAt + totalDurationMs;
  while (now < endAt) {
    now += POLL_STEP_MS;
    manager.tick(now);
  }
  unsubscribe();
  return roaches;
}

describe("Cadência de spawn aumenta com o tempo de sobrevivência (US1, FR-001, FR-003)", () => {
  test("intervalo entre spawns diminui de perto da base para perto do piso ao longo da partida", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    const totalDurationMs = DIFFICULTY_RAMP_DURATION_MS * 2.2;
    const roaches = simulateSurvivalCollectingSpawns(manager, totalDurationMs);
    const spawnTimestamps = roaches.map((roach) => roach.spawnedAt);

    expect(spawnTimestamps.length).toBeGreaterThan(2);

    const firstGap = spawnTimestamps[1]! - spawnTimestamps[0]!;
    const lastGap = spawnTimestamps.at(-1)! - spawnTimestamps.at(-2)!;

    expect(Math.abs(firstGap - SPAWN_INTERVAL_BASE_MS)).toBeLessThanOrEqual(TOLERANCE_MS);
    expect(Math.abs(lastGap - SPAWN_INTERVAL_FLOOR_MS)).toBeLessThanOrEqual(TOLERANCE_MS);
    expect(lastGap).toBeLessThan(firstGap);
  });
});

describe("Tempo de reação diminui com o tempo de sobrevivência (US2, FR-002, FR-007)", () => {
  test("travelDurationMs das baratas diminui de perto da base para perto do piso ao longo da partida", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    const totalDurationMs = DIFFICULTY_RAMP_DURATION_MS * 2.2;
    const roaches = simulateSurvivalCollectingSpawns(manager, totalDurationMs);

    expect(roaches.length).toBeGreaterThan(2);

    const firstDuration = roaches[0]!.travelDurationMs;
    const lastDuration = roaches.at(-1)!.travelDurationMs;

    expect(Math.abs(firstDuration - TRAVEL_DURATION_BASE_MS)).toBeLessThanOrEqual(TOLERANCE_MS);
    expect(Math.abs(lastDuration - TRAVEL_DURATION_FLOOR_MS)).toBeLessThanOrEqual(TOLERANCE_MS);
    expect(lastDuration).toBeLessThan(firstDuration);
  });

  test("travelDurationMs de uma barata já spawnada não muda enquanto ela ainda está em trajeto", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    manager.tick(SPAWN_INTERVAL_BASE_MS);
    const spawned = manager.getSnapshot().activeRoaches[0]!;
    const travelDurationAtSpawn = spawned.travelDurationMs;

    // Avança bastante o tempo de sobrevivência (mudando o que currentTravelDurationMs retornaria
    // para uma barata nova), mas sem deixar esta barata específica alcançar o alvo.
    const stillInFlightAt = spawned.spawnedAt + Math.floor(travelDurationAtSpawn / 2);
    manager.tick(stillInFlightAt);

    const sameRoachLater = manager
      .getSnapshot()
      .activeRoaches.find((roach) => roach.id === spawned.id);
    expect(sameRoachLater).toBeDefined();
    expect(sameRoachLater!.travelDurationMs).toBe(travelDurationAtSpawn);
  });

  test("após restart(), o próximo spawn volta a usar valores próximos da base, não os já degradados", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    // Avança a dificuldade bem além do piso antes de reiniciar.
    simulateSurvivalCollectingSpawns(manager, DIFFICULTY_RAMP_DURATION_MS * 1.5);

    const restartAt = 10_000_000;
    manager.restart(restartAt);

    const roachesAfterRestart = simulateSurvivalCollectingSpawns(
      manager,
      SPAWN_INTERVAL_BASE_MS + POLL_STEP_MS * 4,
      restartAt,
    );
    expect(roachesAfterRestart.length).toBeGreaterThan(0);

    const firstAfterRestart = roachesAfterRestart[0]!;
    expect(Math.abs(firstAfterRestart.travelDurationMs - TRAVEL_DURATION_BASE_MS)).toBeLessThanOrEqual(
      TOLERANCE_MS,
    );
    expect(
      Math.abs(firstAfterRestart.spawnedAt - restartAt - SPAWN_INTERVAL_BASE_MS),
    ).toBeLessThanOrEqual(TOLERANCE_MS);
  });
});

describe("Piso mínimo nunca é ultrapassado em partidas extremamente longas (US3, FR-004)", () => {
  test("intervalo entre spawns e travelDurationMs nunca ficam abaixo dos pisos, mesmo muito além da rampa", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    const totalDurationMs = DIFFICULTY_RAMP_DURATION_MS * 5;
    const roaches = simulateSurvivalCollectingSpawns(manager, totalDurationMs);

    expect(roaches.length).toBeGreaterThan(2);

    for (let i = 1; i < roaches.length; i++) {
      const gap = roaches[i]!.spawnedAt - roaches[i - 1]!.spawnedAt;
      // survivalMs no instante do spawn anterior já bem além da rampa — o piso deve valer.
      if (roaches[i - 1]!.spawnedAt >= DIFFICULTY_RAMP_DURATION_MS) {
        expect(gap).toBeGreaterThanOrEqual(SPAWN_INTERVAL_FLOOR_MS - TOLERANCE_MS);
      }
      expect(roaches[i]!.travelDurationMs).toBeGreaterThanOrEqual(TRAVEL_DURATION_FLOOR_MS - TOLERANCE_MS);
    }

    const lastGap = roaches.at(-1)!.spawnedAt - roaches.at(-2)!.spawnedAt;
    expect(Math.abs(lastGap - SPAWN_INTERVAL_FLOOR_MS)).toBeLessThanOrEqual(TOLERANCE_MS);
    expect(Math.abs(roaches.at(-1)!.travelDurationMs - TRAVEL_DURATION_FLOOR_MS)).toBeLessThanOrEqual(
      TOLERANCE_MS,
    );
  });
});
