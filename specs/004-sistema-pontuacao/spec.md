# Feature Specification: Sistema de Pontuação

**Feature Branch**: `004-sistema-pontuacao`

**Created**: 2026-09-13

**Status**: Draft

**Input**: User description: "Sistema de pontuação: pontos somados por barata eliminada, com bônus por velocidade de reação (quanto mais rápido o clique após o spawn, maior o bônus) e por combos (eliminações consecutivas dentro de uma janela de tempo curta, sem errar). Pontuação total exibida no HUD em tempo real, junto ao contador de progresso/risco já existente. Item do backlog.md, seção 2 'Progressão e replayability', prioridade P1. Fora de escopo do MVP original por decisão explícita do PRD (FR-019); esta é a primeira spec dedicada ao tema, seguindo o Princípio IV da constitution (não alterar retroativamente a spec 001-roach-fridge-clicker)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ganhar pontos ao eliminar baratas (Priority: P1)

Como jogador, eu quero ganhar pontos toda vez que elimino uma barata, para sentir progresso
imediato e ter um objetivo numérico além de simplesmente sobreviver.

**Why this priority**: é a base de todo o sistema — sem pontuação por eliminação básica, bônus de
velocidade e combo não têm sobre o que incidir. Sozinha já entrega valor (substitui a antiga ideia
de "pontuação por barata morta" do backlog).

**Independent Test**: iniciar uma partida, clicar em uma barata antes que ela alcance a comida, e
confirmar que a pontuação exibida aumenta em um valor fixo e previsível imediatamente após a
eliminação.

**Acceptance Scenarios**:

1. **Given** uma partida em andamento com pontuação em 0, **When** o jogador elimina uma barata
   com um clique válido, **Then** a pontuação aumenta pelo valor base de eliminação e o novo total
   é exibido no HUD no mesmo frame.
2. **Given** uma partida em andamento, **When** uma barata rouba uma comida sem ser eliminada,
   **Then** a pontuação não é alterada por esse evento.
3. **Given** uma partida recém-iniciada, **When** a tela de jogo aparece pela primeira vez,
   **Then** a pontuação exibida começa em 0.

---

### User Story 2 - Bônus por velocidade de reação (Priority: P2)

Como jogador, eu quero ganhar pontos extras quando elimino uma barata rapidamente após ela
surgir, para ser recompensado por reflexo e atenção, não só por eliminar no limite do tempo.

**Why this priority**: aprofunda a diversão e a rejogabilidade, mas depende da pontuação base (US1)
já existir; sozinho não sustentaria a feature.

**Independent Test**: eliminar uma barata poucos instantes após seu spawn e comparar a pontuação
ganha com a eliminação de outra barata pouco antes dela alcançar a comida — a primeira deve render
mais pontos que o valor base isolado.

**Acceptance Scenarios**:

1. **Given** uma barata que acabou de surgir, **When** o jogador a elimina dentro da janela de
   reação rápida, **Then** a pontuação ganha nessa eliminação é maior que o valor base sozinho,
   proporcional à rapidez do clique.
2. **Given** uma barata próxima de alcançar a comida (fora da janela de reação rápida), **When** o
   jogador a elimina, **Then** a pontuação ganha é exatamente o valor base, sem bônus de
   velocidade.

---

### User Story 3 - Bônus de combo por eliminações consecutivas (Priority: P3)

Como jogador, eu quero ganhar pontos extras ao eliminar várias baratas seguidas sem errar um
clique e sem deixar nenhuma roubar uma comida, para ser recompensado por manter uma sequência de
acertos.

**Why this priority**: é o refinamento mais avançado do sistema, de maior complexidade de balanceamento;
agrega valor mas o jogo já funciona plenamente com apenas US1 e US2.

**Independent Test**: eliminar três baratas seguidas sem nenhum clique que não acerte uma barata e
sem nenhuma comida ser roubada no intervalo, e confirmar que a pontuação total reflete um bônus de
combo crescente além da soma dos valores base/velocidade individuais; em seguida, deixar uma
comida ser roubada e confirmar que o combo é reiniciado.

**Acceptance Scenarios**:

1. **Given** o jogador acabou de eliminar uma barata, **When** ele elimina outra barata dentro da
   janela de combo, **Then** a sequência de combo avança e a pontuação dessa eliminação recebe um
   bônus adicional proporcional ao tamanho atual da sequência.
2. **Given** uma sequência de combo em andamento, **When** uma comida é roubada por qualquer
   barata (eliminada pelo jogador ou não), **Then** a sequência de combo é reiniciada para zero.
3. **Given** uma sequência de combo em andamento, **When** o jogador clica sem acertar nenhuma
   barata, **Then** a sequência de combo é reiniciada para zero.
4. **Given** uma sequência de combo em andamento, **When** o tempo entre duas eliminações
   consecutivas excede a janela de combo, **Then** a sequência é reiniciada e a próxima eliminação
   conta como início de uma nova sequência (sem bônus de combo).

---

### Edge Cases

- O que acontece com a pontuação e o combo quando a partida termina (todas as comidas roubadas)?
  A pontuação final permanece congelada e visível na tela de fim de jogo; o combo deixa de ter
  efeito.
- O que acontece se o jogador reiniciar a partida? Pontuação e combo voltam a 0, junto com o
  restante do estado da partida (mesmo comportamento de reset já existente no `Match`).
- O que acontece se duas baratas forem eliminadas no mesmo frame (cliques muito próximos)? Cada
  eliminação é processada e pontuada individualmente, na ordem em que os cliques ocorreram.
- O que acontece com o bônus de velocidade se a barata for eliminada exatamente no limite da
  janela de reação rápida? O limite é inclusivo do lado rápido — no limite exato, o bônus ainda se
  aplica.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE manter uma pontuação numérica única por partida, inicializada em 0 no
  início de cada partida e visível ao jogador durante toda a partida.
- **FR-002**: O sistema DEVE somar um valor de pontuação base fixo à pontuação total sempre que uma
  barata for eliminada por um clique válido do jogador.
- **FR-003**: O sistema NÃO DEVE alterar a pontuação quando uma barata rouba uma comida ou quando
  o jogador clica sem acertar nenhuma barata.
- **FR-004**: O sistema DEVE calcular um bônus de velocidade de reação por eliminação, baseado no
  tempo decorrido entre o spawn da barata e o clique que a elimina: quanto menor esse tempo, maior
  o bônus, até um teto máximo de bônus para eliminações dentro da janela de reação mais rápida.
- **FR-005**: O sistema DEVE aplicar bônus de velocidade zero (apenas pontuação base) para
  eliminações que ocorram fora da janela de reação rápida definida.
- **FR-006**: O sistema DEVE rastrear uma sequência de combo (contagem de eliminações consecutivas
  bem-sucedidas dentro de uma janela de tempo entre eliminações), começando em zero no início da
  partida.
- **FR-007**: O sistema DEVE aplicar um bônus de pontuação de combo crescente conforme a sequência
  de combo avança, somado à pontuação base e ao bônus de velocidade daquela eliminação.
- **FR-008**: O sistema DEVE reiniciar a sequência de combo para zero imediatamente quando: (a) uma
  comida é roubada, (b) o jogador clica sem acertar nenhuma barata, ou (c) o tempo entre a
  eliminação anterior e a atual excede a janela de combo.
- **FR-009**: O sistema DEVE atualizar a pontuação exibida no HUD no mesmo frame em que o evento de
  pontuação ocorre, seguindo o padrão de atualização em tempo real já usado pelo indicador de
  progresso/risco (spec `002-hud-progresso-risco`).
- **FR-010**: O sistema DEVE preservar a pontuação final acumulada e exibi-la na tela de fim de
  jogo após a derrota.
- **FR-011**: O sistema DEVE reiniciar a pontuação e a sequência de combo para zero ao iniciar uma
  nova partida (incluindo reinícios após game over), consistente com o reset de estado do `Match`.
- **FR-012**: O cálculo de pontuação (base, bônus de velocidade, bônus de combo) DEVE viver na
  camada de domínio, independente de renderização, conforme o Princípio I da constitution.

### Key Entities

- **Pontuação (Score)**: valor numérico acumulado ao longo da partida; atributo do estado da
  partida (`Match`), com um valor por partida, resetado a cada reinício.
- **Sequência de Combo**: contador de eliminações consecutivas sem falha (nenhuma comida roubada,
  nenhum clique sem acertar nenhuma barata, e a janela de tempo entre eliminações não estourada);
  vive junto ao estado da partida e afeta o cálculo de pontuação de cada eliminação subsequente.
- **Evento de Eliminação**: ocorrência pontual (barata eliminada por clique válido) que carrega os
  dados necessários para o cálculo de pontuação — tempo desde o spawn da barata e estado atual da
  sequência de combo no momento da eliminação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em qualquer eliminação de barata, o jogador vê a pontuação atualizada na tela em até
  um frame de renderização (sem atraso perceptível).
- **SC-002**: Eliminações rápidas (dentro da janela de reação definida) rendem consistentemente
  mais pontos que eliminações tardias da mesma barata, de forma perceptível ao jogador em partidas
  de teste.
- **SC-003**: Sequências de 3 ou mais eliminações consecutivas sem falha rendem uma pontuação total
  visivelmente maior do que a soma das pontuações base/velocidade isoladas das mesmas eliminações.
- **SC-004**: 100% das partidas jogadas terminam exibindo uma pontuação final coerente com a soma
  dos eventos de pontuação ocorridos durante aquela partida (nenhuma perda ou duplicação de
  pontos).
- **SC-005**: A introdução do sistema de pontuação não introduz nenhuma queda perceptível de
  quadros por segundo nem atraso de resposta ao clique, preservando o requisito não-negocável de
  responsividade (Princípio V da constitution).

## Assumptions

- O valor de pontuação base por eliminação, o teto do bônus de velocidade, a duração da janela de
  reação rápida, a fórmula/incremento do bônus de combo e a duração da janela entre eliminações do
  combo são parâmetros de balanceamento a definir na fase de planejamento (`/speckit-plan`), e não
  bloqueiam esta especificação — a exemplo de outras constantes fixas do jogo (`gameConfig.ts`).
- A pontuação é local à partida e não é persistida entre partidas nesta feature (não inclui high
  score nem `localStorage` — esse é um item de backlog separado, "High score local", seção 2).
- Não há multiplicadores por dificuldade nem por tipo de barata, já que nenhuma dessas features
  existe no jogo atual.
- O HUD já possui um espaço/estrutura visual (contador de progresso/risco, spec
  `002-hud-progresso-risco`) ao qual o indicador de pontuação pode ser adicionado sem redesenhar o
  layout inteiro da tela de jogo.
- "Clique válido" e "clique sem acertar nenhuma barata" reutilizam a mesma detecção de acerto/erro
  já existente no `CollisionSystem` da spec do MVP, sem novas regras de hit-testing.
