# Data Model: Animação de Locomoção da Barata (Andar/Voar)

## Estado de apresentação: Estilo de Locomoção por Barata

Estado transiente, mantido em memória apenas por `GameScene` (não persistido, não compartilhado
entre sessões) — associa cada barata ativa a um estilo visual de locomoção.

| Campo | Tipo | Descrição |
|---|---|---|
| `roachId` | `string` | Chave — o `id` já existente de `Roach` (`entities/Roach.ts`), estável do spawn à eliminação/roubo. |
| `estilo` | `"andando" \| "voando"` | Sorteado uma única vez, no momento em que o sprite da barata é criado; nunca muda depois (FR-002, FR-003). |

**Regras**:
- Existe no máximo uma entrada por barata ativa — criada junto com o sprite dessa barata em
  `syncRoachSprites()`, removida junto com ele quando a barata deixa de estar em
  `snapshot.activeRoaches` (eliminada, roubou a comida, ou partida reiniciada).
- Sorteio uniforme (50%/50%) entre os dois estilos, independente para cada barata — sem relação com
  ponto de spawn, alvo, ou estilo de outras baratas ativas (FR-002).
- Nenhuma persistência: ao reiniciar a partida, todas as entradas são descartadas junto com os
  sprites (mesmo ciclo de vida do `roachSprites`/`roachPhase` já existentes).

**Transições de estado**:

```
[barata criada em snapshot.activeRoaches, sprite ainda não existe]
  --(syncRoachSprites cria o sprite pela 1ª vez)--> estilo sorteado (andando OU voando)
estilo sorteado --(barata sai de snapshot.activeRoaches: eliminada, roubou, ou fim de partida)--> removido
```

Não há transição de um estilo para o outro — uma vez sorteado, o valor é imutável pelo resto do
ciclo de vida da barata (FR-003).

## Mapeamento estilo → animação (revisão 2026-09-27)

| `estilo` | Animação | Quadros | FPS |
|---|---|---|---|
| `"andando"` | `roach-walk` | 27 | 15 |
| `"voando"` | `roach-fly` | 16 | 20 |

A orientação no trajeto não gera estado novo: é derivada a cada frame de `roach.spawnPoint` e da
posição do alvo, ambos fixos desde o spawn.

## Sem novas entidades de domínio

Esta feature não introduz nem altera entidades do domínio de partida (`Match`, `Roach`, `FoodItem`,
`Shelf`) nem estado gerenciado pelo `MatchStateManager` — o estilo de locomoção é puramente de
apresentação, vivendo inteiramente dentro de `GameScene` (Constitution Princípio I), no mesmo nível
que `roachSprites`/`roachPhase()` já existentes.
