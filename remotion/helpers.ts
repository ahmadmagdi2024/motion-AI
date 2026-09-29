import {staticFile} from 'remotion';
import type {Asset, VideoProject} from '../lib/schema';

export const findAsset=(project:VideoProject,id?:string|null):Asset|undefined=>project.assets.find(a=>a.id===id);

export function resolveMediaSource(source?: string) {
  if (!source) return "";
  if (
    source.startsWith("http://") ||
    source.startsWith("https://") ||
    source.startsWith("data:")
  ) {
    return source;
  }
  const normalized = source.replace(/^\/+/, "");
  return staticFile(normalized);
}

export const mediaSrc=(asset?:Asset)=>{
  if(!asset)return '';
  return resolveMediaSource(asset.url);
};
