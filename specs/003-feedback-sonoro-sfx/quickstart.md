# Quickstart: Feedback Sonoro (SFX)

Guia de validação ponta a ponta para esta feature, uma vez que as tarefas de implementação
(`tasks.md`, ainda não gerado por este comando) tiverem sido concluídas. Pressupõe o loop principal
(`specs/001-roach-fridge-clicker/`) e o HUD (`specs/002-hud-progresso-risco/`) já funcionando.

## Pré-requisitos

- Bun instalado (gerenciador de pacotes/runtime, constitution Princípio VII).
- Áudio do dispositivo/navegador ativo e no volume audível — toda a validação desta feature depende
  de ouvir os sons, não apenas observar a tela.
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
ou Edge desktop, com o som do dispositivo ligado.

## Rodar os testes de domínio

```bash
bun test      # suíte inalterada por esta feature — nenhuma função pura nova foi adicionada
```

## Cenários de validação manual (mapeados aos User Stories da spec)

1. **Som de acerto (User Story 1 / FR-001, FR-003, FR-009)**
   - Iniciar uma partida, esperar uma barata aparecer e clicar nela dentro do hitbox.
   - Confirmar: o som de acerto toca no mesmo instante em que a barata some da tela (tween de
     queda), sem atraso perceptível.
   - Eliminar duas baratas em cliques rápidos e consecutivos.
   - Confirmar: o som de acerto toca duas vezes, sobrepostas se necessário, sem cortar o primeiro
     som antes de terminar.

2. **Som de erro (User Story 2 / FR-002, FR-003)**
   - Clicar em um ponto da tela onde não há nenhuma barata sob o ponteiro.
   - Confirmar: o som de erro toca, e o som de acerto **não** toca nesse clique.
   - Clicar exatamente sobre uma barata ativa.
   - Confirmar: apenas o som de acerto toca — nunca os dois sons no mesmo clique.

3. **Som ambiente de voo (User Story 3 / FR-005, FR-006, FR-007)**
   - Iniciar uma partida e observar o momento em que a primeira barata surge.
   - Confirmar: o som ambiente de voo começa a tocar em loop nesse momento (não antes).
   - Eliminar ou deixar roubar todas as baratas ativas até a cena ficar momentaneamente sem
     nenhuma.
   - Confirmar: o som ambiente para assim que a última barata sai de cena.
   - Deixar uma nova barata surgir.
   - Confirmar: o som ambiente volta a tocar, uma única instância (nunca dois loops sobrepostos,
     mesmo com múltiplas baratas ativas ao mesmo tempo).
   - Jogar até a derrota (todas as comidas roubadas) com pelo menos uma barata ainda ativa em cena
     no momento da derrota.
   - Confirmar: o som ambiente para imediatamente na transição para a tela de game over.

4. **Som de roubo (User Story 4 / FR-004, FR-009)**
   - Deixar deliberadamente uma barata alcançar sua comida-alvo sem clicar nela.
   - Confirmar: o som de roubo toca no mesmo instante em que a comida some da prateleira.
   - Provocar dois roubos em rápida sucessão (deixar duas baratas alcançarem seus alvos quase ao
     mesmo tempo).
   - Confirmar: o som de roubo toca duas vezes, sem cortar a primeira reprodução.

5. **Reinício não deixa resíduo de áudio (Edge Case / FR-006)**
   - Jogar até a derrota e reiniciar a partir da tela de game over pelo menos 3 vezes seguidas.
   - Confirmar, em cada reinício: nenhum som ambiente residual da partida anterior está tocando
     antes de uma nova barata surgir.

6. **`walk.mp3` permanece sem uso (Edge Case / FR-011)**
   - Abrir o painel de rede do navegador (DevTools) durante uma partida completa.
   - Confirmar: `walk.mp3` nunca é requisitado/carregado pelo jogo nesta feature.

## Critérios de aceite de performance (SC-002, Princípio V)

- Com o painel de performance do navegador aberto, jogar uma partida completa e confirmar que a
  adição dos sons não introduz quedas perceptíveis de FPS nem atraso entre clique e
  remoção/eliminação da barata, mantendo o mesmo padrão de responsividade já validado no MVP e no
  HUD.

## Referências

- Contrato de gatilhos de áudio: [contracts/audio-triggers.md](./contracts/audio-triggers.md)
- Modelo de dados: [data-model.md](./data-model.md)
- Decisões técnicas e alternativas: [research.md](./research.md)
