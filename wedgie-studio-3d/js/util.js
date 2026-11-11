/* Wedgie Studio 3D — tiny helpers */
window.W = window.W || {};

(function () {
  'use strict';

  W.V3 = function (x, y, z) { return new THREE.Vector3(x, y, z); };
  W.C = function (hex) { return new THREE.Color(hex); };
  // Convert authored sRGB hex values into linear space for the renderer.
  W.srgb = function (hex) {
    var c = new THREE.Color(hex);
    if (c.convertSRGBToLinear) c.convertSRGBToLinear();
    return c;
  };

  W.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  W.clamp01 = function (v) { return W.clamp(v, 0, 1); };
  W.lerp = function (a, b, t) { return a + (b - a) * t; };

  // frame-rate independent smoothing toward a target
  W.damp = function (cur, tgt, speed, dt) {
    if (dt <= 0) return cur;
    var k = 1 - Math.exp(-speed * dt);
    return cur + (tgt - cur) * k;
  };

  W.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  W.range = function (a, b) { return a + Math.random() * (b - a); };
  W.extend = function (a, b) { for (var k in b) a[k] = b[k]; return a; };

  W.ease = {
    outCubic: function (t) { t = W.clamp01(t); return 1 - Math.pow(1 - t, 3); },
    inCubic: function (t) { t = W.clamp01(t); return t * t * t; },
    inOutQuad: function (t) {
      t = W.clamp01(t);
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },
    outBack: function (t) {
      t = W.clamp01(t);
      var c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    outElastic: function (t) {
      t = W.clamp01(t);
      if (t === 0 || t === 1) return t;
      var c4 = (2 * Math.PI) / 3;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
  };

  // 3-tone cel shading ramp shared by all toon materials
  var _grad = null;
  W.toonGradient = function () {
    if (_grad) return _grad;
    var data = new Uint8Array([110, 170, 225, 255]);
    _grad = new THREE.DataTexture(data, 4, 1, THREE.LuminanceFormat);
    _grad.minFilter = THREE.NearestFilter;
    _grad.magFilter = THREE.NearestFilter;
    _grad.generateMipmaps = false;
    _grad.needsUpdate = true;
    return _grad;
  };

  W.toonMat = function (color, opts) {
    opts = opts || {};
    var m = new THREE.MeshToonMaterial({
      color: W.srgb(color),
      gradientMap: W.toonGradient()
    });
    if (opts.transparent) m.transparent = true;
    if (opts.opacity !== undefined) m.opacity = opts.opacity;
    if (opts.side !== undefined) m.side = opts.side;
    if (opts.map) m.map = opts.map;
    return m;
  };

  W.basicMat = function (color, opts) {
    opts = opts || {};
    var m = new THREE.MeshBasicMaterial({ color: W.srgb(color) });
    if (opts.transparent) m.transparent = true;
    if (opts.opacity !== undefined) m.opacity = opts.opacity;
    if (opts.side !== undefined) m.side = opts.side;
    if (opts.map) m.map = opts.map;
    return m;
  };

  // ---- canvas pattern textures -------------------------------------------
  function canvasTex(draw, w, h, repX, repY) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (repX || repY) t.repeat.set(repX || 1, repY || 1);
    return t;
  }
  W.canvasTex = canvasTex;

  W.PATTERNS = {
    hearts: function (base, accent) {
      return canvasTex(function (g, w, h) {
        g.fillStyle = base; g.fillRect(0, 0, w, h);
        g.fillStyle = accent;
        var s = w / 4;
        for (var row = 0; row < 4; row++) {
          for (var col = 0; col < 4; col++) {
            var cx = col * s + (row % 2 ? s / 2 : 0) + s / 2;
            var cy = row * s + s / 2;
            var r = s * 0.22;
            g.beginPath();
            g.moveTo(cx, cy + r * 0.9);
            g.bezierCurveTo(cx - r * 1.4, cy - r * 0.4, cx - r * 0.5, cy - r * 1.3, cx, cy - r * 0.45);
            g.bezierCurveTo(cx + r * 0.5, cy - r * 1.3, cx + r * 1.4, cy - r * 0.4, cx, cy + r * 0.9);
            g.fill();
          }
        }
      }, 128, 128, 2, 1);
    },
    ducks: function (base, accent) {
      return canvasTex(function (g, w, h) {
        g.fillStyle = base; g.fillRect(0, 0, w, h);
        var s = w / 3;
        for (var row = 0; row < 3; row++) {
          for (var col = 0; col < 3; col++) {
            var cx = col * s + (row % 2 ? s / 2 : 0) + s * 0.5;
            var cy = row * s + s * 0.55;
            // body
            g.fillStyle = '#ffe066';
            g.beginPath(); g.ellipse(cx, cy, s * 0.26, s * 0.18, 0, 0, Math.PI * 2); g.fill();
            // head
            g.beginPath(); g.arc(cx - s * 0.16, cy - s * 0.16, s * 0.12, 0, Math.PI * 2); g.fill();
            // beak
            g.fillStyle = '#ff9f43';
            g.beginPath();
            g.moveTo(cx - s * 0.28, cy - s * 0.16);
            g.lineTo(cx - s * 0.40, cy - s * 0.12);
            g.lineTo(cx - s * 0.27, cy - s * 0.10);
            g.fill();
            // eye
            g.fillStyle = '#333';
            g.beginPath(); g.arc(cx - s * 0.19, cy - s * 0.19, s * 0.02, 0, Math.PI * 2); g.fill();
          }
        }
      }, 128, 128, 2, 1);
    },
    rainbow: function () {
      return canvasTex(function (g, w, h) {
        var cols = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#3fa7d6', '#7a5fd0', '#b25fd0'];
        for (var i = 0; i < cols.length; i++) {
          g.fillStyle = cols[i];
          g.fillRect(0, i * h / cols.length, w, h / cols.length + 1);
        }
      }, 64, 128, 3, 1);
    },
    dots: function (base, accent) {
      return canvasTex(function (g, w, h) {
        g.fillStyle = base; g.fillRect(0, 0, w, h);
        g.fillStyle = accent;
        var s = w / 4;
        for (var row = 0; row < 4; row++)
          for (var col = 0; col < 4; col++) {
            g.beginPath();
            g.arc(col * s + s / 2 + (row % 2 ? s / 2 : 0), row * s + s / 2, s * 0.14, 0, Math.PI * 2);
            g.fill();
          }
      }, 128, 128, 2, 1);
    },
    stars: function (base, accent) {
      return canvasTex(function (g, w, h) {
        g.fillStyle = base; g.fillRect(0, 0, w, h);
        g.fillStyle = accent;
        var s = w / 4;
        for (var row = 0; row < 4; row++)
          for (var col = 0; col < 4; col++) {
            var cx = col * s + (row % 2 ? s / 2 : 0) + s / 2, cy = row * s + s / 2, r = s * 0.24;
            g.beginPath();
            for (var i = 0; i < 10; i++) {
              var ang = -Math.PI / 2 + i * Math.PI / 5;
              var rr = i % 2 ? r * 0.45 : r;
              if (i === 0) g.moveTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr);
              else g.lineTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr);
            }
            g.closePath(); g.fill();
          }
      }, 128, 128, 2, 1);
    }
  };

  // elastic waistband texture for the stretchy band (grayscale, tinted by material color)
  W.waistbandTex = function () {
    return canvasTex(function (g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      // subtle vertical ribs
      g.fillStyle = 'rgba(0,0,0,0.06)';
      for (var x = 0; x < w; x += 4) g.fillRect(x, 0, 2, h);
      // elastic band near the waist end (v = 0 edge)
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(0, 0, w, h * 0.055);
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.fillRect(0, h * 0.055, w, h * 0.03);
    }, 32, 256, 1, 1);
  };

  // starburst sprite texture for impact flashes
  W.starTex = function () {
    return canvasTex(function (g, w, h) {
      g.clearRect(0, 0, w, h);
      var cx = w / 2, cy = h / 2;
      g.translate(cx, cy);
      g.fillStyle = '#ff5da2';
      // spiky star
      g.beginPath();
      for (var i = 0; i < 16; i++) {
        var ang = i * Math.PI / 8;
        var r = i % 2 ? h * 0.16 : h * 0.48;
        if (i === 0) g.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
        else g.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      }
      g.closePath(); g.fill();
      g.fillStyle = '#ffe066';
      g.beginPath();
      for (var j = 0; j < 16; j++) {
        var ang2 = j * Math.PI / 8;
        var r2 = j % 2 ? h * 0.10 : h * 0.30;
        if (j === 0) g.moveTo(Math.cos(ang2) * r2, Math.sin(ang2) * r2);
        else g.lineTo(Math.cos(ang2) * r2, Math.sin(ang2) * r2);
      }
      g.closePath(); g.fill();
    }, 128, 128, 1, 1);
  };

  W.disposeGroup = function (grp) {
    if (!grp) return;
    grp.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
    });
    if (grp.parent) grp.parent.remove(grp);
  };
})();
