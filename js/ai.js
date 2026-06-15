(function(){
  const profiles={
    beginner:{sample:18,top:8,noise:5,attack:0,detect:0.62},
    expert:{sample:60,top:3,noise:1.4,attack:1.8,detect:0.94}
  };

  function copyBoard(){return G.board.map(row=>row.slice());}
  function adjacent(r,c){return getAdjacentCells(r,c);}

  function localPressure(board,r,c,value){
    const near=adjacent(r,c);
    const occupied=near.filter(([ar,ac])=>board[ar][ac]!==null).length;
    const empty=near.length-occupied;
    let score=occupied*1.4;
    if(value==='M'){
      score+=near.filter(([ar,ac])=>board[ar][ac]!==null&&board[ar][ac]!=='M').length*1.2;
    }else{
      const n=Number(value);
      score+=Math.abs(n-empty/2)*.25;
      if(n===0||n>=5)score+=1.5;
    }
    return score;
  }

  function obviousContradiction(board,r,c){
    for(const [nr,nc] of [[r,c],...adjacent(r,c)]){
      const v=board[nr]?.[nc];
      if(v===null||v==='M'||v===undefined)continue;
      const n=Number(v), cells=adjacent(nr,nc);
      const mines=cells.filter(([ar,ac])=>board[ar][ac]==='M').length;
      const blanks=cells.filter(([ar,ac])=>board[ar][ac]===null).length;
      if(mines>n||mines+blanks<n)return true;
    }
    return false;
  }

  function candidates(profile){
    const all=[];
    const hand=G.players[AI_PLAYER].hand;
    for(let hi=0;hi<hand.length;hi++)for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      if(!isPlayable(r,c)||G.board[r][c]!==null)continue;
      all.push({handIndex:hi,value:hand[hi],r,c});
    }
    for(let i=all.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[all[i],all[j]]=[all[j],all[i]];}
    return all.slice(0,Math.min(all.length,profile.sample));
  }

  function scoreMove(move,profile){
    const board=copyBoard();board[move.r][move.c]=move.value;
    const result=checkBoardPossibility(board);
    let score=localPressure(board,move.r,move.c,move.value)*profile.attack;
    if(result.possible){
      const forced=(result.forcedMines?.size||0)+(result.forcedSafe?.size||0);
      score+=forced*(profile.attack?0.35:0.05);
      if(!profile.attack)score+=adjacent(move.r,move.c).filter(([r,c])=>board[r][c]===null).length;
    }else{
      if(profile.attack===0||obviousContradiction(board,move.r,move.c))return -Infinity;
      score+=4.5; // 고수는 드물게 눈에 덜 띄는 모순을 넘긴다.
    }
    return score+(Math.random()-.5)*profile.noise;
  }

  function takeTurn({level}){
    const profile=profiles[level]||profiles.beginner;
    const current=checkBoardPossibility(G.board);
    if(!current.possible&&Math.random()<profile.detect){resolveAiDeclaration();return;}
    const ranked=candidates(profile).map(m=>({...m,score:scoreMove(m,profile)}))
      .filter(m=>Number.isFinite(m.score)).sort((a,b)=>b.score-a.score);
    if(!ranked.length){aiFallbackPass();return;}
    const pool=ranked.slice(0,profile.top);
    executeAiPlacement(pool[Math.floor(Math.random()*pool.length)]);
  }
  window.OrbitalAI={takeTurn};
})();
