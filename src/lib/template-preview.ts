import { resolveStyle, rootVarsCss, fontsLink } from './themes'
import type { DeckStyle } from './themes'

// ─── Pratinjau mini statis untuk pemilih template gaya desain ────────────────
// Menghasilkan HTML kecil ala slide sampul (tanpa deck penuh) yang memakai
// CSS variables tema yang sama, sehingga user melihat tampilan nyata
// kombinasi template × warna × font sebelum generate.

export function buildTemplatePreview(style: DeckStyle): string {
  const r = resolveStyle(style)
  const c = r.color

  const motif = (() => {
    switch (r.tpl.coverBand) {
      case 'stack':
        return `<div class="pv-stack"><i></i><i></i><i></i></div>`
      case 'block':
        return `<div class="pv-block"><b>07</b></div>`
      case 'arch':
        return `<div class="pv-arch"><i></i><i></i></div>`
      case 'outline':
        return `<div class="pv-outline"><em>LAPORAN</em></div>`
      case 'bento':
        return `<div class="pv-bento"><i class="bt-a"></i><i class="bt-b"></i><i class="bt-c"></i></div>`
      case 'cinema':
        return `<div class="pv-cinema"><b>SINEMATIK</b></div><div class="pv-cinema-b"></div>`
      case 'sticker':
        return `<div class="pv-sticker"><span class="pv-sticker-box">2025</span><i class="pv-sticker-dot"></i></div>`
      case 'folio':
        return `<div class="pv-folio"><i></i><i></i><b>EDISI KINERJA</b><em>№ 07 / 2025</em></div>`
      case 'panel':
        return `<div class="pv-panel"><span class="pv-panel-num">+142%</span><span class="pv-panel-cap">Fokus Data</span></div>`
      case 'giant':
        return `<div class="pv-giant"><b>VISI</b><em>2025</em></div>`
      case 'holo':
        return `<div class="pv-holo"></div><div class="pv-holo-card"><b>Milestone</b><span>Roadmap 2025</span></div>`
      default:
        return `<div class="pv-seam"></div><div class="pv-side"></div>`
    }
  })()

  return `<!DOCTYPE html>
<html lang="id"><head><meta charset="utf-8">
${fontsLink(r.font)}
<style>
:root{
${rootVarsCss(r)}
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;overflow:hidden;background:var(--bgBody);font-family:var(--fBody)}
#stage{position:absolute;left:0;top:0;width:1280px;height:800px;transform-origin:0 0;background:var(--bgCover)}
.brand{position:absolute;top:48px;left:64px;color:var(--inkS);font-weight:700;letter-spacing:.22em;text-transform:uppercase;font-size:15px}
.brand b{color:var(--org)}
.mid{position:absolute;left:64px;top:200px;color:var(--ink);max-width:760px}
.kicker{font-size:19px;color:var(--teal);font-weight:800;letter-spacing:.08em;margin-bottom:16px}
.title{font-family:var(--fHead);font-size:96px;font-weight:900;line-height:1.02;letter-spacing:-.015em}
.title b{color:var(--org);font-weight:inherit}
.sub{margin-top:22px;font-size:22px;color:var(--inkS);font-weight:500}
.chips{position:absolute;left:64px;bottom:60px;display:flex;gap:12px}
.chip{background:var(--white);border:1.5px solid var(--tealA45);color:var(--inkS);border-radius:999px;padding:9px 22px;font-size:15px;font-weight:700;box-shadow:var(--shadow)}
.chip.solid{background:var(--teal);border-color:var(--teal);color:#fff}
.card{position:absolute;right:64px;bottom:56px;background:var(--white);border-radius:var(--radiusS);box-shadow:var(--shadow);border:var(--cardBorder);border-left:6px solid var(--org);padding:18px 26px;display:flex;align-items:center;gap:16px}
.card .v{font-family:var(--fHead);font-weight:900;font-size:44px;color:var(--ink)}
.card .v s{text-decoration:none;color:var(--org);font-size:24px}
.card .l{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--inkS)}
.dots{position:absolute;right:70px;top:52px;display:flex;gap:8px}
.dots i{width:14px;height:14px;border-radius:50%}
/* motif */
.pv-seam{position:absolute;top:-20%;bottom:-20%;width:300px;left:58%;transform:rotate(14deg);background:linear-gradient(180deg,var(--tealA45),var(--tealA06));border-left:3px solid var(--tealA50)}
.pv-side{position:absolute;right:0;top:0;bottom:0;width:280px;background:linear-gradient(200deg,var(--orgA28),var(--orgA03));border-left:1px solid var(--orgA10)}
.pv-stack{position:absolute;right:-60px;top:-10%;bottom:-10%;width:430px}
.pv-stack i{position:absolute;top:-5%;bottom:-5%;width:110px;transform:rotate(14deg);border-radius:24px}
.pv-stack i:nth-child(1){right:120px;background:var(--tealA45)}
.pv-stack i:nth-child(2){right:6px;background:var(--orgA28)}
.pv-stack i:nth-child(3){right:234px;background:var(--tealA16)}
.pv-block{position:absolute;right:0;top:0;bottom:0;width:270px;background:linear-gradient(200deg,var(--tealHi),var(--teal) 62%,var(--tealD));border-left:6px solid var(--org);display:flex;align-items:flex-end;justify-content:center;overflow:hidden}
.pv-block b{font-family:var(--fHead);font-weight:900;font-size:200px;line-height:.82;color:transparent;-webkit-text-stroke:2.5px rgba(255,255,255,.55);transform:translateY(24px)}
.pv-arch{position:absolute;right:36px;top:60px;bottom:60px;width:240px;border-radius:999px 999px 26px 26px;background:linear-gradient(180deg,var(--tealA45),var(--tealA10));border:2px solid var(--tealA50);overflow:hidden}
.pv-arch i{position:absolute;left:50%;transform:translateX(-50%);border-radius:50%;border:2px solid var(--tealA50)}
.pv-arch i:nth-child(1){width:190px;height:190px;bottom:-68px}
.pv-arch i:nth-child(2){width:110px;height:110px;bottom:-10px;border-color:var(--orgA55)}
.pv-outline{position:absolute;right:44px;top:52px;bottom:52px;width:236px;border:3px solid var(--teal);border-radius:6px;background:radial-gradient(var(--tealA12) 1.5px,transparent 1.6px) 0 0/18px 18px repeat;box-shadow:10px 10px 0 var(--inkA85)}
.pv-outline em{position:absolute;left:-3px;top:-40px;background:var(--org);color:#fff;font-style:normal;font-weight:800;font-size:13px;letter-spacing:.14em;padding:8px 15px;border-radius:4px}
.pv-bento{position:absolute;right:44px;top:60px;bottom:60px;width:250px;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:12px;pointer-events:none}
.pv-bento i{border-radius:15px;background:rgba(255,255,255,.78);border:1px solid var(--tealA28);backdrop-filter:blur(6px);box-shadow:var(--shadow)}
.pv-bento .bt-a{grid-column:1/3;background:linear-gradient(135deg,var(--tealA45),var(--tealA10));border-color:var(--tealA50)}
.pv-bento .bt-b{background:linear-gradient(135deg,var(--orgA28),rgba(255,255,255,.6))}
.pv-bento .bt-c{background:linear-gradient(135deg,var(--tealA16),rgba(255,255,255,.6))}
.pv-cinema{position:absolute;left:0;right:0;top:0;height:44px;background:rgba(255,255,255,.75);border-bottom:2px solid var(--tealA28);display:flex;align-items:center;pointer-events:none}
.pv-cinema b{margin-left:52px;font-size:9.5px;font-weight:800;letter-spacing:.28em;color:var(--teal)}
.pv-cinema-b{position:absolute;left:0;right:0;bottom:0;height:44px;background:rgba(255,255,255,.75);border-top:2px solid var(--tealA28);pointer-events:none}
.pv-sticker{position:absolute;right:34px;top:58px;width:240px;height:360px;pointer-events:none}
.pv-sticker-box{position:absolute;right:8px;top:50px;transform:rotate(8deg);display:block;background:var(--org);color:#fff;border:3.5px solid var(--ink);box-shadow:8px 8px 0 var(--inkA85);border-radius:13px;padding:18px 24px;font-family:var(--fHead);font-weight:900;font-size:42px;line-height:1}
.pv-sticker-dot{position:absolute;right:150px;top:224px;display:block;width:86px;height:86px;border-radius:50%;background:var(--teal);border:3.5px solid var(--ink);box-shadow:6px 6px 0 var(--inkA85)}
.pv-folio{position:absolute;left:30px;top:30px;right:30px;bottom:30px;border:1.5px solid var(--tealA45);border-radius:2px;pointer-events:none}
.pv-folio i{position:absolute;left:28px;right:28px;height:1px;background:var(--inkA14)}
.pv-folio i:nth-child(1){top:56px}
.pv-folio i:nth-child(2){bottom:56px}
.pv-folio b{position:absolute;left:32px;top:40px;font-size:9px;font-weight:800;letter-spacing:.26em;color:var(--teal)}
.pv-folio em{position:absolute;right:32px;bottom:40px;font-style:normal;font-family:var(--fHead);font-size:12px;letter-spacing:.16em;color:var(--inkS)}
.pv-panel{position:absolute;right:0;top:0;bottom:0;width:240px;background:linear-gradient(200deg,var(--tealS),rgba(255,255,255,.4));border-left:2px solid var(--tealA45);display:flex;align-items:center;justify-content:center;overflow:hidden;pointer-events:none}
.pv-panel::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(0deg,var(--tealA16) 0 1px,transparent 1px 5px);opacity:.6}
.pv-panel-num{position:relative;font-family:var(--fHead);font-weight:900;font-size:76px;color:var(--teal);text-shadow:0 4px 0 rgba(255,255,255,.7),0 0 30px var(--tealA28)}
.pv-panel-cap{position:absolute;bottom:20px;left:0;right:0;text-align:center;font-size:9px;font-weight:800;letter-spacing:.24em;color:var(--orgDeep)}
.pv-giant{position:absolute;right:22px;bottom:84px;width:290px;text-align:right;line-height:.88;pointer-events:none}
.pv-giant b{display:block;font-family:var(--fHead);font-weight:900;font-size:104px;letter-spacing:-.02em;color:transparent;-webkit-text-stroke:2.5px var(--tealA50)}
.pv-giant em{display:block;font-family:var(--fHead);font-style:normal;font-weight:900;font-size:104px;letter-spacing:-.02em;color:var(--orgA40)}
.pv-holo{position:absolute;right:82px;top:-40px;bottom:-40px;width:7px;border-radius:99px;background:linear-gradient(180deg,transparent,var(--teal) 22%,var(--mint) 50%,var(--teal) 78%,transparent);box-shadow:0 0 22px var(--tealA25);pointer-events:none}
.pv-holo::after{content:'';position:absolute;top:34%;left:50%;transform:translateX(-50%);width:50px;height:50px;border-radius:50%;background:radial-gradient(circle at 34% 30%,rgba(255,255,255,.9),var(--tealA28) 44%,rgba(255,255,255,.3) 72%);border:1.5px solid var(--tealA45);box-shadow:0 0 24px var(--tealA25)}
.pv-holo::before{content:'';position:absolute;top:64%;left:50%;transform:translateX(-50%);width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 34% 30%,rgba(255,255,255,.9),var(--tealA28) 46%,rgba(255,255,255,.25) 74%);border:1.5px solid var(--tealA45);box-shadow:0 0 14px var(--tealA25)}
.pv-holo-card{position:absolute;right:112px;top:28%;background:rgba(255,255,255,.88);border:1px solid var(--tealA28);border-radius:12px;padding:9px 14px;backdrop-filter:blur(6px);box-shadow:var(--shadow);pointer-events:none}
.pv-holo-card b{display:block;font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--teal);font-weight:800}
.pv-holo-card span{font-family:var(--fHead);font-weight:700;font-size:15px;color:var(--ink)}
</style></head>
<body>
<div id="stage">
  ${motif}
  <div class="dots">${c.slices.slice(0, 4).map((s) => `<i style="background:${s}"></i>`).join('')}</div>
  <div class="brand">${esc(r.color.name)} <b>Studio</b></div>
  <div class="mid">
    <div class="kicker">Pratinjau Template · ${esc(r.tpl.name)}</div>
    <div class="title">LAPORAN <b>KINERJA</b></div>
    <div class="sub">${esc(r.tpl.tagline)}</div>
  </div>
  <div class="chips"><div class="chip solid">Semester I</div><div class="chip">2025</div></div>
  <div class="card"><div class="v">87<s>%</s></div><div class="l">Capaian<br>Utama</div></div>
</div>
<script>
(function(){
  var st=document.getElementById('stage');
  function fit(){ var k=Math.min(window.innerWidth/1280,window.innerHeight/800); st.style.transform='scale('+k+')'; }
  window.addEventListener('resize',fit); fit(); setTimeout(fit,60);
})();
</script>
</body></html>`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
