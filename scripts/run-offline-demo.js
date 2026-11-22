#!/usr/bin/env node
"use strict";

/**
 * Standalone public-PRESENTATION / local-OFFLINE-only server.
 * Does not open a scanner endpoint, ask for auth, share spawns or connect to
 * any game/vendor service. The dashboard's demo button creates fixtures only
 * inside the viewer. A real feed request ALWAYS returns 403 here.
 */
const http=require("node:http");
const {html}=require("../functions/authorized-feed-dashboard");
const port=Number(process.env.POKESEARCH_DEMO_PORT||"8766");
if(!Number.isInteger(port)||port<1024||port>65535) {
  throw new Error("POKESEARCH_DEMO_PORT must be between 1024 and 65535");
}
const server=http.createServer((req,res)=>{
  if(req.method==="GET"&&(req.url==="/"||req.url==="/painel")){
    res.writeHead(200,{
      "Content-Type":"text/html; charset=utf-8",
      "Cache-Control":"no-store",
      "X-Content-Type-Options":"nosniff",
      "X-Frame-Options":"DENY",
      "Content-Security-Policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"
    });
    res.end(html);
  }else{
    res.writeHead(403,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"});
    res.end(JSON.stringify({error:"offline_demo_only",demo:true}));
  }
});
if(require.main===module){
  server.listen(port,"127.0.0.1",()=>{
    process.stdout.write("PokeSearch OFFLINE DEMO: http://127.0.0.1:"+port+"/painel\n");
  });
}
module.exports={server};
