# Quickstart: Teto de Baratas Simultâneas Progressivo

Guia de validação ponta a ponta para esta feature, uma vez que as tarefas de implementação
(`tasks.md`) tiverem sido concluídas. Pressupõe o loop principal
(`specs/001-roach-fridge-clicker/`) e a dificuldade progressiva de cadência/tempo de reação
(`specs/011-dificuldade-progressiva/`) já funcionando.

## Pré-requisitos

- Bun instalado (gerenciador de pacotes/runtime, constitution Princípio VII).
- Repositório na branch de implementação desta feature.

## Setup

```bash
cd client
bun install
```

## Rodar o jogo localmente

```bash
bun run dev
```

Abra o endereço local impresso pelo Vite (tipicamente `http://localhost:5173`) em Chrome, Firefox
ou Edge desktop.

## Rodar os testes de domínio

```bash
bun test      # inclui a cobertura nova de currentRoachCap (gameConfig.difficultyCurve.test.ts) e
              # a orquestração em tick() (novo arquivo dedicado ao teto); matchStateManager.spawn.test.ts
              # continua passando sem alteração (sua asserção já era um limite superior, nunca uma
              # igualdade com TOTAL_FOOD_ITEMS)
```

## Cenários de validação manual (mapeados aos User Stories da spec)

1. **Início mais calmo (User Story 1 / FR-002)**
   - **Aviso**: o efeito aqui é sutil a olho nu — a concorrência natural de baratas hoje já oscila
     majoritariamente entre 1 e 2 (research.md §3, verificado empiricamente), então
     `ROACH_CAP_BASE = 1` elimina especificamente os breves momentos de 2 baratas simultâneas nos
     primeiros segundos, não uma mudança de "muitas para poucas". Os testes automatizados (T007) são
     a forma confiável de validar isso; esta validação manual é um sanity check, não a prova
     principal.
   - Iniciar uma nova partida e, sem clicar em nenhuma barata, observar atentamente os primeiros
     ~10 segundos (a barata mais próxima de roubar aparece por volta de `SPAWN_INTERVAL_BASE_MS +
     TRAVEL_DURATION_BASE_MS` ≈ 5,5s, research.md).
   - Confirmar: nunca aparecem 2 baratas simultaneamente nessa janela (diferente de hoje, sem a
     feature, onde 2 simultâneas já podem aparecer por volta dos 5s).

2. **Teto cresce com o tempo de sobrevivência (User Story 1 / FR-003, FR-004)**
   - **Aviso**: com só 2 valores possíveis (`ROACH_CAP_BASE = 1` a `ROACH_CAP_MAX = 2`,
     research.md §3), o "crescimento" é uma única transição discreta perto do meio de
     `DIFFICULTY_RAMP_DURATION_MS`, não vários incrementos perceptíveis como a cadência de spawn —
     não espere ver uma progressão gradual visível aqui, apenas confirme que o teto de 1 eventualmente
     "libera" a segunda barata simultânea.
   - Continuar sobrevivendo (eliminando baratas para não perder) até passar de
     `DIFFICULTY_RAMP_DURATION_MS` (research.md §3 — mesma duração já usada por `specs/011`).
   - Confirmar: o número máximo de baratas simultâneas observado numa janela recente (2) é maior do
     que o observado nos primeiros segundos (1) — uma única transição perto do meio da rampa, não uma
     progressão gradual (ver aviso acima).

3. **O teto nunca pede mais baratas do que existem comidas (User Story 2 / FR-006)**
   - Numa partida avançada (teto já em `ROACH_CAP_MAX = 2`), deixar quase todas as comidas serem
     roubadas de propósito, até restar só 1 comida presente.
   - Confirmar: mesmo com o teto vigente em 2, nunca aparece mais que 1 barata simultânea enquanto
     restar apenas 1 comida — o número de comidas presentes é quem realmente limita, não o teto.

4. **Teto nunca ultrapassa o máximo (User Story 3 / FR-005)**
   - Sobreviver por bem mais tempo que `DIFFICULTY_RAMP_DURATION_MS` (ou usar os testes
     automatizados para simular isso).
   - Confirmar: o número máximo de baratas simultâneas para de crescer a partir de um certo ponto e
     se estabiliza em `ROACH_CAP_MAX`, em vez de continuar aumentando indefinidamente.

5. **Reinício volta ao teto inicial (Edge Cases / FR-010)**
   - Sobreviver o suficiente para perceber o teto crescido, perder de propósito e reiniciar a partir
     da tela de derrota.
   - Confirmar: a nova partida começa novamente com no máximo `ROACH_CAP_BASE` baratas simultâneas,
     independentemente de quão alto o teto tinha ficado antes.

6. **Pausa não avança o teto (Edge Cases / FR-009)**
   - Sobreviver por um tempo, pausar a partida (`specs/009-pausar-partida`) e aguardar vários
     segundos parado na tela pausada.
   - Retomar e confirmar: o número máximo de baratas observado logo após retomar é consistente com o
     tempo de sobrevivência real decorrido (excluindo o tempo pausado).

7. **Nenhuma UI nova (Edge Cases / FR-012)**
   - Durante toda a partida, confirmar que não aparece nenhum indicador, texto ou ícone relacionado
     ao teto de baratas simultâneas em nenhuma tela — a única forma de perceber a progressão é pelo
     número de baratas em tela.

## Referências

- Contrato do teto de baratas: [contracts/roach-cap.md](./contracts/roach-cap.md)
- Modelo de dados (constantes e função nova): [data-model.md](./data-model.md)
- Decisões técnicas e alternativas: [research.md](./research.md)
