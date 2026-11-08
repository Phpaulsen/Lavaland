// Rauchtest: startet das Spiel in einem Handy-Browser und prüft die wichtigsten Abläufe.
// Aufruf: node tests/smoke.mjs   (braucht das npm-Paket playwright und einen Chromium)
// Optional: CHROMIUM=/pfad/zu/chrome
import { serve } from './server.mjs';
import { launch, phone, FIREFOX } from './browser.mjs';


const tests = [];
const test = (name, fn) => tests.push({ name, fn });
// Braucht das Chrome-Protokoll (CDP), das es in Firefox nicht gibt.
const testCdp = (name, fn) => tests.push({ name, fn, cdp: true });

test('Start ohne Fehler, Welt erzeugt', async ({ ev }) => {
  const s = await ev('({ready: ST.ready, w:GX, x:P.x, mode:P.mode})');
  if (!s.ready) throw new Error('Spiel nicht bereit');
  if (s.w < 10000) throw new Error('Welt zu klein: ' + s.w);
});

test('Lernschrift kommt aus dem Repo', async ({ page }) => {
  const ok = await page.evaluate(() => document.fonts.load('700 20px Andika').then(f => f.length > 0));
  if (!ok) throw new Error('Andika nicht geladen');
});

test('Laufen bewegt den Helden', async ({ ev, page }) => {
  await ev('OVS.forEach(o=>o.hidden=true); ST.paused=false');
  const x0 = await ev('P.x');
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1200); await page.keyboard.up('ArrowRight');
  const x1 = await ev('P.x');
  if (Math.abs(x1 - x0) < 20) throw new Error('Held hat sich nicht bewegt: ' + x0 + ' -> ' + x1);
});

test('Lernaufgabe mit Ziffernblock richtig lösen', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; ST.energy=0; pickFact=function(){return '2+3'}; openQuiz(); for(let i=0;i<20&&lastF!=='2+3';i++) nextQ()");
  await page.waitForTimeout(400);
  if (await ev("$('quiz').hidden")) throw new Error('Aufgabe nicht geöffnet');
  await ev("padKey('5'); padSubmit()");
  await page.waitForTimeout(2500);
  const e = await ev('ST.energy');
  if (!(e > 0)) throw new Error('Akku nicht geladen: ' + e);
});

test('Escape schließt die Aufgabe und gibt das Spiel frei', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; ST.energy=MAXE; openQuiz()");
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  if (!(await ev("$('quiz').hidden")) || await ev('ST.paused')) throw new Error('Aufgabe offen oder Spiel pausiert');
});

test('Elternansicht zeigt das Protokoll', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; parOpen()");
  await page.waitForTimeout(1500);
  if (await ev("$('par').hidden")) throw new Error('Elternansicht nicht geöffnet');
  const t = await ev("$('par-body').textContent");
  if (!/Lernanteil/.test(t)) throw new Error('Zeitauswertung fehlt in der Elternansicht');
  if (await ev("$('par').querySelectorAll('script').length")) throw new Error('Skript in der Elternansicht');
  await ev("$('par').hidden=true");
});

test('Elternansicht zählt Sandbox-Zeit je Fahrzeug', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; ST.energy=MAXE; setMode('car'); for(let i=0;i<40;i++) LOG.tick(1); LOG.flush(); setMode('walk')");
  await page.waitForTimeout(500);
  await ev('parOpen()'); await page.waitForTimeout(1500);
  const t = await ev("$('par-body').textContent");
  if (!/Sandbox: womit/.test(t) || !/Auto/.test(t)) throw new Error('Fahrzeugzeit fehlt in der Elternansicht');
  await ev("$('par').hidden=true");
});

test('Schaufel gräbt zu Fuß ohne Akku', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; ST.energy=0; setMode('walk'); P.x=1500; P.y=ground(1500); P.on=true; $('tool-cards').querySelector('[data-tool=shovel]').click()");
  const y0 = await ev('P.y');
  await ev('keys.d=true; keys.a=true'); await page.waitForTimeout(1500); await ev('keys.a=false; keys.d=false; setTool(null,true)');
  if (!(await ev('P.y') > y0 + 30)) throw new Error('nicht nach unten gegraben');
  if (!(await ev("$('quiz').hidden"))) throw new Error('Schaufel hat die Lernaufgabe verlangt');
});

// Ein Hohlraum mitten im Fels, weit weg von allem anderen, damit nur Fels um den Helden ist.
const ROCKBOX = (x, extra) => `OVS.forEach(o=>o.hidden=true); ST.paused=false; ST.energy=MAXE; hero.dr=0; OPT.mon=false; ST.tool=null; syncUI(); ${extra || ''};
  const X=${x}, Y=ground(X)+900, c0=Math.floor((X-260)/CELL), c1=Math.floor((X+260)/CELL);
  for(let r=Math.floor((Y-500-TOP)/CELL);r<=Math.floor((Y+200-TOP)/CELL);r++) for(let c=c0;c<=c1;c++) grid[r*GX+c]=ROCK;
  for(let r=Math.floor((Y-60-TOP)/CELL);r<Math.floor((Y-TOP)/CELL);r++) for(let c=Math.floor((X-30)/CELL);c<=Math.floor((X+30)/CELL);c++) grid[r*GX+c]=0;
  P.x=X; P.y=Y; P.vx=0; P.vy=0; P.on=false; P.face=1; P.da=0; 1`;
const hold = async (ev, page, k, ms) => { await ev(k.map(x => 'keys.' + x + '=true').join(';')); await page.waitForTimeout(ms); await ev('keys.l=keys.r=keys.u=keys.d=keys.a=false; OPT.mon=true'); };

test('Unter der Erde gräbt Drücken nach oben, unten und zur Seite, ohne Akku', async ({ ev, page }) => {
  for (const [k, ax, sg] of [[['u'], 1, -1], [['d'], 1, 1], [['r'], 0, 1]]) {
    await ev("setMode('walk'); " + ROCKBOX(20000, 'energy=0'));
    await page.waitForTimeout(300);
    const a = await ev('[P.x,P.y]');
    await hold(ev, page, k, 2500);
    const b = await ev('[P.x,P.y]');
    if (!((b[ax] - a[ax]) * sg > 120)) throw new Error('Drücken ' + k + ' gräbt nicht: ' + Math.round(b[ax] - a[ax]));
    if (!(await ev("$('quiz').hidden"))) throw new Error('Graben zu Fuß hat die Lernaufgabe verlangt');
  }
});

test('Tunnelbohrer bohrt senkrecht nach oben und hält sich im Schacht', async ({ ev, page }) => {
  await ev("setMode('tbm'); " + ROCKBOX(21000));
  await page.waitForTimeout(300);
  const y0 = await ev('P.y');
  await hold(ev, page, ['u'], 3500);
  const y1 = await ev('P.y');
  if (!(y0 - y1 > 120)) throw new Error('Bohrer kommt nicht nach oben: ' + Math.round(y0 - y1));
  await page.waitForTimeout(800);
  if (!(Math.abs(await ev('P.y') - y1) < 8)) throw new Error('Bohrer rutscht im Schacht zurück');
  await ev("setMode('walk')");
});

test('Harte Schicht hält auch beim Graben nach oben ohne Bohrer', async ({ ev, page }) => {
  await ev("setMode('walk'); " + ROCKBOX(22000, '') + "; const c=Math.floor(P.x/CELL), rr=Math.floor((P.y-100-TOP)/CELL); for(let r=rr-3;r<=rr;r++) for(let x=c-10;x<=c+10;x++) grid[r*GX+x]=SHELL; 1");
  await page.waitForTimeout(300);
  const y0 = await ev('P.y');
  await hold(ev, page, ['u'], 2000);
  if (!(y0 - await ev('P.y') < 90)) throw new Error('Held gräbt durch die harte Schicht');
});

test('Sternschnuppe landet und lässt sich aufheben', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; setMode('walk'); P.x=1500; P.y=ground(1500); P.on=true; METS=[]; MROCKS=[]; nightOn=true; nightA=1; METS.push({x:P.x-300,y:P.y-400,vx:0,vy:0,t:.05,land:true,tr:[]})");
  await page.waitForTimeout(400);
  if (await ev('MROCKS.length') !== 1) throw new Error('kein Sternstein gelandet');
  await ev('P.x=MROCKS[0].x; P.y=ground(P.x); P.vy=0'); await page.waitForTimeout(400);
  if (await ev('MROCKS.length')) throw new Error('Sternstein nicht aufgehoben');
  await ev('nightOn=false; nightA=0; metNext=time+999');
});

test('Schiffswrack: Truhe gibt einmal einen Schatz', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; setMode('walk'); teleport(WRECKS[0].x+400)");
  await page.waitForTimeout(800);
  await ev("$('banner-in').innerHTML=''");
  await ev('OVS.forEach(o=>o.hidden=true); ST.paused=false; P.x=WRECKS[0].x; P.y=ground(P.x)-10; P.vy=0'); await page.waitForTimeout(150);
  if (!(await ev("$('banner-in').innerHTML")).includes('🏴') || !(await ev('orbGot[WRECKS[0].k]'))) throw new Error('kein Schatz');
  await ev("$('banner-in').innerHTML=''");
  await ev('P.x=WRECKS[0].x+2; P.y=ground(P.x)-10'); await page.waitForTimeout(400);
  if (await ev("$('banner-in').innerHTML")) throw new Error('Schatz doppelt');
  await ev('teleport(1500)'); await page.waitForTimeout(500);
});

test('Fernrohr: Sterne zählen', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; setMode('walk'); for(const k in FX) FX[k]=0; P.x=SCOPEX+10; P.y=surfaceY(P.x); P.on=true; P.vy=0");
  await page.waitForTimeout(300);
  if (await ev('actIcon()') !== 'scope') throw new Error('Fernrohr-Knopf fehlt: ' + await ev('actIcon()'));
  await ev('doAction()'); await page.waitForTimeout(300);
  if (await ev("$('scope').hidden")) throw new Error('Fernrohr nicht geöffnet');
  await ev("$('banner-in').innerHTML=''");
  await ev("$('scope-b').querySelector('[data-sc=\"'+SCQ.n+'\"]').click()");
  if (!(await ev("$('banner-in').innerHTML")).includes('🔭')) throw new Error('richtige Zahl ohne Belohnung');
  await ev("$('scope').hidden=true");
});

test('Glühwürmchen fangen', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; setMode('walk'); JAR=[]; FLIES=[{hx:P.x,hy:P.y-20,x:P.x,y:P.y-20,ph:0,t:0}]; nightOn=true; nightA=1");
  await page.waitForTimeout(300);
  if (await ev('JAR.length') !== 1) throw new Error('Glühwürmchen nicht gefangen');
  await ev('nightOn=false; nightA=0; JAR=[]; FLIES=[]');
});

test('Kristallharfe von klein nach groß', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; setMode('walk'); for(const k in FX) FX[k]=0; teleport(HARPS[0].x0-80)");
  await page.waitForTimeout(800);
  for (let i = 0; i < 5; i++) { await ev('OVS.forEach(o=>o.hidden=true); P.x=HARPS[0].x0+' + i + '*34; P.y=ground(P.x); P.vy=0'); await page.waitForTimeout(150); }
  if (!(await ev('orbGot[HARPS[0].k]'))) throw new Error('Tonleiter nicht erkannt');
  await ev('teleport(1500)'); await page.waitForTimeout(500);
});

test('Vulkanausbruch wirft Lavabrocken', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; setMode('walk'); METS=[]; MROCKS=[]; P.x=2380; P.y=surfaceY(P.x); P.vy=0; eruT=0");
  await page.waitForTimeout(2400);
  if (!(await ev('MROCKS.length') >= 1)) throw new Error('kein Lavabrocken gelandet');
  await ev('MROCKS=[]; METS=[]; teleport(1500)'); await page.waitForTimeout(500);
});

test('Elternansicht: Monster aus, ruhige Darstellung an', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; parOpen()"); await page.waitForTimeout(1500);
  await ev("$('par-body').querySelector('[data-opt=mon0]').click()"); await page.waitForTimeout(800);
  await ev("$('par-body').querySelector('[data-opt=calm1]').click()"); await page.waitForTimeout(800);
  if (await ev('OPT.mon') || !(await ev('OPT.calm && reduced && document.body.classList.contains("calm")'))) throw new Error('Optionen nicht übernommen');
  await ev("$('par').hidden=true; MONS.push({x:P.x,y:P.y,lv:0,face:1,hp:1,hit:0,sq:0,vx:0,vy:0,t:0}); ST.paused=false"); await page.waitForTimeout(300);
  if (await ev('MONS.length')) throw new Error('Monster trotz aus');
  await ev("OPT.mon=true; OPT.calm=false; reduced=reducedSys; document.body.classList.remove('calm'); optSave()");
});

test('Tastenkürzel: F öffnet Fahrzeuge, X steigt aus', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; setMode('walk')");
  await page.keyboard.press('f'); await page.waitForTimeout(200);
  if (await ev("$('garage').hidden")) throw new Error('F öffnet die Garage nicht');
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await ev("ST.energy=MAXE; setMode('car')"); await page.keyboard.press('x'); await page.waitForTimeout(200);
  if (await ev('P.mode') !== 'walk') throw new Error('X steigt nicht aus');
});

test('Absturzschutz: kaputtes Nebensystem friert das Spiel nicht ein', async ({ ev, page, errs }) => {
  const names = await ev("SIDE.map(s=>s.name).join(' ')");
  if (names !== 'arrowsTick monTick geyTick metTick wreckTick flyTick harpTick worldTick deepTick winterTick findsTick questTick autosave drain fogTick mkTick') throw new Error('SIDE: ' + names);
  const n = errs.length;
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; setMode('walk'); for(const k in FX) FX[k]=0; teleport(1200); window.__keep=SIDE.slice(); SIDE.push({name:'testKaputt',tick:function(){ throw new Error('Test: absichtlich kaputt'); }})");
  const x0 = await ev('P.x');
  await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1000); await page.keyboard.up('ArrowRight');
  const moved = Math.abs(await ev('P.x') - x0);
  const logged = await ev("errLoad().some(e=>/testKaputt \\(abgeschaltet\\)/.test(e.w))");
  await ev('SIDE.length=0; window.__keep.forEach(f=>SIDE.push(f)); localStorage.removeItem(ERRK)');
  errs.length = n;
  if (moved < 20) throw new Error('Spiel steht nach Fehler still');
  if (!logged) throw new Error('Fehler nicht im Protokoll');
});

test('Teilchen-Grenze hält, Ausrufe kommen trotzdem', async ({ ev }) => {
  const r = await ev("(function(){ for(let i=0;i<3000;i++) spawn(6,P.x,P.y,0,-100,2,3,'#fff'); shout(P.x,P.y-50,'TEST'); return {n:parts.length,max:pmax(),last:parts[parts.length-1].c}; })()");
  if (r.n > r.max) throw new Error('zu viele Teilchen: ' + r.n);
  if (r.last !== 'TEST') throw new Error('Ausruf verdrängt');
});

test('Reise zum Mond und zurück', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; ST.energy=MAXE; travel('moon')");
  await page.waitForTimeout(3500);
  if (await ev('realm') !== 'moon') throw new Error('Nicht auf dem Mond: ' + await ev('realm'));
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; travel('')");
  await page.waitForTimeout(3500);
  if (await ev('realm') !== '') throw new Error('Nicht zurück auf der Erde');
});

test('Vorlesen nimmt die Aufnahmen, fehlende Sätze die Browserstimme', async ({ ev, page }) => {
  await page.waitForFunction(() => window.__ev('VCLIP!==null'), null, { timeout: 5000 });
  const r = await ev(`(function(){ ST.talkLock=0; localStorage.removeItem('lavaland-vmiss');
    const u=speak('Hallo! Wie viel ist 3 plus 4?'), ids=speakSplit('Hallo! Wie viel ist 3 plus 4?').map(s=>VCLIP[s]);
    speak('Diesen Satz gibt es nicht als Aufnahme.');
    return {clip:!!u&&!('text' in u), ids:ids, miss:localStorage.getItem('lavaland-vmiss')};
  })()`);
  if (!r.clip || r.ids.length !== 2 || !r.ids.every(Boolean)) throw new Error('Keine Aufnahme benutzt: ' + JSON.stringify(r));
  if (!/Diesen Satz/.test(r.miss || '')) throw new Error('Fehlender Satz nicht gemerkt');
  const ok = await page.evaluate(id => window.__ev(`clipGet('${id}').then(u=>!!u)`), r.ids[1]);
  if (!ok) throw new Error('Aufnahme nicht ladbar');
  if (await ev("synthText('Hier fehlt die 8. 21 und 100 – 🐻')") !== 'Hier fehlt die acht. einundzwanzig und einhundert,') throw new Error('Zahlwörter falsch: ' + await ev("synthText('Hier fehlt die 8. 21 und 100 – 🐻')"));
});

test('Rätsel statt Aufgabe: Abbrechen mit Ladung erledigt den Auftrag, ohne Ladung nicht', async ({ ev }) => {
  const r = await ev(`(function(){
    OVS.forEach(o=>o.hidden=true); ST.paused=false; pzClose(); let n=0;
    ST.energy=0; openQuiz(function(){ n++; }); $('quiz-pz').click(); ST.energy=SEG; pzClose();
    const a=n, p1=pending;
    ST.energy=0; openQuiz(function(){ n++; }); $('quiz-pz').click(); pzClose();
    const b=n, p2=pending; ST.energy=SEG; closeQuiz();
    return {a, b, p1, p2, c:n};
  })()`);
  if (r.a !== 1) throw new Error('Auftrag nach Rätselabbruch mit Ladung nicht ausgeführt');
  if (r.p1 || r.p2 || r.c !== 1) throw new Error('Auftrag bleibt liegen und kommt später aus dem Nichts');
});

test('Waage hält sich an den Schulstand', async ({ ev }) => {
  const max = await ev(`(function(){
    const o=Object.assign({},SCH); SCH.on=true; let m=[0,0,0,0];
    for(let zr=0;zr<4;zr++){ SCH.zr=zr; for(let lv=0;lv<10;lv++) for(let i=0;i<30;i++){ const st=mkWaage(lv); const t=st.L.reduce((s,v)=>s+(v<0?st.box:v),0); m[zr]=Math.max(m[zr],t); } }
    Object.assign(SCH,o); return m;
  })()`);
  if (max[0] > 5 || max[1] > 10 || max[2] > 20 || max[3] > 20) throw new Error('Zahlen zu groß je Zahlenraum: ' + max.join(', '));
});

test('Bombe kostet 15 Akku, alter Vorrat zuerst', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; setMode('walk'); hero.tnt=1; ST.energy=MAXE; setTool('tnt')");
  await page.waitForTimeout(300);
  if (await ev('ST.energy') !== await ev('MAXE')) throw new Error('Bombenwerkzeug zieht Akku ohne Bombe');
  await ev('dropBomb(P.x+200,P.y-300)');
  if (await ev('hero.tnt') !== 0 || await ev('ST.energy') !== await ev('MAXE')) throw new Error('alte Bombe nicht zuerst verbraucht');
  await ev('dropBomb(P.x+200,P.y-300)');
  if (await ev('MAXE-ST.energy') !== 15) throw new Error('Bombe kostet ' + await ev('MAXE-ST.energy'));
  await ev('setTool(null); ST.energy=MAXE'); await page.waitForTimeout(2200);
});

test('Schutz wird in der Werkstatt gebaut', async ({ ev }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; setMode('walk'); hero.up.heat=0; hero.mat.zr=9; P.x=WSX; P.y=ground(WSX); P.on=true");
  await ev("openLab(); $('lab-rcp').querySelector('[data-mk=\"hs\"]').click()");
  if (await ev('hero.up.heat') !== 1 || await ev('hero.mat.zr') !== 7) throw new Error('Schutz nicht gebaut: ' + await ev('hero.up.heat') + ', ' + await ev('hero.mat.zr'));
  await ev('OVS.forEach(o=>o.hidden=true); hero.up.heat=0');
});

test('Werkstatt braucht nur Zahnräder und Meistersteine, Eisen bleibt liegen', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; setMode('walk'); hero.dr=0; hero.mat.zr=3; hero.mat.ms=0; hero.mat.fe=0");
  if (!(await ev("canBuild('dr')"))) throw new Error('Bohrer 1 nicht für 3 Zahnräder baubar');
  await ev("hero.dr=1; hero.mat.zr=99");
  if (await ev("canBuild('dr')")) throw new Error('Bohrer 2 ohne Meistersteine baubar');
  await ev("hero.mat.ms=2");
  if (!(await ev("canBuild('dr')"))) throw new Error('Bohrer 2 mit 6 Zahnrädern und 2 Meistersteinen nicht baubar');
  const m = await ev("(function(){ const m=MATS.find(function(q){ return q.k==='fe'&&!q.off; }); if(!m) return null; P.x=m.x; P.y=m.y+16; P.vy=0; return m.id; })()");
  if (m === null) throw new Error('kein Eisen in der Welt (Weltliste soll gleich bleiben)');
  await page.waitForTimeout(1300);
  if (await ev('hero.mat.fe') || await ev('ST.matGot[' + m + ']')) throw new Error('Eisen wurde eingesammelt');
  await ev("hero.dr=0; hero.mat.zr=0; hero.mat.ms=0; teleport(1500)"); await page.waitForTimeout(500);
});

test('Zonen schenken Feuerwerk, goldene Ski und Drachen', async ({ ev }) => {
  const own = await ev('JSON.stringify(hero.own)'), zn = await ev('hero.zn');
  await ev("hero.own={}; hero.zn=0; zoneGifts(false)");
  if (await ev('!!(hero.own.fw||hero.own.goldski||hero.own.dragon)')) throw new Error('Geschenk ohne Zone');
  await ev("hero.zn=1; zoneGifts(false)");
  if (!(await ev('hero.own.fw')) || await ev('!!hero.own.goldski')) throw new Error('Zone 1: nur Feuerwerk erwartet');
  await ev("hero.zn=4; zoneGifts(false)");
  if (!(await ev('hero.own.goldski')) || await ev('!!hero.own.dragon')) throw new Error('Zone 4: goldene Ski ohne Drachen erwartet');
  await ev("hero.zn=5; zoneGifts(false)");
  if (!(await ev('hero.own.dragon')) || await ev("$('mode-dragon').classList.contains('gone')")) throw new Error('Zone 5: Drache fehlt');
  if (await ev("!!document.getElementById('btn-story')")) throw new Error('Geschichte-Knopf noch da');
  if (await ev("!!document.getElementById('tasks')||!!document.getElementById('panel')")) throw new Error('Bau-Aufgaben noch da');
  if (await ev("!!document.getElementById('mis')||typeof misTick!=='undefined'")) throw new Error('Missionsbrett noch da');
  await ev('hero.own=' + own + '; hero.zn=' + zn + '; syncOwn()');
});

test('Auftrag nach der Einführung zeigt auf die nächste Zone oder ins All', async ({ ev }) => {
  const keep = await ev('JSON.stringify({q:hero.quest,qn:hero.qn,zn:hero.zn,dr:hero.dr,rk:hero.rk,h:hero.up.heat,zr:hero.mat.zr|0,ms:hero.mat.ms|0,mk:hero.mk,fin:hero.fin})');
  const q = (s) => ev("(function(){ " + s + "; const q=newQuest(); return q.type+(q.z?':'+q.z:'')+(q.k?':'+q.k:'')+(q.g?':'+q.g:''); })()");
  const base = "hero.qn=QSCRIPT.length+1; hero.zn=0; hero.dr=0; hero.rk=0; hero.up.heat=0; hero.mat.zr=0; hero.mat.ms=0; hero.mk={}; hero.fin=0";
  let r;
  if ((r = await q(base)) !== 'zone:1') throw new Error('gerade Nummer: Zone 1 erwartet, kam ' + r);
  if ((r = await q(base + '; hero.qn++')) !== 'orb:moon') throw new Error('ungerade Nummer: Mond erwartet, kam ' + r);
  if ((r = await q(base + '; hero.zn=2')) !== 'pz:dr') throw new Error('ohne Bohrer: Rätsel für den Bohrer erwartet, kam ' + r);
  if ((r = await q(base + '; hero.zn=2; hero.mat.zr=3')) !== 'make:dr') throw new Error('Bohrer baubar: Werkstatt erwartet, kam ' + r);
  if ((r = await q(base + '; hero.zn=4; hero.dr=1; hero.mat.zr=9')) !== 'orb:moon') throw new Error('Bohrer 2 wartet auf Meistersteine: Mond erwartet, kam ' + r);
  if (/^(zone|orb|make|core)/.test(r = await q(base + '; hero.zn=4; hero.dr=1; hero.mat.zr=9; hero.rk=1; hero.mk.o=3'))) throw new Error('beide warten auf Meistersteine: Zufall erwartet, kam ' + r);
  if ((r = await q(base + '; hero.zn=6; hero.dr=3; hero.up.heat=3; hero.rk=3; hero.mk.o=31')) !== 'core') throw new Error('am Ende Erdkern erwartet, kam ' + r);
  if (/^(zone|orb|make|core)/.test(r = await q(base + '; hero.zn=6; hero.dr=3; hero.up.heat=3; hero.rk=3; hero.mk.o=31; hero.fin=3'))) throw new Error('alles erreicht: Zufall erwartet, kam ' + r);
  await ev(base + "; hero.quest={type:'zone',z:1,goal:1,p:0}; showQuest(false); hero.zn=1; questTick(0)");
  if (!(await ev('quest.done'))) throw new Error('Zonen-Auftrag nicht erledigt');
  const k = JSON.parse(keep);
  await ev('hero.qn=' + k.qn + '; hero.zn=' + k.zn + '; hero.dr=' + k.dr + '; hero.rk=' + k.rk + '; hero.up.heat=' + k.h + '; hero.mat.zr=' + k.zr + '; hero.mat.ms=' + k.ms + '; hero.mk=' + JSON.stringify(k.mk) + '; hero.fin=' + k.fin + '; hero.quest=' + JSON.stringify(k.q) + '; qDoneT=0; if(hero.quest) showQuest(false)');
});

test('Altes Gold wird einmal zu Zahnrädern', async ({ ev }) => {
  await ev('OVS.forEach(o=>o.hidden=true); ST.paused=false; hero.mat.zr=0; ST.gold=120; ST.gems=11; goldSwap()');
  if (await ev('hero.mat.zr') !== 5 || await ev('ST.gold') || await ev('ST.gems')) throw new Error('Tausch falsch: ' + await ev('hero.mat.zr'));
  await ev('goldSwap()');
  if (await ev('hero.mat.zr') !== 5) throw new Error('Tausch doppelt');
});

test('Spielstand übersteht Neuladen', async ({ ev, page }) => {
  await ev('OVS.forEach(o=>o.hidden=true); ST.paused=false; hero.mat.ms=4321; saveHero(); saveGame(false)');
  await page.waitForTimeout(1500);
  await page.reload(); await page.waitForFunction(() => window.__ev && window.__ev('ST.ready'), null, { timeout: 20000 });
  const g = await ev('hero.mat.ms');
  if (g !== 4321) throw new Error('Edelsteine der Rechentafel nach Neuladen: ' + g);
});

// Echte Wischgeste per Touch (CDP), damit das globale Wisch-Verbot mitgeprüft wird.
async function swipeUp(page, x, y) {
  const cdp = await page.context().newCDPSession(page);
  x = Math.round(x); y = Math.round(y);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 15 }] }); await page.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

testCdp('Elternansicht lässt sich bis unten wischen', async ({ ev, page }) => {
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; parOpen()");
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => { const b = document.querySelector('.pars').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height * 0.7 }; });
  await swipeUp(page, r.x, r.y);
  await page.waitForTimeout(300);
  const top = await ev("document.querySelector('.pars').scrollTop");
  await ev("$('par').hidden=true");
  if (!(top > 50)) throw new Error('Elternansicht scrollt nicht: ' + top);
});

testCdp('Zu hohe Fenster im Querformat lassen sich wischen, die Welt nicht', async ({ ev, page }) => {
  const vp = page.viewportSize();
  await page.setViewportSize({ width: 640, height: 360 });
  try {
    await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; openLab()");
    await page.waitForTimeout(400);
    const m = await ev("({sh:$('lab').scrollHeight, ch:$('lab').clientHeight, top:$('lab').firstElementChild.getBoundingClientRect().top})");
    if (m.top < 0) throw new Error('Werkstatt beginnt oberhalb des Bildschirms: ' + m.top);
    if (!(m.sh > m.ch)) throw new Error('Werkstatt passt doch, Test prüft nichts');
    await swipeUp(page, 320, 250);
    await page.waitForTimeout(300);
    if (!(await ev("$('lab').scrollTop") > 0)) throw new Error('Werkstatt scrollt nicht');
    await ev("OVS.forEach(o=>o.hidden=true)");
    const blocked = await page.evaluate(() => { const t = document.getElementById('c'); const e = new TouchEvent('touchmove', { cancelable: true, bubbles: true, touches: [] }); t.dispatchEvent(e); return e.defaultPrevented; });
    if (!blocked) throw new Error('Wischen auf der Spielwelt ist nicht gesperrt');
  } finally { await page.setViewportSize(vp); await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false"); }
});

test('Dreimal am Tag falsch: Fakt ruht bis morgen', async ({ ev }) => {
  const r = await ev(`(function(){
    var bak=JSON.stringify(FS), k='rhy:Tanne', n=0, seen=0;
    for(var i=0;i<3;i++) factDone({f:k},'miss');
    for(var j=0;j<300;j++){ var f=pickFact(); lastF=f; if(f===k) seen++; }
    var due=FS.f[k][1]-dayNo();
    FS=JSON.parse(bak); retry.length=0; saveFacts();
    return [seen,due];
  })()`);
  if (r[0]) throw new Error('Geparkter Fakt kam noch ' + r[0] + '× dran');
  if (r[1] !== 1) throw new Error('Geparkter Fakt nicht morgen fällig: ' + r[1]);
});

test('Rätsel aus der Welt bleibt nach dem Antippen offen (kein Geister-Klick)', async ({ ev, page }) => {
  // Die Kamera schaut tiefer, damit die Maschine oben im Bild über dem Rätselblatt steht. Dort trifft der Klick nach dem Loslassen den Hintergrund, der das Fenster schließt.
  await ev("OVS.forEach(o=>o.hidden=true); ST.paused=false; setTool(null,true); setMode('walk'); var m=MACH.find(m=>m.y===m.y); P.x=m.x+20; P.y=m.y; P.vx=P.vy=0; window.__m=m; window.__po=0; if(!window.__pzO){ window.__pzO=pzOpen; pzOpen=function(x){ __po++; return __pzO(x); }; } window.__pan=setInterval(function(){ pan.y=380; },10)");
  try {
    await page.waitForTimeout(1500);
    const pt = await ev(`(function(){
      __pzO(__m); var r=$('pz-sheet').getBoundingClientRect(); pzClose();
      for(var dy=6;dy>=-72;dy-=6){ var x=W/2+(__m.x-cam.x)*S, y=H/2+(__m.y+dy-cam.y)*S; if(y<r.top-8&&document.elementFromPoint(x,y)===$('c')) return [x,y]; }
      return null; })()`);
    if (!pt) throw new Error('Kein freier Punkt der Maschine über dem Rätselblatt');
    await page.waitForTimeout(300);
    const n = await ev('__po');
    await page.touchscreen.tap(pt[0], pt[1]);
    await page.waitForTimeout(500);
    if (await ev('__po') === n) throw new Error('Antippen hat die Maschine nicht getroffen');
    if (await ev("$('pz').hidden")) throw new Error('Rätsel nach dem Antippen sofort wieder zu ' + await ev('JSON.stringify(window.__dbg)'));
  } finally { await ev("clearInterval(__pan); pzClose(); pzOpen=__pzO; OVS.forEach(o=>o.hidden=true); ST.paused=false"); }
});

const srv = await serve();
const url = 'http://127.0.0.1:' + srv.address().port + '/';
const browser = await launch();
const ctx = await browser.newContext({ ...phone(), serviceWorkers: 'block', bypassCSP: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|fonts\.g/.test(m.text())) errs.push(m.text()); });
const ev = s => page.evaluate(s => window.__ev(s), s);
await page.goto(url);
await page.waitForFunction(() => window.__ev && window.__ev('ST.ready'), null, { timeout: 20000 });

// Zum Schluss: Fehler, die das Spiel selbst abgefangen hat, stehen nur im Fehlerprotokoll. Auch die zählen.
test('Fehlerprotokoll ist leer', async ({ ev }) => {
  const e = await ev("errLoad().map(e=>e.m+' ('+e.w+')')");
  if (e.length) throw new Error(e.join(' | '));
});

let failed = 0;
await ev('localStorage.removeItem(ERRK)');
for (const t of tests) {
  if (t.cdp && FIREFOX) { console.log('skip ' + t.name + ' (nur Chromium)'); continue; }
  const n = errs.length;
  try {
    await t.fn({ ev, page, errs });
    if (errs.length > n) throw new Error('Seitenfehler: ' + errs.slice(n).join(' | '));
    console.log('ok   ' + t.name);
  } catch (e) {
    failed++;
    console.log('FAIL ' + t.name + '\n     ' + (e.message || e));
  }
}
await browser.close(); srv.close();
console.log(failed ? failed + ' von ' + tests.length + ' Tests fehlgeschlagen' : 'alle ' + tests.length + ' Tests ok');
process.exit(failed ? 1 : 0);
