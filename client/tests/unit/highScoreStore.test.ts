import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { HIGH_SCORE_STORAGE_KEY } from "../../src/config/gameConfig";
import { getRanking, recordScore } from "../../src/systems/HighScoreStore";

/**
 * specs/012-high-score-local (research.md §2): o runtime de testes (Bun) não define
 * `localStorage` globalmente por padrão — cada teste injeta seu próprio fake.
 */
class FakeLocalStorage {
  private readonly store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

beforeEach(() => {
  (globalThis as { localStorage?: unknown }).localStorage = new FakeLocalStorage();
});

afterEach(() => {
  delete (globalThis as { localStorage?: unknown }).localStorage;
});

describe("getRanking (specs/012-high-score-local, FR-007/FR-010)", () => {
  test("retorna [] quando nada foi salvo ainda", () => {
    expect(getRanking()).toEqual([]);
  });

  test("retorna [] quando o valor salvo não é JSON válido", () => {
    globalThis.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, "abc");
    expect(getRanking()).toEqual([]);
  });

  test("retorna [] quando o valor salvo está no formato antigo de número único", () => {
    // Uma versão bem anterior desta feature salvava um único número como string (research.md §6).
    globalThis.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, "120");
    expect(getRanking()).toEqual([]);
  });

  test("retorna [] quando o valor salvo está no formato antigo de ranking de números puros", () => {
    // Versão anterior a guardar o nome do jogador salvava só números, sem { name, score }.
    globalThis.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, JSON.stringify([10, 90, 50]));
    expect(getRanking()).toEqual([]);
  });

  test("retorna [] quando o array salvo contém entradas malformadas", () => {
    globalThis.localStorage.setItem(
      HIGH_SCORE_STORAGE_KEY,
      JSON.stringify([{ name: "Ana", score: 10 }, { name: "Bad" }, { score: -5, name: "Neg" }]),
    );
    expect(getRanking()).toEqual([]);
  });

  test("retorna o ranking salvo ordenado da maior para a menor pontuação", () => {
    globalThis.localStorage.setItem(
      HIGH_SCORE_STORAGE_KEY,
      JSON.stringify([
        { name: "Ana", score: 10 },
        { name: "Bruno", score: 90 },
        { name: "Caio", score: 50 },
      ]),
    );
    expect(getRanking()).toEqual([
      { name: "Bruno", score: 90 },
      { name: "Caio", score: 50 },
      { name: "Ana", score: 10 },
    ]);
  });
});

describe("recordScore (specs/012-high-score-local, FR-002/FR-003/FR-004)", () => {
  test("com ranking vazio, a pontuação sempre entra na posição 1", () => {
    expect(recordScore("Ana", 0)).toEqual({ ranking: [{ name: "Ana", score: 0 }], position: 1 });
    expect(getRanking()).toEqual([{ name: "Ana", score: 0 }]);
  });

  test("com menos de 5 entradas, a pontuação sempre entra, na posição correspondente", () => {
    recordScore("Ana", 100);
    recordScore("Bruno", 50);
    expect(recordScore("Caio", 75)).toEqual({
      ranking: [
        { name: "Ana", score: 100 },
        { name: "Caio", score: 75 },
        { name: "Bruno", score: 50 },
      ],
      position: 2,
    });
  });

  test("com ranking cheio (5), pontuação maior que a menor desloca a menor entrada", () => {
    ["Ana", "Bruno", "Caio", "Duda", "Eva"].forEach((name, index) =>
      recordScore(name, [100, 90, 80, 70, 60][index]!),
    );
    expect(recordScore("Fabio", 85)).toEqual({
      ranking: [
        { name: "Ana", score: 100 },
        { name: "Bruno", score: 90 },
        { name: "Fabio", score: 85 },
        { name: "Caio", score: 80 },
        { name: "Duda", score: 70 },
      ],
      position: 3,
    });
  });

  test("com ranking cheio (5), pontuação igual à menor não altera o ranking", () => {
    const names = ["Ana", "Bruno", "Caio", "Duda", "Eva"];
    const scores = [100, 90, 80, 70, 60];
    names.forEach((name, index) => recordScore(name, scores[index]!));
    const before = getRanking();
    expect(recordScore("Novo", 60)).toEqual({ ranking: before, position: null });
    expect(getRanking()).toEqual(before);
  });

  test("com ranking cheio (5), pontuação menor que a menor não altera o ranking", () => {
    const names = ["Ana", "Bruno", "Caio", "Duda", "Eva"];
    const scores = [100, 90, 80, 70, 60];
    names.forEach((name, index) => recordScore(name, scores[index]!));
    const before = getRanking();
    expect(recordScore("Novo", 10)).toEqual({ ranking: before, position: null });
    expect(getRanking()).toEqual(before);
  });
});

describe("HighScoreStore resiliência a falha de storage (specs/012-high-score-local, FR-009)", () => {
  test("getRanking não lança e retorna [] quando localStorage.getItem lança exceção", () => {
    (globalThis as { localStorage: unknown }).localStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };

    expect(() => getRanking()).not.toThrow();
    expect(getRanking()).toEqual([]);
  });

  test("recordScore não lança e retorna a entrada mesmo quando a escrita falha", () => {
    (globalThis as { localStorage: unknown }).localStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };

    expect(() => recordScore("Ana", 50)).not.toThrow();
    expect(recordScore("Ana", 50)).toEqual({ ranking: [{ name: "Ana", score: 50 }], position: 1 });
  });
});
