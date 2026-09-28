Painel `cor-creme` com borda de 3px, `raio-painel` e `sombra-painel`, que agrupa menus e ajustes sobre o jogo.

- Título em Luckiest 44, girado de -2° a -3°.
- Respiro interno de 22 a 36px e de 8 a 16px entre os itens.
- Com `onFechar`, mostra o botão Fechar sobreposto ao canto superior direito, 16px para fora.
- Sobre o jogo, coloque-o numa camada `.gs-sobreposicao` (`sobreposicao`, 55%).
- Linhas de ajuste usam `.gs-linha-ajuste`, separadas por tracejado de 2px.

Props: `titulo`, `largura` (380 na pausa, 560 nas opções), `tipo` ("dialogo"), `rotacaoTitulo`, `onFechar`, `children`.
