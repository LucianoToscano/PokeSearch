"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const http=require("node:http");
const {server}=require("../scripts/run-offline-demo");

test("offline showcase works with zero external credentials or event sources",async()=>{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const port=server.address().port;
  try{
    async function get(path) {
      return await new Promise((resolve,reject)=>{
        http.get({hostname:"127.0.0.1",port,path},response=>{
          const chunks=[];response.on("data",b=>chunks.push(b));
          response.on("end",()=>resolve({code:response.statusCode,
            headers:response.headers,text:Buffer.concat(chunks).toString()}));
        }).on("error",reject);
      });
    }
    const page=await get("/painel");
    assert.equal(page.code,200);
    assert.match(page.text,/Exibir demonstração fictícia/);
    assert.match(page.headers["content-security-policy"],/connect-src 'self'/);
    const blocked=await get("/raw_data?pokemon=true");
    assert.equal(blocked.code,403);
    assert.deepEqual(JSON.parse(blocked.text),{error:"offline_demo_only",demo:true});
    const blocked2=await get("/status");
    assert.equal(blocked2.code,403);
    assert.equal((await get("/")).code,200);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
