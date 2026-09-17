import { describe, expect, test } from "bun:test";
import {
  createMatch,
  foodRemainingCount,
  foodTotalCount,
  riskLevel,
  type Match,
} from "../../src/entities/Match";
import { createFoodItem, markStolen, type FoodItem } from "../../src/entities/FoodItem";

function matchWithRemaining(total: number, remaining: number): Match {
  const foodItems: FoodItem[] = [];
  for (let i = 0; i < total; i++) {
    foodItems.push(createFoodItem(`food-${i}`, "shelf-0", i));
  }
  for (let i = 0; i < total - remaining; i++) {
    markStolen(foodItems[i]!);
  }
  return {
    shelves: [],
    foodItems,
    activeRoaches: [],
    status: "playing",
    score: 0,
    comboStreak: 0,
    lastEliminationAt: null,
    startedAt: 0,
    endedAt: null,
  };
}

describe("HUD de progresso/risco — contagem (FR-002, FR-003, FR-004)", () => {
  test("foodTotalCount reflete o total real de comidas da partida, não um valor fixo", () => {
    const match = createMatch();
    expect(foodTotalCount(match)).toBe(9);
  });

  test("foodRemainingCount começa igual ao total e decresce a cada comida roubada", () => {
    const match = createMatch();
    expect(foodRemainingCount(match)).toBe(9);

    markStolen(match.foodItems[0]!);
    expect(foodRemainingCount(match)).toBe(8);

    markStolen(match.foodItems[1]!);
    expect(foodRemainingCount(match)).toBe(7);
  });

  test("foodRemainingCount chega a 0 quando todas as comidas são roubadas", () => {
    const match = createMatch();
    for (const item of match.foodItems) {
      markStolen(item);
    }
    expect(foodRemainingCount(match)).toBe(0);
  });
});

describe("HUD de progresso/risco — níveis de risco (FR-005)", () => {
  test("riskLevel é 'safe' quando mais de 50% das comidas originais ainda estão presentes", () => {
    const match = createMatch();
    expect(riskLevel(match)).toBe("safe");

    markStolen(match.foodItems[0]!); // 8/9 ~ 88.9%, ainda 'safe'
    expect(riskLevel(match)).toBe("safe");
  });

  test("riskLevel é 'elevated' quando 50% ou menos restam, com mais de uma comida restante", () => {
    const match = createMatch();
    for (let i = 0; i < 5; i++) {
      markStolen(match.foodItems[i]!); // restam 4/9 (~44.4%)
    }
    expect(foodRemainingCount(match)).toBe(4);
    expect(riskLevel(match)).toBe("elevated");
  });

  test("riskLevel é 'critical' quando resta exatamente uma comida", () => {
    const match = createMatch();
    for (let i = 0; i < 8; i++) {
      markStolen(match.foodItems[i]!);
    }
    expect(foodRemainingCount(match)).toBe(1);
    expect(riskLevel(match)).toBe("critical");
  });

  test("limite exato de 50% restante conta como 'elevated' (partida sintética par)", () => {
    const match = matchWithRemaining(4, 2); // exatamente 50%
    expect(riskLevel(match)).toBe("elevated");
  });

  test("mais de 50% restante conta como 'safe' (partida sintética par)", () => {
    const match = matchWithRemaining(4, 3); // 75%
    expect(riskLevel(match)).toBe("safe");
  });

  test("exatamente 1 restante é sempre 'critical', mesmo com poucas comidas totais", () => {
    const match = matchWithRemaining(4, 1); // 25%, mas remaining === 1 tem prioridade
    expect(riskLevel(match)).toBe("critical");
  });
});
