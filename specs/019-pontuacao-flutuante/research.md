# Research: Pontuação flutuante "+N!"

**Feature**: `specs/019-pontuacao-flutuante` | **Date**: 2026-09-28

## §1. Como os pontos de cada eliminação chegam à cena

**Decision**: o payload do evento `roach:eliminated` passa de `{ roachId }` para `{ roachId, points
}`, em que `points` é o valor que `applyEliminationScore` já devolve hoje e que
`tryEliminateRoach` passa a repassar. `tryEliminateRoach` continua devolvendo `boolean`.

**Rationale**:
- É a mudança mínima no domínio (FR-013): nenhuma regra muda, só um dado que já existe passa a ser
  publicado.
- A `GameScene` já assina `roach:eliminated`. O payload novo é um acréscimo e não quebra os
  assinantes atuais, que só leem `roachId`.
- Manter o retorno `boolean` preserva todos os testes existentes, que usam `toBe(true/false)`.

**Alternatives considered**: `tryEliminateRoach` devolver `number | null` (quebraria testes e o
sentido "eliminou?"); a cena calcular a diferença da pontuação antes e depois (frágil e duplica
estado). Rejeitados.

## §2. Onde o número nasce (FR-002, ajuste do usuário: acima da pata)

**Decision**: `handlePointerDown` guarda `{ x: pointer.x, y: pointer.y }` do clique em
`this.lastHitPoint` **antes** de chamar `tryEliminateRoach`. Como `emit` é síncrono, o handler de
`roach:eliminated` roda dentro da mesma chamada e usa esse ponto. Com o ponto do clique `(px, py)`:

- A pata é tratada pela **caixa envolvente dela durante o tapa**: largura `pw` e altura `ph` da
  pata (`ph = CURSOR_PAW_HEIGHT_PX · golpeEscala`, `pw = ph · proporção da textura`), giradas por
  `|MOVIMENTO.pata.golpeAnguloDeg|` (25°): `halfWidth = (pw·cos θ + ph·sin θ)/2` e `halfHeight =
  (pw·sin θ + ph·cos θ)/2`. É a maior área que a pata ocupa, de modo que o número nunca encoste
  nela.
- O número também entra pela **caixa envolvente girada** de 8°: `w = tw·cos 8° + th·sin 8°`, `h =
  tw·sin 8° + th·cos 8°`, em que `tw/th` são largura e altura do texto sem giro. Assim o
  enquadramento na tela vale para o que é desenhado de fato.
- `pawHalfHeight` abaixo é esse `halfHeight` girado.
- Posição desejada do centro: `x = px`, `y = py − pawHalfHeight − FLOATING_SCORE_GAP − alturaDoNúmero / 2`,
  com `FLOATING_SCORE_GAP = ESPACO.e8`.

**Rationale**: a pata é desenhada pela `CursorScene` centrada no ponteiro (`setOrigin(0.5)`), então
o ponto do clique é exatamente o centro da pata. Não é preciso ler o estado da `CursorScene`, e o
cursor nativo, quando a imagem da pata falha, usa o mesmo cálculo (Edge Case "Pata indisponível").

## §3. Caber na tela sem ficar embaixo da pata (FR-008, Edge Cases)

**Decision**: com `w`/`h` do número já medidos e `M = ESPACO.e4` de margem:
1. `x` é limitado a `[M + w/2, GAME_WIDTH − M − w/2]`.
2. Topo mínimo do centro: `minY = M + h/2 + subida`, em que `subida = MOVIMENTO.pontuacao.subidaPx`
   (0 com movimento reduzido), para que o número continue inteiro até o fim da animação.
3. Se o `y` desejado (§2) for `≥ minY`, usa o `y` desejado.
4. Senão (acerto muito perto do topo), o número vai para **o lado** da pata: `y = max(py, minY)` e
   `x = px + pawHalfWidth + GAP + w/2` (ou `px − pawHalfWidth − GAP − w/2` se não couber à
   direita), com `x` ainda limitado pelo passo 1. `pawHalfWidth` vem da proporção da textura
   `cursor-paw` (o `halfWidth` girado do §2), com fallback de proporção 1 sem textura.
5. Embaixo (`maxY = GAME_HEIGHT − M − h/2`): limita-se por segurança, embora nascer acima da pata
   quase nunca chegue ao fundo.

**Rationale**: o spec exige o número inteiro na tela e **nunca** embaixo da pata. No topo não há
espaço acima, e empurrar para baixo o poria sobre a pata. Ir para o lado mantém as duas garantias
com uma regra determinística.

## §4. Visual (FR-003) e o kit

**Decision**: `createOutlinedTitle` (spec 017) ganha a opção `outline?: "titulo" | "pontuacao"`:
`"titulo"` (padrão, sem mudança) usa contorno 8/sombra 7; `"pontuacao"` usa `strokeThickness 6`
(3px em volta) e sombra de 5px. Novo `client/src/ui/FloatingScore.ts` com
`createFloatingScore(scene, px, py, points, geometry)`, que cria o texto `+${formatThousands(points)}!`
com `TEXTO.pontuacao_flutuante.size` (40), ângulo `+MOVIMENTO.pontuacao.inclinacaoDeg` (8°,
horário), aplica §2 e §3, faz a animação (§5) e se destrói no fim.

## §5. Animação, pausa, movimento reduzido e ciclo de vida (FR-004, FR-005, FR-011, FR-012)

**Decision**:
- Normal: um tween na cena com `y: y − 48`, `alpha: 0`, `duration: 720`, `ease: "Quad.easeOut"` e
  `onComplete: destroy`.
- Movimento reduzido (`prefersReducedMotion`): sem tween de movimento; `scene.time.delayedCall(720,
  destroy)`. O número aparece parado e some no fim (o design system diz "a pontuação não anima").
- Pausa: tweens e o `Clock` da `GameScene` param com `scene.pause()` e retomam juntos, sem código
  novo.
- Troca de cena (reiniciar, encerrar, perder): os objetos pertencem à `GameScene` e são destruídos
  no `shutdown` dela. Tweens e timers da cena também, então nada fica pendurado.

## §6. Profundidade (FR-007, depois do ajuste)

**Decision**: `FLOATING_SCORE_DEPTH = 30`, acima do HUD (`UI_DEPTH_HUD = 10`) e das baratas
(`ROACH_DEPTH = 20`), só para que o número apareça inteiro. Não há regra funcional entre número e
baratas (Clarifications). A pata fica sempre por cima porque vive na `CursorScene`, a última cena
da lista.

## §7. Desempenho (SC-004, Princípio V)

**Decision**: criar um `Text` por eliminação, sem pool. O ritmo máximo é de algumas eliminações
por segundo (há no máximo 2 baratas ativas, spec 013). Cada número vive 720ms, então há no máximo
~3 simultâneos. A criação acontece **depois** de `tryEliminateRoach`, ou seja, depois do hit-test e
da atualização de estado, e antes do `cursor:strike`, sem entrar no cálculo do acerto.

**Alternatives considered**: pool de `Text` (complexidade sem ganho medível no volume atual;
Princípio IV). Rejeitado.
