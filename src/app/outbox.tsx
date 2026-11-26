import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { AppButton, ErrorBanner, Screen, ScreenHeader, usePalette } from '@/components/ui';
import { LanguagePicker } from '@/components/report-controls';
import { listOutbox, subscribeOutbox, retryReport, deleteReport, type OutboxEntry } from '@/lib/outbox';
import { useI18n } from '@/lib/i18n';
export default function Outbox() {
  const {t}=useI18n(),router=useRouter(),palette=usePalette();const [items,setItems]=useState<OutboxEntry[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  useEffect(()=>{const load=()=>{void listOutbox().then(setItems).catch(e=>setError(String(e)));};load();return subscribeOutbox(load);},[]);
  const act=async(work:()=>Promise<void>)=>{setBusy(true);try{await work();}catch(e){setError(String(e));}finally{setBusy(false);}};
  return <Screen><ScreenHeader title="Offline reports" onBack={()=>router.back()}/><LanguagePicker/><ScrollView contentContainerStyle={{padding:16,gap:16}}>
    <Text style={{color:palette.textSecondary}}>{t('Saved on this device. It will submit automatically when connected while the app is open.')}</Text>
    {error?<ErrorBanner message={error}/>:null}
    {!items.length?<Text style={{color:palette.text}}>{t('No saved reports.')}</Text>:null}
    {items.map(item=><View key={item.id} style={{padding:12,gap:10,borderWidth:1,borderColor:palette.textSecondary,borderRadius:12}}>
      <Text style={{color:palette.text}}>{t(item.status==='sent'?'Sent':item.status==='blocked'?'Needs attention':'Waiting to send')} · {item.createdAt.slice(0,10)}</Text>
      {item.caseNumber?<Text selectable style={{color:palette.text}}>{t('Case number')}: {item.caseNumber}</Text>:null}
      {item.error?<ErrorBanner message={item.error}/>:null}
      {item.status!=='sent'?<AppButton disabled={busy} title={item.duplicate?'This is a separate incident. Submit for officer review.':'Retry'} onPress={()=>void act(()=>retryReport(item.id,Boolean(item.duplicate)))}/>:null}
      <AppButton disabled={busy} title="Delete" variant="danger" onPress={()=>void act(()=>deleteReport(item.id))}/>
    </View>)}
  </ScrollView></Screen>;
}
