import { FOOD_ITEMS_PER_SHELF, SHELF_COUNT } from "../config/gameConfig";
import { createFoodItem, type FoodItem } from "./FoodItem";
import { createShelf, type Shelf } from "./Shelf";
import type { Roach } from "./Roach";

export type MatchStatus = "notStarted" | "playing" | "lost";

export interface Match {
  shelves: Shelf[];
  foodItems: FoodItem[];
  activeRoaches: Roach[];
  status: MatchStatus;
}

export function createMatch(): Match {
  const shelves: Shelf[] = [];
  const foodItems: FoodItem[] = [];

  for (let shelfIndex = 0; shelfIndex < SHELF_COUNT; shelfIndex++) {
    const shelfId = `shelf-${shelfIndex}`;
    const foodItemIds: string[] = [];
    for (let slotIndex = 0; slotIndex < FOOD_ITEMS_PER_SHELF; slotIndex++) {
      const foodItem = createFoodItem(`food-${shelfIndex}-${slotIndex}`, shelfId, slotIndex);
      foodItems.push(foodItem);
      foodItemIds.push(foodItem.id);
    }
    shelves.push(createShelf(shelfId, foodItemIds));
  }

  return { shelves, foodItems, activeRoaches: [], status: "playing" };
}

export function createEmptyMatch(): Match {
  return { shelves: [], foodItems: [], activeRoaches: [], status: "notStarted" };
}

export function findFoodItem(match: Match, foodItemId: string): FoodItem | undefined {
  return match.foodItems.find((item) => item.id === foodItemId);
}

export function findRoach(match: Match, roachId: string): Roach | undefined {
  return match.activeRoaches.find((roach) => roach.id === roachId);
}

/** FR-009: nunca mais de uma Roach ativa mirando a mesma FoodItem. */
export function hasActiveRoachTargeting(match: Match, foodItemId: string): boolean {
  return match.activeRoaches.some((roach) => roach.targetFoodItemId === foodItemId);
}

export function presentFoodItemsWithoutActiveRoach(match: Match): FoodItem[] {
  return match.foodItems.filter(
    (item) => item.state === "present" && !hasActiveRoachTargeting(match, item.id),
  );
}

/** FR-010 / SC-004: a partida termina em derrota exatamente quando todas as comidas somem. */
export function allFoodStolen(match: Match): boolean {
  return match.foodItems.every((item) => item.state === "stolen");
}

export function removeRoach(match: Match, roachId: string): void {
  match.activeRoaches = match.activeRoaches.filter((roach) => roach.id !== roachId);
}

/** Deriva o índice numérico de uma prateleira a partir do id gerado por createMatch (`shelf-N`). */
export function shelfIndexFromId(shelfId: string): number {
  const parsed = Number(shelfId.split("-")[1]);
  if (Number.isNaN(parsed)) {
    throw new Error(`Id de prateleira inválido: ${shelfId}`);
  }
  return parsed;
}
