import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, ROACH_VISUAL_RADIUS } from "../config/gameConfig";

/**
 * Gera sprites placeholder em runtime (constitution Princípio VI — nenhuma arte final ainda
 * existe; quando houver, estas texturas geradas serão substituídas por arquivos em
 * client/public/assets/sprites, sem mudar o contrato de texture keys usado pelas outras scenes).
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  /**
   * specs/003-feedback-sonoro-sfx: única scene que carrega assets de áudio. `walk.mp3`
   * deliberadamente NÃO é carregado aqui — reservado para uma futura feature de locomoção
   * "andando" ainda não especificada (FR-011, contracts/audio-triggers.md).
   */
  preload(): void {
    this.load.audio("sfx-hit", "assets/audio/hit.mp3");
    this.load.audio("sfx-miss", "assets/audio/miss.mp3");
    this.load.audio("sfx-steal", "assets/audio/steal.mp3");
    this.load.audio("sfx-fly", "assets/audio/fly.mp3");
  }

  async create(): Promise<void> {
    this.generatePlaceholderTextures();
    await this.loadHudFont();
    // specs/014-mute-som-jogo (research.md §3): nenhuma Scene além da primeira do array é
    // auto-iniciada pelo Phaser — AudioControlScene precisa ser lançada explicitamente aqui, assim
    // como StartScene logo abaixo.
    this.scene.launch("AudioControlScene");
    this.scene.start("StartScene");
  }

  /**
   * specs/005-hud-vida-vertical (research.md §3): garante que a fonte "Fredoka" (@font-face em
   * index.html) já esteja pronta antes de qualquer Scene de gameplay criar texto — Phaser
   * desenha texto em canvas, que não reflui sozinho se a fonte trocar depois do primeiro
   * render. Teto de 1s: se a fonte não carregar a tempo, o jogo segue com a pilha de fallback
   * CSS em vez de travar o boot.
   */
  private async loadHudFont(): Promise<void> {
    const fontReady = document.fonts.load('bold 28px "Fredoka"').then(() => undefined);
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 1000));
    await Promise.race([fontReady, timeout]);
  }

  private generatePlaceholderTextures(): void {
    const roach = this.make.graphics({ x: 0, y: 0 }, false);
    roach.fillStyle(0x4a3728, 1);
    roach.fillCircle(ROACH_VISUAL_RADIUS, ROACH_VISUAL_RADIUS, ROACH_VISUAL_RADIUS);
    roach.generateTexture("roach", ROACH_VISUAL_RADIUS * 2, ROACH_VISUAL_RADIUS * 2);
    roach.destroy();

    const food = this.make.graphics({ x: 0, y: 0 }, false);
    food.fillStyle(0xffb703, 1);
    food.fillRoundedRect(0, 0, 60, 60, 10);
    food.generateTexture("food", 60, 60);
    food.destroy();

    const shelf = this.make.graphics({ x: 0, y: 0 }, false);
    shelf.fillStyle(0x8d99ae, 1);
    shelf.fillRect(0, 0, GAME_WIDTH - 120, 20);
    shelf.generateTexture("shelf", GAME_WIDTH - 120, 20);
    shelf.destroy();

    const fridgeBg = this.make.graphics({ x: 0, y: 0 }, false);
    fridgeBg.fillStyle(0xe8f1f2, 1);
    fridgeBg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    fridgeBg.generateTexture("fridgeBg", GAME_WIDTH, GAME_HEIGHT);
    fridgeBg.destroy();
  }
}
