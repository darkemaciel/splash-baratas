// Grotesco Surreal — constantes do design system para o Phaser (Borges e as Baratas).
// Gerado de design-system/tokens.json. Cores como número (Graphics) e como texto (Text) via hex().

export const COR = {
  traco: 0x1b1b1b,
  branco: 0xffffff,
  creme: 0xfcebaa,
  rosa: 0xf6c9c9,
  magenta: 0xd9579b,
  magenta_escuro: 0xb8387a,
  vermelho: 0xc73a1f,
  vermelho_escuro: 0x9e2c16,
  laranja: 0xe8512a,
  ceu: 0x9ed3e6,
  limao: 0xcfd62a,
  limao_claro: 0xdde34f,
  limao_escuro: 0xa9af1e,
  mato: 0x6db33f,
  papel: 0xede3c0,
  cinza_quente: 0x7a7466,
  legenda: 0x4a4540,
} as const;

export const hex = (c: number): string => `#${c.toString(16).padStart(6, "0")}`;

/** Opacidades usadas com cor-traco (0x1b1b1b). */
export const ALFA = { sobreposicao: 0.55, sombraChao: 0.18 } as const;

export const FONTE = {
  display: '"Luckiest Guy", cursive',
  texto: '"Baloo 2", sans-serif',
} as const;

/** Tamanhos de texto em px (tela de referência 960 × 540). */
export const TEXTO = {
  titulo_g: { size: 52, weight: 400 },
  titulo: { size: 44, weight: 400 },
  pontuacao_flutuante: { size: 40, weight: 400 },
  botao_g: { size: 34, weight: 400 },
  valor_resultado: { size: 30, weight: 400 },
  titulo_p: { size: 28, weight: 400 },
  combo: { size: 26, weight: 400 },
  botao_m: { size: 22, weight: 400 },
  hud: { size: 22, weight: 400 },
  dica_prefixo: { size: 18, weight: 400 },
  botao_p: { size: 17, weight: 400 },
  alternar_rotulo: { size: 16, weight: 400 },
  rotulo: { size: 19, weight: 800 },
  rotulo_resultado: { size: 17, weight: 800 },
  corpo: { size: 16, weight: 600 },
  dica: { size: 16, weight: 700 },
  valor_seletor: { size: 16, weight: 800 },
  rotulo_energia: { size: 14, weight: 800 },
  legenda: { size: 13, weight: 700 },
} as const;

export const ESPACO = { e4: 4, e8: 8, e12: 12, e16: 16, e24: 24, e32: 32, e48: 48, hudLateral: 20 } as const;
export const TRACO = { ui: 3, arte: 3.5, detalhe: 2 } as const;
/** Deslocamento da sombra dura (sempre para baixo e à direita), em px. */
export const SOMBRA = { pressionado: 1, p: 3, m: 4, g: 5, painel: 6, hover: 7 } as const;

export const MOVIMENTO = {
  pata: { alturaPx: 56, golpeMs: 150, golpeAnguloDeg: -25, golpeEscala: 1.25, inclinacaoMaxDeg: 15, fatorInclinacao: 0.15, suavizacao: 0.25 },
  barataAndando: { quadros: 27, fps: 15, balancoDeg: 10, balancoHz: 2.2 },
  barataVoando: { quadros: 16, fps: 20, balancoDeg: 6, balancoHz: 6 },
  agitacao: { squashMax: 0.18, squashHz: 4, tremorMaxPx: 4, tremorHzMin: 6, tremorHzMax: 14 },
  barataEliminada: { quedaPx: 40, ms: 200 },
  botaoHover: { deslocaPx: -3, giroPrimarioDeg: -3, giroSecundarioDeg: 3, giroTerciarioDeg: -2 },
  botaoPressionado: { deslocaPx: 3, achatarY: 0.92 },
  pulo: { alturaPx: 80, subidaMs: 180, noArMs: 180 },
  pontuacao: { subidaPx: 48, ms: 720, inclinacaoDeg: 8 },
} as const;

export const NOME_DO_JOGO = "Borges e as Baratas";
