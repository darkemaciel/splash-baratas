import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import { ALFA, COR, ESPACO, TAMANHO } from "../config/theme";
import { createButton } from "../ui/Button";
import { createPanel, createPanelTitle } from "../ui/Panel";

// specs/017-design-system-grotesco (contracts/screens.md § Pausa): respiro interno do painel
// (gs-painel: 26px em cima, 30px embaixo) e profundidade dos filhos acima do fundo do painel.
const PANEL_PAD_TOP = 26;
const PANEL_PAD_BOTTOM = 30;
const CONTENT_DEPTH = 1;

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
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COR.traco, ALFA.sobreposicao);

    const panelWidth = Math.min(TAMANHO.painelPausa, GAME_WIDTH - 2 * ESPACO.hudLateral);
    const title = createPanelTitle(this, GAME_WIDTH / 2, 0, "PAUSADO").setDepth(CONTENT_DEPTH);
    const titleHeight = title.height - 8;

    // O botão é criado depois de saber a altura do título, já na posição final (a zona de clique
    // não acompanha reposicionamentos do container).
    const buttonProbeHeight = TAMANHO.toqueMinimo + 12;
    const panelHeight = PANEL_PAD_TOP + titleHeight + ESPACO.e16 + buttonProbeHeight + PANEL_PAD_BOTTOM;
    const panelTop = GAME_HEIGHT / 2 - panelHeight / 2;
    title.setY(panelTop + PANEL_PAD_TOP + titleHeight / 2);

    createPanel(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, { width: panelWidth, height: panelHeight });
    createButton(this, GAME_WIDTH / 2, panelTop + PANEL_PAD_TOP + titleHeight + ESPACO.e16 + buttonProbeHeight / 2, {
      label: "CONTINUAR",
      variant: "primario",
      size: "m",
      bolha: "a",
      pilha: true,
      onActivate: () => this.resumeMatch(),
    }).setDepth(CONTENT_DEPTH);

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
