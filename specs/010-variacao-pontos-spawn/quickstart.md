# Quickstart: Variação nos Pontos de Spawn

Guia de validação ponta a ponta para esta feature, uma vez que as tarefas de implementação
(`tasks.md`, ainda não gerado por este comando) tiverem sido concluídas. Pressupõe o loop principal
(`specs/001-roach-fridge-clicker/`) já funcionando.

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
bun test      # inclui os novos testes de gameConfig.spawnRegions e matchStateManager.spawnVariety
```

## Cenários de validação manual (mapeados aos User Stories da spec)

1. **Entradas menos previsíveis ao longo de uma partida (User Story 1 / FR-001, FR-004)**
   - Iniciar uma partida e observar pelo menos 10-15 spawns de baratas ao longo do tempo (2+
     minutos, ou reiniciando a partida algumas vezes para acelerar a observação).
   - Confirmar: as baratas não entram sempre pelos mesmos 4 pontos exatos de hoje (centro do topo,
     da base, da esquerda e da direita) — aparecem variações de posição ao longo de cada borda.
   - Confirmar: todo ponto de entrada observado continua claramente fora da área das prateleiras
     (nenhuma barata "nasce" sobre uma prateleira ou comida).

2. **Trajeto continua coerente com o alvo (User Story 2 / FR-002, FR-003)**
   - Observar, para comidas em posições diferentes do grid (esquerda/centro/direita, topo/meio/base),
     de qual lado da tela as baratas direcionadas a cada uma surgem.
   - Confirmar: uma barata cujo alvo está na coluna mais à esquerda nunca surge vindo da borda
     direita (e vice-versa); o lado de entrada permanece coerente com o lado do alvo, como já
     acontecia antes desta feature.

3. **Sem repetição consecutiva óbvia (User Story 3 / FR-005)**
   - Observar duas ou mais baratas seguidas direcionadas à mesma comida (acontece quando a barata
     anterior daquele alvo já foi eliminada/roubou a comida e outra é sorteada de novo para o mesmo
     slot antes que outro alvo apareça — mais fácil de notar reiniciando a partida algumas vezes e
     prestando atenção em um alvo específico).
   - Confirmar: os pontos de entrada consecutivos para o mesmo alvo não são visualmente idênticos
     (pixel exato), quando a região daquele alvo tiver mais de um candidato.

4. **Nenhuma degradação de desempenho (SC-003)**
   - Com o jogo rodando (DevTools → Performance/FPS meter do navegador, ou apenas observação visual),
     confirmar que a movimentação das baratas e a resposta ao clique continuam tão fluidas quanto
     antes desta mudança — nenhum engasgo perceptível no momento exato de um novo spawn.

## Referências

- Contrato de seleção de ponto de spawn: [contracts/spawn-point-selection.md](./contracts/spawn-point-selection.md)
- Modelo de dados (novas funções/constantes de configuração): [data-model.md](./data-model.md)
- Decisões técnicas e alternativas: [research.md](./research.md)
