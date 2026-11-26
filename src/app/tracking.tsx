import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { AppButton, ErrorBanner, Field, Screen, ScreenHeader, usePalette } from '@/components/ui';
import { LanguagePicker } from '@/components/report-controls';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
export default function Tracking() {
  const {t}=useI18n(), router=useRouter(), palette=usePalette();
  const [number,setNumber]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const [result,setResult]=useState<{case_number:string;status:string;submitted_at:string;updated_at:string}|null>(null);
  async function check(){setLoading(true);setError('');setResult(null);try{const r=await api<{data:NonNullable<typeof result>}>('/api/track-case',{method:'POST',body:{case_number:number.trim()},token:null});setResult(r.data);}catch(e){setError(e instanceof Error?e.message:'Case not found');}finally{setLoading(false);}}
  return <Screen><ScreenHeader title="Track a case" onBack={()=>router.back()}/><LanguagePicker/><ScrollView contentContainerStyle={{padding:16,gap:16}}>
    <Text style={{color:palette.text}}>{t('Enter your case number. Only case status and dates are shown to protect privacy.')}</Text>
    <Field label="Case number" value={number} onChangeText={setNumber}/><AppButton title="Check status" onPress={check} loading={loading}/>
    {error?<ErrorBanner message={error}/>:null}
    {result?<Text selectable style={{color:palette.text}}>{result.case_number}{'\n'}{t('Status')}: {t(result.status[0].toUpperCase()+result.status.slice(1))}{'\n'}{t('Submitted')}: {result.submitted_at}{'\n'}{t('Updated')}: {result.updated_at}</Text>:null}
  </ScrollView></Screen>;
}
