# Quickstart: Validação da Responsividade mobile e compatibilidade de tela

Guia manual de validação — esta feature não tem testes automatizados novos (`research.md`, Decisão
6); a suíte `bun test` existente cobre apenas o domínio, que não muda, e deve continuar passando
sem alteração.

## Pré-requisitos

- Dependências instaladas: `cd client && bun install` (se ainda não instalado).
- DevTools do navegador com emulação de dispositivo (Chrome/Edge: ícone de dispositivo móvel no
  painel de desenvolvedor; Firefox: "Responsive Design Mode").

## 1. Suíte de testes (regressão)

```bash
cd client
bun test
```

**Esperado**: todos os testes existentes continuam passando (nenhuma função de domínio é tocada por
esta feature — `research.md`), confirmando que nenhuma regra de jogo foi alterada.

## 2. Validação visual manual

```bash
cd client
bun run dev
```

Abrir a URL local exibida (ex. `http://localhost:5173`) e verificar, redimensionando a janela do
navegador ou usando a emulação de dispositivo do DevTools:

1. **Tela pequena sem cortes** (User Story 1 / SC-001, SC-002):
   - Com a janela larga (ex. 1920px), redimensionar gradualmente até ~375px de largura (perfil de
     celular comum, ex. iPhone SE/12 na emulação do DevTools).
   - **Esperado**: as três prateleiras, todas as comidas e a área de movimento das baratas
     permanecem 100% visíveis, sem corte nas bordas e sem barra de rolagem — só encolhem
     proporcionalmente.
   - Testar também uma proporção mais alta que larga (ex. emulação de tablet em retrato, 768×1024):
     o espaço excedente aparece como borda neutra escura (`#0d0d0d`) nas laterais/topo, sem esticar
     nem cortar o conteúdo do jogo.
   - Iniciar uma partida, redimensionar a janela (ou girar a orientação na emulação) no meio do
     jogo: a partida continua rodando (baratas se movendo, HUD atualizando), sem reiniciar ou travar.

2. **HUD legível em telas estreitas** (User Story 2 / SC-003):
   - Na largura mínima suportada (~320px), confirmar que o contador de comidas restantes, a barra
     de risco (canto superior direito) e a pontuação (topo central) continuam legíveis, sem texto
     cortado e sem se sobrepor entre si nem às prateleiras.
   - Deixar uma comida ser roubada e eliminar uma barata nessa mesma largura: os valores atualizam
     na mesma posição relativa, como em desktop.

3. **Compatibilidade entre navegadores** (User Story 3 / SC-006):
   - Repetir o passo 1 (redimensionar para ~375px e para uma proporção alta) em Chrome, Firefox e
     Edge. O layout e as proporções devem ser visualmente equivalentes nos três.

4. **Responsividade de clique preservada** (FR-005, FR-008, Princípio V / SC-005):
   - Em ~375px de largura, jogar normalmente clicando nas baratas: a precisão de clique deve ser
     igual à observada em desktop — nenhum atraso perceptível, nenhum clique "que deveria acertar"
     errando por causa da escala.
   - Redimensionar a janela **enquanto uma barata está em movimento** e clicar nela logo em seguida:
     o clique deve continuar acertando corretamente (edge case da spec.md sobre sincronia
     lógica/visual durante o redimensionamento).

5. **Degradação abaixo de 320px** (FR-006, edge case):
   - Encolher a janela manualmente para menos de 320px de largura.
   - **Esperado**: o canvas para de encolher (trava no tamanho mínimo) e aparece uma barra de
     rolagem horizontal do navegador para revelar o restante — o conteúdo não é cortado
     abruptamente nem sobreposto.

6. **Telas de início e fim de jogo** (FR-007):
   - Repetir a checagem de "sem cortes" (passo 1) na tela inicial (antes de clicar "Iniciar") e na
     tela de game over (após perder a partida) — mesmo comportamento de escala do campo de jogo.

7. **Zoom do navegador** (edge case):
   - Com o jogo em execução, usar Ctrl +/- para aumentar/diminuir o zoom do navegador.
   - **Esperado**: o layout se re-adapta como se o viewport tivesse mudado de tamanho, sem quebrar.

8. **Retrato extremo — sem aviso de rotação** (Clarifications, sessão 2026-09-14, edge case):
   - Emular uma proporção muito estreita e alta (ex. celular em retrato, 375×812 ou mais extremo)
     no DevTools.
   - **Esperado**: o letterbox/pillarbox é aplicado normalmente, reduzindo a área de jogo
     proporcionalmente — nenhum elemento de UI novo (aviso "gire o dispositivo" ou similar) é
     exibido.

9. **Base portrait dedicada — sem girar o celular** (revisão pós-teste manual, 2026-09-15;
   `research.md` Decisão 1b):
   - **Recarregar a página já em emulação de celular em retrato** (ex. 390×844) — importante:
     diferente do passo 1 (redimensionar uma janela já aberta), este passo verifica a escolha de
     proporção-base, que só é lida no carregamento inicial (`window.innerWidth`/`innerHeight` no
     momento em que `gameConfig.ts` é avaliado).
   - **Esperado**: o campo de jogo (prateleiras, HUD, pontuação) ocupa a maior parte da altura da
     tela (não uma faixa fina no meio) — comparar com o passo 1, onde a base landscape 960:600
     letterboxada deixava só ~28% da altura em uso.
   - Repetir para `StartScene` (antes de "Iniciar") e `GameOverScene` (após perder): título,
     mensagem de derrota, pontuação final e botões devem estar completamente visíveis, sem nenhum
     caractere cortado nas bordas (`UI_SCALE` — `research.md` Decisão 4 revisada). Este é o cenário
     que expôs o bug original: o título "Baratas na Geladeira" a 40px fixo ultrapassava os 480px de
     largura lógica da base portrait.

## Referências

- Configuração de escala (`Scale Manager`): `data-model.md`.
- Decisões técnicas (modo `FIT`, sincronia de clique, limite mínimo/scroll): `research.md`.
