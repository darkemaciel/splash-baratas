import { describe, expect, test } from "bun:test";
import {
  currentRoachCap,
  currentSpawnIntervalMs,
  currentTravelDurationMs,
  DIFFICULTY_RAMP_DURATION_MS,
  ROACH_CAP_BASE,
  ROACH_CAP_MAX,
  SPAWN_INTERVAL_BASE_MS,
  SPAWN_INTERVAL_FLOOR_MS,
  TRAVEL_DURATION_BASE_MS,
  TRAVEL_DURATION_FLOOR_MS,
} from "../../src/config/gameConfig";

describe("currentSpawnIntervalMs/currentTravelDurationMs (specs/011-dificuldade-progressiva, FR-001/FR-002)", () => {
  test("em survivalMs=0, cada função retorna exatamente seu valor base", () => {
    expect(currentSpawnIntervalMs(0)).toBe(SPAWN_INTERVAL_BASE_MS);
    expect(currentTravelDurationMs(0)).toBe(TRAVEL_DURATION_BASE_MS);
  });

  test("em survivalMs === DIFFICULTY_RAMP_DURATION_MS, cada função retorna exatamente seu piso", () => {
    expect(currentSpawnIntervalMs(DIFFICULTY_RAMP_DURATION_MS)).toBe(SPAWN_INTERVAL_FLOOR_MS);
    expect(currentTravelDurationMs(DIFFICULTY_RAMP_DURATION_MS)).toBe(TRAVEL_DURATION_FLOOR_MS);
  });

  test("em survivalMs muito maior que DIFFICULTY_RAMP_DURATION_MS, o valor continua exatamente no piso", () => {
    const farBeyondRamp = DIFFICULTY_RAMP_DURATION_MS * 10;
    expect(currentSpawnIntervalMs(farBeyondRamp)).toBe(SPAWN_INTERVAL_FLOOR_MS);
    expect(currentTravelDurationMs(farBeyondRamp)).toBe(TRAVEL_DURATION_FLOOR_MS);
  });

  test("cada função é monotônica não-crescente ao longo do tempo de sobrevivência", () => {
    const samples = [
      0,
      DIFFICULTY_RAMP_DURATION_MS * 0.1,
      DIFFICULTY_RAMP_DURATION_MS * 0.25,
      DIFFICULTY_RAMP_DURATION_MS * 0.5,
      DIFFICULTY_RAMP_DURATION_MS * 0.75,
      DIFFICULTY_RAMP_DURATION_MS * 0.9,
      DIFFICULTY_RAMP_DURATION_MS,
      DIFFICULTY_RAMP_DURATION_MS * 2,
    ];

    for (let i = 1; i < samples.length; i++) {
      expect(currentSpawnIntervalMs(samples[i]!)).toBeLessThanOrEqual(
        currentSpawnIntervalMs(samples[i - 1]!),
      );
      expect(currentTravelDurationMs(samples[i]!)).toBeLessThanOrEqual(
        currentTravelDurationMs(samples[i - 1]!),
      );
    }
  });
});

describe("currentRoachCap (specs/013-teto-baratas-simultaneas, FR-001/FR-002/FR-003/FR-005)", () => {
  test("em survivalMs=0, retorna exatamente ROACH_CAP_BASE", () => {
    expect(currentRoachCap(0)).toBe(ROACH_CAP_BASE);
  });

  test("em survivalMs === DIFFICULTY_RAMP_DURATION_MS, retorna exatamente ROACH_CAP_MAX", () => {
    expect(currentRoachCap(DIFFICULTY_RAMP_DURATION_MS)).toBe(ROACH_CAP_MAX);
  });

  test("em survivalMs muito maior que DIFFICULTY_RAMP_DURATION_MS, o valor continua exatamente em ROACH_CAP_MAX", () => {
    expect(currentRoachCap(DIFFICULTY_RAMP_DURATION_MS * 10)).toBe(ROACH_CAP_MAX);
  });

  test("é monotônica não-decrescente ao longo do tempo de sobrevivência (direção oposta às curvas de specs/011)", () => {
    const samples = [
      0,
      DIFFICULTY_RAMP_DURATION_MS * 0.1,
      DIFFICULTY_RAMP_DURATION_MS * 0.25,
      DIFFICULTY_RAMP_DURATION_MS * 0.5,
      DIFFICULTY_RAMP_DURATION_MS * 0.75,
      DIFFICULTY_RAMP_DURATION_MS * 0.9,
      DIFFICULTY_RAMP_DURATION_MS,
      DIFFICULTY_RAMP_DURATION_MS * 2,
    ];

    for (let i = 1; i < samples.length; i++) {
      expect(currentRoachCap(samples[i]!)).toBeGreaterThanOrEqual(currentRoachCap(samples[i - 1]!));
    }

    expect(currentRoachCap(samples[0]!)).toBe(ROACH_CAP_BASE);
    expect(currentRoachCap(samples.at(-1)!)).toBe(ROACH_CAP_MAX);
  });

  test("nunca retorna um valor fora do intervalo [ROACH_CAP_BASE, ROACH_CAP_MAX]", () => {
    for (const survivalMs of [0, 1, DIFFICULTY_RAMP_DURATION_MS / 2, DIFFICULTY_RAMP_DURATION_MS, DIFFICULTY_RAMP_DURATION_MS * 100]) {
      const cap = currentRoachCap(survivalMs);
      expect(cap).toBeGreaterThanOrEqual(ROACH_CAP_BASE);
      expect(cap).toBeLessThanOrEqual(ROACH_CAP_MAX);
    }
  });
});
