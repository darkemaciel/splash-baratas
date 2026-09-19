# Research: Dificuldade Progressiva

Nenhum `NEEDS CLARIFICATION` restou no Technical Context do `plan.md`, e a sessão de
`/speckit-clarify` não encontrou ambiguidades críticas — a forma da curva e os valores numéricos
dos pisos foram deliberadamente deixados como decisão de planejamento (`spec.md` → Assumptions).
Este documento registra essas decisões.

## 1. Forma da curva de progressão

**Decision**: interpolação linear simples entre um valor base (início da partida, `survivalMs=0`) e
um piso mínimo, alcançado exatamente em `survivalMs = DIFFICULTY_RAMP_DURATION_MS` e mantido
constante depois disso (progresso `t` sempre limitado a `[0, 1]`).

```
t = clamp(survivalMs / DIFFICULTY_RAMP_DURATION_MS, 0, 1)
valor(survivalMs) = base + (piso - base) * t
```

**Rationale**: é a curva mais simples possível que satisfaz `FR-003` (aumento gradual, sem saltos —
uma reta é a definição matemática de "sem saltos") e `FR-004` (piso fixo, atingido e nunca
ultrapassado) ao mesmo tempo. Não introduz nenhum conceito novo (sem easing, sem exponencial, sem
parâmetros de forma) — consistente com o Princípio IV (simplicidade deliberada). É trivial de
testar: o valor em `survivalMs=0` é exatamente `base`, o valor em qualquer `survivalMs >=
DIFFICULTY_RAMP_DURATION_MS` é exatamente `piso`, e a função é monotônica não-crescente em todo o
domínio.

**Alternatives considered**:
- **Decaimento exponencial em direção ao piso**: se aproximaria do piso assintoticamente, sem
  nunca atingi-lo exatamente — dificultaria testar "atingiu o piso" (FR-004, US3) com uma igualdade
  simples, exigindo margem de tolerância arbitrária nos testes. Rejeitado por simplicidade.
- **Degraus discretos (ex.: dificuldade sobe a cada 30s)**: contradiz `FR-003` diretamente — cada
  degrau seria, por definição, um salto perceptível. Rejeitado.

## 2. Valores de base, piso e duração da rampa

**Decision**:

| Constante | Valor | Papel |
|---|---|---|
| `SPAWN_INTERVAL_BASE_MS` | 2500 | Igual ao `SPAWN_INTERVAL_MS` de hoje — cadência no início de toda partida |
| `SPAWN_INTERVAL_FLOOR_MS` | 1200 | Piso — quase o dobro da cadência, mantendo folga para até 2 baratas em voo simultaneamente sem exceder o teto de uma por comida presente |
| `TRAVEL_DURATION_BASE_MS` | 3000 | Igual ao `TRAVEL_DURATION_MS` de hoje |
| `TRAVEL_DURATION_FLOOR_MS` | 2000 | Piso — ~33% mais rápido que hoje, mas ainda acima do maior limiar de bônus de reação (`REACTION_BONUS_TIERS`, 1500ms), preservando-o alcançável mesmo na dificuldade máxima |
| `DIFFICULTY_RAMP_DURATION_MS` | ~~180000 (3 minutos)~~ → **90000 (1min30s)** | Horizonte em que a dificuldade atinge o piso |

**Ajuste pós-playtest (2026-09-17)**: valor original de 180000ms (3 minutos) reduzido para 90000ms
(1min30s) — feedback direto do jogador: a progressão estava lenta demais. Dobrar a velocidade da
rampa significa simplesmente reduzir `DIFFICULTY_RAMP_DURATION_MS` pela metade (mesma interpolação
linear, mesmos base/piso — só o tempo para percorrer a distância entre eles muda). Ajuste de
constante simples, sem mudança de spec/plan (já previsto como "ajustável livremente" abaixo).
Efeito colateral identificado e corrigido: `matchStateManager.score.test.ts` (specs/004, criado
antes desta feature) tinha uma margem de eliminação (2900ms) próxima demais do novo piso de tempo
de viagem (2000ms) para ticks tardios o bastante (13500ms) — ajustada para 1600ms, ainda fora de
qualquer faixa de bônus de reação (>1500ms) mas com folga segura abaixo do piso.

**Rationale**: reaproveita os valores atuais como base (nenhuma mudança de sensação no início de
qualquer partida) e escolhe pisos que mantêm todo o balanceamento existente válido sem precisar
tocá-lo:
- `COMBO_WINDOW_MS` (3000ms) continua folgado mesmo no pior caso da dificuldade máxima: o intervalo
  mínimo entre eliminações de levas consecutivas cai para `2 × 1200 - 2000 = 400ms` (contra ~2000ms
  hoje) — ainda muito menor que a janela de combo de 3000ms, então nada precisa mudar em
  `specs/004-sistema-pontuacao` (FR-009 do spec).
- O piso de tempo de viagem (2000ms) permanece acima do maior limiar de bônus de reação (1500ms),
  então nenhuma faixa de bônus se torna inalcançável mesmo na dificuldade máxima.
- A duração da rampa em si é ortogonal a esse balanceamento (research.md §2 acima) — só determina
  a velocidade com que o piso é alcançado, não os próprios valores de piso.

**Alternatives considered**:
- **Pisos mais agressivos (ex.: `SPAWN_INTERVAL_FLOOR_MS` bem abaixo de 1000ms)**: arriscaria
  sobrepor tantas baratas simultâneas que a leitura visual da tela ficaria comprometida, e poderia
  tornar bônus de reação de faixas mais altas praticamente inalcançáveis — rejeitado por risco de
  quebrar o balanceamento de `specs/004` sem necessidade.
- **Rampa mais curta (ex.: 60s)**: tornaria a progressão perceptível rápido demais, o que o próprio
  pedido original da feature pede para evitar ("sem tornar o jogo... imprevisível cedo demais").

Estes valores são constantes simples, ajustáveis livremente em `tasks.md`/implementação sem
necessidade de nova spec, caso o balanceamento real jogado peça ajuste.

## 3. Onde vive o "tempo de sobrevivência" usado pela curva

**Decision**: `elapsedMs(match, now)`, já existente em `entities/Match.ts` desde
`specs/007-tempo-de-sobrevivencia`, chamado uma vez no início de `MatchStateManager.tick(now)` e
reaproveitado tanto para decidir a cadência de spawn quanto o tempo de viagem da barata daquele
tick.

**Rationale**: `elapsedMs` já implementa exatamente a semântica necessária — `now - startedAt`
enquanto a partida está em andamento, congelado em `endedAt - startedAt` após a derrota — e já é
testado (`match.timer.test.ts`). Reaproveitá-lo evita duplicar a mesma lógica de "tempo decorrido"
em dois lugares.

**Alternatives considered**:
- **Novo campo dedicado em `Match` (ex.: `difficultyElapsedMs`)**: duplicaria informação que
  `startedAt`/`endedAt` já capturam — rejeitado por simplicidade (Princípio IV) e por risco de os
  dois valores divergirem com o tempo.

## 4. Interação com pausa e reinício

**Decision**: nenhuma — já resolvido pelo desenho existente.

**Rationale**: `GameScene` já corrige `this.time.now` para `logicalNow()` (`specs/009-pausar-partida`)
antes de repassar para `matchStateManager.tick(...)`, e `elapsedMs` usa exatamente o `now` recebido
— então o tempo pausado já não conta para `elapsedMs`, e portanto não conta para o nível de
dificuldade, sem nenhum código novo. Da mesma forma, `start()`/`restart()` já redefinem
`match.startedAt = now`, então uma nova partida sempre recomeça em `survivalMs=0` (dificuldade
base) por construção. FR-005 e FR-006 do spec não exigem nenhuma implementação dedicada — apenas
verificação (ver `quickstart.md`).

## 5. Onde vive `travelDurationMs` de uma barata já em voo

**Decision**: nenhuma mudança — `Roach.travelDurationMs` já é um campo fixado no momento de
`createRoach(...)` (`entities/Roach.ts`), nunca recalculado depois. `positionAt`/`progress`/
`hasReachedTarget` sempre leem esse valor congelado por instância.

**Rationale**: satisfaz `FR-007` do spec por construção — uma barata spawnada num nível de
dificuldade mantém seu próprio `travelDurationMs` para sempre, independentemente de o nível de
dificuldade mudar enquanto ela ainda está em trajeto. Nenhum teste de regressão é necessário além
de confirmar que o comportamento observado bate com essa expectativa (coberto em
`matchStateManager.difficulty.test.ts`).

## 6. Impacto em testes existentes

**Decision**: `matchStateManager.constants.test.ts` precisa ser reescrito — seu propósito era
validar exatamente a garantia de `FR-016` da spec 001 ("`SPAWN_INTERVAL_MS`/`TRAVEL_DURATION_MS`
não mudam entre o primeiro e o último spawn de uma partida"), que esta feature substitui
deliberadamente (spec.md → Assumptions). O nome do arquivo e o teste em si passam a validar o novo
comportamento: valor igual ao base em `survivalMs=0`/primeiro spawn, e nunca abaixo do piso.

`matchStateManager.spawn.test.ts`, `matchStateManager.spawnVariety.test.ts` e
`matchStateManager.spawnCoherence.test.ts` (specs/010) usam a constante de intervalo só como passo
fixo para avançar `tick()` em seus próprios loops — como o valor dinâmico nunca excede o valor
base, avançar exatamente pelo valor base continua sempre disparando um spawn a cada passo
(o intervalo real necessário é sempre ≤ ao passo usado). Precisam apenas do import renomeado
(`SPAWN_INTERVAL_MS` → `SPAWN_INTERVAL_BASE_MS`), sem nenhuma mudança de lógica ou asserção.

**Rationale**: levantamento completo (`grep` por `SPAWN_INTERVAL_MS`/`TRAVEL_DURATION_MS` em
`src/`/`tests/`) confirmou que nenhum outro arquivo depende do valor exato dessas constantes além
do teste que está sendo deliberadamente substituído — o raio de impacto é mínimo e conhecido.

## 7. Impacto de performance

**Decision**: nenhuma mitigação necessária.

**Rationale**: as duas funções de curva são uma multiplicação e uma soma cada, chamadas no máximo
uma vez por `tick()` (mesmo ritmo do já existente sorteio de alvo/ponto de spawn) — custo
desprezível frente ao orçamento de 60 FPS (Princípio V, Performance Goals do `plan.md`).
