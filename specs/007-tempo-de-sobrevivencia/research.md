# Research: Cronômetro de Tempo de Sobrevivência

Resolve as decisões técnicas necessárias para implementar o cronômetro descrito em `spec.md`,
incluindo o formato de exibição que a spec deliberadamente deixou para a fase de planejamento
(seção Assumptions). Nenhum NEEDS CLARIFICATION restante.

## 1. Onde armazenar o início/fim da contagem

**Decision**: adicionar dois campos ao `Match` (`entities/Match.ts`): `startedAt: number` e
`endedAt: number | null`, inicializados por `createMatch(now)`/`createEmptyMatch()`.

**Rationale**: o início e o fim da partida são regras de jogo visíveis (determinam exatamente
quando o cronômetro começa/para/congela — FR-002, FR-004, FR-005), não um detalhe interno de
agendamento. Isso os torna equivalentes a `status`/`score` (specs/004), não a um valor puramente
derivado. Seguir o mesmo padrão de campo mutável do `Match` mantém a fronteira single-source-of-
truth já estabelecida.

**Alternatives considered**: guardar esses timestamps como estado privado do `MatchStateManager`
(como já ocorre com `lastSpawnAt`, que é puramente cadência de spawn, não regra de jogo visível).
Rejeitado pelo mesmo motivo já registrado em specs/004 (decisão #1): são regras de jogo testáveis
isoladamente, não agendamento interno — pertencem à camada de domínio pura.

## 2. Assinatura de `createMatch`

**Decision**: `createMatch(now: number = Date.now()): Match` — parâmetro opcional com o mesmo
default já usado por `MatchStateManager.start(now: number = Date.now())`.

**Rationale**: os testes existentes (`match.score.test.ts`, `match.hud.test.ts`) já chamam
`createMatch()` sem argumentos; um parâmetro obrigatório quebraria a compilação desses call sites
sem nenhum ganho de comportamento (o valor default já é o que `Date.now()` produziria). Manter o
parâmetro opcional preserva 100% de compatibilidade com o código existente.

**Alternatives considered**: parâmetro obrigatório, forçando todo call site a passar `now`
explicitamente — rejeitado por exigir alterações em testes que não têm nenhuma relação com esta
feature, sem benefício correspondente.

## 3. Como expor o tempo decorrido para a camada de renderização

**Decision**: `MatchSnapshot` passa a expor os campos brutos `startedAt`/`endedAt` (cópia direta,
sem pré-calcular o tempo decorrido). Uma nova função pura, `elapsedMs({ startedAt, endedAt }, now)`,
é chamada diretamente por `GameScene`/`GameOverScene` a cada leitura, com o `now` da própria scene
(`this.time.now`).

**Rationale**: segue exatamente o precedente já estabelecido por `positionAt(roach, now, target)`
(posição interpolada de barata): valores que mudam a cada frame não são pré-calculados dentro do
snapshot (que só é atualizado por evento discreto, como `score`) — em vez disso, o snapshot expõe
os dados brutos necessários, e a scene chama a função pura de cálculo com o `now` do frame atual.
Isso evita a alternativa de mudar a assinatura de `getSnapshot()` para aceitar `now`, o que afetaria
todos os call sites existentes (`start()`, `restart()`, `tick()`, testes de orquestração) sem
necessidade — nenhum desses outros campos do snapshot precisa de um `now` para ser lido.

**Alternatives considered**: (a) `getSnapshot(now: number)` computando `elapsedMs` internamente e
expondo um campo `elapsedMs: number` já pronto — rejeitado por exigir mudar a assinatura de um
método já chamado em múltiplos pontos sem relação com esta feature, e por quebrar a simetria com
`score`, que só muda em eventos discretos, não a cada frame; (b) um método dedicado
`MatchStateManager.getElapsedMs(now)` que lê o `Match` interno diretamente — rejeitado por criar um
segundo canal de leitura de estado de partida além do snapshot, quando expor `startedAt`/`endedAt`
via snapshot já é suficiente e mais simples.

## 4. Congelamento do valor final

**Decision**: `MatchStateManager.tick(now)` define `this.match.endedAt = now` no mesmo branch que
já define `this.match.status = 'lost'` (quando `allFoodStolen(this.match)` é verdadeiro), antes de
emitir `match:lost`.

**Rationale**: usa exatamente o mesmo `now` (o argumento de `tick()`) que causou a derrota,
garantindo que o valor final seja o tempo exato do evento de perda (FR-004, SC-002), não um valor
lido depois em outro frame/scene. Uma vez que `endedAt` deixa de ser `null`, `elapsedMs()` sempre
retorna a mesma diferença (`endedAt - startedAt`), independentemente do `now` passado por chamadas
futuras (ex.: `GameOverScene.create()` chamando com `this.time.now`, que já é maior) — satisfaz
FR-005 (valor final estático) sem lógica adicional em `elapsedMs`.

**Alternatives considered**: nenhuma — é a extensão mais direta do padrão já usado por `status`.

## 5. Reinício

**Decision**: nenhuma mudança em `restart()` além do já existente — como `restart()` já delega
para `start(now)`, e `start(now)` já chama `this.match = createMatch(now)`, `startedAt` é
automaticamente redefinido para o novo `now` e `endedAt` volta a `null` (FR-006).

**Rationale**: reaproveita a mesma disciplina de "reset por recriação completa do `Match`" já usada
por `score`/`comboStreak` em specs/004, sem introduzir um caminho de reset separado.

**Alternatives considered**: nenhuma.

## 6. Formato de exibição

**Decision**: sempre `MM:SS` (dois dígitos cada, zero-padded), sem transição para um formato
diferente em partidas curtas nem rollover para horas em partidas muito longas — ex.: `00:00`,
`01:05`, `59:59`, `71:03`.

```ts
export function formatElapsedTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
```

**Rationale**: a spec deixou este formato explicitamente a critério do planejamento (Assumptions),
exigindo apenas legibilidade e consistência em partidas longas (FR-008, Edge Case "dezenas de
minutos"). `MM:SS` fixo é o formato mais simples que já cobre o caso de "dezenas de minutos" sem
nenhuma ramificação condicional de formato (ex.: alternar entre "SSs" e "MM:SS"), alinhado ao
Princípio IV. Minutos sem teto (`71:03` em vez de rollover para `1:11:03`) evita introduzir uma
terceira unidade (horas) para um MVP cujo objetivo é só progressão percebida, não precisão de
cronômetro profissional.

**Alternatives considered**: segundos corridos (`"425s"`) — rejeitado por ser menos legível em
partidas longas, o próprio motivo que a spec cita no Edge Case; formato com horas (`H:MM:SS`) —
rejeitado por over-engineering: uma partida de horas de duração é um cenário extremo não realista
para este jogo (dificuldade fixa, sem progressão), não justificando a complexidade extra.

## 7. Renderização e frequência de atualização

**Decision**: em `GameScene`, um novo `Phaser.GameObjects.Text` (`timerText`) é criado uma vez em
`create()`, posicionado no canto superior esquerdo (espelhando a vida/pontuação já ancoradas no
canto superior direito — `HUD_MARGIN_TOP`/`HUD_MARGIN_RIGHT` existentes), com a mesma fonte/tamanho
do HUD (`HUD_FONT_FAMILY`/`HUD_FONT_SIZE_PX`). Em `update()`, o valor de `elapsedMs(snapshot, now)`
é recalculado a cada frame, mas `setText()` só é chamado quando o segundo inteiro exibido muda
(`Math.floor(elapsedMs / 1000)` diferente do último valor renderizado) — throttle de redraw, não de
cálculo. Em `GameOverScene`, o valor final (já congelado) é lido e formatado uma única vez em
`create()`, como um novo texto estático ao lado da pontuação final já existente (specs/004).

**Rationale**: o cálculo (`elapsedMs`) é barato o bastante para rodar a cada frame sem risco de
performance (mesma ordem de grandeza de `positionAt`, já chamado por barata ativa a cada frame),
mas o redraw de texto (`setText`) só precisa acontecer quando o valor visível muda — no máximo uma
vez por segundo — reaproveitando a mesma disciplina de "não recalcular/redesenhar
incondicionalmente a cada frame" já documentada no HUD existente (Princípio V). O canto superior
esquerdo está livre hoje (só a prateleira ocupa essa região, com borda esquerda em `x=60` — a
constante e o layout estão documentados em `GameScene.ts`); um texto curto (`"00:00"`) ancorado
perto de `x=12` não corre risco de sobrepor a prateleira nem os elementos já ancorados à direita.

**Alternatives considered**: atualizar `setText()` a cada frame incondicionalmente — rejeitado por
gerar até ~60 atualizações de texto por segundo sem nenhuma mudança visível (o valor só muda a cada
1000ms), custo desnecessário mesmo que pequeno; atualizar por evento (como `score`) — rejeitado
porque não existe nenhum evento discreto correspondente a "um segundo se passou", exigiria criar um
temporizador (`setInterval`/`this.time.addEvent`) redundante com o `update()` já rodando a cada
frame.

## 8. Testes

**Decision**: `bun test` cobrindo:
- Funções puras (`client/tests/unit/match.timer.test.ts`): `elapsedMs` com `endedAt: null` (retorna
  `now - startedAt`) e com `endedAt` definido (retorna `endedAt - startedAt`, ignorando `now`);
  `formatElapsedTime` em `0`, `5000` (`"00:05"`), `65000` (`"01:05"`), `599000` (`"09:59"`),
  `600000` (`"10:00"`) e um valor acima de 60 minutos (`3661000` → `"61:01"`, confirmando ausência
  de rollover para horas).
- Orquestração (`client/tests/unit/matchStateManager.timer.test.ts`): `start(now)` define
  `getSnapshot().startedAt === now` e `endedAt === null`; `tick(now)` antes da derrota mantém
  `endedAt === null`; o `tick(now)` que rouba a última comida define
  `getSnapshot().endedAt === now` exatamente; `restart(now)` redefine `startedAt` para o novo `now`
  e `endedAt` para `null`, independentemente dos valores da partida anterior.
- Atualização do helper existente `matchWithRemaining` em `match.hud.test.ts` para incluir os novos
  campos obrigatórios do `Match` (`startedAt: 0, endedAt: null`), já que a interface `Match` passa a
  exigi-los.
- Renderização (HUD/tela de fim de jogo) validada manualmente via `bun run dev`, mesmo padrão de
  specs 002/003/004 (sem framework de teste visual no projeto).

**Rationale**: consistente com o test runner e a granularidade já fixados pelo MVP e por specs
002/004 — funções puras isoladas + orquestração via `MatchStateManager`, sem introduzir nova
infraestrutura de teste.

**Alternatives considered**: nenhuma — segue o padrão já estabelecido no repositório.
