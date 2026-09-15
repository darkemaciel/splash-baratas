export interface Point {
  x: number;
  y: number;
}

// specs/006-responsividade-mobile: orientação detectada uma única vez no carregamento do módulo
// (nunca recomputada em runtime — uma partida em andamento não troca de layout ao rotacionar,
// apenas re-letterboxa, conforme já decidido nas clarifications da spec). `typeof window` guarda
// o caminho de teste (bun test roda sem DOM) e mantém o padrão landscape nesse caso.
const isPortraitViewport =
  typeof window !== "undefined" && window.innerHeight > window.innerWidth;

// Canvas / layout — single source of truth shared by domain (pure math) and scenes (rendering).
// Duas resoluções-base: landscape (desktop, padrão) e portrait (celular em pé, sem exigir
// rotação — specs/006-responsividade-mobile). Ambas mantêm a mesma grade lógica de prateleiras/
// comidas; só a proporção do "mundo" muda, para que o letterboxing do Phaser (Scale.FIT) sobre
// cada uma aproveite a maior parte da tela em qualquer orientação.
export const GAME_WIDTH = isPortraitViewport ? 480 : 960;
export const GAME_HEIGHT = isPortraitViewport ? 960 : 600;

// specs/006-responsividade-mobile (FR-003, FR-007): fator para escalar tamanhos de fonte/padding
// fixos em px (StartScene, GameOverScene) proporcionalmente à largura-base landscape original
// (960) — sem isso, textos longos (título, mensagem de derrota) tunados para 960px de largura
// ficam cortados na base portrait (480px). Em landscape UI_SCALE é sempre 1 (nenhuma mudança).
export const UI_SCALE = GAME_WIDTH / 960;

// FR-002 / research.md §2: 3 prateleiras x 3 comidas = 9 comidas por partida.
export const SHELF_COUNT = 3;
export const FOOD_ITEMS_PER_SHELF = 3;
export const TOTAL_FOOD_ITEMS = SHELF_COUNT * FOOD_ITEMS_PER_SHELF;

// FR-003 / FR-005 / FR-016 / research.md §3: cadência e tempo de reação fixos durante toda a
// partida. Estas constantes são o único ponto de leitura desses valores em todo o código —
// nenhuma outra parte do sistema pode redefini-los ou torná-los dinâmicos (FR-016).
export const SPAWN_INTERVAL_MS = 2500;
export const TRAVEL_DURATION_MS = 3000;

// FR-018 / research.md §4: hit-test circular = raio visual do sprite + padding fixo.
export const HITBOX_PADDING_PX = 6;
export const ROACH_VISUAL_RADIUS = 20;

// Posições verticais das 3 prateleiras e horizontais dos 3 slots de comida por prateleira — grid
// 3x3 (research.md §2), expressas como frações da resolução-base landscape original (960x600) e
// aplicadas a GAME_WIDTH/GAME_HEIGHT — assim o grid mantém as mesmas proporções relativas em
// qualquer orientação (specs/006-responsividade-mobile).
const SHELF_Y_FRACTIONS = [160 / 600, 320 / 600, 480 / 600] as const;
const FOOD_SLOT_X_FRACTIONS = [280 / 960, 480 / 960, 680 / 960] as const;

export const SHELF_Y_POSITIONS: readonly number[] = SHELF_Y_FRACTIONS.map((f) => f * GAME_HEIGHT);
export const FOOD_SLOT_X_POSITIONS: readonly number[] = FOOD_SLOT_X_FRACTIONS.map(
  (f) => f * GAME_WIDTH,
);

// FR-005 / research.md §5: baratas surgem em 4 pontos fixos nas bordas da cena, fora das
// prateleiras.
export const SPAWN_POINTS: readonly Point[] = [
  { x: GAME_WIDTH / 2, y: -40 }, // topo
  { x: GAME_WIDTH / 2, y: GAME_HEIGHT + 40 }, // base
  { x: -40, y: GAME_HEIGHT / 2 }, // esquerda
  { x: GAME_WIDTH + 40, y: GAME_HEIGHT / 2 }, // direita
];

export function foodItemPosition(shelfIndex: number, slotIndex: number): Point {
  const y = SHELF_Y_POSITIONS[shelfIndex];
  const x = FOOD_SLOT_X_POSITIONS[slotIndex];
  if (y === undefined || x === undefined) {
    throw new Error(`Posição inválida: shelfIndex=${shelfIndex}, slotIndex=${slotIndex}`);
  }
  return { x, y };
}

// specs/004-sistema-pontuacao (data-model.md § "Constantes de balanceamento"): pontuação base,
// bônus de velocidade de reação em faixas fixas, e bônus/janela de combo.
export interface ReactionBonusTier {
  maxMs: number;
  bonus: number;
}

export const SCORE_BASE_POINTS = 100;
export const REACTION_BONUS_TIERS: readonly ReactionBonusTier[] = [
  { maxMs: 500, bonus: 50 },
  { maxMs: 1000, bonus: 25 },
  { maxMs: 1500, bonus: 10 },
];
export const COMBO_BONUS_STEP_POINTS = 25;
// 3000ms (não 2000ms): com SPAWN_INTERVAL_MS=2500 e TRAVEL_DURATION_MS=3000, o intervalo mínimo
// entre "última eliminação de uma leva de baratas" e "primeira eliminação da próxima leva" é de
// ~2000ms (2 * SPAWN_INTERVAL_MS - TRAVEL_DURATION_MS) — com a janela igual a esse mínimo, um
// combo de 3+ só seria alcançável com precisão de milissegundo. 3000ms dá folga real ao jogador.
export const COMBO_WINDOW_MS = 3000;

export function nearestSpawnPoint(target: Point): Point {
  let nearest = SPAWN_POINTS[0]!;
  let nearestDistSq = Infinity;
  for (const point of SPAWN_POINTS) {
    const dx = point.x - target.x;
    const dy = point.y - target.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearest = point;
    }
  }
  return nearest;
}
