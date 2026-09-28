import Phaser from "phaser";
import { COR, FONTE, hex } from "../config/theme";

/**
 * specs/017-design-system-grotesco (research §5, FR-009, FR-011): título com contorno do design
 * system (logo, "FIM DE JOGO!") — texto branco com contorno preto de 4px em volta (strokeThickness
 * 8) e sombra dura de 7px, sem desfoque. Título branco nunca aparece sem esse contorno. A rotação é
 * estática, então vale mesmo com movimento reduzido (FR-023 só proíbe animar).
 *
 * specs/019-pontuacao-flutuante (research §4): variante "pontuacao" do componente
 * PontuacaoFlutuante — contorno de 3px em volta (strokeThickness 6) e sombra de 5px.
 */

export type OutlineVariant = "titulo" | "pontuacao";

const OUTLINE: Record<OutlineVariant, { strokeThickness: number; shadowOffset: number }> = {
  titulo: { strokeThickness: 8, shadowOffset: 7 },
  pontuacao: { strokeThickness: 6, shadowOffset: 5 },
};

export function createOutlinedTitle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  options: { size: number; angle: number; wrapWidth?: number; outline?: OutlineVariant },
): Phaser.GameObjects.Text {
  const { strokeThickness, shadowOffset } = OUTLINE[options.outline ?? "titulo"];
  const title = scene.add
    .text(x, y, text.toUpperCase(), {
      fontFamily: FONTE.display,
      fontSize: `${options.size}px`,
      color: hex(COR.branco),
      stroke: hex(COR.traco),
      strokeThickness,
      align: "center",
      // Respiro para o contorno e a sombra não serem cortados pelo canvas do Text.
      padding: { left: 6, right: 6 + shadowOffset, top: 8, bottom: 6 + shadowOffset },
      wordWrap: options.wrapWidth ? { width: options.wrapWidth } : undefined,
    })
    .setShadow(shadowOffset, shadowOffset, hex(COR.traco), 0, true, true)
    .setOrigin(0.5)
    .setAngle(options.angle);
  return title;
}
