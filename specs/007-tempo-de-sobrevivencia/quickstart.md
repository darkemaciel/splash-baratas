# Quickstart: Cronômetro de Tempo de Sobrevivência

Guia de validação ponta a ponta para esta feature, uma vez que as tarefas de implementação
(`tasks.md`, ainda não gerado por este comando) tiverem sido concluídas. Pressupõe o loop principal
(`specs/001-roach-fridge-clicker/`) e o sistema de pontuação (`specs/004-sistema-pontuacao/`) já
funcionando.

## Pré-requisitos

- Bun instalado (gerenciador de pacotes/runtime, constitution Princípio VII).
- Repositório na branch de implementação desta feature, a partir de `main` já com o MVP e a
  pontuação mescladas.

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
bun test      # inclui match.timer.test.ts e matchStateManager.timer.test.ts
```

## Cenários de validação manual (mapeados aos User Stories da spec)

1. **Ver o cronômetro durante a partida (User Story 1 / FR-001, FR-002, FR-003)**
   - Na tela inicial, confirmar: nenhum valor de cronômetro é exibido (FR-007).
   - Clicar em "Iniciar".
   - Confirmar: o cronômetro aparece mostrando `00:00` no exato momento em que a tela de jogo é
     exibida.
   - Observar por pelo menos 10 segundos sem interagir.
   - Confirmar: o valor exibido aumenta continuamente e de forma legível (`00:01`, `00:02`, ...),
     sem travar nem saltar valores, e sem sobrepor prateleiras, comidas ou baratas.

2. **Cronômetro para ao fim da partida (User Story 2 / FR-004, FR-005)**
   - Anotar o valor exibido no instante em que a última comida é roubada.
   - Confirmar: o cronômetro para de avançar imediatamente nesse instante (não continua contando
     durante a transição para a tela de fim de jogo).
   - Na tela de fim de jogo, confirmar: o valor exibido é exatamente o mesmo anotado, permanece
     visível e não muda enquanto a tela estiver aberta.

3. **Cronômetro reinicia em nova partida (User Story 3 / FR-006)**
   - A partir da tela de fim de jogo (com um tempo final > `00:00` visível), clicar em "Reiniciar".
   - Confirmar: o cronômetro volta a `00:00` antes de qualquer barata surgir, sem nenhum resquício
     visual do tempo da partida anterior.
   - Deixar a nova partida avançar por alguns segundos e confirmar que ela conta de forma
     independente do tempo da partida anterior.
   - Repetir esse ciclo (derrota → reiniciar) pelo menos 3 vezes seguidas para confirmar reset
     consistente em 100% das tentativas (SC-004).

4. **Formato legível em partidas longas (FR-008, Edge Case)**
   - Deixar uma partida correr por mais de um minuto (pode ser acelerado eliminando baratas
     rapidamente para não perder comidas, ou simplesmente aguardando).
   - Confirmar: o valor transiciona de `00:59` para `01:00` corretamente, sem quebrar o layout do
     HUD.
   - (Opcional, sem esperar dezenas de minutos de verdade) inspecionar `formatElapsedTime` via
     `bun test` para os limiares de minuto cobertos em `match.timer.test.ts`.

5. **Precisão do valor exibido (SC-002)**
   - Cronometrar manualmente (relógio externo) o tempo entre "Iniciar" e a derrota de uma partida.
   - Confirmar: o valor final exibido no cronômetro não diverge do tempo cronometrado manualmente em
     mais de 1 segundo.

6. **Aba perde e recupera o foco durante a partida (Edge Case da spec)**
   - Com uma partida em andamento e o cronômetro contando, trocar de aba (ou minimizar a janela) por
     alguns segundos e depois voltar.
   - Confirmar: o cronômetro reflete o tempo real decorrido de forma coerente com o resto do jogo
     (baratas/spawn) — ou seja, o mesmo comportamento de progressão de tempo já usado pelo loop
     principal, sem pausar silenciosamente nem saltar de forma inconsistente com o restante da
     partida.

## Critérios de aceite de performance

- Com o painel de performance do navegador aberto, jogar uma partida completa e confirmar que o
  cronômetro não introduz quedas perceptíveis de FPS nem atraso entre clique e remoção da barata,
  mantendo o mesmo padrão de responsividade já validado no MVP, no HUD de progresso/risco e na
  pontuação.

## Referências

- Contrato de API interna: [contracts/domain-api-timer.md](./contracts/domain-api-timer.md)
- Modelo de dados: [data-model.md](./data-model.md)
- Decisões técnicas e alternativas: [research.md](./research.md)
