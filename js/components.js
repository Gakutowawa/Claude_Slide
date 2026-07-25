/* ══════════════════════════════════════════════════════════
   COMPONENTS ── データ（data/*.js）を HTML に変換する部品
   新しい図表を足したいときは
     ① ここに BLOCK.xxx = function(b){ return '<div>…</div>' } を追加
     ② css/04-charts.css にスタイルを追加
     ③ data 側で {type:'xxx', …} と書く
   ══════════════════════════════════════════════════════════ */

var BLOCK = {};

/* ── 共通ヘルパ ─────────────────────────────────────── */
function esc(s){ return String(s==null?'':s); }           // 意図的にHTML許可（<em>等を使うため）
function cls(){ return [].slice.call(arguments).filter(Boolean).join(' '); }
function label(b){ return b.label ? '<div class="card__label">'+esc(b.label)+'</div>' : ''; }
function lead(b){ return b.lead ? '<div class="card__lead">'+esc(b.lead)+'</div>' : ''; }
function texts(t){
  if(!t) return '';
  return (Array.isArray(t)?t:[t]).map(function(x){ return '<p class="card__text">'+esc(x)+'</p>'; }).join('');
}
function listOf(b){
  if(!b.list || !b.list.length) return '';
  return '<ul class="'+cls('list', b.listNum&&'list--num', b.tone==='alert'&&'list--alert')+'">'
    + b.list.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join('') + '</ul>';
}
function inlineNote(b){ return b.note ? '<div class="note-inline">'+esc(b.note)+'</div>' : ''; }
function cardOpen(b, extra){
  var tone = b.tone ? 'card--'+b.tone : '';
  return '<div class="'+cls('card', tone, extra)+'">';
}

/* ══ カード（テキスト・箇条書き・数値） ════════════════ */
BLOCK.card = function(b){
  var stat = '';
  if(b.stat){
    stat = '<div class="'+cls('stat', b.stat.tone&&'stat--'+b.stat.tone)+'">'
         + '<span class="stat__num">'+esc(b.stat.num)+'</span>'
         + '<span class="stat__unit">'+esc(b.stat.unit||'')+'</span></div>';
  }
  return cardOpen(b) + label(b) + lead(b) + stat + texts(b.text) + listOf(b) + inlineNote(b) + '</div>';
};

/* ══ 横棒グラフ ════════════════════════════════════════ */
BLOCK.bars = function(b){
  var max = b.max || Math.max.apply(null, b.items.map(function(i){ return Math.abs(i.value); }));
  var rows = b.items.map(function(i){
    var w = max ? Math.abs(i.value)/max*100 : 0;
    return '<div class="bar">'
      + '<span class="bar__name">'+esc(i.name)+'</span>'
      + '<span class="bar__track"><span class="'+cls('bar__fill', i.tone&&'bar__fill--'+i.tone)+'" style="width:'+w.toFixed(1)+'%"></span></span>'
      + '<span class="bar__val">'+esc(i.valueLabel!=null?i.valueLabel:i.value+(b.unit||''))+'</span>'
      + '</div>';
  }).join('');
  return cardOpen(b) + label(b) + lead(b) + '<div class="bars">'+rows+'</div>' + texts(b.text) + inlineNote(b) + '</div>';
};

/* ══ ウォーターフォール図 ══════════════════════════════
   items: {name, value, type:'base'|'plus'|'minus'|'total', sub}
   value は絶対値で書く。minus は自動で下向きに積む。
   ══════════════════════════════════════════════════════ */
BLOCK.waterfall = function(b){
  var cum = 0, segs = [];
  b.items.forEach(function(it){
    var s, e;
    if(it.type === 'base'){ s = 0; e = it.value; cum = it.value; }
    else if(it.type === 'total'){ s = 0; e = (it.value != null ? it.value : cum); cum = e; }
    else if(it.type === 'minus'){ e = cum; s = cum - it.value; cum = s; }
    else { s = cum; e = cum + it.value; cum = e; }   // plus
    segs.push({ start:Math.min(s,e), end:Math.max(s,e), item:it, top:Math.max(s,e) });
  });
  var max = b.max || Math.max.apply(null, segs.map(function(s){ return s.end; }));
  max = max * 1.14;

  var cols = segs.map(function(s, idx){
    var bottom = s.start/max*100, height = (s.end-s.start)/max*100;
    var sign = s.item.type==='minus' ? '▲' : (s.item.type==='plus' ? '+' : '');
    var vlabel = s.item.valueLabel!=null ? s.item.valueLabel : sign+s.item.value+(b.unit||'');
    var link = (idx < segs.length-1)
      ? '<span class="wf__link" style="bottom:'+(s.top/max*100).toFixed(2)+'%; left:8%; right:-10%"></span>' : '';
    return '<div class="wf__col">'
      + '<span class="'+cls('wf__bar','wf__bar--'+(s.item.type||'plus'))+'" style="bottom:'+bottom.toFixed(2)+'%;height:'+height.toFixed(2)+'%"></span>'
      + '<span class="wf__val" style="bottom:calc('+(bottom+height).toFixed(2)+'% + 3px)">'+esc(vlabel)+'</span>'
      + link + '</div>';
  }).join('');

  var labels = segs.map(function(s){
    return '<div class="wf__label"><b>'+esc(s.item.name)+'</b>'+(s.item.sub?esc(s.item.sub):'')+'</div>';
  }).join('');

  return cardOpen(b) + label(b) + lead(b)
    + '<div class="wf"><div class="wf__plot">'+cols+'</div><div class="wf__labels">'+labels+'</div></div>'
    + texts(b.text) + inlineNote(b) + '</div>';
};

/* ══ 2軸ポジショニングマップ ═══════════════════════════
   x / y は 0〜100 で指定（左下が原点）
   ══════════════════════════════════════════════════════ */
BLOCK.map2x2 = function(b){
  var q = b.quadrants || {};
  var quads = ['tl','tr','bl','br'].map(function(k){
    return q[k] ? '<span class="map__quad map__quad--'+k+'">'+esc(q[k])+'</span>' : '';
  }).join('');
  var zone = b.zone
    ? '<span class="map__zone" style="left:'+b.zone.x1+'%;right:'+(100-b.zone.x2)+'%;bottom:'+b.zone.y1+'%;top:'+(100-b.zone.y2)+'%"></span>' : '';
  var pts = (b.points||[]).map(function(p){
    return '<span class="'+cls('map__pt', p.tone&&'map__pt--'+p.tone, p.align==='left'&&'map__pt--left')+'"'
      + ' style="left:'+p.x+'%;bottom:'+p.y+'%">'
      + '<span class="map__dot"></span><span class="map__name">'+esc(p.name)+'</span></span>';
  }).join('');
  var ends = ''
    + (b.x&&b.x.low  ? '<span class="map__axis-end" style="left:6px;bottom:-16px">◀ '+esc(b.x.low)+'</span>' : '')
    + (b.x&&b.x.high ? '<span class="map__axis-end" style="right:6px;bottom:-16px">'+esc(b.x.high)+' ▶</span>' : '')
    + (b.y&&b.y.low  ? '<span class="map__axis-end" style="left:-14px;bottom:2px;writing-mode:vertical-rl">'+esc(b.y.low)+'</span>' : '')
    + (b.y&&b.y.high ? '<span class="map__axis-end" style="left:-14px;top:2px;writing-mode:vertical-rl">'+esc(b.y.high)+'</span>' : '');

  return cardOpen(b) + label(b) + lead(b)
    + '<div class="map">'
    +   '<div class="map__ylab">'+esc(b.y&&b.y.label||'')+'</div>'
    +   '<div class="map__plot">'+zone+quads+pts+ends+'</div>'
    +   '<div class="map__xlab">'+esc(b.x&&b.x.label||'')+'</div>'
    + '</div>' + texts(b.text) + inlineNote(b) + '</div>';
};

/* ══ ロジックツリー ════════════════════════════════════ */
BLOCK.tree = function(b){
  var branches = b.branches.map(function(br){
    var leaves = br.leaves.map(function(l){
      var name = typeof l === 'string' ? l : l.name;
      var t = typeof l === 'string' ? '' : (l.pick ? 'leaf--pick' : (l.drop ? 'leaf--drop' : ''));
      return '<span class="'+cls('leaf', t)+'">'+esc(name)+'</span>';
    }).join('');
    return '<div class="branch"><div class="branch__l1">'+esc(br.name)+'</div>'
         + '<div class="branch__l2">'+leaves+'</div></div>';
  }).join('');
  return cardOpen(b, 'card--plain') + label(b) + lead(b)
    + '<div class="tree"><div class="tree__root"><div class="tree__rootbox">'+esc(b.root)+'</div></div>'
    + '<div class="tree__branches">'+branches+'</div></div>' + inlineNote(b) + '</div>';
};

/* ══ 評価マトリクス（◎○△×＋根拠） ═══════════════════ */
BLOCK.matrix = function(b){
  var head = '<tr><th style="width:'+(b.nameWidth||200)+'px">'+esc(b.nameHead||'施策')+'</th>'
    + b.columns.map(function(c){
        return '<th style="width:'+(c.w||76)+'px">'+esc(c.name)+(c.sub?'<br><span>'+esc(c.sub)+'</span>':'')+'</th>';
      }).join('')
    + (b.whyHead===false ? '' : '<th>'+esc(b.whyHead||'評価の根拠')+'</th>') + '</tr>';

  var rows = b.rows.map(function(r){
    var marks = r.marks.map(function(m){
      var t = m==='◎' ? '' : (m==='○' ? 'mark--mid' : 'mark--bad');
      return '<td><span class="'+cls('mark', t)+'">'+esc(m)+'</span></td>';
    }).join('');
    return '<tr class="'+(r.pick?'is-pick':'')+'">'
      + '<td class="name">'+esc(r.name)+'</td>' + marks
      + (b.whyHead===false ? '' : '<td class="why">'+esc(r.why||'')+'</td>') + '</tr>';
  }).join('');

  return cardOpen(b, 'card--plain') + label(b) + lead(b)
    + '<table class="matrix"><thead>'+head+'</thead><tbody>'+rows+'</tbody></table>'
    + inlineNote(b) + '</div>';
};

/* ══ ロードマップ ══════════════════════════════════════ */
BLOCK.roadmap = function(b){
  var lw = b.labelWidth || 170;
  var grid = 'grid-template-columns:'+lw+'px repeat('+b.cols.length+',1fr)';
  var head = '<div class="rh">'+esc(b.rowHead||'施策 / フェーズ')+'</div>'
    + b.cols.map(function(c){ return '<div class="rh">'+esc(c)+'</div>'; }).join('');
  var rows = b.rows.map(function(r){
    return '<div class="rl">'+esc(r.name)+'</div>' + r.cells.map(function(c){
      if(!c || !c.text) return '<div></div>';
      if(c.plain) return '<div>'+esc(c.text)+'</div>';
      return '<div><span class="'+cls('phasebar', c.tone&&'phasebar--'+c.tone)+'">'+esc(c.text)+'</span></div>';
    }).join('');
  }).join('');
  return cardOpen(b, 'card--plain') + label(b) + lead(b)
    + '<div class="roadmap" style="'+grid+'">'+head+rows+'</div>' + inlineNote(b) + '</div>';
};

/* ══ ギャップ図 ════════════════════════════════════════ */
BLOCK.gap = function(b){
  function box(o, goal){
    return '<div class="'+cls('gap__box', goal&&'gap__box--goal')+'">'
      + (o.label?'<div class="card__label">'+esc(o.label)+'</div>':'')
      + (o.lead?'<div class="card__lead">'+esc(o.lead)+'</div>':'')
      + texts(o.text) + '</div>';
  }
  return '<div class="gap">'+box(b.left)+'<div class="gap__arrow">▶</div>'+box(b.right,true)+'</div>';
};

/* ══ ステップ ══════════════════════════════════════════ */
BLOCK.steps = function(b){
  return '<div class="steps">' + b.items.map(function(s,i){
    return '<div class="step"><div class="step__no">STEP '+(i+1)+'</div>'
      + '<div class="step__title">'+esc(s.title)+'</div>'
      + (s.list ? listOf({list:s.list}) : texts(s.text)) + '</div>';
  }).join('') + '</div>';
};

/* ══ 依頼事項 ══════════════════════════════════════════ */
BLOCK.ask = function(b){
  return '<div class="ask"><div class="ask__label">'+esc(b.label||'依頼事項（ASK）')+'</div>'
    + '<div class="ask__text">'+esc(b.text)+'</div></div>';
};

/* ══ 汎用テーブル ══════════════════════════════════════ */
BLOCK.table = function(b){
  var head = b.head ? '<thead><tr>'+b.head.map(function(h){
      return '<th'+(h.w?' style="width:'+h.w+'"':'')+'>'+esc(h.name!=null?h.name:h)+'</th>'; }).join('')+'</tr></thead>' : '';
  var rows = b.rows.map(function(r){
    var cells = (r.cells||r);
    var c = r.pick ? 'is-pick' : (r.drop ? 'is-drop' : '');
    return '<tr class="'+c+'">'+cells.map(function(x){ return '<td>'+esc(x)+'</td>'; }).join('')+'</tr>';
  }).join('');
  return cardOpen(b, 'card--plain') + label(b) + lead(b)
    + '<table class="tbl">'+head+'<tbody>'+rows+'</tbody></table>' + inlineNote(b) + '</div>';
};

/* ══ 凡例 ══════════════════════════════════════════════ */
BLOCK.legend = function(b){
  return '<div class="legend">' + b.items.map(function(i){
    return '<span class="l-'+(i.tone||'key')+'"><i></i>'+esc(i.name)+'</span>'; }).join('') + '</div>';
};

/* ══ アジェンダ ════════════════════════════════════════ */
BLOCK.agenda = function(b){
  return '<ul class="agenda">' + b.items.map(function(i,n){
    return '<li'+(i.current?' class="cur"':'')+'><span class="no">'+(i.no||('0'+(n+1)))+'</span>'
      + '<span>'+esc(i.title)+'</span>'
      + (i.page?'<span class="pg">P.'+esc(i.page)+'</span>':'') + '</li>';
  }).join('') + '</ul>';
};

/* ══ 生HTML（逃げ道） ══════════════════════════════════ */
BLOCK.html = function(b){ return b.html; };
