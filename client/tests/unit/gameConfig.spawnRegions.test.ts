import { describe, expect, test } from "bun:test";
import {
  foodItemPosition,
  GAME_HEIGHT,
  GAME_WIDTH,
  nearestSpawnRegion,
  pickSpawnPoint,
  spawnPointCandidates,
  type SpawnRegion,
} from "../../src/config/gameConfig";

// research.md §3: mesma distância euclidiana às 4 âncoras que nearestSpawnPoint já usa hoje,
// calculada à mão para as 9 posições do grid 3x3 (shelfIndex=linha/y, slotIndex=coluna/x).
const EXPECTED_REGION_BY_POSITION: readonly SpawnRegion[][] = [
  ["top", "top", "top"],
  ["left", "bottom", "right"],
  ["bottom", "bottom", "bottom"],
];

describe("nearestSpawnRegion (FR-003, research.md §3)", () => {
  test("reproduz, região a região, a mesma coerência de lado que nearestSpawnPoint tinha hoje", () => {
    for (let shelfIndex = 0; shelfIndex < 3; shelfIndex++) {
      for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
        const target = foodItemPosition(shelfIndex, slotIndex);
        const expected = EXPECTED_REGION_BY_POSITION[shelfIndex]![slotIndex]!;
        expect(nearestSpawnRegion(target)).toBe(expected);
      }
    }
  });
});

describe("spawnPointCandidates (FR-001, FR-002, data-model.md)", () => {
  test("sempre retorna exatamente 3 pontos, todos fora do canvas", () => {
    for (let shelfIndex = 0; shelfIndex < 3; shelfIndex++) {
      for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
        const target = foodItemPosition(shelfIndex, slotIndex);
        const candidates = spawnPointCandidates(target);
        expect(candidates.length).toBe(3);
        for (const point of candidates) {
          const outsideX = point.x < 0 || point.x > GAME_WIDTH;
          const outsideY = point.y < 0 || point.y > GAME_HEIGHT;
          expect(outsideX || outsideY).toBe(true);
        }
      }
    }
  });
});

describe("pickSpawnPoint (contracts/spawn-point-selection.md)", () => {
  test("nunca retorna 'avoid' quando há mais de 1 candidato e 'avoid' pertence à lista", () => {
    const candidates = spawnPointCandidates(foodItemPosition(0, 0));
    expect(candidates.length).toBeGreaterThan(1);
    const avoid = candidates[0]!;

    for (let i = 0; i < 50; i++) {
      const picked = pickSpawnPoint(candidates, avoid);
      expect(picked).not.toEqual(avoid);
    }
  });

  test("retorna o único candidato quando candidates.length === 1, independentemente de avoid", () => {
    const onlyCandidate = spawnPointCandidates(foodItemPosition(0, 0))[0]!;
    const picked = pickSpawnPoint([onlyCandidate], onlyCandidate);
    expect(picked).toEqual(onlyCandidate);
  });

  test("sorteia entre todos os candidatos quando avoid é undefined", () => {
    const candidates = spawnPointCandidates(foodItemPosition(0, 0));
    const picked = pickSpawnPoint(candidates);
    expect(candidates).toContainEqual(picked);
  });
});
