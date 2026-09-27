# Quickstart: Animação de Locomoção da Barata (Andar/Voar)

Guia de validação ponta a ponta para esta feature, uma vez que as tarefas de implementação
(`tasks.md`) tiverem sido concluídas. Pressupõe o loop principal
(`specs/001-roach-fridge-clicker/`), o "juice" (`specs/008-juice-animacao-barata/`) e a pausa
(`specs/009-pausar-partida/`) já funcionando.

## Pré-requisitos

- Bun instalado (gerenciador de pacotes/runtime, constitution Princípio VII).
- Repositório na branch de implementação desta feature.
- Navegador desktop (Chrome, Firefox ou Edge).

## Setup

```bash
cd client
bun install
```

## Rodar o jogo localmente

```bash
bun run dev
```

Abra o endereço local impresso pelo Vite (tipicamente `http://localhost:5173`).

## Rodar os testes de domínio

```bash
bun test      # nenhum teste novo esperado — feature 100% em GameScene.ts (ver plan.md, Testing)
```

## Cenários de validação manual (mapeados aos User Stories da spec)

1. **Nenhuma barata aparece parada (User Story 1 / FR-001, SC-001)**
   - Iniciar uma partida e observar várias baratas desde o spawn até o alvo.
   - Confirmar: toda barata ativa exibe movimento perceptível (oscilação) desde o instante em que
     aparece — nenhuma fica com aparência de sprite estático em nenhum momento do trajeto.

2. **Locomoção compõe com o "juice" de urgência, sem sumir (User Story 1, cenário 2 / FR-004)**
   - Observar uma barata se aproximando do alvo, quando o squash/stretch/tremor de urgência
     (`specs/008`) fica mais intenso.
   - Confirmar: a oscilação de locomoção continua visível e reconhecível, mesmo com a deformação de
     urgência mais forte por cima — nenhum dos dois efeitos cancela ou esconde o outro.

3. **Locomoção para ao eliminar (User Story 1, cenário 3 / FR-006)**
   - Clicar numa barata para eliminá-la.
   - Confirmar: a partir do clique, a barata assume o efeito de queda já existente (FR-020 do MVP),
     sem nenhum resquício da oscilação de locomoção durante a queda.

4. **Locomoção para ao roubar a comida (User Story 1, cenário 4 / FR-006)**
   - Deixar uma barata alcançar o alvo sem clicar nela, roubando a comida.
   - Confirmar: a barata some da cena nesse instante, sem nenhuma oscilação de locomoção residual
     visível antes de desaparecer.

5. **Dois estilos coexistindo (User Story 2 / FR-002, SC-002)**
   - Deixar várias baratas ativas ao mesmo tempo (aguardar a dificuldade progressiva aumentar o
     número simultâneo, se necessário).
   - Confirmar: é possível identificar visualmente pelo menos duas baratas com estilos de
     movimento diferentes entre si na mesma cena (uma com oscilação mais lenta/acentuada, outra
     mais rápida/sutil).

6. **Estilo não muda no meio do trajeto (User Story 2, cenário 2 / FR-003)**
   - Escolher uma barata específica e observá-la do spawn até o fim do trajeto (eliminação, roubo,
     ou chegada ao alvo).
   - Confirmar: o estilo de movimento dela permanece o mesmo do início ao fim — nunca troca de
     "andando" para "voando" (ou vice-versa) no meio do caminho.

7. **Locomoção congela durante a pausa (Edge Cases / FR-007)**
   - Iniciar uma partida com baratas ativas e pausar (`specs/009-pausar-partida`).
   - Confirmar: a oscilação de locomoção para de avançar (congela no ângulo atual) enquanto pausado,
     e retoma de onde parou ao despausar — sem pular nem acelerar para compensar o tempo pausado.

8. **Locomoção não atrasa o hit-testing (FR-005, SC-003, Princípio V)**
   - Jogar uma partida inteira até o fim, clicando em baratas normalmente.
   - Confirmar: o tempo entre o clique e a eliminação da barata (ou ausência de efeito, em clique
     vazio) permanece igual ao comportamento sem esta feature — nenhum atraso perceptível.

9. **Arte real de andar/voar, orientada e no tamanho certo (FR-008 a FR-010, revisão 2026-09-27)**
   - Observar várias baratas vindo de lados diferentes.
   - Confirmar: nenhuma aparece como bolinha; cada uma mostra pernas (andando) ou asas (voando) se
     mexendo, com a cabeça apontando para a comida-alvo; baratas indo para a esquerda aparecem
     espelhadas (nunca de cabeça para baixo); o corpo tem aproximadamente o tamanho da antiga
     bolinha; duas baratas do mesmo estilo não mexem as pernas/asas em sincronia.

## Referências

- Contrato dos módulos novos: [contracts/roach-locomotion.md](./contracts/roach-locomotion.md)
- Modelo de dados: [data-model.md](./data-model.md)
- Decisões técnicas e alternativas: [research.md](./research.md)
