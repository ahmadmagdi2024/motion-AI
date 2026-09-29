import {v4 as uuid} from 'uuid';
import type {Asset, Scene, VideoProject} from './schema';

const sequence: Scene['type'][] = [
  'cinematic-opening','kinetic-typography','split-showcase','process',
  'product-hero','statistic','video-text','logo-reveal','call-to-action'
];
const cameras: Scene['camera'][] = ['push-in','pan-right','drift','pan-left','pull-out','push-in'];
const textMotions: Scene['textAnimation'][] = ['mask-reveal','word-stagger','slide','rise','scale-blur'];
const transitions: Scene['transition'][] = ['light-sweep','wipe','zoom','film-burn','fade'];

export function createLocalProject(input: {prompt:string; language:'ar'|'en'; duration:number; assets:Asset[]}): VideoProject {
  const {prompt,language,duration,assets}=input;
  const fps=30;
  const sceneCount=duration <= 20 ? 5 : duration <= 40 ? 7 : 9;
  const total=duration*fps;
  const base=Math.floor(total/sceneCount);
  const visual=assets.filter((a)=>a.type==='image'||a.type==='video');
  const logo=assets.find((a)=>a.type==='logo');
  const audio=assets.find((a)=>a.type==='audio');
  const ar=language==='ar';
  const arData=[
    ['حين تتحول الفكرة إلى حضور','قصة مصممة بإيقاع بصري يلفت الانتباه','البداية'],
    ['أبعد من الصورة','حركة، إيقاع وتفاصيل تعمل معًا','نصنع التأثير'],
    ['التفاصيل تصنع الفرق','نمنح كل عنصر مساحته ودوره داخل المشهد','رؤية متكاملة'],
    ['منهج واضح','فكرة مدروسة، تصميم متزن، ثم تنفيذ دقيق','خطوة بخطوة'],
    ['في قلب المشهد','نضع المنتج في مركز تجربة بصرية راقية','مصمم للظهور'],
    ['دقة','قرارات بصرية محسوبة تصنع تجربة أكثر تماسكًا','في كل إطار'],
    ['هوية تتحرك','لغة بصرية تحافظ على الشخصية وتمنحها حياة','حضور مستمر'],
    ['علامتك في الواجهة','خاتمة نظيفة تترك انطباعًا واضحًا','هوية'],
    ['ابدأ قصتك','حوّل فكرتك إلى تجربة يراها جمهورك ويتذكرها','الخطوة التالية']
  ];
  const enData=[
    ['Where ideas gain presence','A story shaped with visual rhythm and purpose','The opening'],
    ['Beyond the image','Motion, pace and detail working as one','Create impact'],
    ['Details make the difference','Every element earns its place in the frame','One vision'],
    ['A clear process','Thoughtful concept, balanced design, precise execution','Step by step'],
    ['At the center','The product becomes the hero of a refined visual world','Made to stand out'],
    ['Precision','Considered visual decisions create a cohesive experience','Every frame'],
    ['Identity in motion','A visual language that stays distinctive and alive','Always present'],
    ['Your mark, revealed','A clean finale designed to be remembered','Identity'],
    ['Start your story','Turn your idea into an experience your audience remembers','Next step']
  ];
  const copy=ar?arData:enData;
  const scenes:Scene[]=Array.from({length:sceneCount},(_,i)=>{
    const type=i===sceneCount-1?'call-to-action':sequence[i];
    const background=visual.length?visual[i%visual.length]:undefined;
    const foreground=visual.length>1?visual[(i+1)%visual.length]:background;
    return {
      id:uuid(),type,durationInFrames:i===sceneCount-1?total-base*(sceneCount-1):base,
      title:copy[i][0],subtitle:i===0?prompt.slice(0,220):copy[i][1],eyebrow:copy[i][2],
      backgroundAssetId:background?.id,foregroundAssetId:['product-hero','split-showcase'].includes(type)?foreground?.id:undefined,
      accent:'#d8b56b',statistic:type==='statistic'?(ar?'دقة':'PRECISION'):undefined,
      items:type==='process'?(ar?['الفكرة','التكوين','الحركة','الصقل']:['Concept','Composition','Motion','Polish']):[],
      cta:type==='call-to-action'?(ar?'تواصل معنا':'Get in touch'):'',
      layout:type==='kinetic-typography'||type==='logo-reveal'?'center':i%2?'split-left':'editorial',
      camera:cameras[i%cameras.length],textAnimation:textMotions[i%textMotions.length],
      mediaAnimation:i%2?'parallax':'ken-burns',backgroundStyle:i%3===1?'gradient-grid':'cinematic',
      intensity:1,focusPoint:{x:50,y:45},transition:i===sceneCount-1?'fade':transitions[i%transitions.length]
    };
  });
  return {
    id:uuid(),title:ar?'تجربة بصرية جديدة':'A new visual experience',brief:prompt,
    language,direction:ar?'rtl':'ltr',fps,width:1080,height:1920,
    brand:{primaryColor:'#d8b56b',backgroundColor:'#070808',fontFamily:'Arial',logoAssetId:logo?.id,name:'',tagline:''},
    voiceover:'',musicAssetId:audio?.id,assets,scenes
  };
}
