import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { AUDIO_MUTE_STORAGE_KEY } from "../../src/config/gameConfig";
import { getMuted, setMuted } from "../../src/systems/AudioPreferenceStore";

/**
 * specs/014-mute-som-jogo (research.md §2): mesmo padrão de fake localStorage já usado em
 * highScoreStore.test.ts — o runtime de testes (Bun) não define `localStorage` globalmente.
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

describe("getMuted (specs/014-mute-som-jogo, FR-007, Clarifications Q1)", () => {
  test("retorna false quando nada foi salvo ainda (padrão: som ativo)", () => {
    expect(getMuted()).toBe(false);
  });

  test("retorna true depois de um setMuted(true) anterior", () => {
    setMuted(true);
    expect(getMuted()).toBe(true);
  });

  test("retorna false depois de um setMuted(false) anterior", () => {
    setMuted(true);
    setMuted(false);
    expect(getMuted()).toBe(false);
  });

  test("retorna false quando o valor salvo não é JSON válido", () => {
    globalThis.localStorage.setItem(AUDIO_MUTE_STORAGE_KEY, "abc");
    expect(getMuted()).toBe(false);
  });

  test("retorna false quando o valor salvo não é um boolean", () => {
    globalThis.localStorage.setItem(AUDIO_MUTE_STORAGE_KEY, JSON.stringify("true"));
    expect(getMuted()).toBe(false);
  });
});

describe("AudioPreferenceStore resiliência a falha de storage (specs/014-mute-som-jogo, FR-007, Clarifications Q2)", () => {
  test("getMuted não lança e retorna false quando localStorage.getItem lança exceção", () => {
    (globalThis as { localStorage: unknown }).localStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };

    expect(() => getMuted()).not.toThrow();
    expect(getMuted()).toBe(false);
  });

  test("setMuted não lança quando localStorage.setItem lança exceção", () => {
    (globalThis as { localStorage: unknown }).localStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };

    expect(() => setMuted(true)).not.toThrow();
  });

  test("getMuted retorna false quando localStorage está indisponível", () => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
    expect(() => getMuted()).not.toThrow();
    expect(getMuted()).toBe(false);
  });

  test("setMuted não lança quando localStorage está indisponível", () => {
    delete (globalThis as { localStorage?: unknown }).localStorage;
    expect(() => setMuted(true)).not.toThrow();
  });
});
