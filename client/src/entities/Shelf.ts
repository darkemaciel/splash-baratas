export interface Shelf {
  readonly id: string;
  readonly foodItemIds: string[];
}

export function createShelf(id: string, foodItemIds: string[]): Shelf {
  return { id, foodItemIds };
}
