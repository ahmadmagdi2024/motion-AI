import {NextResponse} from 'next/server';
import {mkdir,writeFile} from 'fs/promises';
import path from 'path';
import {v4 as uuid} from 'uuid';

export const runtime='nodejs';

const MAX_FILE_SIZE=250*1024*1024;
const allowedNonImageMimeTypes=new Set([
  'video/mp4','video/webm','video/quicktime',
  'audio/mpeg','audio/mp4','audio/wav','audio/x-wav','audio/ogg','audio/webm'
]);

function detectImage(buffer:Buffer):{mimeType:string;extension:string}|null{
  if(buffer.length>=8 && buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))return {mimeType:'image/png',extension:'.png'};
  if(buffer.length>=3 && buffer[0]===0xff && buffer[1]===0xd8 && buffer[2]===0xff)return {mimeType:'image/jpeg',extension:'.jpg'};
  if(buffer.length>=12 && buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP')return {mimeType:'image/webp',extension:'.webp'};
  if(buffer.length>=6 && ['GIF87a','GIF89a'].includes(buffer.toString('ascii',0,6)))return {mimeType:'image/gif',extension:'.gif'};
  return null;
}

export async function POST(req:Request){
  const data=await req.formData();
  const file=data.get('file');
  const requested=String(data.get('type')||'');
  if(!(file instanceof File))return NextResponse.json({error:'لم يتم إرسال ملف.'},{status:400});
  if(file.size===0)return NextResponse.json({error:'الملف فارغ أو لم يُرفع بصورة صحيحة.'},{status:400});
  if(file.size>MAX_FILE_SIZE)return NextResponse.json({error:'حجم الملف يتجاوز 250MB.'},{status:400});

  const buffer=Buffer.from(await file.arrayBuffer());
  const claimsImage=file.type.startsWith('image/')||requested==='logo';
  const detectedImage=detectImage(buffer);
  if(claimsImage && !detectedImage){
    return NextResponse.json({error:'الصورة غير صالحة أو غير مدعومة. استخدم PNG أو JPEG أو WebP أو GIF.'},{status:415});
  }
  if(!claimsImage && !allowedNonImageMimeTypes.has(file.type)){
    return NextResponse.json({error:'نوع الملف غير مدعوم. استخدم صورة PNG/JPEG/WebP/GIF أو فيديو MP4/WebM/MOV أو ملفًا صوتيًا مدعومًا.'},{status:415});
  }

  let type:'image'|'video'|'audio'|'logo';
  let mimeType=file.type;
  let extension='';
  if(detectedImage){
    type=requested==='logo'?'logo':'image';
    mimeType=detectedImage.mimeType;
    extension=detectedImage.extension;
  }else{
    type=file.type.startsWith('video/')?'video':'audio';
    const safeExtension=path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g,'');
    extension=safeExtension|| (type==='video'?'.mp4':'.mp3');
  }

  const filename=`${uuid()}${extension}`;
  const dir=path.join(process.cwd(),'public','uploads');
  await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,filename),buffer,{flag:'wx'});
  return NextResponse.json({id:uuid(),name:file.name,url:`/uploads/${filename}`,type,mimeType,description:''});
}
