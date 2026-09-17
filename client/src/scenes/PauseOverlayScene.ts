import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, UI_SCALE } from "../config/gameConfig";

/**
 * specs/009-pausar-partida: Scene lançada em paralelo enquanto GameScene está pausada
 * (`this.scene.pause()` desliga o Input Plugin da própria GameScene, então o botão "Continuar"
 * precisa viver numa Scene separada para continuar clicável — research.md §2).
 */
export class PauseOverlayScene extends Phaser.Scene {
  constructor() {
    super("PauseOverlayScene");
  }

  create(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1b1b1b, 0.85);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 45, "Pausado", {
        fontSize: `${Math.round(32 * UI_SCALE)}px`,
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const button = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, "Continuar", {
        fontSize: `${Math.round(28 * UI_SCALE)}px`,
        color: "#ffffff",
        backgroundColor: "#e76f51",
        padding: { x: Math.round(24 * UI_SCALE), y: Math.round(12 * UI_SCALE) },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    button.on("pointerdown", () => this.resumeMatch());

    // specs/009-pausar-partida: mesmo atalho "P" usado para pausar em GameScene também retoma
    // aqui, já que essa Scene tem seu próprio Input Plugin independente (ativo, não pausado).
    this.input.keyboard?.on("keydown-P", () => this.resumeMatch());
  }

  private resumeMatch(): void {
    this.sound.resumeAll();
    this.scene.resume("GameScene");
    this.scene.stop();
  }
}
