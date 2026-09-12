import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import { matchStateManager } from "../systems/MatchStateManager";

/**
 * FR-001: tela inicial — nenhuma comida/prateleira/barata de partida é exibida aqui (US3).
 */
export class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }

  create(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "fridgeBg");
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, "Baratas na Geladeira", {
        fontSize: "40px",
        color: "#1b1b1b",
      })
      .setOrigin(0.5);

    const button = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, "Iniciar", {
        fontSize: "28px",
        color: "#ffffff",
        backgroundColor: "#2a9d8f",
        padding: { x: 24, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const unsubscribe = matchStateManager.on("match:started", () => {
      unsubscribe();
      this.scene.start("GameScene");
    });

    button.on("pointerdown", () => {
      matchStateManager.start(this.time.now);
    });
  }
}
