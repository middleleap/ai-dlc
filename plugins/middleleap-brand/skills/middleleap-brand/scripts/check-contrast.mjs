#!/usr/bin/env node
/**
 * MiddleLeap contrast gate · run: node scripts/check-contrast.mjs
 * Verifies every text pairing in the token system against WCAG AA.
 * Exits 1 on any failure — wire into CI before deploy.
 * If you change a token in tokens.css, change it here too; the pair list IS the contract.
 */
const T = {
  ink0:'#080808', ink1:'#101010', ink2:'#181817',
  bone0:'#ECE9E1', bone1:'#DEDBD4', bone2:'#A8A59E', bone3:'#87847D',
  ember300:'#F58F55', ember400:'#F0722E', ember500:'#E65C2D', ember600:'#CE451B',
  positive:'#5FA671', caution:'#D9A03C', critical:'#D64545', criticalText:'#E06060',
  info:'#5D8FA6', dangerBtn:'#C43B3B', btnPrimaryText:'#110D0A', onLightText:'#1B1B1B',
};

const lum = h => {
  const [r,g,b] = [0,2,4].map(i => parseInt(h.slice(1).substr(i,2),16)/255)
    .map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4);
  return .2126*r + .7152*g + .0722*b;
};
const ratio = (a,b) => { const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p); return (x+.05)/(y+.05); };
const blend = (fg,a,bg) => '#' + [0,2,4].map(i => {
  const f=parseInt(fg.slice(1).substr(i,2),16), g=parseInt(bg.slice(1).substr(i,2),16);
  return Math.round(f*a+g*(1-a)).toString(16).padStart(2,'0');
}).join('');

// [name, fg, bg, required]  — 4.5 normal text · 3.0 large text (>=24px / 18.66px bold)
const pairs = [
  ['headline bone-0 on ink-0', T.bone0, T.ink0, 4.5],
  ['body bone-1 on ink-0', T.bone1, T.ink0, 4.5],
  ['secondary bone-2 on ink-2 (worst)', T.bone2, T.ink2, 4.5],
  ['caption bone-3 on ink-2 (worst)', T.bone3, T.ink2, 4.5],
  ['eyebrow/ghost ember-400 on ink-0', T.ember400, T.ink0, 4.5],
  ['hero italic ember-500 on ink-0 (large)', T.ember500, T.ink0, 3.0],
  ['primary CTA text on ember-500', T.btnPrimaryText, T.ember500, 4.5],
  ['danger button white text', '#FFFFFF', T.dangerBtn, 4.5],
  ['badge ember-300 on ember-dim', T.ember300, blend(T.ember500,.14,T.ink1), 4.5],
  ['badge positive on dim', T.positive, blend(T.positive,.14,T.ink1), 4.5],
  ['badge caution on dim', T.caution, blend(T.caution,.14,T.ink1), 4.5],
  ['badge critical-text on dim', T.criticalText, blend(T.critical,.14,T.ink1), 4.5],
  ['badge info on dim', T.info, blend(T.info,.14,T.ink1), 4.5],
  ['error hint critical-text on ink-1', T.criticalText, T.ink1, 4.5],
  ['on-light body on bone-1', T.onLightText, T.bone1, 4.5],
  ['on-light ember-600 (large) on bone-1', T.ember600, T.bone1, 3.0],
];

let fail = 0;
for (const [name, fg, bg, req] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= req;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (need ${req})  ${name}`);
}
console.log(fail ? `\n${fail} pairing(s) FAILED WCAG AA` : '\nAll pairings pass WCAG AA');
process.exit(fail ? 1 : 0);
