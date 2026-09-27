import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";

/**
 * specs/016-animacao-locomocao-barata: quadros extraídos de docs/references/barata_caminhada.mp4 e
 * barata_voo.mp4 (fundo removido), 128x128 px cada, barata voltada para a direita (cabeça levemente
 * para cima). Desenhados em 2x — GameScene os exibe em escala 0.5 para casar com o tamanho da
 * antiga bolinha placeholder (ROACH_VISUAL_RADIUS).
 */
export const ROACH_FRAME_SIZE_PX = 128;
export const ROACH_WALK_ANIM = "roach-walk";
export const ROACH_FLY_ANIM = "roach-fly";

/**
 * Carrega os assets e gera os sprites placeholder restantes em runtime (constitution Princípio VI —
 * quando houver arte final, estas texturas geradas serão substituídas por arquivos em
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

    // specs/015-cursor-pata-animada (research.md §1/§5, FR-008): primeira imagem de fato carregada
    // de client/public/assets/sprites/ pelo jogo (as texturas de comida/prateleira/fundo são
    // geradas em runtime por generatePlaceholderTextures(); a barata, desde specs/016, usa os
    // spritesheets carregados logo abaixo).
    // paw.png (não .jpg — precisa de canal alfa real) já vem recortada e com fundo transparente. A
    // classe cursor-paw-ready (consumida pelo CSS de index.html) só é ligada no sucesso do
    // carregamento — se o arquivo falhar, a classe nunca é adicionada e o cursor nativo do sistema
    // permanece visível, sem precisar de nenhum handler de loaderror dedicado.
    this.load.image("cursor-paw", "assets/sprites/paw.png");

    const frameConfig = { frameWidth: ROACH_FRAME_SIZE_PX, frameHeight: ROACH_FRAME_SIZE_PX };
    this.load.spritesheet(ROACH_WALK_ANIM, "assets/sprites/roach-walk.png", frameConfig);
    this.load.spritesheet(ROACH_FLY_ANIM, "assets/sprites/roach-fly.png", frameConfig);
    this.load.once("filecomplete-image-cursor-paw", () => {
      document.getElementById("game")?.classList.add("cursor-paw-ready");
    });
  }

  async create(): Promise<void> {
    this.generatePlaceholderTextures();
    this.createRoachAnimations();
    await this.loadHudFont();
    // specs/014-mute-som-jogo (research.md §3): nenhuma Scene além da primeira do array é
    // auto-iniciada pelo Phaser — AudioControlScene precisa ser lançada explicitamente aqui, assim
    // como StartScene logo abaixo.
    this.scene.launch("AudioControlScene");
    this.scene.launch("CursorScene");
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

  /**
   * specs/016-animacao-locomocao-barata: animações em loop (andar/voar). O hit-testing continua
   * usando ROACH_VISUAL_RADIUS como raio fixo, nunca lendo pixels destas texturas.
   */
  private createRoachAnimations(): void {
    this.anims.create({
      key: ROACH_WALK_ANIM,
      frames: this.anims.generateFrameNumbers(ROACH_WALK_ANIM),
      frameRate: 15,
      repeat: -1,
    });
    this.anims.create({
      key: ROACH_FLY_ANIM,
      frames: this.anims.generateFrameNumbers(ROACH_FLY_ANIM),
      frameRate: 20,
      repeat: -1,
    });
  }

  private generatePlaceholderTextures(): void {
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
