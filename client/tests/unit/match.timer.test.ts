import { describe, expect, test } from "bun:test";
import { elapsedMs, formatElapsedTime } from "../../src/entities/Match";

describe("Cronômetro de tempo de sobrevivência — elapsedMs (FR-002, FR-003, FR-004, FR-005)", () => {
  test("partida em andamento (endedAt null) retorna now - startedAt", () => {
    expect(elapsedMs({ startedAt: 1000, endedAt: null }, 4000)).toBe(3000);
  });

  test("nunca retorna negativo mesmo se now < startedAt", () => {
    expect(elapsedMs({ startedAt: 5000, endedAt: null }, 1000)).toBe(0);
  });

  // specs/007-tempo-de-sobrevivencia (US2, FR-005): não é um teste "que falha" no sentido do TDD
  // clássico — elapsedMs já foi implementado por completo (incluindo este ramo) em T009; funciona
  // como teste de confirmação/regressão para o ramo de partida encerrada, antes de a orquestração
  // que efetivamente define `endedAt` (T015) existir.
  test("partida encerrada (endedAt definido) retorna endedAt - startedAt, ignorando now", () => {
    expect(elapsedMs({ startedAt: 1000, endedAt: 6000 }, 999999)).toBe(5000);
  });
});

describe("Cronômetro de tempo de sobrevivência — formatElapsedTime (FR-008)", () => {
  test.each([
    [0, "00:00"],
    [5000, "00:05"],
    [65000, "01:05"],
    [599000, "09:59"],
    [600000, "10:00"],
    [3661000, "61:01"], // dezenas de minutos (Edge Case da spec) — sem rollover para horas
  ])("formatElapsedTime(%i) === %s", (ms, expected) => {
    expect(formatElapsedTime(ms)).toBe(expected);
  });
});
