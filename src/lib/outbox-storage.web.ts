let database: Promise<IDBDatabase> | undefined;
function db() {
  return database ??= new Promise<IDBDatabase>((resolve,reject) => {
    const request = indexedDB.open('findsight-private-outbox',1);
    request.onupgradeneeded = () => { request.result.createObjectStore('entries'); request.result.createObjectStore('keys'); };
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
}
async function operation<T>(store: string, mode: IDBTransactionMode, work: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await db();
  return new Promise((resolve,reject) => {
    const tx = database.transaction(store,mode); const request = work(tx.objectStore(store));
    tx.oncomplete = () => resolve(request.result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
  });
}
let keyPromise: Promise<CryptoKey> | undefined;
function key() {
  return keyPromise ??= (async () => {
    const stored = await operation<CryptoKey|undefined>('keys','readonly',s=>s.get('aes'));
    if(stored) return stored;
    const generated = await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);
    const database=await db();
    // One read/write transaction prevents two fresh browser tabs from replacing each other's key.
    return new Promise<CryptoKey>((resolve,reject)=>{
      const tx=database.transaction('keys','readwrite'),store=tx.objectStore('keys');let selected=generated;
      const request=store.get('aes');request.onsuccess=()=>{if(request.result)selected=request.result;else store.put(generated,'aes');};
      tx.oncomplete=()=>resolve(selected);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
    });
  })();
}
export async function readEntries(): Promise<string[]> {
  const rows = await operation<{nonce:Uint8Array;data:ArrayBuffer}[]>('entries','readonly',s=>s.getAll());
  return Promise.all(rows.map(async row=>new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:row.nonce as Uint8Array<ArrayBuffer>},await key(),row.data))));
}
export async function saveEntry(id: string, json: string) {
  const nonce=crypto.getRandomValues(new Uint8Array(12));
  const data=await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce},await key(),new TextEncoder().encode(json));
  await operation('entries','readwrite',s=>s.put({nonce,data},id));
}
export async function removeEntry(id: string) { await operation('entries','readwrite',s=>s.delete(id)); }
export async function readAttachment(uri: string): Promise<string> {
  const response=await fetch(uri); const blob=await response.blob();
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});
}
export async function attachmentForUpload(base64: string, name: string, type: string) {
  const response=await fetch(`data:${type};base64,${base64}`);
  return {value:new File([await response.blob()],name,{type}),cleanup:()=>{}};
}
