"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const script=fs.readFileSync(path.join(__dirname,"../src/main/assets/login_entry.js"),"utf8");
let passed=0;
function el(label="",attrs={}){
 const o={
  innerText:label,textContent:label,disabled:false,children:[],
  parentElement:null,
  getClientRects:()=>[{}],
  querySelectorAll:()=>[],
  getAttribute:k=>attrs[k]||null,
  click:()=>{o.clicks=(o.clicks||0)+1},
  clicks:0
 };
 return o;
}
function run(config,keepWindow){
 const calls=[];
 const window=keepWindow||{};
 const clickable=config.clickable||[];
 const labels=config.labels||[];
 const dialogs=config.dialogs||[];
 const document={
   body:{innerText:config.bodyText||""},
   querySelectorAll:(selector)=>{
     calls.push(selector);
     if(selector==="a,button,[role=button]")return clickable;
     if(selector==="label,span,strong,div")return labels;
     if(selector==='[role="dialog"],[aria-modal="true"]')return dialogs;
     return [];
   }
 };
 const output=vm.runInNewContext(script.replace("__SHINY__",String(!!config.shiny))
   .replace("__PROVIDER__",JSON.stringify(config.provider||"")),{document,window});
 return {output,window,calls};
}
function t(name,actual,expected){
 assert.equal(actual,expected,name);
 passed++;
}
const account=run({bodyText:"Pokemon\nShiny for your account Example (000000000000)." });
t("Private account badge prevents duplicate login",account.output,"authenticated");
t("No external site details leaked",Object.keys(account.window).length,0);
const logout=el("Log out");
t("Visible logout means session ready",run({clickable:[logout]}).output,"authenticated");
const login=el("Log in");
const win={};
t("Actual login button triggered",run({clickable:[login]},win).output,"triggered");
t("Actual login clicked once",login.clicks,1);
t("No duplicate click on same document",run({clickable:[login]},win).output,"waiting");
t("Still one click",login.clicks,1);
const sw=el();
const container=el();
container.querySelectorAll=sel=>sel.includes("input[type=checkbox]")?[sw]:[];
const shinyLabel=el("✨ Shiny only");
shinyLabel.parentElement=container;
t("Shiny tap may trigger official site switch to reveal login",run({shiny:true,labels:[shinyLabel]}).output,"triggered");
t("Real Shiny switch clicked exactly once",sw.clicks,1);
sw.clicks=0;
t("General login does not toggle Shiny by itself",run({shiny:false,labels:[shinyLabel]}).output,"waiting");
t("Shiny stayed untouched",sw.clicks,0);
t("OAuth dialog becomes visible",run({dialogs:[el("Continue with Google or Discord")]}).output,"ready");
t("Provider button becomes visible",run({clickable:[el("Continue with Google")]}).output,"ready");
const menu=el("",{"aria-label":"Menu"});
t("Mobile hamburger can reveal Login option",run({clickable:[menu]}).output,"triggered");
t("Hamburger click happens once",menu.clicks,1);
t("Unknown login remains waiting for manual fallback",run({}).output,"waiting");
const officialGoogle=el("Continue with Google");
const googleState={};
t("Google home button clicks only actual official provider control",
 run({provider:"google",clickable:[officialGoogle]},googleState).output,"triggered");
t("Official Google button clicked once",officialGoogle.clicks,1);
t("Repeated provider probe does not click again",
 run({provider:"google",clickable:[officialGoogle]},googleState).output,"ready");
t("Official Google did not receive a second click",officialGoogle.clicks,1);
const officialDiscord=el("Login with Discord");
t("Discord home button clicks the visible Discord provider",
 run({provider:"discord",clickable:[officialDiscord]}).output,"triggered");
t("Discord provider clicked",officialDiscord.clicks,1);
const unavailable=el("Continue with Google");
t("Unavailable provider never redirected to a constructed OAuth URL",
 run({provider:"discord",clickable:[unavailable]}).output,"ready");
t("Missing Discord option does not click Google",unavailable.clicks,0);
console.log("PokeSearch login-entry contract: "+passed+" tests passed");