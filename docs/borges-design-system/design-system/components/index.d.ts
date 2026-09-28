/** Grotesco Surreal — componentes em window.GrotescoSurreal (React 18). */
import type { ReactNode, CSSProperties } from "react";

export type NomeIcone = "pausar" | "jogar" | "recomecar" | "menu" | "opcoes" | "musica" | "som" | "fechar" | "estrela" | "tempo" | "seta-anterior" | "seta-proxima";
type EstadoVisual = "normal" | "hover" | "pressionado" | "desabilitado";

export interface BotaoProps {
  variante?: "primario" | "secundario" | "terciario";
  tamanho?: "G" | "M" | "P";
  /** Bolha A (padrão de primário/terciário) ou B (padrão do secundário). Vizinhos alternam. */
  bolha?: "a" | "b";
  /** Rotação de repouso em graus (menu inicial: -2 / +2). */
  rotacao?: number;
  /** Largura mínima de 280px para pilhas em painéis. */
  pilha?: boolean;
  estado?: EstadoVisual;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}
export function Botao(props: BotaoProps): JSX.Element;

export interface BotaoIconeProps { icone: NomeIcone; rotulo: string; ativo?: boolean; disabled?: boolean; estado?: EstadoVisual; onClick?: () => void; className?: string; style?: CSSProperties; }
export function BotaoIcone(props: BotaoIconeProps): JSX.Element;

export interface IconeProps { nome: NomeIcone; tamanho?: number; cor?: string; espessura?: number; }
export function Icone(props: IconeProps): JSX.Element;

export function HudPontos(props: { pontos: number; rotulo?: string }): JSX.Element;
export function HudVidas(props: { vidas: number; total?: number }): JSX.Element;
export function HudTempo(props: { segundos: number }): JSX.Element;
export function BarraEnergia(props: { valor: number; rotulo?: string }): JSX.Element;
export function SeloCombo(props: { multiplicador?: number }): JSX.Element;

export function Nivel(props: { valor?: number; valorInicial?: number; total?: number; rotulo?: string; onChange?: (n: number) => void }): JSX.Element;
export function Alternar(props: { ligado?: boolean; ligadoInicial?: boolean; rotulo: string; textoSim?: string; textoNao?: string; onChange?: (ligado: boolean) => void }): JSX.Element;
export function Seletor(props: { opcoes?: string[]; indice?: number; indiceInicial?: number; rotulo?: string; onChange?: (indice: number, valor: string) => void }): JSX.Element;

export interface PainelProps { titulo?: string; tipo?: "tela" | "dialogo"; largura?: number | string; rotacaoTitulo?: number; onFechar?: () => void; children?: ReactNode; className?: string; style?: CSSProperties; }
export function Painel(props: PainelProps): JSX.Element;
export function Dialogo(props: { titulo: string; texto?: string; cancelar?: string; confirmar?: string; largura?: number; onCancelar?: () => void; onConfirmar?: () => void }): JSX.Element;
export function BalaoDica(props: { prefixo?: string; children: ReactNode }): JSX.Element;

export function TituloContorno(props: { children: ReactNode; rotacao?: number; tamanho?: number | string; como?: string; style?: CSSProperties }): JSX.Element;
export function PontuacaoFlutuante(props: { valor?: number; animar?: boolean; onFim?: () => void }): JSX.Element;
export function CartaoResultado(props: { estrelas: 0 | 1 | 2 | 3; pontos: number; recorde: number; onDeNovo?: () => void; onMenu?: () => void }): JSX.Element;
export function Personagem(props: { expressao?: "jogo" | "feliz" | "susto" | "tonto"; largura?: number; rotulo?: string }): JSX.Element;

/** 1250 → "1.250" */
export function formatarMilhar(n: number): string;
/** 45 → "0:45" */
export function formatarTempo(segundos: number): string;

export interface BarataProps {
  modo?: "andando" | "voando";
  /** Caixa em px; padrão 64 (quadro de 128px pela metade). */
  tamanho?: number;
  /** 0 no início do trajeto, 1 ao chegar na comida. */
  agitacao?: number;
  /** Direção do trajeto em graus (0 = direita). */
  rumo?: number;
  direcao?: "direita" | "esquerda";
  eliminada?: boolean;
  fase?: number;
  parado?: boolean;
  rotulo?: string;
}
export function Barata(props: BarataProps): JSX.Element;

export interface PataCursorProps {
  /** Altura da pata em px; padrão 56. */
  altura?: number;
  onGolpe?: (ponto: { x: number; y: number }) => void;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}
export function PataCursor(props: PataCursorProps): JSX.Element;

/** Troque os sprites (URLs) antes de renderizar, se hospedar os PNGs em outro lugar. */
export let sprites: { pata?: string; andando?: string; voando?: string } | null;
