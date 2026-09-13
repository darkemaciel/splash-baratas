# Research: HUD de Progresso/Risco

Resolve as decisões técnicas necessárias para implementar o indicador de HUD descrito em
`spec.md`, sem introduzir NEEDS CLARIFICATION — o escopo é pequeno o suficiente e o codebase do
MVP (`specs/001-roach-fridge-clicker/`) já estabelece os padrões relevantes.

## 1. Onde calcular a contagem e o nível de risco

**Decision**: adicionar funções puras `foodRemainingCount(match)`, `foodTotalCount(match)` e
`riskLevel(match)` em `client/src/entities/Match.ts`, junto das funções puras já existentes
(`allFoodStolen`, `presentFoodItemsWithoutActiveRoach`).

**Rationale**: o cálculo (contar `foodItems` por `state`, comparar proporção com os limiares da
spec) é lógica de jogo, não de renderização — pertence à camada de domínio por definição do
Princípio I. Reaproveitar o padrão de funções puras já usado em `Match.ts` mantém a feature
testável via `bun test` sem depender do Phaser, e evita duplicar a regra de negócio dentro de
`GameScene`.

**Alternatives considered**: calcular a contagem/risco diretamente dentro de `GameScene` a partir
de `snapshot.foodItems` — rejeitado porque espalharia uma regra de negócio (os limiares de risco
de FR-005) em uma `Scene` do Phaser, violando o Princípio I e tornando a regra não testável de
forma isolada.

## 2. Como expor esses valores para a scene

**Decision**: estender a interface `MatchSnapshot` (em `MatchStateManager.ts`) com os campos
`foodRemainingCount: number`, `foodTotalCount: number` e `riskLevel: RiskLevel`, calculados dentro
de `getSnapshot()` chamando as funções puras da decisão #1.

**Rationale**: `MatchSnapshot` já é o único contrato de leitura entre domínio e `scenes/`
(contracts/domain-api.md do MVP); adicionar campos a ele mantém essa fronteira única em vez de
criar um segundo canal de leitura paralelo (ex.: um getter adicional no `MatchStateManager`).

**Alternatives considered**: expor um método separado `MatchStateManager.getHudInfo()` —
rejeitado por duplicar informação já disponível em `getSnapshot()` e criar duas fontes de verdade
que podem divergir entre si (ex.: um snapshot tirado antes de uma chamada a `getHudInfo()` tirada
depois, no mesmo frame, refletindo estados diferentes).

## 3. Representação visual (texto + barra/cor)

**Decision**: usar `Phaser.GameObjects.Text` para o contador numérico e
`Phaser.GameObjects.Graphics` (um retângulo preenchido, redesenhado apenas quando `riskLevel`
muda) para a barra de risco, com uma cor fixa por nível (`riskLevel`: `safe` → verde, `elevated` →
amarelo, `critical` → vermelho). Nenhum sprite/imagem novo é necessário.

**Rationale**: `Text`/`Graphics` são primitivas nativas do Phaser já usadas implicitamente pelo
motor (sem custo de asset pipeline); evita popular `client/public/assets/sprites/` com arte nova
só para uma barra de cor sólida, mantendo o esforço "Baixo" estimado no backlog. Redesenhar a
`Graphics` apenas na transição de nível (não a cada frame) preserva o Princípio V — o único
trabalho por frame é, na pior hipótese, comparar o `riskLevel` atual com o anterior.

**Alternatives considered**: sprites de barra pré-renderizados (ex.: `hud-bar-safe.png`,
`hud-bar-critical.png`) — rejeitado como esforço extra desnecessário (exigiria arte nova) para um
retângulo de cor sólida que `Graphics` resolve nativamente.

## 4. Posicionamento sem sobrepor prateleiras/comidas/baratas

**Decision**: posicionar o HUD no topo da cena, centralizado horizontalmente, ocupando a faixa
`y ∈ [8, 48]` — acima da primeira prateleira, que começa em `SHELF_Y_POSITIONS[0] - 40 = 120`
(`gameConfig.ts`), com folga suficiente mesmo considerando o padding de hitbox das baratas
(`HITBOX_PADDING_PX = 6`, `ROACH_VISUAL_RADIUS = 20`) e os pontos de spawn superiores
(`SPAWN_POINTS`: `y = -40`).

**Rationale**: a barata que surge no ponto de spawn superior (`y = -40`) leva todo o
`TRAVEL_DURATION_MS` para alcançar a prateleira mais próxima (`y = 120`), cruzando a faixa
`y ∈ [8, 48]` apenas de passagem — como o HUD não é uma hitbox e o clique é feito sobre a barata
(círculo de raio `ROACH_VISUAL_RADIUS + HITBOX_PADDING_PX = 26`), não há sobreposição funcional
mesmo que visualmente a barata cruze essa faixa; a barata continua clicável normalmente. FR-007 é
satisfeito porque o HUD nunca fica sobre uma prateleira/comida (`y >= 120`) nem sobre uma barata
parada em seu alvo.

**Alternatives considered**: posicionar o HUD em um canto (ex.: superior direito) — rejeitado por
ser menos legível em uma tela de 960×600 com layout já centralizado nas prateleiras; o topo
centralizado é consistente com convenções usuais de HUD em jogos casuais.

## 5. Testes

**Decision**: `bun test` para as três novas funções puras (`foodRemainingCount`,
`foodTotalCount`, `riskLevel`), em `client/tests/unit/match.hud.test.ts`, cobrindo os limiares de
FR-005 (exatamente no limite de 50%, exatamente 1 restante, 0 restante). A renderização do HUD em
si (texto/cor na tela) é validada manualmente via `bun run dev`, seguindo o mesmo padrão do MVP
(que não tem testes automatizados de Phaser).

**Rationale**: consistente com research.md §1 da spec 001 — `bun test` já é o test runner fixado
para a camada de domínio; não há necessidade de introduzir um framework de teste visual/e2e novo
só para este item (isso já está mapeado como item separado do backlog, seção 6: "Testes E2E do
loop completo").

**Alternatives considered**: testes de snapshot do Phaser (ex.: capturar canvas) — rejeitado por
exigir infraestrutura de teste nova, desproporcional ao escopo "Baixo esforço" deste item.
