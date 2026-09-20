import { describe, expect, test } from "bun:test";
import {
  COMBO_WINDOW_MS,
  DIFFICULTY_RAMP_DURATION_MS,
  SCORE_BASE_POINTS,
  SPAWN_INTERVAL_FLOOR_MS,
} from "../../src/config/gameConfig";
import { comboBonusPoints, reactionBonusPoints } from "../../src/entities/Match";
import { MatchStateManager } from "../../src/systems/MatchStateManager";

describe("MatchStateManager — pontuação (FR-001, FR-003, FR-011)", () => {
  test("tryEliminateRoach() soma SCORE_BASE_POINTS a getSnapshot().score", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    manager.tick(2500);

    const roach = manager.getSnapshot().activeRoaches[0]!;
    // reactionMs = 2000ms, fora de qualquer faixa de bônus de reação (US2) — isola a pontuação base.
    manager.tryEliminateRoach(roach.id, roach.spawnedAt + 2000);

    expect(manager.getSnapshot().score).toBe(SCORE_BASE_POINTS);
  });

  test("três eliminações espaçadas somam exatamente 3 * SCORE_BASE_POINTS, sem perda nem duplicação (SC-004 parcial)", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    // Cada eliminação ocorre bem depois do spawn (reactionMs > 1500ms, fora de qualquer faixa
    // de bônus de reação) e bem espaçada da anterior (> COMBO_WINDOW_MS = 2000ms), para que este
    // teste continue validando só a soma da pontuação base mesmo depois que reactionBonusPoints
    // (US2) e comboBonusPoints (US3) existirem. 1600ms (não 2900ms): precisa continuar menor que
    // TRAVEL_DURATION_FLOOR_MS (specs/011-dificuldade-progressiva) com folga, já que em nenhum
    // destes ticks a barata pode chegar ao prazo antes da eliminação, mesmo na dificuldade máxima.
    manager.tick(2500);
    const roachA = manager.getSnapshot().activeRoaches[0]!;
    manager.tryEliminateRoach(roachA.id, roachA.spawnedAt + 1600);

    manager.tick(8000);
    const roachB = manager.getSnapshot().activeRoaches[0]!;
    manager.tryEliminateRoach(roachB.id, roachB.spawnedAt + 1600);

    manager.tick(13500);
    const roachC = manager.getSnapshot().activeRoaches[0]!;
    manager.tryEliminateRoach(roachC.id, roachC.spawnedAt + 1600);

    expect(manager.getSnapshot().score).toBe(3 * SCORE_BASE_POINTS);
  });

  test("uma comida roubada via tick() não altera score", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    manager.tick(2500);

    const roach = manager.getSnapshot().activeRoaches[0]!;
    manager.tick(roach.spawnedAt + roach.travelDurationMs); // deixa a barata roubar a comida

    expect(manager.getSnapshot().score).toBe(0);
  });

  test("restart() volta score para 0", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    manager.tick(2500);

    const roach = manager.getSnapshot().activeRoaches[0]!;
    manager.tryEliminateRoach(roach.id, roach.spawnedAt + 2000);
    expect(manager.getSnapshot().score).toBe(SCORE_BASE_POINTS);

    manager.restart(0);
    expect(manager.getSnapshot().score).toBe(0);
  });
});

describe("MatchStateManager — bônus de velocidade de reação (FR-004, FR-005)", () => {
  test("eliminação rápida (<=500ms) rende mais pontos que eliminação tardia (>1500ms)", () => {
    const fastManager = new MatchStateManager();
    fastManager.start(0);
    fastManager.tick(2500);
    const fastRoach = fastManager.getSnapshot().activeRoaches[0]!;
    fastManager.tryEliminateRoach(fastRoach.id, fastRoach.spawnedAt + 500);
    const fastScore = fastManager.getSnapshot().score;

    const slowManager = new MatchStateManager();
    slowManager.start(0);
    slowManager.tick(2500);
    const slowRoach = slowManager.getSnapshot().activeRoaches[0]!;
    slowManager.tryEliminateRoach(slowRoach.id, slowRoach.spawnedAt + 2000);
    const slowScore = slowManager.getSnapshot().score;

    expect(fastScore).toBeGreaterThan(slowScore);
    expect(slowScore).toBe(SCORE_BASE_POINTS);
  });
});

/**
 * Notas de temporização (revisadas por specs/013-teto-baratas-simultaneas): estes testes precisam
 * de 2 baratas simultaneamente ativas (A e B) para formar uma sequência de combo realista. Desde
 * specs/013, o teto de baratas simultâneas começa em ROACH_CAP_BASE=1 no início da partida — 2
 * baratas só podem coexistir a partir de `survivalMs >= DIFFICULTY_RAMP_DURATION_MS` (quando o teto
 * já é ROACH_CAP_MAX=2). Por isso, `T0 = DIFFICULTY_RAMP_DURATION_MS` é usado como o instante em que
 * a primeira barata (A) desta seção sempre spawna — a partir daí, cadência de spawn e tempo de
 * viagem também já estão nos seus pisos (`SPAWN_INTERVAL_FLOOR_MS`/`TRAVEL_DURATION_FLOOR_MS`,
 * specs/011), valores fixos e constantes dali em diante, o que simplifica o raciocínio sobre os
 * deltas de tempo usados abaixo (não mudam mais com o tempo, ao contrário da região `BASE`). Os
 * testes usam sempre o mesmo par-base (A spawna em T0 e é eliminada logo depois, em T0+450; B
 * spawna em T0+SPAWN_INTERVAL_FLOOR_MS e é eliminada logo em seguida) para formar uma sequência de
 * combo de 2, e então variam o que acontece depois desse par para isolar cada gatilho de reset —
 * sempre garantindo que, se o gatilho testado não existisse, nem o timeout (COMBO_WINDOW_MS)
 * explicaria o resultado observado.
 */
describe("MatchStateManager — bônus de combo (FR-006, FR-007, SC-003, SC-004)", () => {
  const T0 = DIFFICULTY_RAMP_DURATION_MS;

  function buildComboOfTwo(manager: MatchStateManager): void {
    manager.tick(T0); // spawn A (teto já em ROACH_CAP_MAX=2 a partir daqui)
    const a = manager.getSnapshot().activeRoaches[0]!;
    manager.tick(T0 + SPAWN_INTERVAL_FLOOR_MS); // spawn B (A ainda ativa: teto permite 2)
    const b = manager.getSnapshot().activeRoaches.find((r) => r.id !== a.id)!;

    manager.tryEliminateRoach(a.id, T0 + 450); // reactionMs=450 (+50) — comboStreak -> 1
    manager.tryEliminateRoach(b.id, T0 + SPAWN_INTERVAL_FLOOR_MS + 50); // reactionMs=50 (+50) — comboStreak -> 2, gap=800ms
  }

  test("sequência de 3 eliminações consecutivas rende mais que a soma das pontuações isoladas", () => {
    const chained = new MatchStateManager();
    chained.start(0);
    buildComboOfTwo(chained);

    chained.tick(T0 + SPAWN_INTERVAL_FLOOR_MS * 2); // spawn C (A/B já removidas)
    const c = chained.getSnapshot().activeRoaches[0]!;
    const eC = T0 + SPAWN_INTERVAL_FLOOR_MS * 2 + 100;
    chained.tryEliminateRoach(c.id, eC); // reactionMs=100 (+50), gap=1250ms < COMBO_WINDOW_MS -> comboStreak 3
    const chainedTotal = chained.getSnapshot().score;

    // Equivalente isolado: as mesmas 3 eliminações (mesmo reactionMs cada), mas sem nenhum combo
    // acumulado (cada uma é a única/primeira eliminação de uma partida nova).
    const isolatedReactionMs = [450, 50, 100];
    let isolatedTotal = 0;
    for (const reactionMs of isolatedReactionMs) {
      const solo = new MatchStateManager();
      solo.start(0);
      solo.tick(T0);
      const roach = solo.getSnapshot().activeRoaches[0]!;
      solo.tryEliminateRoach(roach.id, roach.spawnedAt + reactionMs);
      isolatedTotal += solo.getSnapshot().score;
    }

    expect(chainedTotal).toBeGreaterThan(isolatedTotal);
  });

  test("combo reseta após uma comida ser roubada, mesmo bem dentro do que seria a janela de combo (FR-008a, SC-004)", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    manager.tick(T0); // spawn A (deadline T0+TRAVEL_DURATION_FLOOR_MS)
    const a = manager.getSnapshot().activeRoaches[0]!;
    manager.tick(T0 + SPAWN_INTERVAL_FLOOR_MS); // spawn B
    const b = manager.getSnapshot().activeRoaches.find((r) => r.id !== a.id)!;

    const eA = T0 + 450;
    manager.tryEliminateRoach(a.id, eA); // comboStreak -> 1 (B fica ativa, não é eliminada)
    const pointsA = SCORE_BASE_POINTS + reactionBonusPoints(eA - a.spawnedAt) + comboBonusPoints(1);

    // B atinge o prazo em b.spawnedAt + b.travelDurationMs e rouba a comida — reseta o combo.
    manager.tick(b.spawnedAt + b.travelDurationMs);

    manager.tick(b.spawnedAt + b.travelDurationMs + SPAWN_INTERVAL_FLOOR_MS); // spawn C
    const c = manager.getSnapshot().activeRoaches.find((r) => r.id !== a.id && r.id !== b.id)!;

    const eC = c.spawnedAt + 100;
    manager.tryEliminateRoach(c.id, eC); // comboStreak deveria reiniciar -> 1
    const pointsC = SCORE_BASE_POINTS + reactionBonusPoints(eC - c.spawnedAt) + comboBonusPoints(1);

    // B nunca foi eliminada (só roubou comida): não contribui em nada para a pontuação (FR-003).
    // O total final deve ser exatamente A + C, sem perda nem duplicação (SC-004).
    expect(manager.getSnapshot().score).toBe(pointsA + pointsC);
  });

  test("combo reseta após um clique sem acertar nenhuma barata, sem alterar score (FR-008b, FR-003)", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    buildComboOfTwo(manager); // comboStreak -> 2

    const scoreBeforeMiss = manager.getSnapshot().score;
    manager.registerMissedClick();
    expect(manager.getSnapshot().score).toBe(scoreBeforeMiss); // FR-003: miss não altera score

    manager.tick(T0 + SPAWN_INTERVAL_FLOOR_MS * 2); // spawn C
    const c = manager.getSnapshot().activeRoaches[0]!;
    const eC = T0 + SPAWN_INTERVAL_FLOOR_MS * 2 + 100; // gap de 1250ms desde a última eliminação real — < COMBO_WINDOW_MS
    manager.tryEliminateRoach(c.id, eC);
    const gained = manager.getSnapshot().score - scoreBeforeMiss;

    // Sem o reset pelo miss, o combo continuaria em 3 (bônus 50); com o reset, reinicia em 1 (bônus 0).
    expect(gained).toBe(SCORE_BASE_POINTS + reactionBonusPoints(eC - c.spawnedAt) + comboBonusPoints(1));
  });

  test("combo reseta após um intervalo maior que COMBO_WINDOW_MS entre duas eliminações (FR-008c)", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    buildComboOfTwo(manager); // comboStreak -> 2, última eliminação em T0+SPAWN_INTERVAL_FLOOR_MS+50
    const scoreAfterCombo = manager.getSnapshot().score;

    manager.tick(T0 + SPAWN_INTERVAL_FLOOR_MS * 2); // spawn C
    const c = manager.getSnapshot().activeRoaches[0]!;
    // Estoura a janela desde a última eliminação real (T0+SPAWN_INTERVAL_FLOOR_MS+50). Como nenhum
    // tick() intermediário acontece entre o spawn de C e sua eliminação aqui, C não corre risco de
    // roubar a comida sozinho antes disso, mesmo que o "reactionMs" resultante pareça grande.
    const eC = T0 + SPAWN_INTERVAL_FLOOR_MS + 50 + COMBO_WINDOW_MS + 1;
    manager.tryEliminateRoach(c.id, eC);
    const gained = manager.getSnapshot().score - scoreAfterCombo;

    // Sem o reset por timeout, o combo continuaria em 3; com o reset, reinicia em 1.
    expect(gained).toBe(SCORE_BASE_POINTS + reactionBonusPoints(eC - c.spawnedAt) + comboBonusPoints(1));
  });
});
