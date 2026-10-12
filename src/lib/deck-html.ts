import type { Deck } from './types'
import { SLIDE_LABEL } from './types'
import type { DeckStyle, ResolvedStyle } from './themes'
import type { DeckElement } from './elements'
import type { Branding } from './branding'
import { sanitizeBranding } from './branding'
import { resolveStyle, rootVarsCss, animCss, fontsLink, themeJson } from './themes'

// ─── Builder HTML deck mandiri (full motion) ─────────────────────────────────
// Menghasilkan satu file HTML self-contained: 7 slide 1280×800 dengan tema
// (template gaya desain, font, warna), preset animasi, layer elemen tambahan
// (drag di mode edit), catatan pembicara (N / P), dan mode studio dengan
// klik-teks contenteditable + postMessage ke parent.

export interface BuildOptions {
  studio?: boolean
  style?: Partial<DeckStyle> | null
  elements?: DeckElement[]
  /** logo & ornamen latar kustom user */
  branding?: Branding | null
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function buildDeckHtml(deck: Deck, opts: BuildOptions = {}): string {
  const json = JSON.stringify(deck).replace(/</g, '\\u003c')
  const elements = Array.isArray(opts.elements) ? opts.elements : []
  const elementsJson = JSON.stringify(
    elements.map((e) => ({ id: e.id, slide: e.slide, kind: e.kind, x: e.x, y: e.y, w: e.w, html: e.html })),
  ).replace(/</g, '\\u003c')
  const branding = sanitizeBranding(opts.branding)
  const brandingJson = JSON.stringify(branding).replace(/</g, '\\u003c')
  const studio = !!opts.studio
  const theme: ResolvedStyle = resolveStyle(opts.style)
  const title = esc(deck.identity.title || 'Presentasi')

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${fontsLink(theme.font)}
<style>
:root{
${rootVarsCss(theme)}
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;background:var(--bgBody);overflow:hidden;font-family:var(--fBody)}
#fit{position:fixed;inset:0;display:block;overflow:hidden}
#stage{width:1280px;height:800px;position:absolute;left:0;top:0;background:var(--paper);overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.18);transform-origin:top left}
h1,h2,h3,.num{font-family:var(--fHead)}
.slide{position:absolute;inset:0;opacity:0;visibility:hidden;overflow:hidden}
.slide.active{opacity:1;visibility:visible;z-index:2}
${animCss(theme)}
.pad{position:absolute;inset:0;padding:56px 72px}
.chiphead{display:flex;justify-content:space-between;align-items:center;font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:var(--inkS);opacity:.75;font-weight:600}
.chiphead b{color:var(--teal)}
.h2{font-size:40px;font-weight:900;color:var(--ink);letter-spacing:-.01em}
.h2 em{color:var(--org);font-style:normal}
.sub{font-size:16px;color:var(--inkS);margin-top:6px;font-weight:500}
.rule{width:64px;height:5px;background:var(--org);border-radius:3px;margin-top:14px}
/* dekor & paralaks */
.orb{position:absolute;pointer-events:none;will-change:transform}
/* editables */
.ed{border-radius:6px;transition:box-shadow .15s, background .15s}
body.edit-on .ed{outline:1.5px dashed var(--tealA50);outline-offset:3px;cursor:text}
body.edit-on .ed:hover{background:var(--orgA10);outline-color:var(--org)}
body.edit-on .ed:focus{outline:2px solid var(--org);background:var(--white)}
/* ── slide 1 sampul — latar CERAH, teks gelap agar kontras ── */
.s-cover{background:var(--bgCover)}
.cover-brand{position:absolute;top:52px;left:72px;color:var(--inkS);font-weight:700;letter-spacing:.22em;text-transform:uppercase;font-size:14px}
.cover-brand span{color:var(--org)}
.cover-mid{position:absolute;left:72px;right:340px;top:190px;color:var(--ink)}
.cover-div{font-size:17px;color:var(--teal);font-weight:800;letter-spacing:.1em;margin-bottom:18px}
.cover-title{font-size:84px;line-height:1.02;font-weight:900;letter-spacing:-.015em;min-height:1.02em}
.cover-title .ch{display:inline-block;white-space:pre;animation:none}
.cover-title .accent{color:var(--org)}
.cover-sub{margin-top:26px;font-size:20px;color:var(--inkS);max-width:640px;line-height:1.5;font-weight:500}
.cover-meta{position:absolute;left:72px;bottom:64px;display:flex;gap:14px}
.mchip{background:var(--white);border:1.5px solid var(--tealA45);color:var(--inkS);border-radius:999px;padding:9px 20px;font-size:14px;font-weight:700;letter-spacing:.04em;box-shadow:var(--shadow)}
.mchip.solid{background:var(--teal);border-color:var(--teal);color:#fff}
/* ── slide 2 kpi ── */
.s-kpi{background:var(--bgKpi)}
.kpi-wrap{display:flex;gap:28px;margin-top:44px;height:480px}
.kpi-hero{flex:1.15;background:linear-gradient(160deg,var(--tealHi),var(--teal) 55%,var(--tealD));border-radius:var(--radius);color:#fff;padding:40px 44px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.kpi-hero .lbl{font-size:19px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.95)}
.kpi-hero .num{font-size:128px;font-weight:900;line-height:1;margin:auto 0 8px;letter-spacing:-.02em}
.kpi-hero .suf{font-size:56px;color:var(--orgS);font-weight:900}
.kpi-hero .note{font-size:16.5px;color:rgba(255,255,255,.88);line-height:1.5;font-weight:500;max-width:92%}
.kpi-hero .glow{position:absolute;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,var(--whiteA16),transparent 65%);right:-90px;top:-90px}
.kpi-grid{flex:1.25;display:grid;grid-template-columns:1fr 1fr;gap:22px}
.kpi-card{background:var(--white);border-radius:var(--radiusS);padding:24px 26px;box-shadow:var(--shadow);display:flex;flex-direction:column;border:var(--cardBorder);border-top:5px solid var(--teal)}
.kpi-card:nth-child(2n){border-top-color:var(--org)}
.kpi-card .lbl{font-size:14.5px;font-weight:700;color:var(--inkS);text-transform:uppercase;letter-spacing:.08em}
.kpi-card .num{font-size:52px;font-weight:900;color:var(--ink);margin-top:auto;letter-spacing:-.02em}
.kpi-card .suf{font-size:26px;color:var(--org);font-weight:900}
.kpi-card .note{font-size:13.5px;color:var(--gray);margin-top:8px;line-height:1.45;font-weight:500}
/* ── slide 3 komposisi ── */
.s-comp{background:var(--bgComp)}
.comp-wrap{display:flex;gap:48px;margin-top:26px;align-items:center;height:520px}
.donut-scene{width:480px;height:440px;perspective:1100px;position:relative;flex:none}
.donut-tilt{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(58deg)}
.dlayer{position:absolute;inset:0;transform-style:preserve-3d;pointer-events:none}
.dlayer.top{pointer-events:auto}
.dlayer svg{position:absolute;inset:0;overflow:visible}
.dslice{transition:transform .25s cubic-bezier(.34,1.56,.64,1),filter .2s;cursor:pointer}
.dslice.pop{filter:brightness(1.18) drop-shadow(0 0 18px var(--orgA55))}
.donut-tip{position:absolute;z-index:20;background:var(--ink);color:#fff;border-radius:12px;padding:10px 16px;font-size:15px;font-weight:700;pointer-events:none;opacity:0;transform:translate(-50%,-120%);transition:opacity .15s;white-space:nowrap;box-shadow:0 12px 30px var(--inkA35)}
.donut-tip small{display:block;color:var(--org);font-size:12px;font-weight:600}
.donut-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;z-index:5;pointer-events:none}
.donut-center .v{font-size:56px;font-weight:900;color:var(--ink);font-family:var(--fHead);letter-spacing:-.02em}
.donut-center .l{font-size:14px;font-weight:700;color:var(--inkS);text-transform:uppercase;letter-spacing:.12em;margin-top:2px}
.legend{flex:1;display:flex;flex-direction:column;gap:14px}
.lg-row{background:var(--white);border-radius:var(--radiusS);padding:16px 20px;display:flex;align-items:center;gap:16px;box-shadow:var(--shadow);border:var(--cardBorder);border-left:6px solid var(--teal)}
.lg-dot{width:16px;height:16px;border-radius:50%;flex:none}
.lg-label{font-weight:700;color:var(--ink);font-size:17px;flex:1}
.lg-val{font-family:var(--fHead);font-weight:900;font-size:22px;color:var(--ink)}
.lg-pct{font-size:13.5px;font-weight:700;color:#fff;border-radius:999px;padding:4px 12px;min-width:58px;text-align:center}
/* ── slide 4 tabel+corong ── */
.s-tf{background:var(--bgTf)}
.tf-wrap{display:flex;gap:40px;margin-top:30px;height:500px}
.tbl-box{flex:1.35;background:var(--white);border-radius:var(--radiusS);box-shadow:var(--shadow);border:var(--cardBorder);overflow:hidden;display:flex;flex-direction:column}
table.deck{width:100%;border-collapse:collapse;font-size:15.5px}
table.deck th{background:var(--teal);color:#fff;font-weight:700;padding:15px 18px;text-align:left;font-size:14px;letter-spacing:.05em;text-transform:uppercase}
table.deck td{padding:14px 18px;border-bottom:1px solid var(--line);color:var(--ink);font-weight:600}
table.deck tr:nth-child(even) td{background:var(--zebra)}
table.deck tr:last-child td{border-bottom:none}
td.num,th.num{text-align:right;font-family:var(--fHead);font-weight:800}
.funnel-box{flex:1;display:flex;flex-direction:column}
.funnel{display:flex;flex-direction:column;gap:18px;margin-top:20px}
.fstep{opacity:0;transform:translateX(30px)}
.slide.active .fstep{animation:fslide .6s cubic-bezier(.22,1,.36,1) both}
@keyframes fslide{to{opacity:1;transform:none}}
.flabel{font-size:14.5px;font-weight:700;color:var(--inkS);margin-bottom:6px;display:flex;justify-content:space-between}
.flabel .fv{font-family:var(--fHead);font-weight:900;color:var(--ink);font-size:18px}
.fbar{height:52px;border-radius:12px;display:flex;align-items:center;justify-content:flex-end;padding:0 16px;color:#fff;font-weight:800;font-family:var(--fHead);font-size:17px;width:0;transition:width 1s cubic-bezier(.22,1,.36,1)}
/* ── slide 5 tren ── */
.s-trend{background:var(--bgTrend)}
.trend-wrap{margin-top:20px;height:440px;position:relative}
.chart3d{height:360px;perspective:1050px;display:flex;justify-content:center}
.bars{display:flex;align-items:flex-end;gap:44px;transform-style:preserve-3d;position:relative;padding:0 30px}
.bar3d{position:relative;transform-style:preserve-3d;transform-origin:50% 100%;transform:scaleY(0)}
.slide.active .bar3d{animation:grow .9s cubic-bezier(.22,1,.36,1) both}
@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
.face{position:absolute;left:0;bottom:0}
.face.front{background:linear-gradient(180deg,var(--barFrontA),var(--barFrontB))}
.face.top{background:var(--barTop)}
.face.side{background:var(--barSide)}
.face.left{background:var(--barLeft)}
.bar3d.peak .face.front{background:linear-gradient(180deg,var(--pFrontA),var(--pFrontB))}
.bar3d.peak .face.top{background:var(--pTop)}
.bar3d.peak .face.side{background:var(--pSide)}
.bar3d.peak .face.left{background:var(--pLeft)}
.bval{position:absolute;top:-34px;left:50%;transform:translateZ(20px);font-family:var(--fHead);font-weight:900;font-size:19px;color:var(--ink);white-space:nowrap}
.xlabels{display:flex;justify-content:center;gap:44px;padding:0 30px;margin-top:12px}
.xlabels span{width:76px;text-align:center;font-weight:700;color:var(--inkS);font-size:15px;letter-spacing:.04em}
.trend-insight{margin-top:22px;background:var(--white);border:var(--cardBorder);border-left:6px solid var(--org);border-radius:var(--radiusS);padding:16px 22px;font-size:16px;color:var(--inkS);font-weight:600;box-shadow:var(--shadow);max-width:1136px;margin-left:auto;margin-right:auto;line-height:1.5}
.trend-insight b{color:var(--ink)}
/* ── slide 6 program ── */
.s-prog{background:var(--bgProg)}
.prog-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:34px}
.prog-card{background:var(--white);border-radius:var(--radiusS);padding:26px 30px;box-shadow:var(--shadow);position:relative;border:var(--cardBorder);border-bottom:5px solid var(--teal);opacity:0;transform:translateY(24px)}
.slide.active .prog-card{animation:cardIn .55s cubic-bezier(.22,1,.36,1) both}
.slide.active .prog-card:nth-child(2){animation-delay:.1s}
.slide.active .prog-card:nth-child(3){animation-delay:.2s}
.slide.active .prog-card:nth-child(4){animation-delay:.3s}
@keyframes cardIn{to{opacity:1;transform:none}}
.prog-card:nth-child(2n){border-bottom-color:var(--org)}
.prog-badge{position:absolute;top:22px;right:24px;background:var(--orgS);color:var(--orgDeep);font-weight:800;font-size:13px;border-radius:999px;padding:6px 14px;letter-spacing:.03em}
.prog-name{font-family:var(--fHead);font-weight:900;font-size:25px;color:var(--ink);margin-bottom:10px}
.prog-detail{font-size:15.5px;color:var(--gray);line-height:1.55;font-weight:500;max-width:92%}
/* ── slide poin (bullets) & langkah (steps) ── */
.s-bullets{background:var(--bgProg)}
.s-steps{background:var(--bgTf)}
.bl-wrap{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:34px}
.bl-wrap.single{grid-template-columns:1fr;max-width:1020px}
.bl-card{background:var(--white);border-radius:var(--radiusS);padding:24px 30px;box-shadow:var(--shadow);border:var(--cardBorder);border-left:6px solid var(--teal);opacity:0;transform:translateY(24px)}
.slide.active .bl-card{animation:cardIn .55s cubic-bezier(.22,1,.36,1) both}
.slide.active .bl-card:nth-child(2){animation-delay:.1s}
.slide.active .bl-card:nth-child(3){animation-delay:.2s}
.bl-card:nth-child(2n){border-left-color:var(--org)}
.bl-head{font-family:var(--fHead);font-weight:900;font-size:22px;color:var(--ink);margin-bottom:10px}
.bl-item{position:relative;padding:9px 0 9px 26px;font-size:16px;line-height:1.5;color:var(--inkS);font-weight:600;border-bottom:1px dashed var(--line)}
.bl-item:last-child{border-bottom:none}
.bl-item::before{content:'';position:absolute;left:2px;top:18px;width:9px;height:9px;border-radius:50%;background:var(--org)}
.steps-row{display:flex;gap:22px;margin-top:44px;flex-wrap:wrap}
.step-card{flex:1;min-width:225px;max-width:365px;background:var(--white);border-radius:var(--radiusS);padding:26px 26px 22px;box-shadow:var(--shadow);border:var(--cardBorder);border-top:5px solid var(--org);opacity:0;transform:translateY(24px);position:relative}
.slide.active .step-card{animation:cardIn .55s cubic-bezier(.22,1,.36,1) both}
.slide.active .step-card:nth-child(2){animation-delay:.1s}
.slide.active .step-card:nth-child(3){animation-delay:.2s}
.slide.active .step-card:nth-child(4){animation-delay:.3s}
.slide.active .step-card:nth-child(5){animation-delay:.4s}
.slide.active .step-card:nth-child(6){animation-delay:.5s}
.step-num{font-family:var(--fHead);font-weight:900;font-size:44px;line-height:1;color:var(--tealA45);margin-bottom:12px}
.step-name{font-family:var(--fHead);font-weight:900;font-size:20px;color:var(--ink);margin-bottom:8px}
.step-detail{font-size:14.5px;color:var(--gray);line-height:1.5;font-weight:500}
/* ── slide 7 penutup — latar CERAH, teks gelap ── */
.s-close{background:var(--bgClose);color:var(--ink)}
.close-title{font-size:22px;color:var(--teal);font-weight:800;letter-spacing:.18em;text-transform:uppercase;margin-top:70px}
.close-msg{font-size:52px;font-weight:900;line-height:1.16;max-width:960px;margin-top:22px;font-family:var(--fHead)}
.close-msg em{color:var(--org);font-style:normal}
.close-bullets{display:flex;gap:18px;margin-top:44px;flex-wrap:wrap}
.cbullet{display:flex;align-items:center;gap:12px;background:var(--white);border:1.5px solid var(--tealA45);border-radius:999px;padding:13px 24px;font-weight:700;font-size:17px;color:var(--ink);box-shadow:var(--shadow)}
.cbullet i{width:26px;height:26px;border-radius:50%;background:var(--org);color:#fff;display:flex;align-items:center;justify-content:center;font-style:normal;font-weight:900;font-size:14px;flex:none}
.close-contact{position:absolute;left:72px;bottom:56px;color:var(--inkS);font-size:15.5px;font-weight:600;letter-spacing:.03em}
.close-num{position:absolute;right:72px;bottom:52px;font-family:var(--fHead);font-weight:900;font-size:88px;color:var(--tealA16)}
/* ── elemen tambahan ── */
.el-card{background:var(--white);border-radius:var(--radiusS);box-shadow:var(--shadow);border:var(--cardBorder)}
.el-acc{border-left:6px solid var(--org)}
.elem{position:absolute;pointer-events:none;z-index:8}
.elem-tag{position:absolute;top:-20px;left:0;background:var(--org);color:#fff;font-size:10px;font-weight:800;padding:2px 8px;border-radius:6px;letter-spacing:.06em;display:none;text-transform:uppercase;pointer-events:none;z-index:2}
/* logo & ornamen kustom (Task 17) */
.brand-logo{position:absolute;z-index:26;pointer-events:none;line-height:0}
.brand-logo img{width:100%;height:auto;display:block}
.brand-orn{position:absolute;pointer-events:none;line-height:0}
.brand-orn.behind{z-index:0}
.brand-orn.front{z-index:24}
.brand-orn img,.brand-orn video{width:100%;height:auto;display:block}
.brand-orn.full{left:0!important;top:0!important;transform:none!important;width:100%!important;height:100%}
.brand-orn.full img,.brand-orn.full video{width:100%;height:100%;object-fit:cover}
body.edit-on .elem{pointer-events:auto;cursor:grab;outline:1.5px dashed var(--org);outline-offset:3px;border-radius:6px}
body.edit-on .elem:hover{background:var(--orgA06)}
body.edit-on .elem:hover .elem-tag{display:block}
body.edit-on .elem:active{cursor:grabbing}
/* ── motif sampul per template ── */
${coverMotifCss(theme)}
/* ── UI navigasi & catatan ── */
#hud{position:absolute;right:26px;bottom:22px;display:flex;align-items:center;gap:14px;z-index:30}
#dots{display:flex;gap:8px}
.dot{width:10px;height:10px;border-radius:50%;background:var(--dot);cursor:pointer;transition:all .2s;border:none;padding:0}
.dot.on{background:var(--org);width:26px;border-radius:6px}
.nbtn{width:42px;height:42px;border-radius:12px;border:1.5px solid var(--line);background:var(--white);color:var(--ink);font-size:18px;cursor:pointer;font-weight:800;transition:all .15s;font-family:inherit}
.nbtn:hover{border-color:var(--org);color:var(--org);transform:translateY(-2px)}
#notesPanel{position:absolute;left:0;right:0;bottom:0;height:34%;background:var(--white);color:var(--inkS);z-index:40;transform:translateY(105%);transition:transform .3s cubic-bezier(.22,1,.36,1);display:flex;flex-direction:column;padding:20px 56px 18px;box-shadow:0 -18px 50px var(--inkA14);border-top:4px solid var(--teal)}
#notesPanel.open{transform:none}
#notesPanel h3{font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:var(--teal);margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}
#notesPanel h3 button{background:none;border:none;color:var(--inkS);font-size:18px;cursor:pointer}
#notesText{overflow-y:auto;font-size:16.5px;line-height:1.75;color:var(--inkS);font-weight:500;white-space:pre-wrap}
#presenter{position:fixed;inset:0;background:var(--white);z-index:60;display:none;align-items:center;justify-content:center;padding:80px}
#presenter.open{display:flex}
#presenter .inner{max-width:1100px;font-size:32px;line-height:1.7;color:var(--ink);font-weight:600;white-space:pre-wrap}
#presenter .tag{position:absolute;top:34px;left:44px;color:var(--org);letter-spacing:.2em;font-weight:800;font-size:14px;text-transform:uppercase}
#presenter .hint{position:absolute;bottom:28px;left:44px;color:var(--inkA35);font-size:13px}
::-webkit-scrollbar{width:10px;height:10px}
::-webkit-scrollbar-thumb{background:var(--inkS);border-radius:8px}
::-webkit-scrollbar-track{background:transparent}
</style>
</head>
<body>
<script type="application/json" id="deck-data">${json}</script>
<script type="application/json" id="elements-data">${elementsJson}</script>
<div id="fit"><div id="stage">${theme.anim.seam ? '<div id="seamline"></div>' : ''}</div></div>
<div id="presenter"><div class="tag">Catatan Pembicara</div><div class="inner" id="presenterText"></div><div class="hint">Esc / klik untuk menutup</div></div>
<script>
(function(){
'use strict';
var DECK = JSON.parse(document.getElementById('deck-data').textContent);
var ELEMENTS = JSON.parse(document.getElementById('elements-data').textContent);
var BRANDING = ${brandingJson};
var THEME = ${themeJson(theme)};
var STUDIO = ${studio ? 'true' : 'false'};
var EDIT = false;
var IDX = 0;
var KIND_LABELS = ${JSON.stringify(SLIDE_LABEL)};
var SLIDES = DECK.slides;
var COLORS = THEME.slices;
var stage = document.getElementById('stage');
function fmt(n,d){ return Number(n).toLocaleString('id-ID',{minimumFractionDigits:d||0,maximumFractionDigits:(d===undefined?0:d)}); }
function el(tag,cls,txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!==undefined&&txt!==null) e.textContent=txt; return e; }
function pad2(n){ return (n<10?'0':'')+n; }
function escH(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function accentTitle(t){ var p=String(t||'').trim().split(/\\s+/); if(p.length<2) return escH(p[0]||''); var last=p.pop(); return escH(p.join(' '))+' <em>'+escH(last)+'</em>'; }
function sLabel(i){ var k=SLIDES[i]&&SLIDES[i].kind; return KIND_LABELS[k]||k||('Slide '+(i+1)); }

// ---------- fit to viewport ----------
function fit(){
  var s=Math.min(window.innerWidth/1280,window.innerHeight/800);
  var x=(window.innerWidth-1280*s)/2, y=(window.innerHeight-800*s)/2;
  stage.style.transform='translate('+x+'px,'+y+'px) scale('+s+')';
}
window.addEventListener('resize',fit); fit();
var fitN=0; (function fitRaf(){ fit(); if(++fitN<120) requestAnimationFrame(fitRaf); })();
if(typeof ResizeObserver!=='undefined'){ try{ new ResizeObserver(fit).observe(document.documentElement); }catch(e){} }

// ---------- helper edit ----------
function ed(node,path,type,extra){
  node.classList.add('ed');
  node.setAttribute('data-edit',path);
  if(type) node.setAttribute('data-type',type);
  if(extra) for(var k in extra) node.setAttribute('data-'+k,extra[k]);
  return node;
}

// ---------- SLIDE BUILDERS ----------
function baseSlide(slide,idx){
  var total=SLIDES.length;
  var s=el('section','slide s-'+slide.kind); s.dataset.key=slide.id;
  var pad=el('div','pad');
  var head=el('div','chiphead');
  var hl=el('div'); hl.textContent=DECK.identity.org+'  ·  '+DECK.identity.division+'  ·  '+DECK.identity.period;
  var hr=el('div',null,pad2(idx+1)+' / '+pad2(total)+' — '+(KIND_LABELS[slide.kind]||slide.kind));
  head.appendChild(hl); head.appendChild(hr); pad.appendChild(head);
  return {slide:s,pad:pad};
}

function titleBlock(pad,titleHtml,sub,rul){
  var h2=el('h2','h2'); h2.innerHTML=titleHtml; pad.appendChild(h2);
  if(sub){ var sp=el('p','sub'); sp.textContent=sub; pad.appendChild(sp); }
  pad.appendChild(el('div','rule'));
}

// 1 — sampul
function slideCover(slide,idx){
  var b=baseSlide(slide,idx);
  coverMotif(b.slide);
  var brand=el('div','cover-brand'); var bo=ed(el('span',null,DECK.identity.org),'identity.org'); var bs=el('span',null,' · '); var bd=ed(el('span',null,DECK.identity.division),'identity.division');
  brand.appendChild(bo); brand.appendChild(bs); brand.appendChild(bd); b.slide.appendChild(brand);
  var mid=el('div','cover-mid');
  var div=el('div','cover-div'); div.textContent=DECK.identity.period; ed(div,'identity.period'); mid.appendChild(div);
  var t=el('h1','cover-title');
  var titleLen=String(DECK.identity.title).length;
  if(titleLen>34){ t.style.fontSize='46px'; }
  else if(titleLen>22){ t.style.fontSize='58px'; }
  else if(titleLen>14){ t.style.fontSize='72px'; }
  var words=String(DECK.identity.title).split(' ');
  words.forEach(function(w,wi){
    var ws=el('span'); ws.style.display='inline-block'; ws.style.whiteSpace='nowrap';
    if(wi===words.length-1 && words.length>1){ ws.classList.add('accent'); }
    String(w).split('').forEach(function(ch,ci){
      var c=el('span','ch',ch); c.style.animationDelay=((wi*4+ci)*THEME.charDelay)+'s'; ws.appendChild(c);
    });
    t.appendChild(ws);
    if(wi<words.length-1){ var sp=el('span','ch',' '); sp.style.animationDelay=((wi*4+w.length)*THEME.charDelay)+'s'; t.appendChild(sp); }
  });
  t.setAttribute('data-edit','identity.title'); t.setAttribute('data-plain','1'); t.classList.add('ed');
  mid.appendChild(t);
  var sub=el('p','cover-sub'); sub.textContent=DECK.identity.subtitle; ed(sub,'identity.subtitle'); mid.appendChild(sub);
  b.slide.appendChild(mid);
  var meta=el('div','cover-meta');
  var m1=el('div','mchip solid'); m1.textContent=DECK.identity.period; ed(m1,'identity.period');
  var m2=el('div','mchip'); m2.textContent=DECK.identity.date; ed(m2,'identity.date');
  meta.appendChild(m1); meta.appendChild(m2); b.slide.appendChild(meta);
  deco(b.slide,false);
  return b.slide;
}

// 2 — kpi
function slideKpi(slide,idx){
  var b=baseSlide(slide,idx);
  titleBlock(b.pad,accentTitle(slide.title||'Empat Angka Kunci'),slide.subtitle||'Ringkasan capaian utama — detail deskripsi disampaikan lisan oleh pemateri');
  var P='slides.'+idx+'.';
  var kpis=(slide.kpis&&slide.kpis.length?slide.kpis:[{label:'KPI',value:0,suffix:'',decimals:0,note:''}]);
  var wrap=el('div','kpi-wrap');
  var k0=kpis[0];
  var hero=el('div','kpi-hero'); hero.appendChild(el('div','glow'));
  var hl=el('div','lbl'); hl.textContent=k0.label; ed(hl,P+'kpis.0.label'); hero.appendChild(hl);
  var hn=el('div','num'); countSpan(hn,P+'kpis.0.value',k0.value,k0.decimals); hero.appendChild(hn);
  var hnote=el('div','note'); hnote.textContent=k0.note; ed(hnote,P+'kpis.0.note'); hero.appendChild(hnote);
  wrap.appendChild(hero);
  var grid=el('div','kpi-grid');
  kpis.slice(1,5).forEach(function(k,i){
    var c=el('div','kpi-card');
    var l=el('div','lbl'); l.textContent=k.label; ed(l,P+'kpis.'+(i+1)+'.label'); c.appendChild(l);
    var n=el('div','num'); countSpan(n,P+'kpis.'+(i+1)+'.value',k.value,k.decimals); c.appendChild(n);
    var nt=el('div','note'); nt.textContent=k.note; ed(nt,P+'kpis.'+(i+1)+'.note'); c.appendChild(nt);
    grid.appendChild(c);
  });
  wrap.appendChild(grid); b.pad.appendChild(wrap);
  b.slide.appendChild(b.pad);
  return b.slide;
}
function countSpan(host,path,value,decimals){
  var v=ed(el('span',null,fmt(value,decimals)),path,'number',{value:String(value),decimals:String(decimals)});
  v.setAttribute('data-count','1');
  host.appendChild(v);
  if(value<0){ host.insertBefore(document.createTextNode('-'),v); }
  return v;
}

// 3 — komposisi donat 3D
function slideComp(slide,idx){
  var b=baseSlide(slide,idx);
  titleBlock(b.pad,accentTitle(slide.title||'Komposisi Per Kategori'),slide.subtitle||'Arahkan kursor ke bagian donat — detail angka dijelaskan lisan');
  var P='slides.'+idx+'.';
  var wrap=el('div','comp-wrap');
  var scene=el('div','donut-scene');
  var tilt=el('div','donut-tilt');
  var tip=el('div','donut-tip'); scene.appendChild(tip);
  var slices=(slide.slices&&slide.slices.length?slide.slices:[{label:'A',value:60},{label:'B',value:40}]);
  var total=slices.reduce(function(a,s){return a+s.value;},0)||1;
  var LAYERS=13, GAP=1.6;
  function arcPath(a0,a1){
    var cx=240,cy=240,R=192,r=118;
    var rad=function(a){return (a-90)*Math.PI/180;};
    var x0=cx+R*Math.cos(rad(a0)),y0=cy+R*Math.sin(rad(a0));
    var x1=cx+R*Math.cos(rad(a1)),y1=cy+R*Math.sin(rad(a1));
    var x2=cx+r*Math.cos(rad(a1)),y2=cy+r*Math.sin(rad(a1));
    var x3=cx+r*Math.cos(rad(a0)),y3=cy+r*Math.sin(rad(a0));
    var lg=(a1-a0)>180?1:0;
    return 'M'+x0+' '+y0+' A'+R+' '+R+' 0 '+lg+' 1 '+x1+' '+y1+' L'+x2+' '+y2+' A'+r+' '+r+' 0 '+lg+' 0 '+x3+' '+y3+' Z';
  }
  var segs=[]; var ang=0;
  slices.forEach(function(s,i){
    var sweep=s.value/total*360; var a0=ang+GAP/2, a1=ang+sweep-GAP/2; ang+=sweep;
    segs.push({i:i,a0:a0,a1:Math.max(a1,a0+0.5),color:COLORS[i%COLORS.length],mid:(a0+a1)/2,label:s.label,value:s.value});
  });
  for(var l=0;l<LAYERS;l++){
    var layer=el('div','dlayer'+(l===LAYERS-1?' top':''));
    layer.style.transform='translateZ('+((l-(LAYERS-1)/2)*7)+'px)';
    var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 480 480'); svg.setAttribute('width','480'); svg.setAttribute('height','480');
    segs.forEach(function(sg){
      var p=document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('d',arcPath(sg.a0,sg.a1)); p.setAttribute('fill',sg.color);
      p.setAttribute('class','dslice'); p.setAttribute('data-slice',String(sg.i));
      if(l===LAYERS-1){
        p.addEventListener('mouseenter',function(ev){ popSlice(sg.i,true,sg,ev); });
        p.addEventListener('mousemove',function(ev){ moveTip(ev,sg,slices); });
        p.addEventListener('mouseleave',function(){ popSlice(sg.i,false,sg,null); });
      }
      svg.appendChild(p);
    });
    layer.appendChild(svg); tilt.appendChild(layer);
  }
  scene.appendChild(tilt);
  var center=el('div','donut-center');
  var cv=el('div','v'); cv.textContent=slide.centerValue||String(total); ed(cv,P+'centerValue'); center.appendChild(cv);
  var cl=el('div','l'); cl.textContent=slide.centerLabel||'Total'; ed(cl,P+'centerLabel'); center.appendChild(cl);
  scene.appendChild(center);
  wrap.appendChild(scene);
  var legend=el('div','legend');
  slices.forEach(function(s,i){
    var row=el('div','lg-row'); row.style.borderLeftColor=COLORS[i%COLORS.length];
    var dot=el('div','lg-dot'); dot.style.background=COLORS[i%COLORS.length]; row.appendChild(dot);
    var lb=el('div','lg-label'); lb.textContent=s.label; ed(lb,P+'slices.'+i+'.label'); row.appendChild(lb);
    var vv=el('div','lg-val'); vv.textContent=fmt(s.value,0); ed(vv,P+'slices.'+i+'.value','number',{value:String(s.value),decimals:'0'}); row.appendChild(vv);
    var pc=el('div','lg-pct'); pc.style.background=COLORS[i%COLORS.length]; pc.textContent=(s.value/total*100).toFixed(1).replace('.',',')+'%'; row.appendChild(pc);
    legend.appendChild(row);
  });
  wrap.appendChild(legend); b.pad.appendChild(wrap);
  b.slide.appendChild(b.pad);
  return b.slide;
}
function popSlice(idx,on,sg,ev){
  var all=document.querySelectorAll('.dslice[data-slice="'+idx+'"]');
  for(var i=0;i<all.length;i++){
    if(on){ all[i].classList.add('pop'); var dx=Math.cos((sg.mid-90)*Math.PI/180)*16, dy=Math.sin((sg.mid-90)*Math.PI/180)*16; all[i].style.transform='translate('+dx+'px,'+dy+'px)'; }
    else { all[i].classList.remove('pop'); all[i].style.transform=''; }
  }
  var tip=document.querySelector('.donut-tip');
  if(on){ tip.style.opacity='1'; } else { tip.style.opacity='0'; }
}
function moveTip(ev,sg,slices){
  var scene=document.querySelector('.donut-scene'); var tip=document.querySelector('.donut-tip');
  var r=scene.getBoundingClientRect(); var sc=r.width/480;
  var x=(ev.clientX-r.left)/sc + 18, y=(ev.clientY-r.top)/sc;
  tip.style.left=Math.min(x,430)+'px'; tip.style.top=Math.max(y,70)+'px';
  var total=slices.reduce(function(a,s){return a+s.value;},0)||1;
  tip.innerHTML='';
  var t1=document.createTextNode(sg.label+' — '+fmt(sg.value,0)); tip.appendChild(t1);
  var sm=el('small',null,(sg.value/total*100).toFixed(1).replace('.',',')+' dari total');
  tip.appendChild(sm);
}

// 4 — tabel + corong
function slideTF(slide,idx){
  var b=baseSlide(slide,idx);
  var P='slides.'+idx+'.';
  titleBlock(b.pad,accentTitle(slide.title||'Tabel & Corong'),slide.subtitle||'Kiri: tabel rinci — Kanan: alur konversi besar');
  var cols=(slide.columns&&slide.columns.length?slide.columns:['Kolom 1','Kolom 2']);
  var rows=(slide.rows&&slide.rows.length?slide.rows:[['—','—']]);
  var funnel=(slide.funnel&&slide.funnel.length?slide.funnel:[]);
  var wrap=el('div','tf-wrap');
  var tbox=el('div','tbl-box');
  var tbl=el('table','deck');
  var thead=el('thead'); var trh=el('tr');
  cols.forEach(function(c,ci){
    var th=el('th',ci>0?'num':null,c); ed(th,P+'columns.'+ci); trh.appendChild(th);
  });
  thead.appendChild(trh); tbl.appendChild(thead);
  var tbody=el('tbody');
  rows.forEach(function(row,ri){
    var tr=el('tr');
    cols.forEach(function(_,ci){
      var td=el('td',ci>0?'num':null,(row[ci]!==undefined?row[ci]:'—')); ed(td,P+'rows.'+ri+'.'+ci); tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody); tbox.appendChild(tbl); wrap.appendChild(tbox);
  var fbox=el('div','funnel-box');
  var ft=el('h3','h2'); ft.style.fontSize='26px'; ft.textContent=slide.funnelTitle||'Corong Konversi'; ed(ft,P+'funnelTitle'); fbox.appendChild(ft);
  var fl=el('div','funnel'); var maxF=Math.max.apply(null,funnel.map(function(f){return f.value;}).concat([1]));
  var grads=['var(--funnel1)','var(--funnel2)','var(--funnel3)','var(--funnel4)'];
  funnel.forEach(function(f,fi){
    var step=el('div','fstep'); step.style.animationDelay=(0.15+fi*0.14)+'s';
    var lab=el('div','flabel'); var lt=el('span',null,''); lt.textContent=f.label; ed(lt,P+'funnel.'+fi+'.label');
    var lv=el('span','fv'); lv.textContent=fmt(f.value,0); ed(lv,P+'funnel.'+fi+'.value','number',{value:String(f.value),decimals:'0'});
    lab.appendChild(lt); lab.appendChild(lv); step.appendChild(lab);
    var bar=el('div','fbar'); bar.style.background=grads[fi%grads.length];
    bar.textContent=(f.value/maxF*100).toFixed(0)+'% dari tahap 1';
    fl.appendChild(step);
    requestAnimationFrame(function(){ setTimeout(function(){ bar.style.width=Math.max(f.value/maxF*100,8)+'%'; },80); });
    step.appendChild(bar);
  });
  fbox.appendChild(fl); wrap.appendChild(fbox);
  b.pad.appendChild(wrap); b.slide.appendChild(b.pad);
  return b.slide;
}

// 5 — tren batang 3D
function slideTrend(slide,idx){
  var b=baseSlide(slide,idx);
  var P='slides.'+idx+'.';
  titleBlock(b.pad,accentTitle(slide.title||'Tren Per Periode'),(slide.subtitle||'')+' — tahan & geser untuk memutar grafik');
  var wrap=el('div','trend-wrap');
  var chart=el('div','chart3d');
  var bars=el('div','bars');
  var pts=(slide.points&&slide.points.length>=2?slide.points:[{label:'P1',value:40},{label:'P2',value:70},{label:'P3',value:55}]); var maxV=Math.max.apply(null,pts.map(function(p){return p.value;}).concat([1]));
  var peakIdx=pts.reduce(function(a,p,i){return p.value>pts[a].value?i:a;},0);
  var D=30, BW=64, HMAX=250;
  pts.forEach(function(p,i){
    var h=Math.max(p.value/maxV*HMAX,26);
    var bar=el('div','bar3d'+(i===peakIdx?' peak':''));
    bar.style.width=BW+'px'; bar.style.height=h+'px';
    bar.style.animationDelay=(0.12+i*0.09)+'s';
    function face(cls,css){ var f=el('div','face '+cls); f.setAttribute('style',css); bar.appendChild(f); }
    face('front','width:'+BW+'px;height:'+h+'px;transform:translateZ('+(D/2)+'px);');
    face('back','width:'+BW+'px;height:'+h+'px;transform:translateZ(-'+(D/2)+'px);');
    face('top','width:'+BW+'px;height:'+D+'px;bottom:auto;top:-'+(D/2)+'px;transform:rotateX(90deg);');
    face('side','width:'+D+'px;height:'+h+'px;left:auto;right:-'+(D/2)+'px;bottom:0;top:auto;transform:rotateY(90deg);');
    face('left','width:'+D+'px;height:'+h+'px;right:auto;left:-'+(D/2)+'px;bottom:0;top:auto;transform:rotateY(-90deg);');
    var val=el('div','bval'); val.textContent=fmt(p.value,0); ed(val,P+'points.'+i+'.value','number',{value:String(p.value),decimals:'0'}); bar.appendChild(val);
    bars.appendChild(bar);
  });
  chart.appendChild(bars); wrap.appendChild(chart);
  var xl=el('div','xlabels');
  pts.forEach(function(p,i){ var s=el('span',null,p.label); ed(s,P+'points.'+i+'.label'); xl.appendChild(s); });
  wrap.appendChild(xl);
  var ins=el('div','trend-insight'); ins.textContent=''; var bi=el('b',null,'Insight: '); ins.appendChild(bi); ins.appendChild(document.createTextNode(slide.insight||'')); ed(ins,P+'insight'); wrap.appendChild(ins);
  b.pad.appendChild(wrap); b.slide.appendChild(b.pad);
  var rx=10,ry=-16,drag=false,sx=0,sy=0;
  function apply(){ bars.style.transform='rotateX('+rx+'deg) rotateY('+ry+'deg)'; }
  apply();
  chart.addEventListener('pointerdown',function(e){drag=true;sx=e.clientX;sy=e.clientY;chart.setPointerCapture(e.pointerId);});
  chart.addEventListener('pointermove',function(e){ if(!drag)return; ry=Math.max(-46,Math.min(46,ry+(e.clientX-sx)*0.25)); rx=Math.max(2,Math.min(30,rx-(e.clientY-sy)*0.15)); sx=e.clientX;sy=e.clientY; apply(); });
  ['pointerup','pointercancel','pointerleave'].forEach(function(t){ chart.addEventListener(t,function(){drag=false;}); });
  return b.slide;
}

// 6 — program kerja / kartu kegiatan
function slideProg(slide,idx){
  var b=baseSlide(slide,idx);
  var P='slides.'+idx+'.';
  titleBlock(b.pad,accentTitle(slide.title||'Program Kerja'),slide.subtitle||'Judul program di layar — cerita & indikator disampaikan lisan');
  var items=(slide.items&&slide.items.length?slide.items:[]);
  var grid=el('div','prog-grid');
  items.forEach(function(p,i){
    var c=el('div','prog-card');
    if(p.badge){ var bd=el('div','prog-badge'); bd.textContent=p.badge; ed(bd,P+'items.'+i+'.badge'); c.appendChild(bd); }
    var nm=el('div','prog-name'); nm.textContent=p.name; ed(nm,P+'items.'+i+'.name'); c.appendChild(nm);
    var dt=el('div','prog-detail'); dt.textContent=p.detail; ed(dt,P+'items.'+i+'.detail'); c.appendChild(dt);
    grid.appendChild(c);
  });
  b.pad.appendChild(grid); b.slide.appendChild(b.pad);
  return b.slide;
}

// 6b — poin per kategori (bullets)
function slideBullets(slide,idx){
  var b=baseSlide(slide,idx);
  var P='slides.'+idx+'.';
  titleBlock(b.pad,accentTitle(slide.title||'Poin Utama'),slide.subtitle||'Kerangka poin — detail dan konteks disampaikan lisan');
  var groups=(slide.groups&&slide.groups.length?slide.groups:[{heading:'Poin',items:['—']}]);
  var wrap=el('div','bl-wrap'+(groups.length===1?' single':''));
  groups.forEach(function(g,gi){
    var c=el('div','bl-card');
    var h=el('div','bl-head'); h.textContent=g.heading||('Kelompok '+(gi+1)); ed(h,P+'groups.'+gi+'.heading'); c.appendChild(h);
    var items=(g.items&&g.items.length?g.items:['—']);
    items.slice(0,8).forEach(function(it,ii){
      var row=el('div','bl-item'); row.textContent=it; ed(row,P+'groups.'+gi+'.items.'+ii); c.appendChild(row);
    });
    wrap.appendChild(c);
  });
  b.pad.appendChild(wrap); b.slide.appendChild(b.pad);
  return b.slide;
}

// 6c — langkah bernomor (steps)
function slideSteps(slide,idx){
  var b=baseSlide(slide,idx);
  var P='slides.'+idx+'.';
  titleBlock(b.pad,accentTitle(slide.title||'Langkah Perbaikan'),slide.subtitle||'Urutan tindak lanjut — penjelasan per langkah disampaikan lisan');
  var items=(slide.items&&slide.items.length?slide.items:[]);
  var row=el('div','steps-row');
  items.forEach(function(p,i){
    var c=el('div','step-card');
    var n=el('div','step-num',pad2(i+1)); c.appendChild(n);
    var nm=el('div','step-name'); nm.textContent=p.name; ed(nm,P+'items.'+i+'.name'); c.appendChild(nm);
    var dt=el('div','step-detail'); dt.textContent=p.detail; ed(dt,P+'items.'+i+'.detail'); c.appendChild(dt);
    row.appendChild(c);
  });
  b.pad.appendChild(row); b.slide.appendChild(b.pad);
  return b.slide;
}

// 7 — penutup
function slideClose(slide,idx){
  var b=baseSlide(slide,idx);
  var P='slides.'+idx+'.';
  var t=el('div','close-title'); t.textContent=slide.title||'Terima Kasih'; ed(t,P+'title'); b.pad.appendChild(t);
  var m=el('div','close-msg'); var parts=String(slide.message||'').split(/([—–])/);
  if(parts.length>1){ m.appendChild(document.createTextNode(parts[0])); var em=el('em',null,parts[1]); m.appendChild(em); m.appendChild(document.createTextNode(parts.slice(2).join(''))); }
  else { m.textContent=slide.message; }
  ed(m,P+'message'); b.pad.appendChild(m);
  var bu=el('div','close-bullets');
  (slide.bullets&&slide.bullets.length?slide.bullets:[]).forEach(function(bl,i){
    var c=el('div','cbullet'); var ic=el('i',null,String(i+1)); c.appendChild(ic); c.appendChild(document.createTextNode(bl)); ed(c,P+'bullets.'+i); bu.appendChild(c);
  });
  b.pad.appendChild(bu);
  var ct=el('div','close-contact'); ct.textContent=slide.contact; ed(ct,P+'contact'); b.pad.appendChild(ct);
  var num=el('div','close-num'); num.textContent=pad2(SLIDES.length); b.pad.appendChild(num);
  deco(b.slide,false);
  b.slide.appendChild(b.pad);
  return b.slide;
}

// ---------- dekor per tema ----------
function deco(slide,dark){
  var items;
  if(THEME.decor==='blobs'){
    items=[
      ['300px',26,'var(--tealA10)','70%','-8%','47% 53% 60% 40% / 55% 45% 55% 45%'],
      ['220px',18,'var(--orgA16)','-6%','62%','60% 40% 45% 55% / 50% 60% 40% 50%'],
      ['160px',10,'var(--tealA28)','24%','74%','55% 45% 60% 40% / 45% 55% 45% 55%'],
    ];
    items.forEach(function(o){
      var b=el('div','orb'); b.style.width=o[0]; b.style.height=o[0];
      b.style.background=o[2]; b.style.left=o[3]; b.style.top=o[4];
      b.style.borderRadius=o[5]; b.setAttribute('data-depth',String(o[1]));
      slide.appendChild(b);
    });
    return;
  }
  if(THEME.decor==='rings'){
    items=[
      ['180px',30,'78%','10%','var(--tealA25)'],
      ['300px',18,'68%','2%','var(--tealA16)'],
      ['120px',12,'8%','64%','var(--orgA40)'],
    ];
    items.forEach(function(o){
      var rg=el('div','orb'); rg.style.width=o[0]; rg.style.height=o[0];
      rg.style.borderRadius='50%'; rg.style.border='2px solid '+o[4];
      rg.style.left=o[2]; rg.style.top=o[3]; rg.setAttribute('data-depth',String(o[1]));
      slide.appendChild(rg);
    });
    return;
  }
  if(THEME.decor==='dots'){
    var patch=el('div','orb');
    patch.style.width='380px'; patch.style.height='380px'; patch.style.right='4%'; patch.style.top='6%';
    patch.style.backgroundImage='radial-gradient('+(dark?'var(--mintA12)':'var(--inkA06)')+' 1.6px,transparent 1.7px)';
    patch.style.backgroundSize='18px 18px'; patch.setAttribute('data-depth','16');
    slide.appendChild(patch);
    var orb2=el('div','orb'); orb2.style.width='90px'; orb2.style.height='90px';
    orb2.style.borderRadius='50%'; orb2.style.left='10%'; orb2.style.bottom='12%';
    orb2.style.background='radial-gradient(circle at 35% 35%, var(--orgA40), transparent 70%)';
    orb2.setAttribute('data-depth','24');
    slide.appendChild(orb2);
    return;
  }
  if(THEME.decor==='grid'){
    var g=el('div','orb');
    g.style.width='480px'; g.style.height='480px'; g.style.right='2%'; g.style.top='2%';
    var gc=dark?'var(--mintA12)':'var(--inkA06)';
    g.style.backgroundImage='repeating-linear-gradient(0deg,'+gc+' 0 1px,transparent 1px 40px),repeating-linear-gradient(90deg,'+gc+' 0 1px,transparent 1px 40px)';
    g.setAttribute('data-depth','12');
    slide.appendChild(g);
    var orb3=el('div','orb'); orb3.style.width='70px'; orb3.style.height='70px';
    orb3.style.borderRadius='50%'; orb3.style.left='12%'; orb3.style.top='16%';
    orb3.style.background='radial-gradient(circle at 35% 35%, var(--tealA28), transparent 70%)';
    orb3.setAttribute('data-depth','22');
    slide.appendChild(orb3);
    return;
  }
  if(THEME.decor==='glass'){
    // Bento Glassmorphism — modul kaca blur
    var tiles=[
      ['240px','150px','74%','9%','18'],
      ['170px','170px','10%','56%','26'],
      ['250px','110px','76%','68%','14'],
      ['110px','110px','12%','14%','22'],
    ];
    tiles.forEach(function(t){
      var b=el('div','orb glass-tile');
      b.style.width=t[0]; b.style.height=t[1];
      b.style.left=t[2]; b.style.top=t[3];
      b.style.borderRadius='22px';
      b.style.background=dark?'linear-gradient(135deg,rgba(255,255,255,.12),rgba(255,255,255,.03))':'var(--tealA06)';
      b.style.border='1px solid '+(dark?'rgba(255,255,255,.20)':'var(--tealA28)');
      b.style.backdropFilter='blur(5px)'; b.style.webkitBackdropFilter='blur(5px)';
      b.style.boxShadow=dark?'0 12px 34px rgba(0,0,0,.18)':'none';
      b.setAttribute('data-depth',t[4]);
      slide.appendChild(b);
    });
    return;
  }
  if(THEME.decor==='beams'){
    // Cinematic — balok cahaya vertikal
    var beams=[
      ['9%','0%','110px','18'],
      ['40%','10%','56px','10'],
      ['78%','22%','150px','24'],
      ['60%','64%','70px','12'],
    ];
    beams.forEach(function(bm){
      var b=el('div','orb');
      b.style.left=bm[0]; b.style.top=bm[1];
      b.style.width='46px'; b.style.height=bm[2];
      b.style.background='linear-gradient(180deg,'+(dark?'var(--tealA28)':'var(--tealA16)')+',transparent 85%)';
      b.style.filter='blur(2px)';
      b.setAttribute('data-depth',bm[3]);
      slide.appendChild(b);
    });
    return;
  }
  if(THEME.decor==='pop'){
    // Neo-Brutalism — bentuk berani berborder tebal (rotasi di anak elemen agar paralaks tetap jalan)
    var pops=[
      ['130px','10%','12%','circle','var(--orgS)','16'],
      ['110px','78%','58%','square','var(--org)','26','9deg'],
      ['80px','66%','16%','circle','var(--tealHi)','20'],
      ['150px','6%','70%','square','var(--tealS)','12','-7deg'],
    ];
    pops.forEach(function(sp){
      var p=el('div','orb');
      p.style.left=sp[1]; p.style.top=sp[2];
      p.style.width=sp[0]; p.style.height=sp[0];
      p.setAttribute('data-depth',sp[5]);
      var ch=document.createElement('div');
      ch.style.width='100%'; ch.style.height='100%';
      ch.style.background=sp[4];
      ch.style.border='3.5px solid var(--ink)';
      ch.style.borderRadius=sp[3]==='circle'?'50%':'14px';
      ch.style.boxShadow='5px 5px 0 var(--inkA85)';
      if(sp[6]) ch.style.transform='rotate('+sp[6]+')';
      p.appendChild(ch);
      slide.appendChild(p);
    });
    return;
  }
  if(THEME.decor==='lines'){
    // Editorial — garis rambut tipis & bar aksen
    var ys=['7%','30%','82%'];
    ys.forEach(function(y,i){
      var ln=el('div','orb');
      ln.style.left='4%'; ln.style.width='92%';
      ln.style.top=y; ln.style.height='1px';
      ln.style.background=i===1?'transparent':'var(--inkA14)';
      if(i===1){ ln.style.height='5px'; ln.style.width='120px'; ln.style.background='var(--org)'; }
      ln.setAttribute('data-depth',String(6+i*3));
      slide.appendChild(ln);
    });
    var ed=el('div','orb');
    ed.style.right='4%'; ed.style.bottom='5%'; ed.style.width='auto'; ed.style.height='auto';
    ed.textContent='№ 07';
    ed.style.fontFamily='var(--fHead)'; ed.style.fontSize='15px'; ed.style.letterSpacing='.2em';
    ed.style.color='var(--inkA35)';
    ed.setAttribute('data-depth','8');
    slide.appendChild(ed);
    return;
  }
  if(THEME.decor==='glow'){
    // Data Glow 3D — orb neon & horizon grid perspektif
    var gl=[
      ['190px','74%','54%','20','var(--tealA45)'],
      ['120px','8%','14%','16','var(--mintA50)'],
      ['90px','84%','12%','24','var(--orgA55)'],
    ];
    gl.forEach(function(gv){
      var b=el('div','orb');
      b.style.width=gv[0]; b.style.height=gv[0];
      b.style.left=gv[1]; b.style.top=gv[2];
      b.style.borderRadius='50%';
      b.style.background='radial-gradient(circle at 38% 34%,'+gv[4]+',transparent 66%)';
      b.style.boxShadow='0 0 60px '+gv[4];
      b.setAttribute('data-depth',gv[3]);
      slide.appendChild(b);
    });
    var hz=el('div','orb');
    hz.style.left='-10%'; hz.style.width='120%';
    hz.style.top='72%'; hz.style.height='210px';
    hz.style.overflow='hidden';
    hz.setAttribute('data-depth','8');
    var hzc=document.createElement('div');
    hzc.style.width='100%'; hzc.style.height='100%';
    hzc.style.transform='perspective(520px) rotateX(58deg)';
    hzc.style.transformOrigin='50% 0';
    hzc.style.backgroundImage='repeating-linear-gradient(0deg,'+(dark?'var(--tealA25)':'var(--tealA16)')+' 0 1.5px,transparent 1.5px 34px),repeating-linear-gradient(90deg,'+(dark?'var(--tealA25)':'var(--tealA16)')+' 0 1.5px,transparent 1.5px 34px)';
    hzc.style.webkitMaskImage='linear-gradient(180deg,transparent,#000 40%)';
    hzc.style.maskImage='linear-gradient(180deg,transparent,#000 40%)';
    hz.appendChild(hzc);
    slide.appendChild(hz);
    return;
  }
  if(THEME.decor==='typo'){
    // Kinetic Typographic — kata raksasa outline di lapisan belakang
    var tw=el('div','orb');
    tw.style.left='-2%'; tw.style.top='34%'; tw.style.width='104%';
    tw.setAttribute('data-depth','10');
    var tt=document.createElement('div');
    tt.textContent='KINERJA';
    tt.style.fontFamily='var(--fHead)';
    tt.style.fontWeight='900';
    tt.style.fontSize='158px';
    tt.style.lineHeight='1';
    tt.style.letterSpacing='.02em';
    tt.style.whiteSpace='nowrap';
    tt.style.color='transparent';
    tt.style.webkitTextStroke='2.5px '+(dark?'var(--tealA28)':'var(--tealA16)');
    tw.appendChild(tt);
    slide.appendChild(tw);
    var tw2=el('div','orb');
    tw2.style.left='18%'; tw2.style.top='56%'; tw2.style.width='104%';
    tw2.setAttribute('data-depth','16');
    var tt2=document.createElement('div');
    tt2.textContent='DATA';
    tt2.style.fontFamily='var(--fHead)';
    tt2.style.fontWeight='900';
    tt2.style.fontSize='110px';
    tt2.style.lineHeight='1';
    tt2.style.whiteSpace='nowrap';
    tt2.style.color='transparent';
    tt2.style.webkitTextStroke='2px var(--orgA28)';
    tw2.appendChild(tt2);
    slide.appendChild(tw2);
    return;
  }
  if(THEME.decor==='pulse'){
    // Holographic Timeline — jalur cahaya + node orb
    var pl=el('div','orb');
    pl.style.left='6%'; pl.style.top='74%'; pl.style.width='88%'; pl.style.height='3px';
    pl.style.background='linear-gradient(90deg,transparent,var(--teal),var(--mint),transparent)';
    pl.style.boxShadow='0 0 18px '+(dark?'var(--tealA45)':'var(--tealA25)');
    pl.style.borderRadius='99px';
    pl.setAttribute('data-depth','8');
    slide.appendChild(pl);
    [16,37,58,79].forEach(function(x,i){
      var n=el('div','orb');
      n.style.left=x+'%'; n.style.top='calc(74% - 6px)';
      n.style.width='14px'; n.style.height='14px';
      n.style.borderRadius='50%';
      n.style.background=dark?'var(--mint)':'var(--teal)';
      n.style.boxShadow='0 0 14px var(--tealA45)';
      n.setAttribute('data-depth',String(12+i*3));
      slide.appendChild(n);
    });
    return;
  }
  // default: orbs
  items=[
    ['140px',34,'var(--tealA28)','8%','12%'],
    ['90px',22,'var(--orgA40)','86%','70%'],
    ['220px',14,'var(--tealA10)','72%','8%'],
    ['60px',30,'var(--orgA16)','16%','78%'],
  ];
  items.forEach(function(o){
    var orb=el('div','orb'); orb.style.width=o[0]; orb.style.height=o[0];
    orb.style.borderRadius='50%';
    orb.style.background='radial-gradient(circle at 35% 35%,'+o[2]+',transparent 70%)';
    orb.style.left=o[3]; orb.style.top=o[4]; orb.style.opacity='0.9';
    orb.setAttribute('data-depth',String(o[1]));
    slide.appendChild(orb);
  });
}

// ---------- motif sampul per template ----------
function coverMotif(slide){
  if(THEME.coverBand==='stack'){
    var st=el('div','cover-stack');
    for(var i=0;i<3;i++){ st.appendChild(el('i')); }
    slide.appendChild(st);
    return;
  }
  if(THEME.coverBand==='block'){
    var bl=el('div','cover-block');
    bl.appendChild(el('div','cover-block-num','07'));
    slide.appendChild(bl);
    return;
  }
  if(THEME.coverBand==='arch'){
    var ar=el('div','cover-arch');
    ar.appendChild(el('i')); ar.appendChild(el('i'));
    slide.appendChild(ar);
    return;
  }
  if(THEME.coverBand==='outline'){
    var ol=el('div','cover-outline');
    ol.appendChild(el('div','cover-outline-tag','LAPORAN'));
    slide.appendChild(ol);
    return;
  }
  if(THEME.coverBand==='bento'){
    var bt=el('div','cover-bento');
    bt.appendChild(el('i','bt-a'));
    bt.appendChild(el('i','bt-b'));
    bt.appendChild(el('i','bt-c'));
    slide.appendChild(bt);
    return;
  }
  if(THEME.coverBand==='cinema'){
    var cb=el('div','cover-cinema');
    cb.appendChild(el('b',null,'SINEMATIK'));
    slide.appendChild(cb);
    slide.appendChild(el('div','cover-cinema-b'));
    return;
  }
  if(THEME.coverBand==='sticker'){
    var sk=el('div','cover-sticker');
    sk.appendChild(el('div','cover-sticker-box','2025'));
    sk.appendChild(el('i','cover-sticker-dot'));
    slide.appendChild(sk);
    return;
  }
  if(THEME.coverBand==='folio'){
    var fo=el('div','cover-folio');
    fo.appendChild(el('i'));
    fo.appendChild(el('i'));
    fo.appendChild(el('b',null,'EDISI KINERJA'));
    fo.appendChild(el('em',null,'№ 07 / 2025'));
    slide.appendChild(fo);
    return;
  }
  if(THEME.coverBand==='panel'){
    var pn=el('div','cover-panel');
    pn.appendChild(el('div','cover-panel-num','+142%'));
    pn.appendChild(el('div','cover-panel-cap','Fokus Data'));
    slide.appendChild(pn);
    return;
  }
  if(THEME.coverBand==='giant'){
    var gt=el('div','cover-giant');
    gt.appendChild(el('b',null,'VISI'));
    gt.appendChild(el('em',null,'2025'));
    slide.appendChild(gt);
    return;
  }
  if(THEME.coverBand==='holo'){
    slide.appendChild(el('div','cover-holo'));
    var hc=el('div','cover-holo-card');
    hc.appendChild(el('b',null,'Milestone'));
    hc.appendChild(el('span',null,'Roadmap 2025'));
    slide.appendChild(hc);
    return;
  }
  // seam (default)
  slide.appendChild(el('div','cover-seam'));
  slide.appendChild(el('div','cover-side'));
}

// ---------- pasang slide ----------
var BUILDERS={cover:slideCover,kpi:slideKpi,composition:slideComp,table:slideTF,trend:slideTrend,programs:slideProg,bullets:slideBullets,steps:slideSteps,closing:slideClose};
var nodes=SLIDES.map(function(s,i){ var f=BUILDERS[s.kind]||slideBullets; return f(s,i); });
nodes.forEach(function(n){ stage.appendChild(n); });

// ---------- elemen tambahan ----------
function attachElements(){
  ELEMENTS.forEach(function(em){
    var slide=stage.querySelector('.slide[data-key="'+em.slide+'"]');
    if(!slide) return;
    var wrap=el('div','elem');
    wrap.setAttribute('data-eid',em.id);
    wrap.style.left=em.x+'%'; wrap.style.top=em.y+'%'; wrap.style.width=em.w+'%';
    wrap.innerHTML=em.html;
    wrap.appendChild(el('div','elem-tag',em.kind));
    slide.appendChild(wrap);
    dragElem(wrap,em.id);
  });
}
function dragElem(wrap,id){
  wrap.addEventListener('pointerdown',function(e){
    if(!EDIT) return;
    e.preventDefault();
    var r=stage.getBoundingClientRect();
    var startX=e.clientX, startY=e.clientY;
    var sx=parseFloat(wrap.style.left)||0, sy=parseFloat(wrap.style.top)||0;
    var moved=false;
    function mm(ev){
      moved=true;
      var dx=(ev.clientX-startX)/r.width*100, dy=(ev.clientY-startY)/r.height*100;
      wrap.style.left=Math.max(-10,Math.min(108,sx+dx)).toFixed(2)+'%';
      wrap.style.top=Math.max(-5,Math.min(96,sy+dy)).toFixed(2)+'%';
    }
    function up(){
      window.removeEventListener('pointermove',mm);
      window.removeEventListener('pointerup',up);
      if(moved&&window.parent!==window){
        window.parent.postMessage({type:'deckEdit',path:'elements.'+id+'.x',value:parseFloat(wrap.style.left).toFixed(1)},'*');
        window.parent.postMessage({type:'deckEdit',path:'elements.'+id+'.y',value:parseFloat(wrap.style.top).toFixed(1)},'*');
      }
    }
    window.addEventListener('pointermove',mm);
    window.addEventListener('pointerup',up);
  });
}
attachElements();

// ---------- logo & ornamen kustom (Task 17) ----------
function brandApplyLogo(slide,kind){
  var L=BRANDING&&BRANDING.logo; if(!L||!L.src) return;
  if(L.apply==='cover'&&kind!=='cover') return;
  var d=el('div','brand-logo');
  d.style.width=(L.size||110)+'px';
  d.style.opacity=(L.opacity===undefined?1:L.opacity);
  var m=26;
  if(L.pos==='tr'){ d.style.right=m+'px'; d.style.top=m+'px'; }
  else if(L.pos==='bl'){ d.style.left=m+'px'; d.style.bottom=m+'px'; }
  else if(L.pos==='br'){ d.style.right=m+'px'; d.style.bottom=m+'px'; }
  else { d.style.left=m+'px'; d.style.top=m+'px'; }
  var im=document.createElement('img'); im.src=L.src; im.alt='Logo';
  d.appendChild(im); slide.appendChild(d);
}
function brandAssetById(id){
  var list=(BRANDING&&BRANDING.assets)||[];
  for(var i=0;i<list.length;i++){ if(list[i].id===id) return list[i]; }
  return null;
}
function brandOrnTargets(p,kind,id){
  if(p.target==='all') return true;
  if(p.target==='cover') return kind==='cover';
  return id===p.target;
}
function brandApplyOrnaments(slide,kind,id){
  var list=(BRANDING&&BRANDING.ornaments)||[];
  list.forEach(function(p){
    var a=brandAssetById(p.assetId);
    if(!a||!a.src) return;
    if(!brandOrnTargets(p,kind,id)) return;
    var w=el('div','brand-orn '+(p.behind===false?'front':'behind')+(p.pos==='full'?' full':''));
    w.style.opacity=(p.opacity===undefined?1:p.opacity);
    if(p.pos!=='full'){
      w.style.width=(p.w||24)+'%';
      var pos=p.pos||'br', H=pos.charAt(1), V=pos.charAt(0);
      var tx=H==='c'?'-50%':(H==='r'?'-100%':'0');
      var ty=V==='m'?'-50%':(V==='b'?'-100%':'0');
      w.style.transform='translate('+tx+','+ty+')';
      if(H==='l') w.style.left='3%'; else if(H==='c') w.style.left='50%'; else w.style.left='97%';
      if(V==='t') w.style.top='4%'; else if(V==='m') w.style.top='50%'; else w.style.top='96%';
    }
    if(a.kind==='video'){
      var v=document.createElement('video');
      v.src=a.src; v.muted=true; v.loop=true; v.autoplay=true;
      v.setAttribute('muted',''); v.setAttribute('loop',''); v.setAttribute('autoplay',''); v.setAttribute('playsinline','');
      if(a.poster) v.poster=a.poster;
      w.appendChild(v);
    } else {
      var im=document.createElement('img'); im.src=a.src; im.alt='Ornamen'; im.draggable=false;
      w.appendChild(im);
    }
    if(p.behind===false){ slide.appendChild(w); } else { slide.insertBefore(w,slide.firstChild); }
  });
}
function attachBranding(){
  nodes.forEach(function(n,i){
    var sl=SLIDES[i]; if(!sl) return;
    brandApplyOrnaments(n,sl.kind,sl.id);
    brandApplyLogo(n,sl.kind);
  });
}
attachBranding();

// ---------- HUD ----------
var hud=el('div'); hud.id='hud';
var notesBtn=el('button','nbtn','🗒'); notesBtn.title='Catatan pembicara (N)'; notesBtn.setAttribute('aria-label','Catatan pembicara');
var dots=el('div'); dots.id='dots'; dots.style.flexWrap='wrap'; dots.style.maxWidth='340px'; dots.style.justifyContent='flex-end';
nodes.forEach(function(_,i){ var d=el('button','dot'); d.title='Slide '+(i+1)+' — '+sLabel(i); d.addEventListener('click',function(){go(i);}); dots.appendChild(d); });
var prev=el('button','nbtn','‹'); prev.title='Sebelumnya (←)'; prev.setAttribute('aria-label','Slide sebelumnya');
var next=el('button','nbtn','›'); next.title='Berikutnya (→)'; next.setAttribute('aria-label','Slide berikutnya');
hud.appendChild(notesBtn); hud.appendChild(dots); hud.appendChild(prev); hud.appendChild(next);
stage.appendChild(hud);

var notesPanel=el('div'); notesPanel.id='notesPanel';
var nh=el('h3'); var ntl=el('span',null,'Catatan Pembicara'); var nx=el('button',null,'✕');
nx.addEventListener('click',function(){toggleNotes(false);});
nh.appendChild(ntl); nh.appendChild(nx);
var nt=el('div'); nt.id='notesText';
notesPanel.appendChild(nh); notesPanel.appendChild(nt); stage.appendChild(notesPanel);

var presenter=document.getElementById('presenter');
var presenterText=document.getElementById('presenterText');
presenter.addEventListener('click',function(){presenter.classList.remove('open');});

// ---------- aktivasi slide ----------
function animateCount(slide){
  var hosts=slide.querySelectorAll('[data-count]');
  hosts.forEach(function(sp){
    var target=parseFloat(sp.getAttribute('data-value')||'0');
    var dec=parseInt(sp.getAttribute('data-decimals')||'0',10);
    var t0=null, DUR=THEME.countDur;
    function step(ts){ if(!t0)t0=ts; var p=Math.min((ts-t0)/DUR,1); var e=1-Math.pow(1-p,3);
      sp.textContent=fmt(target*e,dec);
      if(p<1) requestAnimationFrame(step); else sp.textContent=fmt(target,dec); }
    sp.textContent=fmt(0,dec);
    requestAnimationFrame(step);
  });
}
function activate(i){
  nodes.forEach(function(n){ n.classList.remove('enter','leave'); });
  var s=nodes[i];
  s.classList.add('active');
  animateCount(s);
  nt.textContent=(SLIDES[i]&&SLIDES[i].note)||'';
  ntl.textContent='Catatan Pembicara — '+sLabel(i);
  var dd=dots.children; for(var d=0;d<dd.length;d++){ dd[d].classList.toggle('on',d===i); }
}
var started=false;
function go(i){
  if(i===IDX&&started)return;
  if(i<0||i>=nodes.length)return;
  var old=IDX; IDX=i;
  var line=document.getElementById('seamline');
  if(line){ line.classList.remove('go'); void line.offsetWidth; line.classList.add('go'); }
  if(started){
    var out=nodes[old]; out.classList.remove('active'); out.classList.add('leave');
    setTimeout(function(){ out.classList.remove('leave'); },600);
  }
  var inn=nodes[i]; inn.classList.add('active','enter');
  setTimeout(function(){ inn.classList.remove('enter'); },700);
  animateCount(inn);
  nt.textContent=(SLIDES[i]&&SLIDES[i].note)||'';
  ntl.textContent='Catatan Pembicara — '+sLabel(i);
  var dd=dots.children; for(var d2=0;d2<dd.length;d2++){ dd[d2].classList.toggle('on',d2===i); }
  started=true;
}
prev.addEventListener('click',function(){go(IDX-1);});
next.addEventListener('click',function(){go(IDX+1);});
function toggleNotes(force){
  var open=force===undefined?!notesPanel.classList.contains('open'):force;
  notesPanel.classList.toggle('open',open);
}
notesBtn.addEventListener('click',function(){toggleNotes();});

// ---------- keyboard ----------
document.addEventListener('keydown',function(e){
  var t=e.target;
  if(t&&(t.isContentEditable||/INPUT|TEXTAREA/.test(t.tagName)))return;
  if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '){e.preventDefault();go(IDX+1);}
  else if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();go(IDX-1);}
  else if(e.key==='Home'){go(0);}
  else if(e.key==='End'){go(nodes.length-1);}
  else if(e.key==='n'||e.key==='N'){toggleNotes();}
  else if(e.key==='p'||e.key==='P'){ presenterText.textContent=(SLIDES[IDX]&&SLIDES[IDX].note)||''; presenter.classList.add('open'); }
  else if(e.key==='Escape'){ presenter.classList.remove('open'); }
});

// ---------- parallax ----------
document.addEventListener('mousemove',function(e){
  var cx=(e.clientX/window.innerWidth-0.5), cy=(e.clientY/window.innerHeight-0.5);
  var orbs=stage.querySelectorAll('.orb');
  for(var i=0;i<orbs.length;i++){
    var d=parseFloat(orbs[i].getAttribute('data-depth')||'10');
    orbs[i].style.transform='translate('+(-cx*d)+'px,'+(-cy*d)+'px)';
  }
});

// ---------- mode edit studio ----------
function applyEdit(){
  var on=STUDIO&&EDIT;
  document.body.classList.toggle('edit-on',on);
  var eds=stage.querySelectorAll('[data-edit]');
  for(var i=0;i<eds.length;i++){ eds[i].setAttribute('contenteditable',on?'true':'false'); }
}
var deb=null;
stage.addEventListener('input',function(e){
  var t=e.target.closest?e.target.closest('[data-edit]'):null;
  if(!t)return;
  if(deb)clearTimeout(deb);
  deb=setTimeout(function(){
    var path=t.getAttribute('data-edit');
    var type=t.getAttribute('data-type');
    var val=t.textContent.trim();
    if(path==='identity.title'){ val=val.replace(/\\s+/g,' '); }
    if(type==='number'){ val=val.replace(/[^0-9.,-]/g,''); }
    if(window.parent!==window){ window.parent.postMessage({type:'deckEdit',path:path,value:val},'*'); }
  },260);
});
stage.addEventListener('focusin',function(e){
  var t=e.target.closest?e.target.closest('[data-edit]'):null; if(!t)return;
  if(t.getAttribute('data-type')==='number'){ t.textContent=t.getAttribute('data-value')||t.textContent; }
});
stage.addEventListener('focusout',function(e){
  var t=e.target.closest?e.target.closest('[data-edit]'):null; if(!t)return;
  if(t.getAttribute('data-type')==='number'){
    var dec=parseInt(t.getAttribute('data-decimals')||'0',10);
    var v=parseFloat((t.textContent||'').replace(/\\./g,'').replace(',','.'))||0;
    t.textContent=fmt(v,dec);
    t.setAttribute('data-value',String(v));
  }
});
window.addEventListener('message',function(e){
  var d=e.data||{};
  if(d.type==='studioSet'){ STUDIO=!!d.studio; applyEdit(); }
  if(d.type==='editSet'){ EDIT=!!d.enabled; applyEdit(); }
  if(d.type==='goto'&&typeof d.index==='number'){ go(d.index); }
  if(d.type==='notesSet'){ toggleNotes(!!d.open); }
});
applyEdit();
activate(0);
if(window.parent!==window){ window.parent.postMessage({type:'deckReady'},'*'); }
})();
</script>
</body>
</html>`
}

/** CSS motif panel sampul — berbeda tiap template (semua versi CERAH) */
function coverMotifCss(theme: ResolvedStyle): string {
  switch (theme.tpl.coverBand) {
    case 'bento':
      return `.cover-bento{position:absolute;right:56px;top:72px;bottom:72px;width:300px;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:14px;pointer-events:none}
.cover-bento i{border-radius:18px;background:rgba(255,255,255,.78);border:1px solid var(--tealA28);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:var(--shadow)}
.cover-bento .bt-a{grid-column:1/3;background:linear-gradient(135deg,var(--tealA45),var(--tealA10));border-color:var(--tealA50)}
.cover-bento .bt-b{background:linear-gradient(135deg,var(--orgA28),rgba(255,255,255,.6))}
.cover-bento .bt-c{background:linear-gradient(135deg,var(--tealA16),rgba(255,255,255,.6))}`
    case 'cinema':
      return `.cover-cinema{position:absolute;left:0;right:0;top:0;height:58px;background:rgba(255,255,255,.75);border-bottom:2px solid var(--tealA28);display:flex;align-items:center;pointer-events:none}
.cover-cinema b{margin-left:64px;font-size:11px;font-weight:800;letter-spacing:.3em;color:var(--teal);text-transform:uppercase}
.cover-cinema-b{position:absolute;left:0;right:0;bottom:0;height:58px;background:rgba(255,255,255,.75);border-top:2px solid var(--tealA28);pointer-events:none}`
    case 'sticker':
      return `.cover-sticker{position:absolute;right:44px;top:80px;width:300px;height:460px;pointer-events:none}
.cover-sticker-box{position:absolute;right:10px;top:64px;transform:rotate(8deg);background:var(--org);color:#fff;border:4px solid var(--ink);box-shadow:10px 10px 0 var(--inkA85);border-radius:16px;padding:24px 30px;font-family:var(--fHead);font-weight:900;font-size:54px;line-height:1}
.cover-sticker-dot{position:absolute;right:186px;top:290px;width:110px;height:110px;border-radius:50%;background:var(--teal);border:4px solid var(--ink);box-shadow:8px 8px 0 var(--inkA85)}`
    case 'folio':
      return `.cover-folio{position:absolute;left:40px;top:40px;right:40px;bottom:40px;border:1.5px solid var(--tealA45);border-radius:2px;pointer-events:none}
.cover-folio i{position:absolute;left:40px;right:40px;height:1px;background:var(--inkA14)}
.cover-folio i:nth-child(1){top:74px}
.cover-folio i:nth-child(2){bottom:74px}
.cover-folio b{position:absolute;left:44px;top:52px;font-size:11px;font-weight:800;letter-spacing:.28em;color:var(--teal);text-transform:uppercase}
.cover-folio em{position:absolute;right:44px;bottom:52px;font-style:normal;font-family:var(--fHead);font-size:15px;letter-spacing:.18em;color:var(--inkS)}`
    case 'panel':
      return `.cover-panel{position:absolute;right:0;top:0;bottom:0;width:320px;background:linear-gradient(200deg,var(--tealS),rgba(255,255,255,.4));border-left:2px solid var(--tealA45);display:flex;align-items:center;justify-content:center;overflow:hidden;pointer-events:none}
.cover-panel::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,var(--tealA16) 0 1px,transparent 1px 6px);opacity:.6}
.cover-panel-num{position:relative;font-family:var(--fHead);font-weight:900;font-size:112px;color:var(--teal);text-shadow:0 6px 0 rgba(255,255,255,.7),0 0 40px var(--tealA28)}
.cover-panel-cap{position:absolute;bottom:26px;left:0;right:0;text-align:center;font-size:11px;font-weight:800;letter-spacing:.26em;color:var(--orgDeep);text-transform:uppercase}`
    case 'giant':
      return `.cover-giant{position:absolute;right:30px;bottom:110px;width:390px;text-align:right;line-height:.88;pointer-events:none}
.cover-giant b{display:block;font-family:var(--fHead);font-weight:900;font-size:148px;letter-spacing:-.02em;color:transparent;-webkit-text-stroke:3px var(--tealA45)}
.cover-giant em{display:block;font-family:var(--fHead);font-style:normal;font-weight:900;font-size:148px;letter-spacing:-.02em;color:var(--orgA40)}`
    case 'holo':
      return `.cover-holo{position:absolute;right:110px;top:-40px;bottom:-40px;width:8px;border-radius:99px;background:linear-gradient(180deg,transparent,var(--teal) 22%,var(--mint) 50%,var(--teal) 78%,transparent);box-shadow:0 0 26px var(--tealA25);pointer-events:none}
.cover-holo::after{content:'';position:absolute;top:34%;left:50%;transform:translateX(-50%);width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 34% 30%,rgba(255,255,255,.9),var(--tealA28) 44%,rgba(255,255,255,.3) 72%);border:1.5px solid var(--tealA45);box-shadow:0 0 30px var(--tealA25),inset 0 0 18px rgba(255,255,255,.6)}
.cover-holo::before{content:'';position:absolute;top:64%;left:50%;transform:translateX(-50%);width:34px;height:34px;border-radius:50%;background:radial-gradient(circle at 34% 30%,rgba(255,255,255,.9),var(--tealA28) 46%,rgba(255,255,255,.25) 74%);border:1.5px solid var(--tealA45);box-shadow:0 0 18px var(--tealA25)}
.cover-holo-card{position:absolute;right:152px;top:29%;background:rgba(255,255,255,.88);border:1px solid var(--tealA28);border-radius:14px;padding:12px 18px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:var(--shadow);pointer-events:none}
.cover-holo-card b{display:block;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--teal);font-weight:800}
.cover-holo-card span{font-family:var(--fHead);font-weight:700;font-size:20px;color:var(--ink)}`
    case 'stack':
      return `.cover-stack{position:absolute;right:-60px;top:-10%;bottom:-10%;width:460px;pointer-events:none}
.cover-stack i{position:absolute;top:-5%;bottom:-5%;width:120px;transform:rotate(14deg);border-radius:24px}
.cover-stack i:nth-child(1){right:130px;background:var(--tealA45)}
.cover-stack i:nth-child(2){right:10px;background:var(--orgA28)}
.cover-stack i:nth-child(3){right:250px;background:var(--tealA16)}`
    case 'block':
      return `.cover-block{position:absolute;right:0;top:0;bottom:0;width:300px;background:linear-gradient(200deg,var(--tealHi),var(--teal) 62%,var(--tealD));border-left:6px solid var(--org);display:flex;align-items:flex-end;justify-content:center;overflow:hidden}
.cover-block-num{font-family:var(--fHead);font-weight:900;font-size:230px;line-height:.82;color:transparent;-webkit-text-stroke:2.5px rgba(255,255,255,.55);opacity:.95;transform:translateY(26px)}`
    case 'arch':
      return `.cover-arch{position:absolute;right:40px;top:64px;bottom:64px;width:264px;border-radius:999px 999px 28px 28px;background:linear-gradient(180deg,var(--tealA45),var(--tealA10));border:2px solid var(--tealA50);overflow:hidden}
.cover-arch i{position:absolute;left:50%;transform:translateX(-50%);border-radius:50%;border:2px solid var(--tealA50)}
.cover-arch i:nth-child(1){width:200px;height:200px;bottom:-72px}
.cover-arch i:nth-child(2){width:120px;height:120px;bottom:-12px;border-color:var(--orgA55)}`
    case 'outline':
      return `.cover-outline{position:absolute;right:48px;top:56px;bottom:56px;width:256px;border:3px solid var(--teal);border-radius:6px;background:radial-gradient(var(--tealA12) 1.5px,transparent 1.6px) 0 0/18px 18px repeat;box-shadow:10px 10px 0 var(--inkA85)}
.cover-outline-tag{position:absolute;left:-3px;top:-42px;background:var(--org);color:#fff;font-weight:800;font-size:13px;letter-spacing:.14em;padding:8px 16px;border-radius:4px;text-transform:uppercase}`
    case 'seam':
    default:
      return `.cover-seam{position:absolute;top:-20%;bottom:-20%;width:340px;left:56%;transform:rotate(14deg);background:linear-gradient(180deg,var(--tealA45),var(--tealA06));border-left:3px solid var(--tealA50)}
.cover-side{position:absolute;right:0;top:0;bottom:0;width:300px;background:linear-gradient(200deg,var(--orgA28),var(--orgA03));border-left:1px solid var(--orgA10)}`
  }
}
