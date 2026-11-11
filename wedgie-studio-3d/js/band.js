/* Wedgie Studio 3D — the stretchy waistband ribbon + bungee spring.
   The band is a ribbon of triangles rebuilt every frame between a list of
   world-space control points, so it follows Riley and the pull target
   wherever they go. */
window.W = window.W || {};

(function () {
  'use strict';

  var SEGS = 30; // samples along the ribbon

  W.Band = function (scene) {
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array((SEGS + 1) * 2 * 3);
    var uv = new Float32Array((SEGS + 1) * 2 * 2);
    var idx = [];
    for (var i = 0; i < SEGS; i++) {
      var a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
      idx.push(a, b, c, b, d, c);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx);

    var mat = W.toonMat('#ffffff');
    mat.map = W.waistbandTex();
    mat.side = THREE.DoubleSide;

    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    mesh.visible = false;
    scene.add(mesh);

    var samples = [];   // resampled points
    for (var s = 0; s <= SEGS; s++) samples.push(W.V3(0, 0, 0));
    var prevSide = W.V3(1, 0, 0);
    var up = W.V3(0, 1, 0);
    var tan = W.V3(0, 0, 0), side = W.V3(0, 0, 0);

    function setStyle(style) {
      if (!style) return;
      mat.color.copy(W.srgb('#' + style.color));
    }

    // points: array of THREE.Vector3 (world space)
    function update(points, width, tension) {
      if (!points || points.length < 2) { mesh.visible = false; return; }
      mesh.visible = true;
      width = width || 0.13;
      tension = W.clamp01(tension === undefined ? 0 : tension);
      var w0 = width * (1 - 0.3 * tension);
      var w1 = width * 0.62;

      // arc lengths along the control polyline
      var n = points.length, total = 0, lens = [0];
      for (var i = 1; i < n; i++) { total += points[i].distanceTo(points[i - 1]); lens.push(total); }
      if (total < 1e-6) total = 1e-6;
      var step = total / SEGS;

      // resample
      var pi = 1;
      for (var s = 0; s <= SEGS; s++) {
        var d = s * step;
        while (pi < n - 1 && lens[pi] < d) pi++;
        var segLen = lens[pi] - lens[pi - 1] || 1e-6;
        var f = (d - lens[pi - 1]) / segLen;
        samples[s].set(
          points[pi - 1].x + (points[pi].x - points[pi - 1].x) * f,
          points[pi - 1].y + (points[pi].y - points[pi - 1].y) * f,
          points[pi - 1].z + (points[pi].z - points[pi - 1].z) * f
        );
      }

      // build the ribbon
      var pAttr = geo.attributes.position, uAttr = geo.attributes.uv;
      for (var s2 = 0; s2 <= SEGS; s2++) {
        var a = samples[Math.max(0, s2 - 1)], b = samples[Math.min(SEGS, s2 + 1)];
        tan.set(b.x - a.x, b.y - a.y, b.z - a.z);
        if (tan.lengthSq() < 1e-10) tan.set(0, 1, 0);
        tan.normalize();
        side.copy(tan).cross(up);
        if (side.lengthSq() < 1e-6) side.copy(prevSide);
        else { side.normalize(); prevSide.copy(side); }
        var t = s2 / SEGS;
        var w = w0 + (w1 - w0) * t;
        var p = samples[s2];
        var o = s2 * 6;
        pAttr.array[o] = p.x - side.x * w * 0.5;
        pAttr.array[o + 1] = p.y - side.y * w * 0.5;
        pAttr.array[o + 2] = p.z - side.z * w * 0.5;
        pAttr.array[o + 3] = p.x + side.x * w * 0.5;
        pAttr.array[o + 4] = p.y + side.y * w * 0.5;
        pAttr.array[o + 5] = p.z + side.z * w * 0.5;
        var uo = s2 * 4;
        var vv = 1 - t; // elastic stripe stays at the waist end
        uAttr.array[uo] = 0; uAttr.array[uo + 1] = vv;
        uAttr.array[uo + 2] = 1; uAttr.array[uo + 3] = vv;
      }

      pAttr.needsUpdate = true;
      uAttr.needsUpdate = true;
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
    }

    function hide() { mesh.visible = false; }

    return { mesh: mesh, update: update, hide: hide, setStyle: setStyle };
  };

  /* ------------------------------------------------------------------ *
   *  bungee spring (a stretchy helix between two world points)
   * ------------------------------------------------------------------ */
  W.Spring = function (scene) {
    var turns = 9, pts = [];
    for (var i = 0; i <= 90; i++) {
      var f = i / 90;
      var a = f * Math.PI * 2 * turns;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.045, -f, Math.sin(a) * 0.045));
    }
    var geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.011, 6, false);
    var mat = W.toonMat('#e0455e');
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.frustumCulled = false;
    mesh.visible = false;
    scene.add(mesh);

    function update(top, bottom) {
      mesh.visible = true;
      var len = Math.max(0.05, top.y - bottom.y);
      mesh.position.copy(top);
      mesh.scale.set(1, len, 1);
    }
    function hide() { mesh.visible = false; }
    return { mesh: mesh, update: update, hide: hide };
  };
})();
