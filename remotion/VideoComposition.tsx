import React from 'react';
import {AbsoluteFill,Audio,Sequence} from 'remotion';
import type {VideoProject} from '../lib/schema';
import {SceneView} from './scenes';
import {findAsset,mediaSrc} from './helpers';

export const VideoComposition:React.FC<{project:VideoProject}>=({project})=>{
  let cursor=0;
  const music=findAsset(project,project.musicAssetId);
  return <AbsoluteFill style={{backgroundColor:'#050606',overflow:'hidden',fontFamily:project.brand?.fontFamily||'Cairo, sans-serif'}}>
    {music&&<Audio src={mediaSrc(music)} volume={.2}/>} 
    {project.scenes.map(scene=>{const from=cursor;cursor+=scene.durationInFrames;return <Sequence key={scene.id} from={from} durationInFrames={scene.durationInFrames} premountFor={30}><SceneView scene={scene} project={project}/></Sequence>})}
  </AbsoluteFill>;
};
