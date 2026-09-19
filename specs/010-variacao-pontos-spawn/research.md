# Research: Variação nos Pontos de Spawn

Nenhum `NEEDS CLARIFICATION` restou no Technical Context do `plan.md` — a única decisão de
arquitetura genuinamente em aberto (pontos fixos e discretos vs. posições contínuas sorteadas) já
foi resolvida na sessão de `/speckit-clarify` (ver `spec.md` → Clarifications). Este documento
registra as decisões de design mais específicas necessárias para o Phase 1, todas derivadas direto
do código existente.

## 1. Quantos pontos por região?

**Decision**: 3 pontos fixos por região (topo/base/esquerda/direita) = 12 pontos no total, contra 4
hoje.

**Rationale**: `SC-001` exige observar ao menos 8 posições distintas em uma partida de 2+ minutos.
Com 3 pontos por região e 4 regiões, o teto teórico é 12; como as 9 comidas do grid (`specs/001`,
3×3) se distribuem por diferentes regiões coerentes (colunas mais à esquerda tendem a cair na região
"esquerda", topo da prateleira mais alta tende a cair em "topo" etc.), uma partida típica de 2+
minutos (≈48 spawns em `SPAWN_INTERVAL_MS`=2500ms) visita múltiplas regiões e tem folga estatística
confortável para bater 8 pontos distintos observados sem depender de sorte. Um número menor (2 por
região = 8 total) deixaria o teto igual ao mínimo exigido, sem margem.

**Alternatives considered**:
- **1 ponto por região (config atual)**: é exatamente o comportamento hoje — não atende ao pedido do
  backlog.
- **5+ pontos por região**: aumenta a superfície de configuração sem ganho perceptível adicional de
  variedade (o jogador já para de conseguir prever a posição exata com poucos pontos por lado); mais
  candidatos também dilui ainda mais a chance de repetição — irrelevante para a regra de
  não-repetição do `FR-005`, que já funciona com apenas 2+.

## 2. Onde alocar os 3 pontos dentro de cada região?

**Decision**: distribuídos uniformemente ao longo da borda correspondente, como frações de
`GAME_WIDTH`/`GAME_HEIGHT` — mesmo padrão já usado por `SHELF_Y_FRACTIONS`/`FOOD_SLOT_X_FRACTIONS`
em `gameConfig.ts`. Para topo/base: 3 valores de x (25%, 50%, 75% de `GAME_WIDTH`), y fixo em `-40`/
`GAME_HEIGHT + 40`. Para esquerda/direita: 3 valores de y (25%, 50%, 75% de `GAME_HEIGHT`), x fixo em
`-40`/`GAME_WIDTH + 40`. O ponto central de cada região (50%) coincide exatamente com o ponto único
que existe hoje, preservando compatibilidade visual com o comportamento atual como um dos 3 casos
possíveis.

**Rationale**: usar frações da resolução-base (em vez de pixels absolutos) é o padrão já
estabelecido no arquivo para sobreviver à troca de resolução landscape/portrait de
`specs/006-responsividade-mobile` sem cálculo adicional. A margem fixa de 40px fora da tela (`-40`/
`+40`) já é a mesma usada pelos 4 pontos atuais — reaproveitada tal qual, garantindo `FR-002`
(sempre fora da área de prateleiras/comidas) por construção, sem necessidade de checagem em tempo de
execução.

**Alternatives considered**:
- **Espaçamento não-uniforme (ex.: mais denso perto do centro da borda)**: nenhum requisito do spec
  pede isso; adicionaria complexidade de configuração sem valor claro para `SC-001`/`SC-004`.

## 3. Como decidir a região coerente com o alvo?

**Decision**: manter a mesma lógica de "âncora mais próxima" que `nearestSpawnPoint` já usa hoje,
mas aplicada às 4 âncoras (os antigos `SPAWN_POINTS`) em vez de aos 12 pontos novos. Renomear para
`nearestSpawnRegion(target): SpawnRegion`.

**Rationale**: é literalmente o mesmo cálculo de distância euclidiana ao quadrado já existente em
`nearestSpawnPoint` — muda apenas o que é retornado (o nome da região, não um `Point` direto) e o
array percorrido (4 âncoras, não 12 pontos). Preserva 100% o comportamento de coerência já validado
pelo MVP (`FR-003`, US2 do spec).

**Alternatives considered**:
- **Recalcular a região a partir de quadrantes geométricos (ângulo em relação ao centro)**: produz
  resultado equivalente para o layout atual (grid 3×3 centralizado), mas é mais código para o mesmo
  resultado — rejeitado por simplicidade (Princípio IV).

## 4. Como sortear o ponto dentro da região e evitar repetição?

**Decision**: nova função pura `pickSpawnPoint(candidates, avoid?)` em `gameConfig.ts`:
- Se `avoid` for informado e existir mais de 1 candidato, filtra `avoid` da lista antes de sortear.
- Sorteia com `Math.random()` sobre a lista resultante (ou a lista completa, se só havia 1 candidato
  ou nenhum `avoid`).

`MatchStateManager` mantém `lastSpawnPointByTarget: Map<string, Point>` (chave = `targetFoodItemId`),
atualizado a cada spawn e limpo em `start()`/`restart()` — mesmo ciclo de vida de `lastSpawnAt`.

**Rationale**: `Math.random()` já é o mecanismo de aleatoriedade usado por `tick()` para escolher a
comida-alvo a cada spawn (nenhuma dependência nova, Princípio VII); os testes existentes para essa
escolha (`matchStateManager.spawn.test.ts`) já validam invariantes sob aleatoriedade real, sem seed —
o mesmo padrão se aplica aqui. Guardar o último ponto por alvo (não um histórico completo) é
suficiente para o requisito do spec (FR-005 fala apenas do spawn "imediatamente anterior" para aquele
alvo) e mantém o estado O(nº de comidas), desprezível.

**Alternatives considered**:
- **PRNG com seed determinístico**: permitiria testes 100% determinísticos, mas introduziria um
  conceito (seed/estado de RNG) que não existe em nenhum outro lugar do domínio hoje — rejeitado por
  simplicidade (Princípio IV); os testes de invariante já são o padrão aceito no projeto.
- **Histórico completo de pontos usados por alvo (não só o último)**: o spec (FR-005, Edge Cases)
  exige apenas evitar repetir o ponto imediatamente anterior, não todo o histórico — um `Map` de
  histórico completo seria complexidade não pedida.

## 5. Impacto de performance

**Decision**: nenhuma mitigação necessária.

**Rationale**: `nearestSpawnRegion` continua sendo uma varredura O(4); `pickSpawnPoint` opera sobre
um array de no máximo 3 elementos. Ambas as operações rodam apenas quando um novo spawn ocorre (a
cada `SPAWN_INTERVAL_MS` = 2500ms, no máximo uma vez por tick), o mesmo ritmo do sorteio de alvo já
existente — custo total por spawn permanece imperceptível frente ao orçamento de 60 FPS (Princípio
V, FR-007 do spec).
