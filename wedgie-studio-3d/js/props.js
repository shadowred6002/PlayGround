/* Wedgie Studio 3D — stage props & cartoon FX */
window.W = window.W || {};

(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   *  world dressing: floor, rug, clouds
   * ------------------------------------------------------------------ */
  W.buildWorld = function (scene) {
    // sky & fog
    scene.background = new THREE.Color('#aee3ff');
    scene.fog = new THREE.Fog('#aee3ff', 14, 26);

    var hemi = new THREE.HemisphereLight('#eaf6ff', '#ffd9e8', 0.52);
    scene.add(hemi);

    var sun = new THREE.DirectionalLight('#fff7e0', 0.65);
    sun.position.set(3.2, 5.5, 2.6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -4; sun.shadow.camera.right = 4;
    sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -1;
    sun.shadow.camera.far = 16;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    // floor disc
    var floor = new THREE.Mesh(new THREE.CircleGeometry(14, 40), W.toonMat('#8ed4a0'));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // stage rug
    var rug = new THREE.Mesh(new THREE.CircleGeometry(2.6, 40), W.toonMat('#ffd166'));
    rug.rotation.x = -Math.PI / 2;
    rug.position.y = 0.005;
    rug.receiveShadow = true;
    scene.add(rug);
    var rug2 = new THREE.Mesh(new THREE.CircleGeometry(1.9, 40), W.toonMat('#ff8fa3'));
    rug2.rotation.x = -Math.PI / 2;
    rug2.position.y = 0.01;
    rug2.receiveShadow = true;
    scene.add(rug2);
    var rug3 = new THREE.Mesh(new THREE.CircleGeometry(1.25, 40), W.toonMat('#8ed4ff'));
    rug3.rotation.x = -Math.PI / 2;
    rug3.position.y = 0.015;
    rug3.receiveShadow = true;
    scene.add(rug3);

    // confetti sprinkles on the rug
    var sprinkleColors = ['#ff595e', '#ffca3a', '#8ac926', '#3fa7d6', '#b25fd0', '#ffffff'];
    for (var i = 0; i < 26; i++) {
      var ang = Math.random() * Math.PI * 2;
      var rad = W.range(0.35, 2.3);
      var sp = new THREE.Mesh(new THREE.CircleGeometry(W.range(0.02, 0.045), 5),
        W.basicMat(W.pick(sprinkleColors)));
      sp.rotation.x = -Math.PI / 2;
      sp.rotation.z = Math.random() * Math.PI;
      sp.position.set(Math.cos(ang) * rad, 0.02 + i * 0.0001, Math.sin(ang) * rad);
      scene.add(sp);
    }

    // drifting puffy clouds
    var clouds = [];
    for (var c = 0; c < 5; c++) {
      var grp = new THREE.Group();
      var puffMat = W.toonMat('#ffffff');
      var count = 3 + Math.floor(Math.random() * 3);
      for (var p = 0; p < count; p++) {
        var puff = new THREE.Mesh(new THREE.SphereGeometry(W.range(0.25, 0.5), 12, 10), puffMat);
        puff.position.set(W.range(-0.6, 0.6), W.range(-0.1, 0.15), W.range(-0.25, 0.25));
        grp.add(puff);
      }
      grp.position.set(W.range(-7, 7), W.range(2.8, 4.6), W.range(-8, -4));
      scene.add(grp);
      clouds.push({ g: grp, speed: W.range(0.05, 0.16), base: grp.position.x });
    }

    return {
      update: function (dt, t) {
        for (var i = 0; i < clouds.length; i++) {
          var c2 = clouds[i];
          c2.g.position.x = c2.base + Math.sin(t * 0.05 + i * 2.1) * 2.2;
          c2.g.position.y += Math.sin(t * 0.3 + i) * 0.0005;
        }
      }
    };
  };

  /* ------------------------------------------------------------------ *
   *  coat hook — drops from the sky for hanging wedgies
   * ------------------------------------------------------------------ */
  W.HookProp = function (scene) {
    var grp = new THREE.Group();
    var rodMat = W.toonMat('#b8c2cc');
    var rod = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 3.4, 10), rodMat);
    rod.position.y = 1.7;
    rod.castShadow = true;
    grp.add(rod);

    var hookMat = W.toonMat('#ffd23f');
    var hook = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.018, 10, 24, Math.PI * 1.5), hookMat);
    hook.position.y = 0;
    hook.rotation.z = Math.PI * 0.25;
    hook.castShadow = true;
    grp.add(hook);

    var ball = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), hookMat);
    ball.position.set(0.07, 0, 0);
    grp.add(ball);

    grp.position.set(0, 6, 0); // parked above the sky
    scene.add(grp);

    var state = { phase: 'hidden', t: 0, y: 2.42, active: false };

    return {
      group: grp,
      hookY: 2.42,
      tip: function () { return W.V3(0, this.hookY - 0.02, 0); },
      enter: function () { state.phase = 'enter'; state.t = 0; grp.visible = true; },
      exit: function () { state.phase = 'exit'; state.t = 0; },
      update: function (dt) {
        state.t += dt;
        if (state.phase === 'enter') {
          var k = W.ease.outCubic(Math.min(1, state.t / 0.55));
          grp.position.y = 6 - (6 - state.y) * k;
          if (state.t > 0.5) { state.phase = 'idle'; grp.position.y = state.y; }
        } else if (state.phase === 'exit') {
          var k2 = W.ease.inCubic(Math.min(1, state.t / 0.45));
          grp.position.y = state.y + (6.5 - state.y) * k2;
          if (state.t > 0.45) { state.phase = 'hidden'; grp.visible = false; }
        }
      }
    };
  };

  /* ------------------------------------------------------------------ *
   *  tree branch — slides in for dangling wedgies
   * ------------------------------------------------------------------ */
  W.BranchProp = function (scene) {
    var grp = new THREE.Group();
    var barkMat = W.toonMat('#8a5a33');
    var branch = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 1.9, 10), barkMat);
    branch.rotation.z = Math.PI / 2;
    branch.castShadow = true;
    grp.add(branch);

    var leafMat = W.toonMat('#63c96b');
    var leafPos = [[-0.7, 0.06, 0], [-0.45, -0.04, 0.05], [-0.2, 0.05, -0.05], [0.25, -0.05, 0.04], [0.55, 0.05, 0], [0.8, -0.02, -0.04], [0.1, 0.08, 0]];
    leafPos.forEach(function (lp) {
      var blob = new THREE.Mesh(new THREE.IcosahedronGeometry(W.range(0.14, 0.22), 0), leafMat);
      blob.position.set(lp[0], lp[1], lp[2]);
      blob.castShadow = true;
      grp.add(blob);
    });

    var appleMat = W.toonMat('#ff595e');
    [[-0.62, -0.12, 0.1], [0.72, 0.1, 0.12]].forEach(function (ap) {
      var apple = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), appleMat);
      apple.position.set(ap[0], ap[1], ap[2]);
      apple.castShadow = true;
      grp.add(apple);
    });

    grp.position.set(-4.5, 2.62, 0);
    grp.visible = false;
    scene.add(grp);

    var state = { phase: 'hidden', t: 0 };

    return {
      group: grp,
      hookY: 2.62,
      tip: function () { return W.V3(0, 2.62, 0); },
      enter: function () { state.phase = 'enter'; state.t = 0; grp.visible = true; },
      exit: function () { state.phase = 'exit'; state.t = 0; },
      update: function (dt) {
        state.t += dt;
        if (state.phase === 'enter') {
          var k = W.ease.outCubic(Math.min(1, state.t / 0.7));
          grp.position.x = -4.5 + 4.5 * k;
          if (state.t > 0.7) { state.phase = 'idle'; grp.position.x = 0; }
        } else if (state.phase === 'exit') {
          var k2 = W.ease.inCubic(Math.min(1, state.t / 0.5));
          grp.position.x = -4.5 * k2;
          if (state.t > 0.5) { state.phase = 'hidden'; grp.visible = false; }
        }
      }
    };
  };

  /* ------------------------------------------------------------------ *
   *  chair — the classic chair wedgie victim
   * ------------------------------------------------------------------ */
  W.ChairProp = function (scene) {
    var grp = new THREE.Group();
    var woodMat = W.toonMat('#c98f4e');
    var darkMat = W.toonMat('#8a5a33');

    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.045, 0.44), woodMat);
    seat.position.y = 0.46;
    seat.castShadow = true;
    grp.add(seat);

    [[-0.19, -0.16], [0.19, -0.16], [-0.19, 0.16], [0.19, 0.16]].forEach(function (lp) {
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.46, 8), darkMat);
      leg.position.set(lp[0], 0.23, lp[1]);
      leg.castShadow = true;
      grp.add(leg);
    });

    // backrest: two posts + two slats (the band goes over the top slat)
    [[-0.19], [0.19]].forEach(function (pp) {
      var post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.58, 8), darkMat);
      post.position.set(pp[0], 0.75, -0.16);
      post.castShadow = true;
      grp.add(post);
    });
    var topSlats = [];
    [0.98, 0.82].forEach(function (y) {
      var slat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.035), woodMat);
      slat.position.set(0, y, -0.16);
      slat.castShadow = true;
      grp.add(slat);
      topSlats.push(slat);
    });

    grp.position.set(0, 0, -3.2);
    grp.visible = false;
    scene.add(grp);

    var state = { phase: 'hidden', t: 0 };
    var targetZ = -0.42;

    return {
      group: grp,
      enter: function () { state.phase = 'enter'; state.t = 0; grp.visible = true; },
      exit: function () { state.phase = 'exit'; state.t = 0; },
      // top of the backrest, in world space
      tip: function () {
        return W.V3(grp.position.x, 1.005 + grp.position.y, grp.position.z - 0.16);
      },
      seatTop: function () { return W.V3(grp.position.x, 0.48 + grp.position.y, grp.position.z); },
      update: function (dt) {
        state.t += dt;
        if (state.phase === 'enter') {
          var k = W.ease.outCubic(Math.min(1, state.t / 0.6));
          grp.position.z = -3.2 + (-0.42 + 3.2) * k;
          if (state.t > 0.6) { state.phase = 'idle'; grp.position.z = targetZ; }
        } else if (state.phase === 'exit') {
          var k2 = W.ease.inCubic(Math.min(1, state.t / 0.45));
          grp.position.z = targetZ - 2.8 * k2;
          if (state.t > 0.45) { state.phase = 'hidden'; grp.visible = false; }
        }
      }
    };
  };

  /* ------------------------------------------------------------------ *
   *  crumpled pants that pile at Riley's ankles
   * ------------------------------------------------------------------ */
  W.PantsCrumple = function (scene) {
    var grp = new THREE.Group();
    var mat = W.toonMat('#3a67b1');
    var main = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.05, 8, 14), mat);
    main.rotation.x = Math.PI / 2;
    grp.add(main);
    var b1 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat);
    b1.position.set(-0.06, 0.01, 0.03); b1.scale.set(1.3, 0.5, 1);
    grp.add(b1);
    var b2 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), mat);
    b2.position.set(0.06, 0.005, -0.03); b2.scale.set(1.3, 0.5, 1);
    grp.add(b2);
    grp.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    grp.visible = false;
    scene.add(grp);

    return {
      setColor: function (hex) { mat.color.copy(W.srgb(hex)); },
      showAt: function (x, y, z) { grp.visible = true; grp.position.set(x, y, z); },
      hide: function () { grp.visible = false; },
      get visible() { return grp.visible; }
    };
  };

  /* ------------------------------------------------------------------ *
   *  FX: confetti bursts, cartoon pain stars, flying accessories
   * ------------------------------------------------------------------ */
  W.Fx = function (scene) {
    var confetti = [];   // {mesh, vel, spin, life}
    var stars = [];      // {sprite, life, maxLife}
    var bodies = [];     // free-falling accessories {obj, vel, angVel, floorY}

    var starTexture = W.starTex();

    function confettiBurst(pos, count) {
      var colors = ['#ff595e', '#ffca3a', '#8ac926', '#3fa7d6', '#b25fd0', '#ff924c', '#ffffff'];
      for (var i = 0; i < (count || 36); i++) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.02),
          W.basicMat(W.pick(colors), { side: THREE.DoubleSide }));
        m.position.copy(pos);
        scene.add(m);
        confetti.push({
          mesh: m,
          vel: W.V3(W.range(-1.4, 1.4), W.range(1.2, 3.4), W.range(-1.4, 1.4)),
          spin: W.V3(W.range(-8, 8), W.range(-8, 8), W.range(-8, 8)),
          life: W.range(1.0, 1.6)
        });
      }
    }

    function painStar(pos) {
      var sm = new THREE.SpriteMaterial({ map: starTexture, transparent: true, depthTest: false });
      var sp = new THREE.Sprite(sm);
      sp.position.copy(pos);
      sp.scale.set(0.01, 0.01, 0.01);
      scene.add(sp);
      stars.push({ sprite: sp, life: 0.45, maxLife: 0.45 });
    }

    // detach a mesh (with world transform preserved) and let it fly
    function toss(mesh, vel) {
      var pos = W.V3(0, 0, 0), quat = new THREE.Quaternion();
      mesh.getWorldPosition(pos);
      mesh.getWorldQuaternion(quat);
      var parent = mesh.parent;
      if (parent) parent.remove(mesh);
      mesh.position.copy(pos);
      mesh.quaternion.copy(quat);
      scene.add(mesh);
      bodies.push({
        obj: mesh,
        vel: vel || W.V3(W.range(-0.9, 0.9), W.range(2.2, 3.2), W.range(-0.6, 0.6)),
        angVel: W.V3(W.range(-7, 7), W.range(-7, 7), W.range(-7, 7)),
        life: 12
      });
    }

    // Clone an outfit holder (with fresh geometries) so the wardrobe's real
    // pieces stay intact while a duplicate flies across the stage.
    function tossHolder(holder, vel) {
      if (!holder || !holder.children.length) return;
      holder.updateWorldMatrix(true, true);
      var pos = W.V3(0, 0, 0), quat = new THREE.Quaternion(), scl = W.V3(1, 1, 1);
      holder.matrixWorld.decompose(pos, quat, scl);
      var clone = holder.clone(true);
      clone.traverse(function (o) {
        if (o.geometry) o.geometry = o.geometry.clone();
      });
      clone.position.copy(pos);
      clone.quaternion.copy(quat);
      clone.scale.copy(scl);
      holder.visible = false;
      scene.add(clone);
      bodies.push({
        obj: clone,
        vel: vel || W.V3(W.range(-0.9, 0.9), W.range(2.2, 3.2), W.range(-0.6, 0.6)),
        angVel: W.V3(W.range(-7, 7), W.range(-7, 7), W.range(-7, 7)),
        life: 12
      });
    }

    function update(dt) {
      // confetti
      for (var i = confetti.length - 1; i >= 0; i--) {
        var c = confetti[i];
        c.life -= dt;
        if (c.life <= 0) {
          scene.remove(c.mesh); c.mesh.geometry.dispose();
          confetti.splice(i, 1); continue;
        }
        c.vel.y -= 2.6 * dt;
        c.mesh.position.addScaledVector(c.vel, dt);
        c.mesh.rotation.x += c.spin.x * dt;
        c.mesh.rotation.y += c.spin.y * dt;
        c.mesh.rotation.z += c.spin.z * dt;
        if (c.mesh.position.y < 0.02) { c.mesh.position.y = 0.02; c.vel.set(0, 0, 0); c.spin.set(0, 0, 0); }
      }

      // pain stars
      for (var j = stars.length - 1; j >= 0; j--) {
        var st = stars[j];
        st.life -= dt;
        if (st.life <= 0) {
          scene.remove(st.sprite); st.sprite.material.dispose();
          stars.splice(j, 1); continue;
        }
        var f = st.life / st.maxLife;
        var s = 0.62 * (1 - f) * Math.sin(Math.min(1, (st.maxLife - st.life) / 0.12) * Math.PI * 0.5) * f * 3;
        st.sprite.scale.set(0.55 * f + 0.1, 0.55 * f + 0.1, 1);
        st.sprite.material.opacity = Math.min(1, f * 2);
      }

      // flying bodies
      for (var k = bodies.length - 1; k >= 0; k--) {
        var b = bodies[k];
        b.life -= dt;
        if (b.life <= 0) {
          scene.remove(b.obj); b.obj.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
          bodies.splice(k, 1); continue;
        }
        b.vel.y -= 9.2 * dt;
        b.obj.position.addScaledVector(b.vel, dt);
        b.obj.rotation.x += b.angVel.x * dt;
        b.obj.rotation.y += b.angVel.y * dt;
        b.obj.rotation.z += b.angVel.z * dt;
        if (b.obj.position.y < 0.06 && b.vel.y < 0) {
          b.obj.position.y = 0.06;
          b.vel.y = -b.vel.y * 0.32;
          b.vel.x *= 0.7; b.vel.z *= 0.7;
          b.angVel.multiplyScalar(0.6);
          if (Math.abs(b.vel.y) < 0.4) { b.vel.y = 0; b.angVel.set(0, 0, 0); }
        }
      }
    }

    function clearBodies() {
      for (var i = bodies.length - 1; i >= 0; i--) {
        scene.remove(bodies[i].obj);
        bodies[i].obj.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
      }
      bodies.length = 0;
    }

    return {
      confettiBurst: confettiBurst,
      painStar: painStar,
      toss: toss,
      tossHolder: tossHolder,
      update: update,
      clearBodies: clearBodies
    };
  };
})();
