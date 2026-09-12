# Feature Specification: Loop Principal — Baratas na Geladeira

**Feature Branch**: `001-roach-fridge-clicker`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Um jogo de navegador estilo "point and click" ambientado dentro de uma geladeira aberta, com prateleiras contendo várias comidas. Baratas surgem periodicamente, cada uma mirando em uma comida específica de uma prateleira, e se movem em direção a essa comida ao longo de um tempo fixo de reação. O jogador deve clicar em uma barata antes que ela alcance sua comida-alvo; ao ser clicada, a barata cai e desaparece imediatamente da tela. Se o jogador não clicar a tempo, a barata rouba a comida (a comida desaparece da prateleira e não pode ser recuperada) e a barata some da tela. A frequência e a velocidade de surgimento das baratas são fixas durante toda a partida, sem dificuldade progressiva, e não há sistema de pontuação nesta versão. A partida começa a partir de uma tela inicial e termina em derrota quando todas as comidas das prateleiras tiverem sido roubadas; nesse momento, uma tela final indica a derrota e permite reiniciar a partida sem recarregar a página. A responsividade do clique é essencial: a detecção de clique sobre a barata deve ser precisa e imediata, sem atraso perceptível entre a ação do jogador e a resposta visual."

## Clarifications

### Session 2026-09-12

- Q: Quando uma barata surge, o jogador consegue identificar visualmente qual comida é o alvo dela antes ou enquanto ela se move? → A: Nenhum destaque adicional; o jogador infere o alvo apenas pela trajetória de movimento da barata em direção à comida-alvo.
- Q: Quando o jogador elimina uma barata ou uma barata rouba uma comida, o jogo deve dar algum feedback visual/sonoro além do desaparecimento simples? → A: Feedback visual mínimo obrigatório (ex: animação curta de queda ao ser clicada, efeito rápido no espaço da comida ao ser roubada), sem áudio nesta versão.
- Q: Existe um limite máximo de baratas simultâneas em tela, além do implícito por FR-009? → A: Não há teto numérico adicional; o limite é implícito — no máximo uma barata ativa por comida ainda presente na partida.
- Q: O jogador vê algum indicador de progresso/risco (ex: contagem de comidas restantes) durante a partida? → A: Não há HUD; o jogador acompanha o estado apenas observando visualmente as prateleiras (comida presente ou ausente).
- Q: De onde as baratas surgem em relação à prateleira/comida-alvo? → A: Baratas surgem em pontos de entrada fixos nas bordas da cena (fora das prateleiras) e percorrem toda a distância visível até a comida-alvo.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Eliminar baratas antes que roubem comida (Priority: P1)

Como jogador, durante uma partida em andamento, eu quero clicar em uma barata antes que ela
alcance sua comida-alvo, para impedir que ela roube essa comida.

**Why this priority**: é o loop de ação central do jogo — toda a experiência gira em torno de
reagir a tempo. Sem isso não há jogo, apenas uma tela decorativa.

**Independent Test**: com uma partida em andamento (comidas nas prateleiras, pelo menos uma
barata em tela), clicar em uma barata antes dela alcançar seu alvo e confirmar que ela some
imediatamente e a comida-alvo permanece intacta; deixar uma segunda barata alcançar seu alvo
sem clicar e confirmar que a comida correspondente desaparece e não pode ser recuperada.

**Acceptance Scenarios**:

1. **Given** uma barata em tela se movendo em direção a uma comida-alvo ainda presente na
   prateleira, **When** o jogador clica na barata antes de ela alcançar o alvo, **Then** a
   barata desaparece da tela imediatamente e a comida-alvo permanece na prateleira.
2. **Given** uma barata em tela se movendo em direção a uma comida-alvo, **When** o jogador não
   clica nela antes de ela alcançar o alvo, **Then** a comida-alvo desaparece permanentemente da
   prateleira e a barata some da tela.
3. **Given** uma barata que já foi eliminada por um clique anterior, **When** o jogador clica na
   posição onde ela estava, **Then** nada acontece (não há efeito colateral, nenhuma outra
   barata ou comida é afetada).

---

### User Story 2 - Perder a partida quando todas as comidas somem (Priority: P2)

Como jogador, eu quero que a partida termine com uma tela clara de derrota assim que todas as
comidas tiverem sido roubadas, para saber exatamente quando a partida acabou e poder tentar de
novo.

**Why this priority**: fecha o ciclo da partida iniciado pela User Story 1 — sem uma condição de
fim clara, o jogador não tem como saber que a partida terminou nem como recomeçar.

**Independent Test**: iniciar uma partida com um conjunto pequeno de comidas, deixar (ou
simular) que todas sejam roubadas por baratas não eliminadas, e confirmar que a tela de derrota
aparece assim que a última comida some, oferecendo a opção de reiniciar.

**Acceptance Scenarios**:

1. **Given** uma partida em andamento com exatamente uma comida restante em todas as
   prateleiras, **When** essa última comida é roubada por uma barata não eliminada, **Then** a
   partida entra imediatamente em estado de derrota e nenhuma nova barata surge a partir desse
   momento.
2. **Given** a partida em estado de derrota, **When** a tela final é exibida, **Then** ela
   comunica claramente que o jogador perdeu e oferece uma opção visível para reiniciar a
   partida.
3. **Given** a tela final de derrota, **When** o jogador escolhe reiniciar, **Then** uma nova
   partida começa com todas as prateleiras restauradas com suas comidas originais e nenhuma
   barata em tela, sem que a página seja recarregada.

---

### User Story 3 - Começar uma partida a partir da tela inicial (Priority: P3)

Como jogador, eu quero ver uma tela inicial ao abrir o jogo e poder começar uma partida a partir
dela, para entender que estou prestes a jogar e iniciar quando estiver pronto.

**Why this priority**: é o ponto de entrada da experiência, mas depende das mecânicas das
Histórias 1 e 2 já existirem para ter valor — por isso vem depois na priorização, embora seja
tecnicamente simples.

**Independent Test**: abrir o jogo, confirmar que a tela inicial aparece antes de qualquer
comida ou barata em tela, acionar a opção de começar e confirmar que a partida passa a exibir as
prateleiras com comidas e o spawn de baratas se inicia.

**Acceptance Scenarios**:

1. **Given** o jogo recém-aberto, **When** nenhuma ação foi tomada ainda, **Then** a tela
   inicial é exibida e nenhuma comida, prateleira ou barata de uma partida é mostrada.
2. **Given** a tela inicial, **When** o jogador aciona a opção de começar, **Then** uma nova
   partida se inicia com todas as prateleiras totalmente abastecidas e o surgimento periódico de
   baratas passa a ocorrer.

---

### Edge Cases

- O que acontece se o jogador clicar exatamente no instante em que a barata alcança a comida-alvo
  (empate entre clique e roubo)? O sistema deve tratar isso de forma determinística e favorecer
  uma das duas resoluções de forma consistente (ver FR-017).
- O que acontece se duas ou mais baratas estiverem sobrepostas visualmente na tela? O clique deve
  afetar apenas uma barata por vez, de forma previsível (ver FR-018).
- O que acontece se uma comida ainda não tiver nenhuma barata mirando nela quando o jogo decide o
  alvo da próxima barata? O sistema nunca deve atribuir uma barata a uma comida já roubada (ver
  FR-009).
- O que acontece se o jogador clicar em uma área vazia da tela (sem nenhuma barata)? Nenhum
  efeito deve ocorrer.
- O que acontece se o jogador reiniciar a partida repetidamente em sequência rápida? Cada
  reinício deve produzir um estado inicial limpo e consistente, sem baratas ou animações da
  partida anterior remanescentes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir uma tela inicial ao carregar o jogo, permitindo ao jogador
  iniciar uma partida.
- **FR-002**: Ao iniciar uma partida, o sistema DEVE exibir prateleiras contendo múltiplos itens
  de comida distintos.
- **FR-003**: O sistema DEVE fazer baratas surgirem periodicamente, em uma frequência fixa que
  não muda durante a partida.
- **FR-004**: Cada barata, ao surgir, DEVE ser associada a uma comida específica e ainda presente
  como seu alvo — nunca a um ponto arbitrário da tela. O sistema NÃO DEVE fornecer nenhum destaque
  visual adicional (highlight, seta, linha) na comida-alvo; a trajetória de movimento da barata em
  direção a ela é o único indício do alvo para o jogador.
- **FR-005**: Cada barata DEVE surgir em um ponto de entrada fixo na borda da cena (fora das
  prateleiras) e se mover em direção à sua comida-alvo ao longo de um tempo fixo de reação, igual
  para todas as baratas de uma mesma partida, percorrendo toda a distância visível entre o ponto
  de entrada e a comida.
- **FR-006**: O sistema DEVE detectar o clique/toque do jogador sobre uma barata e removê-la
  imediatamente da tela quando o clique for válido e ocorrer antes de a barata alcançar seu
  alvo.
- **FR-007**: Se uma barata não for clicada antes de alcançar sua comida-alvo, o sistema DEVE
  remover essa comida permanentemente da prateleira e remover a barata da tela.
- **FR-008**: Uma comida removida por roubo NÃO PODE ser restaurada durante a mesma partida.
- **FR-009**: O sistema NÃO PODE atribuir uma barata a uma comida que já tenha sido roubada.
- **FR-010**: O sistema DEVE encerrar a partida em estado de derrota quando todas as comidas de
  todas as prateleiras tiverem sido roubadas.
- **FR-011**: Ao entrar em estado de derrota, o sistema DEVE exibir uma tela final que comunique
  claramente que o jogador perdeu (ex.: mensagem "Todas as comidas foram roubadas! Você perdeu.",
  conforme `prd.md` §5).
- **FR-012**: A tela final DEVE oferecer ao jogador uma opção para reiniciar a partida sem
  recarregar a página.
- **FR-013**: Uma partida reiniciada DEVE restaurar todas as comidas em todas as prateleiras ao
  estado inicial e remover qualquer barata em tela da partida anterior.
- **FR-014**: Nenhuma barata DEVE surgir após a partida entrar em estado de derrota, até que uma
  nova partida seja iniciada.
- **FR-015**: A detecção de clique sobre uma barata DEVE corresponder à posição atualmente visível
  da barata na tela, sem atraso perceptível entre a ação do jogador e a remoção visual da barata.
- **FR-016**: A frequência de surgimento e a velocidade de deslocamento das baratas DEVEM
  permanecer constantes durante toda a partida — o sistema NÃO DEVE aumentar a dificuldade
  progressivamente nesta versão.
- **FR-017**: Quando o clique do jogador em uma barata ocorrer no mesmo instante em que ela
  alcança sua comida-alvo, o sistema DEVE resolver esse empate de forma consistente e
  determinística, favorecendo o clique do jogador (a barata é eliminada e a comida é salva).
- **FR-018**: Quando múltiplas baratas estiverem visualmente sobrepostas, um clique DEVE afetar
  no máximo uma única barata por vez, de forma previsível (ex: a barata mais "acima" na pilha
  visual).
- **FR-019**: O sistema NÃO DEVE incluir nenhum mecanismo de pontuação nesta versão.
- **FR-020**: O sistema DEVE exibir um feedback visual breve e imediato ao eliminar uma barata
  (ex: animação curta de queda) e ao uma comida ser roubada (ex: efeito rápido no espaço da
  comida). Nenhum feedback sonoro é requerido nesta versão.
- **FR-021**: O número de baratas ativas simultaneamente em tela NÃO PODE exceder o número de
  comidas ainda presentes na partida (decorrência de FR-009); não há nenhum teto numérico
  adicional de baratas simultâneas nesta versão.
- **FR-022**: O sistema NÃO PRECISA exibir nenhum HUD ou contador numérico de comidas
  restantes/roubadas durante a partida; o estado da partida é comunicado apenas pela presença ou
  ausência visual das comidas nas prateleiras, até a tela final de derrota (FR-011).

### Key Entities

- **Comida (Food Item)**: um item específico posicionado em uma prateleira; possui um estado
  (presente ou roubada) e é o alvo de exatamente zero ou uma barata ativa por vez.
- **Prateleira (Shelf)**: um agrupamento de comidas dentro da geladeira; a partida contém uma ou
  mais prateleiras.
- **Barata (Roach)**: uma entidade que surge associada a uma comida-alvo específica, se move em
  direção a ela por um tempo fixo, e é removida da partida ao ser clicada com sucesso ou ao
  alcançar seu alvo (roubando a comida).
- **Partida (Match)**: representa uma sessão de jogo em andamento — quais comidas restam, quais
  baratas estão ativas, e se a partida está em andamento ou em estado de derrota.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um jogador consegue iniciar uma partida a partir da tela inicial com uma única
  ação (um clique/toque).
- **SC-002**: Em pelo menos 99% dos cliques realizados sobre uma barata ainda visível em tela,
  a barata é removida instantaneamente, sem atraso perceptível pelo jogador entre a ação e a
  resposta visual.
- **SC-003**: 100% das baratas que alcançam sua comida-alvo sem terem sido clicadas resultam na
  remoção exatamente dessa comida, sem afetar nenhuma outra comida ou prateleira.
- **SC-004**: A partida entra em estado de derrota exatamente no momento em que a última comida
  restante é roubada, sem exceções.
- **SC-005**: Um jogador consegue reiniciar uma partida a partir da tela final e ver uma nova
  partida pronta para jogar (prateleiras totalmente restauradas, nenhuma barata em tela) em
  menos de 2 segundos, sem que a página seja recarregada, em 100% das tentativas.
- **SC-006**: O jogo mantém uma taxa de quadros estável de 60 FPS (mínimo aceitável: 55 FPS)
  durante toda a partida, sem engasgos perceptíveis, do início ao fim de uma partida completa.

## Assumptions

- O número de prateleiras e de itens de comida por partida é fixo e pré-definido para esta
  versão (não configurável pelo jogador); o valor exato será definido durante o planejamento
  técnico, não nesta especificação.
- A frequência de surgimento das baratas e o tempo de reação (tempo até alcançar o alvo) são
  constantes fixas da partida, iguais para todas as baratas, sem variação nem configuração pelo
  jogador nesta versão — consistente com a ausência de dificuldade progressiva no MVP.
- Esta partida tem apenas uma condição de encerramento (derrota); não há condição de vitória
  nesta versão, consistente com o escopo do MVP descrito no PRD do projeto.
- A coleta de feedback dos jogadores (ex.: link para formulário ao final da partida) e métricas
  de sucesso do produto, mencionadas no PRD geral, estão fora do escopo desta especificação e
  serão tratadas como uma feature separada, se necessário.
- O alvo principal são navegadores desktop atuais (Chrome, Firefox, Edge); suporte a mobile/touch
  fica fora do escopo funcional desta versão, ainda que a detecção de clique deva ser compatível
  com entrada por toque no futuro.
- Existe uma pequena margem de tolerância na área clicável de cada barata, para não penalizar
  cliques quase certeiros; o tamanho exato dessa margem é um detalhe de implementação a ser
  definido no planejamento técnico.
