import { describe, expect, test } from "bun:test";
import { COMBO_WINDOW_MS, SCORE_BASE_POINTS } from "../../src/config/gameConfig";
import {
  applyEliminationScore,
  comboBonusPoints,
  createEmptyMatch,
  createMatch,
  reactionBonusPoints,
  resetComboStreak,
} from "../../src/entities/Match";

describe("Sistema de pontuação — estado inicial (FR-001, FR-006, FR-011)", () => {
  test("createMatch() inicializa score/comboStreak/lastEliminationAt zerados", () => {
    const match = createMatch();
    expect(match.score).toBe(0);
    expect(match.comboStreak).toBe(0);
    expect(match.lastEliminationAt).toBeNull();
  });

  test("createEmptyMatch() também inicializa score/comboStreak/lastEliminationAt zerados", () => {
    const match = createEmptyMatch();
    expect(match.score).toBe(0);
    expect(match.comboStreak).toBe(0);
    expect(match.lastEliminationAt).toBeNull();
  });
});

describe("Sistema de pontuação — pontuação base por eliminação (FR-002)", () => {
  test("uma eliminação isolada soma exatamente SCORE_BASE_POINTS e retorna esse valor", () => {
    const match = createMatch();
    const now = 20000;
    // Reação bem além de qualquer faixa de bônus (US2) e primeira eliminação da partida (sem
    // bônus de combo, US3) — garante que este teste continue validando só a pontuação base
    // mesmo depois que reactionBonusPoints/comboBonusPoints existirem.
    const spawnedAt = now - 10000;

    const points = applyEliminationScore(match, now, spawnedAt);

    expect(points).toBe(SCORE_BASE_POINTS);
    expect(match.score).toBe(SCORE_BASE_POINTS);
  });
});

describe("Sistema de pontuação — bônus de velocidade de reação (FR-004, FR-005)", () => {
  test("reactionMs no limite exato de 500ms ainda recebe o bônus da 1ª faixa (+50)", () => {
    expect(reactionBonusPoints(500)).toBe(50);
  });

  test("reactionMs no limite exato de 1000ms recebe o bônus da 2ª faixa (+25)", () => {
    expect(reactionBonusPoints(1000)).toBe(25);
  });

  test("reactionMs no limite exato de 1500ms recebe o bônus da 3ª faixa (+10)", () => {
    expect(reactionBonusPoints(1500)).toBe(10);
  });

  test("reactionMs acima de 1500ms não recebe bônus (+0)", () => {
    expect(reactionBonusPoints(1501)).toBe(0);
    expect(reactionBonusPoints(3000)).toBe(0);
  });
});

describe("Sistema de pontuação — bônus de combo (FR-006, FR-007)", () => {
  test("comboBonusPoints cresce linearmente a partir da 2ª eliminação da sequência", () => {
    expect(comboBonusPoints(1)).toBe(0);
    expect(comboBonusPoints(2)).toBe(25);
    expect(comboBonusPoints(3)).toBe(50);
    expect(comboBonusPoints(5)).toBe(100);
  });
});

describe("Sistema de pontuação — reset de combo (FR-008)", () => {
  test("resetComboStreak zera comboStreak sem afetar score/lastEliminationAt", () => {
    const match = createMatch();
    applyEliminationScore(match, 1000, 0); // comboStreak passa a 1, score > 0, lastEliminationAt = 1000
    const scoreBefore = match.score;
    const lastEliminationBefore = match.lastEliminationAt;

    resetComboStreak(match);

    expect(match.comboStreak).toBe(0);
    expect(match.score).toBe(scoreBefore);
    expect(match.lastEliminationAt).toBe(lastEliminationBefore);
  });

  test("uma eliminação após estourar COMBO_WINDOW_MS reinicia a sequência (sem bônus de combo)", () => {
    const match = createMatch();
    applyEliminationScore(match, 1000, 1000); // 1ª eliminação: comboStreak = 1
    applyEliminationScore(match, 2000, 2000); // dentro da janela: comboStreak = 2 (bônus de combo)
    expect(match.comboStreak).toBe(2);

    const now = 2000 + COMBO_WINDOW_MS + 1; // estoura a janela desde a última eliminação
    const points = applyEliminationScore(match, now, now - 10000); // reação lenta, sem bônus de reação
    expect(match.comboStreak).toBe(1); // reiniciou e contou esta eliminação como a 1ª da nova sequência
    expect(points).toBe(SCORE_BASE_POINTS); // sem bônus de combo (comboStreak volta a 1)
  });
});
