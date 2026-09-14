import Phaser from "phaser";
import {
  foodItemPosition,
  GAME_HEIGHT,
  GAME_WIDTH,
  HITBOX_PADDING_PX,
  ROACH_VISUAL_RADIUS,
  SHELF_Y_POSITIONS,
  type Point,
} from "../config/gameConfig";
import { shelfIndexFromId, type RiskLevel } from "../entities/Match";
import { positionAt } from "../entities/Roach";
import type { FoodItem } from "../entities/FoodItem";
import { pickTopmostHit, type RoachHitTestInput } from "../systems/CollisionSystem";
import { matchStateManager, type MatchSnapshot } from "../systems/MatchStateManager";

// specs/002-hud-progresso-risco: barra de risco posicionada no topo, acima das prateleiras
// (SHELF_Y_POSITIONS[0] - 40 = 120), sem sobrepor comidas/baratas (FR-007, research.md §4).
const HUD_BAR_WIDTH = 200;
const HUD_BAR_HEIGHT = 10;
const HUD_BAR_Y = 34;
const HUD_BAR_TRACK_COLOR = 0x333333;
// specs/004-sistema-pontuacao (research.md §7): pontuação logo abaixo da barra de risco.
const SCORE_TEXT_Y = HUD_BAR_Y + HUD_BAR_HEIGHT + 8;
const HUD_RISK_COLORS: Record<RiskLevel, number> = {
  safe: 0x2ecc71,
  elevated: 0xf1c40f,
  critical: 0xe74c3c,
};

/**
 * Única scene que lê `MatchStateManager.getSnapshot()`/chama `tick()` a cada frame e traduz o
 * estado de domínio em sprites — nenhuma regra de jogo vive aqui (Princípios I e II).
 */
export class GameScene extends Phaser.Scene {
  private foodSprites = new Map<string, Phaser.GameObjects.Image>();
  private roachSprites = new Map<string, Phaser.GameObjects.Image>();
  private unsubscribers: Array<() => void> = [];
  private hudText!: Phaser.GameObjects.Text;
  private hudBar!: Phaser.GameObjects.Graphics;
  private hudRiskLevel: RiskLevel | null = null;
  /** specs/004-sistema-pontuacao: texto de pontuação, junto ao HUD de progresso/risco. */
  private scoreText!: Phaser.GameObjects.Text;
  /** specs/003-feedback-sonoro-sfx: estado do loop ambiente de voo (data-model.md § "Som ambiente"). */
  private isFlyLoopActive = false;

  constructor() {
    super("GameScene");
  }

  create(): void {
    // specs/003-feedback-sonoro-sfx (research.md §4): guarda defensiva — o SoundManager é
    // global ao Game, não por-Scene, então um loop de uma partida anterior sobreviveria ao
    // restart se não for parado explicitamente aqui.
    this.sound.stopByKey("sfx-fly");
    this.isFlyLoopActive = false;

    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "fridgeBg");
    for (const shelfY of SHELF_Y_POSITIONS) {
      this.add.image(GAME_WIDTH / 2, shelfY + 40, "shelf");
    }

    this.foodSprites.clear();
    this.roachSprites.clear();

    const snapshot = matchStateManager.getSnapshot();
    for (const foodItem of snapshot.foodItems) {
      this.createFoodSprite(foodItem);
    }

    this.hudText = this.add
      .text(GAME_WIDTH / 2, 12, "", { fontSize: "18px", color: "#000000" })
      .setOrigin(0.5, 0);
    this.hudBar = this.add.graphics();
    this.hudRiskLevel = null;
    this.updateHud(snapshot);

    this.scoreText = this.add
      .text(GAME_WIDTH / 2, SCORE_TEXT_Y, "", { fontSize: "16px", color: "#000000" })
      .setOrigin(0.5, 0);
    this.updateScore(snapshot);

    this.unsubscribers = [
      matchStateManager.on("roach:eliminated", ({ roachId }) => this.playRoachEliminated(roachId)),
      matchStateManager.on("roach:eliminated", () => this.updateScore(matchStateManager.getSnapshot())),
      matchStateManager.on("food:stolen", ({ foodItemId }) => this.playFoodStolen(foodItemId)),
      matchStateManager.on("food:stolen", () => this.updateHud(matchStateManager.getSnapshot())),
      matchStateManager.on("match:lost", () => {
        // specs/003 (research.md §4): parar o loop ambiente antes de trocar de scene — o
        // SoundManager é global ao Game e não para sozinho na troca de Scene.
        this.sound.stopByKey("sfx-fly");
        this.isFlyLoopActive = false;
        this.scene.start("GameOverScene");
      }),
    ];

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.handlePointerDown(pointer));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const unsubscribe of this.unsubscribers) {
        unsubscribe();
      }
    });
  }

  override update(_time: number, _delta: number): void {
    matchStateManager.tick(this.time.now);
    const snapshot = matchStateManager.getSnapshot();
    this.syncRoachSprites(snapshot);
    this.syncFlyLoop(snapshot);
  }

  /**
   * specs/003-feedback-sonoro-sfx (FR-005/FR-006/FR-007): liga/desliga o loop ambiente de voo
   * apenas nas transições de borda (0 ↔ >0 baratas ativas), nunca a cada frame.
   */
  private syncFlyLoop(snapshot: MatchSnapshot): void {
    const hasActiveRoaches = snapshot.activeRoaches.length > 0;
    if (hasActiveRoaches && !this.isFlyLoopActive) {
      this.sound.play("sfx-fly", { loop: true });
      this.isFlyLoopActive = true;
    } else if (!hasActiveRoaches && this.isFlyLoopActive) {
      this.sound.stopByKey("sfx-fly");
      this.isFlyLoopActive = false;
    }
  }

  /**
   * FR-001/FR-003 (HUD): número de comidas restantes sempre atualizado; a barra é redesenhada
   * a cada roubo (não a cada frame — Princípio V) para refletir tanto a cor de risco quanto a
   * largura proporcional a comidas restantes/total.
   */
  private updateHud(snapshot: MatchSnapshot): void {
    this.hudText.setText(`${snapshot.foodRemainingCount} / ${snapshot.foodTotalCount}`);
    this.hudRiskLevel = snapshot.riskLevel;
    this.redrawHudBar(snapshot);
  }

  /** specs/004-sistema-pontuacao (FR-009): pontuação atualizada por evento, não por frame. */
  private updateScore(snapshot: MatchSnapshot): void {
    this.scoreText.setText(`Pontuação: ${snapshot.score}`);
  }

  /** FR-002/FR-005 (HUD): largura proporcional a comidas restantes; cor por nível de risco. */
  private redrawHudBar(snapshot: MatchSnapshot): void {
    const x = GAME_WIDTH / 2 - HUD_BAR_WIDTH / 2;
    const ratio =
      snapshot.foodTotalCount === 0 ? 0 : snapshot.foodRemainingCount / snapshot.foodTotalCount;
    this.hudBar.clear();
    this.hudBar.fillStyle(HUD_BAR_TRACK_COLOR, 1);
    this.hudBar.fillRect(x, HUD_BAR_Y, HUD_BAR_WIDTH, HUD_BAR_HEIGHT);
    this.hudBar.fillStyle(HUD_RISK_COLORS[snapshot.riskLevel], 1);
    this.hudBar.fillRect(x, HUD_BAR_Y, HUD_BAR_WIDTH * ratio, HUD_BAR_HEIGHT);
  }

  private createFoodSprite(foodItem: FoodItem): void {
    const shelfIndex = shelfIndexFromId(foodItem.shelfId);
    const { x, y } = foodItemPosition(shelfIndex, foodItem.slotIndex);
    const sprite = this.add.image(x, y, "food");
    this.foodSprites.set(foodItem.id, sprite);
  }

  private foodPositionOf(snapshot: MatchSnapshot, foodItemId: string): Point | undefined {
    const foodItem = snapshot.foodItems.find((item) => item.id === foodItemId);
    if (!foodItem) {
      return undefined;
    }
    return foodItemPosition(shelfIndexFromId(foodItem.shelfId), foodItem.slotIndex);
  }

  private syncRoachSprites(snapshot: MatchSnapshot): void {
    const activeIds = new Set(snapshot.activeRoaches.map((roach) => roach.id));

    for (const [id, sprite] of this.roachSprites) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.roachSprites.delete(id);
      }
    }

    for (const roach of snapshot.activeRoaches) {
      const targetPosition = this.foodPositionOf(snapshot, roach.targetFoodItemId);
      if (!targetPosition) {
        continue;
      }
      const position = positionAt(roach, this.time.now, targetPosition);
      let sprite = this.roachSprites.get(roach.id);
      if (!sprite) {
        sprite = this.add.image(position.x, position.y, "roach");
        this.roachSprites.set(roach.id, sprite);
      } else {
        sprite.setPosition(position.x, position.y);
      }
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    const now = this.time.now;
    const snapshot = matchStateManager.getSnapshot();
    const candidates: RoachHitTestInput[] = [];

    for (const roach of snapshot.activeRoaches) {
      const targetPosition = this.foodPositionOf(snapshot, roach.targetFoodItemId);
      if (!targetPosition) {
        continue;
      }
      candidates.push({
        roach,
        position: positionAt(roach, now, targetPosition),
        visualRadius: ROACH_VISUAL_RADIUS,
      });
    }

    const hit = pickTopmostHit({ x: pointer.x, y: pointer.y }, candidates, HITBOX_PADDING_PX);
    if (hit) {
      matchStateManager.tryEliminateRoach(hit.id, now);
    } else {
      matchStateManager.registerMissedClick(); // specs/004-sistema-pontuacao (FR-008b)
      this.sound.play("sfx-miss");
    }
  }

  /** FR-020: feedback visual breve de queda ao eliminar uma barata; specs/003: + som de acerto. */
  private playRoachEliminated(roachId: string): void {
    this.sound.play("sfx-hit");
    const sprite = this.roachSprites.get(roachId);
    if (!sprite) {
      return;
    }
    this.roachSprites.delete(roachId);
    this.tweens.add({
      targets: sprite,
      y: sprite.y + 40,
      alpha: 0,
      duration: 200,
      onComplete: () => sprite.destroy(),
    });
  }

  /** FR-020: feedback visual breve no espaço da comida ao ser roubada; specs/003: + som de roubo. */
  private playFoodStolen(foodItemId: string): void {
    this.sound.play("sfx-steal");
    const sprite = this.foodSprites.get(foodItemId);
    if (!sprite) {
      return;
    }
    this.foodSprites.delete(foodItemId);
    this.tweens.add({
      targets: sprite,
      scale: 0,
      alpha: 0,
      duration: 200,
      onComplete: () => sprite.destroy(),
    });
  }
}
