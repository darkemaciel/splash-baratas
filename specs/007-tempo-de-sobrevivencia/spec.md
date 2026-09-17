# Feature Specification: Cronômetro de Tempo de Sobrevivência

**Feature Branch**: `007-tempo-de-sobrevivencia`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "Cronômetro de tempo de sobrevivência (P0 da progressão): adicionar um cronômetro visível durante a partida que marca o tempo decorrido desde o início do jogo. Este é o primeiro passo da progressão — foco exclusivo em exibir e contar o tempo de jogo, sem pontuação adicional, sem dificuldade progressiva e sem persistência de recorde nesta fase. O cronômetro deve iniciar quando a partida começa, pausar/parar quando o jogo termina (condição de derrota existente: todos os itens de comida roubados), e reiniciar quando uma nova partida é iniciada."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver o tempo de sobrevivência durante a partida (Priority: P1)

Enquanto joga, o jogador quer ver há quanto tempo está sobrevivendo, para ter uma noção contínua do próprio desempenho e um motivo para tentar superar sua própria marca na próxima partida.

**Why this priority**: É o valor central desta feature — sem um cronômetro visível durante o jogo, não há progressão perceptível nenhuma. Todo o resto (parar, reiniciar) só existe para servir esta exibição.

**Independent Test**: Iniciar uma partida e observar que um contador de tempo aparece na tela e avança continuamente enquanto a partida está em andamento. Entrega valor sozinho, mesmo sem as demais histórias.

**Acceptance Scenarios**:

1. **Given** o jogador acabou de iniciar uma partida, **When** a tela de jogo é exibida, **Then** o cronômetro é exibido mostrando o tempo decorrido a partir de zero.
2. **Given** a partida está em andamento, **When** o tempo passa, **Then** o valor exibido no cronômetro aumenta de forma contínua e legível, refletindo o tempo real decorrido.
3. **Given** o jogador está no meio de uma partida, **When** ele olha para o cronômetro a qualquer momento, **Then** consegue ler o valor atual sem esforço, sem que a exibição atrapalhe a visualização das prateleiras, comidas ou baratas.

---

### User Story 2 - Cronômetro para ao fim da partida (Priority: P2)

Quando a partida termina (todos os itens de comida foram roubados), o jogador quer que o cronômetro pare de contar e continue mostrando o tempo final de sobrevivência, para saber exatamente quanto tempo durou aquela tentativa.

**Why this priority**: Reforça o valor da User Story 1 ao dar um resultado claro e estável no momento de maior atenção do jogador (a tela de fim de jogo), mas depende da exibição já existir.

**Independent Test**: Jogar até que todos os itens de comida sejam roubados e verificar que o cronômetro para de avançar e o último valor exibido corresponde ao tempo total daquela partida.

**Acceptance Scenarios**:

1. **Given** a partida está em andamento e o cronômetro está contando, **When** o último item de comida é roubado (condição de derrota), **Then** o cronômetro para de avançar imediatamente.
2. **Given** a partida terminou, **When** o jogador observa a tela de fim de jogo, **Then** o tempo de sobrevivência final permanece visível e estático, mostrando quanto tempo durou a partida.

---

### User Story 3 - Cronômetro reinicia em nova partida (Priority: P3)

Ao começar uma nova partida, o jogador quer que o cronômetro volte a zero, para que cada tentativa seja medida de forma independente e comparável.

**Why this priority**: É um comportamento de conveniência e consistência esperado pelo jogador, mas o valor principal (ver e ler o tempo) já foi entregue pelas histórias anteriores; sem isso, o pior caso é o jogador ver um número "herdado" da partida anterior por um instante.

**Independent Test**: Terminar uma partida, iniciar uma nova e verificar que o cronômetro reinicia em zero e volta a contar a partir daquele momento, independente do tempo da partida anterior.

**Acceptance Scenarios**:

1. **Given** uma partida anterior terminou com um tempo de sobrevivência registrado, **When** o jogador inicia uma nova partida, **Then** o cronômetro reinicia em zero.
2. **Given** o cronômetro acabou de reiniciar, **When** a nova partida avança, **Then** o cronômetro volta a contar de forma independente do valor da partida anterior.

### Edge Cases

- O que acontece se o jogador ficar sobrevivendo por muito tempo (dezenas de minutos)? A exibição deve continuar legível e sem quebrar o layout (ex.: mudar de formato de segundos para minutos:segundos).
- O que acontece se a aba/janela do navegador perder o foco e voltar depois? O cronômetro deve refletir o tempo real decorrido dentro da partida, não pausar silenciosamente nem saltar de forma incoerente com o restante do jogo (mesmo comportamento de progressão do tempo já usado pelo loop principal do jogo).
- O que acontece na tela inicial, antes de qualquer partida ter começado? Nenhum valor de cronômetro de uma partida deve ser exibido (não há partida em andamento ainda).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir um cronômetro visível na tela de jogo durante toda partida em andamento.
- **FR-002**: O cronômetro DEVE iniciar em zero no exato momento em que uma partida começa.
- **FR-003**: O cronômetro DEVE avançar de forma contínua enquanto a partida estiver em andamento, refletindo o tempo real decorrido desde o início da partida.
- **FR-004**: O sistema DEVE parar de avançar o cronômetro no momento em que a condição de derrota existente (todos os itens de comida roubados) for atingida.
- **FR-005**: O sistema DEVE manter visível o valor final do cronômetro (tempo total de sobrevivência) na tela de fim de jogo, sem que ele continue avançando após a derrota.
- **FR-006**: O sistema DEVE reiniciar o cronômetro para zero sempre que uma nova partida for iniciada, independentemente do valor alcançado na partida anterior.
- **FR-007**: O cronômetro NÃO DEVE ser exibido antes do início da primeira partida (ex.: na tela inicial).
- **FR-008**: O sistema DEVE exibir o tempo em um formato legível e consistente durante toda a partida, incluindo partidas que durem dezenas de minutos.
- **FR-009**: Esta feature NÃO DEVE introduzir pontuação adicional, dificuldade progressiva ou persistência de recorde — esses itens ficam fora de escopo nesta fase, mesmo que estejam listados como progressão futura no backlog.

### Key Entities

- **Tempo de Sobrevivência (Cronômetro)**: Valor derivado do tempo decorrido entre o início e o fim (ou o instante atual) da partida corrente. Não é uma nova entidade de domínio persistente — é uma leitura calculada a partir do início da partida em andamento, existindo apenas enquanto essa partida existe.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% das partidas jogadas, o jogador consegue identificar corretamente, a qualquer momento, há quanto tempo a partida atual está em andamento, apenas olhando para a tela.
- **SC-002**: O valor exibido no cronômetro nunca diverge do tempo real decorrido da partida em mais de 1 segundo, do início ao fim de qualquer partida.
- **SC-003**: Ao final de qualquer partida, o jogador consegue ler o tempo total de sobrevivência daquela tentativa sem precisar de nenhuma ação adicional (o valor já está visível e parado).
- **SC-004**: 100% das novas partidas iniciadas mostram o cronômetro reiniciado em zero, sem nenhum resquício visual do tempo da partida anterior.

## Assumptions

- O "início da partida" é o mesmo instante já usado hoje para iniciar o loop principal (spawn de baratas, contagem de itens etc.), não um novo marco de tempo independente.
- A "condição de derrota" referenciada é a já existente no MVP (`status: "lost"` quando todos os itens de comida são roubados) — nenhuma nova condição de fim de jogo é introduzida por esta feature.
- O cronômetro é um elemento de exibição (HUD), não uma métrica de pontuação: não substitui, soma-se a, nem interage com o sistema de pontuação já entregue em `specs/004-sistema-pontuacao`.
- Não há requisito de persistir o tempo entre sessões do navegador (ex.: recorde salvo) nesta fase — isso é tratado como item futuro de progressão ("High score local"), fora do escopo desta spec.
- O formato de exibição (ex.: segundos corridos vs. minutos:segundos) fica a critério da fase de planejamento/implementação, desde que atenda ao requisito de legibilidade em partidas longas (FR-008).
