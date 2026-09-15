# Quickstart: Validação do Reposicionamento e Restilização do HUD

Guia manual de validação — esta feature não tem testes automatizados novos (`research.md §5`); a
suíte `bun test` existente já cobre os valores de domínio lidos pelo HUD e deve continuar passando
sem alteração.

## Pré-requisitos

- Dependências instaladas: `cd client && bun install` (se ainda não instalado).
- Asset da fonte presente: `client/public/assets/fonts/Fredoka-Bold.woff2` (ver `research.md §3` —
  adicionado durante a implementação desta feature).

## 1. Suíte de testes (regressão)

```bash
cd client
bun test
```

**Esperado**: todos os testes existentes continuam passando (nenhum novo teste é adicionado por
esta feature — ver `research.md §5`), confirmando que nenhuma regra de domínio foi alterada.

## 2. Validação visual manual

```bash
cd client
bun run dev
```

Abrir a URL local exibida (ex. `http://localhost:5173`) e verificar:

1. **Agrupamento vida/barra no canto superior direito** (User Story 1):
   - Iniciar uma partida — o contador numérico ("X / Y") e a barra de risco aparecem juntos no
     canto superior direito, não mais centralizados no topo.
   - A barra é vertical, preenchida da base para o topo, sem sobrepor a prateleira superior nem
     nenhuma comida.
   - **SC-001**: pedir para outra pessoa (sem contexto prévio da mudança) olhar a tela e apontar
     "quanto de vida resta" — cronometrar informalmente; deve apontar corretamente o agrupamento
     do canto superior direito em menos de 2 segundos, sem procurar em outras áreas da tela.
   - Deixar uma barata roubar uma comida sem clicar nela — o contador e a barra atualizam
     imediatamente na nova posição, e a cor da barra segue o mesmo esquema de risco já validado em
     `specs/002-hud-progresso-risco/quickstart.md` (verde → amarelo → vermelho).

2. **Pontuação maior e cartunesca** (User Story 2):
   - Observar o texto de pontuação, centralizado no topo (mesma posição horizontal de antes).
   - Confirmar visualmente que está em 28px (nitidamente maior que o texto ao lado, se houver
     comparação) e usa a fonte "Fredoka" (traços arredondados, estilo cartoon) — não mais a fonte
     padrão do sistema.
   - Eliminar uma barata e confirmar que a pontuação atualiza no lugar, sem deslocar-se
     horizontalmente nem sobrepor o agrupamento do canto superior direito.

3. **Consistência de fonte** (User Story 3):
   - Comparar a fonte do contador de comidas restantes (canto superior direito) com a da
     pontuação — ambas devem usar a mesma família "Fredoka" (podendo diferir em tamanho: contador
     em 18px, pontuação em 28px).

4. **Fallback de fonte** (edge case):
   - Simular falha de carregamento da fonte (ex.: bloquear a requisição do arquivo `.woff2` nas
     DevTools → aba Network → "Block request URL") e recarregar a página.
   - Confirmar que o texto continua legível (cai para `"Comic Sans MS"` ou outra fonte da pilha de
     fallback) e o layout não quebra nem sobrepõe outros elementos.

5. **Sem regressão de responsividade de clique** (Princípio V / SC-002):
   - Jogar normalmente por algumas rodadas, clicando em baratas perto do canto superior direito e
     em outras áreas da tela — confirmar que a precisão de clique e o FPS permanecem os mesmos de
     antes da feature (sem lag perceptível).

## Referências

- Constantes de posicionamento/fonte: `data-model.md`.
- Decisões técnicas (geometria da barra, hospedagem/carregamento da fonte): `research.md`.
