import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH, HIGH_SCORE_RANKING_MAX_ENTRIES } from "../config/gameConfig";
import { ALFA, COR, ESPACO, TAMANHO, TEXTO } from "../config/theme";
import { recordScore, type RankingEntry } from "../systems/HighScoreStore";
import { matchStateManager } from "../systems/MatchStateManager";
import { setProxiesEnabled } from "../ui/a11y";
import { createButton } from "../ui/Button";
import { bodyText } from "../ui/draw";
import { formatThousands } from "../ui/format";
import { createOutlinedTitle } from "../ui/OutlinedTitle";
import { createPanel, createPanelTitle } from "../ui/Panel";
import { createPill, type Pill } from "../ui/Pill";
import { createResultCard, type ResultRow } from "../ui/ResultCard";

const NAME_MAX_LENGTH = 10;
const NAME_ALLOWED_CHAR = /^[a-zA-Z0-9 ]$/;

// specs/017-design-system-grotesco (contracts/screens.md § Fim de jogo).
const TITLE_Y_FRACTION = 0.11;
const TITLE_ANGLE = -3;
const NAME_PANEL_MAX_WIDTH = 440;
/** Campo de nome com largura fixa para até NAME_MAX_LENGTH letras, sem crescer a cada tecla. */
const NAME_FIELD_MIN_WIDTH = 240;
const PANEL_PAD_TOP = 26;
const PANEL_PAD_BOTTOM = 30;
const CONTENT_DEPTH = 1;
/** Folga mínima entre o fim do conteúdo e a borda inferior da tela. */
const BOTTOM_MARGIN = ESPACO.e16;

/**
 * FR-011/FR-012 (spec 001): tela final de derrota com opção de reiniciar sem recarregar a página.
 */
export class GameOverScene extends Phaser.Scene {
  private typedName = "";
  private nameField!: Pill;
  private cursorVisible = true;
  private cursorTimer?: Phaser.Time.TimerEvent;
  private contentTop = 0;

  constructor() {
    super("GameOverScene");
  }

  create(): void {
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "fridgeBg");
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COR.traco, ALFA.sobreposicao);

    const title = createOutlinedTitle(this, GAME_WIDTH / 2, GAME_HEIGHT * TITLE_Y_FRACTION, "FIM DE JOGO!", {
      size: TEXTO.titulo_g.size,
      angle: TITLE_ANGLE,
      wrapWidth: GAME_WIDTH - 2 * ESPACO.hudLateral,
    });
    this.contentTop = title.y + title.height / 2;

    // specs/004-sistema-pontuacao (FR-010): pontuação final.
    const { score } = matchStateManager.getSnapshot();
    this.typedName = "";
    this.showNameEntry(score);
  }

  /**
   * specs/012-high-score-local (revisão): captura o nome do jogador dentro do próprio jogo, digitado
   * via teclado direto no canvas. specs/017: painel/diálogo do design system; as regras de teclado
   * não mudam (FR-012).
   */
  private showNameEntry(score: number): void {
    // contracts/ui-kit.md § Proxies e digitação: Espaço/Enter digitados aqui nunca acionam um botão
    // DOM focado (ex.: o proxy do botão de som).
    setProxiesEnabled(false);

    const panelWidth = Math.min(NAME_PANEL_MAX_WIDTH, GAME_WIDTH - 2 * ESPACO.hudLateral);
    const centerX = GAME_WIDTH / 2;

    const heading = createPanelTitle(this, centerX, 0, "NOVA PONTUAÇÃO!", TEXTO.titulo_p.size);
    const scorePill = createPill(this, centerX, 0, {
      text: `PONTOS ${formatThousands(score)}`,
      textColor: COR.vermelho,
      fill: "branco",
      origin: 0.5,
    });
    this.nameField = createPill(this, centerX, 0, {
      text: this.renderNameLine(),
      textColor: COR.traco,
      fill: "branco",
      origin: 0.5,
      minWidth: NAME_FIELD_MIN_WIDTH,
    });
    const instruction = bodyText(
      this,
      centerX,
      0,
      "Digite seu nome e aperte Enter",
      TEXTO.corpo.size,
      TEXTO.corpo.weight,
      COR.legenda,
    );

    const gap = ESPACO.e12;
    const blocks = [heading.height - 8, scorePill.height, this.nameField.height, instruction.height - 8];
    const panelHeight = PANEL_PAD_TOP + blocks.reduce((a, b) => a + b, 0) + gap * (blocks.length - 1) + PANEL_PAD_BOTTOM;
    const available = GAME_HEIGHT - this.contentTop;
    const panelCenterY = this.contentTop + available / 2;
    const panel = createPanel(this, centerX, panelCenterY, { width: panelWidth, height: panelHeight });

    let cursorY = panelCenterY - panelHeight / 2 + PANEL_PAD_TOP;
    const place = (index: number, setY: (y: number) => void): void => {
      const blockHeight = blocks[index]!;
      setY(cursorY + blockHeight / 2);
      cursorY += blockHeight + gap;
    };
    place(0, (y) => heading.setY(y));
    place(1, (y) => scorePill.root.setY(y));
    place(2, (y) => this.nameField.root.setY(y));
    place(3, (y) => instruction.setY(y));

    const elements: Phaser.GameObjects.GameObject[] = [
      panel,
      heading.setDepth(CONTENT_DEPTH),
      scorePill.root.setDepth(CONTENT_DEPTH),
      this.nameField.root.setDepth(CONTENT_DEPTH),
      instruction.setDepth(CONTENT_DEPTH),
    ];

    this.cursorTimer = this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        this.cursorVisible = !this.cursorVisible;
        this.nameField.setText(this.renderNameLine());
      },
    });

    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key === "Enter") {
        const finalName = this.typedName.trim().length > 0 ? this.typedName.trim() : "Jogador";
        cleanup();
        this.showResults(score, finalName);
        return;
      }
      if (event.key === "Backspace") {
        this.typedName = this.typedName.slice(0, -1);
        this.nameField.setText(this.renderNameLine());
        return;
      }
      if (NAME_ALLOWED_CHAR.test(event.key) && this.typedName.length < NAME_MAX_LENGTH) {
        this.typedName += event.key;
        this.nameField.setText(this.renderNameLine());
      }
    };

    const cleanup = (): void => {
      this.input.keyboard?.off("keydown", handleKeydown);
      this.cursorTimer?.remove();
      elements.forEach((element) => element.destroy());
      setProxiesEnabled(true);
    };

    this.input.keyboard?.on("keydown", handleKeydown);
    // Sair da cena no meio da digitação (ex.: reinício externo) não pode deixar os proxies desligados.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => setProxiesEnabled(true));
  }

  private renderNameLine(): string {
    // Espaço de largura fixa no lugar do "_" apagado, para a pílula não "pular" a cada piscada.
    return `${this.typedName}${this.cursorVisible ? "_" : " "}`;
  }

  /**
   * specs/017-design-system-grotesco (contracts/screens.md § Fim de jogo, item 2): pontuação final em
   * pílula vermelha, mensagem de posição em pílula logo abaixo, cartão de resultado com o Top 5 e o
   * botão primário "DE NOVO!". Tudo cabe em 600px de altura; se não couber, as linhas do ranking
   * ficam mais baixas (padding 4, depois 2).
   */
  private showResults(score: number, name: string): void {
    const { position, ranking } = recordScore(name, score);
    const centerX = GAME_WIDTH / 2;
    const gap = ESPACO.e16;

    let cursorY = this.contentTop + gap;

    const scorePill = createPill(this, centerX, 0, {
      text: `PONTOS ${formatThousands(score)}`,
      textColor: COR.vermelho,
      fill: "branco",
      origin: 0.5,
    });
    scorePill.root.setY(cursorY + scorePill.height / 2);
    cursorY += scorePill.height + ESPACO.e12;

    if (position !== null) {
      const message = position === 1 ? "NOVO RECORDE!" : `${position}º LUGAR NO TOP 5!`;
      const messagePill = createPill(this, centerX, 0, {
        text: message,
        textColor: COR.traco,
        fill: "creme",
        origin: 0.5,
      });
      messagePill.root.setY(cursorY + messagePill.height / 2);
      cursorY += messagePill.height + ESPACO.e12;
    }

    const cardWidth = Math.min(TAMANHO.cartaoResultado, GAME_WIDTH - 2 * ESPACO.hudLateral);
    const rows = this.rankingRows(ranking);
    const buttonHeightEstimate = TAMANHO.toqueMinimo + 12;
    let card = createResultCard(this, centerX, 0, { width: cardWidth, rows, title: "TOP 5" });
    for (const rowPaddingY of [4, 2]) {
      const bottom = cursorY + card.height + gap + buttonHeightEstimate;
      if (bottom <= GAME_HEIGHT - BOTTOM_MARGIN) {
        break;
      }
      card.root.destroy();
      card = createResultCard(this, centerX, 0, { width: cardWidth, rows, title: "TOP 5", rowPaddingY });
    }
    card.root.setY(cursorY + card.height / 2);
    cursorY += card.height + gap;

    const unsubscribe = matchStateManager.on("match:started", () => {
      unsubscribe();
      this.scene.start("GameScene");
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);

    createButton(this, centerX, cursorY + buttonHeightEstimate / 2, {
      label: "DE NOVO!",
      variant: "primario",
      size: "m",
      bolha: "a",
      a11yLabel: "De novo!",
      onActivate: () => matchStateManager.restart(this.time.now),
    });
  }

  /** Sempre `HIGH_SCORE_RANKING_MAX_ENTRIES` linhas; slots vazios mostram "---" sem valor. */
  private rankingRows(ranking: readonly RankingEntry[]): ResultRow[] {
    const rows: ResultRow[] = [];
    for (let i = 0; i < HIGH_SCORE_RANKING_MAX_ENTRIES; i++) {
      const entry = ranking[i];
      rows.push(
        entry
          ? { label: `${i + 1}. ${entry.name.toUpperCase()}`, value: formatThousands(entry.score) }
          : { label: `${i + 1}. ---` },
      );
    }
    return rows;
  }
}
