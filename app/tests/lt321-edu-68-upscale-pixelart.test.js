"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const cp=require("node:child_process");

const dir="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const javaFile=dir+"EduPixelArtUpscale.java";
const java=fs.readFileSync(javaFile,"utf8");
const atlas=fs.readFileSync(dir+"EduSpriteAtlas.java","utf8");
assert.match(java,/static int\[\] scale4x\(int\[\] argb,int width,int height\)/);
assert.match(java,/return nearest2x\(twice,width\*2,height\*2\)/);
assert.match(java,/if\(n!=s && w!=e\)/);
assert.match(atlas,/EduPixelArtUpscale\.scale4x\(pixels,CELL,CELL\)/);
assert.match(atlas,/EduSpriteManualRetouch\.apply\(crop,i\)/);
assert.match(atlas,/if\(uniformFrame&&correctedAtlas\)/);
assert.match(atlas,/DISPLAY_SOURCE_PX=512/);
assert.match(atlas,/new LruCache<>\(8\)/);
assert.match(atlas,/catch\(OutOfMemoryError memory\)/);
assert.match(atlas,/SHADOW_INDEX=67, COLLECTION_COUNT=TOTAL_COUNT\+1/);
// LT333: a suavização anterior apagava detalhes finos do Edu.
assert.match(atlas,/drawable\.setFilterBitmap\(false\)/);
assert.doesNotMatch(atlas,/drawable\.setFilterBitmap\(true\)/);

const javac=cp.spawnSync("javac",["-version"],{encoding:"utf8"});
const javaRuntime=cp.spawnSync("java",["-version"],{encoding:"utf8"});
if(javac.status!==0||javaRuntime.status!==0){
  console.log("LT321 PASS estrutura (JDK indisponível para teste dos pixels)");
  process.exit(0);
}
const temp=fs.mkdtempSync(path.join(os.tmpdir(),"edu-upscale-"));
try{
  const harness=path.join(temp,"EduUpscaleSelfTest.java");
  fs.writeFileSync(harness,`package com.lucianotoscano.pokesearchoverlay;
import java.util.Arrays;
public final class EduUpscaleSelfTest {
    private static void check(boolean b,String m){if(!b)throw new AssertionError(m);}
    public static void main(String[] args){
        int[] frame=new int[128*128];
        Arrays.fill(frame,0x77AABBCC);
        int[] pixels=EduPixelArtUpscale.scale4x(frame,128,128);
        check(pixels.length==512*512,"tamanho");
        for(int p:pixels)check(p==0x77AABBCC,"cor ou alfa alterados");

        Arrays.fill(frame,0);
        frame[64*128+64]=0xFF112233;
        pixels=EduPixelArtUpscale.scale4x(frame,128,128);
        int count=0;
        for(int y=0;y<512;y++)for(int x=0;x<512;x++){
            int v=pixels[y*512+x];
            if(v!=0){check(v==0xFF112233,"novo tom");count++;}
        }
        check(count==16,"ponto isolado não deve deslocar ou engrossar");

        Arrays.fill(frame,0);
        for(int y=0;y<128;y++)for(int x=0;x<128;x++)
            frame[y*128+x]=(x>y)?0xFF0000FF:0xFF00FF00;
        int[] source=frame.clone();
        pixels=EduPixelArtUpscale.scale4x(frame,128,128);
        check(Arrays.equals(frame,source),"original foi modificado");
        int difference=0;
        for(int y=0;y<512;y++)for(int x=0;x<512;x++){
            int p=pixels[y*512+x];
            check(p==0xFF0000FF||p==0xFF00FF00,"paleta alterada");
            if(p!=frame[(y/4)*128+(x/4)])difference++;
        }
        check(difference>0,"o resultado ainda é nearest-neighbor puro");
        System.out.println("LT321 JAVA PASS: 512², alfa, âncora, paleta e bordas");
    }
}`,"utf8");
  const compile=cp.spawnSync("javac",["-encoding","UTF-8","-d",temp,javaFile,harness],{encoding:"utf8"});
  assert.equal(compile.status,0,compile.stdout+"\n"+compile.stderr);
  const run=cp.spawnSync("java",["-cp",temp,"com.lucianotoscano.pokesearchoverlay.EduUpscaleSelfTest"],{encoding:"utf8"});
  assert.equal(run.status,0,run.stdout+"\n"+run.stderr);
  assert.match(run.stdout,/LT321 JAVA PASS/);
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}
console.log("LT321 PASS: upscale pixel-art 4x das 68 poses, fidelidade e cache");
