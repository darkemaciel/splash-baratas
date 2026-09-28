Área de jogo em que o cursor vira a pata do gato: ela segue o ponteiro, inclina com o movimento e dá um tapa a cada clique.

- A pata tem `cursor-pata` (56px) de altura e fica centrada no ponteiro.
- Parada, fica reta; em movimento, inclina até 15° na direção do deslocamento, suavizando 25% por quadro.
- No clique, gira -25° e cresce 25% em 75ms e volta em mais 75ms (Quad ease-out). O golpe reinicia a cada clique, acerte ou erre.
- O cursor do sistema some só dentro da área, e a pata some quando o ponteiro sai.

O consumidor fornece o conteúdo da área (`children`), o tamanho dela (`className`/`style`) e `onGolpe({x, y})`, que recebe a posição real do ponteiro para testar o acerto. A pata nunca entra no teste de clique.
