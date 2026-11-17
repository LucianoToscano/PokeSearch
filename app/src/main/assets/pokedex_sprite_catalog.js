/* LT400 · Índice de sprites GO. Metadados somente; nenhuma arte é incorporada ao APK.
 * Os arquivos são do catálogo PokeMiners e pertencem aos respectivos titulares.
 * Somente chaves e variantes comprovadas por manifestos podem gerar caminhos.
 */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.PokeSearchSpriteCatalog=api;
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const norm=s=>String(s??"").toUpperCase().replace(/[^A-Z0-9]/g,"");
 const safe=name=>/^[A-Za-z0-9_.-]{1,150}\.png$/.test(String(name||""));
 function create(data){
  const primary=new Map((data.files||[]).filter(x=>safe(x[0])).map(x=>[x[0],x]));
  const legacy=new Map((data.legacy||[]).filter(x=>safe(x[0])).map(x=>[x[0],x]));
  const formIds=new Map((data.forms||[]).map(x=>[Number(x[0]),x]));
  const formsByName=new Map((data.forms||[]).map(x=>[norm(x[1]),x]));
  const costumes=new Map((data.costumes||[]).map(x=>[Number(x[0]),x]));
  const species=new Map((data.species||[]).map(x=>[Number(x[0]),x]));
  const defaults=new Map((data.defaultIdentifiers||[]).map(x=>[Number(x[0]),norm(x[1])]));
  function flag(id,i){return !!species.get(Number(id))?.[i];}
  function classify(p){
   const dex=Number(p?.species??p?.pokemonId);
   if(!Number.isInteger(dex)||dex<=0||dex>1025)
    return {key:null,reason:"species-unavailable",dex};
   const costumeId=Number(p.costume)||0;
   const formId=Number(p.form)||0;
   const rawName=String(p.formName||"");
   const speciesNorm=norm(p.name||p.speciesName||"");
   const rawNorm=norm(rawName);
   const useForm=rawNorm&&!["UNSET","DEFAULT"].includes(rawNorm);
   const form=useForm?(formsByName.get(rawNorm)||formIds.get(formId)):null;
   let suffix="",formUnknown=false;
   if(useForm){
    if(form){
     let proto=String(form[2]||"").toUpperCase();
     const formsToken=norm(form[1]||"");
     // GN ids from data/v1 may be preserved even for forms with PGO-specific prefixes.
     const guess=speciesNorm&&formsToken.startsWith(speciesNorm)?
       formsToken.slice(speciesNorm.length):formsToken;
     if(proto.startsWith(speciesNorm+"_"))proto=proto.slice(speciesNorm.length+1);
     else if(proto.startsWith(speciesNorm))proto=proto.slice(speciesNorm.length);
     suffix=proto.replace(/^_+/,"")||guess;
     if(!suffix&&guess)suffix=guess;
    }else{
     suffix=speciesNorm&&rawNorm.startsWith(speciesNorm)?rawNorm.slice(speciesNorm.length):rawNorm;
     formUnknown=!!suffix&&!["NORMAL","STANDARD"].includes(suffix);
    }
   }
   const normal=!suffix||["NORMAL","STANDARD","DEFAULT","UNSET"].includes(suffix);
   const defaultIdentifier=defaults.get(dex)||"";
   const defaultMatch=!!suffix&&
     (norm(speciesNorm+suffix)===defaultIdentifier||norm(rawName)===defaultIdentifier);
   const costume=costumeId?costumes.get(costumeId):null;
   if(costumeId&&!costume)return {key:null,reason:"costume-unmapped",dex};
   const shiny=!!p.shiny,female=Number(p.gender)===2;
   const exactGender=flag(dex,4);
   const number="pm"+dex;
   const costumeToken=costume?String(costume[1]):"";
   const combinations=[];
   const add=(s,exact=true)=>{
    if(s&&!combinations.some(c=>c.prefix===s))combinations.push({prefix:s,exact});
   };
   // For PGO's special costume/form union, never show just the base Pokemon.
   if(costume){
    if(suffix&&!normal)add(number+".f"+suffix+".c"+costumeToken);
    if(!suffix||normal||defaultMatch)add(number+".c"+costumeToken);
   }else{
    if(suffix&&!normal)add(number+".f"+suffix);
    if(normal&&suffix)add(number+".f"+suffix);
    if(!suffix||normal||defaultMatch)add(number,normal||defaultMatch);
   }
   if(formUnknown&&!normal&&!combinations.some(x=>primary.has(x.prefix+".icon.png")))
    return {key:null,reason:"form-unmapped",dex};
   for(const {prefix,exact} of combinations){
    const genderSuffix=female?".g2":"";
    const genderAware=prefix+genderSuffix+(shiny?".s":"")+".icon.png";
    if(primary.has(genderAware))return {key:"a:"+genderAware,reason:"exact",dex,exact};
    // A female-only explicit form (Meowstic, etc.) already encodes gender.
    const formSpecifiesGender=/(?:^|_)FEMALE$/.test(suffix);
    if(female&&exactGender&&!formSpecifiesGender)continue;
    const plain=prefix+(shiny?".s":"")+".icon.png";
    if(primary.has(plain))return {key:"a:"+plain,reason:"exact",dex,exact};
   }
   // Older GO exports contain stable default artwork, but no reliable generic
   // mapping of form/costume numbers to legacy filenames.
   if(!costume&&(!suffix||normal||defaultMatch)&&!exactGender){
    const base="pokemon_icon_"+String(dex).padStart(3,"0")+"_00"+
      (shiny?"_shiny":"")+".png";
    if(legacy.has(base))return {key:"l:"+base,reason:"verified-legacy",dex,exact:true};
   }
   return {key:null,reason:costume?"costume-art-unavailable":
      suffix?"form-art-unavailable":shiny?"shiny-art-unavailable":"base-art-unavailable",dex};
  }
  const idStatus=id=>{
   const a=species.get(Number(id));return a?{
    legendary:!!a[1],mythical:!!a[2],canEvolve:!!a[3],genderDifferent:!!a[4]
   }:{legendary:false,mythical:false,canEvolve:false,genderDifferent:false};
  };
  const entry=key=>{
   if(typeof key!=="string"||!key.includes(":"))return null;
   const variant=key.slice(0,1),filename=key.slice(2);
   const map=variant==="a"?primary:variant==="l"?legacy:null;
   return safe(filename)?map?.get(filename)||null:null;
  };
  const isCostumeForm=id=>formIds.get(Number(id))?.[3]===1;
  return Object.freeze({classify,idStatus,isCostumeForm,entry,primary,legacy,forms:formIds,costumes});
 }
 return Object.freeze({create,norm});
});