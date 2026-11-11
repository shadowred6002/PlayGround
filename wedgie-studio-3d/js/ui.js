/* Wedgie Studio 3D — DOM UI: wardrobe, wedgie panel, bubbles, toasts, help */
window.W = window.W || {};

(function () {
  'use strict';

  W.UI = function () {
    var game = null;
    var bubbleEl = document.getElementById('bubble');
    var bubbleUntil = 0;
    var toastsEl = document.getElementById('toasts');
    var countEl = document.getElementById('wedgieCount');
    var rankEl = document.getElementById('rankChip');
    var trophiesEl = document.getElementById('trophies');
    var trophyModal = document.getElementById('trophyModal');
    var helpModal = document.getElementById('helpModal');
    var earned = {};
    var activeWedgie = null;

    var RANKS = [
      [69, 'nice.'],
      [50, 'Wedgie Legend'],
      [25, 'Wedgie Master'],
      [10, 'Wedgie Apprentice'],
      [5, 'Prankster'],
      [0, 'Rookie']
    ];

    function rankFor(n) {
      for (var i = 0; i < RANKS.length; i++) if (n >= RANKS[i][0]) return RANKS[i][1];
      return 'Rookie';
    }

    /* ---------------- speech bubble ---------------- */
    function say(text, dur) {
      dur = dur || 2.6;
      bubbleEl.textContent = text;
      bubbleEl.classList.remove('show');
      // restart the pop animation
      bubbleEl.style.animation = 'none';
      void bubbleEl.offsetWidth;
      bubbleEl.style.animation = '';
      bubbleEl.classList.add('show');
      bubbleUntil = performance.now() + dur * 1000;
      W.sfx.unlock();
    }

    function updateBubble(x, y, visible) {
      if (performance.now() > bubbleUntil || !visible) {
        bubbleEl.classList.remove('show');
        return;
      }
      bubbleEl.style.left = x + 'px';
      bubbleEl.style.top = y + 'px';
    }

    /* ---------------- toasts ---------------- */
    function toast(html, cls, dur) {
      var el = document.createElement('div');
      el.className = 'toast ' + (cls || '');
      el.innerHTML = html;
      toastsEl.appendChild(el);
      setTimeout(function () {
        el.classList.add('out');
        setTimeout(function () { el.remove(); }, 400);
      }, dur || 2800);
    }

    function toastAchievement(def) {
      earned[def.id] = true;
      updateTrophyCount();
      toast('<span class="trophy-emoji">🏆</span><span class="toast-body"><b>' + def.title + '</b><i>' + def.desc + '</i></span>', 'achieve', 3600);
      W.sfx.tada();
    }

    function markAchievement(id) {
      earned[id] = true;
      updateTrophyCount();
    }

    function updateTrophyCount() {
      var n = 0;
      for (var k in earned) n++;
      trophiesEl.querySelector('.count').textContent = n;
      trophiesEl.classList.toggle('has', n > 0);
    }

    /* ---------------- counter ---------------- */
    function setCount(n) {
      countEl.textContent = n;
      rankEl.textContent = rankFor(n);
    }

    function bumpCounter() {
      var pill = document.getElementById('counterPill');
      pill.classList.remove('bump');
      void pill.offsetWidth;
      pill.classList.add('bump');
      W.sfx.pop();
    }

    /* ---------------- wardrobe ---------------- */
    function el(tag, cls, html) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (html !== undefined) e.innerHTML = html;
      return e;
    }

    function buildWardrobe() {
      var body = document.getElementById('wardrobeBody');
      body.innerHTML = '';
      var wd = W.WARDROBE;
      Object.keys(wd).forEach(function (cat) {
        var def = wd[cat];
        var sec = el('section', 'wsec');
        var head = el('div', 'wsec-head');
        head.innerHTML = '<span class="wicon">' + def.icon + '</span><span>' + def.label + '</span>';
        sec.appendChild(head);

        var items = el('div', 'witems');
        def.items.forEach(function (item) {
          var b = el('button', 'witem', item.name);
          b.dataset.cat = cat;
          b.dataset.id = item.id;
          if (cat === 'skin') {
            b.classList.add('swatch-item');
            b.innerHTML = '<span class="dot" style="background:' + item.color + '"></span>' + item.name;
          }
          b.addEventListener('click', function () {
            if (cat === 'skin') game.equip('skin', null, item.color);
            else game.equip(cat, item.id);
            refreshWardrobe();
            W.sfx.unlock();
          });
          items.appendChild(b);
        });
        sec.appendChild(items);

        if (def.colors) {
          var sw = el('div', 'wcolors');
          def.colors.forEach(function (c) {
            var s = el('button', 'swatch');
            s.style.background = c;
            s.dataset.cat = cat;
            s.dataset.color = c;
            s.title = c;
            s.addEventListener('click', function () {
              game.equip(cat, undefined, c);
              refreshWardrobe();
              W.sfx.unlock();
            });
            sw.appendChild(s);
          });
          sec.appendChild(sw);
        }

        if (def.plainColors) {
          var sw2 = el('div', 'wcolors plain-colors');
          def.plainColors.forEach(function (c) {
            var s2 = el('button', 'swatch');
            s2.style.background = c;
            s2.dataset.cat = 'undies';
            s2.dataset.color = c;
            s2.title = 'Plain briefs colour';
            s2.addEventListener('click', function () {
              game.equip('undies', 'undies_plain', c);
              refreshWardrobe();
              W.sfx.unlock();
            });
            sw2.appendChild(s2);
          });
          sec.appendChild(sw2);
        }

        body.appendChild(sec);
      });
    }

    function refreshWardrobe() {
      if (!game) return;
      var outfit = game.char.outfit;
      var nodes = document.querySelectorAll('.witem');
      for (var i = 0; i < nodes.length; i++) {
        var b = nodes[i];
        var cat = b.dataset.cat, id = b.dataset.id;
        var sel = false;
        if (cat === 'skin') {
          var def = W.WARDROBE.skin.items.filter(function (it) { return it.id === id; })[0];
          sel = def && outfit.skin === def.color;
        } else {
          sel = outfit[cat] && outfit[cat].id === id;
        }
        b.classList.toggle('sel', !!sel);
      }
      var sws = document.querySelectorAll('.swatch[data-color]');
      for (var j = 0; j < sws.length; j++) {
        var s = sws[j];
        var c = s.dataset.color;
        var cc = s.dataset.cat;
        var sel2 = false;
        if (cc === 'undies') sel2 = outfit.undies.id === 'undies_plain' && outfit.undies.color === c;
        else if (outfit[cc] && outfit[cc].color) sel2 = outfit[cc].color === c;
        s.classList.toggle('sel', sel2);
      }
      // plain colour palette only makes sense for plain briefs
      var plainRows = document.querySelectorAll('.plain-colors');
      for (var q = 0; q < plainRows.length; q++) {
        plainRows[q].style.display = outfit.undies.id === 'undies_plain' ? 'flex' : 'none';
      }
    }

    /* ---------------- wedgie buttons ---------------- */
    function buildWedgiePanel() {
      var wrap = document.getElementById('wedgieButtons');
      wrap.innerHTML = '';
      W.WEDGIE_ORDER.forEach(function (id) {
        var def = W.WEDGIES[id];
        var b = el('button', 'wbtn');
        b.dataset.wid = id;
        b.title = def.tip;
        b.innerHTML = '<span class="wemoji">' + def.emoji + '</span><span class="wlabel">' + def.label + '</span>';
        b.addEventListener('click', function () {
          game.startWedgie(id);
          W.sfx.unlock();
        });
        wrap.appendChild(b);
      });
    }

    function tickWedgie(id) {
      if (id === activeWedgie) return;
      activeWedgie = id;
      var nodes = document.querySelectorAll('.wbtn');
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].classList.toggle('active', nodes[i].dataset.wid === id);
      }
      document.getElementById('btnRelease').classList.toggle('hot', !!id);
    }

    /* ---------------- trophies modal ---------------- */
    function buildTrophyModal() {
      var list = trophyModal.querySelector('.trophy-list');
      list.innerHTML = '';
      var all = [];
      // gather achievement defs from wedgies.js via game lookup? They live in closure;
      // mirror them here:
      all = [
        ['wedgie1', 'First Wedgie!', 'Riley’s seams will remember this.'],
        ['atomic1', 'Atomic Achieved', 'Waistband over the head.'],
        ['all8', 'Wedgie Encyclopedia', 'Tried all eight wedgies.'],
        ['total10', 'Wedgie Apprentice', '10 wedgies given.'],
        ['total25', 'Wedgie Master', '25 wedgies given.'],
        ['total50', 'Wedgie Legend', '50 wedgies given.'],
        ['nice', 'nice.', '69 wedgies. Nice.'],
        ['hang10', 'Certifiable Coat Hanger', 'Left Riley hanging for 10+ seconds.'],
        ['bounce20', 'Human Yo-Yo', '20 bounces in one go.'],
        ['rip', 'These Were LUCKY?!', 'Witnessed an underwear structural failure.'],
        ['skirt', 'Bold Fashion Choice', 'Wedgied Riley while wearing a skirt.']
      ];
      all.forEach(function (a) {
        var got = !!earned[a[0]];
        var row = el('div', 'trophy-row' + (got ? ' got' : ''));
        row.innerHTML = '<span class="tr-ico">' + (got ? '🏆' : '🔒') + '</span><span class="tr-body"><b>' + a[1] + '</b><i>' + (got ? a[2] : '???') + '</i></span>';
        list.appendChild(row);
      });
    }

    function openTrophies() {
      buildTrophyModal();
      trophyModal.classList.add('open');
    }
    function closeTrophies() { trophyModal.classList.remove('open'); }

    /* ---------------- help ---------------- */
    function openHelp() { helpModal.classList.add('open'); }
    function closeHelp() { helpModal.classList.remove('open'); }

    /* ---------------- sound ---------------- */
    var muted = false;
    function updateSoundBtn() {
      document.getElementById('btnSound').textContent = muted ? '🔇' : '🔊';
    }

    /* ---------------- wire up ---------------- */
    function bind(g) {
      game = g;
      buildWardrobe();
      buildWedgiePanel();
      refreshWardrobe();
      setCount(g.getTotal());

      document.getElementById('btnRelease').addEventListener('click', function () {
        g.release();
        W.sfx.unlock();
      });
      document.getElementById('btnRandom').addEventListener('click', function () {
        g.randomize();
        refreshWardrobe();
      });
      document.getElementById('btnStrip').addEventListener('click', function () {
        g.strip();
        refreshWardrobe();
      });
      document.getElementById('btnSound').addEventListener('click', function () {
        muted = !muted;
        W.sfx.setMuted(muted);
        updateSoundBtn();
      });
      document.getElementById('btnHelp').addEventListener('click', openHelp);
      document.getElementById('helpClose').addEventListener('click', closeHelp);
      helpModal.addEventListener('click', function (e) { if (e.target === helpModal) closeHelp(); });
      trophiesEl.addEventListener('click', openTrophies);
      trophyModal.querySelector('.modal-close').addEventListener('click', closeTrophies);
      trophyModal.addEventListener('click', function (e) { if (e.target === trophyModal) closeTrophies(); });

      document.getElementById('btnWardrobe').addEventListener('click', function () {
        document.getElementById('wardrobe').classList.toggle('open');
      });

      // reveal the game
      document.getElementById('loading').classList.add('done');
      setTimeout(function () { document.getElementById('loading').remove(); }, 900);

      var seenHelp = false;
      try { seenHelp = !!localStorage.getItem('ws3d-help-seen'); } catch (e) {}
      if (!seenHelp) {
        setTimeout(function () {
          openHelp();
          try { localStorage.setItem('ws3d-help-seen', '1'); } catch (e) {}
        }, 900);
      }
    }

    updateSoundBtn();

    return {
      bind: bind,
      say: say,
      updateBubble: updateBubble,
      toast: toast,
      toastAchievement: toastAchievement,
      markAchievement: markAchievement,
      setCount: setCount,
      bumpCounter: bumpCounter,
      tickWedgie: tickWedgie,
      refreshWardrobe: refreshWardrobe,
      openHelp: openHelp
    };
  };
})();
