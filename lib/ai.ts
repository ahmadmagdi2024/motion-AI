import {ProjectSchema, type Asset, type VideoProject} from './schema';
import {createLocalProject} from './local-planner';

function extractJson(text:string){
  const cleaned=text.replace(/^```json\s*/i,'').replace(/```$/,'').trim();
  return JSON.parse(cleaned);
}

export async function planWithAI(input:{prompt:string;language:'ar'|'en';duration:number;assets:Asset[]}):Promise<VideoProject>{
  if(!process.env.OPENAI_API_KEY) return createLocalProject(input);
  const fallback=createLocalProject(input);
  const assetSummary=input.assets.map(a=>({id:a.id,name:a.name,type:a.type,description:a.description||''}));
  const system=`You are a senior motion-graphics director. Return JSON only. Build a vertical advertising video plan. Use only these scene types: cinematic-opening, video-text, statistic, process, product-hero, call-to-action. Use only supplied asset IDs. Keep text concise and safe for mobile. Total scene duration frames must equal requested seconds multiplied by 30. Every scene duration must be at least 30 frames. Schema shape: {title,voiceover,brand:{primaryColor,backgroundColor,fontFamily,logoAssetId},scenes:[{type,durationInFrames,title,subtitle,eyebrow,backgroundAssetId,accent,statistic,items,transition}]}. transition is fade, light-sweep, zoom, or wipe.`;
  const response=await fetch('https://api.openai.com/v1/chat/completions',{
    method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},
    body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',response_format:{type:'json_object'},temperature:.6,
      messages:[{role:'system',content:system},{role:'user',content:JSON.stringify({...input,assets:assetSummary})}]})
  });
  if(!response.ok) throw new Error(`AI request failed: ${response.status} ${await response.text()}`);
  const payload=await response.json();
  const raw=extractJson(payload.choices?.[0]?.message?.content||'{}');
  const generated={...fallback,...raw,id:fallback.id,brief:input.prompt,language:input.language,
    direction:input.language==='ar'?'rtl':'ltr',fps:30,width:1080,height:1920,assets:input.assets,
    brand:{...fallback.brand,...raw.brand},
    scenes:(raw.scenes||[]).map((s:any,i:number)=>({...fallback.scenes[Math.min(i,fallback.scenes.length-1)],...s,id:crypto.randomUUID()}))};
  const target=input.duration*30;
  const current=generated.scenes.reduce((n:number,s:any)=>n+s.durationInFrames,0);
  if(current!==target && generated.scenes.length) generated.scenes[generated.scenes.length-1].durationInFrames+=target-current;
  return ProjectSchema.parse(generated);
}
