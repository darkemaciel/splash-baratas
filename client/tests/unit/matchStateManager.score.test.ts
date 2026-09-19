import { describe, expect, test } from "bun:test";
import { COMBO_WINDOW_MS, SCORE_BASE_POINTS } from "../../src/config/gameConfig";
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
 * Notas de temporização (descobertas ao escrever estes testes — ver research.md §4): com
 * SPAWN_INTERVAL_MS=2500 e TRAVEL_DURATION_MS=3000, no máximo 2 baratas ficam simultaneamente
 * ativas antes que a mais antiga expire. Por isso, os testes abaixo usam sempre o mesmo par-base
 * (A spawna em 2500 e é eliminada perto do seu prazo, em 5450; B spawna em 5000 e é eliminada logo
 * em seguida, em 5500) para formar uma sequência de combo de 2, e então variam o que acontece
 * depois desse par para isolar cada gatilho de reset — sempre garantindo que, se o gatilho testado
 * não existisse, nem o timeout (COMBO_WINDOW_MS) explicaria o resultado observado.
 */
describe("MatchStateManager — bônus de combo (FR-006, FR-007, SC-003, SC-004)", () => {
  function buildComboOfTwo(manager: MatchStateManager): void {
    manager.tick(2500); // spawn A
    const a = manager.getSnapshot().activeRoaches[0]!;
    manager.tick(5000); // spawn B (A ainda seguro: 5000-2500=2500 < TRAVEL_DURATION_MS)
    const b = manager.getSnapshot().activeRoaches.find((r) => r.id !== a.id)!;

    manager.tryEliminateRoach(a.id, 5450); // reactionMs=2950 (sem bônus) — comboStreak -> 1
    manager.tryEliminateRoach(b.id, 5500); // reactionMs=500 (+50) — comboStreak -> 2, gap=50ms
  }

  test("sequência de 3 eliminações consecutivas rende mais que a soma das pontuações isoladas", () => {
    const chained = new MatchStateManager();
    chained.start(0);
    buildComboOfTwo(chained);

    chained.tick(7500); // spawn C (A/B já removidas — sem risco de expirar nenhuma delas)
    const c = chained.getSnapshot().activeRoaches[0]!;
    chained.tryEliminateRoach(c.id, 7600); // reactionMs=100 (+50), gap=2100ms < COMBO_WINDOW_MS -> comboStreak 3
    const chainedTotal = chained.getSnapshot().score;

    // Equivalente isolado: as mesmas 3 eliminações (mesmo reactionMs cada), mas sem nenhum combo
    // acumulado (cada uma é a única/primeira eliminação de uma partida nova).
    const isolatedReactionMs = [2950, 500, 100];
    let isolatedTotal = 0;
    for (const reactionMs of isolatedReactionMs) {
      const solo = new MatchStateManager();
      solo.start(0);
      solo.tick(2500);
      const roach = solo.getSnapshot().activeRoaches[0]!;
      solo.tryEliminateRoach(roach.id, roach.spawnedAt + reactionMs);
      isolatedTotal += solo.getSnapshot().score;
    }

    expect(chainedTotal).toBeGreaterThan(isolatedTotal);
  });

  test("combo reseta após uma comida ser roubada, mesmo bem dentro do que seria a janela de combo (FR-008a, SC-004)", () => {
    const manager = new MatchStateManager();
    manager.start(0);

    manager.tick(2500); // spawn A (deadline 5500)
    const a = manager.getSnapshot().activeRoaches[0]!;
    manager.tick(5000); // spawn B (deadline 8000)
    const b = manager.getSnapshot().activeRoaches.find((r) => r.id !== a.id)!;

    const eA = 5450;
    manager.tryEliminateRoach(a.id, eA); // comboStreak -> 1 (B fica ativa, não é eliminada)
    const pointsA = SCORE_BASE_POINTS + reactionBonusPoints(eA - a.spawnedAt) + comboBonusPoints(1);

    manager.tick(7500); // spawn C (B ainda segura: 7500-5000=2500 < 3000)
    const c = manager.getSnapshot().activeRoaches.find((r) => r.id !== a.id && r.id !== b.id)!;

    // B atinge o prazo exatamente aqui (8000-5000=3000) e rouba a comida — reseta o combo. O
    // intervalo até a próxima eliminação de C será de só 550ms, bem menor que COMBO_WINDOW_MS
    // (3000ms): se o reset por roubo não existisse, o timeout também não teria disparado a tempo.
    manager.tick(b.spawnedAt + b.travelDurationMs);

    const eC = 8050;
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

    manager.tick(7500); // spawn C
    const c = manager.getSnapshot().activeRoaches[0]!;
    const eC = 7600; // gap de 2100ms desde a última eliminação real (5500) — < COMBO_WINDOW_MS
    manager.tryEliminateRoach(c.id, eC);
    const gained = manager.getSnapshot().score - scoreBeforeMiss;

    // Sem o reset pelo miss, o combo continuaria em 3 (bônus 50); com o reset, reinicia em 1 (bônus 0).
    expect(gained).toBe(SCORE_BASE_POINTS + reactionBonusPoints(eC - c.spawnedAt) + comboBonusPoints(1));
  });

  test("combo reseta após um intervalo maior que COMBO_WINDOW_MS entre duas eliminações (FR-008c)", () => {
    const manager = new MatchStateManager();
    manager.start(0);
    buildComboOfTwo(manager); // comboStreak -> 2, última eliminação em t=5500
    const scoreAfterCombo = manager.getSnapshot().score;

    manager.tick(7500); // spawn C
    const c = manager.getSnapshot().activeRoaches[0]!;
    const eC = 5500 + COMBO_WINDOW_MS + 1; // estoura a janela desde a última eliminação (t=5500)
    manager.tryEliminateRoach(c.id, eC);
    const gained = manager.getSnapshot().score - scoreAfterCombo;

    // Sem o reset por timeout, o combo continuaria em 3; com o reset, reinicia em 1.
    expect(gained).toBe(SCORE_BASE_POINTS + reactionBonusPoints(eC - c.spawnedAt) + comboBonusPoints(1));
  });
});
