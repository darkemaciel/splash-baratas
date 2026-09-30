Barata animada com os sprites do jogo, andando ou voando, com o balanço, a agitação e a queda do jogo original.

- `modo="andando"`: 27 quadros a 15fps, balanço de ±10° a 2,2Hz. `modo="voando"`: 16 quadros a 20fps, balanço de ±6° a 6Hz.
- `agitacao` (0 a 1) é quanto ela já avançou até a comida: achata e estica até 18% a 4Hz e treme até 4px, com a frequência subindo de 6 para 14Hz.
- `rumo` (graus) orienta a barata na direção do trajeto; com `direcao="esquerda"` o sprite é espelhado para não ficar de cabeça para baixo.
- `eliminada` faz a barata cair 40px e sumir em 200ms.
- `fase` desencontra várias baratas na tela. Com movimento reduzido ela fica parada.

O consumidor posiciona a barata (o trajeto até a comida é do jogo) e passa `modo`, `tamanho` (padrão 64, ou seja `barata`), `agitacao`, `rumo`, `direcao`, `eliminada`. O acerto do clique deve usar o raio real (20px) mais `folga-clique`, nunca o desenho agitado.
