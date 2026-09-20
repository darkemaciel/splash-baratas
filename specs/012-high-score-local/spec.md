# Feature Specification: High Score Local

**Feature Branch**: `012-high-score-local`

**Created**: 2026-09-19

**Status**: Draft

**Input**: User description: "High score local (P0 do backlog, seção 2 \"Progressão e replayability\"): persistir localmente (localStorage, sem backend) o melhor resultado já alcançado pelo jogador entre partidas, servindo de base para qualquer modo competitivo futuro (specs/004-sistema-pontuacao já entrega pontuação por barata eliminada com bônus de velocidade de reação e combos — specs/007-tempo-de-sobrevivencia já entrega o cronômetro de sobrevivência). O high score deve ser exibido ao jogador (ex.: na tela inicial e/ou na tela de derrota) e atualizado quando um novo recorde é batido, permanecendo entre sessões do navegador."

## Clarifications

### Session 2026-09-19

- Q: Qual métrica deve definir o recorde local do jogador? → A: Pontuação final (`specs/004-sistema-pontuacao`), não o tempo de sobrevivência isoladamente nem os dois separadamente.
- Q: Um único "recorde" (maior pontuação de sempre) atende a "servindo de base para qualquer modo competitivo futuro", ou é necessário um ranking com várias partidas? → A: Ranking local com as **5 melhores pontuações já alcançadas** (Top 5), não apenas um único valor — decisão tomada após uma primeira implementação com valor único ter sido considerada insuficiente pelo dono do produto ("achei que deveria fazer um rank com as partidas já jogadas").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Jogador entra no ranking e vê isso reconhecido (Priority: P1)

Ao terminar uma partida com uma pontuação boa o suficiente para entrar entre as 5 melhores já alcançadas, o jogador quer ver claramente que entrou no ranking (e em qual posição), para sentir que o esforço daquela partida valeu a pena e ter um motivo concreto para tentar subir de posição.

**Why this priority**: É o núcleo do valor da feature — sem o reconhecimento de "entrei no ranking" no momento em que acontece, não existe "replayability" nenhuma, só números guardados que ninguém percebe que mudaram.

**Independent Test**: Jogar partidas até perder repetidas vezes, anotando a pontuação final de cada uma; confirmar que, ao terminar uma partida cuja pontuação está entre as 5 melhores já alcançadas, a tela de derrota indica a posição alcançada no ranking, e que isso não acontece quando a pontuação fica fora do Top 5.

**Acceptance Scenarios**:

1. **Given** nenhuma partida jogada antes neste navegador, **When** o jogador termina sua primeira partida, **Then** o resultado dela entra no ranking (1º lugar), já que não há nenhuma pontuação anterior para comparar.
2. **Given** um ranking com menos de 5 pontuações registradas, **When** o jogador termina uma nova partida, **Then** o resultado dela sempre entra no ranking (há espaço livre), na posição correspondente à sua pontuação em relação às já registradas.
3. **Given** um ranking já com 5 pontuações registradas, **When** o jogador termina uma partida com pontuação maior que a menor pontuação do ranking, **Then** a tela de derrota indica a posição alcançada e a pontuação mais baixa do ranking anterior sai da lista (o ranking continua com exatamente 5 entradas).
4. **Given** um ranking já com 5 pontuações registradas, **When** o jogador termina uma partida com pontuação igual ou menor que a menor pontuação do ranking, **Then** a tela de derrota não indica entrada no ranking e as 5 pontuações registradas permanecem as mesmas.

---

### User Story 2 - Jogador vê o ranking atual antes de começar a jogar (Priority: P2)

Antes de iniciar uma partida, o jogador quer ver as melhores pontuações já alcançadas, para saber de antemão qual resultado precisa superar para subir no ranking.

**Why this priority**: Reforça o objetivo da US1 dando ao jogador uma meta visível já no início, mas o valor central (reconhecer a entrada no ranking) já é entregue pela US1 sozinha.

**Independent Test**: Jogar partidas suficientes para preencher o ranking, voltar à tela inicial e confirmar que a lista exibida ali reflete as pontuações das partidas anteriores, na ordem correta, mesmo depois de fechar e reabrir o navegador.

**Acceptance Scenarios**:

1. **Given** nenhuma partida jogada antes neste navegador, **When** o jogador abre a tela inicial, **Then** é exibida uma indicação clara de que ainda não há pontuações registradas (não uma lista com valores "0").
2. **Given** um ranking com uma ou mais pontuações já salvas, **When** o jogador abre a tela inicial, **Then** as pontuações são exibidas em ordem decrescente (da maior para a menor).
3. **Given** um ranking já salvo de partidas anteriores, **When** o jogador fecha completamente o navegador e o reabre depois, **Then** a tela inicial exibe o mesmo ranking salvo anteriormente.

---

### User Story 3 - Ranking continua confiável mesmo sem armazenamento disponível (Priority: P3)

Enquanto joga em um navegador que bloqueia ou limpa o armazenamento local (ex.: navegação privada, configurações restritivas), o jogador quer que o jogo continue funcionando normalmente, mesmo que o ranking não seja lembrado entre sessões.

**Why this priority**: É uma garantia de resiliência sobre as duas histórias anteriores — sem ela, um ambiente sem `localStorage` disponível poderia quebrar o fim de partida inteiro, o que é muito pior do que apenas não persistir o ranking.

**Independent Test**: Simular indisponibilidade do `localStorage` (ex.: navegação privada em navegador que restringe, ou bloqueando a API) e confirmar que o jogo continua sendo jogável do início ao fim, tratando o ranking como vazio em cada nova sessão.

**Acceptance Scenarios**:

1. **Given** um ambiente onde a leitura ou escrita em `localStorage` falha, **When** o jogador termina uma partida, **Then** o jogo não trava nem exibe erro visível ao jogador — o fluxo de fim de partida continua normalmente, apenas sem lembrar o ranking na próxima sessão.

### Edge Cases

- O que acontece com o ranking salvo se a definição de pontuação (`specs/004-sistema-pontuacao`) mudar no futuro (ex.: novos bônus, pesos diferentes)? Fora de escopo desta spec — o ranking é apenas uma lista de números comparáveis entre si da mesma métrica; qualquer mudança na fórmula de pontuação é tratada por quem alterar `specs/004-sistema-pontuacao`, não por esta feature.
- O que acontece se o valor salvo em `localStorage` estiver corrompido ou em formato inesperado (ex.: editado manualmente pelo jogador, ou no formato de número único usado por uma versão anterior desta feature)? O jogo trata o ranking como vazio (equivalente a "nenhuma partida registrada ainda") em vez de travar ou propagar dados inválidos.
- O que acontece em caso de empate de pontuação exatamente na fronteira do Top 5 (a nova pontuação é igual à 5ª colocada atual)? Não desloca a pontuação já registrada — critério de desempate é "quem já estava no ranking permanece", consistente com "igual não avança" (mesmo espírito de FR-003).
- Como o ranking trata múltiplas entradas com a mesma pontuação já registradas nele? Não há problema em ter pontuações repetidas no ranking (ex.: duas partidas empatadas em 100 pontos, ambas dentro do Top 5) — a posição exibida para uma pontuação empatada usa a posição mais alta entre as posições empatadas.
- O ranking é afetado por pausar a partida (`specs/009-pausar-partida`)? Não — o resultado final registrado é o mesmo que já é exibido na tela de derrota hoje, que não é alterado por pausas.
- O ranking é afetado por reiniciar a partida a partir da tela de derrota (`FR-013` do MVP)? Não — reiniciar começa uma nova partida do zero; o ranking salvo de partidas anteriores permanece até (e a menos que) uma partida futura entre nele.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE persistir localmente, sem depender de backend, as 5 maiores pontuações finais já alcançadas pelo jogador neste navegador (o "ranking"), ordenadas da maior para a menor.
- **FR-002**: O sistema DEVE incluir a pontuação final de uma partida no ranking sempre que o ranking tiver menos de 5 pontuações registradas, ou quando essa pontuação for maior que a menor pontuação atualmente no ranking.
- **FR-003**: Quando uma pontuação entra no ranking e ele já tinha 5 pontuações registradas, o sistema DEVE remover a menor pontuação anterior, mantendo o ranking sempre com no máximo 5 entradas.
- **FR-004**: O sistema NÃO DEVE alterar o ranking salvo quando uma partida terminar com pontuação final igual ou menor do que a menor pontuação atualmente no ranking (com o ranking já no limite de 5 entradas).
- **FR-005**: O sistema DEVE indicar ao jogador, na tela de derrota, quando o resultado daquela partida entrou no ranking, incluindo a posição alcançada.
- **FR-006**: O sistema DEVE exibir o ranking atual (até 5 pontuações, em ordem decrescente) ao jogador na tela inicial, antes do início de uma nova partida.
- **FR-007**: O sistema DEVE distinguir visivelmente o estado "nenhuma partida registrada ainda" (ranking vazio) de um ranking com pontuações de valor zero.
- **FR-008**: O ranking salvo DEVE permanecer disponível entre sessões do navegador (fechar e reabrir a aba/navegador), enquanto o armazenamento local do navegador não for limpo pelo jogador ou pelo próprio navegador.
- **FR-009**: O sistema DEVE continuar funcionando normalmente do início ao fim de uma partida mesmo quando a leitura ou escrita do ranking falhar (ex.: `localStorage` indisponível ou bloqueado), tratando a ausência de armazenamento como equivalente a "ranking vazio", sem travar nem exibir erros ao jogador.
- **FR-010**: O sistema DEVE tratar um valor de ranking salvo corrompido ou em formato inesperado (incluindo o formato de número único de uma versão anterior desta feature) como "ranking vazio", em vez de propagá-lo ou travar.
- **FR-011**: Reiniciar uma partida a partir da tela de derrota (`FR-013` do MVP) NÃO DEVE apagar nem resetar o ranking salvo de partidas anteriores.

### Key Entities

- **Ranking local**: uma lista de até 5 pontuações finais já alcançadas pelo jogador neste navegador, ordenada da maior para a menor; armazenada localmente e independente de qualquer partida em andamento. Uma lista vazia significa "nenhuma partida concluída ainda" — distinto de uma lista contendo pontuações de valor zero.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um jogador cuja partida entra no ranking percebe esse reconhecimento (incluindo a posição alcançada) na tela de derrota sem precisar de nenhuma explicação adicional.
- **SC-002**: O ranking exibido na tela inicial reflete corretamente as 5 melhores pontuações já alcançadas, na ordem correta, em 100% das aberturas do jogo, incluindo após fechar completamente o navegador.
- **SC-003**: Uma partida inteira (do início à tela de derrota) pode ser concluída sem falhas visíveis mesmo quando o armazenamento local está indisponível.
- **SC-004**: Jogadores que ainda não completaram nenhuma partida veem um estado "ranking vazio" claramente diferente de um ranking com pontuações de valor zero.

## Assumptions

- O ranking é único por navegador/dispositivo (via `localStorage`), sem sincronização entre dispositivos ou navegadores diferentes, consistente com a decisão de MVP de não ter backend.
- O tamanho do ranking (5 pontuações) é um valor fixo para esta spec — não é configurável pelo jogador nem exposto como opção.
- Não há limite de tempo ou expiração para as pontuações salvas no ranking — cada uma permanece válida indefinidamente até ser deslocada por uma pontuação maior ou até o armazenamento local ser limpo.
- Não é necessário guardar metadados por partida (data/hora, duração, etc.) nesta spec — o ranking guarda apenas os valores de pontuação, não um histórico detalhado de cada partida.
- Não é necessário um botão para "resetar" o ranking manualmente nesta spec.
