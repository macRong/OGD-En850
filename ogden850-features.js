(function(){
const $=id=>document.getElementById(id);
const App=window.OgdenApp;
if(!App)return;

function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function getPool(cat){
  let list=[...App.words];
  if(cat&&cat!=='all')list=list.filter(w=>w.cat===cat);
  return shuffle(list);
}

function closeOv(id){$(id).classList.remove('act');}
function openOv(id){$(id).classList.add('act');}

let fcData=[],fcIdx=0,fcFlipped=false,fcCat='all';

function initFlashcard(cat){
  fcCat=cat||'all';
  fcData=getPool(fcCat);
  if(!fcData.length){App.showToast('没有可用的单词');return;}
  fcIdx=0;fcFlipped=false;
  openOv('fcOverlay');
  renderFlashcard();
}

function renderFlashcard(){
  if(fcIdx>=fcData.length){
    $('fcBody').innerHTML=`<div style="text-align:center;padding:40px 0">
      <div style="font-size:48px;margin-bottom:12px">🎉</div>
      <div style="font-size:20px;font-weight:600;margin-bottom:8px">全部完成！</div>
      <div style="color:var(--text3);margin-bottom:24px">你已浏览完 ${fcData.length} 个单词</div>
      <button class="btn p" id="fcRestart">重新开始</button>
    </div>`;
    document.getElementById('fcRestart').addEventListener('click',()=>initFlashcard(fcCat));
    return;
  }
  const w=fcData[fcIdx];
  const catInfo=App.CATS[w.cat];
  const subInfo=App.SUBS[w.sub]||w.sub;
  fcFlipped=false;
  $('fcBody').innerHTML=`
    <div class="fc-w" id="fcCardWrap">
      <div class="fc-card" id="fcCard">
        <div class="fc-f">
          <div class="fwd">${App.escHtml(w.word)}</div>
          <div class="fph">${App.escHtml(w.phonetic)}</div>
          <div class="fhint">点击卡片查看释义</div>
        </div>
        <div class="fc-b">
          <div class="bwd">${App.escHtml(w.word)}</div>
          <div class="bph">${App.escHtml(w.phonetic)}</div>
          <div class="bm2">${App.escHtml(w.meaning)}</div>
          <div class="bct">${catInfo?catInfo.n2:w.cat} · ${subInfo}</div>
        </div>
      </div>
    </div>
    <div class="fc-acts" id="fcActs" style="visibility:hidden">
      <button class="btn" id="fcNo">😕 不认识</button>
      <button class="btn" id="fcSoSo">🤔 模糊</button>
      <button class="btn p" id="fcYes">✓ 认识</button>
    </div>
    <div class="fc-prog">
      <span>${fcIdx+1} / ${fcData.length}</span>
      <div class="pm"><div class="pmf" style="width:${(fcIdx/fcData.length*100)}%"></div></div>
    </div>`;
  document.getElementById('fcCardWrap').addEventListener('click',()=>{
    if(!fcFlipped){
      fcFlipped=true;
      document.getElementById('fcCard').classList.add('flipped');
      document.getElementById('fcActs').style.visibility='visible';
      App.speak(w.word);
    }
  });
  document.getElementById('fcNo').addEventListener('click',()=>{
    App.setMastery(w.word,0);fcIdx++;renderFlashcard();
  });
  document.getElementById('fcSoSo').addEventListener('click',()=>{
    const m=App.getMastery(w.word);
    App.setMastery(w.word,Math.min(m+1,2));fcIdx++;renderFlashcard();
  });
  document.getElementById('fcYes').addEventListener('click',()=>{
    const m=App.getMastery(w.word);
    App.setMastery(w.word,Math.min(m+1,3));fcIdx++;renderFlashcard();
  });
}

let spData=[],spIdx=0,spCat='all',spRevealed=false;

function initSpelling(cat){
  spCat=cat||'all';
  spData=getPool(spCat);
  if(!spData.length){App.showToast('没有可用的单词');return;}
  spIdx=0;spRevealed=false;
  openOv('spOverlay');
  renderSpelling();
}

function renderSpelling(){
  if(spIdx>=spData.length){
    $('spBody').innerHTML=`<div style="text-align:center;padding:40px 0">
      <div style="font-size:48px;margin-bottom:12px">✍️</div>
      <div style="font-size:20px;font-weight:600;margin-bottom:8px">拼写练习完成！</div>
      <div style="color:var(--text3);margin-bottom:24px">你已练习 ${spData.length} 个单词</div>
      <button class="btn p" id="spRestart">重新开始</button>
    </div>`;
    document.getElementById('spRestart').addEventListener('click',()=>initSpelling(spCat));
    return;
  }
  const w=spData[spIdx];
  spRevealed=false;
  $('spBody').innerHTML=`
    <div style="text-align:center;margin-bottom:8px;font-size:13px;color:var(--text3)">${spIdx+1} / ${spData.length}</div>
    <div class="sp-meaning">${App.escHtml(w.meaning)}</div>
    <div class="sp-phonetic">${App.escHtml(w.phonetic)}</div>
    <div class="sp-input-wrap">
      <input type="text" class="sp-input" id="spInput" placeholder="输入单词..." autocomplete="off" autocapitalize="off" spellcheck="false">
    </div>
    <div class="sp-fb" id="spFb"></div>
    <div class="sp-acts">
      <button class="btn" id="spHint">💡 提示</button>
      <button class="btn p" id="spCheck">确认 <span class="kb">Enter</span></button>
      <button class="btn" id="spSkip">跳过 →</button>
    </div>`;
  const input=document.getElementById('spInput');
  input.focus();
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      e.preventDefault();
      checkSpelling(w);
    }
  });
  document.getElementById('spCheck').addEventListener('click',()=>checkSpelling(w));
  document.getElementById('spHint').addEventListener('click',()=>{
    if(!spRevealed){
      spRevealed=true;
      const hint=w.word[0]+'_'.repeat(w.word.length-1);
      input.value=hint;
      input.setSelectionRange(1,1);
      input.focus();
    }
  });
  document.getElementById('spSkip').addEventListener('click',()=>{
    App.setMastery(w.word,0);spIdx++;renderSpelling();
  });
}

function checkSpelling(w){
  const input=document.getElementById('spInput');
  const fb=document.getElementById('spFb');
  const val=input.value.trim().toLowerCase();
  const correct=w.word.toLowerCase();
  if(val===correct){
    input.classList.add('ok');
    fb.className='sp-fb ok';
    fb.textContent='✓ 正确！';
    App.speak(w.word);
    const m=App.getMastery(w.word);
    App.setMastery(w.word,Math.min(m+1,3));
    setTimeout(()=>{spIdx++;renderSpelling();},1000);
  }else{
    input.classList.add('err');
    fb.className='sp-fb err';
    fb.textContent=`✗ 正确拼写: ${w.word}`;
    App.setMastery(w.word,0);
    setTimeout(()=>{input.classList.remove('err');fb.className='sp-fb';fb.textContent='';input.value='';input.focus();},1500);
  }
}

let mgPairs=[],mgRevealed=[],mgMatched=0,mgMoves=0,mgFirst=-1,mgLocked=false,mgTimer=null,mgSec=0;

function initMatching(cat){
  const pool=getPool(cat).slice(0,6);
  if(pool.length<4){App.showToast('单词数量不足以开始配对');return;}
  mgPairs=[];
  pool.forEach((w,i)=>{
    mgPairs.push({id:i*2,type:'word',text:w.word,pairId:i});
    mgPairs.push({id:i*2+1,type:'meaning',text:w.meaning,pairId:i});
  });
  mgPairs=shuffle(mgPairs);
  mgRevealed=new Array(mgPairs.length).fill(false);
  mgMatched=0;mgMoves=0;mgFirst=-1;mgLocked=false;mgSec=0;
  if(mgTimer)clearInterval(mgTimer);
  openOv('mgOverlay');
  renderMatching();
  mgTimer=setInterval(()=>{
    mgSec++;
    const m=Math.floor(mgSec/60);
    const s=mgSec%60;
    const el=document.getElementById('mgTime');
    if(el)el.textContent=`${m}:${s<10?'0'+s:s}`;
  },1000);
}

function renderMatching(){
  const total=mgPairs.length/2;
  $('mgBody').innerHTML=`
    <div class="mg-info">
      <span>🎯 匹配: <strong id="mgMatched">${mgMatched}</strong>/${total}</span>
      <span>👆 步数: <strong id="mgMoves">${mgMoves}</strong></span>
      <span>⏱ <strong id="mgTime">0:00</strong></span>
    </div>
    <div class="mg-grid" id="mgGrid">
      ${mgPairs.map((p,i)=>`<div class="mg-card" data-idx="${i}">${mgRevealed[i]||p.done?App.escHtml(p.text):'?'}</div>`).join('')}
    </div>`;
  document.querySelectorAll('#mgGrid .mg-card').forEach(card=>{
    card.addEventListener('click',()=>{
      if(mgLocked)return;
      const idx=parseInt(card.dataset.idx);
      if(mgRevealed[idx]||mgPairs[idx].done)return;
      if(mgFirst===idx)return;
      mgRevealed[idx]=true;
      card.textContent=mgPairs[idx].text;
      card.classList.add('rev');
      if(mgFirst===-1){
        mgFirst=idx;
      }else{
        mgMoves++;
        document.getElementById('mgMoves').textContent=mgMoves;
        const first=mgFirst;
        mgFirst=-1;
        mgLocked=true;
        if(mgPairs[first].pairId===mgPairs[idx].pairId&&mgPairs[first].type!==mgPairs[idx].type){
          mgPairs[first].done=true;mgPairs[idx].done=true;
          document.querySelectorAll('#mgGrid .mg-card')[first].classList.add('done');
          card.classList.add('done');
          mgMatched++;
          document.getElementById('mgMatched').textContent=mgMatched;
          mgLocked=false;
          if(mgMatched===mgPairs.length/2){
            clearInterval(mgTimer);mgTimer=null;
            setTimeout(()=>{
              pool=mgPairs.filter(p=>p.type==='word');
              pool.forEach(p=>{
                const w=App.words.find(x=>x.word===p.text);
                if(w){const m=App.getMastery(w.word);App.setMastery(w.word,Math.min(m+1,3));}
              });
              App.showToast('配对完成！所有单词已标记掌握 ✓');
              $('mgBody').innerHTML=`<div style="text-align:center;padding:30px 0">
                <div style="font-size:48px;margin-bottom:12px">🎉</div>
                <div style="font-size:20px;font-weight:600;margin-bottom:8px">配对完成！</div>
                <div style="color:var(--text3);margin-bottom:4px">步数: ${mgMoves} · 用时: ${document.getElementById('mgTime')?.textContent||'-'}</div>
                <div style="margin-top:20px"><button class="btn p" id="mgRestart">再来一次</button></div>
              </div>`;
              document.getElementById('mgRestart').addEventListener('click',()=>initMatching());
            },500);
          }
        }else{
          const fCard=document.querySelectorAll('#mgGrid .mg-card')[first];
          card.classList.add('wrong');fCard.classList.add('wrong');
          setTimeout(()=>{
            mgRevealed[first]=false;mgRevealed[idx]=false;
            fCard.textContent='?';fCard.classList.remove('rev','wrong');
            card.textContent='?';card.classList.remove('rev','wrong');
            mgLocked=false;
          },800);
        }
      }
    });
  });
}

function initStats(){
  const total=App.words.length;
  let m3=0,m2=0,m1=0,m0=0;
  const catProgress={};
  for(const k of Object.keys(App.CATS))catProgress[k]={total:0,mastered:0};
  App.words.forEach(w=>{
    const m=App.getMastery(w.word);
    if(m>=3)m3++;else if(m===2)m2++;else if(m===1)m1++;else m0++;
    if(catProgress[w.cat]){
      catProgress[w.cat].total++;
      if(m>=3)catProgress[w.cat].mastered++;
    }
  });
  const pct=m3/total*100;
  const quizRate=App.stats.quizTotal>0?Math.round(App.stats.quizCorrect/App.stats.quizTotal*100):0;
  $('stBody').innerHTML=`
    <div class="st-streak">
      <span class="fire">🔥</span>
      <span>连续学习 <strong>${App.stats.streak}</strong> 天</span>
      <span style="color:var(--text3)">· 累计 ${App.stats.totalDays} 天</span>
    </div>
    <div class="st-grid">
      <div class="st-card c3"><div class="sv">${m3}</div><div class="sl">已掌握</div></div>
      <div class="st-card c2"><div class="sv">${m2}</div><div class="sl">熟悉</div></div>
      <div class="st-card c1"><div class="sv">${m1}</div><div class="sl">学习中</div></div>
      <div class="st-card cd"><div class="sv">${m0}</div><div class="sl">新词</div></div>
    </div>
    <div class="st-overall">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
        <span>总体掌握度</span><span style="color:var(--primary)">${Math.round(pct)}%</span>
      </div>
      <div class="sbar">
        <div class="b3" style="width:${m3/total*100}%"></div>
        <div class="b2" style="width:${m2/total*100}%"></div>
        <div class="b1" style="width:${m1/total*100}%"></div>
        <div class="b0" style="width:${m0/total*100}%"></div>
      </div>
      <div class="st-legend">
        <span><div class="dot" style="background:var(--m3)"></div>已掌握 ${m3}</span>
        <span><div class="dot" style="background:var(--m2)"></div>熟悉 ${m2}</span>
        <span><div class="dot" style="background:var(--m1)"></div>学习中 ${m1}</span>
        <span><div class="dot" style="background:var(--border-light)"></div>新词 ${m0}</span>
      </div>
    </div>
    <div class="st-cats">
      <div style="font-size:13px;font-weight:600;margin-bottom:12px;color:var(--text3);letter-spacing:1px">分类进度</div>
      ${Object.entries(catProgress).map(([k,v])=>{
        const p=v.total>0?Math.round(v.mastered/v.total*100):0;
        return `<div class="st-cat">
          <div class="cn">${App.CATS[k]?App.CATS[k].n2:k}</div>
          <div class="cb"><div style="width:${p}%"></div></div>
          <div class="cp">${p}%</div>
        </div>`;
      }).join('')}
    </div>
    <div class="st-grid">
      <div class="st-card" style="border-color:var(--accent)">
        <div class="sv" style="color:var(--accent)">${App.stats.quizTotal}</div>
        <div class="sl">测验答题数</div>
      </div>
      <div class="st-card" style="border-color:var(--accent)">
        <div class="sv" style="color:var(--accent)">${quizRate}%</div>
        <div class="sl">测验正确率</div>
      </div>
    </div>
    <div style="text-align:center;margin-top:8px">
      <div style="font-size:13px;color:var(--text3)">已学习单词: <strong style="color:var(--primary)">${App.stats.wordsStudied.size}</strong> / ${total}</div>
    </div>`;
  openOv('stOverlay');
}

function init(){
  $('btnFlashcard').addEventListener('click',()=>initFlashcard());
  $('btnSpelling').addEventListener('click',()=>initSpelling());
  $('btnMatching').addEventListener('click',()=>initMatching());
  $('btnStats').addEventListener('click',()=>initStats());
  $('fcClose').addEventListener('click',()=>{closeOv('fcOverlay');});
  $('spClose').addEventListener('click',()=>{closeOv('spOverlay');});
  $('mgClose').addEventListener('click',()=>{if(mgTimer){clearInterval(mgTimer);mgTimer=null;}closeOv('mgOverlay');});
  $('stClose').addEventListener('click',()=>closeOv('stOverlay'));
  $('fcOverlay').addEventListener('click',e=>{if(e.target===$('fcOverlay'))closeOv('fcOverlay');});
  $('spOverlay').addEventListener('click',e=>{if(e.target===$('spOverlay'))closeOv('spOverlay');});
  $('mgOverlay').addEventListener('click',e=>{if(e.target===$('mgOverlay')){if(mgTimer){clearInterval(mgTimer);mgTimer=null;}closeOv('mgOverlay');}});
  $('stOverlay').addEventListener('click',e=>{if(e.target===$('stOverlay'))closeOv('stOverlay');});
}

if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
else{init();}
})();
