export type FoodItemState = "present" | "stolen";

export interface FoodItem {
  readonly id: string;
  readonly shelfId: string;
  readonly slotIndex: number;
  state: FoodItemState;
}

export function createFoodItem(id: string, shelfId: string, slotIndex: number): FoodItem {
  return { id, shelfId, slotIndex, state: "present" };
}

/**
 * FR-008: uma comida roubada nunca pode ser restaurada na mesma partida — a única transição
 * válida é present -> stolen.
 */
export function markStolen(foodItem: FoodItem): void {
  if (foodItem.state !== "present") {
    return;
  }
  foodItem.state = "stolen";
}

export function isPresent(foodItem: FoodItem): boolean {
  return foodItem.state === "present";
}
