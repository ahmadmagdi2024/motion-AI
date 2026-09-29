import {NextResponse} from 'next/server';
import {mkdir,writeFile} from 'fs/promises';
import path from 'path';
import {v4 as uuid} from 'uuid';
export const runtime='nodejs';
export async function POST(req:Request){
  const data=await req.formData(); const file=data.get('file'); const requested=String(data.get('type')||'');
  if(!(file instanceof File))return NextResponse.json({error:'No file supplied'},{status:400});
  const max=250*1024*1024; if(file.size>max)return NextResponse.json({error:'File exceeds 250MB'},{status:400});
  const ext=path.extname(file.name).replace(/[^.a-z0-9]/gi,'')||'';
  const filename=`${uuid()}${ext}`; const dir=path.join(process.cwd(),'public','uploads'); await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,filename),Buffer.from(await file.arrayBuffer()));
  let type:'image'|'video'|'audio'|'logo'=file.type.startsWith('video')?'video':file.type.startsWith('audio')?'audio':'image';
  if(requested==='logo')type='logo';
  return NextResponse.json({id:uuid(),name:file.name,url:`/uploads/${filename}`,type,mimeType:file.type,description:''});
}
