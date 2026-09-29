import React from 'react';
import {AbsoluteFill, Img, Video, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Asset, Scene, VideoProject} from '../../lib/schema';
import {mediaSrc} from '../helpers';

const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
export const progress=(frame:number,from:number,to:number)=>interpolate(frame,[from,to],[0,1],clamp);
export const smooth=(frame:number,fps:number,delay=0)=>spring({frame:frame-delay,fps,config:{damping:18,stiffness:110,mass:.75}});
export const sceneOpacity=(frame:number,duration:number)=>interpolate(frame,[0,10,Math.max(11,duration-10),duration],[0,1,1,0],clamp);

export function cameraTransform(scene:Scene,frame:number){
  const d=Math.max(1,scene.durationInFrames); const t=progress(frame,0,d); const i=scene.intensity||1;
  const map:Record<string,string>={
    static:'scale(1.04)',
    'push-in':`scale(${1.04+t*.10*i}) translate3d(0,${-t*10*i}px,0)`,
    'pull-out':`scale(${1.15-t*.10*i})`,
    'pan-left':`scale(1.13) translate3d(${25-t*50*i}px,0,0)`,
    'pan-right':`scale(1.13) translate3d(${-25+t*50*i}px,0,0)`,
    drift:`scale(${1.08+t*.04}) translate3d(${Math.sin(t*Math.PI)*22*i}px,${-t*18*i}px,0)`
  };
  return map[scene.camera||'push-in'];
}

export function Atmosphere({scene}:{scene:Scene}){
  const frame=useCurrentFrame(); const accent=scene.accent;
  const shift=Math.sin(frame/34)*35;
  const backgrounds:Record<string,string>={
    cinematic:`radial-gradient(circle at 72% 22%,${accent}44,transparent 34%),linear-gradient(145deg,#141414,#050505 58%,#11100c)`,
    'gradient-grid':`radial-gradient(circle at 20% 20%,${accent}3b,transparent 36%),linear-gradient(135deg,#0a0c0d,#15130f)`,
    aurora:`radial-gradient(ellipse at ${55+shift/5}% 30%,${accent}55,transparent 35%),radial-gradient(ellipse at 15% 80%,#25445b66,transparent 38%),#060708`,
    'studio-dark':`radial-gradient(ellipse at 50% 58%,${accent}38,transparent 28%),linear-gradient(#090909,#020202)`
  };
  return <AbsoluteFill style={{background:backgrounds[scene.backgroundStyle||'cinematic']}}>
    {scene.backgroundStyle==='gradient-grid'&&<AbsoluteFill style={{opacity:.18,backgroundImage:'linear-gradient(rgba(255,255,255,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.18) 1px,transparent 1px)',backgroundSize:'90px 90px',transform:`perspective(500px) rotateX(58deg) scale(1.8) translateY(${300-frame*.5}px)`,transformOrigin:'bottom'}}/>}
    <AbsoluteFill style={{opacity:.24,backgroundImage:'radial-gradient(circle,rgba(255,255,255,.42) 0 1px,transparent 1.5px)',backgroundSize:'46px 46px',transform:`translate3d(${frame*.12}px,${-frame*.08}px,0)`}}/>
  </AbsoluteFill>;
}

export function MediaLayer({asset,scene,mode='background',style}:{asset?:Asset;scene:Scene;mode?:'background'|'card'|'product';style?:React.CSSProperties}){
  const frame=useCurrentFrame(); const src=mediaSrc(asset); if(!asset||!src)return null;
  const base:React.CSSProperties={width:'100%',height:'100%',objectFit:mode==='product'?'contain':'cover',objectPosition:`${scene.focusPoint?.x||50}% ${scene.focusPoint?.y||50}%`,display:'block'};
  const transform=mode==='background'?cameraTransform(scene,frame):scene.mediaAnimation==='float'?`translateY(${Math.sin(frame/14)*12}px) rotate(${Math.sin(frame/25)*1.2}deg) scale(1.02)`:`scale(${1.06-frame*.0003})`;
  const mediaStyle={...base,transform,...style};
  return asset.type==='video'?<Video src={src} muted style={mediaStyle}/>:<Img src={src} style={mediaStyle}/>;
}

export function Grade({strong=false}:{strong?:boolean}){
  return <><AbsoluteFill style={{background:strong?'linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.38) 48%,rgba(0,0,0,.88))':'linear-gradient(180deg,rgba(0,0,0,.10),rgba(0,0,0,.18) 55%,rgba(0,0,0,.72))'}}/><AbsoluteFill style={{boxShadow:'inset 0 0 220px rgba(0,0,0,.74)'}}/></>;
}

function AnimatedWords({text,scene,size}:{text:string;scene:Scene;size:number}){
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const words=text.trim().split(/\s+/);
  if(scene.textAnimation!=='word-stagger'){
    const p=smooth(frame,fps,7); const styles:Record<string,React.CSSProperties>={
      rise:{opacity:p,transform:`translateY(${(1-p)*80}px)`},
      'mask-reveal':{clipPath:`inset(${(1-p)*100}% 0 0 0)`,transform:`translateY(${(1-p)*35}px)`},
      'scale-blur':{opacity:p,filter:`blur(${(1-p)*18}px)`,transform:`scale(${.82+.18*p})`},
      slide:{opacity:p,transform:`translateX(${(1-p)*(scene.layout==='split-right'?-110:110)}px)`}
    };
    return <div style={{fontSize:size,fontWeight:850,lineHeight:1.08,letterSpacing:'-.025em',...styles[scene.textAnimation||'rise']}}>{text}</div>;
  }
  return <div style={{fontSize:size,fontWeight:850,lineHeight:1.16,letterSpacing:'-.025em',display:'flex',flexWrap:'wrap',gap:'0 .24em'}}>{words.map((w,i)=>{const p=smooth(frame,fps,6+i*3);return <span key={`${w}-${i}`} style={{display:'inline-block',opacity:p,transform:`translateY(${(1-p)*68}px) rotate(${(1-p)*2}deg)`,filter:`blur(${(1-p)*8}px)`}}>{w}</span>})}</div>;
}

export function CopyBlock({scene,project,position='top',titleSize=92,align}:{scene:Scene;project:VideoProject;position?:'top'|'middle'|'bottom';titleSize?:number;align?:'left'|'center'|'right'}){
  const frame=useCurrentFrame(); const {fps}=useVideoConfig(); const p=smooth(frame,fps,2); const textAlign=align||((scene.layout==='center')?'center':project.direction==='rtl'?'right':'left');
  const positions={top:{top:190},middle:{top:590},bottom:{bottom:190}};
  return <div style={{position:'absolute',zIndex:20,left:78,right:78,...positions[position],direction:project.direction,textAlign,color:'#fff',fontFamily:project.brand.fontFamily||'Arial'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:textAlign==='center'?'center':textAlign==='right'?'flex-end':'flex-start',gap:16,opacity:p,marginBottom:24}}><span style={{width:45,height:2,background:scene.accent}}/><span style={{fontSize:25,fontWeight:700,color:scene.accent,letterSpacing:2.5,textTransform:'uppercase'}}>{scene.eyebrow}</span></div>
    <AnimatedWords text={scene.title} scene={scene} size={titleSize}/>
    {scene.subtitle&&<div style={{fontSize:30,lineHeight:1.6,maxWidth:textAlign==='center'?850:760,marginTop:30,marginInline:textAlign==='center'?'auto':0,color:'rgba(255,255,255,.76)',opacity:smooth(frame,fps,18),transform:`translateY(${(1-smooth(frame,fps,18))*28}px)`}}>{scene.subtitle}</div>}
  </div>;
}

export function FilmTexture(){
  const frame=useCurrentFrame();
  return <AbsoluteFill style={{zIndex:80,pointerEvents:'none',opacity:.07,mixBlendMode:'screen',backgroundImage:'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%27.7%27/%3E%3C/svg%3E")',transform:`translate(${frame%3}px,${(frame*2)%3}px)`}}/>;
}

export function TransitionOverlay({scene}:{scene:Scene}){
  const frame=useCurrentFrame(); const d=scene.durationInFrames; const edge=18; const incoming=progress(frame,0,edge); const outgoing=progress(frame,d-edge,d); const accent=scene.accent;
  if(scene.transition==='wipe')return <div style={{position:'absolute',zIndex:100,inset:0,background:accent,transform:`translateX(${interpolate(frame,[0,edge,d-edge,d],[-105,105,105,-105],clamp)}%)`,mixBlendMode:'screen',opacity:.72}}/>;
  if(scene.transition==='light-sweep')return <div style={{position:'absolute',zIndex:100,top:-200,bottom:-200,width:260,left:`${interpolate(frame,[0,edge,d-edge,d],[-35,130,130,-35],clamp)}%`,background:'linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent)',filter:'blur(24px)',transform:'rotate(14deg)',mixBlendMode:'screen'}}/>;
  if(scene.transition==='film-burn')return <AbsoluteFill style={{zIndex:100,opacity:Math.max(0,1-incoming)+outgoing,background:`radial-gradient(circle at 75% 40%,#fff7c4,${accent} 18%,#e4551a 42%,#120400 75%)`,mixBlendMode:'screen'}}/>;
  if(scene.transition==='zoom')return <AbsoluteFill style={{zIndex:100,opacity:(1-incoming)*.75+outgoing*.75,background:`radial-gradient(circle,transparent 5%,${accent}55 45%,#000 80%)`,transform:`scale(${.6+incoming*.8-outgoing*.4})`}}/>;
  return <AbsoluteFill style={{zIndex:100,background:'#000',opacity:Math.max(0,1-incoming)+outgoing}}/>;
}

export function SceneShell({scene,children}:{scene:Scene;children:React.ReactNode}){
  const frame=useCurrentFrame();
  return <AbsoluteFill style={{overflow:'hidden',opacity:sceneOpacity(frame,scene.durationInFrames),background:'#050505'}}>{children}<FilmTexture/><TransitionOverlay scene={scene}/></AbsoluteFill>;
}
