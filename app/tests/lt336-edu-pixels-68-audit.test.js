"use strict";
/*
 * LT336 — triagem dos pixels dos 68 PNGs mestres (somente QA).
 * Não substitui avaliação humana nem mede a composição Android das poses
 * #00–03 e #63–64 que a LT335 desenha em runtime.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const zlib=require("node:zlib");
const crypto=require("node:crypto");
const ROOT="app/src/main/assets";
const OUT="app/build/edu-visual-audit";
const CELL=512,COUNT=68;
const parts=Array.from({length:13},(_,i)=>
  fs.readFileSync(path.join(ROOT,"edu_avatar_masters_512_lt330.part"+String(i).padStart(2,"0"))));
const zip=Buffer.concat(parts);
assert.equal(zip.length,10372393,"Tamanho oficial ZIP LT330");
assert.equal(crypto.createHash("sha256").update(zip).digest("hex"),
 "f1957b7f6446d82ed9fdb9ace8b0b5d950dfc10f0709aa1618054a366791ac25",
 "Pacote mestre alterado");
const files=new Map();
for(let at=0;at+30<zip.length&&zip.readUInt32LE(at)===0x04034b50;){
 const flags=zip.readUInt16LE(at+6),method=zip.readUInt16LE(at+8);
 const size=zip.readUInt32LE(at+18),nameLen=zip.readUInt16LE(at+26);
 const extra=zip.readUInt16LE(at+28);
 const name=zip.toString("utf8",at+30,at+30+nameLen);
 const start=at+30+nameLen+extra;
 assert.equal(flags&8,0,"Descritor ZIP não suportado");
 assert.equal(method,0,"PNG não deve ser recomprimido no ZIP");
 assert.match(name,/^\d\d\.png$/);
 assert.ok(start+size<=zip.length,"ZIP truncado: "+name);
 assert.ok(!files.has(name),"Duplicado: "+name);
 files.set(name,zip.subarray(start,start+size));
 at=start+size;
}
assert.equal(files.size,COUNT,"Faltam sprites");
function paeth(a,b,c){
 const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);
 return da<=db&&da<=dc?a:db<=dc?b:c;
}
function pixels(png,name){
 assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a",name);
 let w=0,h=0,depth=0,type=0,interlace=0;
 const idat=[];
 for(let at=8;at+12<=png.length;){
  const size=png.readUInt32BE(at),kind=png.toString("ascii",at+4,at+8),start=at+8;
  assert.ok(start+size+4<=png.length,"PNG truncado "+name);
  if(kind==="IHDR"){
   w=png.readUInt32BE(start);h=png.readUInt32BE(start+4);
   depth=png[start+8];type=png[start+9];interlace=png[start+12];
  }
  if(kind==="IDAT")idat.push(png.subarray(start,start+size));
  at=start+size+4;
  if(kind==="IEND")break;
 }
 assert.deepEqual([w,h,depth,type,interlace],[CELL,CELL,8,6,0],
  "PNG deve ser 512x512 RGBA 8 bits não entrelaçado: "+name);
 const packed=zlib.inflateSync(Buffer.concat(idat)),stride=CELL*4;
 assert.equal(packed.length,(stride+1)*CELL,"Pixel stream incorreto: "+name);
 const out=Buffer.alloc(stride*CELL);
 for(let y=0;y<CELL;y++){
  const filter=packed[y*(stride+1)];
  assert.ok(filter<=4,"Filtro PNG incorreto: "+name);
  for(let x=0;x<stride;x++){
   const at=y*stride+x,a=x>=4?out[at-4]:0,b=y?out[at-stride]:0;
   const c=y&&x>=4?out[at-stride-4]:0;
   const pred=filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):
     filter===4?paeth(a,b,c):0;
   out[at]=(packed[y*(stride+1)+1+x]+pred)&255;
  }
 }
 return out;
}
function span(px,x0,x1,y0,y1,mode){
 let minX=999,minY=999,maxX=-1,maxY=-1,count=0;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
  const at=(y*CELL+x)*4,r=px[at],g=px[at+1],b=px[at+2];
  if(px[at+3]<160)continue;
  let found=false;
  if(mode==="hair")found=r>=30&&r<=165&&g>=12&&g<=120&&b<=120&&r*100>g*108&&g*100>b*65;
  else if(mode==="glasses")found=r>175&&g>175&&b>175;
  else if(mode==="hands")found=r>165&&g>75&&g<210&&b<165&&r*100>g*110&&g*100>b*120;
  else found=(r>190&&g<130&&b<130)||(r>190&&g>185&&b>175);
  if(!found)continue;
  count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);
  minY=Math.min(minY,y);maxY=Math.max(maxY,y);
 }
 return {valid:count>25,width:count>25?maxX-minX+1:0,
  cx:(minX+maxX)/2,maxY,minY,count};
}
function measure(px){
 const hair=span(px,130,380,20,220,"hair");
 const glasses=span(px,135,378,145,244,"glasses");
 const hands=span(px,125,382,265,415,"hands");
 const feet=span(px,125,385,417,500,"feet");
 let count=0,edge=0;
 for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++){
  if(px[(y*CELL+x)*4+3]<32)continue;
  count++;if(x<4||y<4||x>=508||y>=508)edge++;
 }
 return {hair,glasses,hands,feet,count,edgeRatio:count?edge/count:0};
}
fs.mkdirSync(path.join(OUT,"frames"),{recursive:true});
const rows=[];
for(let i=0;i<COUNT;i++){
 const name=String(i).padStart(2,"0"),png=files.get(name+".png");
 assert.ok(png,"PNG ausente: "+name);
 const m=measure(pixels(png,name));
 assert.ok(m.count>100,"PNG transparente/vazio: "+name);
 fs.writeFileSync(path.join(OUT,"frames",name+".png"),png);
 rows.push({index:i,name,m});
}
const ref=rows[42].m;
const round=v=>Number.isFinite(v)?Math.round(v*10)/10:null;
for(const r of rows){
 const m=r.m,i=r.index;
 const runtime=i<=3||i===63||i===64;
 const exception=(i>=9&&i<=18)||(i>=52&&i<=60)||i===62||i>=65;
 const comparable=!runtime&&!exception;
 const head=m.hair.valid&&ref.hair.valid?100*(m.hair.width/ref.hair.width-1):null;
 const center=m.hair.valid&&ref.hair.valid?m.hair.cx-ref.hair.cx:null;
 const feet=m.feet.valid&&ref.feet.valid?m.feet.maxY-ref.feet.maxY:null;
 const flags=[];
 if(m.edgeRatio>0.008)flags.push("borda");
 if(comparable){
  if(head!=null&&Math.abs(head)>2)flags.push("cabeça");
  if(center!=null&&Math.abs(center)>4)flags.push("eixo");
  if(feet!=null&&Math.abs(feet)>4)flags.push("pés");
  if(head==null||feet==null)flags.push("medição-indisponível");
 }
 r.group=runtime?"composição-runtime":exception?"efeito/roupa":"comparável";
 r.head=round(head);r.center=round(center);r.feet=round(feet);
 r.glasses=m.glasses.width;r.hands=m.hands.width;
 r.shoes=m.feet.width;r.edge=round(m.edgeRatio*100);
 r.flags=flags;delete r.m;
}
const columns=["index","group","head","center","feet","glasses","hands","shoes","edge","flags"];
const field=v=>'"'+String(v==null?"":Array.isArray(v)?v.join(";"):v).replaceAll('"','""')+'"';
fs.writeFileSync(path.join(OUT,"medidas.csv"),
 [columns.join(","),...rows.map(r=>columns.map(k=>field(r[k])).join(","))].join("\n")+"\n");
fs.writeFileSync(path.join(OUT,"medidas.json"),
 JSON.stringify({source:"LT330 PNGs originais (não composição Android)",reference:42,rows},null,2)+"\n");
const cards=rows.map(r=>
 '<article data-flag="'+(r.flags.length?"yes":"no")+'"><h2>#'+r.name+
 ' <small>'+r.group+'</small></h2><div class="pair">'+
 '<div><img loading="lazy" src="frames/42.png"><small>Referência #42</small></div>'+
 '<div><img loading="lazy" src="frames/'+r.name+'.png"><small>Fonte #'+r.name+'</small></div>'+
 '</div><p>Cabeça '+(r.head??"—")+'% · Centro '+(r.center??"—")+
 ' px · Pés '+(r.feet??"—")+' px</p><p>Triagem: '+(r.flags.join(", ")||"sem alerta")+
 '</p></article>').join("\n");
const css='body{font:14px system-ui;background:#121d26;color:#edf5fd;margin:20px}'+
 'h1{font-size:22px}button{margin:4px;padding:8px}main{display:grid;grid-template-columns:'+
 'repeat(auto-fill,minmax(320px,1fr));gap:12px}article{border:1px solid #617b90;'+
 'border-radius:10px;padding:12px}h2{margin:0 0 8px}small{display:block;color:#bcd1dc;font-size:11px}'+
 '.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pair img{width:100%;'+
 'height:auto;aspect-ratio:1;image-rendering:pixelated;background:#384958}'+
 '.only-flags article[data-flag=no]{display:none}p{font-size:12px}'+
 '.guides .pair img{outline:2px dashed #37cbb8;outline-offset:-3px}';
const html='<!doctype html><html lang="pt-BR"><meta charset="utf-8">'+
 '<meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<title>Edu — 68 sprites LT330</title><style>'+css+'</style><body>'+
 '<h1>Edu: 68 PNGs mestres de 512×512</h1><p>Triagem da arte original LT330. '+
 'Quadros #00–03 e #63–64 são recompostos em execução na LT335; este catálogo '+
 'NÃO mostra a renderização final. Efeitos e armaduras exigem avaliação manual.</p>'+
 '<button onclick="document.body.classList.toggle(\'only-flags\')">Apenas alertas</button>'+
 '<button onclick="document.body.classList.toggle(\'guides\')">Realçar células</button>'+
 '<main>'+cards+'</main></body></html>';
fs.writeFileSync(path.join(OUT,"index.html"),html);
const flagged=rows.filter(x=>x.flags.length);
console.log("LT336: 68 PNGs RGBA 512 íntegros; "+rows.filter(x=>x.group==="comparável").length+
 " comparáveis, "+flagged.length+" sinalizados por triagem.");
console.log("Sinalizados: "+flagged.map(x=>"#"+x.name+"("+x.flags.join("/")+")").join(" "));
console.log("Artefato informativo em "+OUT+". Não há alteração nos masters.");
