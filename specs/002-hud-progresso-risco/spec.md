# Feature Specification: HUD de Progresso/Risco

**Feature Branch**: `002-hud-progresso-risco`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "HUD de progresso/risco: adicionar um contador visível de comidas restantes/roubadas (ou uma barra de risco geral) na tela de jogo, para que o jogador possa acompanhar o estado da partida sem precisar observar diretamente as prateleiras. Item do backlog.md, seção 1 "Jogabilidade e feedback sensorial", prioridade P0. Contexto atual: FR-022 do MVP (specs/001-roach-fridge-clicker/spec.md) só expõe esse estado via observação visual das prateleiras; não há HUD hoje."

## Clarifications

### Session 2026-09-12

- Q: O indicador deve mostrar um contador numérico, uma barra visual de risco, ou os dois combinados? → A: Número + barra/cor combinados — mais informativo, cobre FR-001 e FR-005 ao mesmo tempo.
- Q: Quantos níveis de risco visual o indicador deve ter, e com base em qual limiar de comidas restantes? → A: Três níveis: Seguro (>50% restante) / Risco elevado (≤50%, mais de 1 restante) / Crítico (exatamente 1 restante).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acompanhar o risco da partida sem examinar as prateleiras (Priority: P1)

Como jogador, eu quero ver, a qualquer momento durante a partida, quantas comidas ainda restam
(ou quantas já foram roubadas), para saber o quão perto estou de perder sem precisar escanear
visualmente todas as prateleiras.

**Why this priority**: É o núcleo do item do backlog e resolve diretamente a lacuna registrada em
FR-022 da spec do MVP. Sem isso não há feature.

**Independent Test**: iniciar uma partida, observar o indicador exibido antes de qualquer comida
ser roubada (deve refletir o total inicial), deixar uma barata roubar uma comida sem eliminá-la, e
confirmar que o indicador atualiza imediatamente para refletir a nova contagem.

**Acceptance Scenarios**:

1. **Given** uma partida recém-iniciada com todas as comidas presentes nas prateleiras, **When** a
   tela de jogo é exibida, **Then** o indicador mostra a contagem total de comidas restantes igual
   ao número inicial de comidas da partida.
2. **Given** uma partida em andamento, **When** uma barata rouba uma comida (o jogador não clica a
   tempo), **Then** o indicador atualiza no mesmo frame em que a comida desaparece da prateleira,
   refletindo a nova contagem de comidas restantes.
3. **Given** uma partida em andamento, **When** o jogador elimina uma barata antes que ela alcance
   seu alvo, **Then** o indicador permanece inalterado (a comida-alvo não foi afetada).

---

### User Story 2 - Perceber a proximidade da derrota (Priority: P2)

Como jogador, eu quero perceber claramente quando a partida está perto de terminar (poucas
comidas restantes), para sentir a tensão crescente da partida e reagir com mais urgência.

**Why this priority**: Reforça o "game feel" (objetivo da seção 1 do backlog) além da função
puramente informativa da User Story 1, mas não é estritamente necessário para a informação básica
já estar disponível.

**Independent Test**: reduzir o número de comidas restantes até metade do total (risco elevado) e
depois até restar apenas uma (risco crítico), confirmando que o indicador comunica visualmente
cada um desses dois estados (ex.: destaque de cor), sem depender de nenhuma outra tela.

**Acceptance Scenarios**:

1. **Given** uma partida em andamento com metade ou menos das comidas originais restantes,
   **When** o jogador observa o indicador, **Then** ele comunica visualmente um nível de risco
   elevado (diferenciado do estado inicial "seguro"), sem exigir que o jogador leia números.
2. **Given** uma partida em andamento com apenas uma comida restante, **When** o jogador observa o
   indicador, **Then** ele comunica visualmente o estado de risco crítico, distinto do risco
   elevado da User Story 2.1.

---

### User Story 3 - Ver o estado do HUD ao reiniciar a partida (Priority: P3)

Como jogador, eu quero que o indicador volte ao estado inicial assim que eu reinicio a partida
após uma derrota, para que ele continue confiável em todas as partidas jogadas na mesma sessão.

**Why this priority**: Garante consistência entre partidas, mas é um caso derivado do
comportamento de restart já existente no MVP (FR-013), não uma capacidade nova por si só.

**Independent Test**: jogar até a derrota, reiniciar a partida a partir da tela final, e confirmar
que o indicador volta a mostrar a contagem total original antes de qualquer novo spawn.

**Acceptance Scenarios**:

1. **Given** uma partida encerrada em derrota (indicador mostrando zero comidas restantes),
   **When** o jogador reinicia a partida, **Then** o indicador é redefinido para a contagem total
   original de comidas antes que qualquer nova barata surja.

---

### Edge Cases

- O que o indicador mostra no exato momento em que a última comida é roubada e a partida entra em
  estado de derrota (transição para a tela final)?
- Como o indicador se comporta se o número total de comidas da partida mudar entre partidas (ex.:
  configuração diferente de prateleiras/comidas)? Deve sempre refletir o total real daquela
  partida, nunca um valor fixo hardcoded.
- O indicador deve permanecer legível e não sobrepor prateleiras, comidas ou baratas clicáveis em
  nenhuma resolução desktop suportada.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE exibir, durante toda a partida, um indicador visível combinando um
  contador numérico de comidas restantes com uma representação visual de risco (ex.: barra e/ou
  cor), de modo que o jogador tenha tanto a contagem exata quanto uma leitura rápida do nível de
  risco.
- **FR-002**: O indicador DEVE refletir o total real de comidas da partida corrente (soma de todas
  as comidas presentes em todas as prateleiras no início da partida), não um valor fixo.
- **FR-003**: O sistema DEVE atualizar o indicador imediatamente (no mesmo ciclo de atualização em
  que o evento ocorre) sempre que uma comida for roubada.
- **FR-004**: O sistema NÃO DEVE atualizar o indicador quando uma barata for eliminada sem roubar
  comida (eliminação não afeta a contagem de comidas).
- **FR-005**: O sistema DEVE comunicar visualmente três níveis distintos de risco, além do valor
  numérico: "seguro" (mais de 50% das comidas originais ainda presentes), "risco elevado" (50% ou
  menos das comidas originais presentes, mas mais de uma restante) e "crítico" (exatamente uma
  comida restante).
- **FR-006**: O sistema DEVE redefinir o indicador para o estado inicial da nova partida sempre que
  o jogador reiniciar após uma derrota (consistente com FR-013 do MVP).
- **FR-007**: O indicador DEVE estar posicionado e dimensionado de forma a não sobrepor
  prateleiras, comidas ou baratas, preservando a área clicável de cada barata (Princípio V —
  responsividade de clique não pode ser degradada).
- **FR-008**: O sistema DEVE apresentar o indicador apenas durante a tela de jogo (não deve
  aparecer na tela inicial nem na tela final, que têm suas próprias informações de estado).

### Key Entities

- **Indicador de progresso/risco (HUD)**: elemento de interface que representa, de forma
  numérica e/ou visual, a relação entre comidas restantes e o total original de comidas da
  partida corrente. Não é uma entidade de domínio — é uma leitura derivada do estado exposto pelo
  `Match`/`MatchStateManager` já existente no MVP; não introduz novo estado mutável no domínio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste de usabilidade informal, jogadores conseguem informar corretamente quantas
  comidas restam (ou o nível de risco atual) apenas olhando o indicador, sem escanear as
  prateleiras, em pelo menos 90% das verificações.
- **SC-002**: O indicador reflete uma mudança no número de comidas restantes em até um frame de
  atraso perceptível (sem lag visível) após o evento de roubo.
- **SC-003**: A adição do indicador não introduz nenhuma queda perceptível de FPS nem atraso de
  clique nas baratas, preservando os 60 FPS estáveis exigidos pelo Princípio V da constitution.
- **SC-004**: 100% das partidas reiniciadas mostram o indicador corretamente redefinido antes do
  primeiro spawn de barata da nova partida.

## Assumptions

- O indicador é puramente informativo/visual nesta versão; não há sistema de pontuação associado
  (fora de escopo por decisão explícita do PRD/FR-019 do MVP).
- "Comidas restantes" é a métrica numérica primária mostrada, sempre acompanhada de uma
  representação visual de risco (barra e/ou cor), conforme FR-001.
- O HUD não requer persistência entre sessões (não depende de `localStorage` ou backend) — reflete
  apenas o estado da partida corrente, alinhado ao Princípio VII (sem backend no MVP).
- Os três níveis de risco definidos em FR-005 (seguro/risco elevado/crítico) são suficientes para
  esta versão; granularidade adicional (ex.: gradiente contínuo de cor) fica de fora por
  simplicidade deliberada (Princípio IV).
- O indicador é lido apenas visualmente (sem suporte a leitor de tela ou outras tecnologias
  assistivas nesta versão), consistente com o nível de acessibilidade já assumido pelo MVP.
