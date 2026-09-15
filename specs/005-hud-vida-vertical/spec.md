# Feature Specification: Reposicionamento e Restilização do HUD

**Feature Branch**: `005-hud-vida-vertical`

**Created**: 2026-09-14

**Status**: Draft

**Input**: User description: "Reposicionamento e restilização do HUD: mover a barra de progresso/risco (atualmente horizontal, centralizada no topo) e o contador de comidas restantes (“pontos de vida”, hoje o texto “X / Y” acima da barra) para o canto superior direito da tela. A barra passa a ser vertical (referência visual: barra de vida do Mega Man X), ocupando o canto superior direito. O contador de comidas restantes (“pontos de vida”) fica posicionado logo acima dessa barra vertical, também no canto superior direito. A pontuação (score) continua centralizada na parte superior da tela, na posição horizontal atual, mas passa a usar uma fonte maior que a atual e trocar para uma fonte com estilo cartunesco/desenho animado (cartoon), em vez da fonte padrão atual. Essa mesma fonte cartunesca também deve ser aplicada ao contador de “pontos de vida” (comidas restantes), mantendo consistência visual entre os dois elementos textuais do HUD. Nenhuma mudança é esperada na lógica de domínio (MatchStateManager, Match, cálculo de score, risco, etc.) — este é um ajuste puramente de apresentação/HUD na GameScene, análogo em escopo ao spec 002-hud-progresso-risco já implementado."

## Clarifications

### Session 2026-09-14

- Q: Qual fonte cartunesca deve ser usada na pontuação e no contador de vida? → A: Fredoka (Google Font, licença OFL), como novo asset versionado self-hosted, com fallback de sistema.
- Q: A barra de vida vertical deve ser desenhada em blocos segmentados (estilo MMX literal) ou como preenchimento contínuo (a mesma técnica da barra atual, só vertical)? → A: Preenchimento contínuo, reaproveitando a lógica de desenho já existente.
- Q: Qual deve ser o tamanho-alvo da fonte da pontuação (hoje 16px), para tornar o critério de sucesso mensurável? → A: 28px.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a vida/risco como uma barra vertical no canto superior direito (Priority: P1)

Como jogador, eu quero que o indicador de comidas restantes e a barra de risco fiquem juntos no
canto superior direito da tela, com a barra orientada verticalmente (como a barra de vida do Mega
Man X), para que eu tenha uma leitura rápida e familiar do meu "fôlego" na partida, num canto fixo
que não compete visualmente com a pontuação no centro.

**Why this priority**: É a mudança estrutural central pedida — sem o reposicionamento e a
reorientação da barra, o restante da feature (fontes) não tem sentido isolado. É a base sobre a
qual o resto se apoia.

**Independent Test**: iniciar uma partida e verificar que o contador numérico e a barra aparecem
juntos no canto superior direito, com a barra na vertical; deixar uma comida ser roubada e
confirmar que a barra e o contador atualizam corretamente nessa nova posição/orientação, do mesmo
jeito que já faziam na posição/orientação anteriores.

**Acceptance Scenarios**:

1. **Given** uma partida recém-iniciada, **When** a tela de jogo é exibida, **Then** o contador de
   comidas restantes e a barra de risco aparecem agrupados no canto superior direito da tela, com a
   barra desenhada na vertical (não mais na horizontal centralizada).
2. **Given** uma partida em andamento com o HUD já reposicionado, **When** uma comida é roubada,
   **Then** a barra vertical e o contador atualizam imediatamente, preservando o comportamento de
   FR-002/FR-003 do spec 002-hud-progresso-risco (proporção e atualização por evento), agora numa
   orientação vertical.
3. **Given** uma partida em andamento, **When** o jogador observa o canto superior direito em
   qualquer nível de risco (seguro, elevado, crítico), **Then** a cor da barra vertical segue
   exatamente o mesmo esquema de cores já definido em FR-005 do spec 002-hud-progresso-risco.

---

### User Story 2 - Ler a pontuação com destaque e estilo cartunesco (Priority: P2)

Como jogador, eu quero que a pontuação no centro do topo da tela seja exibida numa fonte maior e
com visual cartunesco/desenho animado, para que ela se destaque mais e combine com o tom leve e
divertido do jogo.

**Why this priority**: Reforça o game feel da pontuação (recém-adicionada no spec
004-sistema-pontuacao) sem depender do reposicionamento da barra — pode ser validado
independentemente, mas é menos crítico que ter a barra no lugar certo.

**Independent Test**: iniciar uma partida e comparar visualmente a pontuação exibida com o
tamanho/fonte anteriores (fonte padrão, 16px); confirmar que agora está visivelmente maior e usa
uma fonte de estilo cartunesco, mantendo a posição horizontal centralizada atual.

**Acceptance Scenarios**:

1. **Given** uma partida em andamento, **When** o jogador observa a pontuação no topo central da
   tela, **Then** o texto é exibido numa fonte de estilo cartunesco/desenho animado, visivelmente
   maior que o tamanho usado antes desta feature.
2. **Given** a pontuação muda ao longo da partida (eliminações, bônus de combo/reação), **When** o
   texto é atualizado, **Then** ele permanece na mesma posição horizontal centralizada de hoje, sem
   deslocar-se ou sobrepor outros elementos do HUD.

---

### User Story 3 - Consistência visual entre os textos do HUD (Priority: P3)

Como jogador, eu quero que o contador de "pontos de vida" (comidas restantes) use a mesma fonte
cartunesca da pontuação, para que os dois textos do HUD pareçam parte do mesmo sistema visual, em
vez de estilos misturados.

**Why this priority**: É um refinamento de consistência visual que depende das duas mudanças
anteriores já estarem no lugar (posição da barra e fonte da pontuação definida); sozinho não
altera a jogabilidade nem a legibilidade de forma crítica.

**Independent Test**: com o HUD reposicionado e a pontuação já na fonte cartunesca, comparar a
fonte do contador de comidas restantes com a da pontuação e confirmar que ambas usam a mesma
família tipográfica.

**Acceptance Scenarios**:

1. **Given** o HUD reposicionado com a pontuação em fonte cartunesca, **When** o jogador observa o
   contador de comidas restantes no canto superior direito, **Then** esse contador usa a mesma
   família de fonte cartunesca aplicada à pontuação (podendo diferir em tamanho/cor, mas não em
   estilo tipográfico).

---

### Edge Cases

- O que acontece se a fonte cartunesca não carregar a tempo (ex.: rede lenta)? O texto deve
  permanecer legível com uma fonte de fallback razoável, sem quebrar o layout ou sobrepor outros
  elementos.
- Como a barra vertical se comporta no extremo "crítico" (exatamente uma comida restante)? Deve
  continuar comunicando visualmente o mesmo nível de risco crítico já definido, apenas numa
  orientação vertical.
- O agrupamento (contador + barra) no canto superior direito não deve ser cortado pela borda da
  tela nem sobrepor prateleiras, comidas ou baratas clicáveis em nenhuma resolução desktop
  suportada.
- A pontuação com fonte maior não deve sobrepor o agrupamento do canto superior direito nem
  extrapolar os limites horizontais da tela em nenhuma resolução desktop suportada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir o contador numérico de comidas restantes e a barra de
  risco agrupados no canto superior direito da tela de jogo (substituindo a posição horizontal
  centralizada atual).
- **FR-002**: A barra de risco DEVE ser desenhada na orientação vertical (não mais horizontal), como
  um preenchimento contínuo (mesma técnica de desenho da barra horizontal atual, sem segmentação em
  blocos), preservando o comportamento já definido no spec 002-hud-progresso-risco: largura/altura
  proporcional a comidas restantes sobre o total, e cor de acordo com o nível de risco (seguro,
  elevado, crítico).
- **FR-003**: O contador numérico de comidas restantes DEVE ser posicionado imediatamente acima da
  barra vertical, ambos no mesmo agrupamento no canto superior direito.
- **FR-004**: O reposicionamento e a reorientação da barra NÃO DEVEM alterar os limiares de risco
  nem a lógica de atualização já definidos em FR-002 a FR-005 do spec 002-hud-progresso-risco —
  apenas a posição e orientação visual mudam.
- **FR-005**: A pontuação DEVE permanecer centralizada horizontalmente na parte superior da tela,
  na mesma posição horizontal usada hoje.
- **FR-006**: A pontuação DEVE ser exibida em 28px (tamanho atual: 16px), um aumento claramente
  perceptível ao jogador.
- **FR-007**: A pontuação DEVE usar a fonte cartunesca "Fredoka", em vez da fonte padrão usada
  atualmente.
- **FR-008**: O contador de comidas restantes (canto superior direito) DEVE usar a mesma família de
  fonte "Fredoka" aplicada à pontuação, mantendo consistência visual entre os dois textos do HUD.
- **FR-009**: Nenhum elemento do HUD reposicionado ou restilizado DEVE sobrepor prateleiras,
  comidas ou baratas, preservando a área clicável de cada barata (Princípio V — responsividade de
  clique não pode ser degradada).
- **FR-010**: O HUD reposicionado/restilizado DEVE continuar aparecendo apenas na tela de jogo (não
  na tela inicial nem na tela final), consistente com FR-008 do spec 002-hud-progresso-risco.
- **FR-011**: Esta feature NÃO DEVE alterar nenhuma regra de domínio existente (cálculo de risco,
  cálculo de pontuação, condição de derrota) — é restrita à camada de apresentação da GameScene.

### Key Entities

- **Indicador de vida (HUD)**: mesmo elemento de leitura derivada já descrito no spec
  002-hud-progresso-risco (contador + barra de risco), agora reposicionado para o canto superior
  direito e reorientado verticalmente. Continua sem introduzir estado mutável novo no domínio.
- **Texto de pontuação (HUD)**: elemento textual já introduzido no spec 004-sistema-pontuacao,
  agora com estilo tipográfico (tamanho e família de fonte) atualizado; a posição horizontal e a
  fonte de dados (score do `Match`) não mudam.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste de usabilidade informal, jogadores localizam o indicador de vida no canto
  superior direito em menos de 2 segundos após serem instruídos a verificar "quanto de vida
  resta", sem precisar procurar em outras áreas da tela.
- **SC-002**: O reposicionamento e a restilização não introduzem nenhuma queda perceptível de FPS
  nem atraso de clique nas baratas, preservando os 60 FPS estáveis exigidos pelo Princípio V da
  constitution.
- **SC-003**: A fonte da pontuação passa de 16px para 28px (75% maior), um aumento mensurável e
  facilmente confirmável por inspeção visual ou automatizada do texto renderizado.
- **SC-004**: Em qualquer resolução desktop suportada, o agrupamento do canto superior direito e a
  pontuação centralizada permanecem totalmente visíveis, sem corte nas bordas da tela e sem
  sobreposição entre si.

## Assumptions

- A fonte "Fredoka" é adicionada como novo asset versionado ao projeto (Princípio VI da
  constitution), carregada com uma fonte de fallback padrão do sistema para o caso de
  falha/atraso no carregamento.
- Seguindo a referência do Mega Man X, a barra vertical é preenchida da base para o topo
  proporcionalmente a comidas restantes/total (o topo "esvazia" primeiro conforme o risco aumenta),
  como preenchimento contínuo — mantendo a simplicidade deliberada (Princípio IV) do desenho atual
  da barra horizontal, sem introduzir lógica de segmentação em blocos.
- O agrupamento contador+barra no canto superior direito usa uma margem fixa a partir da borda da
  tela, análoga à margem já usada pelo HUD horizontal atual, sem necessidade de adaptação por
  resolução além do já suportado (apenas resoluções desktop, conforme escopo do MVP).
- Não há novos níveis de risco, novos estados de jogo, nem qualquer alteração de regra — a mudança
  é inteiramente visual, reaproveitando os dados já expostos por `MatchSnapshot`
  (`foodRemainingCount`, `foodTotalCount`, `riskLevel`, `score`).
