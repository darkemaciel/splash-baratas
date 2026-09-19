# Backlog — Baratas na Geladeira

Este backlog reúne ideias de melhoria e novas features para o jogo, identificadas durante a
especificação do MVP (`specs/001-roach-fridge-clicker/spec.md`) e em uma sessão de brainstorm
sobre os próximos passos do produto. Nenhum destes itens está implementado — todos ficaram
deliberadamente fora do MVP por simplicidade (Princípio IV da `constitution.md`).

## Como priorizamos

Cada item é avaliado em três eixos independentes, em escala **Baixo / Médio / Alto**:

- **Risco** — chance de comprometer a responsividade do clique (Princípio V), gerar dívida
  técnica relevante, ou de a aposta de produto não se confirmar (ex.: feature que ninguém usa).
- **Pontuação (valor)** — impacto esperado na diversão, retenção ou nos objetivos de negócio do
  PRD (seção 2: validar diversão, coletar feedback, manter custo ~R$0).
- **Esforço** — complexidade de implementação dado o estado atual do código (camada de domínio já
  separada da renderização, pub-sub via `MatchStateManager`, sem backend).

A partir dos três eixos, cada item recebe uma **Prioridade** sugerida:

| Prioridade | Significado |
|---|---|
| **P0** | Quick win — valor alto, esforço baixo, risco baixo. Fazer primeiro. |
| **P1** | Próxima onda — valor alto, mas esforço e/ou risco moderados. |
| **P2** | Aposta a avaliar — valor médio, ou esforço/risco altos que pedem validação antes. |
| **P3** | Radar / não agora — conflita com o escopo atual do PRD, depende de itens P1/P2, ou tem
  retorno incerto demais para priorizar já. |

Quando um item for priorizado, ele **DEVE** entrar como uma spec nova via `/speckit-specify`, não
como alteração retroativa da spec do MVP (`001-roach-fridge-clicker`) — conforme o Princípio IV
da constitution.

---

## 1. Jogabilidade e feedback sensorial ("game feel")

| Item | Descrição | Risco | Pontuação | Esforço | Prioridade |
|---|---|---|---|---|---|
| HUD de progresso/risco | Contador visível de comidas restantes/roubadas, ou barra de risco geral. Hoje o jogador só lê o estado observando as prateleiras (FR-022). | Baixo | Médio | Baixo | ✅ **Entregue** |
| Juice na animação da barata | Squash/stretch e leve tremor na barata perto do alvo, para reforçar urgência visual sem mudar a lógica de domínio. Entregue via `specs/008-juice-animacao-barata`: `computeRoachSquashStretch`/`computeRoachTremorOffset` em `GameScene.syncRoachSprites`, intensidade escalando com `progress(roach, now)` (zero no spawn, máxima ao alcançar o alvo). | Baixo | Médio | Baixo | ✅ **Entregue** |
| Animação de voo da barata | Animação contínua (ex.: bater de asas/oscilação vertical) tocando durante todo o trajeto, independente da proximidade do alvo — hoje a barata é um sprite estático deslocado por `positionAt()`. Feedback do usuário ao validar `specs/008-juice-animacao-barata`: como o "juice" atual (squash/tremor) zera no spawn e só cresce perto do alvo, uma spec futura de voo precisa decidir como compor as duas camadas (ex.: voo como baseline sempre ativo, urgência como modulação por cima) sem reabrir o cálculo já entregue em `GameScene`. | Baixo | Médio | Médio | **P2** |
| Pausar partida | Tecla/botão de pausa que congela `tick()` sem resetar o `Match`. Simples dado que o loop já é orientado por timestamp (`now`). Entregue via `specs/009-pausar-partida`: botão + tecla P, congelando spawn/trajeto/roubo e também as animações visuais em andamento (tweens de feedback e o juice da spec 008), sem perder vida/comidas/pontuação/cronômetro; cliques não têm efeito enquanto pausado. | Baixo | Médio | Baixo | ✅ **Entregue** |
| Variação nos pontos de spawn | Baratas surgindo de múltiplos pontos/padrões, não só os 4 pontos fixos hoje (`SPAWN_POINTS`, FR-005). Entregue via `specs/010-variacao-pontos-spawn`: 4 pontos fixos substituídos por 4 regiões de borda com 3 pontos candidatos cada (12 no total), preservando a coerência de lado com o alvo (`nearestSpawnRegion`) e evitando repetir o ponto do spawn imediatamente anterior para a mesma comida (`lastSpawnPointByTarget`, FR-005). | Baixo | Baixo | Baixo | ✅ **Entregue** |

## 2. Progressão e replayability

| Item | Descrição | Risco | Pontuação | Esforço | Prioridade |
|---|---|---|---|---|---|
| Cronômetro de tempo de sobrevivência | Cronômetro visível durante a partida, marcando o tempo decorrido desde o início; para quando a partida termina e reinicia em uma nova partida. Primeiro passo da progressão, sem pontuação, dificuldade progressiva ou persistência de recorde ainda. Entregue via `specs/007-tempo-de-sobrevivencia`: HUD centralizado no topo da tela. | Baixo | Alto | Baixo | ✅ **Entregue** |
| High score local | Ranking local (Top 5) de pontuações finais, com nome do jogador, persistido em `localStorage` (sem backend). Base para qualquer modo competitivo futuro. Entregue via `specs/012-high-score-local`: `HighScoreStore.getRanking()`/`recordScore(name, score)` mantêm as 5 maiores pontuações já alcançadas (cada entrada com nome + pontuação), tratando valor ausente/corrompido/formato antigo (versões anteriores desta feature) como ranking vazio; ao perder, `GameOverScene` pede o nome do jogador num painel no próprio canvas (estilo "insira suas iniciais" de arcade, sem `window.prompt()`), mostra só a pontuação final centralizada e a posição alcançada, e exibe o Top 5 num card estilo fliper — decisão do dono do produto de concentrar tudo na tela de derrota, sem nada equivalente na tela inicial. | Baixo | Médio | Baixo | ✅ **Entregue** |
| Sistema de pontuação | Pontos por barata eliminada, com bônus por velocidade de reação e combos. Fora do MVP por decisão explícita do PRD (FR-019). | Médio | Alto | Médio | **P1** |
| Dificuldade progressiva | Aumento gradual de `SPAWN_INTERVAL_MS`/`TRAVEL_DURATION_MS` ao longo da partida. Hoje são constantes fixas e únicas (Princípio IV, FR-016) — a mudança precisa ser cuidadosa para não virar estado mutável espalhado pelo domínio. Entregue via `specs/011-dificuldade-progressiva`: `SPAWN_INTERVAL_BASE_MS`/`TRAVEL_DURATION_BASE_MS` decrescem linearmente até os pisos `SPAWN_INTERVAL_FLOOR_MS`/`TRAVEL_DURATION_FLOOR_MS` conforme o tempo de sobrevivência avança (`currentSpawnIntervalMs`/`currentTravelDurationMs`), atingindo o piso em `DIFFICULTY_RAMP_DURATION_MS`; baratas já em trajeto não são afetadas retroativamente, e a progressão não avança durante pausa nem persiste entre partidas. | Médio | Alto | Médio | ✅ **Entregue** |
| Teto de baratas simultâneas configurável | Hoje o limite implícito é uma barata por comida presente (FR-021); um teto artificial menor permitiria tunar ritmo/dificuldade sem depender do nº de comidas. | Baixo | Médio | Baixo | **P1** |
| Modo sobrevivência/infinito | Sem condição de derrota fixa por "todas roubadas" — objetivo passa a ser aguentar o máximo de tempo/ondas. Depende de dificuldade progressiva para ter graça. | Médio | Alto | Médio | **P2** |
| Tipos de barata | Variações (rápida, "tanque" que exige 2 cliques, camuflada) que multiplicam variedade tática. Maior escopo: novas entidades, sprites, regras de colisão por tipo. | Médio | Alto | Alto | **P2** |

## 3. Acessibilidade e UX

| Item | Descrição | Risco | Pontuação | Esforço | Prioridade |
|---|---|---|---|---|---|
| Mute/volume toggle | Controle simples de áudio, dependente do item de SFX acima existir primeiro. | Baixo | Médio | Baixo | **P0** (após SFX) |
| Responsividade para celular | Adequar canvas, prateleiras e HUD a telas pequenas/mobile — mesmo com mobile fora do escopo funcional do MVP, a tela precisa se adaptar em vez de quebrar. Sobrepõe e adianta o "Layout responsivo para touch" da seção 4. Entregue via `specs/006-responsividade-mobile`: escala automática do canvas (Scale Manager `FIT`) + base de layout dedicada para retrato (celular em pé, sem precisar girar a tela). | Médio | Alto | Médio | ✅ **Entregue** |
| Ajuste na HUD | Refino de posicionamento, legibilidade e contraste do HUD de progresso/risco recém-entregue (seção 1), com base no uso real e na nova pontuação por barata morta. Entregue: vida + barra de risco movidas para o canto superior direito; pontuação reposicionada à esquerda da vida, ancorada para crescer sempre para a esquerda conforme ganha dígitos (nunca sobrepõe a vida nem corta na borda da tela). | Baixo | Médio | Baixo | ✅ **Entregue** |
| Modo de alto contraste / daltônico | Paleta alternativa para reforçar contraste barata/comida/fundo, além do já exigido pelo NFR de acessibilidade do PRD (seção 6). WCAG completo continua fora de escopo. | Baixo | Médio | Baixo | **P1** |
| Tutorial/onboarding na primeira partida | Overlay curto explicando o objetivo antes do primeiro spawn — ajuda a bater a métrica de 80% de conclusão do loop principal (PRD seção 2). | Baixo | Alto | Médio | **P1** |
| Suporte a teclado para menus | Navegação por teclado nas telas de início/fim (não afeta o clique em jogo, que continua sendo o core via Pointer Events). | Baixo | Baixo | Baixo | **P3** |

## 4. Mobile e compatibilidade

| Item | Descrição | Risco | Pontuação | Esforço | Prioridade |
|---|---|---|---|---|---|
| Layout responsivo para touch | Interações e hitboxes otimizadas para toque real, além da adaptação básica de tela já promovida a P0 ("Responsividade para celular", seção 3). A arquitetura de input já é compatível via Pointer Events (Princípio III), mas UX mobile dedicada foi explicitamente adiada. | Médio | Alto | Alto | **P2** |
| Testes em dispositivo touch real | Validar hitbox e responsividade de clique (Princípio V) em touch real, não só emulação de browser. | Médio | Médio | Médio | **P2** |
| PWA instalável/offline | Manifest + service worker para "instalar" o jogo e jogar offline, aproveitando que já é 100% client-side. | Baixo | Médio | Médio | **P3** |

## 5. Produto, growth e aprendizado

| Item | Descrição | Risco | Pontuação | Esforço | Prioridade |
|---|---|---|---|---|---|
| Link/formulário de feedback pós-partida | Item já **dentro do escopo do MVP no PRD** (seção 4) mas não implementado no código atual — não há nenhuma referência a formulário/feedback nas scenes. Crítico para a meta de 5 feedbacks qualitativos (PRD seção 2). | Baixo | Alto | Baixo | **P0** |
| Eventos de analytics de gameplay | `@vercel/analytics` já está instalado, mas não há evidência de eventos customizados (spawn, elim, roubo, derrota, tempo de partida) sendo disparados — só o essencial de pageview. Sem isso, as KPIs do PRD (seção 2) não são mensuráveis. | Baixo | Alto | Baixo | **P0** |
| Compartilhamento de resultado | Botão "compartilhar" com resumo da partida (ex.: "sobrevivi X segundos"), útil só depois de existir high score/pontuação. | Baixo | Médio | Médio | **P2** |
| Página "Sobre"/créditos | Créditos de assets, versão do jogo, link de contato. | Baixo | Baixo | Baixo | **P3** |

## 6. Técnico, qualidade e infraestrutura

| Item | Descrição | Risco | Pontuação | Esforço | Prioridade |
|---|---|---|---|---|---|
| CI no GitHub (lint + test + build) | Rodar `bun test` e `bun run build` em cada PR. Repo já tem histórico de PRs via GitHub; hoje não há indício de workflow de CI. Baixo esforço, alto valor para não regredir a suíte de testes existente. | Baixo | Alto | Baixo | **P0** |
| Testes E2E do loop completo | Cobertura ponta a ponta (start → spawn → clique/roubo → game over → restart) complementando os testes unitários de domínio já existentes em `client/tests/unit/`. | Baixo | Alto | Médio | **P1** |
| Error tracking (ex. Sentry) | Captura de exceções em produção — hoje bugs em prod só apareceriam via feedback manual do jogador. | Baixo | Médio | Baixo | **P1** |
| Monitoramento real de FPS/Web Vitals | Instrumentar quedas de frame rate em campo, já que o PRD trata performance como requisito crítico (seção 6) mas hoje só é validado manualmente. | Médio | Médio | Médio | **P2** |
| Object pooling de sprites | Reaproveitar `Phaser.GameObjects.Image` de baratas/comida em vez de criar/destruir a cada spawn/roubo — relevante principalmente se "modo infinito" (item da seção 2) for priorizado e partidas ficarem longas. | Médio | Médio | Médio | **P2** |
| Substituir sprites placeholder por arte final | `client/public/assets/sprites/` hoje usa placeholders (ver CLAUDE.md); arte final melhora percepção de qualidade sem tocar lógica. | Baixo | Alto | Médio | **P2** (depende de arte pronta) |
| Internacionalização (PT/EN) | Externalizar strings hoje hardcoded nas scenes (`GameOverScene`, `StartScene`) para permitir outro idioma. Só relevante se houver intenção de público fora do Brasil. | Baixo | Baixo | Médio | **P3** |

## 7. Backend, persistência e monetização (fase futura)

Itens que exigem revisar o Princípio VII (stack fixada, sem backend no MVP) ou que o PRD já
exclui explicitamente (seção 4). Mantidos aqui apenas como radar de longo prazo — nenhum deve
virar spec sem uma decisão de produto explícita primeiro.

| Item | Descrição | Risco | Pontuação | Esforço | Prioridade |
|---|---|---|---|---|---|
| Leaderboard global | Ranking entre jogadores diferentes exige backend + persistência, hoje inexistente por decisão de arquitetura (Princípio VII). | Alto | Alto | Alto | **P3** |
| Contas/autenticação de jogador | Explicitamente fora de escopo no PRD (seção 4: "sistema completo de contas, perfis e autenticação"). | Alto | Baixo | Alto | **P3** |
| Multiplayer/competitivo | Explicitamente fora de escopo no PRD (seção 4). | Alto | Baixo | Alto | **P3** |
| Monetização (anúncios, cosméticos pagos) | Explicitamente fora de escopo no PRD (seção 4: "monetização, compras dentro do jogo e anúncios"). Risco alto de prejudicar a validação de diversão se introduzida cedo. | Alto | Baixo | Médio | **P3** |

---

## Como usar este backlog

1. Escolher itens **P0**/**P1** primeiro — são os de melhor relação valor/esforço/risco.
2. Ao priorizar um item, abrir uma **spec nova** via `/speckit-specify` (nunca editar
   retroativamente `specs/001-roach-fridge-clicker/`), conforme o Princípio IV da constitution.
3. Se um item exigir revisar um princípio da constitution (ex.: sair da stack fixada do
   Princípio VII para adicionar backend), isso deve ser proposto explicitamente via
   `/speckit-constitution` antes da spec — nunca contornado silenciosamente dentro de uma feature.
4. Reavaliar risco/pontuação/esforço sempre que o contexto mudar (ex.: KPIs do MVP forem
   medidos, ou feedback real de jogadores chegar) — este backlog é um retrato do brainstorm atual,
   não uma decisão definitiva de roadmap.
