import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import { ALFA, COR, ESPACO, TAMANHO } from "../config/theme";
import { matchStateManager } from "../systems/MatchStateManager";
import { isProxyFocused } from "../ui/a11y";
import { createButton, type Button } from "../ui/Button";
import { createDialog, type Dialog } from "../ui/Dialog";
import { createPanel, createPanelTitle } from "../ui/Panel";

// specs/017 + specs/018 (contracts/navigation.md § PauseOverlayScene): respiro interno do painel
// (gs-painel: 26px em cima, 30px embaixo) e profundidade dos filhos acima do fundo do painel.
const PANEL_PAD_TOP = 26;
const PANEL_PAD_BOTTOM = 30;
const CONTENT_DEPTH = 1;

type OverlayState = "painel" | "confirmarReiniciar" | "confirmarEncerrar";
type DestructiveAction = "reiniciar" | "encerrar";

export interface PauseOverlayData {
  /** Relógio lógico da partida no instante da pausa (já sem os intervalos pausados). */
  pausedAtLogicalMs: number;
}

/**
 * specs/009-pausar-partida: Scene lançada em paralelo enquanto GameScene está pausada
 * (`this.scene.pause()` desliga o Input Plugin da própria GameScene, então os botões precisam viver
 * numa Scene separada para continuarem clicáveis — research.md §2).
 *
 * specs/018-navegacao-pausa-fim (data-model.md § Estado da PauseOverlayScene): máquina de estados
 * painel ↔ diálogos de confirmação. Cada troca de estado destrói o conteúdo anterior (inclusive os
 * proxies de acessibilidade) e monta o próximo — nada invisível fica ativo (FR-013).
 */
export class PauseOverlayScene extends Phaser.Scene {
  private state: OverlayState = "painel";
  private pausedAtLogicalMs = 0;
  /** FR-014: depois da primeira ação de saída, tudo é ignorado (sem transições duplicadas). */
  private leaving = false;
  private contentObjects: Phaser.GameObjects.GameObject[] = [];
  private contentButtons: Button[] = [];
  private dialog?: Dialog;
  private panelButtons: Partial<Record<DestructiveAction, Button>> = {};

  constructor() {
    super("PauseOverlayScene");
  }

  create(data: PauseOverlayData): void {
    this.pausedAtLogicalMs = data?.pausedAtLogicalMs ?? 0;
    this.leaving = false;
    this.contentObjects = [];
    this.contentButtons = [];
    this.dialog = undefined;
    this.panelButtons = {};

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COR.traco, ALFA.sobreposicao);
    this.showPanel();

    // specs/009-pausar-partida: mesmo atalho "P" usado para pausar em GameScene também retoma aqui.
    // specs/018 (FR-007b): só no painel — com um diálogo de confirmação aberto, P não faz nada.
    this.input.keyboard?.on("keydown-P", () => {
      if (this.state === "painel") {
        this.resumeMatch();
      }
    });
  }

  private clearContent(): void {
    this.dialog?.destroy();
    this.dialog = undefined;
    for (const button of this.contentButtons) {
      button.destroy();
    }
    for (const object of this.contentObjects) {
      object.destroy();
    }
    this.contentButtons = [];
    this.contentObjects = [];
    this.panelButtons = {};
  }

  /** FR-001: painel "PAUSADO" com a pilha CONTINUAR / REINICIAR / ENCERRAR PARTIDA (bolhas A/B/A). */
  private showPanel(): void {
    this.clearContent();
    this.state = "painel";

    const centerX = GAME_WIDTH / 2;
    const panelWidth = Math.min(TAMANHO.painelPausa, GAME_WIDTH - 2 * ESPACO.hudLateral);
    const title = createPanelTitle(this, centerX, 0, "PAUSADO").setDepth(CONTENT_DEPTH);
    const titleHeight = title.height - 8;

    const stack = [
      createButton(this, centerX, 0, {
        label: "CONTINUAR",
        variant: "primario",
        size: "m",
        bolha: "a",
        pilha: true,
        onActivate: () => this.resumeMatch(),
      }),
      createButton(this, centerX, 0, {
        label: "REINICIAR",
        variant: "secundario",
        size: "m",
        bolha: "b",
        pilha: true,
        onActivate: () => this.showDialog("reiniciar"),
      }),
      createButton(this, centerX, 0, {
        label: "ENCERRAR PARTIDA",
        variant: "terciario",
        size: "m",
        bolha: "a",
        pilha: true,
        a11yLabel: "Encerrar partida",
        onActivate: () => this.showDialog("encerrar"),
      }),
    ];
    const [continueButton, restartButton, endButton] = stack as [Button, Button, Button];
    this.panelButtons = { reiniciar: restartButton, encerrar: endButton };

    const stackHeight =
      stack.reduce((sum, button) => sum + button.height, 0) + ESPACO.e12 * (stack.length - 1);
    const panelHeight = PANEL_PAD_TOP + titleHeight + ESPACO.e16 + stackHeight + PANEL_PAD_BOTTOM;
    const panelTop = GAME_HEIGHT / 2 - panelHeight / 2;
    const panel = createPanel(this, centerX, GAME_HEIGHT / 2, { width: panelWidth, height: panelHeight });

    title.setY(panelTop + PANEL_PAD_TOP + titleHeight / 2);
    let cursorY = panelTop + PANEL_PAD_TOP + titleHeight + ESPACO.e16;
    for (const button of stack) {
      button.setPosition(centerX, cursorY + button.height / 2).setDepth(CONTENT_DEPTH);
      cursorY += button.height + ESPACO.e12;
    }

    this.contentObjects = [panel, title];
    this.contentButtons = [continueButton, restartButton, endButton];
  }

  /** FR-007: confirmação antes de REINICIAR ou ENCERRAR PARTIDA. */
  private showDialog(action: DestructiveAction): void {
    if (this.leaving) {
      return;
    }
    // FR-015a (research §8a): lido ANTES de destruir o painel — o proxy focado é o que o jogador
    // acionou pelo teclado. Só nesse caso o foco é movido.
    const viaKeyboard = isProxyFocused();
    this.clearContent();
    this.state = action === "reiniciar" ? "confirmarReiniciar" : "confirmarEncerrar";

    const texts =
      action === "reiniciar"
        ? {
            titulo: "REINICIAR PARTIDA?",
            texto: "Você perde esta partida e começa outra do zero.",
            confirmar: "REINICIAR",
            onConfirmar: () => this.restartMatch(),
          }
        : {
            titulo: "ENCERRAR PARTIDA?",
            texto: "Você vai direto para a tela de fim de jogo.",
            confirmar: "ENCERRAR",
            onConfirmar: () => this.endMatch(),
          };

    this.dialog = createDialog(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, {
      ...texts,
      cancelar: "CONTINUAR",
      focusCancel: viaKeyboard,
      onCancelar: () => this.cancelDialog(action, viaKeyboard),
    });
  }

  /** FR-007a: CONTINUAR no diálogo volta ao painel de pausa (a partida continua pausada). */
  private cancelDialog(action: DestructiveAction, viaKeyboard: boolean): void {
    if (this.leaving) {
      return;
    }
    this.showPanel();
    if (viaKeyboard) {
      this.panelButtons[action]?.focus();
    }
  }

  private resumeMatch(): void {
    if (this.leaving) {
      return;
    }
    this.leaving = true;
    this.sound.resumeAll();
    this.scene.resume("GameScene");
    this.scene.stop();
  }

  /**
   * FR-003/FR-004 (research §3/§4): descarta a partida (sem ranking) e começa outra. Os sons pausados
   * pela pausa são parados — nunca retomados numa partida nova (FR-012). `scene.start` encerra esta
   * overlay e reinicia a GameScene pausada do zero.
   */
  private restartMatch(): void {
    if (this.leaving) {
      return;
    }
    this.leaving = true;
    this.sound.stopAll();
    matchStateManager.restart(this.time.now);
    this.scene.start("GameScene");
  }

  /**
   * FR-005/FR-006 (research §1/§2): encerra a partida no tempo lógico da pausa. O `match:lost` emitido
   * por `forfeit` é tratado pela GameScene como uma derrota comum (para o voo e abre o fim de jogo).
   */
  private endMatch(): void {
    if (this.leaving) {
      return;
    }
    this.leaving = true;
    this.sound.stopAll();
    matchStateManager.forfeit(this.pausedAtLogicalMs);
    this.scene.stop();
  }
}
