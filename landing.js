/* ==========================================================================
   Black IDE — landing page animation layer
   --------------------------------------------------------------------------
   Four independent modules, all opt-out under prefers-reduced-motion:

     1. reveal()      scroll-triggered entrance for .reveal
     2. viewGate()    adds .in-view to [data-animate] so CSS loops only run
                      while the card is on screen
     3. counters()    hero stat count-up
     4. modeCycle()   agent-role carousel
     5. ideDemo()     the scripted IDE walkthrough

   Nothing here runs a timer while its subject is off screen.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* ---------------------------------------------------------------- 1. reveal */
  function reveal() {
    var els = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        io.unobserve(e.target);           // entrance is one-shot
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------- 2. viewGate */
  /* CSS keyframes are declared paused; this is what starts and stops them.
     Unlike reveal(), this observer keeps watching so scrolling away parks the
     animation instead of burning frames off screen. */
  function viewGate() {
    var els = document.querySelectorAll('[data-animate]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.classList.toggle('in-view', e.isIntersecting);
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------- 3. counters */
  function counters() {
    var els = document.querySelectorAll('[data-count]');
    var run = function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var unit = el.querySelector('.unit');
      var suffix = unit ? unit.outerHTML : '';
      if (reduceMotion || target === 0) { el.innerHTML = target + suffix; return; }

      var start = performance.now();
      var dur = 1100;
      var settled = false;
      var settle = function () {
        if (settled) return;
        settled = true;
        el.innerHTML = target + suffix;
      };

      var tick = function (now) {
        if (settled) return;
        var p = Math.min((now - start) / dur, 1);
        if (p >= 1) return settle();
        var eased = 1 - Math.pow(1 - p, 3);          // easeOutCubic
        el.innerHTML = Math.round(target * eased) + suffix;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      /* rAF is not guaranteed to keep firing — throttled background tabs and
         headless renderers both drop it mid-run, which would strand the number
         short of its target forever. This backstop makes the final value
         independent of frame delivery. */
      setTimeout(settle, dur + 120);
    };

    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* --------------------------------------------------------- 4. mode carousel */
  var MODES = [
    {
      name: 'Frontend', chip: 'Frontend',
      cfg: ['<span class="cmt"># .blackide/modes/frontend.md</span>',
            '<span class="key">name</span>: Frontend',
            '<span class="key">tools</span>: [read_file, edit_file, run_command]',
            '<span class="key">maxIterations</span>: 40']
    },
    {
      name: 'Sr Architect', chip: 'Sr Architect',
      cfg: ['<span class="cmt"># built-in role</span>',
            '<span class="key">name</span>: Sr Architect',
            '<span class="key">tools</span>: [read_file, grep_search, create_artifact]',
            '<span class="key">maxIterations</span>: 20']
    },
    {
      name: 'Security Auditor', chip: 'Security Auditor',
      cfg: ['<span class="cmt"># .blackide/modes/auditor.md</span>',
            '<span class="key">name</span>: Security Auditor',
            '<span class="key">tools</span>: [read_file, grep_search, complete_task]',
            '<span class="key">icon</span>: shield']
    },
    {
      name: 'Manager', chip: 'Manager',
      cfg: ['<span class="cmt"># built-in role</span>',
            '<span class="key">name</span>: Manager',
            '<span class="key">tools</span>: [spawn_subagent, update_plan]',
            '<span class="key">maxIterations</span>: 15']
    }
  ];

  var CHIPS = ['Ask', 'Plan', 'Agent', 'Frontend', 'Backend', 'DevOps', 'Manager', 'Sr Architect', 'Security Auditor'];

  function modeCycle() {
    var chipWrap = document.getElementById('mode-chips');
    var cfgWrap = document.getElementById('mode-config');
    if (!chipWrap || !cfgWrap) return;

    CHIPS.forEach(function (c) {
      var el = document.createElement('span');
      el.className = 'chip';
      el.textContent = c;
      el.dataset.chip = c;
      chipWrap.appendChild(el);
    });

    var i = 0;
    var render = function () {
      var mode = MODES[i % MODES.length];
      chipWrap.querySelectorAll('.chip').forEach(function (el) {
        el.classList.toggle('on', el.dataset.chip === mode.chip);
      });
      cfgWrap.classList.remove('swap');
      cfgWrap.innerHTML = mode.cfg.map(function (l) { return '<div>' + l + '</div>'; }).join('');
      // next frame so the transition has a start state to animate from
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { cfgWrap.classList.add('swap'); });
      });
      i++;
    };

    render();
    if (reduceMotion) return;

    var timer = null;
    var card = cfgWrap.closest('[data-animate]');
    var start = function () { if (!timer) timer = setInterval(render, 2600); };
    var stop = function () { clearInterval(timer); timer = null; };

    if (card && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }, { threshold: 0.2 }).observe(card);
    } else {
      start();
    }
  }

  /* ------------------------------------------------------------- 5. IDE demo */

  // Base file state. `lc` is pre-escaped markup, `n` is the gutter number.
  var BASE = [
    { n: 1, lc: '<span class="k">use</span> crate::jwt::{<span class="t">Keyset</span>, verify_jwt};' },
    { n: 2, lc: '' },
    { n: 3, lc: '<span class="k">pub async fn</span> <span class="f">refresh</span>(&amp;<span class="k">mut self</span>) -&gt; <span class="t">Result</span>&lt;()&gt; {' },
    { n: 4, lc: '    <span class="k">let</span> raw = <span class="k">self</span>.store.<span class="f">load</span>()<span class="p">?</span>;' },
    { n: 5, lc: '    <span class="f">verify_token</span>(&amp;raw)<span class="p">?</span>;' },
    { n: 6, lc: '    <span class="k">Ok</span>(())' },
    { n: 7, lc: '}' }
  ];

  var PATCH = [
    { n: 5, lc: '    <span class="f">verify_jwt</span>(&amp;raw, &amp;<span class="k">self</span>.keyset)<span class="p">?</span>;', cls: 'added' },
    { n: 6, lc: '    <span class="f">refresh_if_expiring</span>(&amp;<span class="k">mut self</span>.store)<span class="p">?</span>;', cls: 'added' }
  ];

  function ideDemo() {
    var root = document.getElementById('ide-demo');
    var editor = document.getElementById('demo-editor');
    var stream = document.getElementById('demo-stream');
    var toast = document.getElementById('demo-toast');
    var modeEl = document.getElementById('demo-mode');
    var tab = document.getElementById('demo-tab');
    var branch = document.getElementById('demo-branch');
    if (!root || !editor || !stream) return;

    /* --- DOM helpers --------------------------------------------------- */
    var lineEl = function (l) {
      var d = document.createElement('div');
      d.className = 'code-line' + (l.cls ? ' ' + l.cls : '');
      d.innerHTML = '<span class="ln">' + l.n + '</span><span class="lc">' + l.lc + '</span>';
      return d;
    };

    var renderBase = function () {
      // Keep the toast node — it lives inside the editor as a positioned child.
      editor.querySelectorAll('.code-line').forEach(function (n) { n.remove(); });
      BASE.forEach(function (l) { editor.insertBefore(lineEl(l), toast); });
    };

    var msg = function (cls, html) {
      var d = document.createElement('div');
      d.className = 'agent-msg ' + cls;
      d.innerHTML = html;
      stream.appendChild(d);
      requestAnimationFrame(function () { d.classList.add('shown'); });
      return d;
    };

    var typeInto = function (el, text, speed) {
      return new Promise(function (resolve) {
        if (reduceMotion) { el.textContent = text; return resolve(); }
        var i = 0;
        var caret = document.createElement('span');
        caret.className = 'caret';
        el.appendChild(caret);
        var tick = function () {
          if (!alive) return resolve();
          el.insertBefore(document.createTextNode(text[i]), caret);
          if (++i >= text.length) { caret.remove(); return resolve(); }
          setTimeout(tick, speed);
        };
        setTimeout(tick, speed);
      });
    };

    /* --- visibility gate ----------------------------------------------- */
    var visible = true;
    var alive = true;
    var waiters = [];

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) { waiters.splice(0).forEach(function (r) { r(); }); }
      }, { threshold: 0.12 }).observe(root);
    }

    // Resolve immediately when visible, otherwise park until it scrolls back in.
    var gate = function () {
      if (visible) return Promise.resolve();
      return new Promise(function (r) { waiters.push(r); });
    };

    var wait = function (ms) { return gate().then(function () { return sleep(ms); }); };

    /* --- one full cycle ------------------------------------------------- */
    function cycle() {
      // reset
      stream.innerHTML = '';
      renderBase();
      toast.classList.remove('show');
      tab.classList.remove('is-dirty');
      modeEl.textContent = 'plan';
      modeEl.classList.remove('exec');
      branch.textContent = 'main';

      var progressEl;

      return wait(900)
        // 1 — the developer asks for something
        .then(function () {
          var m = msg('user', '');
          return typeInto(m, 'Fix the token refresh race in auth.rs', 34);
        })
        .then(function () { return wait(500); })

        // 2 — read-only research phase
        .then(function () { return runTool('semantic_search', '"token refresh"', 900); })
        .then(function () { return runTool('read_file', 'src/auth.rs', 700); })
        .then(function () { return runTool('grep_search', '"verify_token"', 650); })

        // 3 — plan artifacts, then the approval gate
        .then(function () { return wait(300); })
        .then(function () {
          var card = msg('plan-card',
            '<div class="plan-title">Plan ready · review</div>' +
            '<div class="plan-artifacts">' +
              '<span>📄 implementation_plan.md</span>' +
              '<span>📄 task_list.md</span>' +
            '</div>' +
            '<div class="plan-actions">' +
              '<span class="plan-btn approve" id="demo-approve">Approve &amp; Execute</span>' +
              '<span class="plan-btn">Reject</span>' +
            '</div>');
          return wait(1500).then(function () { return card; });
        })

        // 4 — the approval "click"
        .then(function () {
          var btn = document.getElementById('demo-approve');
          if (btn) btn.classList.add('clicked');
          return wait(650);
        })
        .then(function () {
          modeEl.textContent = 'agent';
          modeEl.classList.add('exec');
          branch.textContent = 'agent/token-refresh';
          progressEl = msg('', '<div class="agent-progress"><i></i></div>');
          return wait(250);
        })

        // 5 — execution: the patch streams into the buffer
        .then(function () {
          var bar = progressEl.querySelector('i');
          if (bar) bar.style.width = '35%';
          return runTool('apply_diff', 'src/auth.rs', 500);
        })
        .then(function () {
          var lines = editor.querySelectorAll('.code-line');
          var target = lines[4];                      // the verify_token line
          if (target) target.classList.add('removed');
          return wait(600);
        })
        .then(function () {
          var lines = editor.querySelectorAll('.code-line');
          var anchor = lines[5] || toast;
          var seq = Promise.resolve();
          PATCH.forEach(function (l, idx) {
            seq = seq.then(function () {
              return gate().then(function () {
                var el = lineEl(l);
                el.classList.add('streamed');
                editor.insertBefore(el, anchor);
                requestAnimationFrame(function () { el.classList.add('shown'); });
                tab.classList.add('is-dirty');
                return sleep(idx === 0 ? 420 : 300);
              });
            });
          });
          return seq;
        })
        .then(function () {
          var bar = progressEl.querySelector('i');
          if (bar) bar.style.width = '100%';
          return runTool('write_artifact', 'walkthrough.md', 600);
        })

        // 6 — checkpoint + summary, then hold before looping
        .then(function () {
          toast.classList.add('show');
          msg('', '<div class="tool-call done"><span class="glyph"></span>Task complete · 2 hunks staged</div>');
          return wait(4200);
        })
        .then(function () {
          toast.classList.remove('show');
          return wait(500);
        });

      // Renders a tool row, holds, then flips it to the done state.
      function runTool(name, arg, dur) {
        return gate().then(function () {
          var row = msg('', '<div class="tool-call"><span class="glyph"></span>' + name +
            '(<span class="arg">' + arg + '</span>)</div>');
          return sleep(dur).then(function () {
            var tc = row.querySelector('.tool-call');
            if (tc) tc.classList.add('done');
            return sleep(160);
          });
        });
      }
    }

    /* --- run forever ---------------------------------------------------- */
    if (reduceMotion) {
      // Static end-state: show the finished patch, no timers.
      renderBase();
      var lines = editor.querySelectorAll('.code-line');
      if (lines[4]) lines[4].classList.add('removed');
      // Insert the patch in place (before `Ok(())`), matching where the
      // animated path streams it — appending would put it after the closing
      // brace and read as corrupted output.
      var anchor = lines[5] || toast;
      PATCH.forEach(function (l) { editor.insertBefore(lineEl(l), anchor); });
      msg('user', 'Fix the token refresh race in auth.rs');
      msg('', '<div class="tool-call done"><span class="glyph"></span>Task complete · 2 hunks staged</div>');
      modeEl.textContent = 'agent';
      modeEl.classList.add('exec');
      return;
    }

    (function loop() {
      if (!alive) return;
      cycle().then(loop);
    })();

    // Stop cleanly if the tab is torn down mid-cycle.
    window.addEventListener('pagehide', function () { alive = false; });
  }

  /* ---------------------------------------------------- 6. pointer-tracked glow */
  function pointerGlow() {
    if (reduceMotion || !window.matchMedia('(hover: hover)').matches) return;
    document.querySelectorAll('.feat').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ------------------------------------------------------------------ boot */
  function boot() {
    reveal();
    viewGate();
    counters();
    modeCycle();
    pointerGlow();
    ideDemo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
