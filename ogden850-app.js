(function(){
const $=id=>document.getElementById(id);
const words=[];
const mastery={};
const bookmarks=new Set();
const stats={streak:0,lastDate:'',totalDays:0,quizCorrect:0,quizTotal:0,wordsStudied:new Set()};
const MASTERY_KEY='ogden850_mastery';
const BOOKMARK_KEY='ogden850_bookmarks';
const STATS_KEY='ogden850_stats';
const THEME_KEY='ogden850_theme';
const FILTER_KEY='ogden850_filter';

function loadData(){
  const lines=D.trim().split('\n');
  lines.forEach((line,i)=>{
    const p=line.split('|');
    if(p.length>=5){
      words.push({id:i,word:p[0],phonetic:p[1],meaning:p[2],cat:p[3],sub:p[4]});
    }
  });
}

function loadProgress(){
  try{
    const ms=localStorage.getItem(MASTERY_KEY);
    if(ms){const obj=JSON.parse(ms);for(const[k,v]of Object.entries(obj))mastery[k]=v;}
    const bs=localStorage.getItem(BOOKMARK_KEY);
    if(bs){JSON.parse(bs).forEach(w=>bookmarks.add(w));}
    const ss=localStorage.getItem(STATS_KEY);
    if(ss){const obj=JSON.parse(ss);stats.streak=obj.streak||0;stats.lastDate=obj.lastDate||'';stats.totalDays=obj.totalDays||0;stats.quizCorrect=obj.quizCorrect||0;stats.quizTotal=obj.quizTotal||0;if(obj.wordsStudied)obj.wordsStudied.forEach(w=>stats.wordsStudied.add(w));}
  }catch(e){}
  migrateOldProgress();
}

function migrateOldProgress(){
  try{
    const old=localStorage.getItem('ogden850_learned');
    if(old){
      JSON.parse(old).forEach(w=>{
        if(mastery[w]===undefined)mastery[w]=3;
      });
      localStorage.removeItem('ogden850_learned');
      saveMastery();
    }
  }catch(e){}
}

function saveMastery(){try{localStorage.setItem(MASTERY_KEY,JSON.stringify(mastery));}catch(e){}}
function saveBookmarks(){try{localStorage.setItem(BOOKMARK_KEY,JSON.stringify([...bookmarks]));}catch(e){}}
function saveStats(){try{localStorage.setItem(STATS_KEY,JSON.stringify({streak:stats.streak,lastDate:stats.lastDate,totalDays:stats.totalDays,quizCorrect:stats.quizCorrect,quizTotal:stats.quizTotal,wordsStudied:[...stats.wordsStudied]}));}catch(e){}}

function getMastery(word){return mastery[word]||0;}
function setMastery(word,level){
  const old=mastery[word]||0;
  mastery[word]=level;
  saveMastery();
  if(level>0)stats.wordsStudied.add(word);
  updateStreak();
  saveStats();
  updateStats();
  renderWords();
}
function toggleBookmark(word){
  if(bookmarks.has(word)){bookmarks.delete(word);showToast('已取消收藏');}
  else{bookmarks.add(word);showToast('已收藏 ⭐');}
  saveBookmarks();
  renderWords();
}

function updateStreak(){
  const today=new Date().toISOString().slice(0,10);
  if(stats.lastDate===today)return;
  if(stats.lastDate){
    const last=new Date(stats.lastDate);
    const diff=Math.floor((new Date(today)-last)/(1000*60*60*24));
    if(diff===1)stats.streak++;
    else if(diff>1)stats.streak=1;
  }else{stats.streak=1;}
  stats.lastDate=today;
  stats.totalDays++;
}

function loadTheme(){
  const t=localStorage.getItem(THEME_KEY);
  if(t==='light'){document.documentElement.setAttribute('data-theme','light');$('btnTheme').textContent='🌙';}
  else{document.documentElement.setAttribute('data-theme','dark');$('btnTheme').textContent='☀️';}
}
function toggleTheme(){
  const isLight=document.documentElement.getAttribute('data-theme')==='light';
  if(isLight){document.documentElement.setAttribute('data-theme','dark');$('btnTheme').textContent='☀️';localStorage.setItem(THEME_KEY,'dark');}
  else{document.documentElement.setAttribute('data-theme','light');$('btnTheme').textContent='🌙';localStorage.setItem(THEME_KEY,'light');}
}

function updateStats(){
  const total=words.length;
  let m3=0,m2=0,m1=0,m0=0;
  words.forEach(w=>{
    const m=getMastery(w.word);
    if(m>=3)m3++;else if(m===2)m2++;else if(m===1)m1++;else m0++;
  });
  $('sL').textContent=m3;
  $('sF').textContent=m2;
  $('sG').textContent=m1;
  $('sN').textContent=m0;
  $('pF').style.width=((m3+m2+m1)/total*100)+'%';
}

function showToast(msg){
  const t=$('toast');
  t.textContent=msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),2000);
}

function speak(word){
  if('speechSynthesis' in window){
    const u=new SpeechSynthesisUtterance(word);
    u.lang='en-US';u.rate=0.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
}

function escHtml(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}

let currentCat='all';
let currentAlpha='';
let currentSort='alpha';
let currentFilter='unlearned';
let searchQuery='';

function getFilteredWords(){
  let list=[...words];
  if(currentCat!=='all')list=list.filter(w=>w.cat===currentCat);
  if(currentAlpha)list=list.filter(w=>w.word[0].toUpperCase()===currentAlpha);
  if(searchQuery){
    const q=searchQuery.toLowerCase();
    list=list.filter(w=>w.word.toLowerCase().includes(q)||w.meaning.includes(q));
  }
  if(currentFilter==='unlearned')list=list.filter(w=>getMastery(w.word)<3);
  else if(currentFilter==='bm')list=list.filter(w=>bookmarks.has(w.word));
  else if(currentFilter==='m0')list=list.filter(w=>getMastery(w.word)===0);
  else if(currentFilter==='m1')list=list.filter(w=>getMastery(w.word)===1);
  else if(currentFilter==='m2')list=list.filter(w=>getMastery(w.word)===2);
  else if(currentFilter==='m3')list=list.filter(w=>getMastery(w.word)>=3);
  if(currentSort==='alpha')list.sort((a,b)=>a.word.localeCompare(b.word));
  else if(currentSort==='alpha-desc')list.sort((a,b)=>b.word.localeCompare(a.word));
  else if(currentSort==='cat')list.sort((a,b)=>a.cat.localeCompare(b.cat)||a.sub.localeCompare(b.sub)||a.word.localeCompare(b.word));
  return list;
}

function renderTabs(){
  const tabsEl=$('cTabs');
  const catCounts={};
  words.forEach(w=>{catCounts[w.cat]=(catCounts[w.cat]||0)+1;});
  let html=`<button class="tab ${currentCat==='all'?'active':''}" data-cat="all">全部<span class="cnt">${words.length}</span></button>`;
  for(const[k,v]of Object.entries(CATS)){
    html+=`<button class="tab ${currentCat===k?'active':''}" data-cat="${k}">${v.n2}<span class="cnt">${catCounts[k]||0}</span></button>`;
  }
  tabsEl.innerHTML=html;
  tabsEl.querySelectorAll('.tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      currentCat=btn.dataset.cat;
      currentAlpha='';
      renderTabs();renderAlphaNav();renderWords();
    });
  });
}

function renderAlphaNav(){
  const navEl=$('alphaNav');
  const list=currentCat==='all'?words:words.filter(w=>w.cat===currentCat);
  const letters=new Set();
  list.forEach(w=>{if(w.word[0])letters.add(w.word[0].toUpperCase());});
  const all='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let html='';
  all.forEach(l=>{
    const has=letters.has(l);
    html+=`<a class="${has?'':'dis'} ${currentAlpha===l?'act':''}" data-letter="${l}">${l}</a>`;
  });
  navEl.innerHTML=html;
  navEl.querySelectorAll('a:not(.dis)').forEach(a=>{
    a.addEventListener('click',()=>{
      const l=a.dataset.letter;
      currentAlpha=currentAlpha===l?'':l;
      renderAlphaNav();renderWords();
    });
  });
}

function renderWords(){
  const grid=$('wGrid');
  const list=getFilteredWords();
  if(!list.length){
    grid.innerHTML='<div class="es"><div class="ic">📖</div><p>没有找到匹配的单词</p></div>';
    return;
  }
  let html='';
  list.forEach((w,idx)=>{
    const m=getMastery(w.word);
    const mClass=m>=3?'m3':m===2?'m2':m===1?'m1':'';
    const isBm=bookmarks.has(w.word);
    const catInfo=CATS[w.cat];
    const subInfo=SUBS[w.sub]||w.sub;
    html+=`<div class="wc ${mClass}" data-id="${w.id}" data-word="${escHtml(w.word)}" style="animation-delay:${Math.min(idx*0.02,0.3)}s">
      <div class="lb">✓</div>
      <div class="wc-acts">
        <div class="wc-know" data-word="${escHtml(w.word)}" title="认识，隐藏此词">✓ 认识</div>
      </div>
      <div class="wc-head">
        <div class="w">${escHtml(w.word)}</div>
        <div class="bm ${isBm?'on':''}" data-word="${escHtml(w.word)}" title="收藏">${isBm?'★':'☆'}</div>
      </div>
      <div class="ph">${escHtml(w.phonetic)}</div>
      <div class="ch">${escHtml(w.meaning)}</div>
      <div class="ct">${catInfo?catInfo.n2:w.cat} · ${subInfo}</div>
    </div>`;
  });
  grid.innerHTML=html;
  grid.querySelectorAll('.bm').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      e.stopPropagation();
      toggleBookmark(btn.dataset.word);
    });
  });
  grid.querySelectorAll('.wc-know').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      e.stopPropagation();
      e.preventDefault();
      const word=btn.dataset.word;
      mastery[word]=3;
      saveMastery();
      if(stats.wordsStudied)stats.wordsStudied.add(word);
      updateStreak();
      saveStats();
      updateStats();
      btn.closest('.wc').classList.add('wc-out');
    });
  });
  grid.querySelectorAll('.wc').forEach(card=>{
    card.addEventListener('click',(e)=>{
      if(e.target.classList.contains('bm')||e.target.classList.contains('wc-know'))return;
      openModal(words[parseInt(card.dataset.id)]);
    });
  });
}

function openModal(w){
  const m=getMastery(w.word);
  const isBm=bookmarks.has(w.word);
  const catInfo=CATS[w.cat];
  const subInfo=SUBS[w.sub]||w.sub;
  const mLabels=['新词','学习中','熟悉','已掌握'];
  const mColors=['var(--danger)','var(--m1)','var(--m2)','var(--m3)'];
  $('mBody').innerHTML=`
    <div class="mw-row">
      <div><div class="mw">${escHtml(w.word)}</div>
      <div class="mp">${escHtml(w.phonetic)}</div>
      <div class="mch">${escHtml(w.meaning)}</div></div>
      <button class="speak-btn" id="btnSpeak" title="发音">🔊</button>
    </div>
    <div class="ms">
      <h3>掌握度 Mastery</h3>
      <div style="display:flex;gap:6px;margin-top:4px">
        ${[0,1,2,3].map(l=>`<button class="btn ${m===l?'p':''}" data-m="${l}" style="font-size:12px;padding:6px 12px;${m===l?'background:'+mColors[l]:';'}">${mLabels[l]}</button>`).join('')}
      </div>
    </div>
    <div class="ms">
      <h3>分类 Category</h3>
      <p>${catInfo?catInfo.n:''} (${catInfo?catInfo.n2:''}) · ${subInfo}</p>
    </div>
    <div class="ms">
      <h3>说明 Description</h3>
      <p>${catInfo?catInfo.d:''}</p>
    </div>
    <div class="ma">
      <button class="btn ${isBm?'p':''}" id="btnBm">${isBm?'★ 已收藏':'☆ 收藏'}</button>
      <button class="btn" id="btnPrev">← 上一个</button>
      <button class="btn" id="btnNext">下一个 →</button>
    </div>`;
  $('mOverlay').classList.add('act');
  $('btnSpeak').addEventListener('click',(e)=>{e.stopPropagation();speak(w.word);});
  $('mBody').querySelectorAll('[data-m]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      setMastery(w.word,parseInt(btn.dataset.m));
      openModal(w);
    });
  });
  $('btnBm').addEventListener('click',()=>{toggleBookmark(w.word);openModal(w);});
  $('btnPrev').addEventListener('click',()=>{
    const idx=words.indexOf(w);
    if(idx>0)openModal(words[idx-1]);
  });
  $('btnNext').addEventListener('click',()=>{
    const idx=words.indexOf(w);
    if(idx<words.length-1)openModal(words[idx+1]);
  });
}

function closeModal(){$('mOverlay').classList.remove('act');}

let quizData=null,quizIdx=0,quizScore=0;

function startQuiz(){
  const pool=[...words].sort(()=>Math.random()-0.5).slice(0,10);
  if(pool.length<4){showToast('单词数量不足以开始测验');return;}
  quizData=pool;quizIdx=0;quizScore=0;
  renderQuizQuestion();
  $('qOverlay').classList.add('act');
}

function renderQuizQuestion(){
  if(quizIdx>=quizData.length){renderQuizResult();return;}
  const w=quizData[quizIdx];
  $('qProg').textContent=`${quizIdx+1} / ${quizData.length}`;
  const wrongPool=words.filter(x=>x.word!==w.word).sort(()=>Math.random()-0.5).slice(0,3);
  const options=[w,...wrongPool].sort(()=>Math.random()-0.5);
  $('qBox').innerHTML=`
    <div class="qq">
      <div class="qw">${escHtml(w.word)}</div>
      <div class="qph">${escHtml(w.phonetic)}</div>
    </div>
    <div class="qos">
      ${options.map(o=>`<div class="qo2" data-word="${escHtml(o.word)}" data-correct="${o.word===w.word}">${escHtml(o.meaning)}</div>`).join('')}
    </div>`;
  $('qBox').querySelectorAll('.qo2').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const isCorrect=btn.dataset.correct==='true';
      stats.quizTotal++;
      if(isCorrect){
        btn.classList.add('ok');quizScore++;stats.quizCorrect++;
        const m=getMastery(w.word);
        if(m<3)setMastery(w.word,m+1);
      }else{
        btn.classList.add('no');
        $('qBox').querySelector('.qo2[data-correct="true"]').classList.add('ok');
        if(getMastery(w.word)>0)setMastery(w.word,Math.max(0,getMastery(w.word)-1));
      }
      saveStats();
      $('qBox').querySelectorAll('.qo2').forEach(b=>b.classList.add('dis'));
      setTimeout(()=>{quizIdx++;renderQuizQuestion();},1200);
    });
  });
}

function renderQuizResult(){
  const pct=Math.round(quizScore/quizData.length*100);
  let emoji='📖';
  if(pct>=80)emoji='🏆';else if(pct>=60)emoji='👍';else if(pct>=40)emoji='💪';
  $('qProg').textContent='';
  $('qBox').innerHTML=`
    <div class="qr">
      <div style="font-size:48px;margin-bottom:12px">${emoji}</div>
      <div class="sc">${quizScore}/${quizData.length}</div>
      <div class="la">正确率 ${pct}%</div>
      <div class="ac">
        <button class="btn" id="btnQuizClose">关闭</button>
        <button class="btn p" id="btnQuizRetry">再来一次</button>
      </div>
    </div>`;
  $('btnQuizClose').addEventListener('click',()=>$('qOverlay').classList.remove('act'));
  $('btnQuizRetry').addEventListener('click',startQuiz);
}

function init(){
  loadData();loadProgress();loadTheme();
  const savedFilter=localStorage.getItem(FILTER_KEY);
  if(savedFilter){currentFilter=savedFilter;$('filterSel').value=savedFilter;}
  updateStats();renderTabs();renderAlphaNav();renderWords();

  $('searchInput').addEventListener('input',e=>{searchQuery=e.target.value.trim();renderWords();});
  $('sortSel').addEventListener('change',e=>{currentSort=e.target.value;renderWords();});
  $('filterSel').addEventListener('change',e=>{currentFilter=e.target.value;localStorage.setItem(FILTER_KEY,currentFilter);renderWords();});
  $('btnTheme').addEventListener('click',toggleTheme);
  $('btnQuiz').addEventListener('click',startQuiz);
  $('mClose').addEventListener('click',closeModal);
  $('mOverlay').addEventListener('click',e=>{if(e.target===$('mOverlay'))closeModal();});
  $('qOverlay').addEventListener('click',e=>{if(e.target===$('qOverlay'))$('qOverlay').classList.remove('act');});

  $('btnReset').addEventListener('click',()=>{
    if(Object.keys(mastery).length===0&&bookmarks.size===0){showToast('没有需要重置的进度');return;}
    Object.keys(mastery).forEach(k=>delete mastery[k]);
    bookmarks.clear();
    stats.streak=0;stats.lastDate='';stats.totalDays=0;stats.quizCorrect=0;stats.quizTotal=0;stats.wordsStudied.clear();
    saveMastery();saveBookmarks();saveStats();
    currentFilter='unlearned';$('filterSel').value='unlearned';localStorage.setItem(FILTER_KEY,'unlearned');
    updateStats();renderWords();
    showToast('学习进度已重置');
  });

  const backTopBtn=$('backTop');
  window.addEventListener('scroll',()=>{backTopBtn.classList.toggle('show',window.scrollY>400);});
  backTopBtn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if($('qOverlay').classList.contains('act'))$('qOverlay').classList.remove('act');
      else if($('fcOverlay').classList.contains('act'))$('fcOverlay').classList.remove('act');
      else if($('spOverlay').classList.contains('act'))$('spOverlay').classList.remove('act');
      else if($('mgOverlay').classList.contains('act'))$('mgOverlay').classList.remove('act');
      else if($('stOverlay').classList.contains('act'))$('stOverlay').classList.remove('act');
      else closeModal();
    }
    if(e.key==='/'&&document.activeElement.tagName!=='INPUT'){e.preventDefault();$('searchInput').focus();}
  });

  window.OgdenApp={words,mastery,bookmarks,stats,getMastery,setMastery,speak,escHtml,showToast,CATS,SUBS,updateStats,saveStats,updateStreak};
}

if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}
else{init();}
})();
