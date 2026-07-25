# コンポーネント・リファレンス

`data/*.js` に書くデータの書式一覧。すべて `w:` でグリッド幅（1〜12）を指定する。
**1行の合計が12になるように並べる**のが唯一のレイアウトルール。

---

## スライドの基本形

```js
{
  id:'xxx',                 // 任意。アンカー用
  phase:'sora',             // sora=空 / ame=雨 / kasa=傘 / base=前提 ／ 省略可
  title:'来庁理由の構造',      // 左上のスライドタイトル
  message:'…<em>強調</em>…',  // 中央上の主メッセージ。<em>=緑字、<strong>=下線マーカー
  fill:false,               // 省略時は縦いっぱいに伸ばす。伸ばしたくない時だけ false
  body:[ …ブロック… ],
  note:['（注）…','（出典）…']  // 左下の注釈・出典
}
```

特殊なスライド：

```js
{ kind:'cover',   title:'…', sub:'…', meta:'…' }          // 表紙（ページ番号なし）
{ kind:'divider', no:'SECTION 03', title:'…', sub:'…' }   // 中扉（ページ番号なし）
```

---

## 文字ものブロック

### card ── 万能の箱
```js
{ type:'card', w:4,
  tone:'plain',            // plain=白枠 / alert=赤 / sora=青 / flat=罫線のみ / 省略=灰
  label:'空｜現状',
  lead:'見出し1行',
  stat:{num:'18',unit:'%',tone:'alert'},   // 大きな数字（任意）
  text:'本文' または ['段落1','段落2'],
  list:['項目1','項目2'],
  listNum:true,            // 番号付きにする
  note:'補足1行' }
```

### gap ── 現状 ▶ あるべき姿
```js
{ type:'gap', w:12,
  left: { label:'現状', lead:'18%', text:'…' },
  right:{ label:'目標', lead:'50%', text:'…' } }
```

### steps ── アクション手順（矢印つき）
```js
{ type:'steps', w:12, items:[ {title:'対象の選定', list:['…','…']}, … ] }
```

### table ── 汎用表
```js
{ type:'table', w:12, label:'…',
  head:[{name:'施策',w:'22%'},{name:'判断',w:'10%'}],
  rows:[ {cells:['…','…'], pick:true},   // pick=緑ハイライト
         {cells:['…','…'], drop:true} ] }  // drop=グレーアウト
```

### ask ── 依頼事項
```js
{ type:'ask', w:12, label:'依頼事項（ASK）', text:'…' }
```

### agenda / legend
```js
{ type:'agenda', w:12, items:[{no:'01',title:'…',page:'2',current:true}] }
{ type:'legend', w:12, items:[{name:'削減余地',tone:'alert'}] }  // tone: key/mid/alert/mute/dark
```

---

## 図表ブロック

### bars ── 横棒グラフ
```js
{ type:'bars', w:12, label:'…', unit:'%', max:100,
  items:[ {name:'住民異動', value:31},
          {name:'福祉・介護', value:7, tone:'alert', valueLabel:'7%'} ] }
```
`tone`：省略=緑／`alert`=赤／`mute`=グレー／`sora`=青

### waterfall ── ウォーターフォール図
```js
{ type:'waterfall', w:8, label:'…', unit:'千h',
  items:[
    {name:'総工数',   value:100, type:'base',  sub:'年間'},      // 起点（0から）
    {name:'転記・入力', value:22,  type:'minus', sub:'削減可'},   // 減算（赤・下向き）
    {name:'新規流入',  value:12,  type:'plus'},                  // 加算（浮いた棒）
    {name:'着地',     value:57,  type:'total', sub:'3年後'} ]}  // 合計（0から）
```
- `value` はすべて**絶対値**で書く。`minus` は自動で下向きに積まれる
- `type:'total'` で `value` を省略すると、そこまでの累計が自動で入る
- 棒の間の点線は自動で引かれる

### map2x2 ── 2軸ポジショニングマップ
```js
{ type:'map2x2', w:7, label:'…',
  x:{ label:'解決の容易さ →', low:'難しい', high:'容易' },
  y:{ label:'インパクト →',   low:'小',    high:'大' },
  zone:{ x1:50, y1:50, x2:100, y2:100 },        // 強調したい象限（任意）
  quadrants:{ tl:'…', tr:'今期の対象', bl:'…', br:'…' },
  points:[ {name:'添付書類', x:66, y:82, tone:'key'},   // 座標は 0〜100（左下が原点）
           {name:'本人確認', x:24, y:76, align:'left'} ] }  // align:'left'=ラベルを左に
```
`tone`：省略=グレー／`key`=緑・大／`alert`=赤

### tree ── ロジックツリー
```js
{ type:'tree', w:12, root:'利用率を50%に<br>引き上げる',
  branches:[ { name:'① 入口を整える',
               leaves:[ {name:'導線の一本化', pick:true},   // pick=採用（緑枠）
                        {name:'広報の強化',  drop:true},   // drop=見送り（グレー）
                        '検索最適化' ] } ] }               // 文字列だけでも可
```

### matrix ── 評価マトリクス（◎○△）
```js
{ type:'matrix', w:12, nameWidth:190,
  columns:[ {name:'効果', sub:'利用率寄与'}, {name:'実現性', sub:'体制・法令'} ],
  rows:[ { name:'導線の一本化', marks:['◎','◎'], why:'評価の根拠を1行', pick:true } ] }
```
`◎`は緑、`○`は黒、それ以外はグレーで自動表示される。**`why` は必ず書く。**

### roadmap ── スケジュール
```js
{ type:'roadmap', w:12, labelWidth:170,
  cols:['第1四半期<br>準備','第2四半期<br>試行'],
  rows:[ { name:'導線の一本化',
           cells:[ {text:'要件定義'},                    // 緑のバー
                   {text:'測定', tone:'light'},          // light / mute / alert
                   {text:'週次で進捗管理', plain:true},   // バーなしのテキスト
                   {text:''} ] } ] }                     // 空セル
```

### html ── 逃げ道
```js
{ type:'html', w:12, html:'<div class="card">自由なHTML</div>' }
```

---

## 部品を新しく追加する手順

1. `js/components.js` に `BLOCK.myChart = function(b){ return '…HTML…'; };` を追加
2. `css/04-charts.css` にスタイルを追加
3. `data/*.js` で `{type:'myChart', w:6, …}` と書く

`cardOpen(b)` `label(b)` `lead(b)` `texts(b.text)` `listOf(b)` `inlineNote(b)` の
ヘルパを使うと、他の部品と見た目が揃う。

---

## 編集時の注意

- スライドが **720px を超えると画面上に赤枠と警告**が出る。出たら内容を削るか2枚に割る
- 1行のグリッド幅の合計は必ず 12（例：7+5、4+4+4、8+4、12）
- `message` に入れられるタグは `<em>`（緑字）と `<strong>`（下線マーカー）のみ
- 出典・注釈は `note` に必ず書く。空のまま出さない
