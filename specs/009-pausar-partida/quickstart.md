# Quickstart: Pausar Partida

Guia de validação ponta a ponta para esta feature, uma vez que as tarefas de implementação
(`tasks.md`, ainda não gerado por este comando) tiverem sido concluídas. Pressupõe o loop principal
(`specs/001-roach-fridge-clicker/`) e o juice da barata (`specs/008-juice-animacao-barata/`) já
funcionando.

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
bun test      # suíte inalterada por esta feature — nenhuma função pura nova foi adicionada a entities/ ou systems/
```

## Cenários de validação manual (mapeados aos User Stories da spec)

1. **Pausar e retomar sem perder progresso (User Story 1 / FR-001 a FR-010)**
   - Iniciar uma partida, deixar algumas baratas serem eliminadas e/ou roubarem comida, até haver
     vida, pontuação e tempo de sobrevivência visíveis.
   - Clicar no botão de pausa (repetir o cenário também usando a tecla "P" no lugar do clique —
     FR-014 — para confirmar que ambos os gatilhos levam ao mesmo resultado).
   - Confirmar: nenhuma barata se move, nenhuma nova barata surge, o cronômetro para, e a tela
     permanece congelada (incluindo qualquer tween de queda/roubo ou tremor de barata que estivesse
     em andamento no instante do clique).
   - Aguardar alguns segundos parado na tela pausada.
   - Clicar em "Continuar".
   - Confirmar: vida, comidas restantes, pontuação e tempo de sobrevivência são exatamente os
     mesmos de antes da pausa (o tempo parado não foi somado ao cronômetro), e cada barata retoma
     seu trajeto exatamente do ponto/frame em que estava.
   - Pausar e retomar várias vezes em sequência rápida; confirmar que o estado permanece consistente
     a cada alternância.

2. **Cliques não têm efeito enquanto pausado (User Story 2 / FR-007, FR-008)**
   - Pausar a partida com pelo menos uma barata visível na tela.
   - Clicar repetidamente sobre a barata congelada e sobre pontos vazios da tela.
   - Confirmar: nenhuma barata é eliminada, nenhum som de acerto/erro toca, e ao retomar a
     pontuação/combo estão exatamente iguais a antes da pausa (nenhum clique perdido foi
     contabilizado).

3. **Indicação visual de pausado (User Story 3 / FR-012)**
   - Pausar a partida e, sem clicar em mais nada, observar a tela.
   - Confirmar: um indicador "Pausado" aparece imediatamente, de forma inequívoca.
   - Clicar em "Continuar".
   - Confirmar: o indicador desaparece imediatamente e o jogo volta a se mover.

4. **Controle de pausa indisponível fora de uma partida em andamento (Edge Cases / FR-011)**
   - Na tela inicial (antes de iniciar a partida) e na tela de derrota (depois de perder),
     confirmar que não há nenhum controle de pausa disponível.

5. **Som ambiente para e retoma junto com a pausa (Edge Cases)**
   - Com pelo menos uma barata ativa (loop de voo tocando), pausar a partida.
   - Confirmar: o som de voo para imediatamente.
   - Retomar.
   - Confirmar: o som de voo volta a tocar (se ainda houver barata ativa).

6. **O clique que dispara a pausa não conta como erro (User Story 2 / FR-008)**
   - Eliminar 2+ baratas em sequência rápida (dentro da janela de combo) até o bônus de combo
     começar a aparecer na pontuação.
   - No meio da sequência de combo, clicar no botão de pausa.
   - Aguardar alguns segundos e clicar em "Continuar".
   - Eliminar mais uma barata rapidamente.
   - Confirmar: o bônus de combo continua a sequência normalmente (como se o clique de pausa nunca
     tivesse acontecido) — nenhum som de erro tocou ao clicar em pausa, e o combo não foi reiniciado
     só por causa desse clique.

7. **Pausar exatamente no limite de uma chegada, e pausas sem duração perceptível (Edge Cases)**
   - Observar uma barata perto de alcançar seu alvo (final do trajeto) e clicar no botão de pausa no
     instante mais próximo possível da chegada.
   - Confirmar: a comida-alvo permanece presente (não foi roubada) e a barata continua ativa,
     visivelmente parada a um passo do alvo — nem o roubo nem a remoção da barata acontecem enquanto
     pausado, mesmo que o clique tenha ocorrido bem no limite.
   - Retomar e confirmar que a barata só rouba a comida quando efetivamente alcança o alvo após o
     tempo de viagem restante ser consumido, nunca antes.
   - Em outra rodada, clicar em pausa e imediatamente em "Continuar" (sem esperar nenhum tempo
     perceptível).
   - Confirmar: nenhum efeito colateral observável — vida, comidas restantes, pontuação e posição de
     cada barata permanecem idênticos a antes desse ciclo pausar/retomar instantâneo.

## Referências

- Contrato do ciclo de vida da pausa: [contracts/pause-lifecycle.md](./contracts/pause-lifecycle.md)
- Modelo de dados (estado derivado do Scene Manager): [data-model.md](./data-model.md)
- Decisões técnicas e alternativas: [research.md](./research.md)
