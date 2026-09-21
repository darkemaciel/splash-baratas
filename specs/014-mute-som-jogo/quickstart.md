# Quickstart: Mute e Desmute do Som do Jogo

Guia de validação ponta a ponta para esta feature, uma vez que as tarefas de implementação
(`tasks.md`) tiverem sido concluídas. Pressupõe o loop principal
(`specs/001-roach-fridge-clicker/`) e o feedback sonoro (`specs/003-feedback-sonoro-sfx/`) já
funcionando.

## Pré-requisitos

- Bun instalado (gerenciador de pacotes/runtime, constitution Princípio VII).
- Repositório na branch de implementação desta feature.
- Navegador com áudio habilitado, com volume do sistema audível, para confirmar visual e
  auditivamente os cenários 1-5; o cenário 6 exige justamente `localStorage` bloqueado.

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
ou Edge desktop. Antes do primeiro cenário, limpe o `localStorage` do site nas DevTools para partir
de um estado sem preferência salva.

## Rodar os testes de domínio

```bash
bun test      # inclui audioPreferenceStore.test.ts (novo)
```

## Cenários de validação manual (mapeados aos User Stories da spec)

1. **Áudio ativo por padrão na primeira visita (Edge Cases / FR-007 / Clarifications Q1)**
   - Com `localStorage` limpo, abrir o jogo pela primeira vez.
   - Confirmar: o controle de mute exibe o estado "som ativo", e clicar em uma barata para eliminá-la
     produz o som de acerto normalmente, sem nenhuma ação prévia do jogador.

2. **Silenciar tudo com um clique (User Story 1 / FR-001, FR-002, FR-003)**
   - Iniciar uma partida, esperar o som ambiente de voo começar a tocar (pelo menos uma barata ativa
     em cena), e acionar o controle de mute.
   - Confirmar: o som ambiente para imediatamente; eliminar baratas, errar cliques e deixar uma
     barata roubar comida não produzem nenhum som enquanto o mute estiver ativo.

3. **Reativar o áudio a qualquer momento (User Story 2 / FR-004)**
   - Com o mute ainda ativo do cenário anterior e ao menos uma barata ativa em cena, acionar
     novamente o controle.
   - Confirmar: o som ambiente de voo volta a tocar (se ainda houver barata ativa) e o próximo
     acerto/erro/roubo produz som normalmente.

4. **Controle disponível e consistente em todas as telas (Edge Cases / FR-005)**
   - Navegar pela tela inicial, iniciar uma partida, pausar (se aplicável) e chegar até a tela de
     fim de jogo, observando o controle de mute em cada uma.
   - Confirmar: o controle está visível em todas essas telas e sempre reflete o mesmo estado global
     (ex.: se foi mutado na partida, continua mutado na tela de fim de jogo).

5. **Preferência sobrevive a um reload (User Story 3 / FR-006, FR-007, SC-004)**
   - Silenciar o áudio, recarregar a página inteira do navegador (F5).
   - Confirmar: o jogo carrega já com o controle no estado "mudo", sem nenhum som tocando até o
     jogador reativar manualmente.

6. **Jogo continua funcionando sem `localStorage` (Edge Cases / FR-007, Clarifications Q2)**
   - Abrir uma janela anônima/privada configurada para bloquear armazenamento local (ou usar as
     DevTools para negar acesso a `localStorage` do site).
   - Acionar o controle de mute e desmute algumas vezes durante uma partida.
   - Confirmar: o controle continua funcionando normalmente (silencia e reativa o áudio) dentro da
     sessão atual, sem nenhum erro visível ou trava; recarregar a página volta ao padrão "som ativo"
     (preferência não persistiu, como esperado).

7. **Mute não interfere no hit-testing nem em outros sistemas (Edge Cases / FR-008, FR-009)**
   - Com o mute ativo, jogar uma partida inteira até o fim (vitória por sobrevivência ou derrota).
   - Confirmar: pontuação, progressão de dificuldade, spawn de baratas e condição de derrota se
     comportam de forma idêntica ao jogo com som ativo; nenhum atraso perceptível ao clicar em
     baratas.
   - Observar deliberadamente uma barata passando visualmente por baixo/perto da área do botão de
     mute (canto onde o controle foi posicionado) e clicar nela nesse instante.
   - Confirmar: o clique elimina a barata normalmente (hit-testing não foi "roubado" pelo botão) —
     nenhuma zona morta onde o controle intercepta um clique destinado a uma barata em trânsito.

8. **Controle permanece acessível durante a pausa (FR-005, contracts/audio-preference-store.md §
   "Ciclo de vida")**
   - Iniciar uma partida, esperar o som ambiente de voo tocar, e pausar (se a feature de pausa —
     `specs/009-pausar-partida` — estiver disponível no build atual).
   - Confirmar: o controle de mute continua visível por cima da overlay semitransparente
     "Pausado", e clicar nele silencia/reativa o áudio normalmente mesmo com a partida pausada,
     sem que o clique seja bloqueado pela overlay.
   - Retomar a partida e confirmar que o estado do mute definido durante a pausa persiste.

## Referências

- Contrato dos módulos novos: [contracts/audio-preference-store.md](./contracts/audio-preference-store.md)
- Modelo de dados: [data-model.md](./data-model.md)
- Decisões técnicas e alternativas: [research.md](./research.md)
