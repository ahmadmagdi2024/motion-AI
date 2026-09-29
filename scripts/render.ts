import path from 'path';
import {readFile} from 'fs/promises';
import {bundle} from '@remotion/bundler';
import {renderMedia,selectComposition} from '@remotion/renderer';
import {ProjectSchema} from '../lib/schema';
async function main(){
  const [, ,inputArg,outputArg]=process.argv;
  if(!inputArg||!outputArg)throw new Error('Usage: render.ts project.json output.mp4');
  const project=ProjectSchema.parse(JSON.parse(await readFile(path.resolve(inputArg),'utf8')));
  console.log('Bundling Remotion project...');
  const serveUrl=await bundle({entryPoint:path.resolve('remotion/index.ts'),publicDir:path.resolve('public')});
  const composition=await selectComposition({serveUrl,id:'AiVideo',inputProps:{project}});
  console.log('Rendering',composition.durationInFrames,'frames...');
  await renderMedia({composition,serveUrl,codec:'h264',outputLocation:path.resolve(outputArg),inputProps:{project},crf:18,onProgress:({progress})=>process.stdout.write(`\r${Math.round(progress*100)}%`)});
  console.log('\nSaved:',path.resolve(outputArg));
}
main().catch(e=>{console.error(e);process.exit(1)});
