# Research: Teto de Baratas Simultâneas Progressivo

## 1. Onde plugar o teto explícito

**Decision**: adicionar uma função pura `currentRoachCap(survivalMs)` em `client/src/config/gameConfig.ts`
(mesmo arquivo/padrão de `currentSpawnIntervalMs`/`currentTravelDurationMs`, `specs/011-dificuldade-progressiva`),
reaproveitando o helper interno já existente `rampedValue(survivalMs, base, floor)` — que já faz
interpolação linear genérica de um valor para outro ao longo de `DIFFICULTY_RAMP_DURATION_MS`,
suportando tanto curvas decrescentes (spawn interval/travel duration) quanto uma curva **crescente**
como esta (basta que `base < alvo`, já que a fórmula é `base + (alvo - base) * t`).

**Rationale**: zero duplicação de lógica de rampa; o comportamento de "gradual, contínuo, com piso
em ambas as pontas" (FR-004) já está testado e validado por `specs/011`.

**Alternatives considered**:
- Escrever uma segunda função de interpolação dedicada a curvas crescentes → rejeitado, redundante
  com `rampedValue` já genérico.
- Curva não-linear (ex.: degraus, exponencial) → fora de escopo; a spec (Assumptions) deixa a forma
  exata a critério do planejamento, e linear já é o padrão estabelecido por `specs/011` para as
  outras duas curvas — manter os três eixos de dificuldade na mesma forma de curva reduz superfície
  cognitiva (Princípio IV).

## 2. Onde aplicar o teto no ciclo de spawn

**Decision**: em `MatchStateManager.tick()`, calcular `const roachCap = currentRoachCap(survivalMs);`
junto dos outros dois valores já calculados a partir de `survivalMs`, e adicionar
`this.match.activeRoaches.length < roachCap` como condição extra (com `&&`) ao lado da condição já
existente `candidates.length > 0`, antes de criar uma nova `Roach`.

**Rationale**: o teto natural de hoje (uma barata por comida presente, FR-021 da spec 001) já é
garantido inteiramente por `candidates.length > 0` — cada barata ativa consome uma comida-alvo
distinta da lista de candidatas, então o número de baratas ativas nunca pode superar o número de
comidas presentes, **por construção**, independentemente do valor do teto explícito. Isso significa
que **FR-006 (nunca exceder comidas presentes) não exige nenhum código novo** — basta que o teto
explícito seja aplicado como uma condição *adicional* (`&&`), nunca substituindo a checagem de
`candidates.length`.

**Alternatives considered**:
- Calcular `Math.min(currentRoachCap(survivalMs), candidates.length)` e comparar contra isso →
  matematicamente equivalente, mas exige uma variável a mais sem necessidade; a forma com duas
  condições `&&` já expressa a intenção (dois limites independentes) com mais clareza para quem ler
  o código depois.
- Mover a checagem para dentro de `presentFoodItemsWithoutActiveRoach` (`entities/Match.ts`) →
  rejeitado: essa função é pura e não tem acesso a `survivalMs`/tempo, e misturaria uma decisão de
  balanceamento (teto progressivo) dentro de uma entidade de domínio que hoje só expressa a regra
  estrutural "uma barata por comida". Mantém a separação já estabelecida por specs/011 (curvas ficam
  em `config/`, orquestração em `systems/`).

## 3. Valores concretos (base, máximo, duração da rampa)

**Revisão pós-verificação empírica**: a primeira versão desta seção propunha `ROACH_CAP_BASE = 3` /
`ROACH_CAP_MAX = TOTAL_FOOD_ITEMS` (9), assumindo que a concorrência natural de baratas hoje se
aproxima do número de comidas presentes. Rodar o `MatchStateManager` real (sem nenhuma eliminação,
deixando o jogo roubar comida normalmente) por toda a rampa de dificuldade de `specs/011` mostrou
que o número máximo de baratas simultâneas **nunca passa de 2**, do início ao fim da rampa — porque
`TRAVEL_DURATION_MS` (2000–3000ms) e `SPAWN_INTERVAL_MS` (1200–2500ms) têm uma razão que
estruturalmente nunca permite uma terceira barata ainda voando quando a próxima surge. Ou seja, o
"até 9 simultâneas" de FR-021 sempre foi um teto puramente teórico, nunca alcançado na prática — um
teto explícito de `3`/`9` não teria absolutamente nenhum efeito observável. Os valores abaixo foram
revisados para que o teto realmente vincule algo (decisão do dono do produto, após ver esta
descoberta).

**Decision**:
- `ROACH_CAP_BASE = 1` — início de partida com no máximo 1 barata ativa por vez (hoje já oscila entre
  1 e 2 o tempo todo, mesmo no início) — visivelmente mais calmo (FR-002), o único valor abaixo do
  teto natural de hoje (2) capaz de ter algum efeito perceptível.
- `ROACH_CAP_MAX = 2` — iguala exatamente o teto natural de concorrência de hoje (verificado
  empiricamente acima), preservando o comportamento de "fim de rampa" como o presente já é, sem
  reduzir nem ampliar o caos máximo do jogo publicado.
- Reaproveita `DIFFICULTY_RAMP_DURATION_MS` (já existente, `specs/011`) como duração da rampa, em vez
  de uma constante dedicada nova.

**Consequência aceita para FR-004 ("aumento gradual, sem saltos abruptos")**: com um intervalo de
apenas 2 valores inteiros possíveis (`1` e `2`), `Math.round` produz necessariamente uma única
transição discreta no meio da rampa (`survivalMs` ao redor de `DIFFICULTY_RAMP_DURATION_MS / 2`), não
vários incrementos graduais como as curvas de `specs/011` (que variam em centenas de milissegundos ao
longo de toda a rampa). Isso é uma consequência matemática inevitável de qualquer intervalo tão
estreito, não um defeito de implementação — documentado aqui para transparência; o dono do produto
optou por este intervalo mesmo assim, ciente do trade-off, porque é o único que produz algum efeito
real dado o teto natural de concorrência de hoje.

**Rationale**: reaproveitar `DIFFICULTY_RAMP_DURATION_MS` mantém os três eixos de dificuldade
convergindo no mesmo instante de sobrevivência (mais simples de balancear e explicar, Princípio IV).
`ROACH_CAP_MAX = 2` (em vez de `TOTAL_FOOD_ITEMS`) é o único valor que não é redundante frente ao teto
natural — qualquer valor acima de 2 seria tão inobservável quanto os 9 originais.

**Alternatives considered**:
- Manter `ROACH_CAP_BASE = 3` / `ROACH_CAP_MAX = TOTAL_FOOD_ITEMS` → rejeitado após a verificação
  empírica: teria zero efeito prático, contradizendo FR-002/FR-003/SC-001/SC-002 (a feature precisa
  ser "visivelmente" diferente de hoje).
- Também acelerar `SPAWN_INTERVAL_BASE_MS`/`FLOOR_MS` (`specs/011`) para que a concorrência natural
  suba o suficiente para um teto de `3`–`9` voltar a fazer sentido → rejeitado: mudaria o
  balanceamento já entregue e validado por `specs/011`, fora do escopo desta spec (que só deveria
  adicionar um teto, não retunar a cadência de spawn já existente).
- `ROACH_CAP_MAX` > 2 (ex.: 3, 5, 9) → rejeitado: qualquer valor acima de 2 é redundante frente ao
  teto natural de concorrência (research.md, verificação empírica acima) — nunca seria alcançado, logo
  nunca observável.
- Duração de rampa própria e dissociada de `DIFFICULTY_RAMP_DURATION_MS` → deixado como alternativa
  válida caso playtest futuro peça os três eixos convergindo em ritmos diferentes; sem evidência
  disso hoje, reaproveitar é mais simples (Princípio IV) e é uma mudança de uma linha se revisto.

## 4. Estratégia de teste para o pico de concorrência

**Decision**: os testes de orquestração de `specs/011` (`simulateSurvivalCollectingSpawns`) eliminam
cada barata imediatamente ao spawnar, o que nunca deixa mais de 1 barata ativa por vez — inadequado
para testar um teto de *baratas simultâneas*. Um novo helper de teste avança `tick()` em passos
fixos e, a cada passo, elimina apenas as baratas cujo tempo de trajeto está prestes a se esgotar
(evitando que alguma roube sua comida-alvo), enquanto deixa as demais ativas simultaneamente;
registra o maior `activeRoaches.length` observado a cada passo. Isso mantém todas as 9 comidas
presentes indefinidamente (a partida nunca termina), permitindo observar a rampa completa do teto
(do início até `DIFFICULTY_RAMP_DURATION_MS` e além) sem nunca deixar nenhuma barata roubar comida.

**Rationale**: é a única forma de observar múltiplas baratas ativas simultaneamente por tempo
suficiente para medir o crescimento do teto, sem deixar o jogo terminar por derrota no meio do teste
(o que aconteceria rápido demais se as baratas fossem autorizadas a roubar, já que
`TRAVEL_DURATION_BASE_MS`/`FLOOR_MS` são de poucos segundos frente aos ~90s de rampa).

**Alternatives considered**:
- Reaproveitar `simulateSurvivalCollectingSpawns` sem alterações → rejeitado, nunca produz mais de 1
  barata ativa simultânea (elimina antes do próximo tick), não exercita o teto de forma alguma.
- Testar só via `MatchStateManager` "congelado" (chamando `tick()` uma única vez em `survivalMs`
  alto, com `activeRoaches` pré-populado manualmente) → rejeitado: exigiria manipular estado privado
  de `Match`/`MatchStateManager` diretamente (quebra encapsulamento) em vez de exercitar o fluxo
  público real de `tick()`/eventos, divergindo do padrão de teste já usado em todo o projeto.
