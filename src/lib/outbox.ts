import * as Crypto from 'expo-crypto';
import * as Network from 'expo-network';
import { AppState } from 'react-native';
import { api, ApiError } from './api';
import { getLocale } from './i18n';
import { readEntries, saveEntry, removeEntry, readAttachment, attachmentForUpload } from './outbox-storage';

export type Attachment = { uri: string; name: string; type: string; field: string };
type SavedAttachment = Omit<Attachment,'uri'> & { base64: string };
export type OutboxEntry = { id: string; path: string; fields: Record<string,string>; files: SavedAttachment[]; status: 'queued'|'blocked'|'sent'; error?: string; duplicate?: boolean; caseNumber?: string; createdAt: string };
const listeners=new Set<()=>void>();
export const subscribeOutbox=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
const notify=()=>listeners.forEach(fn=>fn());
let running: Promise<void>|null=null;
let mutation: Promise<unknown>=Promise.resolve();
function serial<T>(work:()=>Promise<T>):Promise<T> { const next=mutation.then(work,work);mutation=next.catch(()=>{});return next; }
export async function listOutbox():Promise<OutboxEntry[]> { return (await readEntries()).map(s=>JSON.parse(s) as OutboxEntry).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)); }
export async function submitReport(path: string, fields: Record<string,string>, attachments: Attachment[] = []) {
  const entry = await serial(async () => {
    if((await listOutbox()).filter(e=>e.status!=='sent').length>=10) throw new Error('There are already 10 saved reports. Review the offline reports first.');
    const entry: OutboxEntry={id:Crypto.randomUUID(),path,fields:{...fields,lang:getLocale()},files:[],status:'queued',createdAt:new Date().toISOString()};
    for(const file of attachments) {
      const base64=await readAttachment(file.uri);
      if(base64.length*0.75>20*1024*1024) throw new Error('Each attachment must be 20 MB or smaller.');
      entry.files.push({field:file.field,name:file.name,type:file.type,base64});
    }
    await saveEntry(entry.id,JSON.stringify(entry));notify();return entry;
  });
  await flushOutbox();
  return (await listOutbox()).find(e=>e.id===entry.id)!;
}
export function flushOutbox():Promise<void> {
  if(running)return running;
  running=serial(async()=>{
    for(const entry of await listOutbox()) {
      if(entry.status!=='queued')continue;
      const cleanups:(()=>void)[]=[];
      try {
        const form=new FormData();
        Object.entries(entry.fields).forEach(([key,value])=>form.append(key,value));
        form.append('submission_id',entry.id);
        for(const file of entry.files) {const upload=await attachmentForUpload(file.base64,file.name,file.type);cleanups.push(upload.cleanup);form.append(file.field,upload.value,file.name);}
        const response=await api<{data:{case_number?:string}}>(entry.path,{method:'POST',formData:form,token:null});
        entry.status='sent';entry.caseNumber=response.data.case_number;entry.files=[];entry.fields={};entry.error=undefined;
      } catch(error) {
        if(error instanceof ApiError && (error.status===0||error.status>=500||error.status===429)) break;
        entry.status='blocked';entry.error=error instanceof Error?error.message:'Submission failed';
        entry.duplicate=error instanceof ApiError && Boolean(error.errors?.duplicate_acknowledged);
      } finally { cleanups.forEach(cleanup=>cleanup()); }
      await saveEntry(entry.id,JSON.stringify(entry));notify();
    }
  }).finally(()=>{running=null;});
  return running;
}
export async function retryReport(id: string, acknowledgeDuplicate=false) {
  await serial(async()=>{const entry=(await listOutbox()).find(e=>e.id===id);if(!entry||entry.status==='sent')return;
    // A rejected request has no receipt; retaining the identifier remains safe.
    if(acknowledgeDuplicate)entry.fields.duplicate_acknowledged='1';
    entry.status='queued';entry.error=undefined;await saveEntry(id,JSON.stringify(entry));notify();});
  await flushOutbox();
}
export async function deleteReport(id:string) { await serial(()=>removeEntry(id));notify(); }
export function startOutbox() {
  const flush=()=>{if(AppState.currentState==='active'||AppState.currentState===null)void flushOutbox().catch(()=>{});};
  const network=Network.addNetworkStateListener(state=>{if(state.isConnected)flush();});
  const active=AppState.addEventListener('change',state=>{if(state==='active')flush();});
  const timer=setInterval(flush,30000);flush();
  return()=>{network.remove();active.remove();clearInterval(timer);};
}
