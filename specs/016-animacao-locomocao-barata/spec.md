# Feature Specification: Animação de Locomoção da Barata (Andar/Voar)

**Feature Branch**: `016-animacao-locomocao-barata`

**Created**: 2026-09-26

**Status**: Implemented

**Input**: User description: "da animação de andar/voar da barata" — item de backlog "Cursor customizado + animação de locomoção da barata (andando/voando)" (seção 3 do `backlog.md`), parte de locomoção ainda não entregue (a parte de cursor foi entregue via `specs/015-cursor-pata-animada`). Referências visuais em `docs/references/barata_caminhada.mp4` e `docs/references/barata_voo.mp4`. Complementa o item "Animação de voo da barata" (seção 1 do `backlog.md`), que já apontava a necessidade de compor a nova animação contínua com o "juice" (squash/stretch/tremor) já entregue em `specs/008-juice-animacao-barata`.

## Clarifications

### Session 2026-09-26

- Q: Cada barata deve ter um único estilo de locomoção sorteado aleatoriamente entre "andando" e
  "voando" no momento em que é criada (mantido do início ao fim do trajeto), ou os dois estilos
  representam fases sequenciais da mesma barata (ex.: voa até perto da prateleira, depois anda o
  trecho final)? → A: Estilo único por barata, sorteado ao nascer, mantido até o fim do trajeto —
  puramente visual, sem fases.

### Session 2026-09-27

- Q: Após validar no servidor dev, a barata ainda aparecia como a bolinha placeholder (só girando).
  A animação procedural provisória basta? → A: Não — substituir a bolinha pelas animações reais de
  andar e voar extraídas dos vídeos de referência, com a barata no mesmo tamanho da bolinha atual.
  Velocidade das animações (15 fps andando, 20 fps voando) aprovada para o MVP.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Barata visivelmente animada durante todo o trajeto (Priority: P1)

Como jogador, eu quero ver a barata se movendo de forma viva (pernas ou asas em movimento) durante
todo o trajeto até a comida, em vez do sprite estático atual, para que o jogo pareça mais vivo e as
baratas sejam mais fáceis de notar e acompanhar visualmente.

**Why this priority**: é a base da feature — sem substituir o sprite estático por uma animação
contínua, não há locomoção nenhuma para diferenciar em "andando" ou "voando". Entrega valor visual
imediato por si só, mesmo antes de qualquer variação de estilo.

**Independent Test**: iniciar uma partida, observar uma barata do spawn até o alvo, e confirmar que
ela nunca aparece como um sprite parado — pernas ou asas estão sempre em movimento perceptível
durante todo o trajeto, inclusive quando o "juice" de urgência (squash/tremor perto do alvo,
`specs/008-juice-animacao-barata`) também está ativo.

**Acceptance Scenarios**:

1. **Given** uma barata recém-criada no ponto de spawn, **When** ela inicia o trajeto até a comida,
   **Then** a animação de locomoção (pernas ou asas) já está em execução desde o primeiro frame
   visível, nunca aparecendo como um sprite estático.
2. **Given** uma barata em trajeto, **When** ela se aproxima do alvo e o "juice" de urgência
   (squash/stretch/tremor) se intensifica, **Then** a animação de locomoção continua tocando por
   baixo do efeito de urgência — as duas camadas compõem, nenhuma substitui a outra.
3. **Given** uma barata eliminada por um clique, **When** ela cai (efeito visual já existente,
   FR-020 da spec do MVP), **Then** a animação de locomoção para nesse momento — a queda usa o
   efeito de eliminação já entregue, não a animação de locomoção.
4. **Given** uma barata que alcança o alvo e rouba a comida, **When** ela deixa de estar ativa,
   **Then** a animação de locomoção para nesse mesmo instante, junto com o resto da apresentação
   dessa barata — nenhuma oscilação residual continua visível depois do roubo.

---

### User Story 2 - Dois estilos visuais de locomoção: andando e voando (Priority: P2)

Como jogador, eu quero perceber baratas com estilos de movimento visualmente diferentes (algumas
andando, outras voando) em vez de todas se moverem de forma idêntica, para que a cena pareça mais
variada e menos repetitiva.

**Why this priority**: constrói em cima da User Story 1 (depende da animação contínua já existir)
adicionando variedade visual — o jogo já funciona plenamente com um único estilo de locomoção
aplicado a todas as baratas (US1), então a diferenciação em dois estilos é incremental.

**Independent Test**: observar várias baratas ativas ao mesmo tempo e confirmar que pelo menos duas
delas exibem estilos de locomoção visualmente diferentes entre si (uma com movimento de pernas
característico de andar, outra com movimento de asas característico de voar), cada uma mantendo seu
próprio estilo do spawn até o fim do trajeto.

**Acceptance Scenarios**:

1. **Given** uma nova barata é criada, **When** ela começa a se mover, **Then** o sistema atribui a
   ela um dos dois estilos de locomoção (andando ou voando), escolhido de forma independente de
   qualquer outra barata ativa.
2. **Given** uma barata com um estilo já atribuído, **When** ela percorre todo o trajeto até o alvo
   (ou até ser eliminada/roubar a comida), **Then** o estilo escolhido permanece o mesmo do início ao
   fim — nunca muda no meio do trajeto.
3. **Given** múltiplas baratas ativas simultaneamente, **When** o jogador observa a cena, **Then** é
   possível ver baratas com os dois estilos coexistindo ao mesmo tempo (não é um modo global único
   para toda a partida).

---

### Edge Cases

- O que acontece com a animação de locomoção durante a pausa da partida (`specs/009-pausar-partida`)?
  Ela deve congelar junto com o resto da partida (mesmo comportamento já garantido para o "juice" de
  `specs/008-juice-animacao-barata`), sem continuar avançando enquanto pausada.
- O que acontece se a arte final (frames de andar/voar) ainda não estiver pronta quando a
  implementação começar? A feature não deve ficar bloqueada por isso — ver Assumptions.
- O que acontece com uma barata muito perto do alvo, quando o squash/stretch de urgência é mais
  intenso? A animação de locomoção de base continua visível por baixo, sem ser "engolida" pelo
  efeito de urgência (ver User Story 1, cenário 2).
- O que acontece com o som ambiente de voo (`sfx-fly`, já existente) quando há baratas "andando" em
  cena? Fica fora do escopo desta spec — ver Assumptions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE substituir o sprite estático atual da barata por uma animação de
  locomoção contínua (pernas ou asas em movimento perceptível) durante todo o trajeto do spawn até
  o alvo, a eliminação ou o roubo da comida.
- **FR-002**: O sistema DEVE sortear, no momento em que cada barata é criada, um único estilo de
  locomoção — "andando" ou "voando" — de forma independente para cada barata (sem fases sequenciais
  dentro do trajeto de uma mesma barata).
- **FR-003**: O estilo de locomoção de uma barata (uma vez atribuído) NÃO DEVE mudar mais durante o
  trajeto dessa barata — permanece consistente do spawn até a eliminação, o roubo da comida, ou o
  fim da partida.
- **FR-004**: A animação de locomoção DEVE continuar tocando (avançando) durante toda a duração do
  trajeto, inclusive quando o "juice" de urgência (`specs/008-juice-animacao-barata`: squash,
  stretch e tremor crescentes conforme a barata se aproxima do alvo) também estiver ativo — as duas
  camadas de animação compõem uma sobre a outra, nenhuma substitui ou interrompe a outra.
- **FR-005**: A animação de locomoção NÃO DEVE alterar a posição real usada pelo hit-testing de
  clique (`positionAt()`, `CollisionSystem`, `specs/001-roach-fridge-clicker`) — é puramente uma
  camada visual, seguindo o mesmo princípio de não-interferência já estabelecido para o "juice" de
  `specs/008-juice-animacao-barata`.
- **FR-006**: A animação de locomoção DEVE parar no exato momento em que a barata deixa de estar
  ativa — seja eliminada por um clique (o efeito visual de queda já existente, FR-020 da spec do
  MVP, assume a apresentação a partir daí), seja por alcançar o alvo e roubar a comida (a barata
  simplesmente some da cena) — em nenhum dos dois casos resta qualquer oscilação residual de
  locomoção.
- **FR-007**: A animação de locomoção DEVE congelar (parar de avançar) enquanto a partida estiver
  pausada (`specs/009-pausar-partida`), retomando de onde parou ao despausar — mesmo comportamento
  já garantido para o "juice" de `specs/008-juice-animacao-barata`.
- **FR-008**: A barata DEVE ser exibida com animações por quadros de andar e voar extraídas das
  referências `docs/references/barata_caminhada.mp4` e `docs/references/barata_voo.mp4` (fundo
  removido), substituindo a bolinha placeholder — o estilo sorteado (FR-002) define qual das duas
  animações a barata toca. A oscilação procedural de ângulo (inicialmente prevista como substituta
  provisória da arte) continua somada por cima, como balanço adicional. *(Revisado em 2026-09-27 —
  ver Clarifications.)*
- **FR-009**: A barata DEVE ficar orientada na direção do seu trajeto (do ponto de spawn até o
  alvo), espelhada horizontalmente quando segue para a esquerda, para nunca aparecer de cabeça para
  baixo. Baratas simultâneas NÃO DEVEM animar em sincronia (cada uma começa num quadro aleatório).
- **FR-010**: O corpo da barata animada DEVE ter aproximadamente o mesmo tamanho da bolinha
  placeholder anterior (diâmetro `ROACH_VISUAL_RADIUS * 2`), para não alterar a percepção da área
  clicável — a hitbox continua sendo o raio fixo de `CollisionSystem`, nunca os pixels do sprite.

### Key Entities

- **Estilo de locomoção**: atributo de apresentação de uma barata em trajeto — "andando" ou
  "voando" — que determina qual animação visual contínua é exibida para essa barata. Não é uma
  regra de domínio da partida (não afeta velocidade, hitbox, pontuação ou condição de derrota); é
  puramente visual, atribuído uma vez e mantido pelo resto do trajeto da barata (FR-002, FR-003).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em qualquer momento durante uma partida, 100% das baratas ativas em trajeto exibem
  movimento perceptível de locomoção (pernas ou asas) — nenhuma aparece como sprite parado.
- **SC-002**: Ao observar uma partida com múltiplas baratas simultâneas, é possível identificar
  visualmente pelo menos dois estilos de locomoção diferentes coexistindo na mesma cena.
- **SC-003**: A introdução da animação de locomoção não altera o tempo de resposta entre o clique do
  jogador e a eliminação da barata (ou ausência de efeito, em clique vazio) — responsividade do
  clique (Princípio V) permanece idêntica à medida antes desta feature.
- **SC-004**: Em uma sessão de playtest informal com pelo menos 3 jogadores, a maioria (≥2 de 3)
  relata perceber as baratas como mais "vivas"/variadas em comparação ao sprite estático anterior.

## Assumptions

- A arte das animações é gerada automaticamente a partir dos vídeos de referência (IA) pelo
  pipeline em `docs/references/roach-animations/` — suficiente para o MVP, mas com limitações
  conhecidas (loop que fecha "quase", recorte automático, vista 3/4 lateral). O aprimoramento da
  arte fica para um card próprio no `backlog.md` (seção 1), fora do escopo desta spec. Os quadros em
  resolução maior (256px) ficam versionados nessa pasta como ponto de partida.
- O som ambiente de voo (`sfx-fly`, `specs/003-feedback-sonoro-sfx`) e o asset reservado
  `walk.mp3`/`sfx-walk` (FR-011 de `specs/003-feedback-sonoro-sfx`, criado especificamente
  antecipando esta feature) permanecem fora do escopo desta spec — nenhuma mudança de áudio é feita
  aqui; associar `sfx-walk` ao estilo "andando" fica para uma iteração futura, se priorizada.
- O efeito de "juice" (squash/stretch/tremor, `specs/008-juice-animacao-barata`) continua existindo
  sem alteração em sua lógica de cálculo — a nova animação de locomoção é uma camada visual adicional
  que compõe com ele, não uma substituição (FR-004), seguindo a composição já sugerida no backlog
  ("locomoção como baseline sempre ativo, urgência como modulação por cima").
- Esta feature é puramente de apresentação/render (Princípio I da constitution) — nenhuma regra de
  jogo, estado de partida, velocidade de trajeto ou hitbox de colisão é alterada por ela.
- Dispositivos touch e a responsividade mobile (`specs/006-responsividade-mobile`) não exigem
  tratamento especial nesta spec — a animação de locomoção é renderizada da mesma forma
  independentemente da orientação/resolução, escalando junto com o resto do sprite da barata.
