import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene, VideoProject} from '../lib/schema';
import {findAsset,mediaSrc} from './helpers';
import {Atmosphere,CopyBlock,Grade,MediaLayer,SceneShell,progress,smooth} from './motion/primitives';

type Props={scene:Scene;project:VideoProject};

function CinematicOpening({scene,project}:Props){
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const bg=findAsset(project,scene.backgroundAssetId); const p=smooth(frame,fps,4);
  return <SceneShell scene={scene}><Atmosphere scene={scene}/>{bg&&<AbsoluteFill><MediaLayer asset={bg} scene={scene}/></AbsoluteFill>}<Grade strong/>
    <div style={{position:'absolute',left:54,right:54,top:70,bottom:70,border:`1px solid ${scene.accent}66`,transform:`scale(${.94+.06*p})`,opacity:.35*p}}/>
    <div style={{position:'absolute',left:'50%',top:'50%',width:470,height:720,border:`2px solid ${scene.accent}`,borderRadius:'49% 49% 16% 16%',transform:`translate(-50%,-43%) scale(${.72+.28*p})`,opacity:.38*p,boxShadow:`0 0 120px ${scene.accent}33`}}/>
    <CopyBlock scene={scene} project={project} position="middle" align="center" titleSize={102}/>
  </SceneShell>;
}

function VideoText({scene,project}:Props){
  const bg=findAsset(project,scene.backgroundAssetId);
  return <SceneShell scene={scene}><Atmosphere scene={scene}/>{bg&&<AbsoluteFill style={{clipPath:'inset(0 0 37% 0)'}}><MediaLayer asset={bg} scene={scene}/></AbsoluteFill>}<Grade/>
    <div style={{position:'absolute',left:70,right:70,top:1110,height:2,background:`linear-gradient(90deg,transparent,${scene.accent},transparent)`,opacity:.7}}/><CopyBlock scene={scene} project={project} position="bottom" titleSize={88}/>
  </SceneShell>;
}

function KineticTypography({scene,project}:Props){
  const frame=useCurrentFrame(); const words=scene.title.split(/\s+/); const loop=interpolate(frame,[0,scene.durationInFrames],[0,-240],{extrapolateRight:'clamp'});
  return <SceneShell scene={scene}><Atmosphere scene={scene}/>
    <div style={{position:'absolute',inset:-100,transform:`rotate(-8deg) translateY(${loop}px)`,opacity:.12}}>{Array.from({length:7},(_,row)=><div key={row} style={{fontSize:120,fontWeight:900,whiteSpace:'nowrap',color:row%2?scene.accent:'#fff',lineHeight:1.35}}>{scene.title} · {scene.title} ·</div>)}</div>
    <div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',padding:75,textAlign:'center',direction:project.direction}}><div>{words.map((word,i)=>{const p=smooth(frame,useVideoConfig().fps,4+i*4);return <div key={i} style={{fontSize:i%2?122:155,fontWeight:950,lineHeight:.98,color:i%2?scene.accent:'#fff',opacity:p,transform:`translateX(${(1-p)*(i%2?-150:150)}px)`,textShadow:'0 15px 50px rgba(0,0,0,.5)'}}>{word}</div>})}</div></div>
    <div style={{position:'absolute',bottom:155,left:80,right:80,textAlign:'center',fontSize:29,color:'rgba(255,255,255,.72)',direction:project.direction}}>{scene.subtitle}</div>
  </SceneShell>;
}

function SplitShowcase({scene,project}:Props){
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const bg=findAsset(project,scene.backgroundAssetId); const fg=findAsset(project,scene.foregroundAssetId)||bg; const p=smooth(frame,fps,5); const right=scene.layout==='split-right';
  return <SceneShell scene={scene}><Atmosphere scene={scene}/><Grade/>
    <div style={{position:'absolute',top:115,bottom:115,width:'58%',[right?'right':'left']:-35,overflow:'hidden',borderRadius:right?'70px 0 0 70px':'0 70px 70px 0',clipPath:`inset(0 ${(1-p)*100}% 0 0)`,boxShadow:'0 45px 120px rgba(0,0,0,.65)'}}><MediaLayer asset={fg} scene={scene}/></div>
    <div style={{position:'absolute',top:230,bottom:230,width:4,left:right?'38%':'62%',background:scene.accent,transform:`scaleY(${p})`,transformOrigin:'top'}}/>
    <div style={{position:'absolute',top:260,bottom:240,width:'39%',[right?'left':'right']:65,direction:project.direction,textAlign:project.direction==='rtl'?'right':'left',display:'flex',flexDirection:'column',justifyContent:'center'}}><div style={{color:scene.accent,fontSize:24,marginBottom:25}}>{scene.eyebrow}</div><div style={{fontSize:75,fontWeight:900,lineHeight:1.12}}>{scene.title}</div><div style={{fontSize:28,lineHeight:1.6,color:'#ffffffaa',marginTop:30}}>{scene.subtitle}</div></div>
  </SceneShell>;
}

function Statistic({scene,project}:Props){
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const bg=findAsset(project,scene.backgroundAssetId); const p=smooth(frame,fps,7); const rings=progress(frame,5,45);
  return <SceneShell scene={scene}><Atmosphere scene={scene}/>{bg&&<AbsoluteFill style={{opacity:.18,filter:'grayscale(1) contrast(1.4)'}}><MediaLayer asset={bg} scene={scene}/></AbsoluteFill>}<Grade/>
    {[0,1,2].map(i=><div key={i} style={{position:'absolute',left:'50%',top:'48%',width:420+i*190,height:420+i*190,border:`${2-i*.4}px solid ${scene.accent}${i?'44':'99'}`,borderRadius:'50%',transform:`translate(-50%,-50%) scale(${.5+rings*.5}) rotate(${frame*(i%2?-.08:.08)}deg)`,opacity:p}}/>)}
    <div style={{position:'absolute',left:0,right:0,top:610,textAlign:'center',direction:project.direction}}><div style={{fontSize:190,fontWeight:950,color:scene.accent,lineHeight:1,transform:`scale(${.7+.3*p})`,filter:`blur(${(1-p)*20}px)`}}>{scene.statistic||'100%'}</div><div style={{fontSize:68,fontWeight:850,marginTop:45}}>{scene.title}</div><div style={{fontSize:29,color:'#ffffffaa',margin:'28px auto',maxWidth:720,lineHeight:1.55}}>{scene.subtitle}</div></div>
  </SceneShell>;
}

function Process({scene,project}:Props){
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const items=scene.items?.length?scene.items:['Concept','Design','Motion','Polish'];
  return <SceneShell scene={scene}><Atmosphere scene={scene}/><CopyBlock scene={scene} project={project} position="top" titleSize={78}/>
    <div style={{position:'absolute',left:78,right:78,top:780,bottom:130}}>{items.map((item,i)=>{const p=smooth(frame,fps,15+i*7);return <div key={i} style={{height:190,display:'grid',gridTemplateColumns:'120px 1fr 70px',alignItems:'center',borderBottom:'1px solid rgba(255,255,255,.14)',opacity:p,transform:`translateX(${(1-p)*(i%2?80:-80)}px)`,direction:project.direction}}><div style={{fontSize:26,color:scene.accent}}>{String(i+1).padStart(2,'0')}</div><div style={{fontSize:48,fontWeight:800}}>{item}</div><div style={{width:55,height:55,border:`1px solid ${scene.accent}`,borderRadius:'50%',display:'grid',placeItems:'center',transform:`rotate(${45+p*135}deg)`}}>＋</div></div>})}</div>
  </SceneShell>;
}

function ProductHero({scene,project}:Props){
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const bg=findAsset(project,scene.backgroundAssetId); const product=findAsset(project,scene.foregroundAssetId)||bg; const p=smooth(frame,fps,7);
  return <SceneShell scene={scene}><Atmosphere scene={{...scene,backgroundStyle:'studio-dark'}}/>
    {bg&&<AbsoluteFill style={{opacity:.13,filter:'blur(20px)',transform:'scale(1.2)'}}><MediaLayer asset={bg} scene={scene}/></AbsoluteFill>}
    <div style={{position:'absolute',left:'50%',top:'49%',width:720,height:720,borderRadius:'50%',background:`radial-gradient(circle,${scene.accent}40,transparent 68%)`,transform:'translate(-50%,-50%)'}}/>
    {[0,1].map(i=><div key={i} style={{position:'absolute',left:'50%',top:'49%',width:620+i*150,height:620+i*150,border:`1px solid ${scene.accent}${i?'44':'77'}`,borderRadius:'50%',transform:`translate(-50%,-50%) rotate(${frame*(i?-.12:.17)}deg) scale(${.6+.4*p})`,borderTopColor:'transparent'}}/>)}
    <div style={{position:'absolute',left:170,right:170,top:430,bottom:390,filter:'drop-shadow(0 55px 45px rgba(0,0,0,.7))',opacity:p,transform:`translateY(${(1-p)*140}px) scale(${.82+.18*p})`}}><MediaLayer asset={product} scene={{...scene,mediaAnimation:'float'}} mode="product"/></div>
    <CopyBlock scene={scene} project={project} position="bottom" align="center" titleSize={74}/>
  </SceneShell>;
}

function LogoReveal({scene,project}:Props){
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const logo=findAsset(project,project.brand.logoAssetId)||findAsset(project,scene.foregroundAssetId); const p=smooth(frame,fps,10); const sweep=progress(frame,6,42);
  return <SceneShell scene={scene}><Atmosphere scene={{...scene,backgroundStyle:'studio-dark'}}/>
    <div style={{position:'absolute',left:'50%',top:'45%',width:620,height:620,border:`1px solid ${scene.accent}66`,borderRadius:'50%',transform:`translate(-50%,-50%) scale(${.65+.35*p}) rotate(${frame*.13}deg)`,boxShadow:`0 0 130px ${scene.accent}22`}}/>
    <div style={{position:'absolute',left:210,right:210,top:590,height:430,display:'grid',placeItems:'center',clipPath:`inset(0 ${(1-sweep)*100}% 0 0)`,filter:'drop-shadow(0 30px 55px rgba(0,0,0,.65))'}}>{logo?<Img src={mediaSrc(logo)} style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}}/>:<div style={{fontSize:95,fontWeight:950,color:scene.accent}}>{project.brand.name||scene.title}</div>}</div>
    <div style={{position:'absolute',left:140,right:140,bottom:310,textAlign:'center',direction:project.direction}}><div style={{fontSize:58,fontWeight:850}}>{scene.title}</div><div style={{fontSize:28,color:'#ffffff99',marginTop:24}}>{scene.subtitle||project.brand.tagline}</div></div>
  </SceneShell>;
}

function CallToAction({scene,project}:Props){
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const logo=findAsset(project,project.brand.logoAssetId); const p=smooth(frame,fps,6);
  return <SceneShell scene={scene}><Atmosphere scene={{...scene,backgroundStyle:'aurora'}}/><Grade/>
    <div style={{position:'absolute',left:70,right:70,top:90,display:'flex',justifyContent:'space-between',alignItems:'center',opacity:p}}><div style={{fontSize:23,color:scene.accent}}>{scene.eyebrow}</div>{logo&&<Img src={mediaSrc(logo)} style={{width:130,height:80,objectFit:'contain'}}/>}</div>
    <CopyBlock scene={scene} project={project} position="middle" align="center" titleSize={105}/>
    <div style={{position:'absolute',bottom:225,left:190,right:190,padding:'25px 42px',borderRadius:999,border:`1px solid ${scene.accent}`,background:`${scene.accent}18`,textAlign:'center',fontSize:29,fontWeight:750,color:scene.accent,opacity:p,transform:`translateY(${(1-p)*50}px)`}}>{scene.cta||project.brand.tagline||scene.subtitle}</div>
  </SceneShell>;
}

const registry:Record<Scene['type'],React.FC<Props>>={
  'cinematic-opening':CinematicOpening,'video-text':VideoText,'kinetic-typography':KineticTypography,
  statistic:Statistic,process:Process,'split-showcase':SplitShowcase,'product-hero':ProductHero,
  'logo-reveal':LogoReveal,'call-to-action':CallToAction
};
export function SceneView(props:Props){const Component=registry[props.scene.type]||VideoText;return <Component {...props}/>;}
