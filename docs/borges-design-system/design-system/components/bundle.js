/* @ds-bundle: {"format":4,"namespace":"GrotescoSurreal","components":[{"name":"Botao"},{"name":"BotaoIcone"},{"name":"Icone"},{"name":"HudPontos"},{"name":"HudVidas"},{"name":"HudTempo"},{"name":"BarraEnergia"},{"name":"SeloCombo"},{"name":"Nivel"},{"name":"Alternar"},{"name":"Seletor"},{"name":"Painel"},{"name":"Dialogo"},{"name":"BalaoDica"},{"name":"TituloContorno"},{"name":"PontuacaoFlutuante"},{"name":"CartaoResultado"},{"name":"Personagem"},{"name":"Barata"},{"name":"PataCursor"}]} */
(function () {
  "use strict";
  var React = window.React;
  var h = React.createElement;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(" ");
  }
  function milhar(n) {
    var s = String(Math.round(Number(n) || 0));
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function mss(seg) {
    seg = Math.max(0, Math.floor(Number(seg) || 0));
    var m = Math.floor(seg / 60), s = seg % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function estadoClasse(estado) {
    return estado === "hover" ? "gs-is-hover" : estado === "pressionado" ? "gs-is-pressionado" : null;
  }

  var TRACO = "#1B1B1B";
  var ICONES = {
    pausar: ["M12 7 L12 25 M20 7 L20 25"],
    jogar: ["M11 7 L25 16 L11 25 Z"],
    recomecar: ["M25 16 A9 9 0 1 1 16 7", "M12.5 3.5 L16.5 7 L12.5 10.5"],
    menu: ["M5 15 L16 6 L27 15", "M8 13 L8 26 L24 26 L24 13", "M13.5 26 L13.5 19 L18.5 19 L18.5 26"],
    opcoes: ["c:16:16:7", "c:16:16:2", "M16 5.5 L16 9 M16 23 L16 26.5 M5.5 16 L9 16 M23 16 L26.5 16 M8.6 8.6 L11 11 M21 21 L23.4 23.4 M8.6 23.4 L11 21 M21 11 L23.4 8.6"],
    musica: ["M12 23 L12 8 L25 5.5 L25 20.5", "c:9:23:3", "c:22:20.5:3"],
    som: ["M5 12 L10 12 L16 7 L16 25 L10 20 L5 20 Z", "M21 12 C23 14 23 18 21 20 M24.5 9 C28.5 13 28.5 19 24.5 23"],
    fechar: ["M9 9 L23 23 M23 9 L9 23"],
    estrela: ["M16 4 L19.3 12 L27.9 12.6 L21.3 18.2 L23.3 26.6 L16 22.1 L8.7 26.6 L10.7 18.2 L4.1 12.6 L12.7 12 Z"],
    tempo: ["c:16:16:11", "M16 9.5 L16 16 L20.5 19"],
    "seta-anterior": ["M20 7 L11 16 L20 25"],
    "seta-proxima": ["M12 7 L21 16 L12 25"]
  };
  var ESTRELA = "M16 4 L19.3 12 L27.9 12.6 L21.3 18.2 L23.3 26.6 L16 22.1 L8.7 26.6 L10.7 18.2 L4.1 12.6 L12.7 12 Z";
  var CORACAO = "M12 20 C4 14 1 10 2 6 C3 2 9 1 12 6 C15 1 21 2 22 6 C23 10 20 14 12 20 Z";

  function Icone(props) {
    var nome = props.nome || "pausar";
    var partes = ICONES[nome] || [];
    var seta = nome.indexOf("seta") === 0;
    var tam = props.tamanho || 26;
    return h("svg", {
      className: "gs-icone", width: tam, height: tam, viewBox: "0 0 32 32", fill: "none",
      stroke: props.cor || "currentColor", strokeWidth: props.espessura || (seta ? 4 : 3),
      strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true"
    }, partes.map(function (p, i) {
      if (p.indexOf("c:") === 0) {
        var c = p.split(":");
        return h("circle", { key: i, cx: c[1], cy: c[2], r: c[3] });
      }
      return h("path", { key: i, d: p });
    }));
  }

  function Botao(props) {
    var variante = props.variante || "primario";
    var tamanho = (props.tamanho || "M").toLowerCase();
    var bolha = props.bolha || (variante === "secundario" ? "b" : "a");
    var estilo = Object.assign({}, props.style || {});
    if (props.rotacao) estilo["--gs-base"] = props.rotacao + "deg";
    var desabilitado = props.disabled || props.estado === "desabilitado";
    return h(props.href ? "a" : "button", {
      type: props.href ? undefined : (props.type || "button"),
      href: props.href,
      className: cx("gs-botao", "gs-botao--" + variante, "gs-botao--" + tamanho, "gs-bolha-" + bolha,
        props.pilha && "gs-botao--pilha", estadoClasse(props.estado), desabilitado && props.href && "gs-is-desabilitado", props.className),
      disabled: props.href ? undefined : desabilitado,
      "aria-disabled": props.href && desabilitado ? "true" : undefined,
      onClick: desabilitado ? undefined : props.onClick,
      style: estilo
    }, props.children);
  }

  function BotaoIcone(props) {
    var desabilitado = props.disabled || props.estado === "desabilitado";
    return h("button", {
      type: "button",
      className: cx("gs-botao-icone", estadoClasse(props.estado), props.ativo && "gs-is-ativo", props.className),
      "aria-label": props.rotulo,
      "aria-pressed": props.ativo === undefined ? undefined : String(!!props.ativo),
      disabled: desabilitado,
      onClick: props.onClick,
      style: props.style
    }, h(Icone, { nome: props.icone || "pausar", tamanho: 26, espessura: 3.5 }));
  }

  function HudPontos(props) {
    return h("div", { className: "gs-pilula gs-hud-texto gs-hud-pontos", role: "status" },
      (props.rotulo || "PONTOS") + " " + milhar(props.pontos));
  }

  function Coracao(props) {
    return h("svg", { width: 24, height: 22, viewBox: "0 0 24 22", "aria-hidden": "true" },
      h("path", { d: CORACAO, style: { fill: props.cheio ? "var(--cor-magenta)" : "var(--cor-branco)" }, stroke: TRACO, strokeWidth: 2 }));
  }
  function HudVidas(props) {
    var total = props.total || 3, vidas = Math.max(0, Math.min(total, props.vidas == null ? total : props.vidas));
    var itens = [];
    for (var i = 0; i < total; i++) itens.push(h(Coracao, { key: i, cheio: i < vidas }));
    return h("div", { className: "gs-pilula gs-hud-vidas", role: "img", "aria-label": vidas + " de " + total + " vidas" }, itens);
  }

  function HudTempo(props) {
    return h("div", { className: "gs-pilula gs-hud-texto gs-hud-tempo", role: "timer" },
      h(Icone, { nome: "tempo", tamanho: 22, espessura: 3.2 }), h("span", null, mss(props.segundos)));
  }

  function BarraEnergia(props) {
    var v = Math.max(0, Math.min(100, props.valor == null ? 70 : props.valor));
    var rotulo = (props.rotulo || "Energia") + " " + Math.round(v) + "%";
    return h("div", { className: "gs-energia" },
      h("span", { className: "gs-energia__rotulo", "aria-hidden": "true" }, rotulo),
      h("div", { className: "gs-energia__trilho", role: "meter", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": v, "aria-label": rotulo },
        h("div", { className: "gs-energia__preenchimento", style: { width: v + "%" } })));
  }

  function SeloCombo(props) {
    return h("div", { className: "gs-selo", role: "img", "aria-label": "Combo x" + (props.multiplicador || 3) },
      h("svg", { width: 84, height: 84, viewBox: "0 0 96 96", "aria-hidden": "true" },
        h("polygon", {
          points: "92,48 79.9,56.5 86.1,70 71.3,71.3 70,86.1 56.5,79.9 48,92 39.5,79.9 26,86.1 24.7,71.3 9.9,70 16.1,56.5 4,48 16.1,39.5 9.9,26 24.7,24.7 26,9.9 39.5,16.1 48,4 56.5,16.1 70,9.9 71.3,24.7 86.1,26 79.9,39.5",
          style: { fill: "var(--cor-limao)" }, stroke: TRACO, strokeWidth: 3.4, strokeLinejoin: "round"
        })),
      h("span", { className: "gs-selo__texto", "aria-hidden": "true" }, "x" + (props.multiplicador || 3) + "!"));
  }

  function useControlado(valorProp, inicial) {
    var st = React.useState(inicial);
    var controlado = valorProp !== undefined;
    return [controlado ? valorProp : st[0], function (v) { if (!controlado) st[1](v); }];
  }

  function Nivel(props) {
    var total = props.total || 5;
    var par = useControlado(props.valor, props.valorInicial == null ? 3 : props.valorInicial);
    var valor = par[0];
    var bolhas = [];
    for (var i = 1; i <= total; i++) {
      (function (n) {
        bolhas.push(h("button", {
          key: n, type: "button",
          className: cx("gs-nivel__bolha", n <= valor && "gs-is-cheia"),
          "aria-label": (props.rotulo ? props.rotulo + ": " : "") + "nível " + n,
          "aria-pressed": String(n === valor),
          onClick: function () { par[1](n); if (props.onChange) props.onChange(n); }
        }));
      })(i);
    }
    return h("div", { className: "gs-nivel", role: "group", "aria-label": props.rotulo || "Nível" }, bolhas);
  }

  function Alternar(props) {
    var par = useControlado(props.ligado, !!props.ligadoInicial);
    var ligado = !!par[0];
    return h("button", {
      type: "button", className: "gs-alternar", "aria-label": props.rotulo, "aria-pressed": String(ligado),
      onClick: function () { par[1](!ligado); if (props.onChange) props.onChange(!ligado); }
    },
      h("span", { className: "gs-alternar__texto" }, ligado ? (props.textoSim || "SIM") : (props.textoNao || "NÃO")),
      h("span", { className: "gs-alternar__bola", "aria-hidden": "true" }));
  }

  function Seletor(props) {
    var opcoes = props.opcoes || ["PORTUGUÊS", "ENGLISH", "ESPAÑOL"];
    var par = useControlado(props.indice, props.indiceInicial || 0);
    var i = par[0], n = opcoes.length;
    function ir(d) { var novo = (i + d + n) % n; par[1](novo); if (props.onChange) props.onChange(novo, opcoes[novo]); }
    return h("div", { className: "gs-seletor", role: "group", "aria-label": props.rotulo || "Seletor" },
      h("button", { type: "button", className: "gs-seletor__seta", "aria-label": "Anterior", onClick: function () { ir(-1); } },
        h(Icone, { nome: "seta-anterior", tamanho: 18 })),
      h("span", { className: "gs-seletor__valor", "aria-live": "polite" }, opcoes[i]),
      h("button", { type: "button", className: "gs-seletor__seta", "aria-label": "Próximo", onClick: function () { ir(1); } },
        h(Icone, { nome: "seta-proxima", tamanho: 18 })));
  }

  function Painel(props) {
    var dialogo = props.tipo === "dialogo";
    var estilo = Object.assign({}, props.largura ? { width: props.largura } : {}, props.style || {});
    return h("section", {
      className: cx("gs-painel", dialogo && "gs-painel--dialogo", props.className),
      role: dialogo ? "dialog" : undefined, "aria-label": props.titulo, style: estilo
    },
      props.titulo ? h(dialogo ? "h3" : "h2", { className: "gs-painel__titulo", style: props.rotacaoTitulo != null ? { transform: "rotate(" + props.rotacaoTitulo + "deg)" } : undefined }, props.titulo) : null,
      props.onFechar ? h(BotaoIcone, { icone: "fechar", rotulo: "Fechar", onClick: props.onFechar, className: "gs-painel__fechar" }) : null,
      props.children);
  }

  function Dialogo(props) {
    return h(Painel, { tipo: "dialogo", titulo: props.titulo, largura: props.largura || 400 },
      props.texto ? h("p", { className: "gs-painel__texto" }, props.texto) : null,
      h("div", { className: "gs-painel__acoes" },
        h(Botao, { variante: "terciario", tamanho: "P", bolha: "b", onClick: props.onCancelar }, props.cancelar || "CONTINUAR"),
        h(Botao, { variante: "primario", tamanho: "P", bolha: "a", onClick: props.onConfirmar }, props.confirmar || "ENCERRAR")));
  }

  function BalaoDica(props) {
    return h("div", { className: "gs-balao", role: "note" },
      h("span", { className: "gs-balao__prefixo" }, props.prefixo || "DICA:"), " ", props.children,
      h("svg", { className: "gs-balao__rabicho", width: 36, height: 26, viewBox: "0 0 36 26", "aria-hidden": "true" },
        h("path", { d: "M2 2 L9 24 L26 2", style: { fill: "var(--cor-branco)" }, stroke: TRACO, strokeWidth: 3, strokeLinejoin: "round", strokeLinecap: "round" })));
  }

  function TituloContorno(props) {
    var estilo = Object.assign({}, props.tamanho ? { fontSize: props.tamanho } : {}, { transform: "rotate(" + (props.rotacao == null ? -3 : props.rotacao) + "deg)" }, props.style || {});
    return h(props.como || "h1", { className: "gs-titulo-contorno", style: estilo }, props.children);
  }

  function PontuacaoFlutuante(props) {
    return h("span", { className: cx("gs-pontuacao", props.animar && "gs-pontuacao--animar"), role: "status", onAnimationEnd: props.onFim },
      "+" + (props.valor == null ? 50 : props.valor) + "!");
  }

  function EstrelaResultado(props) {
    return h("svg", { width: props.tamanho, height: props.tamanho, viewBox: "0 0 32 32", "aria-hidden": "true", className: props.className },
      h("path", { d: ESTRELA, style: { fill: props.cheia ? "var(--cor-limao)" : "var(--cor-branco)" }, stroke: TRACO, strokeWidth: 2, strokeLinejoin: "round" }));
  }

  function CartaoResultado(props) {
    var total = 3, e = Math.max(0, Math.min(3, props.estrelas == null ? 2 : props.estrelas));
    return h("section", { className: "gs-painel gs-resultado", "aria-label": "Resultado da partida" },
      h("div", { className: "gs-resultado__estrelas", role: "img", "aria-label": e + " de " + total + " estrelas" },
        h(EstrelaResultado, { tamanho: 48, cheia: e >= 1 }),
        h(EstrelaResultado, { tamanho: 60, cheia: e >= 2, className: "gs-resultado__estrela--meio" }),
        h(EstrelaResultado, { tamanho: 48, cheia: e >= 3 })),
      h("div", { className: "gs-resultado__linhas" },
        h("div", { className: "gs-resultado__linha" },
          h("span", { className: "gs-resultado__rotulo" }, "PONTOS"),
          h("span", { className: "gs-resultado__valor gs-resultado__valor--pontos" }, milhar(props.pontos))),
        h("div", { className: "gs-resultado__linha" },
          h("span", { className: "gs-resultado__rotulo" }, "RECORDE"),
          h("span", { className: "gs-resultado__valor" }, milhar(props.recorde)))),
      h("div", { className: "gs-painel__acoes" },
        h(Botao, { variante: "primario", tamanho: "M", bolha: "a", onClick: props.onDeNovo }, "DE NOVO!"),
        h(Botao, { variante: "terciario", tamanho: "M", bolha: "b", onClick: props.onMenu }, "MENU")));
  }

  var BUSTO_CORPO = "M30 184 C16 130 20 66 48 38 C68 18 104 18 122 42 C142 70 146 130 132 184 Z";
  var BUSTO_BARRIGA = "M52 184 C46 146 64 124 86 126 C110 128 120 152 112 184 Z";
  function busto(filhos) {
    return h("svg", { viewBox: "0 0 160 170", width: 124, height: 132, stroke: TRACO, strokeWidth: 3.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
      [h("path", { key: "c", d: BUSTO_CORPO, fill: "#FCEBAA" }), h("path", { key: "b", d: BUSTO_BARRIGA, fill: "#F6C9C9" })].concat(filhos));
  }
  var EXPRESSOES = {
    feliz: function () {
      return busto([
        h("path", { key: 1, d: "M52 34 L46 18 M68 26 L68 10 M92 26 L98 10", fill: "none" }),
        h("ellipse", { key: 2, cx: 64, cy: 62, rx: 16, ry: 19, fill: "#FFFFFF" }),
        h("ellipse", { key: 3, cx: 98, cy: 56, rx: 12, ry: 15, fill: "#FFFFFF" }),
        h("circle", { key: 4, cx: 68, cy: 66, r: 4.5, fill: TRACO, stroke: "none" }),
        h("circle", { key: 5, cx: 96, cy: 59, r: 3.5, fill: TRACO, stroke: "none" }),
        h("path", { key: 6, d: "M54 90 C64 116 104 116 112 86 C96 80 70 82 54 90 Z", fill: "#D9579B" }),
        h("path", { key: 7, d: "M66 87 L67 95 M79 85 L80 93 M92 84 L92 92 M104 85 L103 93", fill: "none", strokeWidth: 2.6 })]);
    },
    susto: function () {
      return busto([
        h("path", { key: 1, d: "M48 30 L40 8 M70 22 L70 3 M96 22 L104 5", fill: "none" }),
        h("ellipse", { key: 2, cx: 62, cy: 62, rx: 19, ry: 23, fill: "#FFFFFF" }),
        h("ellipse", { key: 3, cx: 99, cy: 55, rx: 14, ry: 18, fill: "#FFFFFF" }),
        h("circle", { key: 4, cx: 62, cy: 62, r: 2.5, fill: TRACO, stroke: "none" }),
        h("circle", { key: 5, cx: 99, cy: 56, r: 2, fill: TRACO, stroke: "none" }),
        h("ellipse", { key: 6, cx: 82, cy: 104, rx: 11, ry: 15, fill: "#D9579B" }),
        h("path", { key: 7, d: "M138 40 C145 52 143 60 136 60 C129 60 128 52 138 40 Z", fill: "#9ED3E6", strokeWidth: 3 })]);
    },
    tonto: function () {
      var brilho = function (k, d, f) { return h("path", { key: k, d: d, fill: f, strokeWidth: 2.2 }); };
      return busto([
        h("ellipse", { key: 2, cx: 64, cy: 62, rx: 16, ry: 19, fill: "#FFFFFF" }),
        h("ellipse", { key: 3, cx: 98, cy: 56, rx: 12, ry: 15, fill: "#FFFFFF" }),
        h("path", { key: 4, d: "M64 62 m-1.5 0 a1.5 1.5 0 1 1 3 0 a3 3 0 1 1 -6 0 a4.5 4.5 0 1 1 9 0 a6 6 0 1 1 -12 0", fill: "none", strokeWidth: 2.6 }),
        h("path", { key: 5, d: "M98 56 m-1 0 a1 1 0 1 1 2 0 a2 2 0 1 1 -4 0 a3 3 0 1 1 6 0 a4 4 0 1 1 -8 0", fill: "none", strokeWidth: 2.6 }),
        h("path", { key: 6, d: "M58 98 C64 92 70 104 76 98 C82 92 88 104 94 98 C98 94 102 98 106 100", fill: "none" }),
        h("path", { key: 7, d: "M88 101 C86 114 98 116 100 103", fill: "#D9579B" }),
        brilho(8, "M34 12 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z", "#CFD62A"),
        brilho(9, "M126 8 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z", "#FFFFFF"),
        brilho(10, "M82 3 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z", "#CFD62A")]);
    },
    jogo: function (largura) {
      var p = function (k, d, extra) { return h("path", Object.assign({ key: k, d: d }, extra || {})); };
      return h("svg", { viewBox: "250 140 400 380", width: largura || 400, height: Math.round((largura || 400) * 0.95), fill: "none", stroke: TRACO, strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" },
        p(1, "M330 460 C300 400 300 300 330 240 C350 200 400 186 430 210 C470 180 540 200 548 256 C556 320 530 420 500 462 C460 480 370 482 330 460 Z", { fill: "#FCEBAA" }),
        p(2, "M370 380 C360 330 400 300 440 312 C490 322 506 380 482 430 C450 460 390 452 370 380 Z", { fill: "#F6C9C9" }),
        p(3, "M424 250 C440 220 510 214 540 246 C560 270 540 300 510 296 C480 300 440 290 424 250 Z", { fill: "#F6C9C9" }),
        p(4, "M444 256 C470 290 520 294 534 262 C520 246 460 240 444 256 Z", { fill: "#D9579B" }),
        p(5, "M452 256 L456 264 M470 254 L472 262 M488 254 L488 262 M506 256 L504 264", { strokeWidth: 2.5 }),
        h("ellipse", { key: 6, cx: 398, cy: 214, rx: 24, ry: 28, fill: "#FFFFFF" }),
        h("ellipse", { key: 7, cx: 444, cy: 200, rx: 18, ry: 22, fill: "#FFFFFF" }),
        h("circle", { key: 8, cx: 404, cy: 220, r: 5, fill: TRACO, stroke: "none" }),
        h("circle", { key: 9, cx: 440, cy: 204, r: 4, fill: TRACO, stroke: "none" }),
        p(10, "M378 180 L372 164 M392 176 L394 158 M430 172 L436 156"),
        p(11, "M548 300 C590 290 612 250 604 214 M600 214 C592 200 612 190 618 204 C630 196 640 212 626 222"),
        p(12, "M314 330 C280 350 262 380 270 410"),
        p(13, "M370 470 L362 504 L340 508 M486 468 L492 504 L514 508"));
    }
  };
  function Personagem(props) {
    var e = EXPRESSOES[props.expressao] ? props.expressao : "jogo";
    return h("span", { className: "gs-personagem", role: "img", "aria-label": props.rotulo || ("Personagem " + e) }, EXPRESSOES[e](props.largura));
  }


  /* ---- Movimento (do jogo em darkemaciel/splash-baratas@c644d8b) ---- */
  var SPRITES = {
    pata: "/_blob/bcadb374fc3ef0d798934086bc2e2402",
    andando: "/_blob/8f4bb5b7e7a976cefc64d03ade9ffe36",
    voando: "/_blob/e43023919b85b411449c2558c5015657"
  };
  function sprite(nome) {
    var o = window.GrotescoSurreal && window.GrotescoSurreal.sprites;
    return (o && o[nome]) || SPRITES[nome];
  }
  var BARATA = {
    andando: { quadros: 27, fps: 15, inclinacao: 10, hz: 2.2 },
    voando: { quadros: 16, fps: 20, inclinacao: 6, hz: 6 }
  };
  var FRENTE_SPRITE = -25; /* a barata do sprite olha para a direita, cabeça ~25° para cima */

  function useQuadro(ativo, fn) {
    var ref = React.useRef(fn);
    ref.current = fn;
    React.useEffect(function () {
      if (!ativo) return undefined;
      var id, t0 = performance.now();
      function loop(t) { ref.current(t - t0); id = requestAnimationFrame(loop); }
      id = requestAnimationFrame(loop);
      return function () { cancelAnimationFrame(id); };
    }, [ativo]);
  }
  function reduzMovimento() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function Barata(props) {
    var modo = BARATA[props.modo] ? props.modo : "andando";
    var cfg = BARATA[modo];
    var tam = props.tamanho || 64;
    var agitacao = Math.max(0, Math.min(1, props.agitacao || 0));
    var esquerda = props.direcao === "esquerda";
    var rumo = props.rumo == null ? (esquerda ? 180 : 0) : props.rumo;
    var fase = props.fase || 0;
    var elRef = React.useRef(null);
    var parado = props.parado || reduzMovimento();
    function pose(ms) {
      var s = ms / 1000;
      var frente = esquerda ? 180 - FRENTE_SPRITE : FRENTE_SPRITE;
      var ang = rumo - frente + cfg.inclinacao * Math.sin(s * cfg.hz * 2 * Math.PI + fase);
      var d = 0.18 * agitacao * Math.sin(s * 4 * 2 * Math.PI + fase);
      var f = 6 + agitacao * 8, amp = 4 * agitacao;
      var dx = amp * Math.sin(s * f * 2 * Math.PI + fase), dy = amp * Math.cos(s * f * 1.3 * 2 * Math.PI + fase);
      return "translate(" + dx.toFixed(2) + "px," + dy.toFixed(2) + "px) rotate(" + ang.toFixed(2) + "deg) scale(" +
        ((esquerda ? -1 : 1) * (1 + d)).toFixed(3) + "," + (1 - d).toFixed(3) + ")";
    }
    useQuadro(!parado && !props.eliminada, function (ms) { if (elRef.current) elRef.current.style.transform = pose(ms); });
    var dur = (cfg.quadros / cfg.fps).toFixed(3) + "s";
    return h("span", {
      className: cx("gs-barata", props.eliminada && "gs-barata--eliminada"),
      style: { width: tam, height: tam }, role: "img", "aria-label": props.rotulo || ("Barata " + modo)
    },
      h("span", { ref: elRef, className: "gs-barata__corpo", style: { transform: pose(0) } },
        h("span", {
          className: "gs-barata__sprite",
          style: {
            backgroundImage: "url(" + sprite(modo) + ")",
            backgroundSize: (cfg.quadros * 100) + "% 100%",
            animation: parado ? "none" : "gs-quadros-" + modo + " " + dur + " steps(" + (cfg.quadros - 1) + ") infinite",
            animationDelay: "-" + ((fase % (2 * Math.PI)) / (2 * Math.PI) * cfg.quadros / cfg.fps).toFixed(3) + "s"
          }
        })));
  }

  function PataCursor(props) {
    var altura = props.altura || 56;
    var areaRef = React.useRef(null), pataRef = React.useRef(null);
    var st = React.useRef({ x: 0, y: 0, ux: 0, uy: 0, ang: 0, golpe: -1, visivel: false });
    var reduz = reduzMovimento();
    useQuadro(true, function (ms) {
      var s = st.current, el = pataRef.current;
      if (!el) return;
      var escala = 1, ang;
      if (s.novoGolpe) { s.golpe = ms; s.novoGolpe = false; }
      if (s.golpe >= 0 && ms - s.golpe < 150) {
        var t = (ms - s.golpe) / 75; t = t <= 1 ? t : 2 - t;
        var e = 1 - (1 - t) * (1 - t); /* Quad.easeOut, ida e volta */
        ang = -25 * e; escala = 1 + 0.25 * e; s.ang = ang;
      } else {
        s.golpe = -1;
        var dx = s.x - s.ux, dy = s.y - s.uy, alvo = 0;
        if (!reduz && Math.hypot(dx, dy) > 0.5) {
          var dir = Math.atan2(dy, dx) * 180 / Math.PI, delta = dir + 90;
          delta = ((delta % 360) + 540) % 360 - 180;
          alvo = Math.max(-15, Math.min(15, delta * 0.15));
        }
        s.ang += (alvo - s.ang) * 0.25; ang = s.ang;
      }
      s.ux = s.x; s.uy = s.y;
      el.style.opacity = s.visivel ? "1" : "0";
      el.style.transform = "translate(" + s.x + "px," + s.y + "px) translate(-50%,-50%) rotate(" + ang.toFixed(2) + "deg) scale(" + escala.toFixed(3) + ")";
    });
    function mover(ev) {
      var r = areaRef.current.getBoundingClientRect();
      st.current.x = ev.clientX - r.left; st.current.y = ev.clientY - r.top; st.current.visivel = true;
    }
    return h("div", {
      ref: areaRef, className: cx("gs-area-pata", props.className), style: props.style,
      onPointerMove: mover, onPointerEnter: mover,
      onPointerLeave: function () { st.current.visivel = false; },
      onPointerDown: function (ev) {
        mover(ev);
        st.current.novoGolpe = true; /* reinicia o golpe a cada clique */
        if (props.onGolpe) props.onGolpe({ x: st.current.x, y: st.current.y });
      }
    },
      props.children,
      h("img", { ref: pataRef, className: "gs-pata", src: sprite("pata"), alt: "", draggable: false, style: { height: altura } }));
  }

  window.GrotescoSurreal = {
    Botao: Botao, BotaoIcone: BotaoIcone, Icone: Icone,
    HudPontos: HudPontos, HudVidas: HudVidas, HudTempo: HudTempo, BarraEnergia: BarraEnergia,
    SeloCombo: SeloCombo, Nivel: Nivel, Alternar: Alternar, Seletor: Seletor,
    Painel: Painel, Dialogo: Dialogo, BalaoDica: BalaoDica,
    TituloContorno: TituloContorno, PontuacaoFlutuante: PontuacaoFlutuante,
    CartaoResultado: CartaoResultado, Personagem: Personagem,
    Barata: Barata, PataCursor: PataCursor, sprites: null,
    formatarMilhar: milhar, formatarTempo: mss
  };
})();
