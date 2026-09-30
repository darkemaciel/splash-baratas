# Quickstart: validar o Design System "Grotesco Surreal"

**Feature**: `specs/017-design-system-grotesco`

## Pré-requisitos

```bash
cd client
bun install
```

## 1. Testes automatizados

```bash
bun test
```

Esperado:
- toda a suíte existente de domínio passa **sem alteração** (FR-026);
- os novos testes de `ui/shape.ts` e `ui/format.ts` passam (contrato em `contracts/ui-kit.md`).

```bash
bun run build
```

Esperado: build sem erro de tipo. O bundle não inclui `grotesco.css`.

## 2. Validação manual (`bun run dev`)

Rode em Chrome, Firefox e Edge, nas duas bases: janela larga (paisagem) e DevTools em modo
dispositivo retrato, por exemplo 390×844 (recarregue a página depois de trocar a orientação).

| # | Passo | Esperado | Requisitos |
|---|---|---|---|
| 1 | Abrir o jogo | Aba "Borges e as Baratas"; logo com contorno a −4° e botão JOGAR vermelho em bolha; fundo céu | FR-001, FR-009 |
| 2 | Passar o ponteiro sobre JOGAR, pressionar e soltar | Levanta e gira; afunda e achata; a partida inicia ao soltar; a pata fica visível por cima do botão o tempo todo | FR-008, FR-021 |
| 3 | Tab até JOGAR e Enter | Anel de foco de 3px aparece; Enter inicia a partida | FR-008, FR-022 |
| 4 | Olhar o HUD | PONTOS à esquerda, tempo `0:00` no centro, comidas com coração + barra limão + Pausar à direita; nada sobre as prateleiras | FR-013–FR-017 |
| 5 | Eliminar baratas perto do HUD e do botão de som; clicar em Som durante a partida | Toda barata clicada fora de botão é eliminada, inclusive passando por trás das pílulas (ela aparece por cima); clicar em Pausar/Som não toca o som de erro, não quebra o combo e não dá o golpe da pata | FR-019, SC-003 |
| 6 | Deixar comidas serem roubadas | A barra encolhe e muda para laranja e depois vermelho | FR-014 |
| 7 | Pausar pelo botão | Sobreposição de 55%, painel creme "PAUSADO", botão Pausar em estado ativo | FR-010, FR-015 |
| 8 | Retomar com a tecla P | O jogo volta e o botão Pausar sai do estado ativo | Edge Case |
| 9 | Alternar o som em cada tela | Ícone de som; mudo = botão afundado + barra diagonal; a preferência é lembrada ao recarregar | FR-016 |
| 10 | Tab até o botão de som, depois perder e digitar um nome com espaço e Enter | "FIM DE JOGO!" com contorno; painel de nome no estilo do design system; cartão com PONTOS 1.234 e TOP 5; o som **não** alterna ao digitar Espaço/Enter | FR-011, FR-012, FR-022 |
| 11 | DE NOVO! várias vezes seguidas | Reinicia sem recarregar; nenhum resto de tela anterior | SC-007 |
| 12 | Ativar "reduzir movimento" no sistema e passar o ponteiro nos botões | Sem giro no hover | FR-023 |
| 13 | DevTools → Performance durante 2 min de partida | ~60 FPS estáveis | SC-002 |
| 14 | DevTools → Network: bloquear `*.woff2` e recarregar | O jogo abre em até ~1s com fonte de reserva e é jogável | Edge Case, SC-006 |
| 15 | Leitor de tela (NVDA/Narrador): navegar com Tab | Anuncia "Jogar", "Pausar", "Som ligado"/"Som desligado", "Continuar", "De novo!" | FR-022 |

## 3. Revisão visual

Compare lado a lado com `docs/borges-design-system/design-system/components/TelaMenu`,
`TelaJogo`, `TelaPausa` e `TelaFimDeJogo` (`preview.html`), só nos elementos que existem no jogo.
Confira contra a tabela de contraste do `design-system/README.md` (SC-001, SC-004).
