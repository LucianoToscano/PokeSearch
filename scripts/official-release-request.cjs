#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const VERSION = /^0\.\d{2}\.\d{2}$/;
const TAG = /^v(0\.\d{2}\.\d{2})-(\d+)$/;
function requireValue(ok, message) { if (!ok) throw new Error(message); }
function validate(request, latest, notes) {
  requireValue(request && request.schema === 1 && typeof request.enabled === 'boolean', 'Invalid request schema');
  if (!request.enabled) return { needed: 'false' };
  const {version, code, label, previous_tag, qa_max_code, release_notes} = request;
  requireValue(typeof version === 'string' && VERSION.test(version), 'Invalid version');
  requireValue(Number.isSafeInteger(code) && code > 54441 && code <= 2100000000, 'Invalid versionCode');
  requireValue(Number.isSafeInteger(label) && label >= 51000 && label <= 2100000000, 'Invalid label');
  requireValue(Number.isSafeInteger(qa_max_code) && qa_max_code >= 54441 && code > qa_max_code, 'Code must exceed known installed QA codes');
  requireValue(typeof previous_tag === 'string' && TAG.test(previous_tag), 'Invalid previous tag');
  requireValue(typeof release_notes === 'string' && release_notes.trim().length >= 20 && release_notes.length <= 10000 && !release_notes.includes('\0'), 'Invalid release notes');
  requireValue(latest && latest.draft === false && latest.prerelease === false && TAG.test(latest.tag_name), 'Stable latest release required');
  const tag = 'v' + version + '-' + code;
  requireValue(Array.isArray(notes.releases) && notes.releases.some(x => x.minVersionCode === code), 'Missing embedded release notes for requested code');
  if (latest.tag_name === tag) {
    requireValue(latest.assets.some(a => a.name === 'PokeSearch-v' + version + '-LT.apk' && a.state === 'uploaded' && /^sha256:[a-f0-9]{64}$/.test(a.digest)), 'Existing release has no verified APK asset');
    return { needed: 'false' };
  }
  requireValue(latest.tag_name === previous_tag, 'Latest changed; review request before publication');
  const prior = TAG.exec(previous_tag);
  requireValue(code > Number(prior[2]), 'VersionCode must increase');
  requireValue(version > prior[1], 'Public version must increase');
  return { needed: 'true', version, code: String(code), label: String(label), previous_tag, tag, apk: 'PokeSearch-v' + version + '-LT.apk' };
}
function main() {
  const mode = process.argv[2];
  requireValue(['plan', 'prepare'].includes(mode), 'Expected plan or prepare');
  requireValue(process.env.GITHUB_REPOSITORY === 'LucianoToscano/PokeSearch', 'Unexpected repository');
  const request = JSON.parse(fs.readFileSync('release/official-request.json', 'utf8'));
  const latest = request.enabled ? JSON.parse(execFileSync('gh', ['api', 'repos/LucianoToscano/PokeSearch/releases/latest'], {encoding:'utf8'})) : null;
  const notes = JSON.parse(fs.readFileSync('app/src/main/assets/release_notes.json', 'utf8'));
  const result = validate(request, latest, notes);
  if (mode === 'plan') {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, Object.entries(result).map(([k,v]) => k+'='+v+'\n').join(''));
  } else {
    requireValue(result.needed === 'true', 'Request is disabled or already published');
    const variables = {POKE_TEST_VERSION_CODE:result.code, POKE_TEST_VERSION_LABEL:result.label, POKE_TEST_PUBLIC_VERSION:result.version, OFFICIAL_TAG:result.tag, OFFICIAL_APK:result.apk, PREVIOUS_TAG:result.previous_tag};
    fs.appendFileSync(process.env.GITHUB_ENV, Object.entries(variables).map(([k,v])=>k+'='+v+'\n').join(''));
    fs.writeFileSync('RELEASE-NOTES.md', request.release_notes.trim()+'\n\nInstalação exige confirmação do Android. QA físico Samsung não é comprovado pelos testes automatizados.\n');
  }
  console.log(result.needed === 'true' ? 'Validated official release request: '+result.tag : 'No new release requested; existing APKs preserved.');
}
module.exports = {validate};
if (require.main === module) main();
