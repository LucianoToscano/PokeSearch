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

// LT300: original historical PNG stays in the repository for rollback,
 // but the SHIPPING rank marker is a small stack of up chevrons.
assert.ok(fs.existsSync(path.join(assets, 'ui-icons', 'ps-evolution-lt272.png')));
assert.doesNotMatch(html.slice(html.indexOf('function psMakeEvolutionBadge(')),
 /img.src="ui-icons\/ps-evolution-lt272\.png"/);
assert.ok(html.includes('mark.className="psRailEvolve"'));
assert.ok(html.includes('chevron.className="psRailChevron"'));
const evo = rail.slice(rail.indexOf('/* LT272 —'));
assert.ok(evo.length > 500, 'LT272 evolution badge CSS must exist');
assert.match(evo, /right:5px!important;bottom:5px!important/);
assert.match(evo, /width:15px!important;height:15px!important/);
assert.match(evo, /width:13px!important;height:13px!important/); // narrow viewport
assert.doesNotMatch(evo, /width:(?:9|11)px!important;height:(?:9|11)px!important/, 'badge must not shrink again');
assert.doesNotMatch(evo, /height:(?:54|56)px!important;min-height:(?:54|56)px!important/, 'card must not grow again');

// LT275: final override MUST move the marker out of the triangular flag's
// sloping edge, while leaving card and flags the same size.
const lt275 = rail.slice(rail.indexOf('/* LT275 —'));
assert.ok(lt275.length > 450, 'LT275 collision guard must be in the shipping CSS');
assert.match(lt275, /translateY\(-4px\)!important/, 'center flag lifted, never rescaled');
assert.match(lt275, /right:2px!important;bottom:1px!important/);
assert.match(lt275, /right:1px!important;bottom:1px!important/);
assert.match(lt275, /width:15px!important;height:15px!important/);
assert.match(lt275, /width:13px!important;height:13px!important/);
assert.doesNotMatch(lt275, /height:5[46]px!important/, 'rank card height cannot grow');
// LT278: exact 1px movement only for #rank numbers, all five positions.
// Do not globally translate the card, flags, or white/green evolution mark.
const lt278 = rail.slice(rail.indexOf('/* LT278 —'));
assert.ok(lt278.startsWith('/* LT278 —'));
assert.match(lt278, /\.psRailButton \.psRailNumber\{\s*transform:translateY\(-1px\)!important;\s*\}/);
assert.match(lt278, /\.psRailButton \.psRailIcon\{\s*transform:translateY\(-4px\)!important;\s*\}/);
assert.doesNotMatch(lt278, /\.psRailButton\{\s*transform:/, 'card must remain fixed');
assert.doesNotMatch(lt278, /height:5[46]px!important/, 'rank card must stay 45px');
const lt300=rail.slice(rail.indexOf('/* LT300: five tighter rank/raid boxes'));
assert.ok(lt300.startsWith('/* LT300: five tighter rank/raid boxes'));
assert.match(lt300,/height:41px!important;min-height:41px!important/);
assert.match(lt300,/height:39px!important;min-height:39px!important/);
assert.match(lt300,/width:21px!important;height:21px!important/);
assert.match(lt300,/width:9px!important/);
assert.match(lt300,/height:18px!important/);
assert.match(lt300,/width:6px!important;height:6px!important/);
assert.match(lt300,/transform:rotate\(45deg\)!important/);
assert.ok(rail.indexOf('/* LT300: five tighter')>rail.indexOf('/* LT278 —'));
// The shipping LT301 CSS must override earlier historical styles.
const lt301=rail.slice(rail.indexOf('/* LT301 Samsung refinement'));
assert.ok(lt301.startsWith('/* LT301 Samsung refinement'));
assert.match(lt301,/right:5px!important;bottom:5px!important/);
assert.match(lt301,/width:7px!important;min-width:7px!important;max-width:7px!important/);
assert.match(lt301,/height:12px!important;min-height:12px!important;max-height:12px!important/);
assert.match(lt301,/width:4px!important;height:4px!important;flex:0 0 4px!important/);
assert.match(lt301,/border-top:1px solid #e7fbff!important/);
assert.match(lt301,/border-left:1px solid #e7fbff!important/);
assert.match(lt301,/left:50%!important;top:14px!important/);
assert.match(lt301,/transform:translateX\(-50%\)!important/);
assert.ok(rail.indexOf('/* LT301 Samsung refinement')>rail.indexOf('/* LT300: five tighter'));
console.log('LT301: thin 0-2 chevrons with safe margins and centered flags.');
