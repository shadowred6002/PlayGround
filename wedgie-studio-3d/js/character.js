/* Wedgie Studio 3D — Riley: a chunky cartoon rig + wardrobe.
   Riley is an adult cartoon character. Everything is built procedurally
   (cylinders, spheres, boxes) so outfits and poses can be swapped freely. */
window.W = window.W || {};

(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  small mesh helpers
   * ------------------------------------------------------------------ */
  function M(geo, mat, x, y, z) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    return m;
  }
  function G(x, y, z, parent) {
    var g = new THREE.Group();
    g.position.set(x || 0, y || 0, z || 0);
    if (parent) parent.add(g);
    return g;
  }
  function cyl(rt, rb, h, seg) { return new THREE.CylinderGeometry(rt, rb, h, seg || 14); }
  function sph(r, w, h) { return new THREE.SphereGeometry(r, w || 16, h || 12); }
  function box(w, h, d) { return new THREE.BoxGeometry(w, h, d); }
  function torus(r, t, arc) { return new THREE.TorusGeometry(r, t, 8, 20, arc || Math.PI * 2); }
  function skullCap(r, frac, mat, y, z) {
    return M(new THREE.SphereGeometry(r, 20, 12, 0, Math.PI * 2, 0, Math.PI * frac), mat, 0, y || 0, z || 0);
  }

  /* ------------------------------------------------------------------ *
   *  build the character
   * ------------------------------------------------------------------ */
  W.buildCharacter = function () {
    var skinMat = W.toonMat('#f6c39c');
    var noseMat = W.toonMat('#e5a377');

    var root = G(0, 0, 0);

    // --- pelvis / hips --------------------------------------------------
    var pelvis = G(0, 0.95, 0, root);
    var pelvisMesh = M(sph(0.15, 18, 14), skinMat, 0, 0, 0);
    pelvisMesh.scale.set(1.06, 0.85, 1.02);
    pelvis.add(pelvisMesh);

    // --- torso ----------------------------------------------------------
    var torso = G(0, 0.10, 0, pelvis);
    torso.add(M(cyl(0.165, 0.15, 0.44, 16), skinMat, 0, 0.22, 0));
    var belly = M(sph(0.15, 16, 12), skinMat, 0, 0.13, 0.035);
    belly.scale.set(0.98, 0.82, 0.92);
    torso.add(belly);

    // --- neck & head ----------------------------------------------------
    var neck = G(0, 0.46, 0, torso);
    neck.add(M(cyl(0.052, 0.06, 0.1, 10), skinMat, 0, 0.03, 0));
    var head = G(0, 0.08, 0, neck);
    head.add(M(sph(0.155, 24, 18), skinMat, 0, 0.12, 0));

    var earL = M(sph(0.036, 10, 8), skinMat, -0.148, 0.10, 0.01); earL.scale.set(0.6, 1, 1);
    var earR = earL.clone(); earR.position.x = 0.148;
    head.add(earL, earR);

    // --- face (all relative to skull centre via faceRoot) ---------------
    var faceRoot = G(0, 0.12, 0, head);
    var whiteMat = W.basicMat('#ffffff');
    var darkMat = W.basicMat('#2b2340');
    var mouthMat = W.basicMat('#7c3a44');
    var tongueMat = W.basicMat('#ff8fa3');
    var browMat = W.basicMat('#5b3a29'); // tinted with hair colour
    var blushMatL = W.basicMat('#ff8fa3', { transparent: true, opacity: 0.35 });

    var eyeL = M(sph(0.036, 12, 10), whiteMat, -0.058, -0.005, 0.128);
    var eyeR = M(sph(0.036, 12, 10), whiteMat, 0.058, -0.005, 0.128);
    var pupilL = M(sph(0.018, 8, 8), darkMat, -0.058, -0.002, 0.152);
    var pupilR = M(sph(0.018, 8, 8), darkMat, 0.058, -0.002, 0.152);
    faceRoot.add(eyeL, eyeR, pupilL, pupilR);

    var xL = G(-0.058, -0.005, 0.152, faceRoot); xL.visible = false;
    var xR = G(0.058, -0.005, 0.152, faceRoot); xR.visible = false;
    [xL, xR].forEach(function (xg) {
      var b1 = M(box(0.062, 0.012, 0.012), darkMat, 0, 0, 0); b1.rotation.z = Math.PI / 4;
      var b2 = b1.clone(); b2.rotation.z = -Math.PI / 4;
      xg.add(b1, b2);
    });

    var browL = M(box(0.078, 0.013, 0.02), browMat, -0.062, 0.066, 0.132);
    var browR = M(box(0.078, 0.013, 0.02), browMat, 0.062, 0.066, 0.132);
    faceRoot.add(browL, browR);

    faceRoot.add(M(sph(0.027, 10, 8), noseMat, 0, -0.048, 0.152)); // nose

    // mouth: torus smile (flips into a frown), round "O", gritted teeth, tongue
    var smile = M(torus(0.05, 0.013, 8, 20, 2.4), mouthMat, 0, -0.088, 0.146);
    smile.rotation.z = -2.77;
    var oMouth = M(sph(0.034, 12, 10), mouthMat, 0, -0.092, 0.144);
    var teeth = M(box(0.078, 0.02, 0.012), whiteMat, 0, -0.086, 0.151); teeth.visible = false;
    var tongue = M(box(0.05, 0.026, 0.02), tongueMat, 0, -0.108, 0.148); tongue.visible = false;
    faceRoot.add(smile, oMouth, teeth, tongue);

    [[-1, blushMatL], [1, blushMatL.clone()]].forEach(function (pair) {
      var n = W.V3(0.576 * pair[0], -0.424, 0.697).normalize();
      var b = M(sph(0.031, 10, 8), pair[1], n.x * 0.152, n.y * 0.152, n.z * 0.152);
      b.quaternion.setFromUnitVectors(W.V3(0, 0, 1), n);
      b.scale.set(1.15, 0.8, 0.24);
      faceRoot.add(b);
    });

    // --- arms -----------------------------------------------------------
    function buildArm(side) {
      var sh = G(0.205 * side, 0.40, 0, torso);
      sh.add(M(sph(0.062, 12, 10), skinMat, 0, 0.01, 0));
      sh.add(M(cyl(0.05, 0.046, 0.26, 10), skinMat, 0, -0.13, 0));
      var el = G(0, -0.26, 0, sh);
      el.add(M(cyl(0.044, 0.04, 0.24, 10), skinMat, 0, -0.12, 0));
      var hand = G(0, -0.25, 0, el);
      var hm = M(sph(0.052, 10, 8), skinMat, 0, -0.02, 0.01);
      hm.scale.set(1, 1.25, 0.95);
      hand.add(hm);
      return { sh: sh, el: el, hand: hand };
    }
    var armL = buildArm(-1), armR = buildArm(1);

    // --- legs -----------------------------------------------------------
    function buildLeg(side) {
      var hip = G(0.11 * side, -0.06, 0, pelvis);
      hip.add(M(cyl(0.075, 0.066, 0.42, 12), skinMat, 0, -0.21, 0));
      var knee = G(0, -0.42, 0, hip);
      knee.add(M(cyl(0.062, 0.052, 0.40, 12), skinMat, 0, -0.20, 0));
      var ankle = G(0, -0.40, 0, knee);
      ankle.add(M(box(0.105, 0.06, 0.235), skinMat, 0, -0.025, 0.055));
      var toe = M(sph(0.05, 10, 8), skinMat, 0, -0.03, 0.16); toe.scale.set(1, 0.55, 1);
      ankle.add(toe);
      return { hip: hip, knee: knee, ankle: ankle };
    }
    var legL = buildLeg(-1), legR = buildLeg(1);

    /* ------------------------------------------------------------------ *
     *  outfit holder groups (cleared & rebuilt by the wardrobe)
     * ------------------------------------------------------------------ */
    var holders = {
      hair: [G(0, 0.12, 0, head)],
      top: [G(0, 0, 0, torso), G(0, 0, 0, armL.sh), G(0, 0, 0, armR.sh), G(0, 0, 0, armL.el), G(0, 0, 0, armR.el)],
      bottom: [G(0, 0, 0, pelvis), G(0, 0, 0, legL.hip), G(0, 0, 0, legR.hip), G(0, 0, 0, legL.knee), G(0, 0, 0, legR.knee), G(0, 0, 0, legL.ankle), G(0, 0, 0, legR.ankle)],
      undies: [G(0, 0, 0, pelvis), G(0, 0, 0, legL.hip), G(0, 0, 0, legR.hip)],
      shoes: [G(0, 0, 0, legL.ankle), G(0, 0, 0, legR.ankle)],
      acc: [G(0, 0.12, 0, head)]
    };

    // remember each holder's home joint so flown-off pieces can be re-attached
    var holderMeta = [];
    ['hair', 'top', 'bottom', 'undies', 'shoes', 'acc'].forEach(function (cat) {
      holders[cat].forEach(function (h) {
        var home = h.parent;
        var pos = h.position.clone();
        holderMeta.push({ group: h, home: home, pos: pos });
      });
    });

    function reattach(cat) {
      holderMeta.forEach(function (m) {
        if (holders[cat].indexOf(m.group) < 0) return;
        if (m.group.parent !== m.home) m.home.add(m.group);
        m.group.visible = true;
        m.group.position.copy(m.pos);
        m.group.rotation.set(0, 0, 0);
        m.group.scale.set(1, 1, 1);
      });
    }

    function clearHolders(cat) {
      reattach(cat);
      holders[cat].forEach(function (h) {
        for (var i = h.children.length - 1; i >= 0; i--) {
          var c = h.children[i];
          h.remove(c);
          c.traverse(function (o) {
            if (o.geometry) o.geometry.dispose();
            if (o.material) {
              (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.dispose(); });
            }
          });
        }
      });
    }

    /* ------------------------------------------------------------------ *
     *  face expression engine
     * ------------------------------------------------------------------ */
    var EXPR = {
      neutral: { eye: 1, pupil: 1, brow: 0.05, browY: 0, smile: 1, frown: 0, o: 0, teeth: 0, tongue: 0, xeyes: 0, blush: 0.35 },
      happy:   { eye: 0.95, pupil: 1, brow: 0.2, browY: 0.008, smile: 1.3, frown: 0, o: 0, teeth: 0, tongue: 0, xeyes: 0, blush: 0.4 },
      pain:    { eye: 0.1, pupil: 0.8, brow: -0.85, browY: -0.004, smile: 1.15, frown: 1, o: 0, teeth: 1, tongue: 0, xeyes: 0, blush: 0.85 },
      shock:   { eye: 1.35, pupil: 0.5, brow: 0.65, browY: 0.014, smile: 0, frown: 0, o: 1.15, teeth: 0, tongue: 0, xeyes: 0, blush: 0.6 },
      strain:  { eye: 0.45, pupil: 0.7, brow: -0.5, browY: 0, smile: 0.9, frown: 1, o: 0, teeth: 1, tongue: 0, xeyes: 0, blush: 0.75 },
      dizzy:   { eye: 0.6, pupil: 0.6, brow: 0.3, browY: 0, smile: 0, frown: 0, o: 0.7, teeth: 0, tongue: 1, xeyes: 1, blush: 0.8 },
      sleepy:  { eye: 0.22, pupil: 0.8, brow: 0.25, browY: -0.002, smile: 0.7, frown: 0, o: 0, teeth: 0, tongue: 0, xeyes: 0, blush: 0.4 }
    };
    var faceCur = W.extend({}, EXPR.neutral);
    var faceTgt = W.extend({}, EXPR.neutral);
    var exprName = 'neutral';
    var blinkT = W.range(1.5, 4), blinkPhase = -1;

    function setFace(name) {
      if (!EXPR[name]) name = 'neutral';
      exprName = name;
      faceTgt = W.extend({}, EXPR[name]);
    }

    function updateFace(dt, time) {
      for (var k in faceTgt) faceCur[k] = W.damp(faceCur[k], faceTgt[k], 14, dt);

      var canBlink = ['neutral', 'happy', 'shock', 'sleepy'].indexOf(exprName) >= 0;
      blinkT -= dt;
      if (canBlink && blinkT <= 0 && blinkPhase < 0) blinkPhase = 0;
      var blinkK = 1;
      if (blinkPhase >= 0) {
        blinkPhase += dt / 0.22;
        if (blinkPhase >= 1) { blinkPhase = -1; blinkT = W.range(1.5, 4.5); }
        else blinkK = 1 - Math.sin(blinkPhase * Math.PI) * 0.92;
      }
      if (!canBlink) blinkK = 1;

      var xs = faceCur.xeyes > 0.5;
      xL.visible = xs; xR.visible = xs;
      pupilL.visible = !xs; pupilR.visible = !xs;
      eyeL.scale.set(1, Math.max(0.06, faceCur.eye * blinkK), 1);
      eyeR.scale.set(1, Math.max(0.06, faceCur.eye * blinkK), 1);
      pupilL.scale.setScalar(Math.max(0.001, faceCur.pupil));
      pupilR.scale.setScalar(Math.max(0.001, faceCur.pupil));

      browL.rotation.z = faceCur.brow; browR.rotation.z = -faceCur.brow;
      browL.position.y = 0.066 + faceCur.browY; browR.position.y = 0.066 + faceCur.browY;

      var flip = faceCur.frown > 0.5 ? -1 : 1;
      smile.scale.set(faceCur.smile, flip * Math.max(0.001, faceCur.smile), faceCur.smile);
      smile.visible = faceCur.smile > 0.06;
      oMouth.scale.set(Math.max(0.001, faceCur.o * 0.95), Math.max(0.001, faceCur.o * 1.2), Math.max(0.001, faceCur.o * 0.6));
      oMouth.visible = faceCur.o > 0.06;
      teeth.visible = faceCur.teeth > 0.5 && faceCur.smile > 0.06;
      tongue.visible = faceCur.tongue > 0.5;
      if (tongue.visible) tongue.rotation.x = 0.35 + Math.sin(time * 9) * 0.15;

      blushMatL.opacity = faceCur.blush;
    }

    /* ------------------------------------------------------------------ *
     *  underwear builders
     * ------------------------------------------------------------------ */
    function undiesBrief(colorHex, map) {
      var base = colorHex || '#ffffff';
      var mat = W.toonMat(base);
      if (map) mat.map = map;
      var shell = M(sph(0.162, 18, 14), mat, 0, -0.03, 0);
      shell.scale.set(1.02, 0.92, 1.04);
      var band = M(torus(0.158, 0.022), mat.clone(), 0, 0.062, 0);
      band.rotation.x = Math.PI / 2;
      return { pelvis: [shell, band], hip: [], style: { color: base.replace('#', ''), map: map || null } };
    }
    function undiesBoxers(baseHex, map) {
      var base = baseHex || '#ffffff';
      var mat = W.toonMat(base);
      if (map) mat.map = map;
      var hip = M(cyl(0.172, 0.178, 0.30, 16), mat, 0, -0.065, 0);
      var th = M(cyl(0.096, 0.091, 0.19, 12), mat, 0, -0.095, 0);
      var wb = M(torus(0.166, 0.018), mat, 0, 0.075, 0);
      wb.rotation.x = Math.PI / 2;
      var fly = M(box(0.022, 0.16, 0.006), mat, 0, -0.07, 0.172);
      return { pelvis: [hip, wb, fly], hip: [th], style: { color: base.replace('#', ''), map: map || null } };
    }

    /* ------------------------------------------------------------------ *
     *  wardrobe item builders
     * ------------------------------------------------------------------ */
    var BUILDERS = {
      /* hair — built around skull centre (radius ~0.155) */
      hair_bald: function () { return []; },
      hair_buzz: function (mat) { return [skullCap(0.162, 0.55, mat, 0, 0)]; },
      hair_short: function (mat) {
        var g = [skullCap(0.163, 0.52, mat, 0.004, 0)];
        g.push(M(box(0.05, 0.09, 0.06), mat, -0.145, -0.03, 0.02));
        g.push(M(box(0.05, 0.09, 0.06), mat, 0.145, -0.03, 0.02));
        var fringe = M(box(0.19, 0.05, 0.05), mat, 0, 0.1, 0.135); fringe.rotation.x = 0.25;
        g.push(fringe);
        return g;
      },
      hair_spiky: function (mat) {
        var g = [skullCap(0.161, 0.5, mat, 0, 0)];
        for (var i = 0; i < 8; i++) {
          var a = (i / 8) * Math.PI * 2;
          var c = M(new THREE.ConeGeometry(0.045, 0.16, 8), mat, Math.cos(a) * 0.07, 0.13, Math.sin(a) * 0.07);
          c.rotation.z = -Math.cos(a) * 0.5;
          c.rotation.x = Math.sin(a) * 0.5;
          g.push(c);
        }
        return g;
      },
      hair_afro: function (mat) {
        // open-faced: top dome + puffs behind the ears so the face stays clear
        return [
          skullCap(0.185, 0.40, mat, 0.02, -0.01),
          M(sph(0.155, 16, 12), mat, 0, 0.01, -0.09),
          M(sph(0.10, 12, 10), mat, -0.135, 0.0, -0.03),
          M(sph(0.10, 12, 10), mat, 0.135, 0.0, -0.03)
        ];
      },
      hair_mohawk: function (mat) {
        var g = [];
        for (var i = 0; i < 6; i++) {
          var s = M(box(0.035, 0.15 - Math.abs(i - 2.5) * 0.012, 0.045), mat, 0, 0.16, -0.07 + i * 0.03);
          s.rotation.x = -0.15 + i * 0.05;
          g.push(s);
        }
        return g;
      },
      hair_ponytail: function (mat) {
        var g = [skullCap(0.162, 0.55, mat, 0.004, 0)];
        var tail = M(cyl(0.045, 0.018, 0.3, 10), mat, 0, -0.04, -0.165);
        tail.rotation.x = 0.42;
        g.push(tail);
        g.push(M(sph(0.05, 10, 8), mat, 0, 0.1, -0.12));
        return g;
      },
      hair_long: function (mat) {
        var g = [skullCap(0.163, 0.58, mat, 0.004, 0)];
        g.push(M(box(0.24, 0.34, 0.06), mat, 0, -0.14, -0.125));
        var s1 = M(cyl(0.05, 0.03, 0.3, 8), mat, -0.15, -0.1, -0.08); s1.rotation.z = 0.16;
        var s2 = M(cyl(0.05, 0.03, 0.3, 8), mat, 0.15, -0.1, -0.08); s2.rotation.z = -0.16;
        g.push(s1, s2);
        var fringe = M(box(0.2, 0.05, 0.05), mat, 0, 0.1, 0.135); fringe.rotation.x = 0.25;
        g.push(fringe);
        return g;
      },
      hair_mullet: function (mat) {
        var g = [skullCap(0.162, 0.52, mat, 0.004, 0)];
        g.push(M(box(0.2, 0.3, 0.06), mat, 0, -0.12, -0.115));
        var fringe = M(box(0.19, 0.05, 0.05), mat, 0, 0.1, 0.135); fringe.rotation.x = 0.25;
        g.push(fringe);
        return g;
      },

      /* tops */
      top_tee: function (mat) {
        return {
          torso: [M(cyl(0.19, 0.175, 0.46, 16), mat, 0, 0.21, 0)],
          sh: [M(cyl(0.064, 0.058, 0.16, 10), mat, 0, -0.075, 0)],
          el: []
        };
      },
      top_tank: function (mat) {
        var straps = [];
        [-1, 1].forEach(function (s) {
          var st = M(box(0.035, 0.12, 0.03), mat, 0.115 * s, 0.38, 0.06);
          st.rotation.z = 0.15 * s;
          straps.push(st);
        });
        return { torso: [M(cyl(0.187, 0.175, 0.44, 16), mat, 0, 0.20, 0)].concat(straps), sh: [], el: [] };
      },
      top_sweater: function (mat) {
        var collar = M(torus(0.075, 0.026), mat, 0, 0.455, 0); collar.rotation.x = Math.PI / 2;
        return {
          torso: [M(cyl(0.205, 0.19, 0.48, 16), mat, 0, 0.22, 0), collar],
          sh: [M(cyl(0.075, 0.07, 0.24, 10), mat, 0, -0.1, 0)],
          el: [M(cyl(0.068, 0.062, 0.2, 10), mat, 0, -0.09, 0)]
        };
      },
      top_hoodie: function (mat) {
        var t = M(cyl(0.21, 0.19, 0.5, 16), mat, 0, 0.22, 0);
        var hood = M(sph(0.13, 14, 10), mat, 0, 0.44, -0.09);
        hood.scale.set(1.15, 0.75, 0.7); hood.rotation.x = 0.5;
        var pocket = M(box(0.17, 0.1, 0.02), mat, 0, 0.03, 0.185);
        var strings = [];
        [-0.035, 0.035].forEach(function (x) {
          strings.push(M(cyl(0.006, 0.006, 0.14, 6), W.basicMat('#f2f2f2'), x, 0.38, 0.185));
        });
        return {
          torso: [t, hood, pocket].concat(strings),
          sh: [M(cyl(0.078, 0.072, 0.26, 10), mat, 0, -0.105, 0)],
          el: [M(cyl(0.07, 0.064, 0.22, 10), mat, 0, -0.1, 0)]
        };
      },
      top_tux: function (mat) {
        var shirtMat = W.toonMat('#f7f7f7');
        var t = M(cyl(0.187, 0.176, 0.46, 16), shirtMat, 0, 0.21, 0);
        var jacketL = M(box(0.1, 0.42, 0.035), mat, -0.09, 0.22, 0.155); jacketL.rotation.y = 0.12;
        var jacketR = M(box(0.1, 0.42, 0.035), mat, 0.09, 0.22, 0.155); jacketR.rotation.y = -0.12;
        var collar = M(box(0.14, 0.05, 0.03), shirtMat, 0, 0.44, 0.14); collar.rotation.x = 0.4;
        var bowMat = W.basicMat('#c0392b');
        var bowL = M(box(0.035, 0.025, 0.014), bowMat, -0.024, 0.425, 0.165);
        var bowR = M(box(0.035, 0.025, 0.014), bowMat, 0.024, 0.425, 0.165);
        var knot = M(box(0.016, 0.016, 0.016), bowMat, 0, 0.425, 0.17);
        var buttons = [];
        for (var i = 0; i < 3; i++) buttons.push(M(sph(0.009, 6, 6), W.basicMat('#2b2340'), 0, 0.16 - i * 0.11, 0.182));
        return {
          torso: [t, jacketL, jacketR, collar, bowL, bowR, knot].concat(buttons),
          sh: [], el: []
        };
      },

      /* bottoms */
      bottom_jeans: function (mat) {
        var belt = M(torus(0.176, 0.02), W.basicMat('#3a2e23'), 0, 0.055, 0); belt.rotation.x = Math.PI / 2;
        var cuff = M(torus(0.075, 0.014), mat, 0, -0.40, 0); cuff.rotation.x = Math.PI / 2;
        return {
          pelvis: [M(cyl(0.185, 0.19, 0.28, 16), mat, 0, -0.045, 0), belt],
          hip: [M(cyl(0.088, 0.083, 0.44, 12), mat, 0, -0.21, 0)],
          knee: [M(cyl(0.079, 0.072, 0.42, 12), mat, 0, -0.20, 0), cuff],
          ankle: []
        };
      },
      bottom_sweatpants: function (mat) {
        var c1 = M(torus(0.082, 0.018), mat, 0, -0.38, 0); c1.rotation.x = Math.PI / 2;
        return {
          pelvis: [M(cyl(0.196, 0.20, 0.3, 16), mat, 0, -0.05, 0)],
          hip: [M(cyl(0.102, 0.096, 0.44, 12), mat, 0, -0.21, 0)],
          knee: [M(cyl(0.095, 0.088, 0.42, 12), mat, 0, -0.20, 0), c1],
          ankle: []
        };
      },
      bottom_shorts: function (mat) {
        var hem = M(torus(0.09, 0.013), mat, 0, -0.25, 0); hem.rotation.x = Math.PI / 2;
        return {
          pelvis: [M(cyl(0.188, 0.195, 0.26, 16), mat, 0, -0.04, 0)],
          hip: [M(cyl(0.092, 0.088, 0.25, 12), mat, 0, -0.125, 0), hem],
          knee: [], ankle: []
        };
      },
      bottom_suitpants: function (mat) {
        var belt = M(torus(0.176, 0.018), W.basicMat('#2b2340'), 0, 0.055, 0); belt.rotation.x = Math.PI / 2;
        return {
          pelvis: [M(cyl(0.183, 0.188, 0.28, 16), mat, 0, -0.045, 0), belt],
          hip: [M(cyl(0.085, 0.079, 0.44, 12), mat, 0, -0.21, 0)],
          knee: [M(cyl(0.076, 0.068, 0.42, 12), mat, 0, -0.20, 0)],
          ankle: []
        };
      },
      bottom_skirt: function (mat) {
        mat.side = THREE.DoubleSide;
        var sk = M(new THREE.CylinderGeometry(0.175, 0.275, 0.33, 18, 1, true), mat, 0, -0.115, 0);
        var hem = M(torus(0.272, 0.012), mat, 0, -0.275, 0); hem.rotation.x = Math.PI / 2;
        var waist = M(torus(0.177, 0.018), mat, 0, 0.045, 0); waist.rotation.x = Math.PI / 2;
        return { pelvis: [sk, hem, waist], hip: [], knee: [], ankle: [] };
      },

      /* underwear */
      undies_whities: function () { return undiesBrief('#ffffff'); },
      undies_plain: function () { return undiesBrief(outfit.undies.color || '#ffffff'); },
      undies_rainbow: function () { return undiesBrief('#ffffff', W.PATTERNS.rainbow()); },
      undies_hearts: function () { return undiesBoxers(null, W.PATTERNS.hearts('#f3f1ea', '#e0455e')); },
      undies_ducks: function () { return undiesBoxers(null, W.PATTERNS.ducks('#7fd8e8', '#ffe066')); },
      undies_stars: function () { return undiesBoxers(null, W.PATTERNS.stars('#2b2f4e', '#ffd23f')); },
      undies_boxerbriefs: function () { return undiesBoxers('#3d4257'); },

      /* shoes */
      shoes_sneakers: function (mat) {
        var toe = M(sph(0.062, 10, 8), W.basicMat('#f2f2f2'), 0, -0.02, 0.175); toe.scale.set(1, 0.75, 1.15);
        var laces = [];
        for (var i = 0; i < 3; i++) laces.push(M(box(0.052, 0.007, 0.014), W.basicMat('#f2f2f2'), 0, 0.032, 0.01 + i * 0.035));
        return [M(box(0.125, 0.08, 0.26), mat, 0, -0.012, 0.055), toe,
                M(box(0.135, 0.03, 0.29), W.basicMat('#f2f2f2'), 0, -0.055, 0.055)].concat(laces);
      },
      shoes_boots: function (mat) {
        return [
          M(box(0.125, 0.09, 0.25), mat, 0, -0.005, 0.05),
          M(cyl(0.062, 0.072, 0.15, 10), mat, 0, 0.055, 0.005),
          M(box(0.135, 0.03, 0.27), W.basicMat('#3a2e23'), 0, -0.055, 0.05),
          M(box(0.05, 0.014, 0.01), W.basicMat('#ffd23f'), 0, 0.05, 0.075)
        ];
      },
      shoes_flipflops: function (mat) {
        var strap = M(cyl(0.009, 0.009, 0.14, 6), mat, 0, 0.01, 0.06);
        strap.rotation.z = Math.PI / 2; strap.rotation.y = 0.5;
        return [M(box(0.115, 0.014, 0.245), mat, 0, -0.042, 0.05), strap];
      },

      /* accessories */
      acc_glasses: function () {
        var dk = W.basicMat('#2b2340');
        var rimL = M(torus(0.05, 0.007), dk, -0.058, -0.005, 0.152);
        var rimR = M(torus(0.05, 0.007), dk, 0.058, -0.005, 0.152);
        var bridge = M(box(0.028, 0.008, 0.008), dk, 0, 0.005, 0.158);
        var tL = M(box(0.09, 0.007, 0.007), dk, -0.1, -0.005, 0.105); tL.rotation.y = 0.55;
        var tR = M(box(0.09, 0.007, 0.007), dk, 0.1, -0.005, 0.105); tR.rotation.y = -0.55;
        return [rimL, rimR, bridge, tL, tR];
      },
      acc_cap: function (mat) {
        var brim = M(box(0.17, 0.016, 0.13), mat, 0, 0.008, 0.175);
        brim.rotation.x = -0.12;
        return [skullCap(0.163, 0.5, mat, 0.006, 0.005), brim,
                M(sph(0.016, 8, 6), W.basicMat('#2b2340'), 0, 0.163, 0.005)];
      },
      acc_beanie: function (mat) {
        var fold = M(torus(0.152, 0.028), mat, 0, 0.006, 0); fold.rotation.x = Math.PI / 2;
        return [skullCap(0.168, 0.55, mat, 0, 0), fold, M(sph(0.05, 10, 8), W.basicMat('#f2f2f2'), 0, 0.17, 0)];
      },
      acc_party: function (mat) {
        var cone = M(new THREE.ConeGeometry(0.085, 0.27, 14), mat, 0, 0.1, 0);
        cone.rotation.z = 0.16;
        return [cone, M(sph(0.038, 10, 8), W.basicMat('#ff5da2'), -0.045, 0.235, 0)];
      },
      acc_crown: function () {
        var gold = W.basicMat('#ffd23f', { side: THREE.DoubleSide });
        var g = [M(new THREE.CylinderGeometry(0.105, 0.105, 0.055, 14, 1, true), gold, 0, 0.115, 0)];
        for (var i = 0; i < 6; i++) {
          var a = (i / 6) * Math.PI * 2;
          g.push(M(new THREE.ConeGeometry(0.02, 0.05, 6), gold, Math.cos(a) * 0.105, 0.16, Math.sin(a) * 0.105));
        }
        g.push(M(sph(0.014, 8, 6), W.basicMat('#ff5da2'), 0, 0.115, 0.105));
        return g;
      }
    };

    /* ------------------------------------------------------------------ *
     *  outfit state & equip
     * ------------------------------------------------------------------ */
    var outfit = {
      skin: '#f6c39c',
      hair: { id: 'hair_short', color: '#5b3a29' },
      top: { id: 'top_tee', color: '#5aa9d6' },
      bottom: { id: 'bottom_jeans', color: '#3a67b1' },
      undies: { id: 'undies_whities', color: '#ffffff' },
      shoes: { id: 'shoes_sneakers', color: '#e8e8e8' },
      acc: { id: 'none', color: '#ffd23f' }
    };

    var undiesStyle = { color: 'ffffff', map: null };
    var onUndiesChange = null;

    function equip(category, itemId, colorHex) {
      if (category === 'skin') {
        outfit.skin = colorHex;
        skinMat.color.copy(W.srgb(colorHex));
        noseMat.color.copy(W.srgb(colorHex)).multiplyScalar(0.85);
        return;
      }
      var def = outfit[category];
      if (!def) return;
      if (itemId !== undefined) def.id = itemId;
      if (colorHex !== undefined && def.color !== undefined) def.color = colorHex;
      itemId = def.id;
      if (itemId !== 'none' && !BUILDERS[itemId]) return;

      clearHolders(category);

      if (category === 'hair') {
        browMat.color.copy(W.srgb(outfit.hair.color));
        if (itemId !== 'hair_bald') {
          var hairMat = W.toonMat(outfit.hair.color);
          BUILDERS[itemId](hairMat).forEach(function (p) { holders.hair[0].add(p); });
        }
        return;
      }

      if (category === 'undies') {
        var res = BUILDERS[itemId] ? BUILDERS[itemId]() : BUILDERS.undies_whities();
        res.pelvis.forEach(function (p) { holders.undies[0].add(p); });
        if (res.hip.length) {
          holders.undies[1].add(res.hip[0]);
          holders.undies[2].add(res.hip[0].clone());
        }
        undiesStyle = res.style;
        if (onUndiesChange) onUndiesChange(undiesStyle);
        return;
      }

      if (category === 'top') {
        if (itemId === 'none') return;
        var r = BUILDERS[itemId](W.toonMat(outfit.top.color));
        r.torso.forEach(function (p) { holders.top[0].add(p); });
        r.sh.forEach(function (p) { holders.top[1].add(p); holders.top[2].add(p.clone()); });
        r.el.forEach(function (p) { holders.top[3].add(p); holders.top[4].add(p.clone()); });
        return;
      }

      if (category === 'bottom') {
        if (itemId === 'none') return;
        var r3 = BUILDERS[itemId](W.toonMat(outfit.bottom.color));
        r3.pelvis.forEach(function (p) { holders.bottom[0].add(p); });
        r3.hip.forEach(function (p) { holders.bottom[1].add(p); holders.bottom[2].add(p.clone()); });
        r3.knee.forEach(function (p) { holders.bottom[3].add(p); holders.bottom[4].add(p.clone()); });
        r3.ankle.forEach(function (p) { holders.bottom[5].add(p); holders.bottom[6].add(p.clone()); });
        return;
      }

      if (category === 'shoes') {
        if (itemId === 'none') return;
        var parts = BUILDERS[itemId](W.toonMat(outfit.shoes.color));
        parts.forEach(function (p) { holders.shoes[0].add(p); holders.shoes[1].add(p.clone()); });
        return;
      }

      if (category === 'acc') {
        if (itemId === 'none') return;
        var partsA = BUILDERS[itemId](W.toonMat(outfit.acc.color));
        partsA.forEach(function (p) { holders.acc[0].add(p); });
        return;
      }
    }

    // default look
    equip('skin', null, outfit.skin);
    equip('hair', outfit.hair.id, outfit.hair.color);
    equip('top', outfit.top.id, outfit.top.color);
    equip('bottom', outfit.bottom.id, outfit.bottom.color);
    equip('undies', outfit.undies.id);
    equip('shoes', outfit.shoes.id, outfit.shoes.color);
    equip('acc', outfit.acc.id, outfit.acc.color);

    /* ------------------------------------------------------------------ *
     *  public char object
     * ------------------------------------------------------------------ */
    var char = {
      root: root,
      name: 'Riley',
      j: {
        pelvis: pelvis, torso: torso, neck: neck, head: head,
        shL: armL.sh, shR: armR.sh, elL: armL.el, elR: armR.el,
        hipL: legL.hip, hipR: legR.hip, kneeL: legL.knee, kneeR: legR.knee,
        footL: legL.ankle, footR: legR.ankle
      },
      handL: armL.hand, handR: armR.hand,
      holders: holders,
      outfit: outfit,
      skinMat: skinMat,

      setFace: setFace,
      getFace: function () { return exprName; },
      update: function (dt, time) { updateFace(dt, time); },

      onUndiesChange: function (fn) { onUndiesChange = fn; },
      undiesStyle: function () { return undiesStyle; },
      setUndiesStretch: function (s) {
        var k = W.clamp01(s);
        holders.undies.forEach(function (h) { h.scale.y = 1 - 0.14 * k; });
      },

      equip: equip,
      reattach: reattach,

      // waist attachment points (world space) for the stretchy band
      waistPoint: function (side) {
        return pelvis.localToWorld(side === 'front' ? W.V3(0, 0.05, 0.115) : W.V3(0, 0.05, -0.115));
      },
      buttPoint: function () { return pelvis.localToWorld(W.V3(0, -0.09, -0.125)); },
      crotchPoint: function () { return pelvis.localToWorld(W.V3(0, -0.09, 0.12)); },
      handPoint: function () {
        var a = W.V3(0, 0, 0); armL.hand.getWorldPosition(a);
        var b = W.V3(0, 0, 0); armR.hand.getWorldPosition(b);
        return a.lerp(b, 0.5);
      },
      headPoint: function (lx, ly, lz) {
        return head.localToWorld(W.V3(lx, ly + 0.12, lz));
      },
      torsoPoint: function (ly, lz) {
        return torso.localToWorld(W.V3(0, ly, lz));
      },
      jointWorld: function (name) {
        var v = W.V3(0, 0, 0);
        char.j[name].getWorldPosition(v);
        return v;
      }
    };

    W.char = char;
    return char;
  };

  /* ------------------------------------------------------------------ *
   *  wardrobe catalogue (drives the UI)
   * ------------------------------------------------------------------ */
  W.WARDROBE = {
    skin: {
      label: 'Skin tone', icon: '🎨', colorable: false, swatchOnly: true,
      items: [
        { id: 'skin1', name: 'Porcelain', color: '#ffe3cd' },
        { id: 'skin2', name: 'Peach', color: '#f6c39c' },
        { id: 'skin3', name: 'Honey', color: '#e0a172' },
        { id: 'skin4', name: 'Amber', color: '#c58a5a' },
        { id: 'skin5', name: 'Chestnut', color: '#9a6540' },
        { id: 'skin6', name: 'Espresso', color: '#6b452a' },
        { id: 'skin7', name: 'Mint', color: '#a8dfc5' },
        { id: 'skin8', name: 'Lavender', color: '#c5b3e8' }
      ]
    },
    hair: {
      label: 'Hair', icon: '💇', colorable: true,
      colors: ['#2b2320', '#5b3a29', '#8a5a2b', '#d9a845', '#e5c05a', '#c2571f', '#c63636', '#ff7ac1', '#5a8de2', '#63c96b', '#9b5de5', '#e8e8e8'],
      items: [
        { id: 'hair_bald', name: 'Bald' },
        { id: 'hair_buzz', name: 'Buzz cut' },
        { id: 'hair_short', name: 'Short' },
        { id: 'hair_spiky', name: 'Spiky' },
        { id: 'hair_afro', name: 'Afro' },
        { id: 'hair_mohawk', name: 'Mohawk' },
        { id: 'hair_ponytail', name: 'Ponytail' },
        { id: 'hair_long', name: 'Long hair' },
        { id: 'hair_mullet', name: 'Mullet' }
      ]
    },
    top: {
      label: 'Tops', icon: '👕', colorable: true,
      colors: ['#f2f2f2', '#22262e', '#5aa9d6', '#3a67b1', '#63c96b', '#8ac926', '#ffca3a', '#ff924c', '#ff595e', '#f49ac1', '#b25fd0', '#7a5fd0', '#45c8b0'],
      items: [
        { id: 'none', name: 'None' },
        { id: 'top_tee', name: 'T-shirt' },
        { id: 'top_tank', name: 'Tank top' },
        { id: 'top_sweater', name: 'Sweater' },
        { id: 'top_hoodie', name: 'Hoodie' },
        { id: 'top_tux', name: 'Tuxedo' }
      ]
    },
    bottom: {
      label: 'Bottoms', icon: '👖', colorable: true,
      colors: ['#3a67b1', '#22262e', '#5aa9d6', '#8a6f4d', '#b0b7c0', '#63c96b', '#ff595e', '#f49ac1', '#e8e8e8'],
      items: [
        { id: 'none', name: 'None' },
        { id: 'bottom_jeans', name: 'Jeans' },
        { id: 'bottom_sweatpants', name: 'Sweatpants' },
        { id: 'bottom_shorts', name: 'Shorts' },
        { id: 'bottom_suitpants', name: 'Suit pants' },
        { id: 'bottom_skirt', name: 'Skirt' }
      ]
    },
    undies: {
      label: 'Undies', icon: '🩲', colorable: 'plain',
      items: [
        { id: 'undies_whities', name: 'Tighty-whities' },
        { id: 'undies_hearts', name: 'Lucky hearts' },
        { id: 'undies_ducks', name: 'Duckies' },
        { id: 'undies_stars', name: 'Star night' },
        { id: 'undies_rainbow', name: 'Pride stripes' },
        { id: 'undies_boxerbriefs', name: 'Boxer briefs' },
        { id: 'undies_plain', name: 'Plain briefs' }
      ],
      plainColors: ['#ffffff', '#f2f2f2', '#ff595e', '#5aa9d6', '#8ac926', '#ffd23f', '#f49ac1', '#22262e']
    },
    shoes: {
      label: 'Shoes', icon: '👟', colorable: true,
      colors: ['#e8e8e8', '#ff595e', '#3a67b1', '#ffd23f', '#22262e', '#63c96b', '#f49ac1'],
      items: [
        { id: 'none', name: 'Bare feet' },
        { id: 'shoes_sneakers', name: 'Sneakers' },
        { id: 'shoes_boots', name: 'Boots' },
        { id: 'shoes_flipflops', name: 'Flip-flops' }
      ]
    },
    acc: {
      label: 'Extras', icon: '🎩', colorable: true,
      colors: ['#ffd23f', '#ff595e', '#5aa9d6', '#63c96b', '#f49ac1', '#22262e', '#9b5de5'],
      items: [
        { id: 'none', name: 'None' },
        { id: 'acc_glasses', name: 'Glasses' },
        { id: 'acc_cap', name: 'Cap' },
        { id: 'acc_beanie', name: 'Beanie' },
        { id: 'acc_party', name: 'Party hat' },
        { id: 'acc_crown', name: 'Crown' }
      ]
    }
  };
})();
