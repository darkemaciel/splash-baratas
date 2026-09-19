# Feature Specification: Variação nos Pontos de Spawn

**Feature Branch**: `010-variacao-pontos-spawn`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "Variação nos pontos de spawn (P2 do backlog, seção 1 \"Jogabilidade e feedback sensorial\"): permitir que as baratas surjam a partir de múltiplos pontos/padrões, não apenas os 4 pontos fixos atuais (`SPAWN_POINTS`, FR-005), para tornar o posicionamento das baratas menos previsível e aumentar a variedade visual/tática de cada partida."

## Clarifications

### Session 2026-09-17

- Q: Os novos pontos de spawn devem ser um conjunto fixo e discreto de posições, ou posições geradas dentro de uma faixa contínua ao longo de cada borda? → A: Conjunto fixo e discreto de pontos por borda/região (ex.: 3-4 pontos adicionais por borda), igual em espírito ao `SPAWN_POINTS` atual, só que maior.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entradas menos previsíveis ao longo de uma partida (Priority: P1)

Enquanto joga várias partidas, o jogador quer que as baratas não surjam sempre exatamente nos mesmos 4 pontos (topo, base, esquerda, direita), para que decorar essas posições fixas deixe de ser uma estratégia viável e cada partida pareça mais viva e menos mecânica.

**Why this priority**: É o valor central do item do backlog — sem mais variedade de posições de entrada, a feature não entrega nada; as demais histórias apenas refinam essa variedade.

**Independent Test**: Jogar uma partida observando várias levas de spawn consecutivas; confirmar que as baratas aparecem em pontos diferentes ao longo das bordas da tela (não sempre nos mesmos 4 pontos fixos), enquanto ainda entram target vindas de fora da área das prateleiras, exatamente como hoje.

**Acceptance Scenarios**:

1. **Given** uma partida em andamento, **When** várias baratas surgem ao longo do tempo, **Then** os pontos de spawn observados não se repetem sempre nos mesmos 4 pontos fixos de hoje, mas continuam todos fora da área visível das prateleiras/comidas.
2. **Given** duas baratas com o mesmo alvo (mesma comida), **When** ambas surgem em momentos diferentes da partida, **Then** elas podem surgir de pontos diferentes ao longo da borda mais próxima daquele alvo, não obrigatoriamente do mesmo ponto exato.

---

### User Story 2 - Trajeto continua coerente com o alvo (Priority: P2)

Enquanto joga, o jogador quer que, mesmo com mais variedade de pontos de entrada, cada barata ainda pareça vir "de fora" em direção coerente ao seu alvo (sem cruzar a tela inteira vindo do lado oposto à comida), para que o jogo continue legível e justo.

**Why this priority**: Preserva a legibilidade e a jogabilidade já validadas do MVP — a variedade só tem valor (US1) se não sacrificar a clareza de "de onde a ameaça vem e para onde vai".

**Independent Test**: Observar, para várias comidas em posições diferentes do grid de prateleiras, os pontos de spawn das baratas direcionadas a cada uma; confirmar que cada ponto de spawn está sempre na borda da tela geometricamente mais próxima/coerente com aquele alvo específico, nunca na borda oposta.

**Acceptance Scenarios**:

1. **Given** uma comida próxima à borda esquerda da tela, **When** uma barata surge com essa comida como alvo, **Then** o ponto de spawn escolhido está entre os pontos possíveis da região esquerda/próxima, nunca no lado diretamente oposto.
2. **Given** o mesmo alvo, **When** múltiplas baratas surgem para ele ao longo da partida, **Then** todos os pontos de spawn escolhidos mantêm a mesma coerência de lado/região em relação ao alvo.

---

### User Story 3 - Sem repetição consecutiva óbvia (Priority: P3)

Enquanto joga, o jogador quer que duas baratas seguidas direcionadas ao mesmo alvo não surjam exatamente do mesmo pixel de origem, para reforçar a sensação de variedade mesmo em sequências rápidas de spawn para a mesma comida.

**Why this priority**: É um refinamento perceptível apenas em sequências específicas (mesmo alvo, spawns próximos no tempo); a variedade geral (US1) e a coerência de direção (US2) já entregam a maior parte do valor sem essa garantia adicional.

**Independent Test**: Forçar (ou aguardar) duas baratas consecutivas com o mesmo alvo; confirmar que, quando há mais de um ponto candidato na região coerente daquele alvo, os dois spawns consecutivos não usam exatamente o mesmo ponto.

**Acceptance Scenarios**:

1. **Given** uma comida com mais de um ponto de spawn candidato em sua região coerente, **When** duas baratas seguidas surgem tendo essa comida como alvo, **Then** os dois pontos de spawn escolhidos não são idênticos, desde que existam pontos alternativos disponíveis na mesma região.

### Edge Cases

- O que acontece quando a região coerente de um alvo tem apenas um único ponto candidato (ex.: comida em posição que só mapeia para um ponto)? O sistema deve usar esse único ponto normalmente, sem tentar forçar variação onde não há alternativa.
- Como o sistema se comporta no primeiro spawn da partida, quando não há spawn anterior para comparar (regra de não repetição da US3)? Não há restrição a aplicar; qualquer ponto candidato da região coerente é válido.
- O que acontece se, por acaso, a maior variedade de pontos aproximar demais uma barata da borda de uma prateleira? O ponto de spawn continua restrito a áreas fora da região ocupada por prateleiras/comidas, preservando a garantia já existente de que baratas nascem "fora" da cena de jogo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE oferecer mais de 4 pontos de spawn possíveis para baratas, como um conjunto fixo e discreto de coordenadas pré-definidas distribuídas ao longo das bordas da área de jogo (não posições contínuas sorteadas livremente, e não apenas os 4 pontos fixos — topo, base, esquerda, direita — usados hoje).
- **FR-002**: Todo ponto de spawn DEVE permanecer fora da área ocupada por prateleiras e comidas, exatamente como a garantia já existente para os 4 pontos atuais.
- **FR-003**: Para cada barata criada, o sistema DEVE escolher o ponto de spawn dentre os candidatos da região da borda mais coerente com a posição do seu alvo (comida-alvo), preservando o comportamento atual de "a barata vem do lado geometricamente mais próximo do alvo".
- **FR-004**: Dentro da região de borda coerente com um alvo, quando houver mais de um ponto candidato, o sistema DEVE variar qual ponto específico é escolhido entre diferentes spawns, em vez de sempre usar o mesmo ponto fixo daquela região.
- **FR-005**: Quando dois spawns consecutivos tiverem o mesmo alvo e houver mais de um ponto candidato disponível na região coerente daquele alvo, o sistema DEVE evitar escolher o mesmo ponto exato usado no spawn imediatamente anterior para aquele alvo.
- **FR-006**: A escolha do ponto de spawn NÃO DEVE alterar o comportamento determinístico de trajeto e o tempo de viagem já existentes (a barata ainda percorre, em linha reta, do ponto de spawn escolhido até o alvo, ao longo da mesma duração de viagem fixa usada por qualquer barata hoje).
- **FR-007**: O sistema DEVE continuar suportando o mesmo volume de baratas simultâneas de hoje sem introduzir novo custo perceptível de cálculo por spawn (a seleção do ponto deve ser barata o suficiente para não competir com o orçamento de desempenho de 60 FPS).

### Key Entities

- **Ponto de spawn**: uma coordenada fixa e pré-definida, fora da área de prateleiras/comidas, a partir da qual uma barata pode iniciar seu trajeto; hoje existem 4 fixos, a feature introduz um conjunto maior — também fixo e discreto, não gerado dinamicamente — agrupado em regiões coerentes com cada alvo possível.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em uma partida de duração típica (2+ minutos), jogadores observam baratas surgindo de ao menos 8 posições distintas ao longo das bordas da tela, contra as 4 posições fixas de hoje.
- **SC-002**: 100% dos pontos de spawn observados permanecem coerentes com o lado/região do alvo correspondente (nenhuma barata atravessa a tela vinda do lado oposto ao seu alvo).
- **SC-003**: A taxa de quadros por segundo e a responsividade de clique observadas permanecem indistinguíveis (nenhuma degradação perceptível) em relação ao comportamento antes desta mudança.
- **SC-004**: Em sessões de teste informal, jogadores que já conheciam os 4 pontos fixos do MVP relatam não conseguir mais prever de cabeça o próximo ponto exato de entrada de uma barata.

## Assumptions

- A subdivisão das bordas em "regiões coerentes por alvo" pode reaproveitar o mesmo agrupamento por prateleira/lado já usado implicitamente pela função atual de escolha do ponto mais próximo (`nearestSpawnPoint`), apenas com mais candidatos por região em vez de um único ponto.
- Não há requisito de que os pontos discretos sigam uma grade regular ou espaçamento uniforme; a distribuição exata das coordenadas dentro de cada região fica a critério da fase de planejamento técnico, desde que o conjunto final permaneça fixo (não gerado em tempo real).
- Mobile/touch e qualquer padrão de spawn dependente de tipo de dispositivo continuam fora de escopo, seguindo a mesma decisão já registrada no MVP e nas specs anteriores.
- Dificuldade progressiva, novos tipos de barata e qualquer variação de `SPAWN_INTERVAL_MS`/`TRAVEL_DURATION_MS` continuam fora de escopo desta feature — apenas a *posição* de entrada varia, não a cadência nem a duração de viagem.
