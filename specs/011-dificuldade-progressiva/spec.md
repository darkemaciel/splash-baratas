# Feature Specification: Dificuldade Progressiva

**Feature Branch**: `011-dificuldade-progressiva`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "Dificuldade progressiva (P1 do backlog, seção 2 \"Progressão e replayability\"): aumentar gradualmente a dificuldade ao longo de uma mesma partida, incrementando a cadência de spawn e/ou reduzindo o tempo de viagem das baratas conforme o tempo de sobrevivência avança — hoje `SPAWN_INTERVAL_MS` e `TRAVEL_DURATION_MS` são constantes fixas e únicas durante toda a partida (Princípio IV, FR-016 da spec 001). O objetivo é que partidas mais longas fiquem perceptivelmente mais difíceis/tensas do que o início, sem tornar o jogo injusto ou imprevisível cedo demais."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Baratas aparecem com mais frequência quanto mais tempo se sobrevive (Priority: P1)

Enquanto joga, o jogador quer que baratas passem a surgir com mais frequência conforme a partida avança, para que sobreviver por mais tempo se torne um desafio crescente em vez de permanecer no mesmo ritmo do início ao fim.

**Why this priority**: É o mecanismo central da progressão — sem cadência de spawn crescente, não existe sensação de "a partida está ficando mais difícil"; as demais histórias apenas adicionam uma segunda alavanca de tensão (US2) e uma garantia de limite jogável (US3) em cima deste comportamento.

**Independent Test**: Jogar (ou simular) uma partida por vários minutos sem perder, comparando o intervalo entre spawns de baratas no primeiro minuto com o de um minuto mais avançado; confirmar que o intervalo fica perceptivelmente menor conforme o tempo de sobrevivência avança, sem depender de nenhuma ação do jogador além de continuar sobrevivendo.

**Acceptance Scenarios**:

1. **Given** uma partida recém-iniciada, **When** o jogador sobrevive por vários minutos, **Then** o intervalo entre um spawn de barata e o próximo fica perceptivelmente menor nos minutos finais observados do que no primeiro minuto.
2. **Given** duas partidas distintas comparadas no mesmo instante relativo de sobrevivência (ex.: exatamente 30 segundos decorridos em cada uma), **When** nenhuma comida foi perdida em nenhuma delas até aquele instante, **Then** a cadência de spawn observada é a mesma nas duas partidas — a progressão depende do tempo decorrido, não de aleatoriedade ou de qualquer outra variável.

---

### User Story 2 - Tempo de reação diminui conforme a partida avança (Priority: P2)

Enquanto joga, o jogador quer que, além de mais frequentes, as baratas também deem cada vez menos tempo de reação conforme a partida avança, para que sobreviver por muito tempo exija reflexos cada vez mais afiados, não apenas lidar com mais alvos ao mesmo tempo.

**Why this priority**: Aprofunda a tensão da progressão iniciada pela US1 com uma segunda alavanca — útil e perceptível, mas a US1 sozinha já entrega o valor central de "a partida fica mais difícil com o tempo".

**Independent Test**: Comparar, em momentos diferentes de uma mesma partida (início vs. avançada), quanto tempo uma barata recém-surgida leva para alcançar seu alvo; confirmar que esse tempo fica perceptivelmente menor conforme a partida avança.

**Acceptance Scenarios**:

1. **Given** uma partida recém-iniciada, **When** o jogador sobrevive por vários minutos, **Then** o tempo que uma barata leva para alcançar seu alvo, a partir do momento em que surge, fica perceptivelmente menor nos minutos finais observados do que no início.
2. **Given** uma barata que já está em trajeto no momento em que o nível de dificuldade muda, **When** o tempo de reação-padrão da partida diminui, **Then** essa barata específica continua com o tempo de trajeto que tinha no momento em que surgiu, sem acelerar ou ser afetada retroativamente.

---

### User Story 3 - Dificuldade nunca ultrapassa um limite jogável (Priority: P3)

Enquanto joga uma partida muito longa, o jogador quer ter certeza de que a dificuldade para de aumentar a partir de um certo ponto, para que sobreviver por muito tempo continue sendo um desafio genuíno em vez de se tornar literalmente impossível de reagir.

**Why this priority**: É uma garantia de segurança sobre o comportamento das duas histórias anteriores — sem ela, US1 e US2 já entregam progressão, mas uma partida longa o suficiente poderia degradar para um ritmo em que nenhum jogador humano conseguiria mais reagir, o que não é "difícil", é injogável.

**Independent Test**: Simular uma partida extremamente longa (bem além do tempo de sobrevivência típico) e confirmar que, a partir de um certo ponto, tanto a cadência de spawn quanto o tempo de reação param de continuar diminuindo, estabilizando em um piso jogável.

**Acceptance Scenarios**:

1. **Given** uma partida que já dura muito além do tempo de sobrevivência típico, **When** o jogador continua sobrevivendo, **Then** a cadência de spawn não fica menor do que um piso mínimo definido, mesmo que a partida continue por mais tempo ainda.
2. **Given** a mesma partida extremamente longa, **When** o jogador continua sobrevivendo, **Then** o tempo de reação de novas baratas não fica menor do que um piso mínimo definido, pela mesma razão.

### Edge Cases

- O que acontece com a progressão de dificuldade enquanto a partida está pausada (`specs/009-pausar-partida`)? O tempo pausado não conta para o avanço da dificuldade — a progressão retoma exatamente de onde estava ao despausar, no mesmo espírito do cronômetro de sobrevivência (`specs/007-tempo-de-sobrevivencia`).
- O que acontece com a dificuldade ao reiniciar uma partida (`FR-013` do MVP)? Volta exatamente ao nível inicial (o mesmo ritmo do início de qualquer partida nova), independentemente de quão avançada a dificuldade tinha ficado na partida anterior.
- O bônus de velocidade de reação e a janela de combo (`specs/004-sistema-pontuacao`) mudam com a dificuldade? Não — continuam usando os mesmos limiares fixos em milissegundos de hoje; naturalmente ficam mais difíceis de alcançar quando o tempo de reação encolhe, mas isso é uma consequência esperada da progressão, não uma mudança nos próprios limiares.
- O que acontece com a variedade/coerência dos pontos de spawn (`specs/010-variacao-pontos-spawn`) conforme a dificuldade aumenta? Nada muda ali — a progressão afeta apenas cadência e tempo de reação, nunca de onde as baratas surgem.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE diminuir gradualmente o intervalo entre spawns de baratas conforme o tempo de sobrevivência da partida atual avança, em vez de manter um intervalo único e fixo durante toda a partida.
- **FR-002**: O sistema DEVE diminuir gradualmente o tempo de viagem (tempo de reação disponível) de baratas recém-criadas conforme o tempo de sobrevivência da partida atual avança, em vez de manter uma duração única e fixa durante toda a partida.
- **FR-003**: O aumento de dificuldade DEVE ser gradual e contínuo ao longo do tempo de sobrevivência, sem saltos abruptos perceptíveis de um instante para o outro.
- **FR-004**: Tanto o intervalo entre spawns quanto o tempo de viagem DEVEM ter um piso mínimo fixo, abaixo do qual a dificuldade para de aumentar, garantindo que a partida permaneça jogável por tempo indefinido.
- **FR-005**: A progressão de dificuldade DEVE reiniciar para o nível inicial no começo de toda nova partida, incluindo após um reinício a partir da tela de derrota.
- **FR-006**: A progressão de dificuldade NÃO DEVE avançar enquanto a partida estiver pausada — o tempo decorrido em pausa não conta para o cálculo do nível de dificuldade atual.
- **FR-007**: Uma barata já criada DEVE manter o tempo de viagem que tinha no momento em que surgiu, mesmo que o nível de dificuldade mude enquanto ela ainda está em trajeto — apenas baratas criadas depois da mudança usam o novo valor.
- **FR-008**: A condição de derrota (todas as comidas roubadas) e as demais regras do loop principal (`specs/001-roach-fridge-clicker`) NÃO DEVEM mudar — a progressão de dificuldade afeta apenas o ritmo de spawn e o tempo de reação, nunca as regras de vitória/derrota.
- **FR-009**: Os limiares de bônus de velocidade de reação e a janela de combo (`specs/004-sistema-pontuacao`) NÃO DEVEM ser alterados pela dificuldade — permanecem nos mesmos valores fixos de hoje.

### Key Entities

- **Nível de dificuldade**: um valor derivado unicamente do tempo de sobrevivência decorrido na partida atual (descontando o tempo pausado); não é persistido nem exposto como estado próprio — é recalculado a cada instante a partir do cronômetro de sobrevivência já existente, e volta ao ponto inicial a cada nova partida.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em uma partida de 3+ minutos sem perder nenhuma comida, a cadência de spawn observada nos últimos 30 segundos é perceptivelmente maior do que a observada nos primeiros 30 segundos.
- **SC-002**: Na mesma partida, o tempo de reação disponível para baratas que surgem nos últimos 30 segundos observados é perceptivelmente menor do que o das baratas que surgem nos primeiros 30 segundos.
- **SC-003**: Em uma partida muito mais longa que o tempo de sobrevivência típico, a cadência de spawn e o tempo de reação nunca ultrapassam os pisos mínimos definidos, por mais que a partida continue.
- **SC-004**: Reiniciar uma partida, em qualquer nível de dificuldade que a anterior tenha alcançado, sempre resulta em uma nova partida começando exatamente no ritmo inicial.
- **SC-005**: Em sessões de teste informal, jogadores relatam perceber a partida "esquentando" gradualmente ao longo do tempo, sem identificar saltos bruscos e perceptíveis de dificuldade de um momento para o outro.

## Assumptions

- A progressão é acionada pelo tempo de sobrevivência já rastreado por `specs/007-tempo-de-sobrevivencia` (`elapsedMs`) — não introduz uma nova noção de "tempo de partida", reaproveita a existente.
- A forma exata da curva de progressão (linear, escalonada em degraus, exponencial decrescente até o piso etc.), a velocidade do aumento e os valores exatos dos pisos mínimos de `SPAWN_INTERVAL_MS`/`TRAVEL_DURATION_MS` ficam a critério da fase de planejamento técnico — o requisito de produto é apenas que o aumento seja gradual, perceptível e sempre limitado por um piso (FR-003, FR-004).
- Dificuldade progressiva altera exclusivamente cadência de spawn e tempo de viagem; não introduz novos tipos de barata, não muda o teto de baratas simultâneas (`specs/001`, uma por comida presente) e não interage com a variedade/coerência dos pontos de spawn (`specs/010-variacao-pontos-spawn`).
- Esta feature supera, dentro do seu próprio escopo, a garantia de `FR-016` da spec do MVP original (`specs/001-roach-fridge-clicker`) de que `SPAWN_INTERVAL_MS`/`TRAVEL_DURATION_MS` são "constantes fixas e únicas durante toda a partida" — essa garantia valia para o MVP sem progressão; esta spec nova é o mecanismo explícito, previsto pelo Princípio IV da constitution, para introduzir a mudança de forma deliberada.
- Não há persistência de dificuldade entre partidas nem de recorde algum (isso é o item separado "High score local" do backlog) — cada partida nova começa do zero, sem depender de partidas anteriores.
- Mobile/touch continuam fora de escopo, seguindo a mesma decisão já registrada no MVP e nas specs anteriores.
