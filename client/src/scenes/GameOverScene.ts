import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import { matchStateManager } from "../systems/MatchStateManager";

/**
 * FR-011/FR-012: tela final de derrota com opção de reiniciar sem recarregar a página.
 */
export class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1b1b1b, 0.85);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, "Todas as comidas foram roubadas!\nVocê perdeu.", {
        fontSize: "32px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);

    const button = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, "Reiniciar", {
        fontSize: "28px",
        color: "#ffffff",
        backgroundColor: "#e76f51",
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const unsubscribe = matchStateManager.on("match:started", () => {
      unsubscribe();
      this.scene.start("GameScene");
    });

    button.on("pointerdown", () => {
      matchStateManager.restart(this.time.now);
    });
  }
}
