import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import { COR, MOVIMENTO, TRACO } from "../config/theme";

// specs/017-design-system-grotesco (research §11): medidas do cenário gerado em runtime.
const SHELF_HEIGHT = 20;
const SHELF_RADIUS = 8;
const SHELF_STROKE_ROOM = 4;
const FOOD_TEXTURE_SIZE = 60;
const FOOD_RADIUS = 14;

/**
 * specs/016-animacao-locomocao-barata: quadros extraídos de docs/references/barata_caminhada.mp4 e
 * barata_voo.mp4 (fundo removido), 128x128 px cada, barata voltada para a direita (cabeça levemente
 * para cima). Desenhados em 2x — GameScene os exibe em escala 0.5 para casar com o tamanho da
 * antiga bolinha placeholder (ROACH_VISUAL_RADIUS).
 */
export const ROACH_FRAME_SIZE_PX = 128;
export const ROACH_WALK_ANIM = "roach-walk";

/** specs/017-design-system-grotesco: texture keys dos ícones do design system. */
export const ICONE = {
  pausar: "icone-pausar",
  som: "icone-som",
  tempo: "icone-tempo",
  coracao: "icone-coracao",
} as const;
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

    // specs/017-design-system-grotesco (research §6): ícones do design system rasterizados em 2x
    // (exibidos pela metade pelos componentes de ui/, como os sprites), para ficarem nítidos no
    // Scale.FIT.
    this.load.svg(ICONE.pausar, "assets/ui/icones/pausar.svg", { width: 52, height: 52 });
    this.load.svg(ICONE.som, "assets/ui/icones/som.svg", { width: 52, height: 52 });
    this.load.svg(ICONE.tempo, "assets/ui/icones/tempo.svg", { width: 44, height: 44 });
    this.load.svg(ICONE.coracao, "assets/ui/icones/coracao-cheio.svg", { width: 44, height: 40 });
  }

  async create(): Promise<void> {
    this.generatePlaceholderTextures();
    this.createRoachAnimations();
    await this.loadFonts();
    // specs/014-mute-som-jogo (research.md §3): nenhuma Scene além da primeira do array é
    // auto-iniciada pelo Phaser — AudioControlScene precisa ser lançada explicitamente aqui, assim
    // como StartScene logo abaixo.
    this.scene.launch("AudioControlScene");
    this.scene.launch("CursorScene");
    this.scene.start("StartScene");
  }

  /**
   * specs/017-design-system-grotesco (FR-003, research §3): garante que as fontes do design system
   * (@font-face em src/styles/tokens.css) estejam prontas antes de qualquer Scene criar texto —
   * Phaser desenha texto em canvas, que não reflui sozinho se a fonte trocar depois do primeiro
   * render. Os pesos pedidos batem com os @font-face (sem isso o gate não encontra a face). Teto de
   * 1s: se as fontes não carregarem a tempo, o jogo segue com a pilha de fallback em vez de travar.
   */
  private async loadFonts(): Promise<void> {
    const fontsReady = Promise.all([
      document.fonts.load('400 28px "Luckiest Guy"'),
      document.fonts.load('600 16px "Baloo 2"'),
      document.fonts.load('700 16px "Baloo 2"'),
      document.fonts.load('800 16px "Baloo 2"'),
    ]).then(() => undefined);
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 1000));
    await Promise.race([fontsReady.catch(() => undefined), timeout]);
  }

  /**
   * specs/016-animacao-locomocao-barata: animações em loop (andar/voar). O hit-testing continua
   * usando ROACH_VISUAL_RADIUS como raio fixo, nunca lendo pixels destas texturas.
   */
  private createRoachAnimations(): void {
    this.anims.create({
      key: ROACH_WALK_ANIM,
      frames: this.anims.generateFrameNumbers(ROACH_WALK_ANIM),
      frameRate: MOVIMENTO.barataAndando.fps,
      repeat: -1,
    });
    this.anims.create({
      key: ROACH_FLY_ANIM,
      frames: this.anims.generateFrameNumbers(ROACH_FLY_ANIM),
      frameRate: MOVIMENTO.barataVoando.fps,
      repeat: -1,
    });
  }

  /**
   * specs/017-design-system-grotesco (FR-018, research §11): cenário da geladeira com cores chapadas
   * e contorno preto do design system — mesmas texture keys, mesmos tamanhos visíveis e mesmos
   * centros (a geometria de clique não depende destas texturas: a hitbox da barata é fixa).
   */
  private generatePlaceholderTextures(): void {
    this.generateFoodTexture();

    // Prateleira: corpo branco de (GAME_WIDTH − 120) × 20 com contorno; a textura ganha
    // SHELF_STROKE_ROOM px em cada eixo só para caber o traço, mantendo o mesmo centro.
    const shelfWidth = GAME_WIDTH - 120;
    const shelf = this.make.graphics({ x: 0, y: 0 }, false);
    const half = SHELF_STROKE_ROOM / 2;
    shelf.fillStyle(COR.branco, 1);
    shelf.fillRoundedRect(half, half, shelfWidth, SHELF_HEIGHT, SHELF_RADIUS);
    shelf.lineStyle(TRACO.ui, COR.traco, 1);
    shelf.strokeRoundedRect(half, half, shelfWidth, SHELF_HEIGHT, SHELF_RADIUS);
    shelf.generateTexture("shelf", shelfWidth + SHELF_STROKE_ROOM, SHELF_HEIGHT + SHELF_STROKE_ROOM);
    shelf.destroy();

    const fridgeBg = this.make.graphics({ x: 0, y: 0 }, false);
    fridgeBg.fillStyle(COR.ceu, 1);
    fridgeBg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    fridgeBg.generateTexture("fridgeBg", GAME_WIDTH, GAME_HEIGHT);
    fridgeBg.destroy();
  }

  /**
   * Doce embrulhado (design system § Ilustração → Itens): bolha laranja com contorno de traço-arte,
   * pontas do embrulho em creme e dois traços curtos de brilho. Textura de 60 × 60, como antes.
   */
  private generateFoodTexture(): void {
    const size = FOOD_TEXTURE_SIZE;
    const food = this.make.graphics({ x: 0, y: 0 }, false);
    const inset = TRACO.arte;
    const wrapperWidth = 12;
    const bodyX = inset + wrapperWidth - 2;
    const bodyWidth = size - 2 * bodyX;
    const bodyY = inset + 8;
    const bodyHeight = size - 2 * bodyY;
    const mid = size / 2;

    // Pontas do embrulho (triângulos creme), desenhadas antes do corpo para ficarem por baixo.
    food.fillStyle(COR.creme, 1);
    food.lineStyle(TRACO.arte, COR.traco, 1);
    for (const side of [-1, 1] as const) {
      const baseX = side < 0 ? bodyX + 2 : bodyX + bodyWidth - 2;
      const tipX = side < 0 ? inset : size - inset;
      food.fillTriangle(baseX, mid, tipX, mid - 11, tipX, mid + 11);
      food.strokeTriangle(baseX, mid, tipX, mid - 11, tipX, mid + 11);
    }

    food.fillStyle(COR.laranja, 1);
    food.fillRoundedRect(bodyX, bodyY, bodyWidth, bodyHeight, FOOD_RADIUS);
    food.lineStyle(TRACO.arte, COR.traco, 1);
    food.strokeRoundedRect(bodyX, bodyY, bodyWidth, bodyHeight, FOOD_RADIUS);

    // Brilho: traços curtos de traço-detalhe em branco.
    food.lineStyle(TRACO.detalhe, COR.branco, 1);
    food.lineBetween(bodyX + 7, bodyY + 7, bodyX + 13, bodyY + 7);
    food.lineBetween(bodyX + 7, bodyY + 11, bodyX + 9, bodyY + 11);

    food.generateTexture("food", size, size);
    food.destroy();
  }
}
