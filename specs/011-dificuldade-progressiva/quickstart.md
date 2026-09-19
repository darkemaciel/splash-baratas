# Quickstart: Dificuldade Progressiva

Guia de validação ponta a ponta para esta feature, uma vez que as tarefas de implementação
(`tasks.md`, ainda não gerado por este comando) tiverem sido concluídas. Pressupõe o loop principal
(`specs/001-roach-fridge-clicker/`) e o cronômetro de sobrevivência (`specs/007-tempo-de-sobrevivencia/`)
já funcionando.

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
bun test      # inclui gameConfig.difficultyCurve.test.ts, matchStateManager.difficulty.test.ts;
              # matchStateManager.constants.test.ts foi removido (sua cobertura ainda válida migrou
              # para gameConfig.difficultyCurve.test.ts)
```

## Cenários de validação manual (mapeados aos User Stories da spec)

1. **Cadência de spawn aumenta com o tempo (User Story 1 / FR-001, FR-003)**
   - Iniciar uma partida e observar o intervalo entre spawns de baratas nos primeiros 20-30
     segundos.
   - Continuar sobrevivendo (eliminando baratas para não perder) até passar de 1min30s
     (`DIFFICULTY_RAMP_DURATION_MS`, ajustado após playtest — research.md §2).
   - Confirmar: baratas passam a surgir com intervalo perceptivelmente menor do que no início,
     sem nenhum salto brusco perceptível de um instante para o outro.

2. **Tempo de reação diminui com o tempo (User Story 2 / FR-002, FR-007)**
   - Na mesma partida, comparar visualmente quanto tempo uma barata recém-surgida leva para
     alcançar seu alvo no início da partida vs. numa fase avançada (1min30s+).
   - Confirmar: o tempo de trajeto fica perceptivelmente menor na fase avançada.
   - Observar uma barata que já estava em trajeto exatamente quando a dificuldade estava
     aumentando; confirmar que ela não "acelera" no meio do próprio trajeto — sua velocidade
     permanece constante do spawn até o alvo.

3. **Piso mínimo respeitado em partidas muito longas (User Story 3 / FR-004)**
   - Sobreviver por bem mais tempo que o horizonte típico de progressão (ou usar os testes
     automatizados para simular isso).
   - Confirmar: a cadência de spawn e o tempo de reação param de diminuir a partir de um certo
     ponto e se estabilizam, em vez de continuar encolhendo indefinidamente.

4. **Reinício volta ao ritmo inicial (Edge Cases / FR-005)**
   - Sobreviver o suficiente para perceber a dificuldade aumentada, depois perder de propósito
     (deixar todas as comidas serem roubadas) e reiniciar a partir da tela de derrota.
   - Confirmar: a nova partida começa exatamente no mesmo ritmo (cadência/tempo de reação) de
     qualquer partida nova, independentemente de quão avançada a dificuldade tinha ficado antes.

5. **Pausa não avança a dificuldade (Edge Cases / FR-006)**
   - Sobreviver por um tempo, pausar a partida (`specs/009-pausar-partida`) e aguardar vários
     segundos parado na tela pausada.
   - Retomar e confirmar: o ritmo observado logo após retomar é consistente com o tempo de
     sobrevivência real decorrido (excluindo o tempo pausado) — a pausa não "acelerou" a
     dificuldade.

6. **Pontuação e combo inalterados (Edge Cases / FR-009)**
   - Eliminar baratas rapidamente tanto no início quanto numa fase avançada da mesma partida.
   - Confirmar: os mesmos limiares de bônus de reação e a mesma janela de combo de sempre
     continuam se aplicando — apenas ficam naturalmente mais difíceis de alcançar com o tempo de
     reação reduzido, sem que os próprios limiares tenham mudado.

## Referências

- Contrato da curva de dificuldade: [contracts/difficulty-curve.md](./contracts/difficulty-curve.md)
- Modelo de dados (constantes renomeadas e novas funções): [data-model.md](./data-model.md)
- Decisões técnicas e alternativas: [research.md](./research.md)
