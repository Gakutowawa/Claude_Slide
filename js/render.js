/* ══════════════════════════════════════════════════════════
   RENDER ── DECK.slides を DOM に組み立てる
   ここは基本的に触らない。版面ルールを変えたいときだけ触る。
   ══════════════════════════════════════════════════════════ */
(function(){
  var D = window.DECK, cfg = D.config || {};
  var root = document.getElementById('deck');
  var page = 0;
  var PHASE = { sora:'空', ame:'雨', kasa:'傘', base:'前提' };

  D.slides.forEach(function(s){
    var el = document.createElement('section');
    el.className = 'slide' + (s.kind ? ' slide--'+s.kind : '');
    el.id = s.id || '';

    /* ── 表紙 ────────────────────────────────────── */
    if(s.kind === 'cover'){
      el.innerHTML = '<div class="cover__rule"></div>'
        + '<h1 class="cover__title">'+s.title+'</h1>'
        + (s.sub ? '<p class="cover__sub">'+s.sub+'</p>' : '')
        + '<div class="cover__meta">'+(s.meta||'')+'</div>';
      root.appendChild(el); return;
    }

    /* ── 中扉 ────────────────────────────────────── */
    if(s.kind === 'divider'){
      el.innerHTML = '<div class="divider__no">'+(s.no||'')+'</div>'
        + '<div class="divider__title">'+s.title+'</div>'
        + (s.sub ? '<div class="divider__sub">'+s.sub+'</div>' : '');
      root.appendChild(el); return;
    }

    /* ── 通常スライド ────────────────────────────── */
    var phase = s.phase
      ? '<span class="phase phase--'+s.phase+'">'+(PHASE[s.phase]||s.phase)+'</span>' : '';

    var body = (s.body||[]).map(function(b){
      var fn = BLOCK[b.type];
      var html = fn ? fn(b) : '<div class="card card--alert">未定義のブロック: '+b.type+'</div>';
      var w = 'w' + (b.w || 12);
      return '<div class="'+w+'" style="display:flex;flex-direction:column">'+html+'</div>';
    }).join('');

    var notes = (s.note ? (Array.isArray(s.note) ? s.note : [s.note]) : [])
      .map(function(n){ return '<p>'+n+'</p>'; }).join('');

    page += 1;
    el.innerHTML =
      '<header class="slide__head">'
      +   '<div class="slide__title">'+phase+(s.title||'')+'</div>'
      +   (s.message ? '<div class="slide__msg">'+s.message+'</div>' : '')
      + '</header>'
      + '<div class="slide__body'+(s.fill===false?'':' slide__body--fill')+'">'+body+'</div>'
      + '<footer class="slide__foot"><div class="src">'+notes+'</div>'
      +   '<div class="pageno">'+page+'</div></footer>';

    root.appendChild(el);
  });

  /* ── はみ出し検知 ──────────────────────────────
     720px に収まらないスライドを赤枠＋コンソールで警告する。
     内容を足したときの事故を防ぐための開発用チェック。      */
  var over = [];
  document.querySelectorAll('.slide').forEach(function(el){
    var b = el.querySelector('.slide__body');
    if(b && b.scrollHeight > b.clientHeight + 2){
      el.classList.add('is-overflow');
      over.push((el.querySelector('.slide__title')||{}).textContent || el.id);
    }
  });
  if(over.length) console.warn('【要調整】内容が枠からはみ出しているスライド:', over);

  /* 画面右下の目安表示（印刷時は非表示） */
  var bar = document.createElement('div');
  bar.className = 'toolbar';
  bar.innerHTML = '<b>'+D.slides.length+'</b> slides / 本編 <b>'+page+'</b> ページ　'
    + '<span style="opacity:.7">印刷 → PDFで書き出し</span>';
  document.body.appendChild(bar);
})();
