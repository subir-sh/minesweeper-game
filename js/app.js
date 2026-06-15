
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}

const NUM_DIST={'0':3,'1':10,'2':8,'3':6,'4':3,'5':2,'6':1,'7':1,'8':1};
let ROWS=6,COLS=6;
const HSIZE=4;
let G={};
let difficulty='normal';
let MAP_CELLS=null; // null = all playable; 2D array of 0|1 otherwise
let selectedMap=0;  // 0-2 = specific map, 'random' = random
let firstPlayer='random';  // 0, 1, or 'random'
let playMode='local';
let aiLevel='beginner';
const AI_PLAYER=1;

const MAPS=[
  {id:'map1',name:'행성 M',rows:6,cols:6,bg:'board_bg1.png',cells:null},
  {id:'map2',name:'위성 T',rows:7,cols:7,bg:'board_bg2.png',cells:[
    [0,1,1,1,0,0,0],
    [0,1,1,1,1,1,1],
    [0,1,1,1,1,1,1],
    [1,1,1,0,1,1,1],
    [1,1,1,1,1,1,0],
    [1,1,1,1,1,1,0],
    [0,0,0,1,1,1,0],
  ]},
  {id:'map3',name:'행성 V',rows:8,cols:8,bg:'board_bg3.png',cells:[
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0],
  ]},
];

function isPlayable(r,c){
  if(r<0||r>=ROWS||c<0||c>=COLS) return false;
  if(!MAP_CELLS) return true;
  return MAP_CELLS[r][c]===1;
}

function setSelectedMap(idx){
  selectedMap=idx;
  document.querySelectorAll('.map-card').forEach(el=>el.classList.remove('active'));
  if(idx==='random'){
    document.getElementById('map-card-random')?.classList.add('active');
  } else {
    document.getElementById('map-card-'+idx)?.classList.add('active');
  }
}

/* ── MAP PREVIEW TOOLTIP ── */
(function(){
  const tooltip=document.getElementById('map-preview-tooltip');
  const nameEl=document.getElementById('map-preview-name');
  const gridEl=document.getElementById('map-preview-grid');
  let hoverTimer=null;

  // full-grid definitions for preview (including random = null)
  const previewDefs=[
    {name:'행성 M (6×6, 36타일)',rows:6,cols:6,cells:null},
    {name:'위성 T (7×7, 36타일)',rows:7,cols:7,cells:[
      [0,1,1,1,0,0,0],[0,1,1,1,1,1,1],[0,1,1,1,1,1,1],
      [1,1,1,0,1,1,1],[1,1,1,1,1,1,0],[1,1,1,1,1,1,0],[0,0,0,1,1,1,0]
    ]},
    {name:'행성 V (8×8, 40타일)',rows:8,cols:8,cells:[
      [0,0,0,1,1,0,0,0],[0,0,1,1,1,1,0,0],[0,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,0],[0,0,1,1,1,1,0,0],[0,0,0,1,1,0,0,0]
    ]},
    {name:'랜덤',rows:null,cols:null,cells:null}
  ];

  function showPreview(mapIdx, anchorEl){
    const def=previewDefs[mapIdx];
    if(!def) return;
    nameEl.textContent=def.name;
    gridEl.innerHTML='';
    if(def.rows===null){
      // random — show ? icon
      gridEl.style.gridTemplateColumns='1fr';
      const msg=document.createElement('div');
      msg.style.cssText='font-size:28px;color:var(--muted);text-align:center;padding:8px 16px;';
      msg.textContent='?';
      gridEl.appendChild(msg);
    } else {
      gridEl.style.gridTemplateColumns=`repeat(${def.cols},16px)`;
      for(let r=0;r<def.rows;r++) for(let c=0;c<def.cols;c++){
        const cell=document.createElement('div');
        const playable=!def.cells||def.cells[r][c]===1;
        cell.className='map-preview-cell'+(playable?'':' blocked');
        gridEl.appendChild(cell);
      }
    }
    // position tooltip above anchor
    const rect=anchorEl.getBoundingClientRect();
    tooltip.style.left=Math.max(8,rect.left+rect.width/2-100)+'px';
    tooltip.style.top=(rect.top-8)+'px';
    tooltip.style.transform='translateY(-100%)';
    tooltip.classList.add('visible');
  }

  function hidePreview(){
    clearTimeout(hoverTimer);
    tooltip.classList.remove('visible');
  }

  document.querySelectorAll('.map-card').forEach(card=>{
    card.addEventListener('mouseenter',e=>{
      const id=card.id;
      let idx=null;
      if(id==='map-card-0') idx=0;
      else if(id==='map-card-1') idx=1;
      else if(id==='map-card-2') idx=2;
      else if(id==='map-card-random') idx=3;
      if(idx===null) return;
      hoverTimer=setTimeout(()=>showPreview(idx,card),100);
    });
    card.addEventListener('mouseleave',hidePreview);
    card.addEventListener('click',hidePreview);
  });
})();

function setFirstPlayer(choice){
  firstPlayer=choice;
  ['fp-p1','fp-random','fp-p2'].forEach(id=>document.getElementById(id)?.classList.remove('active'));
  if(choice===0) document.getElementById('fp-p1')?.classList.add('active');
  else if(choice==='random') document.getElementById('fp-random')?.classList.add('active');
  else if(choice===1) document.getElementById('fp-p2')?.classList.add('active');
}
function spriteMarkup(v, showBadge=false){
  let badge='';
  if(showBadge){
    if(v==='M') badge=`<span class="sprite-badge" data-v="M"><i class="ti ti-bolt"></i></span>`;
    else badge=`<span class="sprite-badge" data-v="${v}">${v}</span>`;
  }
  const file=v==='M'?'energy_core.png':`module_${v}.png`;
  const alt=v==='M'?'에너지 코어':'기지 모듈';
  return `<img class="sprite" src="assets/${file}" alt="${alt}">${badge}`;
}

const RULE_ADJ_CENTER=[[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2]];
const RULE_EXAMPLES={
  zero:{highlights:RULE_ADJ_CENTER,tiles:[{r:1,c:1,v:'0'}]},
  three:{highlights:RULE_ADJ_CENTER,tiles:[{r:1,c:1,v:'3'},{r:0,c:0,v:'M'},{r:0,c:2,v:'M'},{r:2,c:0,v:'M'}]},
  edge:{
    highlights:[[0,1],[1,0],[1,1],[1,2],[1,3],[2,2],[3,2],[3,3]],
    tiles:[
      {r:0,c:0,v:'2'},{r:0,c:1,v:'M'},{r:1,c:0,v:'M'},
      {r:2,c:3,v:'5'},{r:1,c:2,v:'M'},{r:1,c:3,v:'M'},{r:2,c:2,v:'M'},{r:3,c:2,v:'M'},{r:3,c:3,v:'M'}
    ]
  },
  // 승리: 4×4 fully valid board (verified: single M at 2,2, all numbers correct)
  win:{
    highlights:[],
    tiles:[
      {r:0,c:0,v:'0'},{r:0,c:1,v:'0'},{r:0,c:2,v:'0'},{r:0,c:3,v:'0'},
      {r:1,c:0,v:'0'},{r:1,c:1,v:'1'},{r:1,c:2,v:'1'},{r:1,c:3,v:'1'},
      {r:2,c:0,v:'0'},{r:2,c:1,v:'1'},{r:2,c:2,v:'M'},{r:2,c:3,v:'1'},
      {r:3,c:0,v:'0'},{r:3,c:1,v:'1'},{r:3,c:2,v:'1'},{r:3,c:3,v:'1'},
    ]
  },
  // 모순: "0" at (1,1) with M at (0,1) in its neighborhood → contradiction
  lose:{
    highlights:[[0,0],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1],[2,2]],
    tiles:[{r:1,c:1,v:'0'},{r:0,c:1,v:'M'}]
  },
  // 전문가 step1: P1이 (2,3)에 숫자2 배치 — (0,3)=0, (3,3)=1 기배치
  expert1:{
    highlights:[[2,3]],
    tiles:[{r:0,c:3,v:'0'},{r:2,c:3,v:'2'},{r:3,c:3,v:'1'}]
  },
  // 전문가 step2: P1이 (2,2),(3,2)에 코어 배치 시도
  expert2:{
    highlights:[[2,2],[3,2]],
    tiles:[{r:0,c:3,v:'0'},{r:2,c:2,v:'M'},{r:2,c:3,v:'2'},{r:3,c:2,v:'M'},{r:3,c:3,v:'1'}]
  },
  // 전문가 step3: (3,3)=1이 주변 코어 2개(모순) → 반박 포기
  expert3:{
    highlights:[[2,2],[3,2],[3,3]],
    tiles:[{r:0,c:3,v:'0'},{r:2,c:2,v:'M'},{r:2,c:3,v:'2'},{r:3,c:2,v:'M'},{r:3,c:3,v:'1'}]
  }
};

const RULE_TABS=['goal','howto','numbers','winlose','revision','expert'];

function renderTileShowcase(){
  const core=document.getElementById('showcase-core');
  const nums=document.getElementById('showcase-nums');
  if(!core||core.children.length>0) return;
  const counts={M:10,...Object.fromEntries(Object.entries(NUM_DIST))};
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  const desc=document.getElementById('showcase-desc');
  if(desc) desc.innerHTML=`타일은 총 <b>${total}개</b>가 있으며, 그 종류와 개수는 다음과 같습니다.`;
  const makeItem=(v,count,badge)=>{
    const wrap=document.createElement('div');
    wrap.className='tile-show-wrap';
    const item=document.createElement('div');
    item.className='tile-show-item';
    item.innerHTML=spriteMarkup(v,badge);
    const lbl=document.createElement('div');
    lbl.className='tile-show-count';
    lbl.textContent=count+'개';
    wrap.appendChild(item);wrap.appendChild(lbl);
    return wrap;
  };
  core.appendChild(makeItem('M',10,false));
  ['0','1','2','3','4','5','6','7','8'].forEach(v=>{
    nums.appendChild(makeItem(v,NUM_DIST[v],true));
  });
}

function openRulesModal(){
  renderRulesExamples();
  renderTileShowcase();
  setRulesTab('goal');
  openModal('m-rules');
}

function setRulesTab(name){
  document.querySelectorAll('[data-rule-tab]').forEach(btn=>{
    const active=btn.dataset.ruleTab===name;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-selected',active?'true':'false');
  });
  document.querySelectorAll('[data-rule-panel]').forEach(panel=>{
    panel.classList.toggle('active',panel.dataset.rulePanel===name);
  });
  // scroll tab button into view
  const activeBtn=document.querySelector(`[data-rule-tab="${name}"]`);
  if(activeBtn) activeBtn.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
  // update arrow states
  const idx=RULE_TABS.indexOf(name);
  const prev=document.getElementById('rules-prev-btn');
  const next=document.getElementById('rules-next-btn');
  if(prev) prev.disabled=idx<=0;
  if(next) next.disabled=idx>=RULE_TABS.length-1;
  // reset scroll position of panels
  const panels=document.querySelector('.rules-tab-panels');
  if(panels) panels.scrollTop=0;
}

function stepRulesTab(dir){
  const active=document.querySelector('[data-rule-tab].active');
  if(!active) return;
  const idx=RULE_TABS.indexOf(active.dataset.ruleTab);
  const next=idx+dir;
  if(next>=0&&next<RULE_TABS.length) setRulesTab(RULE_TABS[next]);
}

function renderRulesExamples(){
  renderRulesExample('rules-example-zero',RULE_EXAMPLES.zero);
  renderRulesExample('rules-example-three',RULE_EXAMPLES.three);
  renderRulesExample('rules-example-edge',RULE_EXAMPLES.edge);
  renderRulesExample('rules-example-win',RULE_EXAMPLES.win);
  renderRulesExample('rules-example-lose',RULE_EXAMPLES.lose);
  renderRulesExample('rules-example-expert1',RULE_EXAMPLES.expert1);
  renderRulesExample('rules-example-expert2',RULE_EXAMPLES.expert2);
  renderRulesExample('rules-example-expert3',RULE_EXAMPLES.expert3,{conflictHi:true});
}

function renderRulesExample(id,config,opts={}){
  const board=document.getElementById(id);
  if(!board||board.children.length>0) return;
  _renderRulesExampleInto(board,config,opts);
}

function _renderRulesExampleInto(board,config,opts={}){
  const tiles=new Map(config.tiles.map(t=>[`${t.r},${t.c}`,t.v]));
  const highlights=new Set(config.highlights.map(([r,c])=>`${r},${c}`));
  board.innerHTML='';
  for(let r=0;r<4;r++) for(let c=0;c<4;c++){
    const key=`${r},${c}`;
    const cell=document.createElement('div');
    cell.className='cell';
    const isHi=highlights.has(key);
    if(tiles.has(key)){
      const v=tiles.get(key);
      cell.classList.add('placed');
      cell.dataset.v=v;
      cell.innerHTML=spriteMarkup(v,true);
      if(opts.conflictHi&&isHi) cell.classList.add('example-hi');
      else if(isHi) cell.classList.add('example-hi');
    } else {
      cell.classList.add('empty');
      if(isHi) cell.classList.add('example-hi');
    }
    board.appendChild(cell);
  }
}


document.querySelectorAll('[data-rule-tab]').forEach(btn=>{
  btn.addEventListener('click',()=>setRulesTab(btn.dataset.ruleTab));
});



function setPlayMode(mode){
  playMode=mode;
  document.getElementById('play-local').className='diff-btn'+(mode==='local'?' active-normal':'');
  document.getElementById('play-solo').className='diff-btn'+(mode==='solo'?' active-expert':'');
  document.getElementById('ai-level-section').style.display=mode==='solo'?'':'none';
  document.getElementById('n2').value=mode==='solo'?'중앙 AI':'플레이어 2';
  if(mode==='solo') setDiff('expert');
}
function setAiLevel(level){
  aiLevel=level;
  document.getElementById('ai-beginner').classList.toggle('active',level==='beginner');
  document.getElementById('ai-expert').classList.toggle('active',level==='expert');
}
function isAiPlayer(index){ return playMode==='solo' && index===AI_PLAYER; }
function isAiTurn(){ return G && isAiPlayer(G.cur); }

function setDiff(d){
  if(playMode==='solo' && d!=='expert') d='expert';
  difficulty=d;
  document.getElementById('diff-normal').className='diff-btn'+(d==='normal'?' active-normal':'');
  document.getElementById('diff-expert').className='diff-btn'+(d==='expert'?' active-expert':'');
  document.querySelectorAll('.expert-rule').forEach(el=>el.style.display=d==='expert'?'':'none');
  document.querySelectorAll('.normal-rule').forEach(el=>el.style.display=d==='normal'?'':'none');
  // update setup quick-ref mode card
  const mc=document.getElementById('qref-mode-card');
  const mi=document.getElementById('qref-mode-icon');
  const mt=document.getElementById('qref-mode-title');
  const md=document.getElementById('qref-mode-desc');
  if(mc&&mi&&mt&&md){
    if(d==='expert'){
      mc.classList.add('expert-card');
      mi.className='ti ti-ban';
      mt.textContent='불가능 선언 → 상대 반박';
      md.textContent='AI 판정 없이 직접 불가능을 선언하고 상대가 반박합니다.';
    } else {
      mc.classList.remove('expert-card');
      mi.className='ti ti-alert-triangle';
      mt.textContent='중앙 AI 실시간 검증';
      md.textContent='타일을 놓을 때마다 자동으로 가능성을 확인합니다.';
    }
  }
}

function buildDeck(){
  let d=[];
  for(const[v,n] of Object.entries(NUM_DIST)) for(let i=0;i<n;i++) d.push(v);
  for(let i=0;i<10;i++) d.push('M');
  for(let i=d.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[d[i],d[j]]=[d[j],d[i]];}
  return d;
}

/* ── SIZING ── */
function updateSizes(){
  const vh=window.innerHeight, vw=window.innerWidth;

  // 1. Topbar: 9% of vh
  const tbh=Math.max(44,Math.min(80,Math.round(vh*0.09)));
  document.documentElement.style.setProperty('--topbar-h',tbh+'px');
  const mainH=vh-tbh;

  // 2. Tile size: must be square, 4 tiles fit vertically without scroll.
  //    Panel vertical overhead (pp-top + pp-hand label/padding + pp-footer):
  //    pp-top  ≈ 96px (padding + name + token label + lamp)
  //    pp-hand ≈ 35px (padding + "설계안" label + gap)
  //    pp-footer ≈ 124px normal (status + 2 buttons), or ≈167px expert (status + 3 buttons)
  const TILE_GAP=5;
  const expertExtra = (typeof difficulty!=='undefined' && difficulty==='expert') ? 43 : 0;
  const PANEL_OVERHEAD = 96 + 35 + 124 + expertExtra;
  const tsByH=Math.floor((mainH - PANEL_OVERHEAD - TILE_GAP*3) / 4);

  // 3. Horizontal: panel should not eat too much of the board's space
  const tsByW=Math.floor(vw*0.16)-20;

  // 4. Final tile size: min of both constraints, clamped
  const ts=Math.max(28,Math.min(tsByH,tsByW,140));

  // 5. Panel width = tile size + horizontal padding (10px each side)
  const pw=ts+20;
  document.documentElement.style.setProperty('--panel-w',pw+'px');

  // 6. Board cell size from remaining space — always sized to fit 6×6 footprint.
  //    For larger maps (7×7, 8×8) scale cs down so COLS*cs + gaps = same board size.
  const baw=vw-pw*2-16;
  const bah=mainH-52;
  let cs6=Math.floor(Math.min(baw/6.3,bah/6.3));
  cs6=Math.max(22,Math.min(120,cs6));
  // fit COLS columns in the same physical width as 6 columns
  // total = n*cs + (n-1)*gap = n*cs + (n-1)*cs*0.06 = cs*(n + (n-1)*0.06)
  const boardDim=Math.max(ROWS,COLS);
  const fitFactor=6.3/(boardDim+(boardDim-1)*0.06);
  let cs=Math.max(16,Math.floor(cs6*fitFactor));
  const gap=Math.max(2,Math.round(cs*0.06));
  const fs=Math.max(11,Math.round(cs*0.44));
  const tfs=Math.max(11,Math.round(ts*0.40));

  document.documentElement.style.setProperty('--cell-size',cs+'px');
  document.documentElement.style.setProperty('--cell-gap',gap+'px');
  document.documentElement.style.setProperty('--cell-fs',fs+'px');
  document.documentElement.style.setProperty('--tile-size',ts+'px');
  document.documentElement.style.setProperty('--tile-fs',tfs+'px');

  // re-stamp board grids (CSS vars alone don't retrigger grid layout)
  document.querySelectorAll('.board:not(.example-board)').forEach(b=>{
    b.style.gridTemplateColumns=`repeat(${COLS},${cs}px)`;
    b.style.gridTemplateRows=`repeat(${ROWS},${cs}px)`;
    b.style.gap=gap+'px';
  });

  // 7. Verify-screen board: size against actual .v-top/.v-bottom heights
  //    (different chrome than the normal game board, so reuse of `cs` above
  //     can overflow — measure the real layout instead).
  const vboard=document.getElementById('vboard');
  if(vboard){
    const vTop=document.querySelector('.v-top');
    const vBottom=document.querySelector('.v-bottom');
    const vTopH=vTop?vTop.getBoundingClientRect().height:0;
    const vBottomH=vBottom?vBottom.getBoundingClientRect().height:0;
    const areaPad=16;     // .v-board-area padding (8px * 2)
    const boardChrome=22; // .board padding(10px*2) + border(1px*2)
    const vAvailH=vh - vTopH - vBottomH - areaPad - boardChrome;
    const vAvailW=vw - areaPad - boardChrome;
    // Size verify board to the same 6×6 footprint, then scale for larger maps
    let vcs6=Math.floor(Math.min(vAvailW/6.3,vAvailH/6.3));
    vcs6=Math.max(18,Math.min(120,vcs6));
    const vDim=Math.max(ROWS,COLS);
    let vcs=Math.max(14,Math.floor(vcs6*6.3/(vDim+(vDim-1)*0.06)));
    const vgap=Math.max(2,Math.round(vcs*0.06));
    vboard.style.gridTemplateColumns=`repeat(${COLS},${vcs}px)`;
    vboard.style.gridTemplateRows=`repeat(${ROWS},${vcs}px)`;
    vboard.style.gap=vgap+'px';
    document.documentElement.style.setProperty('--vcell-size',vcs+'px');
    document.documentElement.style.setProperty('--vcell-fs',Math.max(11,Math.round(vcs*0.44))+'px');
  }
}
window.addEventListener('resize',updateSizes);
window.addEventListener('orientationchange',()=>setTimeout(updateSizes,200));

/* ── FULLSCREEN TOGGLE ── */
function isStandalone(){
  return window.navigator.standalone === true ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         window.matchMedia('(display-mode: standalone)').matches;
}
function fsSupported(){
  const el=document.documentElement;
  return !!(el.requestFullscreen||el.webkitRequestFullscreen||el.msRequestFullscreen);
}
function isFullscreen(){
  return !!(document.fullscreenElement||document.webkitFullscreenElement);
}
function toggleFullscreen(){
  if(!fsSupported()){
    // iPadOS Safari: standard Fullscreen API on arbitrary elements is unreliable.
    // Best alternative: guide the user to "Add to Home Screen" for a fullscreen, browser-chrome-free experience.
    alert('이 브라우저에서는 전체화면 전환이 지원되지 않습니다.\\n\\niPad에서는 Safari 공유 버튼 → "홈 화면에 추가"로 추가하면\\n주소창 없이 전체화면으로 실행할 수 있습니다.');
    return;
  }
  const el=document.documentElement;
  if(!isFullscreen()){
    (el.requestFullscreen||el.webkitRequestFullscreen||el.msRequestFullscreen).call(el)
      .catch(()=>{});
  } else {
    (document.exitFullscreen||document.webkitExitFullscreen||document.msExitFullscreen).call(document)
      .catch(()=>{});
  }
}
function updateFsIcon(){
  const icon=document.getElementById('fs-icon');
  if(!icon) return;
  icon.className = isFullscreen() ? 'ti ti-arrows-minimize' : 'ti ti-arrows-maximize';
}
document.addEventListener('fullscreenchange',updateFsIcon);
document.addEventListener('webkitfullscreenchange',updateFsIcon);
// Hide the button entirely if already running standalone (added to home screen) —
// in that mode there's no browser chrome to escape from.
if(isStandalone()){
  document.addEventListener('DOMContentLoaded',()=>{
    const btn=document.getElementById('fs-btn');
    if(btn) btn.style.display='none';
  });
}

/* ── START ── */
function startGame(){
  const n1=document.getElementById('n1').value.trim()||'플레이어 1';
  const n2=playMode==='solo'?'중앙 AI':(document.getElementById('n2').value.trim()||'플레이어 2');
  // resolve map
  const mapIdx=(selectedMap==='random')?Math.floor(Math.random()*3):selectedMap;
  const map=MAPS[mapIdx];
  ROWS=map.rows; COLS=map.cols; MAP_CELLS=map.cells;
  document.getElementById('board').style.backgroundImage=`url('assets/${map.bg}')`;
  const vb=document.getElementById('vboard');
  if(vb) vb.style.backgroundImage=`url('assets/${map.bg}')`;
  // resolve first player
  const startP=(firstPlayer==='random')?Math.floor(Math.random()*2):firstPlayer;
  G={
    players:[
      {name:n1,color:'var(--p1c)',tintCls:'by-p1',lampCls:'p1-lamp',tokens:1,hand:[]},
      {name:n2,color:'var(--p2c)',tintCls:'by-p2',lampCls:'p2-lamp',tokens:1,hand:[]}
    ],
    cur:startP,deck:buildDeck(),
    board:Array(ROWS).fill(null).map(()=>Array(COLS).fill(null)),
    boardOwner:Array(ROWS).fill(null).map(()=>Array(COLS).fill(null)),
    mines:0,selTile:null,reroll:false,rsel:[],
    vPlaced:[],imposer:-1,gameOver:false,
    turn:1,mapName:map.name,aiThinking:false
  };
  for(let p=0;p<2;p++) for(let i=0;i<HSIZE;i++) if(G.deck.length) G.players[p].hand.push(G.deck.pop());
  showScreen('s-game');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{updateSizes();renderGame();scheduleAiTurn();}));
}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  requestAnimationFrame(()=>requestAnimationFrame(updateSizes));
}

/* ── RENDER GAME ── */
function renderGame(){
  const cp=G.cur;
  for(let i=0;i<2;i++){
    const p=G.players[i];const isA=i===cp;
    document.getElementById('ppn'+i).textContent=p.name;
    document.getElementById('pp'+i).classList.toggle('active',isA);
    document.getElementById('pp'+i).classList.toggle('inactive',!isA);
    renderLamps(i);renderHand(i);
    document.getElementById('ft'+i).classList.toggle('hidden',!isA);
    if(isA){
      const norm=!G.reroll;
      document.getElementById('act'+i+'-normal').style.display=norm?'':'none';
      document.getElementById('act'+i+'-reroll').style.display=norm?'none':'';
      if(norm) document.getElementById('st'+i).textContent='배치할 설계안을 선택하세요';
      const bpEl=document.getElementById('bp'+i);if(bpEl) bpEl.disabled=G.selTile===null;
      document.getElementById('br'+i).disabled=p.tokens<=0;
      document.getElementById('brc'+i).disabled=G.rsel.length===0;
      const impBtn=document.getElementById('impos'+i);
      if(impBtn) impBtn.style.display=(difficulty==='expert'&&norm)?'':'none';
    } else {
      const impBtn=document.getElementById('impos'+i);
      if(impBtn) impBtn.style.display='none';
    }
  }
  document.getElementById('turn-name').textContent=G.players[cp].name;
  document.getElementById('turn-name').style.color=G.players[cp].color;
  document.getElementById('deckc').textContent=G.deck.length;
  document.getElementById('minec').textContent=G.mines;
  const modeEl=document.getElementById('topbar-mode');
  if(modeEl){
    modeEl.textContent=difficulty==='expert'?'전문가 모드':'보통 모드';
    modeEl.style.color=difficulty==='expert'?'var(--red)':'var(--accent)';
  }
  const turnEl=document.getElementById('topbar-turn');
  if(turnEl) turnEl.textContent=(G.turn||1)+'턴';
  renderBoard();
}

function renderLamps(pi){
  const row=document.getElementById('lamps'+pi);
  const p=G.players[pi];row.innerHTML='';
  for(let i=0;i<1;i++){
    const l=document.createElement('div');
    const on=i<p.tokens;
    l.className=`lamp ${p.lampCls} ${on?'on':'off'}`;
    const core=document.createElement('div');core.className='lamp-core';
    l.appendChild(core);row.appendChild(l);
  }
}

function renderHand(pi){
  const cont=document.getElementById('ht'+pi);const isA=pi===G.cur&&!isAiPlayer(pi);
  cont.innerHTML='';
  G.players[pi].hand.forEach((v,i)=>{
    const t=document.createElement('div');
    t.className='tile'+(isA?'':' inactive-tile');
    t.dataset.v=v;
    t.innerHTML=spriteMarkup(v, true);
    if(isA){
      if(G.reroll){if(G.rsel.includes(i))t.classList.add('discard-sel');t.onclick=()=>toggleRS(i);}
      else{if(G.selTile===i)t.classList.add('selected');t.onclick=()=>selTile(i);}
    }
    cont.appendChild(t);
  });
}

function renderBoard(){
  const b=document.getElementById('board');b.innerHTML='';
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    const cell=document.createElement('div');cell.className='cell';
    if(!isPlayable(r,c)){
      cell.classList.add('blocked');
      b.appendChild(cell);
      continue;
    }
    const v=G.board[r][c];const owner=G.boardOwner[r][c];
    if(v!==null){
      cell.classList.add('placed');
      if(owner!==null) cell.classList.add(G.players[owner].tintCls);
      cell.dataset.v=v;
      cell.innerHTML=spriteMarkup(v, true);
    } else {
      cell.classList.add('empty');
      if(G.selTile!==null&&!G.reroll) cell.classList.add('hl');
      cell.onclick=()=>{if(!isAiTurn())placeCell(r,c);};
    }
    if(G.simMode){
      cell.classList.add('sim-cell');
      cell.onclick=()=>simPlace(r,c);
    }
    b.appendChild(cell);
  }
}

function setStatus(msg){document.getElementById('st'+G.cur).textContent=msg;}

/* ── ACTIONS ── */
function selTile(i){
  if(isAiTurn()) return;
  G.selTile=G.selTile===i?null:i;
  setStatus(G.selTile!==null?'건설 구역을 선택하세요':'설계안을 선택하세요');
  renderHand(G.cur);renderBoard();
  const bpCur=document.getElementById('bp'+G.cur);if(bpCur) bpCur.disabled=G.selTile===null;
}
function doPlace(){if(G.selTile===null){setStatus('설계안을 먼저 선택하세요');return;}setStatus('건설 구역을 선택하세요');}
function placeCell(r,c){
  if(isAiTurn()&&!G.aiThinking) return;
  if(!isPlayable(r,c)||G.board[r][c]!==null||G.gameOver) return;
  if(G.selTile===null){setStatus('설계안을 먼저 선택하세요');return;}
  const p=G.players[G.cur];const v=p.hand[G.selTile];
  G.board[r][c]=v;G.boardOwner[r][c]=G.cur;
  if(v==='M') G.mines++;
  p.hand.splice(G.selTile,1);G.selTile=null;
  if(G.deck.length) p.hand.push(G.deck.pop());
  const cells=document.getElementById('board').children;
  cells[r*COLS+c].classList.add('just-in');
  setTimeout(()=>{if(cells[r*COLS+c])cells[r*COLS+c].classList.remove('just-in');},220);
  endTurn();
}
function endTurn(){
  G.selTile=null;G.reroll=false;G.rsel=[];
  G.turn=(G.turn||1)+1;
  // CSP auto-check — normal mode only
  if(difficulty==='normal'){
    const result = checkBoardPossibility(G.board);
    if (!result.possible) {
      showImpossibleOverlay(G.cur, result);
      return;
    }
  }
  // win: all playable cells filled
  let allFilled=true;
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++)
    if(isPlayable(r,c)&&G.board[r][c]===null){allFilled=false;break;}
  if(allFilled){showResult(G.cur,'설계도가 완성되었습니다!','ti-layout-grid');return;}
  G.cur=1-G.cur;renderGame();scheduleAiTurn();
}
function startReroll(){if(isAiTurn())return;if(G.players[G.cur].tokens<=0)return;G.reroll=true;G.rsel=[];renderGame();}
function toggleRS(i){
  const idx=G.rsel.indexOf(i);if(idx>=0)G.rsel.splice(idx,1);else G.rsel.push(i);
  renderHand(G.cur);document.getElementById('brc'+G.cur).disabled=G.rsel.length===0;
}
function confirmReroll(){
  if(G.rsel.length===0)return;
  const p=G.players[G.cur];p.tokens--;
  const sorted=[...G.rsel].sort((a,b)=>b-a);
  for(const i of sorted) p.hand.splice(i,1);
  for(let i=0;i<sorted.length;i++) if(G.deck.length) p.hand.push(G.deck.pop());
  G.reroll=false;G.rsel=[];renderGame();
}
function cancelReroll(){G.reroll=false;G.rsel=[];renderGame();}





function scheduleAiTurn(){
  if(!isAiTurn()||G.gameOver||G.aiThinking) return;
  G.aiThinking=true;
  setStatus('AI가 설계를 검토하고 있습니다...');
  setTimeout(()=>window.OrbitalAI.takeTurn({level:aiLevel}),450);
}
function executeAiPlacement(move){
  G.selTile=move.handIndex;
  placeCell(move.r,move.c);
  G.aiThinking=false;
}
function resolveAiDeclaration(){
  G.aiThinking=false;
  showResult(AI_PLAYER,'중앙 AI가 불가능한 설계를 발견했습니다.','ti-ban');
}
function aiFallbackPass(){
  G.aiThinking=false;
  const moves=[];
  for(let hi=0;hi<G.players[AI_PLAYER].hand.length;hi++)
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)
      if(isPlayable(r,c)&&G.board[r][c]===null)moves.push({handIndex:hi,r,c});
  if(moves.length) executeAiPlacement(moves[Math.floor(Math.random()*moves.length)]);
}

/* ══ CSP IMPOSSIBLE CHECKER ══ */

function getAdjacentCells(r, c) {
  const adj = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++)
      if ((dr || dc) && isPlayable(r+dr, c+dc))
        adj.push([r+dr, c+dc]);
  return adj;
}

// Returns {possible, reason, conflictCells, forcedMines:Set, forcedSafe:Set}
function checkBoardPossibility(board) {
  const constraints = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = board[r][c];
      if (v === null || v === 'M') continue;
      const num = parseInt(v);
      const adj = getAdjacentCells(r, c);
      const adjMines = adj.filter(([ar,ac]) => board[ar][ac] === 'M').length;
      const adjEmpty = adj.filter(([ar,ac]) => board[ar][ac] === null);
      const remaining = num - adjMines;

      if (remaining < 0) {
        return { possible:false, forcedMines:new Set(), forcedSafe:new Set(),
          reason:`<b>${r+1}행 ${c+1}열의 <span style="color: var(--num${num}); font-weight: bold;">${num}</span></b> 타일 주변에 이미 에너지 코어가 ${adjMines}개로 숫자보다 많습니다.`,
          conflictCells:[[r,c]] };
      }
      if (remaining > adjEmpty.length) {
        return { possible:false, forcedMines:new Set(), forcedSafe:new Set(),
          reason:`<b>${r+1}행 ${c+1}열의 <span style="color: var(--num${num}); font-weight: bold;">${num}</span></b> 타일은 에너지 코어가 ${remaining}개 더 필요하지만 주변 빈칸이 ${adjEmpty.length}개뿐입니다.`,
          conflictCells:[[r,c],...adjEmpty] };
      }
      if (num === 0 && adjMines > 0) {
        const minePos = adj.filter(([ar,ac]) => board[ar][ac] === 'M');
        return { possible:false, forcedMines:new Set(), forcedSafe:new Set(),
          reason:`<b>${r+1}행 ${c+1}열의 0</b> 타일은 주변에 에너지 코어가 없어야 하는데 인접한 에너지 코어가 있습니다.`,
          conflictCells:[[r,c],...minePos] };
      }
      constraints.push({r, c, num, adjEmpty, remaining});
    }
  }

  // Unit propagation — collect forcedMines & forcedSafe
  const fixed = new Map(); // "r,c" -> 0(safe)|1(mine)
  let changed = true;
  while (changed) {
    changed = false;
    for (const con of constraints) {
      const unknowns = con.adjEmpty.filter(([ar,ac]) => !fixed.has(`${ar},${ac}`));
      const fixedMines = con.adjEmpty.filter(([ar,ac]) => fixed.get(`${ar},${ac}`) === 1).length;
      const need = con.remaining - fixedMines;
      if (need < 0 || need > unknowns.length) {
        return { possible:false,
          forcedMines: new Set([...fixed].filter(([,v])=>v===1).map(([k])=>k)),
          forcedSafe:  new Set([...fixed].filter(([,v])=>v===0).map(([k])=>k)),
          reason:`<b>${con.r+1}행 ${con.c+1}열의 <span style="color: var(--num${con.num}); font-weight: bold;">${con.num}</span></b> 타일의 조건을 동시에 만족하는 코어 배치가 없습니다.`,
          conflictCells:[[con.r,con.c],...con.adjEmpty] };
      }
      if (unknowns.length === 0) continue;
      if (need === 0) {
        unknowns.forEach(([ar,ac]) => {
          if (!fixed.has(`${ar},${ac}`)) { fixed.set(`${ar},${ac}`, 0); changed = true; }
        });
      } else if (need === unknowns.length) {
        unknowns.forEach(([ar,ac]) => {
          if (!fixed.has(`${ar},${ac}`)) { fixed.set(`${ar},${ac}`, 1); changed = true; }
        });
      }
    }
    for (const con of constraints) {
      const fixedM = con.adjEmpty.filter(([ar,ac]) => fixed.get(`${ar},${ac}`) === 1).length;
      const unknowns = con.adjEmpty.filter(([ar,ac]) => !fixed.has(`${ar},${ac}`));
      const need = con.remaining - fixedM;
      if (need < 0 || need > unknowns.length) {
        return { possible:false,
          forcedMines: new Set([...fixed].filter(([,v])=>v===1).map(([k])=>k)),
          forcedSafe:  new Set([...fixed].filter(([,v])=>v===0).map(([k])=>k)),
          reason: `<b>${con.r+1}행 ${con.c+1}열의 <span style="color: var(--num${con.num}); font-weight: bold;">${con.num}</span></b> 타일 조건이 다른 타일과 충돌합니다.`,
          conflictCells:[[con.r,con.c],...con.adjEmpty] };
      }
    }
  }

  // Backtracking on remaining unknowns — but first collect what propagation found
  const allEmpty = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (isPlayable(r,c) && board[r][c] === null && !fixed.has(`${r},${c}`)) allEmpty.push([r,c]);

  // For backtracking, also track what's forced across ALL solutions
  // (intersect forced mine/safe across all valid solutions)
  let solutionCount = 0;
  let intersectMine = null; // Set of keys forced mine in every solution
  let intersectSafe = null;
  const MAX_SOLUTIONS = 50; // cap for perf

  function bt(idx, assignment) {
    if (solutionCount >= MAX_SOLUTIONS) return;
    if (idx === allEmpty.length) {
      for (const con of constraints) {
        const total = con.adjEmpty.filter(([ar,ac]) => {
          const k = `${ar},${ac}`;
          return assignment.get(k) === 1 || fixed.get(k) === 1;
        }).length;
        if (total !== con.remaining) return;
      }
      // valid solution found
      solutionCount++;
      const solMine = new Set();
      const solSafe = new Set();
      allEmpty.forEach(([r,c]) => {
        const k = `${r},${c}`;
        if (assignment.get(k) === 1) solMine.add(k);
        else solSafe.add(k);
      });
      if (intersectMine === null) {
        intersectMine = solMine;
        intersectSafe = solSafe;
      } else {
        for (const k of [...intersectMine]) if (!solMine.has(k)) intersectMine.delete(k);
        for (const k of [...intersectSafe]) if (!solSafe.has(k)) intersectSafe.delete(k);
      }
      return;
    }
    const [r,c] = allEmpty[idx];
    const key = `${r},${c}`;
    for (const val of [0,1]) {
      assignment.set(key, val);
      let ok = true;
      for (const con of constraints) {
        const mines = con.adjEmpty.filter(([ar,ac]) => {
          const k=`${ar},${ac}`;
          return fixed.get(k)===1 || assignment.get(k)===1;
        }).length;
        const unkn = con.adjEmpty.filter(([ar,ac]) => {
          const k=`${ar},${ac}`;
          return !fixed.has(k) && !assignment.has(k);
        }).length;
        const need = con.remaining - mines;
        if (need < 0 || need > unkn) { ok=false; break; }
      }
      if (ok) bt(idx+1, assignment);
    }
    assignment.delete(key);
  }

  bt(0, new Map());

  if (solutionCount === 0) {
    const worst = constraints.reduce((a,b) => {
      const ra = b.remaining / Math.max(1, b.adjEmpty.length);
      const rb = a.remaining / Math.max(1, a.adjEmpty.length);
      return ra > rb ? b : a;
    }, constraints[0]);
    return {
      possible: false,
      forcedMines: new Set([...fixed].filter(([,v])=>v===1).map(([k])=>k)),
      forcedSafe:  new Set([...fixed].filter(([,v])=>v===0).map(([k])=>k)),
      reason: worst
        ? `여러 타일의 조건을 <b>동시에 만족하는 코어 배치가 없습니다.</b> <b>${worst.r+1}행 ${worst.c+1}열의 ${worst.num}</b> 주변이 핵심 충돌 지점입니다.`
        : '어떤 코어 배치로도 모든 조건을 동시에 만족할 수 없습니다.',
      conflictCells: worst ? [[worst.r,worst.c],...worst.adjEmpty] : []
    };
  }

  // Merge propagation + backtrack intersect
  const allForcedMines = new Set([...fixed].filter(([,v])=>v===1).map(([k])=>k));
  const allForcedSafe  = new Set([...fixed].filter(([,v])=>v===0).map(([k])=>k));
  if (intersectMine) for (const k of intersectMine) allForcedMines.add(k);
  if (intersectSafe) for (const k of intersectSafe) allForcedSafe.add(k);

  return { possible:true, reason:'', conflictCells:[],
    forcedMines: allForcedMines, forcedSafe: allForcedSafe };
}

/* ══ EXPERT MODE: MANUAL IMPOSSIBLE DECLARATION ══ */
function openImpossible(){
  if(isAiTurn()) return;
  if(difficulty!=='expert'||G.gameOver) return;
  openModal('m-impos');
}

function confirmImpossible(){
  closeModal('m-impos');
  G.imposer=G.cur;G.vPlaced=[];
  const dp=G.players[G.imposer];
  const verifier=1-G.cur;const vp=G.players[verifier];
  document.getElementById('v-declarant-name').textContent=dp.name;
  document.getElementById('v-declarant-name').style.color=dp.color;
  document.getElementById('vdesc').textContent=
    vp.name+'이(가) 에너지 코어를 배치해 반박하세요. 빈 칸을 누르면 배치 · 다시 누르면 제거.';
  document.getElementById('v-err').textContent='';
  renderVBoard();updateVCount();
  showScreen('s-verify');
}

function renderVBoard(){
  const b=document.getElementById('vboard');b.innerHTML='';
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    const cell=document.createElement('div');cell.className='cell';
    if(!isPlayable(r,c)){cell.classList.add('blocked');b.appendChild(cell);continue;}
    const placed=G.vPlaced.find(p=>p.r===r&&p.c===c);
    const orig=G.board[r][c];const owner=G.boardOwner[r][c];
    if(placed){
      cell.classList.add('placed','mine-hi');cell.dataset.v='M';
      cell.innerHTML=spriteMarkup('M');
      cell.onclick=()=>toggleVMine(r,c);
    } else if(orig!==null){
      cell.classList.add('placed');
      if(owner!==null) cell.classList.add(G.players[owner].tintCls);
      cell.dataset.v=orig;cell.innerHTML=spriteMarkup(orig, true);
    } else {
      cell.classList.add('empty');cell.onclick=()=>toggleVMine(r,c);
    }
    b.appendChild(cell);
  }
}
function toggleVMine(r,c){
  if(G.board[r][c]!==null) return;
  const idx=G.vPlaced.findIndex(p=>p.r===r&&p.c===c);
  if(idx>=0) G.vPlaced.splice(idx,1);else G.vPlaced.push({r,c});
  renderVBoard();updateVCount();
  document.getElementById('v-err').textContent='';
}
function updateVCount(){document.getElementById('v-mine-count').textContent=G.vPlaced.length;}
function verifyDone(){
  const mines=new Set();
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(G.board[r][c]==='M') mines.add(r+','+c);
  G.vPlaced.forEach(p=>mines.add(p.r+','+p.c));
  const errors=[];
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    const v=G.board[r][c];if(v===null||v==='M') continue;
    let cnt=0;
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++)
      if((dr||dc)&&mines.has((r+dr)+','+(c+dc))) cnt++;
    if(cnt!==parseInt(v)) errors.push('('+( r+1)+'행 '+(c+1)+'열)');
  }
  if(errors.length>0){
    document.getElementById('v-err').textContent=
      '조건 불일치: '+errors.slice(0,3).join(' / ')+(errors.length>3?' 외 '+(errors.length-3)+'곳':'');
    return;
  }
  const verifier=1-G.imposer;
  // commit the verifier's mine placements onto the board so the final
  // state (and any post-game simulation) reflects the successful refutation
  G.vPlaced.forEach(p=>{
    G.board[p.r][p.c]='M';
    G.boardOwner[p.r][p.c]=verifier;
  });
  G.mines=G.board.flat().filter(v=>v==='M').length;
  G.gameOver=true;
  showScreen('s-game');renderGame();
  showResult(verifier, G.players[verifier].name+'이(가) 에너지 코어 배치로 반박에 성공했습니다!','ti-shield-check');
}
function verifyGiveUp(){
  G.gameOver=true;
  showScreen('s-game');renderGame();
  showResult(G.imposer, G.players[1-G.imposer].name+'이(가) 반박을 포기했습니다.','ti-flag');
}

/* ── IMPOSSIBLE OVERLAY ── */
let _imposPlacer = -1;

function showImpossibleOverlay(placerIdx, result) {
  _imposPlacer = placerIdx;
  G.gameOver = true;
  const placer = G.players[placerIdx];
  const nameEl = document.getElementById('impos-placer-name');
  nameEl.textContent = placer.name;
  nameEl.style.color = placer.color;
  document.getElementById('impos-why').innerHTML = result.reason;

  const conflictSet = new Set(result.conflictCells.map(([r,c])=>`${r},${c}`));
  const forcedMines = result.forcedMines || new Set();
  const forcedSafe  = result.forcedSafe  || new Set();

  // legend always visible

  const viz = document.getElementById('impos-viz');
  viz.innerHTML = '';
  viz.style.cssText = `display:flex;flex-wrap:wrap;gap:3px;justify-content:center;margin-top:2px;max-width:${COLS*35+COLS*3}px;`;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      const key = `${r},${c}`;
      if (!isPlayable(r,c)) {
        cell.className='impos-cell';cell.style.background='rgba(0,0,0,0.35)';cell.style.border='none';
        viz.appendChild(cell);continue;
      }
      const v = G.board[r][c];
      cell.className = 'impos-cell';
      if (v !== null) {
        cell.dataset.v = v;
        if (v === 'M') {
          cell.classList.add('impos-mine');
          cell.innerHTML = '<i class="ti ti-bolt"></i>';
          cell.classList.add(conflictSet.has(key) ? 'impos-conflict' : 'impos-ok');
        } else {
          cell.textContent = v;
          cell.classList.add(conflictSet.has(key) ? 'impos-conflict' : 'impos-ok');
        }
      } else {
        // empty cell — show deduction state
        if (forcedMines.has(key)) {
          cell.classList.add('impos-forced-mine');
          cell.innerHTML = '<i class="ti ti-bolt"></i>';
        } else if (forcedSafe.has(key)) {
          cell.classList.add('impos-forced-safe');
          cell.innerHTML = '<i class="ti ti-x"></i>';
        } else if (conflictSet.has(key)) {
          cell.classList.add('impos-conflict-empty');
          cell.innerHTML = '?';
        } else {
          cell.classList.add('impos-empty');
        }
      }
      viz.appendChild(cell);
    }
  }

  document.getElementById('impos-overlay').classList.add('open');
}

function resolveImpossible() {
  document.getElementById('impos-overlay').classList.remove('open');
  const winner = 1 - _imposPlacer;
  showResult(winner,
    `${G.players[_imposPlacer].name}이(가) 실현 불가능한 설계을 만들었습니다.`,
    'ti-trophy'
  );
}

/* ── SHOW RESULT ── */
function showResult(wi, reason, icon) {
  showScreen('s-game');
  renderGame();
  document.getElementById('res-icon').className = `ti ti-${icon||'trophy'} res-icon`;
  document.getElementById('res-title').textContent = `${G.players[wi].name} 승리!`;
  document.getElementById('res-title').style.color = G.players[wi].color;
  document.getElementById('res-sub').innerHTML =
    `<b>${G.players[wi].name}</b>이(가) 이겼습니다!<br><br>${reason}`;
  document.getElementById('result-overlay').classList.add('open');
}

function closeResult() {
  document.getElementById('result-overlay').classList.remove('open');
  showScreen('s-game');
  const gm = document.getElementById('game-main');
  const tb = document.getElementById('topbar');
  if (gm) gm.classList.add('game-frozen');
  if (tb) tb.classList.add('game-frozen');
  document.getElementById('restart-bar-msg').textContent =
    document.getElementById('res-title').textContent;
  document.getElementById('restart-bar').classList.add('show');
}

/* ══ POST-GAME PLACEMENT SIMULATION ══ */
const SIM_VALUES=['0','1','2','3','4','5','6','7','8','M'];
let _simSelected='M';
let _simSnapshot=null;

function toggleSimMode(){
  G.simMode=!G.simMode;
  const btn=document.getElementById('sim-toggle-btn');
  const palette=document.getElementById('sim-palette');
  const msg=document.getElementById('restart-bar-msg');
  const resetBtn=document.getElementById('sim-reset-btn');
  const gm=document.getElementById('game-main');
  if(G.simMode){
    _simSnapshot=G.board.map(row=>row.slice());
    btn.classList.add('active');
    palette.classList.add('show');
    msg.style.display='none';
    resetBtn.style.display='';
    if(gm) gm.classList.add('sim-active');
    renderSimPalette();
  } else {
    btn.classList.remove('active');
    palette.classList.remove('show');
    msg.style.display='';
    resetBtn.style.display='none';
    if(gm) gm.classList.remove('sim-active');
  }
  renderBoard();
}

function renderSimPalette(){
  const pal=document.getElementById('sim-palette');
  pal.innerHTML='';
  SIM_VALUES.forEach(v=>{
    const sw=document.createElement('button');
    sw.className='sim-swatch'+(v===_simSelected?' active':'');
    sw.dataset.v=v;
    sw.innerHTML=(v==='M')?'<i class="ti ti-bolt"></i>':`<span>${v}</span>`;
    sw.onclick=()=>{_simSelected=v;renderSimPalette();};
    pal.appendChild(sw);
  });
  // eraser swatch
  const er=document.createElement('button');
  er.className='sim-swatch sim-eraser'+(_simSelected===null?' active':'');
  er.innerHTML='<i class="ti ti-trash"></i>';
  er.title='지우기';
  er.onclick=()=>{_simSelected=null;renderSimPalette();};
  pal.appendChild(er);
}

function simPlace(r,c){
  if(!isPlayable(r,c)) return;
  if(_simSelected===null){
    G.board[r][c]=null;G.boardOwner[r][c]=null;
  } else {
    G.board[r][c]=_simSelected;G.boardOwner[r][c]=null;
  }
  G.mines=G.board.flat().filter(v=>v==='M').length;
  document.getElementById('minec').textContent=G.mines;
  renderBoard();
}

function resetSim(){
  if(_simSnapshot){
    G.board=_simSnapshot.map(row=>row.slice());
    G.mines=G.board.flat().filter(v=>v==='M').length;
    document.getElementById('minec').textContent=G.mines;
    renderBoard();
  }
}
