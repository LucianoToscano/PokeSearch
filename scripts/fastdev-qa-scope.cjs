"use strict";
/**
 * Only an entirely Preview-internal PR may skip the unrelated official beta/R8
 * build. Unknown or empty changes ALWAYS require the full beta gate.
 * Full Android Preview compilation remains a separate mandatory PR workflow.
 */
const fs=require("node:fs");
function previewOnly(path){
 return path.startsWith("app/src/preview/")||
   path.startsWith("docs/")||
   path.startsWith("fastdev/")||
   path.startsWith("scripts/fastdev-")||
   path==="AGENTS.md"||
   path===".github/workflows/pokesearch-fastdev.yml"||
   path===".github/workflows/pokesearch-fastdev-branch.yml"||
   path===".github/workflows/pokesearch-preview-compile.yml";
}
function requiresBeta(paths){
 if(!Array.isArray(paths)||paths.length===0)return true;
 return paths.some(path=>typeof path!=="string"||!path||!previewOnly(path));
}
if(require.main===module){
 try{
  const file=process.argv[2];
  if(!file)throw Error("Missing changed-files list");
  const paths=fs.readFileSync(file,"utf8").split(/\r?\n/).filter(Boolean);
  const required=requiresBeta(paths);
  process.stdout.write(required?"true\n":"false\n");
 }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={previewOnly,requiresBeta};
