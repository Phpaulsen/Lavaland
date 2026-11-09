// Zugriff auf die Datenbank lavaland (Ablage save). Bewegt aus legacy.js (PR 11).
// diskLock kommt als Parameter gleichen Namens: app/wire.js setzt ihn, wenn die Datenbank beim Start nicht lesbar war.

/** @returns {Promise<IDBDatabase>} */
export function idbOpen(){
  return new Promise(function(res,rej){
    let rq;
    try{ rq=indexedDB.open('lavaland',1); }catch(e){ rej(e); return; }
    rq.onupgradeneeded=function(){ rq.result.createObjectStore('save'); };
    rq.onsuccess=function(){ res(rq.result); };
    rq.onerror=function(){ rej(rq.error); };
  });
}
/** @param {boolean} diskLock @param {IDBTransactionMode} mode @param {(st: IDBObjectStore) => IDBRequest} fn @returns {Promise<any>} */
export function idbDoWith(diskLock,mode,fn){
  if(diskLock&&mode!=='readonly') return Promise.reject(new Error('diskLock'));
  return idbOpen().then(function(db){
    return new Promise(function(res,rej){
      const tx=db.transaction('save',mode), rq=fn(tx.objectStore('save'));
      tx.oncomplete=function(){ db.close(); res(rq.result); };
      tx.onerror=tx.onabort=function(){ db.close(); rej(tx.error); };
    });
  });
}
