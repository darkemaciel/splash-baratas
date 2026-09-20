# Feature Specification: Teto de Baratas Simultâneas Progressivo

**Feature Branch**: `013-teto-baratas-simultaneas`

**Created**: 2026-09-19

**Status**: Draft

**Input**: User description: "Teto de baratas simultâneas progressivo (P1 do backlog, seção 2 \"Progressão e replayability\"): hoje o limite implícito de baratas ativas ao mesmo tempo é uma barata por comida presente (FR-021 do MVP, specs/001-roach-fridge-clicker) — ou seja, o teto varia com o número de comidas restantes (até 9 no início, diminuindo conforme comidas são roubadas). Esta feature substitui esse limite implícito por um teto explícito de baratas simultâneas que começa mais baixo no início da partida e escala progressivamente ao longo do tempo de sobrevivência (mesmo padrão de rampa já usado por specs/011-dificuldade-progressiva para SPAWN_INTERVAL/TRAVEL_DURATION), aumentando o ritmo/dificuldade conforme o jogador sobrevive mais tempo. Importante: o teto NÃO deve ser configurável pelo jogador nem exposto como opção — é só mais um parâmetro de balanceamento interno, com valores fixos no código (base/piso/duração da rampa), assim como os demais parâmetros de dificuldade progressiva já entregues."

## Clarifications

### Session 2026-09-20

- Q: O teto de baratas simultâneas vigente a cada momento deve aparecer para o jogador de alguma forma (ex.: um indicador na HUD), ou deve continuar totalmente invisível, perceptível só pelo número de baratas que aparecem em tela? → A: Continua totalmente invisível — nenhuma UI nova; o jogador só percebe pelo número de baratas em tela, mesmo padrão de `specs/011-dificuldade-progressiva`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Início mais calmo, ficando mais caótico quanto mais se sobrevive (Priority: P1)

Ao começar uma partida, o jogador quer enfrentar poucas baratas simultâneas em tela, para ter um
início gerenciável; conforme continua sobrevivendo, quer que esse número máximo suba
gradualmente, para que sobreviver por mais tempo se torne visivelmente mais caótico do que o
início.

**Why this priority**: É o mecanismo central desta feature — sem um teto que comece baixo e cresça
com o tempo, não existe a sensação de "início calmo, fim caótico" que a progressão de dificuldade
já entrega para cadência de spawn e tempo de reação (`specs/011-dificuldade-progressiva`), mas que
hoje não existe para o número de baratas simultâneas (esse número já começa no máximo possível, uma
por comida presente).

**Independent Test**: Iniciar uma partida nova e, sem clicar em nenhuma barata, contar o número
máximo de baratas simultaneamente visíveis em tela nos primeiros segundos; confirmar que fica
visivelmente abaixo do número de comidas ainda presentes. Continuar observando por alguns minutos e
confirmar que esse número máximo simultâneo cresce em relação ao observado no início.

**Acceptance Scenarios**:

1. **Given** uma partida recém-iniciada, com todas as comidas presentes, **When** baratas
   suficientes seriam necessárias para atacar todas as comidas ao mesmo tempo, **Then** o número de
   baratas ativas simultaneamente fica limitado a um teto inicial menor que o número de comidas
   presentes.
2. **Given** uma partida recém-iniciada em que o teto inicial de baratas simultâneas já foi
   atingido, **When** nenhuma das baratas ativas é eliminada nem rouba sua comida-alvo, **Then**
   nenhuma barata nova surge até que uma das ativas seja eliminada ou roube sua comida, liberando
   espaço no teto.
3. **Given** uma partida em andamento sem nenhuma comida perdida, **When** o jogador sobrevive por
   vários minutos, **Then** o número máximo de baratas simultaneamente visíveis observado nos
   minutos finais é maior do que o observado no primeiro minuto.

---

### User Story 2 - O teto nunca pede mais baratas do que existem comidas para atacar (Priority: P2)

Em qualquer momento da partida, o jogador quer que o número de baratas em tela nunca ultrapasse o
número de comidas que ainda restam, mesmo em uma partida avançada em que o teto já cresceu bastante
mas restam poucas comidas — do contrário, o teto poderia forçar uma situação sem sentido (baratas
sem nenhuma comida disponível para mirar).

**Why this priority**: É uma garantia de coerência sobre o comportamento da US1 — sem ela, um teto
alto o suficiente numa partida avançada com poucas comidas restantes poderia contradizer a regra já
existente de que cada barata ativa mira uma comida distinta ainda presente (`specs/001`, FR-009).

**Independent Test**: Jogar (ou simular) uma partida avançada, com o teto já crescido, até restarem
poucas comidas; confirmar que o número de baratas ativas simultaneamente nunca excede o número de
comidas ainda presentes naquele momento, mesmo que o teto vigente seja maior.

**Acceptance Scenarios**:

1. **Given** uma partida avançada em que o teto vigente é maior que o número de comidas ainda
   presentes, **When** o sistema decide se cria uma nova barata, **Then** o número de baratas ativas
   simultaneamente continua limitado ao número de comidas presentes, não ao teto vigente.

---

### User Story 3 - O teto nunca cresce além de um máximo jogável (Priority: P3)

Enquanto joga uma partida muito longa, o jogador quer ter certeza de que o número máximo de
baratas simultâneas para de crescer a partir de um certo ponto, para que sobreviver por muito tempo
continue sendo caótico e desafiador em vez de se tornar literalmente impossível de acompanhar.

**Why this priority**: É uma garantia de segurança sobre a US1, no mesmo espírito do piso mínimo já
garantido pela dificuldade progressiva de cadência/tempo de reação (`specs/011`, US3) — sem ela, uma
partida longa o suficiente poderia crescer o teto indefinidamente até um ponto injogável.

**Independent Test**: Simular uma partida extremamente longa (bem além do tempo de sobrevivência
típico) e confirmar que, a partir de um certo ponto, o teto de baratas simultâneas para de
continuar crescendo, estabilizando em um valor máximo fixo.

**Acceptance Scenarios**:

1. **Given** uma partida que já dura muito além do tempo de sobrevivência típico, **When** o
   jogador continua sobrevivendo, **Then** o teto de baratas simultâneas não ultrapassa um valor
   máximo fixo definido, mesmo que a partida continue por mais tempo ainda.

### Edge Cases

- O que acontece quando o teto vigente já foi atingido no momento em que a cadência de spawn
  (`specs/011-dificuldade-progressiva`) indicaria uma nova barata? A criação dessa barata é adiada
  até o número de baratas ativas cair abaixo do teto — não há fila nem múltiplas baratas surgindo de
  uma vez para compensar o atraso; assim que houver espaço, a criação volta ao ritmo normal.
- O que acontece com a progressão do teto enquanto a partida está pausada (`specs/009-pausar-partida`)?
  Não avança — o tempo pausado não conta, mesmo comportamento já adotado pela dificuldade
  progressiva de cadência/tempo de reação (`specs/011`, FR-006).
- O que acontece com o teto ao reiniciar uma partida (`FR-013` do MVP)? Volta exatamente ao valor
  inicial, independentemente de quão alto o teto tinha ficado na partida anterior.
- Este teto interage com a dificuldade progressiva de cadência de spawn/tempo de reação
  (`specs/011`)? São mecanismos independentes que coexistem na mesma partida — cadência e tempo de
  reação controlam a frequência e a duração do trajeto de cada barata individual, enquanto o teto
  controla apenas quantas podem estar ativas ao mesmo tempo; nenhum dos dois precisa mudar o
  comportamento do outro.
- O teto é exposto como opção de dificuldade ou configuração para o jogador, ou mostrado por algum
  indicador informativo (ex.: HUD)? Nenhum dos dois — não é configurável nem exposto como opção em
  nenhuma tela, e também não tem nenhum indicador visual dedicado; é um parâmetro de balanceamento
  interno, totalmente invisível, perceptível apenas pelo comportamento do jogo (`## Clarifications`,
  sessão 2026-09-20).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE limitar o número de baratas ativas simultaneamente a um teto explícito,
  calculado a partir do tempo de sobrevivência decorrido na partida atual, substituindo o limite
  hoje puramente implícito de uma barata por comida presente (FR-021 da `specs/001-roach-fridge-clicker`).
- **FR-002**: O teto DEVE começar, no início de cada partida, em um valor menor que o número total
  de comidas presentes, para que o início de partida tenha visivelmente menos baratas simultâneas
  do que o comportamento atual.
- **FR-003**: O teto DEVE aumentar gradualmente conforme o tempo de sobrevivência da partida atual
  avança, permitindo mais baratas simultâneas em tela quanto mais tempo o jogador sobreviver.
- **FR-004**: O aumento do teto DEVE ser gradual e contínuo ao longo do tempo de sobrevivência, sem
  saltos abruptos perceptíveis de um instante para o outro.
- **FR-005**: O teto DEVE ter um valor máximo fixo, a partir do qual para de aumentar,
  independentemente de quanto tempo a partida continuar.
- **FR-006**: Independentemente do valor do teto vigente, o número de baratas ativas
  simultaneamente NUNCA PODE exceder o número de comidas ainda presentes na partida — o teto
  explícito é sempre um limite adicional, nunca uma permissão para ultrapassar a garantia já
  existente de que cada barata ativa mira uma comida distinta ainda presente (Key Entities/FR-021 da
  `specs/001-roach-fridge-clicker`).
- **FR-007**: O sistema DEVE impedir a criação de novas baratas enquanto o número de baratas ativas
  estiver no teto vigente, retomando a criação normal assim que esse número cair abaixo do teto (por
  eliminação da barata ou por roubo de comida).
- **FR-008**: O teto NÃO DEVE ser configurável pelo jogador nem exposto como opção em nenhuma tela
  do jogo — é um parâmetro de balanceamento interno, com valores fixos no código.
- **FR-009**: A progressão do teto NÃO DEVE avançar enquanto a partida estiver pausada
  (`specs/009-pausar-partida`) — mesmo comportamento já adotado pela dificuldade progressiva de
  cadência/tempo de reação (`specs/011-dificuldade-progressiva`, FR-006).
- **FR-010**: O teto DEVE reiniciar para o valor inicial no começo de toda nova partida, incluindo
  após um reinício a partir da tela de derrota.
- **FR-011**: As demais regras do loop principal (condição de derrota, eliminação por clique, roubo
  de comida) NÃO DEVEM mudar — o teto afeta exclusivamente quantas baratas podem estar ativas ao
  mesmo tempo, não o restante das regras do MVP.
- **FR-012**: O sistema NÃO DEVE exibir nenhum indicador de HUD ou outro elemento de UI para o teto
  vigente — a progressão DEVE permanecer perceptível apenas pelo comportamento observado em tela
  (mais ou menos baratas simultâneas), sem nenhum elemento visual dedicado a comunicá-la
  (`## Clarifications`, sessão 2026-09-20).

### Key Entities

- **Teto de baratas simultâneas**: um valor derivado unicamente do tempo de sobrevivência decorrido
  na partida atual (descontando o tempo pausado), no mesmo espírito do nível de dificuldade de
  `specs/011-dificuldade-progressiva`; não é persistido nem exposto como estado próprio ao jogador —
  é recalculado a cada instante e volta ao valor inicial a cada nova partida.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em uma partida recém-iniciada com todas as comidas presentes, o número máximo de
  baratas simultaneamente visíveis em tela é perceptivelmente menor do que o número de comidas
  presentes.
- **SC-002**: Em uma partida de 3+ minutos sem perder nenhuma comida, o número máximo de baratas
  simultaneamente visíveis observado nos últimos 30 segundos é maior do que o observado nos
  primeiros 30 segundos.
- **SC-003**: Em uma partida muito mais longa que o tempo de sobrevivência típico, o número máximo
  de baratas simultâneas observado nunca ultrapassa um valor máximo fixo, por mais que a partida
  continue.
- **SC-004**: Em nenhum momento de qualquer partida o número de baratas ativas simultaneamente
  excede o número de comidas ainda presentes naquele instante.
- **SC-005**: Reiniciar uma partida, em qualquer nível de teto que a anterior tenha alcançado,
  sempre resulta em uma nova partida começando exatamente no teto inicial.
- **SC-006**: Em sessões de teste informal, jogadores relatam perceber que o início da partida é
  mais gerenciável e que, com o tempo, mais baratas passam a aparecer simultaneamente em tela, sem
  identificar isso como uma opção ou configuração do jogo.

## Assumptions

- O valor exato do teto inicial, do teto máximo e da duração da rampa de crescimento ficam a
  critério da fase de planejamento técnico — o requisito de produto é apenas que o teto comece
  abaixo do número de comidas presentes, cresça de forma gradual e tenha um máximo fixo (FR-002 a
  FR-005), assim como a forma exata da curva já ficou a critério do planejamento em
  `specs/011-dificuldade-progressiva`.
- A rampa de crescimento do teto pode reaproveitar a mesma duração/padrão já usado pela dificuldade
  progressiva de cadência de spawn/tempo de reação (`specs/011-dificuldade-progressiva`) ou ter sua
  própria curva independente — decisão de balanceamento tomada na fase de planejamento.
- Esta feature substitui, dentro do seu próprio escopo, a garantia de FR-021 da spec do MVP original
  (`specs/001-roach-fridge-clicker`) de que "não há nenhum teto numérico adicional de baratas
  simultâneas" — essa garantia valia para o MVP sem este teto explícito; esta spec nova é o
  mecanismo previsto pelo Princípio IV da constitution para introduzir a mudança de forma
  deliberada. A garantia complementar de FR-021 (nunca mais de uma barata por comida
  presente) continua válida e é preservada por esta feature (FR-006, US2).
- O teto não é configurável pelo jogador nem exposto como opção, decisão explícita do dono do
  produto — nenhuma tela de configurações é necessária ou prevista para esta feature.
- Não há persistência do teto entre partidas nem qualquer relação com o ranking de high score
  (`specs/012-high-score-local`) — cada partida nova começa do zero, sem depender de partidas
  anteriores.
- Esta feature não introduz novos tipos de barata, não muda a variedade/coerência dos pontos de
  spawn (`specs/010-variacao-pontos-spawn`) e não altera os limiares de bônus de velocidade de
  reação/combo (`specs/004-sistema-pontuacao`) — afeta somente quantas baratas podem estar ativas ao
  mesmo tempo.
- Mobile/touch continuam fora de escopo, seguindo a mesma decisão já registrada no MVP e nas specs
  anteriores.
