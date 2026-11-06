'use strict';

// LT274: regression guard for the user's original compact rank-card reference.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const assets = path.join(__dirname, '..', 'src', 'main', 'assets');
const html = fs.readFileSync(path.join(assets, 'detail.html'), 'utf8');
const css = html.slice(0, html.indexOf('</style>'));
const rail = css.slice(css.indexOf('/* LT271: five badges'));

assert.ok(rail.length > 100, 'five-rank rail CSS must exist');
assert.match(rail, /height:47px!important;min-height:47px!important/, 'rank row remains compact');
assert.match(rail, /height:45px!important;min-height:45px!important/, 'rank buttons remain compact');
assert.match(rail, /\.psRailIcon\{order:1;width:23px!important;height:23px!important/, 'league flags retain their size');

// The original supplied evolution PNG (not an arrow or text) must be retained.
assert.match(html, /ui-icons\/ps-evolution-lt272\.png/);
assert.ok(fs.existsSync(path.join(assets, 'ui-icons', 'ps-evolution-lt272.png')));

const evo = rail.slice(rail.indexOf('/* LT272 —'));
assert.ok(evo.length > 500, 'LT272 evolution badge CSS must exist');
assert.match(evo, /right:5px!important;bottom:5px!important/);
assert.match(evo, /width:15px!important;height:15px!important/);
assert.match(evo, /width:13px!important;height:13px!important/); // narrow viewport
assert.doesNotMatch(evo, /width:(?:9|11)px!important;height:(?:9|11)px!important/, 'badge must not shrink again');
assert.doesNotMatch(evo, /height:(?:54|56)px!important;min-height:(?:54|56)px!important/, 'card must not grow again');

console.log('LT274: compact five-rank cards, original-sized evolution mark and flag preserved.');
