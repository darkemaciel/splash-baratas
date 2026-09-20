import { describe, expect, test } from "bun:test";
import { MatchStateManager } from "../../src/systems/MatchStateManager";
import {
  currentRoachCap,
  DIFFICULTY_RAMP_DURATION_MS,
  ROACH_CAP_BASE,
  ROACH_CAP_MAX,
  SPAWN_INTERVAL_BASE_MS,
  TOTAL_FOOD_ITEMS,
  TRAVEL_DURATION_BASE_MS,
} from "../../src/config/gameConfig";

const POLL_STEP_MS = 25;

interface Sample {
  readonly survivalMs: number;
  readonly count: number;
}

/**
 * specs/013-teto-baratas-simultaneas (research.md §4): diferente de
 * `simulateSurvivalCollectingSpawns` (specs/011), que elimina cada barata imediatamente ao spawnar
 * (nunca mais de 1 ativa por vez), este helper elimina cada barata só no último instante antes de
 * ela alcançar o alvo — maximizando a sobreposição natural entre baratas, sem nunca deixar nenhuma
 * comida ser roubada (a partida permanece "playing" e com as 9 comidas presentes indefinidamente).
 * Registra, a cada passo, o número instantâneo de `activeRoaches`.
 */
function simulateSurvivalTrackingMaxConcurrentRoaches(
  manager: MatchStateManager,
  totalDurationMs: number,
  startAt = 0,
): Sample[] {
  const samples: Sample[] = [];

  let now = startAt;
  const endAt = startAt + totalDurationMs;
  while (now < endAt) {
    now += POLL_STEP_MS;
    manager.tick(now);

    for (const roach of manager.getSnapshot().activeRoaches) {
      if (now - roach.spawnedAt >= roach.travelDurationMs - POLL_STEP_MS) {
        manager.tryEliminateRoach(roach.id, now);
      }
    }

    samples.push({ survivalMs: now - startAt, count: manager.getSnapshot().activeRoaches.length });
  }

  return samples;
}

describe("Teto de baratas simultâneas nunca é excedido (US1, FR-002/FR-003/FR-007)", () => {
  test("activeRoaches.length nunca excede currentRoachCap(survivalMs) em nenhum instante", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    const samples = simulateSurvivalTrackingMaxConcurrentRoaches(
      manager,
      DIFFICULTY_RAMP_DURATION_MS * 2.2,
    );

    expect(samples.length).toBeGreaterThan(0);
    for (const sample of samples) {
      expect(sample.count).toBeLessThanOrEqual(currentRoachCap(sample.survivalMs));
    }
  });
});

describe("Teto de baratas simultâneas cresce com o tempo de sobrevivência (US1, FR-003)", () => {
  test("o máximo observado numa janela final é maior que o observado numa janela inicial", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    const totalDurationMs = DIFFICULTY_RAMP_DURATION_MS * 2.2;
    const samples = simulateSurvivalTrackingMaxConcurrentRoaches(manager, totalDurationMs);

    const initialWindowEnd = DIFFICULTY_RAMP_DURATION_MS * 0.1;
    const finalWindowStart = totalDurationMs - DIFFICULTY_RAMP_DURATION_MS * 0.1;

    const initialMax = Math.max(
      0,
      ...samples.filter((s) => s.survivalMs <= initialWindowEnd).map((s) => s.count),
    );
    const finalMax = Math.max(
      0,
      ...samples.filter((s) => s.survivalMs >= finalWindowStart).map((s) => s.count),
    );

    expect(initialMax).toBe(ROACH_CAP_BASE);
    expect(finalMax).toBe(ROACH_CAP_MAX);
    expect(finalMax).toBeGreaterThan(initialMax);
  });
});

describe("O teto nunca pede mais baratas do que existem comidas (US2, FR-006)", () => {
  test("com só 1 comida restante, activeRoaches.length nunca excede 1 mesmo com o teto em ROACH_CAP_MAX", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    let spawnCount = 0;
    const unsubscribe = manager.on("roach:spawned", () => {
      spawnCount += 1;
    });

    let onlyOneFoodLeftFrom: number | null = null;
    let now = 0;
    const endAt = DIFFICULTY_RAMP_DURATION_MS;
    while (now < endAt) {
      now += POLL_STEP_MS;
      manager.tick(now);

      const presentCount = manager
        .getSnapshot()
        .foodItems.filter((food) => food.state === "present").length;

      if (presentCount > 1) {
        // Primeiras 8 baratas: deixa roubar normalmente (não elimina) para reduzir as comidas
        // presentes de 9 para 1, uma de cada vez.
        continue;
      }

      // A partir daqui só resta 1 comida — protege-a indefinidamente, eliminando cada barata que
      // a mirar pouco antes de alcançá-la, exatamente como o helper de T006.
      if (onlyOneFoodLeftFrom === null) {
        onlyOneFoodLeftFrom = now;
      }
      for (const roach of manager.getSnapshot().activeRoaches) {
        if (now - roach.spawnedAt >= roach.travelDurationMs - POLL_STEP_MS) {
          manager.tryEliminateRoach(roach.id, now);
        }
      }

      expect(manager.getSnapshot().activeRoaches.length).toBeLessThanOrEqual(1);
    }

    unsubscribe();

    // Confirma que o cenário realmente foi exercitado: passamos pela fase de 8 roubos e chegamos
    // a restar só 1 comida bem antes do fim da rampa (teto já em ROACH_CAP_MAX aqui).
    expect(spawnCount).toBeGreaterThanOrEqual(TOTAL_FOOD_ITEMS - 1);
    expect(onlyOneFoodLeftFrom).not.toBeNull();
    expect(currentRoachCap(endAt)).toBe(ROACH_CAP_MAX);
  });
});

describe("O teto reinicia para o valor inicial após um reinício (US2, FR-010)", () => {
  test("logo após restart(), activeRoaches.length nunca excede ROACH_CAP_BASE mesmo tendo crescido antes", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    // Degrada o teto bem além da base antes de reiniciar.
    simulateSurvivalTrackingMaxConcurrentRoaches(manager, DIFFICULTY_RAMP_DURATION_MS * 1.5);
    expect(currentRoachCap(DIFFICULTY_RAMP_DURATION_MS * 1.5)).toBe(ROACH_CAP_MAX);

    const restartAt = 10_000_000;
    manager.restart(restartAt);

    // Janela curta o suficiente para a concorrência natural já alcançar 2 caso o teto não tivesse
    // resetado (research.md §3: uma partida nova naturalmente já mostra 2 simultâneas por volta de
    // SPAWN_INTERVAL_BASE_MS + TRAVEL_DURATION_BASE_MS).
    const windowMs = SPAWN_INTERVAL_BASE_MS + TRAVEL_DURATION_BASE_MS + POLL_STEP_MS * 4;
    const samplesAfterRestart = simulateSurvivalTrackingMaxConcurrentRoaches(
      manager,
      windowMs,
      restartAt,
    );

    expect(samplesAfterRestart.length).toBeGreaterThan(0);
    const maxAfterRestart = Math.max(...samplesAfterRestart.map((s) => s.count));
    expect(maxAfterRestart).toBe(ROACH_CAP_BASE);
  });
});

describe("O teto nunca cresce além de ROACH_CAP_MAX, mesmo em partidas extremamente longas (US3, FR-005)", () => {
  test("o maior activeRoaches.length observado a partir de DIFFICULTY_RAMP_DURATION_MS nunca excede ROACH_CAP_MAX", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    const samples = simulateSurvivalTrackingMaxConcurrentRoaches(manager, DIFFICULTY_RAMP_DURATION_MS * 5);

    const samplesPastRamp = samples.filter((s) => s.survivalMs >= DIFFICULTY_RAMP_DURATION_MS);
    expect(samplesPastRamp.length).toBeGreaterThan(0);

    const maxPastRamp = Math.max(...samplesPastRamp.map((s) => s.count));
    expect(maxPastRamp).toBe(ROACH_CAP_MAX);
    for (const sample of samplesPastRamp) {
      expect(sample.count).toBeLessThanOrEqual(ROACH_CAP_MAX);
    }
  });
});
