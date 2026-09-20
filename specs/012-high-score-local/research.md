# Research: High Score Local

Nenhum `NEEDS CLARIFICATION` restou no Technical Context do `plan.md`. As duas ambiguidades reais do
`spec.md` (qual métrica define o ranking; recorde único vs. ranking de várias pontuações) já foram
resolvidas em `/speckit-clarify` (pontuação final, `specs/004-sistema-pontuacao`) e em uma segunda
rodada de clarificação pós-implementação (ranking Top 5, ver `## Clarifications` no `spec.md`). Este
documento registra as decisões técnicas de implementação. As seções 1-5 abaixo foram escritas para a
primeira versão (recorde único) mas continuam válidas na forma — só o formato do dado armazenado
mudou de um número para uma lista; a §6 documenta especificamente essa mudança.

## 1. Onde vive a lógica de leitura/escrita do recorde

**Decision**: um módulo novo e independente, `client/src/systems/HighScoreStore.ts`, com duas
funções exportadas (`getHighScore`, `recordScore`) — sem classe, sem estado em memória própria
(sempre lê/escreve diretamente em `localStorage` a cada chamada).

**Rationale**: o recorde não pertence ao ciclo de vida de uma `Match` (não é resetado por
`start()`/`restart()`, sobrevive à própria aba do navegador) — misturá-lo em `MatchStateManager`
ou em `Match`/`MatchSnapshot` obrigaria a distinguir "estado de partida" de "estado persistente
entre partidas" dentro da mesma classe, contrariando a separação que `Match`/`MatchSnapshot` já
têm hoje (specs/001, specs/007). Um módulo à parte, chamado diretamente pelas duas scenes que
precisam dele (`StartScene`, `GameOverScene`), é o mesmo padrão que essas scenes já usam para ler
`elapsedMs`/`formatElapsedTime` de `entities/Match.ts` — funções puras chamadas diretamente na
scene, sem passar pela camada de eventos do `MatchStateManager` (Princípio I/II: a lógica em si
fica isolada em um módulo próprio, não espalhada nos callbacks; nada impede que a scene a chame
diretamente para exibição, como já acontece hoje).

**Alternatives considered**:
- **Campo `highScore` em `MatchSnapshot`, atualizado por `MatchStateManager`**: acoplaria um
  conceito "entre partidas" ao snapshot de uma partida específica, e obrigaria `MatchStateManager`
  a conhecer `localStorage` (uma preocupação de I/O do navegador) — quebra a simetria com o resto
  da classe, que hoje só manipula estado de domínio em memória. Rejeitado por simplicidade
  (Princípio IV) e por escopo: nenhum outro requisito da spec precisa que o recorde seja "estado de
  partida".
- **Ler/escrever `localStorage` diretamente dentro das scenes**: espalharia a lógica de comparação
  e tratamento de valor corrompido/indisponível em dois lugares (`StartScene`, `GameOverScene``),
  violando a orientação explícita do Princípio II ("nunca espalhada em callbacks de UI"). Rejeitado.

## 2. `localStorage` no ambiente de testes (Bun)

**Decision**: `HighScoreStore.ts` referencia o identificador global `localStorage` diretamente
(não `window.localStorage`), atrás de um guard `typeof localStorage !== "undefined"`. Os testes
atribuem um fake simples a `globalThis.localStorage` antes de cada caso e removem depois
(`delete (globalThis as any).localStorage` ou reatribuição a `undefined`).

**Rationale**: `localStorage` é uma API global tanto em navegadores quanto — por padrão — ausente
no runtime do Bun usado para `bun test` (confirmado: `typeof window` e `typeof localStorage` são
ambos `"undefined"` em `bun -e "..."` neste projeto). Referenciar `localStorage` como identificador
global solto (em vez de via `window.`) funciona igual em navegador (onde `window` é o objeto global
e `localStorage` também é acessível sem prefixo) e simplifica o teste: basta popular
`globalThis.localStorage` com um fake, sem precisar também simular `window`. O guard
`typeof localStorage !== "undefined"` é o mesmo padrão já usado em `gameConfig.ts` para
`typeof window !== "undefined"` (specs/006-responsividade-mobile), preservando consistência de
estilo no arquivo de configuração/sistemas.

**Alternatives considered**:
- **`window.localStorage`**: exigiria também popular `globalThis.window` nos testes (Bun não define
  `window` por padrão), uma camada extra de fake sem benefício — rejeitado por complexidade
  desnecessária.
- **Injetar um storage como parâmetro (dependency injection) em vez de ler o global**: mais
  "testável" em tese, mas nenhuma outra parte do código precisa trocar a implementação de storage
  em runtime — over-engineering para o escopo desta spec (Princípio IV). Rejeitado.

## 3. Tratamento de indisponibilidade e corrupção (FR-008, FR-009)

**Decision**: toda leitura e escrita fica dentro de `try/catch`; qualquer exceção (storage
bloqueado, quota excedida, `localStorage` ausente) resulta em comportamento equivalente a "nenhum
recorde salvo", nunca em exceção propagada. Um valor lido que não seja convertível para um número
finito e não-negativo (`Number.isFinite`, `>= 0`) é tratado da mesma forma.

**Rationale**: cobre exatamente as duas garantias da US3 e das Edge Cases do `spec.md` com a menor
superfície de código possível — uma única função interna de leitura (`readStoredHighScore`)
concentra as duas checagens (exceção + formato inválido) e é reaproveitada tanto por `getHighScore`
quanto por `recordScore`, evitando duplicar a validação.

**Alternatives considered**:
- **Deixar a exceção propagar e capturá-la nas scenes**: violaria FR-008 diretamente (a spec exige
  que o jogo não trave nem exiba erro) e reintroduziria tratamento de erro duplicado em duas
  scenes. Rejeitado.

## 4. Ponto de chamada de `recordScore` (evitar registrar a mesma partida duas vezes)

**Decision**: `recordScore(snapshot.score)` é chamado uma única vez, dentro de
`GameOverScene.create()`.

**Rationale**: `GameScene` só chama `this.scene.start("GameOverScene")` uma vez por evento
`match:lost` (`GameScene.ts`, handler já existente) — logo `GameOverScene.create()` roda
exatamente uma vez por partida perdida, o mesmo ciclo de vida que hoje já sustenta a leitura de
`elapsedMs`/`score` diretamente no `create()` para exibição. Nenhum mecanismo extra de
"já registrei esta partida" é necessário.

**Alternatives considered**:
- **Chamar `recordScore` a partir do handler de `match:lost` em `MatchStateManager` ou
  `GameScene`**: funcionaria igual, mas afastaria a chamada da exibição do resultado — o mesmo
  `create()` de `GameOverScene` que já lê e mostra `score` é o lugar mais direto para também
  registrar e decidir o texto "Novo recorde!" a partir do retorno da mesma chamada. Rejeitado por
  preferência de simplicidade/coesão, não por incorreção.

## 5. Impacto de performance

**Decision**: nenhuma mitigação necessária.

**Rationale**: `localStorage.getItem`/`setItem` são chamados no máximo uma vez cada por transição
de scene (início e fim de partida) — nunca dentro de `tick()` ou de qualquer handler de clique.
Custo irrelevante frente ao orçamento de 60 FPS (Princípio V, Performance Goals do `plan.md`).

## 6. Revisão: de recorde único para ranking Top 5 (formato, posição, migração)

**Decision**: o valor salvo passa de um único número (`String(score)`) para um array JSON de até
`HIGH_SCORE_RANKING_MAX_ENTRIES` (5) números, sempre mantido ordenado da maior para a menor
pontuação (`JSON.stringify`/`JSON.parse`, mesma chave `HIGH_SCORE_STORAGE_KEY`). `recordScore`
passa a retornar `{ ranking, position }`, onde `position` é a posição 1-based da pontuação recém-
registrada dentro do ranking retornado, ou `null` se ela não entrou. Uma pontuação entra quando o
ranking tem menos de 5 entradas, ou quando é estritamente maior que a menor entrada já presente
(empate na fronteira não desloca a entrada existente, mesmo espírito de FR-004). Ao ler um valor
salvo pelo formato antigo (um número solto, ex. `"120"`), `JSON.parse` retorna um `number`, não um
array — `Array.isArray` falha e o valor é tratado como "ranking vazio" (FR-010), migrando
silenciosamente sem exigir código de migração dedicado.

**Rationale**: o pedido original da spec ("servindo de base para qualquer modo competitivo
futuro") não era satisfeito por um único valor, segundo validação direta do dono do produto após
jogar a primeira implementação — um ranking Top 5 é o menor incremento que resolve isso sem virar
um histórico ilimitado (rejeitado por Princípio IV, ver Assumptions do `spec.md`). Reaproveitar a
mesma chave de storage (em vez de uma chave nova) evita deixar uma chave órfã do formato antigo no
`localStorage` de quem já testou a versão anterior, e o fallback "não é array → vazio" já é
exatamente o mesmo mecanismo de resiliência a formato inesperado que FR-010 já exige por outros
motivos (edição manual, corrupção) — nenhuma lógica de migração dedicada precisa ser escrita ou
testada separadamente.

**Alternatives considered**:
- **Chave de storage nova para o formato de array**: exigiria decidir o que fazer com a chave antiga
  (limpar? ignorar para sempre?) — mais código para um problema que o fallback de formato inválido já
  resolve de graça. Rejeitado.
- **Guardar objetos `{ score, timestamp }` em vez de números soltos**: nenhum requisito da spec pede
  data/hora por entrada (Assumptions do `spec.md` exclui metadados por partida) — over-engineering
  para o escopo atual. Rejeitado por simplicidade (Princípio IV).
- **Posição calculada por índice sem tratamento especial de empates**: `indexOf(score)` já retorna a
  primeira ocorrência (a posição mais alta entre empatadas) naturalmente, então nenhum código extra
  é necessário para o Edge Case de empates dentro do Top 5 — comportamento correto por construção,
  não uma alternativa descartada.
