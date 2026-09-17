# Research: Juice na Animação da Barata

Resolve as decisões técnicas necessárias para implementar o efeito descrito em `spec.md`, sem
deixar nenhum `NEEDS CLARIFICATION` — o escopo é pequeno e o codebase já estabelece os padrões
relevantes (posição derivada de `progress`/`positionAt`, efeitos de apresentação inline em
`GameScene`, precedente de `003-feedback-sonoro-sfx` para não criar um novo arquivo/sistema para
pouca lógica).

## 1. Onde calcular e aplicar o efeito

**Decision**: dentro de `GameScene.syncRoachSprites()` (`client/src/scenes/GameScene.ts`), logo
após calcular `position = positionAt(roach, this.time.now, targetPosition)` (já existente), somar
um deslocamento de tremor à posição antes de `sprite.setPosition(...)`, e aplicar uma escala de
squash/stretch via `sprite.setScale(scaleX, scaleY)`. Dois métodos privados novos, sem export:
`computeRoachTremorOffset(roach, now)` → `{ dx, dy }` e `computeRoachSquashStretch(roach, now)` →
`{ scaleX, scaleY }`.

**Rationale**: é o único ponto do código que já lê `progress`/`positionAt` por barata a cada frame
(FR-001/FR-002/FR-003/FR-008 da spec) — reaproveitar esse laço evita duplicar a leitura de
`this.time.now` ou do snapshot. Métodos privados sem export seguem o mesmo padrão de
`redrawHudBar`/`updateScore` já existentes na própria `GameScene`, e o precedente explícito de
`003-feedback-sonoro-sfx` (research.md §7) de não criar uma nova pasta/sistema para lógica de
apresentação pequena (Princípio IV).

**Alternatives considered**: extrair as duas funções para um novo módulo `entities/RoachJuice.ts`
para ganhar testabilidade via `bun test` — rejeitado porque colocaria uma função pura de
apresentação visual dentro de `entities/`, a pasta reservada para regras de domínio (Princípio I);
o efeito não é uma regra de jogo e não precisa ser exercitável isoladamente do Phaser para ser
verificado (mesmo critério já aplicado ao HUD e ao SFX, validados manualmente via `quickstart.md`).

## 2. Fórmula de intensidade (entrada única: `progress`)

**Decision**: usar diretamente `progress(roach, now)` (já exportado por `entities/Roach.ts`,
0 no spawn → 1 ao alcançar o alvo) como o único parâmetro de intensidade, sem nenhuma curva de
aceleração/easing adicional — a amplitude de cada efeito escala linearmente com `progress`.

**Rationale**: `progress` já é calculado e usado por `positionAt()`, então reaproveitá-lo como
entrada de intensidade não introduz nenhum cálculo de domínio novo (Princípio I) e garante,
por construção, que em `progress === 0` toda amplitude é exatamente zero (satisfaz o Edge Case
"efeito quase imperceptível no spawn" da spec sem precisar de um caso especial). Uma curva não
linear (ex.: `progress²`) foi cogitada para exagerar o final da trajetória, mas adicionaria uma
constante de tuning sem valor claro sobre o linear simples — mantido fora por Princípio IV.

**Alternatives considered**: calcular a intensidade a partir da distância restante em pixels até o
alvo, em vez de `progress` — rejeitado porque duplicaria um cálculo geométrico que `progress` já
resume de forma normalizada (0–1), independente da distância real entre spawn e alvo (que varia
por barata).

## 3. Squash/stretch

**Decision**:
- Constantes novas em `GameScene.ts`: `SQUASH_STRETCH_MAX_DELTA = 0.18` e
  `SQUASH_STRETCH_FREQUENCY_HZ = 4`.
- `wobble = Math.sin(now / 1000 * SQUASH_STRETCH_FREQUENCY_HZ * 2 * Math.PI + phase(roach.id))`
- `delta = SQUASH_STRETCH_MAX_DELTA * progress * wobble`
- `scaleX = 1 + delta`, `scaleY = 1 - delta` (inverso, para simular preservação de "volume" ao
  esticar/achatar — mesma convenção visual de squash/stretch clássica de animação 2D).

**Rationale**: frequência fixa (não escala com `progress`) mantém o "respirar" da deformação
previsível, enquanto a amplitude (`delta`) cresce linearmente com `progress` — a barata começa
visualmente "parada" (delta = 0 em `progress = 0`) e termina claramente deformada perto do alvo,
atendendo FR-001/FR-003. O valor `0.18` (±18% de escala no pico) foi escolhido por ser perceptível
sem distorcer o sprite a ponto de dificultar o reconhecimento visual da barata.

**Alternatives considered**: escalar a frequência do squash/stretch junto com `progress` (deformar
mais rápido perto do alvo, como o tremor) — rejeitado para manter os dois efeitos visualmente
distintos: squash/stretch comunica "ficando mais agitada" via amplitude, tremor comunica "ficando
mais rápida" via frequência (ver §4) — evita que os dois efeitos pareçam redundantes.

## 4. Tremor (shake)

**Decision**:
- Constantes novas: `TREMOR_MAX_OFFSET_PX = 4`, `TREMOR_BASE_FREQUENCY_HZ = 6`,
  `TREMOR_MAX_FREQUENCY_HZ = 14`.
- `frequency = TREMOR_BASE_FREQUENCY_HZ + progress * (TREMOR_MAX_FREQUENCY_HZ - TREMOR_BASE_FREQUENCY_HZ)`
- `amplitude = TREMOR_MAX_OFFSET_PX * progress`
- `dx = amplitude * Math.sin(now / 1000 * frequency * 2 * Math.PI + phase(roach.id))`
- `dy = amplitude * Math.cos(now / 1000 * frequency * 1.3 * 2 * Math.PI + phase(roach.id))`
  (multiplicador `1.3` no eixo Y evita uma órbita circular perfeita, dando uma trepidação mais
  orgânica em vez de um círculo visível).

**Rationale**: amplitude cresce com `progress` (tremor mais visível perto do alvo, FR-003) e a
frequência também cresce com `progress` (tremor mais rápido perto do alvo, conforme pedido
explícito no input do usuário — "tremor mais rápido"). `TREMOR_MAX_OFFSET_PX = 4` foi escolhido por
ficar abaixo de `HITBOX_PADDING_PX` (6px, `gameConfig.ts`) — o pior caso de divergência visual
entre sprite e posição real de clique fica dentro de uma margem já tolerada pelo padding de hitbox
existente, mantendo o comportamento do Edge Case da User Story 2 (clique "parece" dentro mas erra)
como uma exceção rara, não o caso comum.

**Alternatives considered**: usar `Math.random()` a cada frame para o deslocamento — rejeitado por
gerar um tremor visualmente "ruidoso"/tremido de forma não suave entre frames (popping), difícil de
prever e mais custoso de tornar determinístico para eventual depuração; funções seno/cosseno
parametrizadas por tempo dão uma trepidação contínua e suave, sem estado extra por frame.

## 5. Dessincronia entre baratas (FR-008)

**Decision**: `phase(roachId)` é uma função pura e determinística que soma os code points dos
caracteres de `roach.id` e normaliza para um valor em radianos (`0` a `2π`), usada como offset de
fase tanto no squash/stretch quanto no tremor.

**Rationale**: `roach.id` já é único por barata (gerado pelo domínio); derivar a fase dele garante
que cada barata tenha uma trepidação visualmente independente das demais (FR-008, Acceptance
Scenario 4 da User Story 1) sem guardar nenhum estado adicional por barata — a fase é recalculada a
cada chamada a partir do próprio `id`, então não precisa ser inicializada nem limpa em nenhum
evento de spawn/eliminação.

**Alternatives considered**: gerar a fase com `Math.random()` uma vez no momento em que o sprite é
criado e guardá-la numa estrutura paralela (ex.: `Map<string, number>`) — rejeitado por introduzir
um novo Map de estado só para isso (Princípio II: evitar estado duplicado) quando uma função pura
de `roach.id` já resolve o mesmo problema sem nenhum armazenamento extra.

## 6. Interrupção do efeito ao eliminar/roubar (FR-005)

**Decision**: nenhuma mudança em `playRoachEliminated`. O comportamento já existente —
`this.roachSprites.delete(roachId)` executado antes de iniciar o tween de queda — já garante que,
a partir do próximo frame, `syncRoachSprites()` não volta a tocar aquele sprite (ele não está mais
no `Map` nem em `activeIds`), então nenhum novo `setPosition`/`setScale` de tremor/squash é
aplicado durante a queda. O sprite mantém congelado o último `scale`/deslocamento que tinha no
instante da eliminação enquanto cai e desaparece (`alpha → 0`).

**Rationale**: satisfaz o Edge Case "a animação de eliminação assume imediatamente, sem que o
tremor vaze" sem exigir nenhum reset explícito de `scale`/posição — o congelamento do último valor
é visualmente imperceptível dado que o tween de queda já move e desvanece o sprite em 200ms.

**Alternatives considered**: resetar `sprite.setScale(1, 1)` explicitamente antes do tween de
queda — considerado desnecessário; adicionaria uma linha sem efeito perceptível (o tween já cobre o
sprite em movimento/fade rápido o bastante para que a diferença de escala não seja notada).

## 7. Testes

**Decision**: nenhuma função pura nova é adicionada a `entities/`/`systems/`, então a suíte
`bun test` existente permanece inalterada por esta feature. A validação da curva de intensidade e
do efeito visual é manual, via `bun run dev`, seguindo os cenários do `quickstart.md`.

**Rationale**: consistente com o precedente já registrado em `003-feedback-sonoro-sfx` (research.md
§7) e `007-tempo-de-sobrevivencia` — este projeto não tem harness de teste automatizado para
comportamento de `Scene`/sprites do Phaser, e o risco de regressão de um efeito puramente visual,
sem leitura de volta por nenhuma regra de jogo, é observável diretamente ao jogar.

**Alternatives considered**: extrair `computeRoachTremorOffset`/`computeRoachSquashStretch` como
funções exportadas de um módulo neutro (fora de `entities/`) só para ganhar cobertura de teste —
avaliado e rejeitado por ora: o cálculo é puramente aritmético/trigonométrico (sem branches de
regra de negócio) e o retorno sobre o investimento de uma suíte de teste dedicada é baixo frente ao
Princípio IV; pode ser revisitado se a fórmula crescer em complexidade numa iteração futura.
