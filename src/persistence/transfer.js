// Spielstand umziehen: Sicherungsdatei prüfen, kodieren, Datenbanken auslesen und einspielen. Bewegt aus legacy.js (PR 12), Text unverändert.
// bakMake und bakLoad kamen mit PR 14f dazu (…With(TP), Port TP in app/wire.js); bakIn setzt die Oberfläche (bakPick) und kommt über den Port.
import { ST } from '../state/facade.js';
import { realmKey } from './keys.js';

export const BAK_DBS=['lavaland','lavaland-log'];
/* Eine Sicherungsdatei kann von irgendwoher kommen. Erlaubt sind nur die bekannten Datenbanken, Tabellen, Datentypen und Schlüssel. */
export const BAK_ST=/** @type {Record<string,string[]>} */ ({'lavaland':['save'],'lavaland-log':['ev','day']}), BAK_MAX=64e6;
export const TYPED=['Uint8Array','Int8Array','Uint8ClampedArray','Uint16Array','Int16Array','Uint32Array','Int32Array','Float32Array','Float64Array'], BADK=['__proto__','constructor','prototype'];
/** @param {any} b */
export function bakOk(b){
  if(!b||b.app!=='lavaland'||!b.db||typeof b.db!=='object'||Array.isArray(b.db)) return false;
  for(const n in b.db){
    const d=b.db[n];
    if(!BAK_ST[n]||!d||typeof d!=='object'||!d.st||typeof d.st!=='object') return false;
    for(const t in d.st){ const e=d.st[t]; if(BAK_ST[n].indexOf(t)<0||!e||!Array.isArray(e.r)||!Array.isArray(e.k)) return false; }
  }
  if(b.ls!=null){ if(typeof b.ls!=='object') return false; for(const k in b.ls) if(k.indexOf('lavaland')!==0||typeof b.ls[k]!=='string'||b.ls[k].length>4e6) return false; }
  return true;
}
/** @param {any} u8 */
export function b64(u8){ let s=''; for(let i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000)); return btoa(s); }
/** @param {any} s */
export function unb64(s){ const b=atob(s), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; }
/** @param {any} v @returns {any} */
export function enc(v){
  if(ArrayBuffer.isView(v)) return {$t:v.constructor.name,$b:b64(new Uint8Array(v.buffer,v.byteOffset,v.byteLength))};
  if(v instanceof ArrayBuffer) return {$t:'ArrayBuffer',$b:b64(new Uint8Array(v))};
  if(v instanceof Date) return {$t:'Date',$d:v.getTime()};
  if(Array.isArray(v)) return v.map(enc);
  if(v&&typeof v==='object'){ const o=/** @type {any} */ ({}); for(const k in v) o[k]=enc(v[k]); return o; }
  return v;
}
/** @param {any} v @returns {any} */
export function dec(v){
  if(Array.isArray(v)) return v.map(dec);
  if(v&&typeof v==='object'){
    if(typeof v.$t==='string'){
      if(v.$t==='Date') return new Date(v.$d);
      const u=unb64(v.$b);
      if(v.$t==='ArrayBuffer') return u.buffer;
      if(TYPED.indexOf(v.$t)>=0) return new (/** @type {any} */ (window))[v.$t](u.buffer);
    }
    const o=/** @type {any} */ ({}); for(const k in v) if(BADK.indexOf(k)<0) o[k]=dec(v[k]); return o;
  }
  return v;
}
/* Eine Datenbank, die es hier noch nicht gibt, wird beim Lesen nicht angelegt: das Anlegen wird abgebrochen. */
/** @param {string} name */
export function dbDump(name){
  return new Promise(/** @param {any} res */ function(res){
    /** @type {any} */ let rq;
    try{ rq=indexedDB.open(name); }catch(_){ res(null); return; }
    rq.onupgradeneeded=function(){ try{ rq.transaction.abort(); }catch(_){} };
    rq.onerror=/** @param {any} e */ function(e){ if(e&&e.preventDefault) e.preventDefault(); res(null); };
    rq.onsuccess=function(){
      const db=rq.result, names=Array.prototype.slice.call(db.objectStoreNames);
      if(!names.length){ db.close(); res(null); return; }
      const out=/** @type {any} */ ({v:db.version,st:{}}), tx=db.transaction(names,'readonly');
      names.forEach(/** @param {any} n */ function(n){
        const os=tx.objectStore(n), e={kp:os.keyPath,ai:os.autoIncrement,k:[],r:[]};
        out.st[n]=e;
        os.getAllKeys().onsuccess=/** @param {any} ev */ function(ev){ e.k=ev.target.result; };
        os.getAll().onsuccess=/** @param {any} ev */ function(ev){ e.r=ev.target.result; };
      });
      tx.oncomplete=function(){ db.close(); res(out); };
      tx.onerror=tx.onabort=function(){ db.close(); res(null); };
    };
  });
}
/** @param {any} name @param {any} d */
export function dbLoad(name,d){
  const go=/** @param {any} ver */ function(ver){
    return new Promise(/** @param {any} res @param {any} rej */ function(res,rej){
      /** @type {any} */ let rq;
      try{ rq=ver?indexedDB.open(name,ver):indexedDB.open(name); }catch(e){ rej(e); return; }
      rq.onupgradeneeded=function(){
        const db=rq.result;
        for(const n in d.st) if(!db.objectStoreNames.contains(n)){ const o=/** @type {any} */ ({autoIncrement:!!d.st[n].ai}); if(d.st[n].kp!=null) o.keyPath=d.st[n].kp; db.createObjectStore(n,o); }
      };
      rq.onerror=/** @param {any} e */ function(e){ if(e&&e.preventDefault) e.preventDefault(); rej(rq.error); };
      rq.onsuccess=function(){
        const db=rq.result, names=Object.keys(d.st).filter(/** @param {any} n */ function(n){ return db.objectStoreNames.contains(n); });
        if(!names.length){ db.close(); res(); return; }
        const tx=db.transaction(names,'readwrite');
        names.forEach(/** @param {any} n */ function(n){
          const os=tx.objectStore(n), e=d.st[n];
          os.clear();
          for(let i=0;i<e.r.length;i++){ if(os.keyPath!=null) os.put(e.r[i]); else os.put(e.r[i],e.k[i]); }
        });
        tx.oncomplete=function(){ db.close(); res(); };
        tx.onerror=tx.onabort=function(){ db.close(); rej(tx.error); };
      };
    });
  };
  /* Ist die Datenbank hier schon neuer als in der Datei, wird sie in ihrer jetzigen Fassung geöffnet. */
  return go(d.v).catch(/** @param {any} e */ function(e){ if(e&&e.name==='VersionError') return go(0); throw e; });
}
/** @param {any} TP */
export function bakMakeWith(TP){
  const fresh=ST.ready&&!ST.traveling?TP.idbDo('readwrite',/** @param {any} st */ function(st){ return st.put(TP.snapshot(),realmKey(TP.realm)); }).catch(function(){}):Promise.resolve();
  TP.saveFinds(); TP.saveHero();
  return fresh.then(function(){ return Promise.all(BAK_DBS.map(dbDump)); }).then(/** @param {any} rs */ function(rs){
    const ls=/** @type {any} */ ({}), db=/** @type {any} */ ({});
    try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.indexOf('lavaland')===0&&k!==TP.K_ALIVE) ls[k]=localStorage.getItem(k); } }catch(_){}
    BAK_DBS.forEach(/** @param {any} n @param {any} i */ function(n,i){ if(rs[i]) db[n]=enc(rs[i]); });
    return {app:'lavaland',bak:1,at:new Date().toISOString(),ls:ls,db:db};
  });
}
/** @param {any} TP */
export function bakLoadWith(TP){
  const b=TP.bakIn; TP.bakIn=null; if(!b) return;
  ST.frozen=true;
  const dbs=Object.keys(b.db).filter(/** @param {any} n */ function(n){ return BAK_DBS.indexOf(n)>=0; });
  Promise.all(dbs.map(/** @param {any} n */ function(n){ return dbLoad(n,dec(b.db[n])); })).then(function(){
    try{
      const old=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&k.indexOf('lavaland')===0) old.push(k); }
      old.forEach(/** @param {any} k */ function(k){ localStorage.removeItem(k); });
      for(const k in (b.ls||{})) if(k.indexOf('lavaland')===0) localStorage.setItem(k,String(b.ls[k]));
    }catch(_){}
    location.reload();
  },function(){ ST.frozen=false; TP.tone([170],'sawtooth'); });
}
