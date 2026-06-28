/* AI_LANDING_JS_MAP_START
Mục đích: JS riêng cho landing page để app.js nhẹ hơn.
Bản sửa timing:
- Logo HOD hiện lâu hơn nhưng KHÔNG chồng lên web.
- Web chỉ bắt đầu hiện sau khi logo gần tan xong.
AI_LANDING_JS_MAP_END */

// ===== LH_CINEMATIC_INTRO_JS_START =====
(function () {
  if (window.__LH_CINEMATIC_INTRO_PATCHED) return;
  window.__LH_CINEMATIC_INTRO_PATCHED = true;

  function hasKnownAuthSession() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = String(localStorage.key(i) || '').toLowerCase();
        if (key.indexOf('firebase:authuser') !== -1) return true;
      }
      for (var j = 0; j < sessionStorage.length; j++) {
        var skey = String(sessionStorage.key(j) || '').toLowerCase();
        if (skey.indexOf('firebase:authuser') !== -1) return true;
      }
    } catch (e) {}
    return false;
  }
  var HAS_AUTH_SESSION_ON_BOOT = hasKnownAuthSession();
  function installAuthBootGuard() {
    if (!HAS_AUTH_SESSION_ON_BOOT) return;
    document.documentElement.classList.add('lhAuthBoot');
    if (!document.getElementById('lhAuthBootGuardStyle')) {
      var style = document.createElement('style');
      style.id = 'lhAuthBootGuardStyle';
      style.textContent = 'html.lhAuthBoot .hodLoginGate{opacity:0!important;visibility:hidden!important;pointer-events:none!important}html.lhAuthBoot #lhCinematicIntro{display:none!important}';
      document.head.appendChild(style);
    }
  }
  function isVisible(el) {
    if (!el) return false;
    var st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function releaseBootGuardIfAuthFailed() {
    if (!HAS_AUTH_SESSION_ON_BOOT) return;
    var gate = document.getElementById('hodLoginGate');
    if (gate && !gate.classList.contains('hidden')) document.documentElement.classList.remove('lhAuthBoot');
  }
  function shouldShowIntro() {
    if (window.__LOCAL_DEV_MODE) return false;
    if (HAS_AUTH_SESSION_ON_BOOT || hasKnownAuthSession()) return false;
    var gate = document.getElementById('hodLoginGate');
    if (!gate || gate.classList.contains('hidden') || !isVisible(gate)) return false;
    return true;
  }
  function make(tag, className, styleText) {
    var el = document.createElement(tag || 'div');
    if (className) el.className = className;
    if (styleText) el.style.cssText = styleText;
    return el;
  }
  function setStyles(el, styles) { for (var k in styles) el.style[k] = styles[k]; }
  function closeIntro(el) {
    if (!el || el.__closing) return;
    el.__closing = true;
    document.body.classList.remove('lhIntroRunning');
    document.body.classList.add('lhIntroDone');
    el.style.transition = 'opacity 380ms ease';
    el.style.opacity = '0';
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 430);
  }

  function createIntro() {
    if (!shouldShowIntro() || document.getElementById('lhCinematicIntro')) return;
    document.body.classList.remove('lhIntroDone');
    document.body.classList.add('lhIntroRunning');

    var root = make('div', 'lhFinalIntro', 'position:fixed!important;inset:0!important;z-index:2147483600!important;overflow:hidden!important;background:#000!important;isolation:isolate!important;pointer-events:auto!important;opacity:1!important;');
    root.id = 'lhCinematicIntro';
    var topPanel = make('div', 'lhFinalTop', 'position:absolute!important;inset:-35vh -35vw!important;z-index:3!important;background:#000!important;clip-path:polygon(0 0,100% 0,100% 37%,0 63%)!important;transition:transform 900ms cubic-bezier(.18,.82,.18,1)!important;will-change:transform!important;');
    var bottomPanel = make('div', 'lhFinalBottom', 'position:absolute!important;inset:-35vh -35vw!important;z-index:3!important;background:#000!important;clip-path:polygon(0 63%,100% 37%,100% 100%,0 100%)!important;transition:transform 900ms cubic-bezier(.18,.82,.18,1)!important;will-change:transform!important;');
    var whiteBehind = make('div', 'lhFinalWhiteBehind', 'position:absolute!important;left:50%!important;top:50%!important;z-index:4!important;width:285vw!important;height:22vh!important;border-radius:999px!important;background:#fff!important;opacity:0!important;transform:translate3d(-50%,-50%,0) rotate(-45deg) scaleX(.04) scaleY(.08)!important;transform-origin:center center!important;box-shadow:0 0 50px #fff,0 0 135px #fff,0 0 230px rgba(160,235,255,.85)!important;filter:blur(10px)!important;transition:opacity 180ms ease, transform 820ms cubic-bezier(.18,.82,.18,1), filter 520ms ease!important;');
    var glow = make('div', 'lhFinalGlow', 'position:absolute!important;left:50%!important;top:50%!important;z-index:5!important;width:230vw!important;height:10vh!important;border-radius:999px!important;background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),rgba(255,255,255,.70),rgba(160,235,255,.12),transparent)!important;opacity:0!important;transform:translate3d(-50%,-50%,0) rotate(-45deg) scaleX(.18) scaleY(.35)!important;transform-origin:center center!important;filter:blur(18px)!important;transition:opacity 200ms ease, transform 620ms cubic-bezier(.18,.82,.18,1), filter 480ms ease!important;');
    var beam = make('div', 'lhFinalBeam', 'position:absolute!important;left:50%!important;top:50%!important;z-index:6!important;width:290vw!important;height:7px!important;border-radius:999px!important;background:#fff!important;opacity:0!important;transform:translate3d(-50%,-50%,0) rotate(-45deg) scaleX(0)!important;transform-origin:center center!important;box-shadow:0 0 18px #fff,0 0 50px #fff,0 0 125px rgba(130,230,255,.88)!important;filter:blur(6px)!important;transition:opacity 150ms ease, transform 560ms cubic-bezier(.14,.78,.10,1), filter 380ms ease!important;');
    var blade = make('div', 'lhFinalBlade', 'position:absolute!important;left:50%!important;top:50%!important;z-index:7!important;width:90vw!important;height:9px!important;border-radius:999px!important;background:linear-gradient(90deg,transparent,#fff 18%,#fff 82%,transparent)!important;opacity:0!important;transform:translate3d(-50%,-50%,0) rotate(-45deg) scaleX(.05)!important;transform-origin:center center!important;box-shadow:0 0 18px #fff,0 0 60px #fff,0 0 140px rgba(140,235,255,.88)!important;filter:blur(6px)!important;transition:opacity 150ms ease, transform 580ms cubic-bezier(.14,.78,.10,1), filter 360ms ease!important;');
    var fullWhite = make('div', 'lhFinalFullWhite', 'position:absolute!important;inset:-10%!important;z-index:8!important;background:radial-gradient(circle at 50% 50%,#fff 0%,#fff 48%,rgba(255,255,255,.96) 72%,rgba(255,255,255,.92) 100%)!important;opacity:0!important;pointer-events:none!important;transition:opacity 1120ms cubic-bezier(.24,.74,.14,1)!important;');
    var logo = make('div', 'lhStep05Logo', 'position:absolute!important;left:50%!important;top:50%!important;z-index:9!important;text-align:center!important;opacity:0!important;transform:translate3d(-50%,-50%,0) scale(.96)!important;color:#102233!important;font-family:var(--landing-font,Segoe UI,Arial,sans-serif)!important;letter-spacing:.08em!important;text-shadow:0 1px 0 rgba(255,255,255,.35),0 12px 36px rgba(0,0,0,.08)!important;transition:opacity 620ms ease, transform 800ms cubic-bezier(.22,.75,.12,1)!important;pointer-events:none!important;user-select:none!important;');
    logo.innerHTML = '<div style="font-weight:950;font-size:clamp(1.35rem,3.2vw,2.2rem);line-height:1;letter-spacing:.16em">HOD</div><div style="margin-top:8px;font-size:clamp(.58rem,1.2vw,.72rem);font-weight:850;letter-spacing:.26em;color:rgba(16,34,51,.55)">LEARNING HUB</div>';
    var skip = make('button', 'lhIntroSkip', 'position:absolute!important;right:18px!important;bottom:18px!important;z-index:10!important;border:1px solid rgba(255,255,255,.18)!important;border-radius:999px!important;padding:7px 12px!important;background:rgba(0,0,0,.28)!important;color:rgba(255,255,255,.58)!important;font-weight:850!important;cursor:pointer!important;backdrop-filter:blur(10px)!important;');
    skip.type = 'button'; skip.textContent = 'Bỏ qua';
    root.appendChild(topPanel); root.appendChild(bottomPanel); root.appendChild(whiteBehind); root.appendChild(glow); root.appendChild(beam); root.appendChild(blade); root.appendChild(fullWhite); root.appendChild(logo); root.appendChild(skip);
    document.body.appendChild(root);
    skip.addEventListener('click', function () { closeIntro(root); });
    root.getBoundingClientRect();

    setTimeout(function () { setStyles(glow,{opacity:'.82',transform:'translate3d(-50%,-50%,0) rotate(-45deg) scaleX(.92) scaleY(.70)',filter:'blur(14px)'}); setStyles(blade,{opacity:'1',transform:'translate3d(-50%,-50%,0) rotate(-45deg) scaleX(.82)',filter:'blur(1px)'}); setStyles(beam,{opacity:'1',transform:'translate3d(-50%,-50%,0) rotate(-45deg) scaleX(.72)',filter:'blur(2px)'}); },250);
    setTimeout(function () { setStyles(glow,{opacity:'.94',transform:'translate3d(-50%,-50%,0) rotate(-45deg) scaleX(1.1) scaleY(1)',filter:'blur(11px)'}); setStyles(blade,{opacity:'1',transform:'translate3d(-50%,-50%,0) rotate(-45deg) scaleX(1.04)',filter:'blur(0)'}); setStyles(beam,{opacity:'1',transform:'translate3d(-50%,-50%,0) rotate(-45deg) scaleX(1)',filter:'blur(0)'}); setStyles(whiteBehind,{opacity:'1',transform:'translate3d(-50%,-50%,0) rotate(-45deg) scaleX(1) scaleY(1)',filter:'blur(0)'}); },640);
    setTimeout(function () { topPanel.style.transform='translate3d(-32vw,-92vh,0)'; bottomPanel.style.transform='translate3d(32vw,92vh,0)'; setStyles(glow,{opacity:'.18',transform:'translate3d(-50%,-50%,0) rotate(-45deg) scaleX(1.12) scaleY(3.0)',filter:'blur(22px)'}); setStyles(blade,{opacity:'0',transform:'translate3d(-50%,-50%,0) rotate(-45deg) scaleX(1.1)',filter:'blur(7px)'}); setStyles(beam,{opacity:'.25',filter:'blur(7px)'}); setStyles(whiteBehind,{opacity:'.92',transform:'translate3d(-50%,-50%,0) rotate(-45deg) scaleX(1.04) scaleY(4.2)',filter:'blur(7px)'}); },900);

    setTimeout(function () { fullWhite.style.opacity='1'; },1120);
    setTimeout(function () { setStyles(logo,{opacity:'.68',transform:'translate3d(-50%,-50%,0) scale(1)',filter:'blur(0)'}); },1120);
    setTimeout(function () { logo.style.opacity='0'; logo.style.transform='translate3d(-50%,-50%,0) scale(.985)'; },1900);
    setTimeout(function () { document.body.classList.remove('lhIntroRunning'); document.body.classList.add('lhIntroDone'); root.style.pointerEvents='none'; root.style.background='transparent'; topPanel.style.display='none'; bottomPanel.style.display='none'; fullWhite.style.opacity='0'; glow.style.opacity='0'; beam.style.opacity='0'; whiteBehind.style.opacity='0'; },2400);
    setTimeout(function () { closeIntro(root); },3520);
  }

  function bootIntro() {
    if (HAS_AUTH_SESSION_ON_BOOT) { setTimeout(releaseBootGuardIfAuthFailed, 5200); return; }
    setTimeout(createIntro, 120);
  }
  installAuthBootGuard();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootIntro);
  else bootIntro();
})();
// ===== LH_CINEMATIC_INTRO_JS_END =====
