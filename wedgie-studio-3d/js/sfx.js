/* Wedgie Studio 3D — cartoon sound effects, all synthesized (no assets) */
window.W = window.W || {};

(function () {
  'use strict';

  var ctx = null, master = null, muted = false;

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  function env(g, t0, a, peak, d) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }

  function osc(type, f0, f1, t0, dur, peak, dest) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(1, f0), t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    env(g, t0, 0.008, peak, dur);
    o.connect(g); g.connect(dest || master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function noise(t0, dur, peak, filterType, f0, f1, q) {
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource(); src.buffer = buf;
    var fl = ctx.createBiquadFilter();
    fl.type = filterType || 'bandpass';
    fl.frequency.setValueAtTime(f0 || 800, t0);
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    fl.Q.value = q || 1;
    var g = ctx.createGain();
    env(g, t0, 0.01, peak, dur);
    src.connect(fl); fl.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  var api = {
    setMuted: function (m) { muted = m; if (master) master.gain.value = m ? 0 : 0.5; },
    isMuted: function () { return muted; },
    unlock: ensure,

    // classic spring boing — pitch scales with intensity
    boing: function (intensity) {
      if (!ensure()) return;
      intensity = W.clamp(intensity === undefined ? 1 : intensity, 0.2, 2);
      var t = ctx.currentTime;
      var f = 320 / intensity;
      osc('sine', f, f * 0.18, t, 0.5, 0.35);
      osc('sine', f * 2.02, f * 0.36, t, 0.28, 0.12);
      // twangy overtone
      osc('triangle', f * 3, f * 0.5, t, 0.12, 0.08);
    },

    // elastic stretch squeak
    creak: function (pitch) {
      if (!ensure()) return;
      pitch = pitch || 1;
      var t = ctx.currentTime;
      osc('triangle', 130 * pitch, 235 * pitch, t, 0.16, 0.09);
      osc('sawtooth', 65 * pitch, 120 * pitch, t, 0.14, 0.028);
    },

    // big yank
    yank: function () {
      if (!ensure()) return;
      var t = ctx.currentTime;
      osc('sine', 260, 90, t, 0.22, 0.22);
      noise(t, 0.16, 0.10, 'bandpass', 500, 1600, 2);
    },

    pop: function () {
      if (!ensure()) return;
      var t = ctx.currentTime;
      osc('square', 380, 760, t, 0.05, 0.10);
      noise(t, 0.05, 0.12, 'bandpass', 900, 1400, 3);
    },

    whoosh: function () {
      if (!ensure()) return;
      var t = ctx.currentTime;
      noise(t, 0.32, 0.14, 'bandpass', 280, 1500, 1.2);
    },

    thud: function () {
      if (!ensure()) return;
      var t = ctx.currentTime;
      osc('sine', 105, 38, t, 0.22, 0.42);
      noise(t, 0.08, 0.10, 'lowpass', 500, 200, 1);
    },

    clank: function () {
      if (!ensure()) return;
      var t = ctx.currentTime;
      osc('square', 620, 300, t, 0.09, 0.07);
      osc('square', 1240, 600, t, 0.06, 0.04);
    },

    snap: function () {
      if (!ensure()) return;
      var t = ctx.currentTime;
      noise(t, 0.07, 0.30, 'highpass', 1800, 3200, 1);
      osc('sine', 900, 200, t, 0.09, 0.12);
    },

    // underwear catastrophically failing
    rip: function () {
      if (!ensure()) return;
      var t = ctx.currentTime;
      for (var i = 0; i < 4; i++) {
        noise(t + i * 0.07, 0.05, 0.22, 'highpass', 900 + i * 350, 2000, 2);
      }
      noise(t + 0.30, 0.26, 0.30, 'bandpass', 500, 2400, 1.6);
      osc('sawtooth', 240, 60, t + 0.3, 0.25, 0.10);
    },

    // happy little fanfare when Riley recovers
    tada: function () {
      if (!ensure()) return;
      var t = ctx.currentTime;
      var notes = [523.25, 659.25, 783.99];
      for (var i = 0; i < notes.length; i++) {
        osc('triangle', notes[i], notes[i], t + i * 0.09, 0.22, 0.12);
      }
      osc('sine', 1046.5, 1046.5, t + 0.27, 0.30, 0.10);
    }
  };

  W.sfx = api;
})();
