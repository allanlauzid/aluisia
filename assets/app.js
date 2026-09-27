/* Aluisia · painel web */
(function () {
  'use strict';

  var API = 'https://aluisiogondim.app.n8n.cloud/webhook/aluisia-site';
  var WA_NUM = '558195659773';
  var WA_URL = 'https://wa.me/' + WA_NUM;
  var MODELO_URL = 'https://ztygrxaxajdfvidvdqvb.supabase.co/storage/v1/object/public/publico/modelo_importacao_aluisia.txt';

  /* ---------------- utilidades ---------------- */
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { window.localStorage.removeItem(k); } catch (e) {} }
  };
  var memoria = {};
  function guardar(k, v) { memoria[k] = v; store.set(k, v); }
  function ler(k) { var v = store.get(k); return v != null ? v : (memoria[k] != null ? memoria[k] : null); }
  function apagar(k) { delete memoria[k]; store.del(k); }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtWa(t) {
    var s = esc(t);
    s = s.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?]|$)/g, '$1<em>$2</em>');
    s = s.replace(/~([^~\n]+)~/g, '<s>$1</s>');
    return s;
  }
  function tel(t) {
    var d = String(t || '').replace(/\D/g, '');
    if (d.length === 12 && d.indexOf('55') === 0) return '(' + d.slice(2, 4) + ') ' + d.slice(4, 8) + '-' + d.slice(8);
    if (d.length === 13 && d.indexOf('55') === 0) return '(' + d.slice(2, 4) + ') ' + d.slice(4, 9) + '-' + d.slice(9);
    return t || '';
  }
  function dataHora(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString('pt-BR', { timeZone: 'America/Recife', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  function hora(iso) {
    var d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleString('pt-BR', { timeZone: 'America/Recife', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  function relativo(iso) {
    if (!iso) return '';
    var d = new Date(iso); if (isNaN(d)) return '';
    var m = Math.round((Date.now() - d.getTime()) / 60000);
    if (m < 1) return 'agora';
    if (m < 60) return 'há ' + m + ' min';
    var h = Math.round(m / 60);
    if (h < 24) return 'há ' + h + ' h';
    var dd = Math.round(h / 24);
    if (dd < 8) return 'há ' + dd + (dd === 1 ? ' dia' : ' dias');
    return dataHora(iso);
  }
  function corta(t, n) { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; }
  function semAcento(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function primeiroNome(n) { return String(n || '').trim().split(/\s+/)[0] || ''; }
  function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }
  function numero(n) { return Number(n || 0).toLocaleString('pt-BR'); }

  var ICON = {
    whats: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.08c-.24.68-1.4 1.3-1.93 1.35-.5.05-.96.24-3.24-.67-2.74-1.08-4.47-3.9-4.6-4.08-.13-.18-1.1-1.46-1.1-2.79 0-1.33.7-1.98.94-2.25.25-.27.54-.34.72-.34h.52c.16 0 .39-.06.6.46.24.55.8 1.9.87 2.04.07.14.12.3.02.48-.1.18-.14.3-.28.46-.14.16-.29.36-.42.48-.14.14-.28.29-.12.56.16.27.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.24 1.39.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.23.61-.14.25.09 1.58.75 1.85.88.27.14.45.2.52.32.07.11.07.66-.17 1.34z"/></svg>',
    copiar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
    painel: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    livro: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/></svg>',
    busca: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    voltar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M11 18l-6-6 6-6"/></svg>',
    mais: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    alerta: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></svg>',
    escudo: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V5l8-3z"></path><path d="M9 12l2 2 4-4"></path></svg>',
    olho: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>'
  };

  /* ---------------- toast / modal / copiar ---------------- */
  var toastTimer = null;
  function toast(msg, erro) {
    var t = $('#toast');
    $('#toast-text').textContent = msg;
    t.classList.toggle('erro', !!erro);
    t.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('visible'); }, erro ? 4200 : 2400);
  }
  function copiar(texto, msg) {
    var ok = function () { toast(msg || 'Copiado!'); };
    var falha = function () { toast('Não foi possível copiar: ' + texto, true); };
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(texto).then(ok, falha); return; }
    var ta = document.createElement('textarea'); ta.value = texto; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); ok(); } catch (e) { falha(); }
    document.body.removeChild(ta);
  }
  function confirmar(titulo, texto, rotuloOk, perigo) {
    return new Promise(function (resolve) {
      var fundo = document.createElement('div');
      fundo.className = 'modal-fundo';
      fundo.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-tit"><h2 id="m-tit">' + esc(titulo) + '</h2>' +
        '<p>' + esc(texto) + '</p><div class="acoes fim"><button type="button" class="btn btn-linha" data-r="0">Cancelar</button>' +
        '<button type="button" class="btn ' + (perigo ? 'btn-perigo' : 'btn-primario') + '" data-r="1">' + esc(rotuloOk || 'Confirmar') + '</button></div></div>';
      var fechar = function (v) { document.removeEventListener('keydown', tecla); fundo.remove(); resolve(v); };
      var tecla = function (e) { if (e.key === 'Escape') fechar(false); };
      fundo.addEventListener('click', function (e) {
        if (e.target === fundo) return fechar(false);
        var b = e.target.closest('[data-r]'); if (b) fechar(b.getAttribute('data-r') === '1');
      });
      document.addEventListener('keydown', tecla);
      document.body.appendChild(fundo);
      $('[data-r="1"]', fundo).focus();
    });
  }
  function carregando(txt) { return '<div class="carregando-bloco"><span class="spin" aria-hidden="true"></span>' + esc(txt || 'Carregando…') + '</div>'; }
  function vazio(txt) { return '<div class="vazio"><img src="img/aluisia-avatar.webp" alt="" width="72" height="72">' + esc(txt) + '</div>'; }
  function erroBox(txt) { return '<div class="aviso-box erro">' + ICON.alerta + '<div>' + esc(txt) + '</div></div>'; }
  function ocupado(btn, sim) { if (!btn) return; btn.classList.toggle('carregando', !!sim); btn.disabled = !!sim; }

  /* ---------------- API ---------------- */
  function clienteId() {
    var c = ler('al_cli');
    if (!c) {
      var b = new Uint8Array(16);
      (window.crypto || window.msCrypto).getRandomValues(b);
      c = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      guardar('al_cli', c);
    }
    return c;
  }
  var token = ler('al_tok');
  var sessao = null;

  function api(acao, dados) {
    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ acao: acao, token: token, dados: dados || {}, cliente: clienteId() }),
      cache: 'no-store'
    }).then(function (r) {
      if (!r.ok) throw new Error('Falha de comunicação (' + r.status + ').');
      return r.json();
    }).then(function (j) {
      if (j && j.sessao_expirada && acao !== 'login') {
        sair(true);
        toast('Sua sessão terminou. Entre de novo.', true);
        throw new Error('sessao');
      }
      return j || {};
    });
  }
  function falhou(e) { if (e && e.message === 'sessao') return; toast((e && e.message) || 'Algo deu errado. Tente de novo.', true); }

  /* ---------------- login ---------------- */
  var etapa = 'inicio';
  var gateInput = $('#gate-input');
  var gateForm = $('#gate-form');
  var gateGo = $('#gate-go');
  var goHtml = gateGo.innerHTML;

  function gateStatus(t) { $('#gate-status').textContent = t; }
  function gateErro() {
    gateForm.classList.remove('erro'); void gateForm.offsetWidth; gateForm.classList.add('erro');
    if (navigator.vibrate) { try { navigator.vibrate(60); } catch (e) {} }
  }
  function gateOcupado(sim) {
    gateGo.disabled = sim; gateInput.readOnly = sim;
    gateGo.innerHTML = sim ? '<span class="spin" aria-hidden="true"></span>' : goHtml;
  }
  function gateReset() {
    etapa = 'inicio'; gateInput.value = ''; gateInput.placeholder = 'Telefone ou código';
    $('#gate-label').textContent = 'Telefone ou código';
    gateOcupado(false);
  }
  $('#gate-olho').addEventListener('click', function () {
    var mostrar = gateInput.classList.contains('mascarado');
    gateInput.classList.toggle('mascarado', !mostrar);
    this.setAttribute('aria-pressed', mostrar ? 'true' : 'false');
    this.setAttribute('aria-label', mostrar ? 'Esconder números' : 'Mostrar números');
    $('#olho-aberto').toggleAttribute('hidden', mostrar); $('#olho-fechado').toggleAttribute('hidden', !mostrar);
    gateInput.focus();
  });
  gateInput.addEventListener('input', function () {
    gateForm.classList.remove('erro');
    var d = gateInput.value.replace(/\D/g, '');
    if (etapa === 'codigo' && d.length === 6) enviarLogin();
  });
  gateForm.addEventListener('submit', function (e) { e.preventDefault(); enviarLogin(); });

  function enviarLogin() {
    var d = gateInput.value.replace(/\D/g, '');
    if (gateGo.disabled) return;
    if (!(d.length === 6 || (d.length >= 10 && d.length <= 13))) { gateErro(); return; }
    gateOcupado(true);
    api('login', { entrada: d }).then(function (r) {
      gateOcupado(false);
      if (r.ok && r.token) {
        token = r.token; guardar('al_tok', token);
        sessao = { nome: r.nome, expira_em: r.expira_em };
        gateReset();
        entrar();
        return;
      }
      if (d.length !== 6 && r.ok && r.etapa === 'codigo') {
        etapa = 'codigo';
        gateInput.value = '';
        gateInput.placeholder = 'Código do WhatsApp';
        $('#gate-label').textContent = 'Código recebido no WhatsApp';
        gateStatus('Se o número for de um admin, o código chega no WhatsApp em instantes.');
        gateInput.focus();
        return;
      }
      gateInput.value = '';
      gateErro();
      gateInput.focus();
    }).catch(function () { gateOcupado(false); gateErro(); });
  }

  function entrar() {
    $('#gate').hidden = true;
    $('#app').hidden = false;
    document.body.classList.add('logado');
    $('#user-nome').textContent = (sessao && sessao.nome) || '';
    rota();
    atualizarContador();
    if (!sessao || !sessao.telefone) api('sessao').then(function (r) { if (r.ok) sessao = r.dados; }).catch(function () {});
  }
  function sair(expirou) {
    if (!expirou && token) { api('sair').catch(function () {}); }
    token = null; sessao = null; apagar('al_tok');
    docsCache = null;
    document.body.classList.remove('logado');
    $('#app').hidden = true;
    $('#view').innerHTML = '';
    $('#gate').hidden = false;
    gateReset();
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    setTimeout(function () { gateInput.focus(); }, 50);
  }
  $('#btn-sair').addEventListener('click', function () {
    confirmar('Sair do painel?', 'Você vai precisar entrar de novo com o telefone ou o autenticador.', 'Sair').then(function (ok) { if (ok) sair(false); });
  });

  function atualizarContador(n) {
    var aplicar = function (v) {
      var c = $('#tab-cont');
      c.hidden = !v; c.textContent = v > 99 ? '99+' : String(v || '');
      pendentes = v || 0;
      $$('.cont-duvidas').forEach(function (el) { el.hidden = !v; el.textContent = v; });
    };
    if (typeof n === 'number') return aplicar(n);
    api('resumo').then(function (r) { if (r.ok) aplicar(r.dados.duvidas_pendentes); }).catch(function () {});
  }
  var pendentes = 0;

  /* ---------------- roteador ---------------- */
  var view = $('#view');
  var rotaAtual = '';
  function marcarNav(a, b) {
    var chave = a === 'painel' ? (b === 'duvidas' || b === 'base' ? b : 'painel') : (a || 'inicio');
    $$('.tabbar a').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-rota') === chave); });
    $$('.topnav a').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-rota') === (a || 'inicio')); });
  }
  function rota() {
    if (!token) return;
    var h = location.hash.replace(/^#\/?/, '');
    var p = h.split('/');
    var a = p[0] || '', b = p[1] || '', c = p[2] ? decodeURIComponent(p[2]) : null;
    var nova = a + '/' + b;
    var mudouTela = nova !== rotaAtual || !c;
    rotaAtual = nova;
    marcarNav(a, b);
    if (!a) { viewInicio(); }
    else if (a === 'painel') { viewPainel(b, c); }
    else if (a === 'docs') { viewDocs(b ? decodeURIComponent(b) : null); return; }
    else { location.hash = '#/'; return; }
    if (mudouTela || c) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', rota);

  /* ---------------- início ---------------- */
  function heroInicio() {
    var nome = primeiroNome(sessao && sessao.nome) || 'admin';
    return '<header class="hero"><div class="hero-inner hero-grid"><div>' +
      '<span class="brand-mark"><img src="logotipo.svg" alt="Aluisia" width="340" height="73"></span>' +
      '<div class="mascote-topo" style="margin:-4px 0 22px"><img src="img/aluisia-16x9.webp" alt="Aluisia, a assistente virtual, com fone de atendimento" width="800" height="450" style="width:100%;height:auto;max-width:420px;border-radius:22px;box-shadow:0 20px 40px rgba(2,6,23,.4),0 0 0 1px rgba(255,255,255,.2)"></div>' +
      '<h1>Olá, <em>' + esc(nome) + '</em></h1>' +
      '<p class="hero-sub">Aqui você cuida da Aluisia: responde as dúvidas dos alunos, ajusta o que ela sabe e acompanha o atendimento no WhatsApp.</p>' +
      '<div class="hero-actions">' +
        '<a class="btn btn-branco" href="#/painel">' + ICON.painel + 'Abrir painel</a>' +
        '<a class="btn btn-vidro" href="#/docs">' + ICON.livro + 'Documentação</a>' +
        '<a class="btn btn-whats" href="' + WA_URL + '" target="_blank" rel="noopener">' + ICON.whats + 'Conversar no WhatsApp</a>' +
        '<button type="button" class="btn btn-vidro" id="copiar-wa">' + ICON.copiar + 'Copiar link</button>' +
      '</div>' +
      '<p class="pill">' + ICON.escudo + 'wa.me/' + WA_NUM + '</p>' +
      '</div>' +
      '<div class="mascote"><img src="img/aluisia-retrato.webp" alt="Aluisia, a assistente virtual, com fone de atendimento" width="800" height="800">' +
        '<span class="balao">Oi! Posso te ajudar com o Studeo? 😊</span>' +
        '<span class="status"><span class="dot"></span>Atendendo no WhatsApp</span></div>' +
      '</div></header>';
  }
  function grafico(serie) {
    if (!serie || !serie.length) return '';
    var W = 960, H = 220, pb = 22, pt = 10, n = serie.length, max = 1;
    serie.forEach(function (s) { if (s.msgs > max) max = s.msgs; });
    var bw = W / n, out = '';
    serie.forEach(function (s, i) {
      var h = Math.max(s.msgs > 0 ? 3 : 0, Math.round((H - pb - pt) * s.msgs / max));
      var x = i * bw + bw * 0.18, y = H - pb - h;
      var dia = s.dia.slice(8, 10) + '/' + s.dia.slice(5, 7);
      out += '<rect class="barra" x="' + x.toFixed(1) + '" y="' + y + '" width="' + (bw * 0.64).toFixed(1) + '" height="' + h + '" rx="3"><title>' + dia + ': ' + s.msgs + ' mensagens de ' + s.pessoas + ' pessoa(s)</title></rect>';
      if (i % 5 === 0 || i === n - 1) out += '<text x="' + (i === 0 ? 0 : i === n - 1 ? W : (i * bw + bw / 2)).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '">' + dia + '</text>';
    });
    out += '<line class="eixo" x1="0" x2="' + W + '" y1="' + (H - pb) + '" y2="' + (H - pb) + '"></line>';
    return '<svg class="grafico" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mensagens por dia nos últimos 30 dias">' + out + '</svg>';
  }
  var ACOES = {
    adicionar: 'Adicionou item', editar: 'Editou item', excluir: 'Desativou item', categorizar: 'Mudou etiqueta', revisar: 'Revisou item',
    desfazer: 'Desfez uma ação', responder_escalacao: 'Respondeu dúvida', descartar_escalacao: 'Descartou dúvida', alterar_senha: 'Trocou a senha de funcionário',
    alterar_config: 'Mudou configuração', configurar_totp: 'Configurou autenticador', login: 'Entrou', login_falha: 'Errou o login', bloqueio: 'Bloqueio de login',
    liberar_bloqueio: 'Liberou bloqueio', derrubar_sessao: 'Encerrou sessão', limpeza: 'Limpeza automática', alerta: 'Alerta'
  };
  function viewInicio() {
    view.innerHTML = heroInicio() + '<div class="wrap home-body" id="home-body">' +
      '<div class="stats">' + [1, 2, 3, 4, 5, 6].map(function () { return '<div class="stat skeleton" style="height:104px"></div>'; }).join('') + '</div></div>';
    $('#copiar-wa').addEventListener('click', function () { copiar(WA_URL, 'Link da Aluisia copiado!'); });
    api('resumo').then(function (r) {
      if (!r.ok) throw new Error(r.erro || 'Não consegui carregar o resumo.');
      var d = r.dados;
      atualizarContador(d.duvidas_pendentes);
      var html = '';
      if (d.manutencao) html += '<div class="aviso-box" style="margin-bottom:24px">' + ICON.alerta + '<div><strong>Modo manutenção ligado.</strong> A Aluisia não está respondendo alunos com a IA. <a href="#/painel/config">Desligar em Configurações</a>.</div></div>';
      html += '<div class="stats reveal">' +
        '<a class="stat destaque' + (d.duvidas_pendentes ? ' alerta' : '') + '" href="#/painel/duvidas"><div class="valor">' + numero(d.duvidas_pendentes) + '</div><div class="rotulo">Dúvidas esperando resposta</div></a>' +
        '<div class="stat"><div class="valor">' + numero(d.msgs_hoje) + '</div><div class="rotulo">Mensagens de alunos hoje</div></div>' +
        '<div class="stat"><div class="valor">' + numero(d.msgs_7d) + '</div><div class="rotulo">Mensagens em 7 dias</div></div>' +
        '<div class="stat"><div class="valor">' + numero(d.pessoas_7d) + '</div><div class="rotulo">Pessoas atendidas em 7 dias</div></div>' +
        '<a class="stat" href="#/painel/base"><div class="valor">' + numero(d.docs_ativos) + '</div><div class="rotulo">Itens na base</div></a>' +
        '<a class="stat" href="#/painel/base?revisar"><div class="valor">' + numero(d.docs_revisar) + '</div><div class="rotulo">Itens para revisar</div></a>' +
        '</div>';
      html += '<section class="card reveal"><div class="card-cab"><h2>Mensagens nos últimos 30 dias</h2><span class="muted pequeno">' + numero(d.escaladas_7d) + ' dúvida(s) criadas em 7 dias</span></div>' + grafico(d.serie) + '</section>';
      html += '<div class="grid-2 reveal">';
      html += '<section class="card"><div class="card-cab"><h2>Últimas dúvidas</h2><a href="#/painel/duvidas" class="pequeno">Ver todas</a></div>' +
        (d.ultimas_duvidas && d.ultimas_duvidas.length ? '<ul class="lista">' + d.ultimas_duvidas.map(function (x) {
          return '<li><a class="linha" href="#/painel/duvidas/' + x.codigo + '"><span class="num-badge">#' + x.codigo + '</span><span class="corpo"><span class="titulo">' + esc(x.mensagem) + '</span><span class="sub">' + relativo(x.criado_em) + '</span></span></a></li>';
        }).join('') + '</ul>' : vazio('Nenhuma dúvida esperando. Tudo em dia!')) + '</section>';
      html += '<section class="card"><div class="card-cab"><h2>Últimas ações</h2><a href="#/painel/historico" class="pequeno">Histórico</a></div>' +
        (d.ultimas_acoes && d.ultimas_acoes.length ? '<ul class="lista">' + d.ultimas_acoes.map(function (x) {
          return '<li><div class="linha"><span class="corpo"><span class="titulo">' + esc(ACOES[x.acao] || x.acao) + '</span><span class="sub">' + esc(/^\d{10,}$/.test(x.quem) ? tel(x.quem) : x.quem) + ' · ' + relativo(x.quando) + '</span></span></div></li>';
        }).join('') + '</ul>' : vazio('Nenhuma ação ainda.')) + '</section>';
      html += '</div>';
      $('#home-body').innerHTML = html;
    }).catch(function (e) { if (e.message !== 'sessao') $('#home-body').innerHTML = erroBox(e.message || 'Não consegui carregar.'); });
  }

  /* ---------------- painel ---------------- */
  var SECOES = [
    { id: 'duvidas', nome: 'Dúvidas', h1: 'Dúvidas <em>dos alunos</em>', desc: 'Responder o que a Aluisia não soube' },
    { id: 'base', nome: 'Base', h1: 'Base de <em>conhecimento</em>', desc: 'Procurar, editar e revisar itens' },
    { id: 'novo', nome: 'Novo item', h1: 'Novo <em>item</em>', desc: 'Ensinar algo novo à Aluisia' },
    { id: 'importar', nome: 'Importar', h1: 'Importar <em>conteúdo</em>', desc: 'Muitos itens de uma vez' },
    { id: 'conversas', nome: 'Conversas', h1: 'Conversas', desc: 'O que os alunos estão perguntando' },
    { id: 'historico', nome: 'Histórico', h1: 'Histórico <em>e desfazer</em>', desc: 'Quem fez o quê, e voltar atrás' },
    { id: 'config', nome: 'Configurações', h1: 'Configurações <em>gerais</em>', desc: 'Senha, manutenção, mensagens, busca' },
    { id: 'acesso', nome: 'Acesso', h1: 'Acesso e <em>segurança</em>', desc: 'Admins, sessões, bloqueios, autenticador' }
  ];
  function secaoPorId(id) { for (var i = 0; i < SECOES.length; i++) if (SECOES[i].id === id) return SECOES[i]; return null; }
  function num2(i) { return (i < 9 ? '0' : '') + (i + 1); }

  function viewPainel(sec, param) {
    var secId = sec.split('?')[0];
    var s = secaoPorId(secId);
    var hero = '<header class="hero compacto"><div class="hero-inner"><p class="pill" style="margin-bottom:18px">' + ICON.painel + 'Painel da Aluisia</p>' +
      '<h1>' + (s ? s.h1 : 'Painel da <em>Aluisia</em>') + '</h1>' +
      '<p class="hero-sub">' + (s ? esc(s.desc) + '.' : 'Tudo o que o /admin do WhatsApp faz, e um pouco mais.') + '</p></div></header>';
    var toc = '<nav class="toc" aria-label="Seções do painel"><p class="toc-title">PAINEL</p><div class="toc-body"><div class="progress-track"><div class="progress-fill"></div></div><ol>' +
      SECOES.map(function (x, i) {
        return '<li><a href="#/painel/' + x.id + '"' + (x.id === secId ? ' class="active"' : '') + '><span class="num">' + num2(i) + '</span>' + esc(x.nome) +
          (x.id === 'duvidas' ? '<span class="cont cont-duvidas"' + (pendentes ? '' : ' hidden') + '>' + pendentes + '</span>' : '') + '</a></li>';
      }).join('') + '</ol></div></nav>';
    var chips = '<nav class="chips-nav" aria-label="Seções do painel">' + SECOES.map(function (x) {
      return '<a href="#/painel/' + x.id + '"' + (x.id === secId ? ' class="active"' : '') + '>' + esc(x.nome) +
        (x.id === 'duvidas' ? '<span class="cont cont-duvidas"' + (pendentes ? '' : ' hidden') + '>' + pendentes + '</span>' : '') + '</a>';
    }).join('') + '</nav>';
    view.innerHTML = hero + '<div class="shell">' + toc + '<main class="conteudo">' + (s ? chips : '') + '<div id="sec"></div></main></div>';
    var alvo = $('#sec');
    var ativo = $('.chips-nav a.active'); if (ativo && ativo.scrollIntoView) ativo.scrollIntoView({ block: 'nearest', inline: 'center' });
    if (!s) return secIndice(alvo);
    var fn = { duvidas: secDuvidas, base: secBase, novo: secNovo, importar: secImportar, conversas: secConversas, historico: secHistorico, config: secConfig, acesso: secAcesso }[secId];
    fn(alvo, param, sec.indexOf('?') >= 0 ? sec.split('?')[1] : '');
  }

  function secIndice(alvo) {
    alvo.innerHTML = '<p class="intro">Escolha uma área. Tudo o que você faz aqui também fica registrado no histórico e pode ser desfeito quando mexe na base.</p>' +
      '<div class="sections">' + SECOES.map(function (x, i) {
        return '<a href="#/painel/' + x.id + '" style="text-decoration:none;color:inherit;display:block"><section class="card numerado reveal" style="margin-bottom:20px;padding-top:24px;padding-bottom:24px"><span class="ghost-num" aria-hidden="true">' + num2(i) + '</span><span class="index" aria-hidden="true" style="top:22px">' + (i + 1) + '</span>' +
          '<h2 style="margin-bottom:4px">' + esc(x.nome) + (x.id === 'duvidas' ? ' <span class="tag aviso cont-duvidas"' + (pendentes ? '' : ' hidden') + '>' + pendentes + '</span>' : '') + '</h2><p class="muted" style="margin:0">' + esc(x.desc) + '</p></section></a>';
      }).join('') + '</div>';
  }

  function voltarLink(href, txt) { return '<a class="btn btn-linha btn-sm" href="' + href + '" style="margin-bottom:18px">' + ICON.voltar + esc(txt) + '</a>'; }
  function tagSite(s) { return s ? '<span class="tag ' + esc(s) + '">' + esc(s) + '</span>' : ''; }
  var STATUS_DUV = { pending: ['Pendente', 'aviso'], resolved: ['Respondida', 'ok'], discarded: ['Descartada', 'neutra'] };
  function tagStatus(s) { var x = STATUS_DUV[s] || [s, 'neutra']; return '<span class="tag ' + x[1] + '">' + esc(x[0]) + '</span>'; }
  var ORIGENS = { manual: 'manual', escalacao: 'de dúvida', importacao: 'importado', site: 'site', scraping: 'site oficial' };

  /* ---- Dúvidas ---- */
  var filtroDuv = 'pending';
  function secDuvidas(alvo, codigo) {
    if (codigo) return detalheDuvida(alvo, codigo);
    alvo.innerHTML = '<section class="card reveal"><div class="card-cab"><h2>Dúvidas</h2>' +
      '<div class="segmentos" role="group" aria-label="Filtrar">' +
      [['pending', 'Pendentes'], ['resolved', 'Respondidas'], ['discarded', 'Descartadas'], ['todas', 'Todas']].map(function (f) {
        return '<button type="button" data-f="' + f[0] + '"' + (filtroDuv === f[0] ? ' class="on"' : '') + '>' + f[1] + '</button>';
      }).join('') + '</div></div><div id="duv-lista">' + carregando() + '</div></section>';
    $$('.segmentos button', alvo).forEach(function (b) {
      b.addEventListener('click', function () { filtroDuv = b.getAttribute('data-f'); secDuvidas(alvo); });
    });
    api('duvidas', { status: filtroDuv }).then(function (r) {
      if (!r.ok) throw new Error(r.erro);
      var it = r.dados.itens || [];
      if (filtroDuv === 'pending') atualizarContador(it.length);
      $('#duv-lista').innerHTML = it.length ? '<ul class="lista">' + it.map(function (x) {
        return '<li><a class="linha" href="#/painel/duvidas/' + x.codigo + '"><span class="num-badge">#' + x.codigo + '</span><span class="corpo"><span class="titulo">' + esc(corta(x.mensagem, 180)) + '</span>' +
          '<span class="sub">' + esc(tel(x.telefone)) + ' · ' + relativo(x.criado_em) + (x.respondido_por ? ' · por ' + esc(x.respondido_por) : '') + '</span></span><span class="lado">' + tagStatus(x.status) + (x.salvo_na_base ? '<br><span class="tag ok" style="margin-top:4px">na base</span>' : '') + '</span></a></li>';
      }).join('') + '</ul>' : vazio(filtroDuv === 'pending' ? 'Nenhuma dúvida esperando. Tudo em dia!' : 'Nada por aqui.');
    }).catch(function (e) { if (e.message !== 'sessao') $('#duv-lista').innerHTML = erroBox(e.message); });
  }

  function detalheDuvida(alvo, codigo) {
    alvo.innerHTML = voltarLink('#/painel/duvidas', 'Todas as dúvidas') + carregando();
    api('duvida', { codigo: codigo }).then(function (r) {
      if (!r.ok) throw new Error(r.erro);
      var d = r.dados;
      var h = voltarLink('#/painel/duvidas', 'Todas as dúvidas') +
        '<section class="card reveal"><span class="ghost-num" aria-hidden="true">#' + d.codigo + '</span><div class="card-cab"><h2>Dúvida #' + d.codigo + '</h2><span class="tags">' + tagStatus(d.status) +
        (d.status === 'pending' ? (d.janela_aberta ? '<span class="tag ok">janela aberta</span>' : '<span class="tag erro">janela de 24 h fechada</span>') : '') + '</span></div>' +
        '<p class="muted pequeno">' + esc(tel(d.telefone)) + ' · ' + dataHora(d.criado_em) + '</p>' +
        '<div class="aviso-box info" style="margin-bottom:18px">' + ICON.info + '<div><strong>Pergunta do aluno</strong><br>' + fmtWa(d.mensagem) + '</div></div>';
      if (d.conversa && d.conversa.length) {
        h += '<details class="topico"><summary>Ver a conversa em volta (' + d.conversa.length + ' mensagens)</summary><div class="topico-corpo"><div class="chat">' +
          d.conversa.map(function (m) { return '<div class="bolha ' + (m.papel === 'user' ? 'user' : 'assistant') + '">' + fmtWa(m.texto) + '<span class="hora">' + hora(m.quando) + '</span></div>'; }).join('') + '</div></div></details>';
      }
      if (d.status === 'pending') {
        if (!d.janela_aberta) h += '<div class="aviso-box" style="margin:14px 0">' + ICON.alerta + '<div>Esse aluno falou há mais de 24 horas. Pela regra do WhatsApp, a resposta pode não chegar. Vale responder mesmo assim e, se for importante, falar com ele por outro canal.</div></div>';
        h += '<form class="form" id="f-resp" style="margin-top:16px"><label class="campo"><span>Sua resposta (vai para o aluno no WhatsApp)</span>' +
          '<textarea class="entrada" name="resposta" required maxlength="4000" placeholder="Escreva como se fosse a Aluisia falando com o aluno."></textarea><small>Use *asteriscos* para negrito, como no WhatsApp.</small></label>' +
          '<div class="acoes"><button class="btn btn-primario" type="submit">' + ICON.whats + 'Responder</button><button class="btn btn-perigo" type="button" id="b-desc">Descartar</button></div></form>';
      } else {
        if (d.resposta) h += '<h3>Resposta enviada' + (d.respondido_por ? ' por ' + esc(d.respondido_por) : '') + '</h3><div class="chat" style="max-height:none"><div class="bolha assistant">' + fmtWa(d.resposta) + '</div></div>';
        if (d.status === 'resolved') {
          h += d.salvo_na_base && d.documento_id
            ? '<p style="margin-top:16px"><span class="tag ok">Salva na base</span> <a href="#/painel/base/' + d.documento_id + '">Abrir o item #' + d.documento_id + '</a></p>'
            : '<div class="acoes" style="margin-top:18px"><button class="btn btn-primario" id="b-gerar" type="button">' + ICON.mais + 'Salvar na base</button><span class="muted pequeno">Transforme a resposta num item para a Aluisia já saber da próxima vez.</span></div><div id="editor-duv"></div>';
        }
      }
      h += '</section>';
      alvo.innerHTML = h;
      var f = $('#f-resp');
      if (f) {
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var txt = f.resposta.value.trim(); if (txt.length < 2) { f.resposta.focus(); return; }
          var b = $('button[type=submit]', f); ocupado(b, true);
          api('duvida_acao', { op: 'responder', codigo: d.codigo, resposta: txt }).then(function (r) {
            ocupado(b, false);
            if (!r.ok) return toast(r.erro, true);
            toast('Resposta enviada para o aluno.');
            atualizarContador();
            detalheDuvida(alvo, d.codigo);
          }).catch(function (e) { ocupado(b, false); falhou(e); });
        });
        $('#b-desc').addEventListener('click', function () {
          confirmar('Descartar a dúvida #' + d.codigo + '?', 'Ela sai da lista de pendentes e o aluno não recebe resposta.', 'Descartar', true).then(function (ok) {
            if (!ok) return;
            api('duvida_acao', { op: 'descartar', codigo: d.codigo }).then(function (r) {
              if (!r.ok) return toast(r.erro, true);
              toast('Dúvida descartada.'); atualizarContador(); location.hash = '#/painel/duvidas';
            }).catch(falhou);
          });
        });
      }
      var g = $('#b-gerar');
      if (g) g.addEventListener('click', function () {
        g.parentNode.remove();
        var box = $('#editor-duv');
        box.innerHTML = '<h3>Novo item para a base</h3><p class="muted pequeno">Escreva de forma geral, para qualquer aluno. Tire nomes, telefones, RA e situações só daquele aluno.</p>';
        box.appendChild(editorItem({ titulo: corta(d.mensagem, 200), texto: d.resposta || '', site: 'studeo', esc_codigo: d.codigo }, function () {
          toast('Item salvo na base.'); detalheDuvida(alvo, d.codigo);
        }));
        var t = $('input[name=titulo]', box); if (t) t.focus();
      });
    }).catch(function (e) { if (e.message !== 'sessao') alvo.innerHTML = voltarLink('#/painel/duvidas', 'Todas as dúvidas') + erroBox(e.message); });
  }

  /* ---- Editor de item ---- */
  function editorItem(d, aoSalvar) {
    var el = document.createElement('form');
    el.className = 'form';
    el.noValidate = true;
    el.innerHTML =
      '<label class="campo"><span>Título (a pergunta, como um aluno faria)</span><input class="entrada" name="titulo" maxlength="200" value="' + esc(d.titulo) + '" placeholder="Ex.: Como vejo minhas notas?"></label>' +
      '<label class="campo"><span>Texto (a resposta completa)</span><textarea class="entrada" name="texto" maxlength="6000" style="min-height:200px" placeholder="Explique com caminhos exatos, prazos e condições.">' + esc(d.texto) + '</textarea><span class="contador" data-c></span></label>' +
      '<label class="campo" style="max-width:320px"><span>Etiqueta (quem pode ver)</span><select class="entrada" name="site">' +
      [['studeo', 'studeo · alunos e funcionários'], ['whatsapp', 'whatsapp · alunos e funcionários'], ['sydle', 'sydle · só admins'], ['interno', 'interno · só admins']].map(function (o) {
        return '<option value="' + o[0] + '"' + (d.site === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select></label><div data-dup></div>' +
      '<div class="acoes"><button class="btn btn-primario" type="submit">Salvar item</button>' + (d.extraBotoes || '') + '</div>';
    var ta = el.texto, cont = $('[data-c]', el);
    var conta = function () { cont.textContent = ta.value.length + ' / 6000'; };
    ta.addEventListener('input', conta); conta();
    var enviar = function (forcar) {
      var tit = el.titulo.value.trim(), txt = el.texto.value.trim();
      if (tit.length < 3) { toast('O título precisa ter pelo menos 3 caracteres.', true); el.titulo.focus(); return; }
      if (txt.length < 10) { toast('O texto precisa ter pelo menos 10 caracteres.', true); el.texto.focus(); return; }
      var b = $('button[type=submit]', el); ocupado(b, true);
      var dados = { titulo: tit, texto: txt, site: el.site.value };
      if (d.id) dados.id = d.id;
      if (d.esc_codigo) dados.esc_codigo = d.esc_codigo;
      if (forcar) dados.forcar = true;
      api('doc_salvar', dados).then(function (r) {
        ocupado(b, false);
        if (r.ok) { $('[data-dup]', el).innerHTML = ''; aoSalvar(r.dados.id, r.dados); return; }
        if (r.duplicado) {
          var dp = r.duplicado;
          $('[data-dup]', el).innerHTML = '<div class="aviso-box">' + ICON.alerta + '<div><strong>Já existe um item muito parecido</strong> (' + Math.round(dp.sim * 100) + '% parecido): <a href="#/painel/base/' + dp.id + '">#' + dp.id + ' · ' + esc(dp.titulo) + '</a>.<br>O melhor é editar o item existente. <div class="acoes" style="margin-top:10px"><button type="button" class="btn btn-linha btn-sm" data-forcar>Salvar mesmo assim</button></div></div></div>';
          $('[data-forcar]', el).addEventListener('click', function () { enviar(true); });
          return;
        }
        toast(r.erro || 'Não consegui salvar.', true);
      }).catch(function (e) { ocupado(b, false); falhou(e); });
    };
    el.addEventListener('submit', function (e) { e.preventDefault(); enviar(false); });
    return el;
  }

  /* ---- Base ---- */
  var filtroBase = { q: '', site: '', origem: '', ativo: 'true', revisar: false, pagina: 1 };
  function secBase(alvo, id, query) {
    if (id) return detalheItem(alvo, id);
    if (query === 'revisar') { filtroBase.revisar = true; filtroBase.pagina = 1; }
    var sel = function (nome, ops) {
      return '<select class="entrada" data-f="' + nome + '" aria-label="' + nome + '">' + ops.map(function (o) { return '<option value="' + o[0] + '"' + (String(filtroBase[nome]) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>';
    };
    alvo.innerHTML = '<section class="card reveal"><div class="card-cab"><h2>Itens da base</h2><a class="btn btn-primario btn-sm" href="#/painel/novo">' + ICON.mais + 'Novo item</a></div>' +
      '<div class="busca">' + ICON.busca + '<input class="entrada" type="search" id="b-q" placeholder="Procurar por palavra ou número do item" value="' + esc(filtroBase.q) + '" aria-label="Procurar na base"></div>' +
      '<div class="filtros">' +
      sel('site', [['', 'Todas as etiquetas'], ['studeo', 'studeo'], ['whatsapp', 'whatsapp'], ['sydle', 'sydle'], ['interno', 'interno']]) +
      sel('origem', [['', 'Qualquer origem'], ['manual', 'Manual'], ['escalacao', 'De dúvidas'], ['importacao', 'Importados']]) +
      sel('ativo', [['true', 'Ativos'], ['false', 'Desativados'], ['todos', 'Todos']]) +
      '<label class="switch" style="font-size:.9rem"><input type="checkbox" id="b-rev"' + (filtroBase.revisar ? ' checked' : '') + '><span class="trilho"></span>Só para revisar</label>' +
      '</div><div id="b-lista">' + carregando() + '</div></section>';
    var carregar = function () {
      $('#b-lista').innerHTML = carregando();
      api('docs', { q: filtroBase.q, site: filtroBase.site, origem: filtroBase.origem, ativo: filtroBase.ativo, revisar: filtroBase.revisar, pagina: filtroBase.pagina, por_pagina: 20 }).then(function (r) {
        if (!r.ok) throw new Error(r.erro);
        var d = r.dados, it = d.itens || [];
        var pags = Math.max(1, Math.ceil(d.total / d.por_pagina));
        $('#b-lista').innerHTML = '<p class="muted pequeno" style="margin:0 0 10px">' + numero(d.total) + ' item(ns)</p>' + (it.length ? '<ul class="lista">' + it.map(function (x) {
          return '<li><a class="linha' + (x.ativo ? '' : ' desativado') + '" href="#/painel/base/' + x.id + '"><span class="num-badge">' + x.id + '</span><span class="corpo"><span class="titulo">' + esc(x.titulo) + '</span>' +
            '<span class="sub">' + esc(x.trecho) + '</span><span class="tags" style="margin-top:6px">' + tagSite(x.site) + (x.revisar ? '<span class="tag aviso">revisar</span>' : '') + (x.ativo ? '' : '<span class="tag neutra">desativado</span>') +
            (ORIGENS[x.origem] ? '<span class="tag neutra">' + ORIGENS[x.origem] + '</span>' : '') + '</span></span><span class="lado">' + relativo(x.atualizado_em) + '</span></a></li>';
        }).join('') + '</ul>' : vazio('Nenhum item encontrado com esses filtros.')) +
          (pags > 1 ? '<div class="paginacao"><button class="btn btn-linha btn-sm" data-p="-1"' + (d.pagina <= 1 ? ' disabled' : '') + '>Anterior</button><span>' + d.pagina + ' de ' + pags + '</span><button class="btn btn-linha btn-sm" data-p="1"' + (d.pagina >= pags ? ' disabled' : '') + '>Próxima</button></div>' : '');
        $$('[data-p]', alvo).forEach(function (b) { b.addEventListener('click', function () { filtroBase.pagina += Number(b.getAttribute('data-p')); carregar(); window.scrollTo({ top: 0, behavior: 'smooth' }); }); });
      }).catch(function (e) { if (e.message !== 'sessao') $('#b-lista').innerHTML = erroBox(e.message); });
    };
    $('#b-q').addEventListener('input', debounce(function () { filtroBase.q = this.value.trim(); filtroBase.pagina = 1; carregar(); }, 350));
    $$('select[data-f]', alvo).forEach(function (s) { s.addEventListener('change', function () { filtroBase[s.getAttribute('data-f')] = s.value; filtroBase.pagina = 1; carregar(); }); });
    $('#b-rev').addEventListener('change', function () { filtroBase.revisar = this.checked; filtroBase.pagina = 1; carregar(); });
    carregar();
  }

  function detalheItem(alvo, id) {
    alvo.innerHTML = voltarLink('#/painel/base', 'Voltar para a base') + carregando();
    api('doc', { id: id }).then(function (r) {
      if (!r.ok) throw new Error(r.erro);
      var d = r.dados;
      alvo.innerHTML = voltarLink('#/painel/base', 'Voltar para a base') +
        '<section class="card reveal"><span class="ghost-num" aria-hidden="true">' + d.id + '</span><div class="card-cab"><h2>Item #' + d.id + '</h2><span class="tags">' + tagSite(d.site) +
        (d.revisar ? '<span class="tag aviso">para revisar</span>' : '') + (d.ativo ? '<span class="tag ok">ativo</span>' : '<span class="tag neutra">desativado</span>') + '</span></div>' +
        '<p class="muted pequeno">Origem: ' + esc(ORIGENS[d.origem] || d.origem || '—') + ' · Criado ' + dataHora(d.criado_em) + (d.atualizado_por ? ' · Última mudança por ' + esc(d.atualizado_por) + ' ' + relativo(d.atualizado_em) : '') + '</p>' +
        '<div id="ed"></div>' +
        '<div class="acoes" style="margin-top:14px">' +
        (d.revisar ? '<button class="btn btn-linha btn-sm" data-op="revisado">Marcar como revisado</button>' : '') +
        (d.ativo ? '<button class="btn btn-perigo btn-sm" data-op="desativar">Desativar</button>' : '<button class="btn btn-linha btn-sm" data-op="restaurar">Restaurar</button>') +
        '</div></section>' +
        '<section class="card leve reveal"><h2>Histórico deste item</h2>' + (d.historico && d.historico.length ? '<ul class="lista">' + d.historico.map(function (x) {
          return '<li><div class="linha"><span class="corpo"><span class="titulo">' + esc(ACOES[x.acao] || x.acao) + (x.desfeito ? ' <span class="tag neutra">desfeito</span>' : '') + '</span><span class="sub">' + esc(/^\d{10,}$/.test(x.quem) ? tel(x.quem) : x.quem) + ' · ' + dataHora(x.quando) + '</span></span></div></li>';
        }).join('') + '</ul><p class="pequeno muted" style="margin-top:12px">Para desfazer uma mudança, use o <a href="#/painel/historico">Histórico</a>.</p>' : vazio('Sem mudanças registradas.')) + '</section>';
      $('#ed').appendChild(editorItem({ id: d.id, titulo: d.titulo === '(sem título)' ? '' : d.titulo, texto: d.texto, site: d.site }, function () { toast('Item salvo.'); detalheItem(alvo, d.id); }));
      $$('[data-op]', alvo).forEach(function (b) {
        b.addEventListener('click', function () {
          var op = b.getAttribute('data-op');
          var seguir = op === 'desativar' ? confirmar('Desativar o item #' + d.id + '?', 'Ele sai das respostas da Aluisia. Você pode restaurar depois.', 'Desativar', true) : Promise.resolve(true);
          seguir.then(function (ok) {
            if (!ok) return;
            ocupado(b, true);
            api('doc_acao', { id: d.id, op: op }).then(function (r) {
              if (!r.ok) { ocupado(b, false); return toast(r.erro, true); }
              toast({ desativar: 'Item desativado.', restaurar: 'Item restaurado.', revisado: 'Marcado como revisado.' }[op]);
              detalheItem(alvo, d.id);
            }).catch(function (e) { ocupado(b, false); falhou(e); });
          });
        });
      });
    }).catch(function (e) { if (e.message !== 'sessao') alvo.innerHTML = voltarLink('#/painel/base', 'Voltar para a base') + erroBox(e.message); });
  }

  function secNovo(alvo) {
    alvo.innerHTML = '<section class="card reveal"><h2>Ensinar algo novo</h2><p class="muted">Um assunto por item. A Aluisia usa o título e o texto para encontrar e responder.</p><div id="ed"></div></section>' +
      '<section class="card leve reveal"><h2>Dicas rápidas</h2><ul><li>Título em forma de pergunta, com as palavras que o aluno usaria.</li><li>Texto que se entende sozinho, com caminhos exatos (ex.: Studeo → Meu Curso → Boletim).</li><li>Nunca coloque dados de um aluno específico.</li><li>Tem muita coisa para colocar? Use <a href="#/painel/importar">Importar conteúdo</a>.</li></ul></section>';
    $('#ed').appendChild(editorItem({ titulo: '', texto: '', site: 'studeo' }, function (id) { toast('Item criado.'); location.hash = '#/painel/base/' + id; }));
  }

  /* ---- Importar ---- */
  var STATUS_IMP = { coletando: ['coletando', 'neutra'], processando: ['processando', 'aviso'], revisao: ['esperando revisão', 'aviso'], salva: ['salva', 'ok'], cancelada: ['cancelada', 'neutra'], desfeita: ['desfeita', 'neutra'] };
  function secImportar(alvo) {
    alvo.innerHTML = '<section class="card reveal"><h2>Mandar muito conteúdo de uma vez</h2>' +
      '<p>Cole o texto abaixo ou carregue um arquivo <strong>.txt</strong> ou <strong>.md</strong>. O texto precisa seguir o <a href="' + MODELO_URL + '" target="_blank" rel="noopener">modelo</a>: cada item começa com <code>## título</code>, pode ter a linha <code>PARA: alunos</code> ou <code>PARA: admins</code>, e o texto vem embaixo.</p>' +
      '<p class="muted pequeno">PDF e Word: mande pelo WhatsApp em /admin → Importar conteúdo, ou copie o texto do arquivo e cole aqui.</p>' +
      '<form class="form" id="f-imp"><label class="campo"><span>Conteúdo</span><textarea class="entrada" name="texto" maxlength="60000" style="min-height:260px" placeholder="## Como vejo minhas notas?&#10;PARA: alunos&#10;No Studeo, entre em Meu Curso → Boletim."></textarea><span class="contador" data-c>0 / 60000</span></label>' +
      '<div class="acoes"><label class="btn btn-linha btn-sm" style="cursor:pointer">' + ICON.mais + 'Carregar arquivo<input type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" hidden id="imp-arq"></label>' +
      '<button class="btn btn-primario" type="submit">Analisar</button></div></form></section>' +
      '<div id="imp-res"></div><section class="card leve reveal"><h2>Importações recentes</h2><div id="imp-lista">' + carregando() + '</div></section>';
    var f = $('#f-imp'), cont = $('[data-c]', f);
    f.texto.addEventListener('input', function () { cont.textContent = f.texto.value.length + ' / 60000'; });
    $('#imp-arq').addEventListener('change', function () {
      var arq = this.files && this.files[0]; if (!arq) return;
      if (arq.size > 400000) { toast('Arquivo grande demais.', true); return; }
      var fr = new FileReader();
      fr.onload = function () { f.texto.value = String(fr.result || '').replace(/^﻿/, '').slice(0, 60000); cont.textContent = f.texto.value.length + ' / 60000'; toast('Arquivo carregado.'); };
      fr.onerror = function () { toast('Não consegui ler o arquivo.', true); };
      fr.readAsText(arq, 'UTF-8');
      this.value = '';
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var t = f.texto.value.trim();
      if (t.length < 20) { toast('Conteúdo muito curto.', true); return; }
      var b = $('button[type=submit]', f); ocupado(b, true);
      var inicio = Date.now();
      $('#imp-res').innerHTML = '<section class="card leve">' + carregando('Analisando…') + '</section>';
      api('importar', { op: 'analisar', texto: t }).then(function (r) {
        ocupado(b, false);
        if (!r.ok) throw new Error(r.erro);
        mostrarRevisao(r.dados);
      }).catch(function (e) {
        ocupado(b, false);
        if (e.message === 'sessao') return;
        if (/Falha de comunicação|Failed to fetch|NetworkError|Load failed/i.test(e.message || '')) return esperarImportacao(inicio);
        $('#imp-res').innerHTML = erroBox(e.message);
      });
    });
    listarImportacoes();
  }
  function esperarImportacao(inicio) {
    var tent = 0;
    $('#imp-res').innerHTML = '<section class="card leve">' + carregando('Ainda processando… vou verificar a cada alguns segundos.') + '</section>';
    var passo = function () {
      tent++;
      api('importar', { op: 'listar' }).then(function (r) {
        var it = (r.dados && r.dados.itens) || [];
        var minha = it.filter(function (x) { return x.quem === (sessao && sessao.nome) && new Date(x.criado_em).getTime() >= inicio - 60000; })[0];
        if (minha && minha.status === 'revisao') return abrirImportacao(minha.id);
        if (minha && minha.status === 'cancelada') { $('#imp-res').innerHTML = erroBox('Não encontrei itens no formato do modelo. Confira se cada item começa com “## ”.'); return; }
        if (tent > 40) { $('#imp-res').innerHTML = erroBox('Demorou mais que o normal. Veja em “Importações recentes” daqui a pouco.'); listarImportacoes(); return; }
        setTimeout(passo, 8000);
      }).catch(function () { if (tent <= 40) setTimeout(passo, 8000); });
    };
    setTimeout(passo, 6000);
  }
  function abrirImportacao(id) {
    $('#imp-res').innerHTML = '<section class="card leve">' + carregando() + '</section>';
    api('importar', { op: 'ver', importacao_id: id }).then(function (r) {
      if (!r.ok) throw new Error(r.erro);
      if (r.dados.status !== 'revisao') throw new Error('Essa importação não está esperando revisão.');
      mostrarRevisao(r.dados);
    }).catch(function (e) { if (e.message !== 'sessao') $('#imp-res').innerHTML = erroBox(e.message); });
  }
  function mostrarRevisao(d) {
    var it = d.itens || [];
    var box = $('#imp-res'); if (!box) return;
    var dups = it.filter(function (x) { return x.dup_id; }).length;
    box.innerHTML = '<section class="card reveal"><div class="card-cab"><h2>' + it.length + ' item(ns) encontrados</h2><span class="tags">' + (dups ? '<span class="tag aviso">' + dups + ' parecido(s) com a base</span>' : '<span class="tag ok">nenhum repetido</span>') + '</span></div>' +
      '<p class="muted">Confira. Desmarque o que não quer salvar. Itens muito parecidos com a base vêm desmarcados.</p>' +
      '<ul class="lista" id="imp-itens">' + it.map(function (x, i) {
        return '<li><label class="linha" style="cursor:pointer"><input type="checkbox" data-i="' + (i + 1) + '"' + (x.dup_id ? '' : ' checked') + ' style="width:20px;height:20px;margin-top:3px;accent-color:var(--accent);flex:none">' +
          '<span class="corpo"><span class="titulo">' + esc(x.titulo) + '</span><span class="sub" style="white-space:pre-wrap">' + esc(x.texto) + '</span>' +
          '<span class="tags" style="margin-top:6px">' + tagSite(x.site) + (x.para ? '<span class="tag neutra">para ' + esc(x.para) + '</span>' : '') +
          (x.dup_id ? '<span class="tag aviso">parecido com #' + x.dup_id + ' (' + Math.round(x.dup_sim * 100) + '%)</span>' : '') + '</span>' +
          (x.dup_id ? '<span class="sub">Já existe: <a href="#/painel/base/' + x.dup_id + '" target="_blank">' + esc(x.dup_titulo) + '</a></span>' : '') + '</span></label></li>';
      }).join('') + '</ul><div class="acoes" style="margin-top:18px"><button class="btn btn-primario" id="imp-salvar" type="button">Salvar selecionados</button><button class="btn btn-linha" id="imp-cancelar" type="button">Descartar análise</button></div></section>';
    var atualizarBtn = function () { var n = $$('#imp-itens input:checked').length; $('#imp-salvar').textContent = 'Salvar ' + n + ' selecionado(s)'; $('#imp-salvar').disabled = !n; };
    $$('#imp-itens input').forEach(function (c) { c.addEventListener('change', atualizarBtn); });
    atualizarBtn();
    $('#imp-cancelar').addEventListener('click', function () { box.innerHTML = ''; toast('Análise descartada. Nada foi salvo.'); });
    $('#imp-salvar').addEventListener('click', function () {
      var sel = $$('#imp-itens input:checked').map(function (c) { return Number(c.getAttribute('data-i')); });
      var b = this; ocupado(b, true);
      api('importar', { op: 'salvar', importacao_id: d.importacao_id, selecionados: sel }).then(function (r) {
        ocupado(b, false);
        if (!r.ok) return toast(r.erro, true);
        box.innerHTML = '<div class="aviso-box info" style="margin-bottom:32px">' + ICON.info + '<div><strong>' + r.dados.salvos + ' item(ns) salvos na base.</strong> Se algo saiu errado, dá para desfazer a importação inteira na lista abaixo.</div></div>';
        var f = $('#f-imp'); if (f) { f.texto.value = ''; $('[data-c]', f).textContent = '0 / 60000'; }
        listarImportacoes();
      }).catch(function (e) { ocupado(b, false); falhou(e); });
    });
  }
  function listarImportacoes() {
    var el = $('#imp-lista'); if (!el) return;
    api('importar', { op: 'listar' }).then(function (r) {
      if (!r.ok) throw new Error(r.erro);
      var it = r.dados.itens || [];
      el.innerHTML = it.length ? '<ul class="lista">' + it.map(function (x) {
        var st = STATUS_IMP[x.status] || [x.status, 'neutra'];
        return '<li><div class="linha"><span class="num-badge">' + x.id + '</span><span class="corpo"><span class="titulo">' + esc(x.quem || '—') + ' · ' + dataHora(x.criado_em) + '</span><span class="sub">' + x.itens + ' item(ns) analisados' + (x.status === 'salva' ? ' · ' + x.quantidade + ' salvos' : '') + '</span>' +
          '<span class="tags" style="margin-top:6px"><span class="tag ' + st[1] + '">' + st[0] + '</span></span></span><span class="acoes">' +
          (x.status === 'revisao' ? '<button class="btn btn-linha btn-sm" data-ver="' + x.id + '">Revisar</button>' : '') +
          (x.status === 'salva' ? '<button class="btn btn-perigo btn-sm" data-desf="' + x.id + '">Desfazer</button>' : '') + '</span></div></li>';
      }).join('') + '</ul>' : vazio('Nenhuma importação ainda.');
      $$('[data-ver]', el).forEach(function (b) { b.addEventListener('click', function () { abrirImportacao(Number(b.getAttribute('data-ver'))); window.scrollTo({ top: 0, behavior: 'smooth' }); }); });
      $$('[data-desf]', el).forEach(function (b) {
        b.addEventListener('click', function () {
          var id = Number(b.getAttribute('data-desf'));
          confirmar('Desfazer a importação ' + id + '?', 'Todos os itens salvos por ela serão desativados.', 'Desfazer', true).then(function (ok) {
            if (!ok) return;
            api('importar', { op: 'desfazer', importacao_id: id }).then(function (r) {
              if (!r.ok) return toast(r.erro, true);
              toast(r.dados.desfeitos + ' item(ns) desativados.'); listarImportacoes();
            }).catch(falhou);
          });
        });
      });
    }).catch(function (e) { if (e.message !== 'sessao') el.innerHTML = erroBox(e.message); });
  }

  /* ---- Conversas ---- */
  var buscaConv = '';
  function secConversas(alvo, telefone) {
    if (telefone) {
      alvo.innerHTML = voltarLink('#/painel/conversas', 'Todas as conversas') + carregando();
      api('conversa', { telefone: telefone }).then(function (r) {
        if (!r.ok) throw new Error(r.erro);
        var m = r.dados.mensagens || [];
        alvo.innerHTML = voltarLink('#/painel/conversas', 'Todas as conversas') + '<section class="card reveal"><div class="card-cab"><h2>' + esc(tel(telefone)) + '</h2><span class="muted pequeno">' + m.length + ' mensagens</span></div>' +
          (m.length ? '<div class="chat" id="chat" style="max-height:70vh">' + m.map(function (x) { return '<div class="bolha ' + (x.papel === 'user' ? 'user' : 'assistant') + '">' + fmtWa(x.texto) + '<span class="hora">' + hora(x.quando) + '</span></div>'; }).join('') + '</div>' : vazio('Sem mensagens guardadas.')) + '</section>';
        var c = $('#chat'); if (c) c.scrollTop = c.scrollHeight;
      }).catch(function (e) { if (e.message !== 'sessao') alvo.innerHTML = voltarLink('#/painel/conversas', 'Todas as conversas') + erroBox(e.message); });
      return;
    }
    alvo.innerHTML = '<section class="card reveal"><h2>Quem falou com a Aluisia</h2><p class="muted pequeno">Últimos 90 dias. Só leitura.</p>' +
      '<div class="busca" style="margin-bottom:16px">' + ICON.busca + '<input class="entrada" type="search" id="c-q" placeholder="Procurar número ou palavra da conversa" value="' + esc(buscaConv) + '" aria-label="Procurar conversas"></div><div id="c-lista">' + carregando() + '</div></section>';
    var carregar = function () {
      api('conversas', { q: buscaConv }).then(function (r) {
        if (!r.ok) throw new Error(r.erro);
        var it = r.dados.itens || [];
        $('#c-lista').innerHTML = it.length ? '<ul class="lista">' + it.map(function (x) {
          return '<li><a class="linha" href="#/painel/conversas/' + encodeURIComponent(x.telefone) + '"><span class="corpo"><span class="titulo">' + esc(tel(x.telefone)) + (x.admin ? ' <span class="tag neutra">admin</span>' : '') + '</span>' +
            '<span class="sub">' + esc(x.ultima_pergunta || '') + '</span></span><span class="lado">' + relativo(x.ultima) + '<br>' + x.mensagens + ' msg</span></a></li>';
        }).join('') + '</ul>' : vazio('Nenhuma conversa encontrada.');
      }).catch(function (e) { if (e.message !== 'sessao') $('#c-lista').innerHTML = erroBox(e.message); });
    };
    $('#c-q').addEventListener('input', debounce(function () { buscaConv = this.value.trim(); carregar(); }, 400));
    carregar();
  }

  /* ---- Histórico ---- */
  function secHistorico(alvo) {
    var pagina = 1;
    alvo.innerHTML = '<section class="card reveal"><h2>Tudo o que foi feito</h2><p class="muted pequeno">Mudanças na base podem ser desfeitas. Se o item mudou de novo depois, desfaça primeiro a mais recente.</p><div id="h-lista">' + carregando() + '</div></section>';
    var carregar = function () {
      api('auditoria', { pagina: pagina }).then(function (r) {
        if (!r.ok) throw new Error(r.erro);
        var it = r.dados.itens || [];
        $('#h-lista').innerHTML = (it.length ? '<ul class="lista">' + it.map(function (x) {
          var det = x.detalhe || {};
          var extra = x.titulo ? esc(corta(x.titulo, 90)) : (det.codigo ? 'Dúvida #' + esc(det.codigo) : (det.importacao_id ? 'Importação ' + esc(det.importacao_id) + (det.quantidade != null ? ' · ' + esc(det.quantidade) + ' item(ns)' : '') : ''));
          return '<li><div class="linha"><span class="corpo"><span class="titulo">' + esc(ACOES[x.acao] || x.acao) + (x.documento_id ? ' <a href="#/painel/base/' + x.documento_id + '">#' + x.documento_id + '</a>' : '') + (x.desfeito ? ' <span class="tag neutra">desfeito</span>' : '') + '</span>' +
            (extra ? '<span class="sub">' + extra + '</span>' : '') + '<span class="sub">' + esc(/^\d{10,}$/.test(x.quem) ? tel(x.quem) : x.quem) + ' · ' + dataHora(x.quando) + (det.canal ? ' · pelo ' + esc(det.canal) : '') + '</span></span>' +
            (x.pode_desfazer ? '<span><button class="btn btn-linha btn-sm" data-d="' + x.id + '">Desfazer</button></span>' : '') + '</div></li>';
        }).join('') + '</ul>' : vazio('Nada registrado.')) +
          '<div class="paginacao"><button class="btn btn-linha btn-sm" data-p="-1"' + (pagina <= 1 ? ' disabled' : '') + '>Mais recentes</button><span>Página ' + pagina + '</span><button class="btn btn-linha btn-sm" data-p="1"' + (it.length < 50 ? ' disabled' : '') + '>Mais antigas</button></div>';
        $$('[data-p]', alvo).forEach(function (b) { b.addEventListener('click', function () { pagina += Number(b.getAttribute('data-p')); carregar(); window.scrollTo({ top: 0, behavior: 'smooth' }); }); });
        $$('[data-d]', alvo).forEach(function (b) {
          b.addEventListener('click', function () {
            confirmar('Desfazer esta ação?', 'O item volta a ficar como estava antes dela.', 'Desfazer').then(function (ok) {
              if (!ok) return;
              ocupado(b, true);
              api('desfazer', { id: Number(b.getAttribute('data-d')) }).then(function (r) {
                if (!r.ok) { ocupado(b, false); return toast(r.erro, true); }
                toast('Ação desfeita.'); carregar();
              }).catch(function (e) { ocupado(b, false); falhou(e); });
            });
          });
        });
      }).catch(function (e) { if (e.message !== 'sessao') $('#h-lista').innerHTML = erroBox(e.message); });
    };
    carregar();
  }

  /* ---- Configurações ---- */
  function secConfig(alvo) {
    alvo.innerHTML = carregando();
    api('config').then(function (r) {
      if (!r.ok) throw new Error(r.erro);
      desenharConfig(alvo, r.dados);
    }).catch(function (e) { if (e.message !== 'sessao') alvo.innerHTML = erroBox(e.message); });
  }
  function desenharConfig(alvo, c) {
    alvo.innerHTML =
      '<section class="card numerado reveal"><span class="ghost-num" aria-hidden="true">01</span><span class="index" aria-hidden="true">1</span><h2>Senha de funcionário</h2>' +
      '<p class="muted">É o nome de um animal. Os funcionários entram com <code>/login</code> e essa senha. Maiúsculas não fazem diferença.</p>' +
      '<div class="acoes" style="margin-bottom:12px"><span class="contact-box" style="display:inline-flex;align-items:center;gap:10px;padding:10px 16px;border:2px solid var(--accent);border-radius:12px;background:var(--bg)"><strong id="senha-v" style="font-size:1.2rem;letter-spacing:.04em">••••••</strong>' +
      '<button type="button" class="btn btn-linha btn-icone" id="senha-olho" aria-label="Mostrar senha" style="width:34px;height:34px">' + ICON.olho + '</button><button type="button" class="btn btn-linha btn-icone" id="senha-cp" aria-label="Copiar senha" style="width:34px;height:34px">' + ICON.copiar + '</button></span>' +
      '<span class="muted pequeno">Trocada ' + relativo(c.senha_trocada_em) + '</span></div>' +
      '<div class="acoes" style="margin-bottom:18px"><button class="btn btn-primario btn-sm" id="senha-gerar">Sortear outro animal</button></div>' +
      '<form class="linha-form" id="f-senha"><label class="campo"><span>Ou escolha uma</span><input class="entrada" name="senha" maxlength="30" placeholder="ex.: tucano" autocomplete="off"></label><button class="btn btn-linha" type="submit">Definir</button></form>' +
      '<hr style="border:0;border-top:1px solid var(--line);margin:22px 0">' +
      '<label class="switch"><input type="checkbox" id="rot"' + (c.senha_rotacao_auto ? ' checked' : '') + '><span class="trilho"></span>Trocar sozinha</label>' +
      '<form class="linha-form" id="f-int" style="margin-top:14px"><label class="campo" style="max-width:220px"><span>A cada quantos dias</span><input class="entrada" type="number" name="dias" min="7" max="365" value="' + c.senha_intervalo_dias + '"></label><button class="btn btn-linha" type="submit">Salvar</button></form>' +
      '<p class="pequeno muted" style="margin-top:10px">Quando troca sozinha, você e o Allan recebem a senha nova no WhatsApp às 08:00.</p></section>' +

      '<section class="card numerado reveal"><span class="ghost-num" aria-hidden="true">02</span><span class="index" aria-hidden="true">2</span><h2>Atendimento</h2>' +
      '<label class="switch"><input type="checkbox" id="manut"' + (c.modo_manutencao ? ' checked' : '') + '><span class="trilho"></span>Modo manutenção</label>' +
      '<p class="pequeno muted" style="margin:8px 0 18px">Ligado, a Aluisia não responde alunos com a IA; manda a mensagem abaixo.</p>' +
      '<form class="form" data-chave="mensagem_manutencao"><label class="campo"><span>Mensagem de manutenção</span><textarea class="entrada" name="valor" maxlength="900" style="min-height:90px">' + esc(c.mensagem_manutencao) + '</textarea></label><div class="acoes"><button class="btn btn-linha btn-sm" type="submit">Salvar mensagem</button></div></form>' +
      '<form class="form" data-chave="mensagem_privacidade" style="margin-top:20px"><label class="campo"><span>Aviso de privacidade (primeira mensagem de cada número)</span><textarea class="entrada" name="valor" maxlength="900" style="min-height:90px">' + esc(c.mensagem_privacidade) + '</textarea></label><div class="acoes"><button class="btn btn-linha btn-sm" type="submit">Salvar aviso</button></div></form></section>' +

      '<section class="card numerado reveal"><span class="ghost-num" aria-hidden="true">03</span><span class="index" aria-hidden="true">3</span><h2>Sensibilidade da busca</h2>' +
      '<p class="muted">Mais alto: usa menos itens e cria mais dúvidas. Mais baixo: usa mais itens, com risco de trazer assunto errado. Padrão: 0,30.</p>' +
      '<form class="linha-form" id="f-lim"><label class="campo"><span>Valor: <strong id="lim-v">' + Number(c.limiar_busca).toFixed(2) + '</strong></span><input class="entrada" type="range" name="lim" min="0.10" max="0.80" step="0.01" value="' + c.limiar_busca + '"></label><button class="btn btn-linha" type="submit">Salvar</button></form>' +
      '<p class="pequeno muted" style="margin-top:10px">Para conferir o efeito, teste pelo WhatsApp: <code>/admin</code> → Qualidade → Testar pergunta.</p></section>' +

      '<section class="card numerado reveal"><span class="ghost-num" aria-hidden="true">04</span><span class="index" aria-hidden="true">4</span><h2>Modelos da Meta</h2>' +
      '<p class="muted">Usados para mandar avisos a quem não fala com a Aluisia há mais de 24 horas.</p><ul class="lista">' +
      '<li><div class="linha"><span class="corpo"><span class="titulo">aviso_admin</span><span class="sub">Avisos de dúvida, senha nova e alertas para os admins</span></span>' + (c.template_aviso_ativo ? '<span class="tag ok">ligado</span>' : '<span class="tag aviso">aguardando</span>') + '</div></li>' +
      '<li><div class="linha"><span class="corpo"><span class="titulo">codigo_login</span><span class="sub">Código de entrada deste site</span></span>' + (c.template_codigo_ativo ? '<span class="tag ok">ligado</span>' : '<span class="tag aviso">aguardando</span>') + '</div></li></ul>' +
      '<p class="pequeno muted" style="margin-top:12px">Enquanto estiverem aguardando, mande um “oi” para a Aluisia uma vez por dia para receber os avisos.</p></section>';

    var salvar = function (chave, valor, msg, depois) {
      return api('config_salvar', { chave: chave, valor: String(valor) }).then(function (r) {
        if (!r.ok) { toast(r.erro, true); return false; }
        toast(msg || 'Salvo.'); if (depois) depois(r.dados); return true;
      }).catch(function (e) { falhou(e); return false; });
    };
    var senhaVis = false, senhaAtual = c.senha_funcionario;
    var pintaSenha = function () { $('#senha-v').textContent = senhaVis ? senhaAtual : '••••••'; };
    $('#senha-olho').addEventListener('click', function () { senhaVis = !senhaVis; pintaSenha(); });
    $('#senha-cp').addEventListener('click', function () { copiar(senhaAtual, 'Senha copiada.'); });
    var trocou = function (r) {
      if (!r.ok) return toast(r.erro, true);
      senhaAtual = r.dados.senha_funcionario; senhaVis = true; pintaSenha();
      toast('Senha trocada. Avise a equipe.');
    };
    $('#senha-gerar').addEventListener('click', function () {
      var b = this;
      confirmar('Sortear outra senha?', 'A senha atual deixa de valer agora. Quem já está logado continua até sair.', 'Sortear').then(function (ok) {
        if (!ok) return; ocupado(b, true);
        api('senha', { op: 'gerar' }).then(function (r) { ocupado(b, false); trocou(r); }).catch(function (e) { ocupado(b, false); falhou(e); });
      });
    });
    $('#f-senha').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = this.senha.value.trim().toLowerCase(), fm = this;
      if (v.length < 3 || /\s/.test(v)) return toast('Use pelo menos 3 letras, sem espaço.', true);
      api('senha', { op: 'definir', senha: v }).then(function (r) { trocou(r); if (r.ok) fm.senha.value = ''; }).catch(falhou);
    });
    $('#rot').addEventListener('change', function () { var el = this; salvar('senha_funcionario_rotacao_automatica', el.checked, el.checked ? 'Troca automática ligada.' : 'Troca automática desligada.').then(function (ok) { if (!ok) el.checked = !el.checked; }); });
    $('#f-int').addEventListener('submit', function (e) { e.preventDefault(); salvar('senha_funcionario_intervalo_dias', this.dias.value, 'Intervalo salvo.'); });
    $('#manut').addEventListener('change', function () {
      var el = this, ligar = el.checked;
      (ligar ? confirmar('Ligar o modo manutenção?', 'A Aluisia para de responder alunos com a IA até você desligar.', 'Ligar', true) : Promise.resolve(true)).then(function (ok) {
        if (!ok) { el.checked = !ligar; return; }
        salvar('modo_manutencao', ligar, ligar ? 'Modo manutenção ligado.' : 'Modo manutenção desligado.').then(function (s) { if (!s) el.checked = !ligar; });
      });
    });
    $$('form[data-chave]', alvo).forEach(function (fm) {
      fm.addEventListener('submit', function (e) { e.preventDefault(); salvar(fm.getAttribute('data-chave'), fm.valor.value.trim(), 'Mensagem salva.'); });
    });
    var lim = $('#f-lim');
    lim.lim.addEventListener('input', function () { $('#lim-v').textContent = Number(this.value).toFixed(2); });
    lim.addEventListener('submit', function (e) { e.preventDefault(); salvar('limiar_busca', Number(lim.lim.value).toFixed(2), 'Sensibilidade salva.'); });
  }

  /* ---- Acesso ---- */
  function secAcesso(alvo) {
    alvo.innerHTML = carregando();
    api('acesso').then(function (r) {
      if (!r.ok) throw new Error(r.erro);
      desenharAcesso(alvo, r.dados);
    }).catch(function (e) { if (e.message !== 'sessao') alvo.innerHTML = erroBox(e.message); });
  }
  function desenharAcesso(alvo, d) {
    var eu = sessao && sessao.telefone;
    var meuTotp = (d.admins || []).some(function (a) { return a.telefone === eu && a.totp; });
    alvo.innerHTML =
      '<section class="card numerado reveal"><span class="ghost-num" aria-hidden="true">01</span><span class="index" aria-hidden="true">1</span><h2>Admins</h2><ul class="lista">' +
      (d.admins || []).map(function (a) {
        return '<li><div class="linha' + (a.ativo ? '' : ' desativado') + '"><span class="corpo"><span class="titulo">' + esc(a.nome || '—') + (a.telefone === eu ? ' <span class="tag neutra">você</span>' : '') + '</span><span class="sub">' + esc(tel(a.telefone)) + '</span>' +
          '<span class="tags" style="margin-top:6px">' + (a.ativo ? '<span class="tag ok">ativo</span>' : '<span class="tag neutra">removido</span>') + (a.totp ? '<span class="tag ok">autenticador</span>' : '<span class="tag neutra">sem autenticador</span>') + '</span></span>' +
          (a.ativo ? '<span class="acoes" style="flex-direction:column;align-items:flex-end"><label class="switch pequeno"><input type="checkbox" data-av="' + esc(a.telefone) + '"' + (a.recebe_avisos ? ' checked' : '') + '><span class="trilho"></span>Avisos</label>' +
          (a.telefone !== eu ? '<button class="btn btn-perigo btn-sm" data-rm="' + esc(a.telefone) + '" data-nome="' + esc(a.nome) + '">Remover</button>' : '') + '</span>' : '') + '</div></li>';
      }).join('') + '</ul>' +
      '<h3>Adicionar admin</h3><form class="linha-form" id="f-adm"><label class="campo"><span>Nome</span><input class="entrada" name="nome" maxlength="60" autocomplete="off"></label><label class="campo"><span>WhatsApp com DDD</span><input class="entrada" name="telefone" inputmode="tel" maxlength="20" placeholder="(81) 99999-9999"></label><button class="btn btn-primario" type="submit">Adicionar</button></form></section>' +

      '<section class="card numerado reveal"><span class="ghost-num" aria-hidden="true">02</span><span class="index" aria-hidden="true">2</span><h2>Seu autenticador</h2>' +
      '<p>' + (meuTotp ? '<span class="tag ok">configurado</span> Você pode entrar digitando o código do app. Configurar de novo troca o código.' : 'Com o app autenticador (Google Authenticator, Microsoft Authenticator…) você entra sem esperar o código do WhatsApp.') + '</p>' +
      '<div id="totp-area"><button class="btn btn-primario" id="totp-novo" type="button">' + (meuTotp ? 'Configurar de novo' : 'Configurar autenticador') + '</button></div></section>' +

      '<section class="card numerado reveal"><span class="ghost-num" aria-hidden="true">03</span><span class="index" aria-hidden="true">3</span><h2>Aparelhos com o painel aberto</h2>' +
      ((d.sessoes_site || []).length ? '<ul class="lista">' + d.sessoes_site.map(function (s) {
        return '<li><div class="linha"><span class="corpo"><span class="titulo">' + esc(s.nome || '—') + ' <span class="tag neutra">' + esc(s.metodo === 'totp' ? 'autenticador' : 'código WhatsApp') + '</span></span><span class="sub">Entrou ' + dataHora(s.criado_em) + ' · usado ' + relativo(s.ultimo_uso) + '</span></span><button class="btn btn-linha btn-sm" data-es="' + s.id + '">Encerrar</button></div></li>';
      }).join('') + '</ul><p class="pequeno muted" style="margin-top:10px">A sessão deste aparelho não pode ser encerrada aqui; para ela, use Sair.</p>' : vazio('Nenhuma.')) + '</section>' +

      '<section class="card numerado reveal"><span class="ghost-num" aria-hidden="true">04</span><span class="index" aria-hidden="true">4</span><h2>Logins no WhatsApp</h2>' +
      ((d.sessoes_whatsapp || []).length ? '<ul class="lista">' + d.sessoes_whatsapp.map(function (s) {
        return '<li><div class="linha"><span class="corpo"><span class="titulo">' + esc(tel(s.telefone)) + ' <span class="tag neutra">' + esc(s.como || s.papel) + '</span></span><span class="sub">Desde ' + dataHora(s.desde) + ' · até ' + dataHora(s.expira_em) + '</span></span><button class="btn btn-linha btn-sm" data-ew="' + s.id + '">Encerrar</button></div></li>';
      }).join('') + '</ul>' : vazio('Ninguém logado com /login agora.')) + '</section>' +

      '<section class="card numerado reveal"><span class="ghost-num" aria-hidden="true">05</span><span class="index" aria-hidden="true">5</span><h2>Bloqueios</h2><p class="muted pequeno">Números que erraram a senha 5 vezes em 15 minutos.</p>' +
      ((d.bloqueios || []).length ? '<ul class="lista">' + d.bloqueios.map(function (b) {
        return '<li><div class="linha"><span class="corpo"><span class="titulo">' + esc(tel(b.telefone)) + '</span><span class="sub">' + b.falhas + ' erros · último ' + relativo(b.ultima) + '</span></span><button class="btn btn-primario btn-sm" data-lb="' + esc(b.telefone) + '">Liberar</button></div></li>';
      }).join('') + '</ul>' : vazio('Nenhum número bloqueado.')) + '</section>';

    var acao = function (dados, msg) {
      return api('acesso_acao', dados).then(function (r) {
        if (!r.ok) { toast(r.erro, true); return; }
        toast(msg); desenharAcesso(alvo, r.dados);
      }).catch(falhou);
    };
    $$('[data-av]', alvo).forEach(function (c) { c.addEventListener('change', function () { acao({ op: 'avisos', telefone: c.getAttribute('data-av'), valor: c.checked }, c.checked ? 'Avisos ligados.' : 'Avisos desligados.'); }); });
    $$('[data-rm]', alvo).forEach(function (b) {
      b.addEventListener('click', function () {
        confirmar('Remover ' + b.getAttribute('data-nome') + '?', 'Esse número perde o acesso ao painel no WhatsApp e neste site.', 'Remover', true).then(function (ok) { if (ok) acao({ op: 'remover_admin', telefone: b.getAttribute('data-rm') }, 'Admin removido.'); });
      });
    });
    $('#f-adm').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = this;
      confirmar('Adicionar ' + f.nome.value.trim() + '?', 'Esse número terá acesso completo ao painel da Aluisia.', 'Adicionar').then(function (ok) { if (ok) acao({ op: 'adicionar_admin', nome: f.nome.value.trim(), telefone: f.telefone.value }, 'Admin adicionado.'); });
    });
    $$('[data-es]', alvo).forEach(function (b) { b.addEventListener('click', function () { acao({ op: 'encerrar_site', id: Number(b.getAttribute('data-es')) }, 'Pronto.'); }); });
    $$('[data-ew]', alvo).forEach(function (b) { b.addEventListener('click', function () { acao({ op: 'encerrar_whatsapp', id: Number(b.getAttribute('data-ew')) }, 'Login encerrado.'); }); });
    $$('[data-lb]', alvo).forEach(function (b) { b.addEventListener('click', function () { acao({ op: 'liberar', telefone: b.getAttribute('data-lb') }, 'Número liberado.'); }); });
    $('#totp-novo').addEventListener('click', function () {
      var b = this; ocupado(b, true);
      api('totp', { op: 'novo' }).then(function (r) {
        if (!r.ok) { ocupado(b, false); return toast(r.erro, true); }
        var area = $('#totp-area');
        area.innerHTML = '<ol><li>Abra o app autenticador e toque em <strong>+</strong>.</li><li>Leia o QR code abaixo (ou digite a chave).</li><li>Digite o código de 6 dígitos que aparecer.</li></ol>' +
          '<div style="display:flex;flex-wrap:wrap;gap:20px;align-items:center;margin:10px 0 16px"><div id="qr" style="padding:12px;background:white;border:2px solid var(--line);border-radius:12px;width:196px;height:196px"></div>' +
          '<div><span class="rotulo-campo">Chave</span><br><code style="word-break:break-all;font-size:.95rem">' + esc(r.dados.segredo.replace(/(.{4})/g, '$1 ').trim()) + '</code><br><button type="button" class="btn btn-linha btn-sm" id="totp-cp" style="margin-top:8px">' + ICON.copiar + 'Copiar chave</button>' +
          '<br><a class="btn btn-linha btn-sm" style="margin-top:8px" href="' + esc(r.dados.uri) + '">Abrir no app deste celular</a></div></div>' +
          '<form class="linha-form" id="f-totp"><label class="campo" style="max-width:220px"><span>Código do app</span><input class="entrada" name="codigo" inputmode="numeric" maxlength="7" autocomplete="one-time-code" placeholder="000000"></label><button class="btn btn-primario" type="submit">Confirmar</button></form>';
        $('#totp-cp').addEventListener('click', function () { copiar(r.dados.segredo, 'Chave copiada.'); });
        desenharQr($('#qr'), r.dados.uri);
        $('#f-totp').addEventListener('submit', function (e) {
          e.preventDefault();
          var cod = this.codigo.value.replace(/\D/g, ''), bt = $('button', this);
          if (cod.length !== 6) return toast('Digite os 6 dígitos.', true);
          ocupado(bt, true);
          api('totp', { op: 'confirmar', codigo: cod }).then(function (r2) {
            ocupado(bt, false);
            if (!r2.ok) return toast(r2.erro, true);
            toast('Autenticador configurado!'); secAcesso(alvo);
          }).catch(function (e2) { ocupado(bt, false); falhou(e2); });
        });
      }).catch(function (e) { ocupado(b, false); falhou(e); });
    });
  }
  function desenharQr(el, texto) {
    var fazer = function () { try { el.innerHTML = ''; new window.QRCode(el, { text: texto, width: 168, height: 168, colorDark: '#0f172a', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M }); } catch (e) { el.innerHTML = '<p class="pequeno muted">Use a chave ao lado.</p>'; } };
    if (window.QRCode) return fazer();
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload = fazer; s.onerror = function () { el.innerHTML = '<p class="pequeno muted">Use a chave ao lado.</p>'; };
    document.head.appendChild(s);
  }

  /* ---------------- documentação ---------------- */
  var docsCache = null;
  function viewDocs(topicoId) {
    var jaNaTela = $('#docs-main');
    if (jaNaTela && docsCache) { abrirTopico(topicoId); return; }
    view.innerHTML = '<header class="hero compacto"><div class="hero-inner"><div style="display:flex;align-items:center;gap:16px;margin-bottom:18px"><img class="mascote-avatar" src="img/aluisia-avatar.webp" alt="" width="64" height="64"><p class="pill">' + ICON.livro + 'Para o Aluísio e o Allan</p></div>' +
      '<h1>Documentação <em>completa</em></h1><p class="hero-sub">Tudo sobre como a Aluisia funciona e como cuidar dela. Procure por qualquer palavra.</p>' +
      '<div class="doc-busca"><div class="busca">' + ICON.busca + '<input class="entrada" type="search" id="d-q" placeholder="Ex.: senha, dúvida, importar, código não chegou" aria-label="Procurar na documentação" autocomplete="off"></div><p class="resumo-busca" id="d-res" aria-live="polite"></p></div></div></header>' +
      '<div class="shell"><nav class="toc" aria-label="Módulos"><p class="toc-title">MÓDULOS</p><div class="toc-body"><div class="progress-track"><div class="progress-fill"></div></div><ol id="d-toc"></ol></div></nav>' +
      '<main class="conteudo" id="docs-main"><nav class="chips-nav" id="d-chips" aria-label="Módulos"></nav><div id="d-corpo">' + carregando('Carregando a documentação…') + '</div></main></div>';
    var montar = function () { desenharDocs(); abrirTopico(topicoId); };
    if (docsCache) return montar();
    api('documentacao').then(function (r) {
      if (!r.ok) throw new Error(r.erro);
      docsCache = r.dados.topicos || [];
      montar();
    }).catch(function (e) { if (e.message !== 'sessao') $('#d-corpo').innerHTML = erroBox(e.message); });
  }
  function modulosDe(topicos) {
    var mods = [], idx = {};
    topicos.forEach(function (t) {
      if (!idx[t.modulo]) { idx[t.modulo] = { nome: t.modulo, ordem: t.modulo_ordem, topicos: [] }; mods.push(idx[t.modulo]); }
      idx[t.modulo].topicos.push(t);
    });
    return mods;
  }
  function slug(t) { return semAcento(t).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function desenharDocs() {
    var mods = modulosDe(docsCache);
    $('#d-toc').innerHTML = mods.map(function (m, i) { return '<li><a href="#mod-' + slug(m.nome) + '" data-mod="' + slug(m.nome) + '"><span class="num">' + num2(i) + '</span>' + esc(m.nome) + '</a></li>'; }).join('');
    $('#d-chips').innerHTML = mods.map(function (m) { return '<a href="#mod-' + slug(m.nome) + '" data-mod="' + slug(m.nome) + '">' + esc(m.nome) + '</a>'; }).join('');
    $('#d-corpo').innerHTML = '<p class="intro">São ' + mods.length + ' módulos. Toque num assunto para abrir. Para ensinar os funcionários, use o <a href="equipe-aluisia-7q4m.html" target="_blank" rel="noopener">guia rápido da equipe</a> (não mostra a senha).</p><div class="sections">' +
      mods.map(function (m, i) {
        return '<section class="card numerado modulo reveal" id="mod-' + slug(m.nome) + '"><span class="ghost-num" aria-hidden="true">' + num2(i) + '</span><span class="index" aria-hidden="true">' + (i + 1) + '</span><h2>' + esc(m.nome) + '</h2>' +
          m.topicos.map(function (t) {
            return '<details class="topico" id="t-' + esc(t.id) + '" data-id="' + esc(t.id) + '"><summary><span class="t-tit">' + esc(t.titulo) + '</span></summary><div class="topico-corpo">' + t.conteudo +
              '<p style="margin-top:12px"><a href="#/docs/' + esc(t.id) + '" class="link-topico" data-copiar="' + esc(t.id) + '">' + ICON.link + ' Copiar link deste assunto</a></p></div></details>';
          }).join('') + '</section>';
      }).join('') + '</div>';
    // índice de busca
    docsCache.forEach(function (t) {
      var tmp = document.createElement('div'); tmp.innerHTML = t.conteudo;
      t._busca = semAcento(t.titulo + ' ' + (t.palavras || '') + ' ' + t.modulo + ' ' + tmp.textContent);
    });
    // âncoras dos módulos sem mexer no roteador
    $$('[data-mod]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var alvo = document.getElementById('mod-' + a.getAttribute('data-mod'));
        if (alvo) window.scrollTo({ top: alvo.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
      });
    });
    $$('[data-copiar]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        copiar(location.origin + location.pathname + '#/docs/' + a.getAttribute('data-copiar'), 'Link copiado.');
      });
    });
    $('#d-q').addEventListener('input', debounce(function () { filtrarDocs(this.value); }, 180));
    observarModulos();
  }
  function filtrarDocs(q) {
    var termos = semAcento(q).split(/\s+/).filter(function (x) { return x.length > 1; });
    var n = 0;
    docsCache.forEach(function (t) {
      var el = document.getElementById('t-' + t.id); if (!el) return;
      var tit = $('.t-tit', el);
      if (!termos.length) { el.classList.remove('escondido'); el.open = false; tit.innerHTML = esc(t.titulo); return; }
      var ok = termos.every(function (x) { return t._busca.indexOf(x) >= 0; });
      el.classList.toggle('escondido', !ok);
      el.open = ok && termos.length > 0;
      tit.innerHTML = ok ? marcar(t.titulo, termos) : esc(t.titulo);
      if (ok) n++;
    });
    $$('section.modulo').forEach(function (s) { s.classList.toggle('escondido', !$$('details.topico:not(.escondido)', s).length); });
    $$('[data-mod]').forEach(function (a) { var s = document.getElementById('mod-' + a.getAttribute('data-mod')); a.classList.toggle('escondido', !!(s && s.classList.contains('escondido'))); });
    $('#d-res').textContent = termos.length ? (n ? n + ' assunto(s) encontrados' : 'Nada encontrado. Tente outra palavra.') : '';
  }
  function marcar(texto, termos) {
    var base = semAcento(texto), marcas = [];
    termos.forEach(function (t) { var i = base.indexOf(t); while (i >= 0) { marcas.push([i, i + t.length]); i = base.indexOf(t, i + t.length); } });
    if (!marcas.length) return esc(texto);
    marcas.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', pos = 0;
    marcas.forEach(function (m) { if (m[0] < pos) return; out += esc(texto.slice(pos, m[0])) + '<mark>' + esc(texto.slice(m[0], m[1])) + '</mark>'; pos = m[1]; });
    return out + esc(texto.slice(pos));
  }
  function abrirTopico(id) {
    if (!id) return;
    var el = document.getElementById('t-' + id);
    if (!el) return;
    el.open = true;
    setTimeout(function () { window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' }); }, 60);
  }
  var obsModulos = null;
  function observarModulos() {
    if (!('IntersectionObserver' in window)) return;
    if (obsModulos) obsModulos.disconnect();
    obsModulos = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id.replace('mod-', '');
        $$('[data-mod]').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-mod') === id); });
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    $$('section.modulo').forEach(function (s) { obsModulos.observe(s); });
  }

  /* ---------------- rolagem ---------------- */
  var wrapTop = $('#back-to-top-wrap'), ring = $('#ring-fg'), CIRC = 2 * Math.PI * 28;
  var aoRolar = function () {
    var de = document.documentElement, sc = de.scrollHeight - de.clientHeight;
    var pct = sc > 0 ? Math.min(100, Math.max(0, de.scrollTop / sc * 100)) : 0;
    ring.style.strokeDashoffset = CIRC - CIRC * pct / 100;
    $$('.progress-fill').forEach(function (p) { p.style.height = pct + '%'; });
    wrapTop.classList.toggle('visible', window.scrollY > 480 && !!token);
  };
  window.addEventListener('scroll', aoRolar, { passive: true });
  $('#back-to-top').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------------- início do app ---------------- */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  if (token) {
    $('#gate-form').hidden = true;
    var sp = document.createElement('span'); sp.className = 'spin'; sp.style.cssText = 'color:white;width:28px;height:28px'; sp.id = 'gate-spin';
    $('#gate').appendChild(sp);
    api('sessao').then(function (r) {
      var s = $('#gate-spin'); if (s) s.remove();
      $('#gate-form').hidden = false;
      if (r.ok) { sessao = r.dados; entrar(); } else { sair(true); }
    }).catch(function () {
      var s = $('#gate-spin'); if (s) s.remove();
      $('#gate-form').hidden = false;
      if (token) { toast('Sem conexão com o servidor. Tente de novo.', true); }
      gateInput.focus();
    });
  } else {
    setTimeout(function () { gateInput.focus(); }, 50);
  }
})();
