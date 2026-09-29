'use client';
import React,{useMemo,useState} from 'react';
import {Player} from '@remotion/player';
import {VideoComposition} from '@/remotion/VideoComposition';
import {createLocalProject} from '@/lib/local-planner';
import {totalFrames,type Asset,type VideoProject} from '@/lib/schema';
import {SettingsButton} from '@/components/settings/SettingsButton';

const initial=createLocalProject({prompt:'اكتب وصف مشروعك، وارفع المواد، ثم اضغط إنشاء الفيديو.',language:'ar',duration:30,assets:[]});
export default function Home(){
  const [prompt,setPrompt]=useState('أريد فيديو إعلاني سينمائي فاخر يعرّف بالشركة وخدماتها، ويبرز الخبرة والجودة والمنتج النهائي.');
  const [language,setLanguage]=useState<'ar'|'en'>('ar'); const [duration,setDuration]=useState(30);
  const [assets,setAssets]=useState<Asset[]>([]); const [project,setProject]=useState<VideoProject>(initial);
  const [selected,setSelected]=useState(0); const [busy,setBusy]=useState(''); const [message,setMessage]=useState('');
  const [isRendering, setIsRendering] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const frames=useMemo(()=>totalFrames(project),[project]);
  async function upload(files:FileList|null,forced?:'logo'){
    if(!files)return; setBusy('جاري رفع الملفات...');
    try{const next=[...assets];for(const file of Array.from(files)){const fd=new FormData();fd.append('file',file);if(forced)fd.append('type',forced);const r=await fetch('/api/upload',{method:'POST',body:fd});const data=await r.json();if(!r.ok)throw new Error(data.error);next.push(data)}setAssets(next);setMessage(`تم رفع ${files.length} ملف`)}catch(e:any){setMessage(e.message)}finally{setBusy('')}
  }
  async function generate(forceFallback: boolean = false){
    if (isGenerating) return;
    setIsGenerating(true);
    setBusy('تجهيز الملفات...');
    setMessage('');
    try{
      setBusy('إرسال الطلب إلى OpenRouter...');
      const r = await fetch('/api/generate',{
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({prompt,language,duration,assets, forceFallback})
      });
      setBusy('التحقق من خطة المشاهد...');
      const data = await r.json();
      if(!r.ok) throw new Error(data.error || data.message || 'Generation failed');
      
      setBusy('تجهيز المعاينة...');
      setProject(data.project);
      setSelected(0);
      
      let finalMessage = 'تم إنشاء المشروع والمعاينة (اكتمل).';
      if (data.usedFallback) {
        finalMessage += ' ⚠️ تم استخدام المخطط المحلي كبديل لعدم توفر API.';
      }
      setMessage(finalMessage);
    }catch(e:any){
      setMessage(e.message);
    }finally{
      setBusy('');
      setIsGenerating(false);
    }
  }
  function updateScene(key:'title'|'subtitle'|'eyebrow',value:string){setProject(p=>({...p,scenes:p.scenes.map((s,i)=>i===selected?{...s,[key]:value}:s)}))}
  async function render(){
    if (isRendering) return;
    const invalidAsset = project.assets?.find((asset) => asset.url?.startsWith("blob:"));
    if (invalidAsset) {
      setMessage("يوجد ملف مستخدم كرابط مؤقت. ارفعه إلى السيرفر قبل التصدير.");
      return;
    }
    setIsRendering(true);
    setBusy('جاري تصدير MP4 — لا تغلق الصفحة...');
    setMessage('');
    try{
      const response = await fetch("/api/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        console.error("Render API failed:", result);
        throw new Error(result?.message || `فشل التصدير برمز ${response.status}`);
      }
      if (!result?.outputUrl) {
        throw new Error("لم يرجع السيرفر رابط الفيديو.");
      }
      setMessage(`اكتمل التصدير: ${result.outputUrl}`);
      window.open(result.outputUrl, '_blank');
    }catch(e:any){
      setMessage(e.message);
    }finally{
      setIsRendering(false);
      setBusy('');
    }
  }
  const scene=project.scenes[selected];
  return <main className="editor-layout">
    <aside className="panel editor-left-sidebar">
      <div className="logoTitle">
        <div><b>AI</b><div><strong>Video Studio</strong><small>Prompt → Scenes → MP4</small></div></div>
        <SettingsButton />
      </div>
      <label>صف الفيديو المطلوب</label><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={7}/>
      <div className="row"><div><label>اللغة</label><select value={language} onChange={e=>setLanguage(e.target.value as any)}><option value="ar">العربية</option><option value="en">English</option></select></div><div><label>المدة</label><select value={duration} onChange={e=>setDuration(Number(e.target.value))}><option value="15">15 ثانية</option><option value="30">30 ثانية</option><option value="60">60 ثانية</option></select></div></div>
      <label className="upload">رفع صور وفيديوهات وصوت<input hidden multiple type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm" onChange={e=>upload(e.target.files)}/></label>
      <label className="upload secondary">رفع الشعار<input hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>upload(e.target.files,'logo')}/></label>
      <div className="assets">{assets.map(a=><span key={a.id}>{a.type} · {a.name}</span>)}</div>
      <button className="primary" disabled={!!busy || isGenerating} onClick={() => generate(false)}>{busy||'✨ إنشاء خطة الفيديو'}</button>
      <button className="secondary" disabled={!!busy || isGenerating} onClick={() => generate(true)} style={{ marginTop: '8px', background: '#222', border: '1px solid #444', color: '#fff', fontSize: '12px' }}>استخدام المخطط المحلي عند فشل الذكاء الاصطناعي</button>
      {message&&<div className="message">{message}</div>}
    </aside>

    <section className="editor-center-column">
      <header><div><strong>{project.title}</strong><small>{frames} frame · {project.fps} FPS</small></div><button onClick={render} disabled={!!busy || isRendering}>{isRendering ? "جارٍ تصدير الفيديو..." : "تصدير MP4"}</button></header>
      <div className="editor-preview-viewport">
        <div className="editor-player-frame" style={{aspectRatio: project.width && project.height ? `${project.width} / ${project.height}` : '9 / 16'}}>
          <Player acknowledgeRemotionLicense component={VideoComposition} inputProps={{project}} durationInFrames={frames} compositionWidth={project.width} compositionHeight={project.height} fps={project.fps} controls loop style={{width:'100%',height:'100%',display:'block',backgroundColor:'#050606'}}/>
        </div>
      </div>
      <div className="editor-timeline">{project.scenes.map((s,i)=><button key={s.id} onClick={()=>setSelected(i)} className={selected===i?'active':''} style={{flex:s.durationInFrames}}><b>{String(i+1).padStart(2,'0')}</b><span>{s.type}</span></button>)}</div>
    </section>

    <aside className="panel editor-right-sidebar">
      <h3>تعديل المشهد {selected+1}</h3>
      <div className="sceneList">{project.scenes.map((s,i)=><button key={s.id} className={i===selected?'active':''} onClick={()=>setSelected(i)}>{i+1}. {s.title}</button>)}</div>
      {scene&&<><label>العنوان الصغير</label><input value={scene.eyebrow} onChange={e=>updateScene('eyebrow',e.target.value)}/><label>العنوان</label><textarea rows={3} value={scene.title} onChange={e=>updateScene('title',e.target.value)}/><label>الوصف</label><textarea rows={5} value={scene.subtitle} onChange={e=>updateScene('subtitle',e.target.value)}/><label>نوع المشهد</label><input value={scene.type} disabled/><label>مدة المشهد</label><input value={`${(scene.durationInFrames/project.fps).toFixed(1)} ثانية`} disabled/></>}
      <div className="tip">يعمل التطبيق بمخطط محلي كبديل. اضغط على زر الإعدادات في الأعلى لإدخال مفتاح OpenRouter لتخطيط ذكي!</div>
    </aside>
  </main>
}
