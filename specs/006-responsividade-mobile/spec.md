# Feature Specification: Responsividade mobile e compatibilidade de tela

**Feature Branch**: `006-responsividade-mobile`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "Responsividade para celular / Mobile e compatibilidade (P0): adequar o canvas, as prateleiras e a HUD do jogo a telas pequenas/mobile. Mesmo com o modo de jogo mobile funcional fora do escopo do MVP (input touch dedicado, layout otimizado para toque real — isso é item P2 separado no backlog, "Layout responsivo para touch"), a tela do jogo precisa se adaptar corretamente em vez de quebrar/cortar em resoluções pequenas e em diferentes proporções de tela (retrato/paisagem, tablets, notebooks pequenos). Este item está descrito na seção 3 (Acessibilidade e UX) do backlog.md como "Responsividade para celular", prioridade P0, e sobrepõe/adianta o item "Layout responsivo para touch" da seção 4 (Mobile e compatibilidade). Deve cobrir: canvas do Phaser escalando corretamente para o viewport disponível sem distorcer proporções nem cortar prateleiras/HUD; layout do HUD (vida, pontuação, etc. — já entregues nas specs 002, 004 e 005) permanecendo legível e sem sobreposição em telas estreitas; teste em resoluções desktop pequenas e em emulação mobile do browser (input touch real continua fora de escopo, conforme já registrado no CLAUDE.md e na constitution)."

## Clarifications

### Session 2026-09-14

- Q: Quando o canvas encolhe até a largura mínima de 320px, o texto e os indicadores da HUD devem
  encolher na mesma proporção do canvas inteiro, ou devem manter um tamanho mínimo de fonte
  legível mesmo que isso ocupe proporcionalmente mais espaço da tela? → A: Escala proporcional ao
  canvas — a HUD escala junto com todo o campo de jogo, usando o mesmo fator de escala das
  prateleiras/comidas/baratas, sem lógica de layout separada para a HUD.
- Q: Em uma tela muito estreita e alta (celular em retrato), quando o letterboxing reduz bastante
  a área de jogo, o sistema deve exibir um aviso sugerindo girar o dispositivo? → A: Não — apenas
  aplica o letterbox normalmente, sem nenhum elemento de UI novo de aviso de orientação.
- Q: (Revisão pós-teste manual em celular, 2026-09-15) A proporção única 960:600 aplicada com
  letterbox deixava a área de jogo como uma faixa fina no meio da tela em retrato (~28% da altura
  disponível em um celular comum), desperdiçando a maior parte da tela "alongada" mesmo sem
  distorção. O sistema deve continuar usando uma única proporção-base (960:600) sempre, ou adotar
  uma proporção-base dedicada para retrato? → A: Proporção-base dedicada para retrato (480x960),
  escolhida uma única vez no carregamento a partir de `window.innerWidth`/`innerHeight` (mais alto
  que largo → base portrait). Prateleiras e slots de comida mantêm a mesma grade relativa (mesmas
  frações da largura/altura), então nenhuma lógica de jogo muda — só a proporção do "mundo" antes
  do letterbox do Phaser. A proporção-base não é recalculada durante uma partida em andamento (uma
  rotação física do dispositivo em runtime apenas re-letterboxa a base já escolhida, sem redesenhar
  o layout) — o objetivo desta revisão é apenas não exigir rotação manual para começar a jogar.
- Q: Em monitores muito grandes (ex.: ultrawide, 2560px+), até que ponto o campo de jogo deve
  escalar para cima antes de virar borda neutra? → A: Sem limite de escala explícito — o campo de
  jogo cresce livremente até ocupar o maior espaço possível do viewport, respeitando a proporção
  960:600, sem um teto artificial de ampliação.
- Q: Abaixo de 320px de viewport, como funciona exatamente a "rolagem controlada" de degradação? →
  A: O canvas trava na escala mínima (equivalente a 320px de largura) e o navegador permite
  rolagem horizontal para revelar as partes que não cabem, em vez de encolher indefinidamente.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jogar em tela pequena sem cortes (Priority: P1)

Um jogador abre o jogo em uma janela de navegador pequena (notebook compacto, tablet, ou celular
em modo desktop-site) e consegue ver o campo de jogo completo — as três prateleiras, todas as
comidas e o espaço onde as baratas se movem — sem que nenhuma parte fique cortada fora da tela ou
sem que a imagem fique esticada/achatada de forma que distorça a proporção original do jogo.

**Why this priority**: hoje o canvas tem tamanho fixo (960×600px) e é centralizado via CSS sem
nenhuma lógica de escala; em qualquer viewport menor que isso, partes do jogo ficam literalmente
fora da área visível ou exigem rolagem, tornando o jogo impossível de jogar. Esta é a quebra mais
grave e o motivo do item ser P0 no backlog.

**Independent Test**: pode ser testado sozinho reduzindo a janela do navegador (ou usando a
emulação de dispositivo do DevTools) para larguras típicas de celular/tablet e verificando que
prateleiras, comidas e a área de jogo continuam 100% visíveis e com as proporções originais
preservadas.

**Acceptance Scenarios**:

1. **Given** o jogo carregado em uma janela com largura de 1920px, **When** o jogador redimensiona
   a janela para 375px de largura (largura típica de celular), **Then** o campo de jogo inteiro
   (prateleiras, comidas, área de baratas) continua visível dentro da janela, sem cortes nem barra
   de rolagem horizontal/vertical.
2. **Given** o jogo carregado em uma tela com proporção diferente de 960:600 (ex.: um tablet em
   retrato, mais alto que largo), **When** a cena é renderizada, **Then** o espaço excedente é
   preenchido com uma borda neutra (letterbox/pillarbox) em vez de esticar ou cortar o conteúdo do
   jogo.
3. **Given** uma partida em andamento, **When** o jogador gira a orientação do dispositivo
   (retrato → paisagem) ou redimensiona a janela, **Then** o layout se reajusta automaticamente e
   a partida continua rodando normalmente, sem reiniciar nem travar.

---

### User Story 2 - HUD legível em telas estreitas (Priority: P2)

Um jogador em uma tela estreita consegue ler todos os elementos da HUD (indicador de vida,
pontuação e qualquer indicador de risco/progresso) claramente, sem que os elementos se sobreponham
uns aos outros ou fiquem cortados nas bordas da tela.

**Why this priority**: a HUD (entregue nas specs 002, 004 e 005) foi desenhada e validada em
resolução desktop; ao escalar o canvas para telas pequenas, texto e ícones podem ficar ilegíveis
ou se sobrepor, prejudicando a leitura do estado do jogo mesmo que o campo de jogo em si já esteja
visível (US1). É P2 porque depende do canvas já escalar corretamente (US1) para fazer sentido
testar.

**Independent Test**: pode ser testado reduzindo a largura da janela até o limite mínimo suportado
e verificando visualmente que nenhum texto da HUD é cortado e que não há sobreposição entre os
elementos de vida, pontuação e risco.

**Acceptance Scenarios**:

1. **Given** o jogo escalado para a largura mínima suportada, **When** a HUD é renderizada,
   **Then** todos os textos e indicadores permanecem completamente legíveis (sem corte de
   caracteres) e sem se sobrepor a outros elementos da HUD ou às prateleiras.
2. **Given** uma mudança de pontuação ou de vida durante o jogo em tela pequena, **When** o valor
   é atualizado, **Then** a atualização continua visível e legível na mesma posição relativa,
   igual ao comportamento já validado em desktop.

---

### User Story 3 - Compatibilidade entre navegadores e resoluções comuns (Priority: P3)

Um jogador acessa o jogo a partir de diferentes combinações de navegador (Chrome, Firefox, Edge)
e resolução (desktop pequeno, tablet, celular em emulação) e obtém um comportamento visual
consistente em todas elas, sem falhas de renderização específicas de um navegador.

**Why this priority**: garante que a adaptação de layout não seja uma solução específica de um
único motor de navegador. É P3 porque é uma validação de abrangência sobre o comportamento já
implementado nas User Stories 1 e 2, não uma capacidade nova.

**Independent Test**: pode ser testado abrindo o jogo nos três navegadores-alvo (conforme
`CLAUDE.md`) nas mesmas resoluções de teste e comparando que o campo de jogo e a HUD aparecem de
forma equivalente em todos.

**Acceptance Scenarios**:

1. **Given** a mesma resolução de viewport, **When** o jogo é aberto em Chrome, Firefox e Edge,
   **Then** o campo de jogo e a HUD são exibidos com o mesmo layout e proporções em todos os três.

---

### Edge Cases

- O que acontece quando o viewport é mais estreito que o mínimo suportado (ex.: janela do
  navegador espremida manualmente para menos de 320px de largura)? O canvas trava na escala
  mínima (equivalente a 320px de largura) e o navegador permite rolagem horizontal para revelar as
  partes que não cabem, em vez de continuar encolhendo indefinidamente ou cortar conteúdo de forma
  abrupta.
- Como o sistema se comporta quando o jogador altera o zoom do navegador (Ctrl +/-) durante uma
  partida? O layout deve se re-adaptar como se o viewport tivesse mudado de tamanho.
- O que acontece em uma proporção de tela muito estreita e alta (ex.: celular em retrato), onde o
  letterboxing resultaria em uma área de jogo pequena? O sistema não exibe nenhum aviso de "gire o
  dispositivo" — apenas aplica o letterbox normalmente, reduzindo a área de jogo proporcionalmente
  como em qualquer outra proporção fora do padrão 960:600.
- O que acontece se o viewport for consideravelmente maior que o layout de referência (ex.: um
  monitor ultrawide)? O jogo não deve esticar de forma borrada nem ficar reduzido a um canto
  minúsculo da tela — deve escalar para cima livremente, sem um limite máximo explícito,
  preenchendo o espaço restante com a borda neutra (letterbox/pillarbox).
- O que acontece se o redimensionamento ocorrer no meio da animação de uma barata se movendo em
  direção a uma comida? A posição lógica e a posição visual da barata (e, portanto, sua área
  clicável) devem permanecer sincronizadas durante e após o redimensionamento (Princípio V).
- Como as telas de início e de fim de jogo (`StartScene`, `GameOverScene`) se comportam nos mesmos
  viewports pequenos? Devem seguir a mesma lógica de escala do campo de jogo, sem texto/botões
  cortados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE escalar o campo de jogo (canvas) proporcionalmente para ocupar o
  maior espaço possível do viewport disponível, preservando sempre a proporção-base ativa entre
  largura e altura — 960:600 para viewports landscape (largura ≥ altura) ou 480:960 para viewports
  portrait (altura > largura), escolhida uma única vez no carregamento da página (ver FR-001a).
- **FR-001a**: A escolha entre a proporção-base landscape e portrait DEVE ocorrer uma única vez,
  no carregamento inicial da página, a partir da comparação entre `window.innerWidth` e
  `window.innerHeight`. Essa escolha NÃO é reavaliada durante uma partida em andamento — uma
  rotação física do dispositivo ou redimensionamento em runtime continua sendo tratado apenas como
  reescala/letterbox da proporção-base já escolhida (FR-004), nunca como troca de layout.
- **FR-002**: Quando a proporção do viewport for diferente da proporção-base ativa (landscape ou
  portrait), o sistema DEVE preencher o espaço excedente com uma borda neutra (letterbox/pillarbox)
  em vez de distorcer (esticar/achatar) ou cortar prateleiras, comidas ou elementos de HUD.
- **FR-003**: Todos os elementos de HUD (vida, pontuação e indicadores de risco/progresso já
  entregues nas specs 002, 004 e 005) DEVEM permanecer completamente visíveis, legíveis e sem
  sobreposição entre si em qualquer tamanho de viewport dentro da faixa suportada (ver FR-006). A
  HUD escala proporcionalmente junto com o restante do campo de jogo (mesmo fator de escala das
  prateleiras, comidas e baratas), sem um tamanho mínimo de fonte fixo independente da escala do
  canvas.
- **FR-004**: O sistema DEVE reajustar automaticamente a escala e o posicionamento do layout
  sempre que o viewport for redimensionado (incluindo rotação de orientação e mudança de zoom do
  navegador), sem exigir recarregar a página e sem interromper uma partida em andamento.
- **FR-005**: A posição lógica de cada elemento clicável (barata) e sua posição/área
  renderizada DEVEM permanecer sincronizadas em qualquer nível de escala e em qualquer momento
  durante ou imediatamente após um redimensionamento, preservando a precisão de clique exigida
  pelo Princípio V da constitution.
- **FR-006**: O sistema DEVE suportar corretamente viewports com largura a partir de 320px
  (padrão mínimo de tela mobile) até resoluções de desktop grandes, sem um limite máximo de
  escala explícito. Abaixo de 320px, o sistema DEVE travar o canvas na escala mínima (equivalente
  a 320px de largura) e permitir rolagem horizontal do navegador para revelar as partes que não
  cabem, em vez de continuar encolhendo indefinidamente ou cortar conteúdo de forma abrupta.
- **FR-007**: O sistema DEVE aplicar a mesma lógica de escala e adaptação de layout às telas de
  início (`StartScene`) e de fim de jogo (`GameOverScene`), além da cena principal de jogo.
- **FR-008**: O jogo DEVE permanecer jogável (clique com mouse ou toque emulado) em todas as
  resoluções e orientações suportadas, sem perda de responsividade de clique em relação à versão
  desktop atual.
- **FR-009**: A funcionalidade descrita nesta spec NÃO inclui otimizar a interação para toque real
  em dispositivo físico (tamanho/posição de hitbox pensados para dedo, gestos, etc.) — esse
  trabalho permanece no item de backlog separado "Layout responsivo para touch" (P2, seção 4).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em qualquer viewport com largura entre 320px e 2560px, 100% dos elementos do campo
  de jogo (prateleiras, comidas, área de movimento das baratas) permanecem visíveis dentro da
  tela, sem nenhum elemento cortado nas bordas. 2560px é apenas o teto de referência usado nos
  testes manuais desta spec — não é um limite de comportamento: conforme FR-006, o sistema não tem
  um teto de escala explícito acima disso.
- **SC-002**: A proporção visual entre os elementos do jogo permanece idêntica à do layout de
  referência (960×600) em qualquer viewport testado — nenhuma distorção de esticar/achatar é
  perceptível. Isso vale tanto para a cena principal de jogo quanto para as telas de início
  (`StartScene`) e de fim de jogo (`GameOverScene`), conforme FR-007.
- **SC-003**: 100% dos elementos de HUD permanecem legíveis (nenhum texto cortado, nenhuma
  sobreposição entre elementos) em todas as larguras de viewport a partir de 320px.
- **SC-004**: Redimensionar a janela ou girar a orientação durante uma partida em andamento não
  causa reinício, travamento ou perda de estado da partida em 100% dos casos testados.
- **SC-005**: A taxa de acerto de clique nas baratas em resoluções pequenas (emulação mobile) é
  equivalente à taxa observada em resolução desktop de referência, validada por teste manual
  antes e depois do redimensionamento.
- **SC-006**: O comportamento visual do jogo (layout, escala, legibilidade da HUD) é equivalente
  nos três navegadores-alvo (Chrome, Firefox, Edge) para a mesma resolução testada.

## Assumptions

- A largura mínima de viewport formalmente suportada é 320px, um padrão comum de tela mobile
  (equivalente ao ponto de referência usado por diretrizes de reflow de acessibilidade web);
  viewports mais estreitos que isso recebem apenas degradação previsível, não suporte total.
- "Compatibilidade" nesta spec se refere a compatibilidade de layout/renderização entre os
  navegadores-alvo já definidos em `CLAUDE.md` (Chrome, Firefox, Edge atuais) e entre resoluções
  desktop pequenas e emulação de dispositivo mobile no navegador — não inclui testes em
  dispositivos físicos reais nem em navegadores mobile nativos (Safari iOS, Chrome Android),
  que continuam fora de escopo até uma feature de "touch real" ser priorizada.
- Interação nesta spec continua sendo validada via mouse/trackpad e via emulação de toque do
  DevTools; input touch real em hardware físico é explicitamente adiado para o item de backlog
  "Layout responsivo para touch" / "Testes em dispositivo touch real" (seção 4, P2).
- O letterboxing/pillarboxing usa uma cor neutra consistente com o fundo já definido no jogo
  (`#0d0d0d`), sem necessidade de um novo elemento visual dedicado.
- Esta feature não introduz nenhum novo dado de domínio nem novo estado de partida — é uma
  mudança de apresentação/layout, mantendo a separação lógica/renderização do Princípio I.
