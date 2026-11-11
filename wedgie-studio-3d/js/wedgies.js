/* Wedgie Studio 3D — the wedgie engine.
   Eight wedgies, each a little choreography: pose targets + band control
   points + face + sounds + bubbles. Runs a small state machine:
   idle → intro → active → releasing → post → idle. */
window.W = window.W || {};

(function () {
  'use strict';

  var JOINTS = ['pelvis', 'torso', 'neck', 'head', 'shL', 'shR', 'elL', 'elR',
                'hipL', 'hipR', 'kneeL', 'kneeR', 'footL', 'footR'];

  function basePose() {
    return {
      rp: [0, 0, 0], rr: [0, 0, 0],
      pelvis: [0, 0, 0],
      torso: [0.04, 0, 0],
      neck: [-0.04, 0, 0],
      head: [0, 0, 0],
      shL: [0.08, 0, -0.07], shR: [0.08, 0, 0.07],
      elL: [-0.18, 0, 0], elR: [-0.18, 0, 0],
      hipL: [0, 0, -0.03], hipR: [0, 0, 0.03],
      kneeL: [0.03, 0, 0], kneeR: [0.03, 0, 0],
      footL: [0, 0, 0], footR: [0, 0, 0]
    };
  }

  function applyPose(char, pose, dt, speed) {
    speed = speed || 12;
    var j = char.j;
    for (var i = 0; i < JOINTS.length; i++) {
      var name = JOINTS[i], t = pose[name], r = j[name].rotation;
      r.x = W.damp(r.x, t[0], speed, dt);
      r.y = W.damp(r.y, t[1], speed, dt);
      r.z = W.damp(r.z, t[2], speed, dt);
    }
    var rp = char.root.position, tp = pose.rp;
    rp.x = W.damp(rp.x, tp[0], speed, dt);
    rp.y = W.damp(rp.y, tp[1], speed, dt);
    rp.z = W.damp(rp.z, tp[2], speed, dt);
    var rr = char.root.rotation, tr = pose.rr;
    rr.x = W.damp(rr.x, tr[0], speed, dt);
    rr.y = W.damp(rr.y, tr[1], speed, dt);
    rr.z = W.damp(rr.z, tr[2], speed, dt);
  }

  /* ------------------------------------------------------------------ *
   *  wedgie catalogue
   * ------------------------------------------------------------------ */
  W.WEDGIES = {
    normal: {
      label: 'Classic Wedgie', emoji: '🩲',
      tip: 'Reach back and yank. The OG.',
      pantsDown: true, prop: null, intro: 0.3,
      lines: {
        start: ['YEOWCH!!', 'Not AGAIN!!', 'Hey— wait— WAIT—', 'My legholes!!'],
        idle: ['How is it SO far up?!', 'I feel a draft…', 'This is a hate crime.', 'Pulling… it… out…', 'My undies have a mortgage up there.'],
        release: ['Phew! Fixed.', 'I need new undies.', 'Never speak of this.', 'Walk it off. Walk it off.']
      },
      step: function (g, t, dt) {
        var p = g.pose;
        // arms reach back and grab the waistband
        p.shL = [0.8, 0, 0.22]; p.shR = [0.8, 0, -0.22];
        p.elL = [0.95, 0, 0.18]; p.elR = [0.95, 0, -0.18];
        p.torso = [0.28, 0, 0]; p.neck = [-0.22, 0, 0];
        p.rp = [0, 0.045, 0];
        p.footL = [0.5, 0, 0]; p.footR = [0.5, 0, 0];
        p.kneeL = [0.1, 0, 0]; p.kneeR = [0.1, 0, 0];
        // struggle loop after the initial yank
        if (t > 1.1) {
          var w = Math.sin(t * 7);
          p.rp[1] = 0.045 + 0.012 * Math.sin(t * 6);
          p.shL[0] += 0.07 * w; p.shR[0] += 0.07 * w;
          p.elL[0] += 0.08 * w; p.elR[0] += 0.08 * w;
          p.head = [0, 0.1 * Math.sin(t * 5), 0];
          p.neck = [-0.2 + 0.05 * Math.sin(t * 6), 0, 0];
        }
        g.char.setFace(t > 0.5 ? 'pain' : 'shock');
        g.band.update([
          g.char.waistPoint('back'), g.char.buttPoint(), g.char.handPoint()
        ], 0.13, g.tension(0.35));
        if (g.once('yank', t > 0.55)) { g.sfx.yank(); g.fx.painStar(g.char.buttPoint()); }
        if (g.once('say', t > 0.6)) g.say(W.pick(this.lines.start));
        g.creakLoop(t, 1.4);
      }
    },

    melvin: {
      label: 'Frontal (Melvin)', emoji: '⬆️',
      tip: 'The front wedgie. For cowards.',
      pantsDown: true, prop: null, intro: 0.3,
      lines: {
        start: ['MELVIN!! NOOO!', 'MY EYES—I mean—OW!!', 'Not the FRONT door!!'],
        idle: ['This is WORSE backwards!', 'I can see my own seams!', 'Why would anyone invent this?!'],
        release: ['Unsee. UNSEE.', 'My dignity left the room.', 'We never did this.']
      },
      step: function (g, t, dt) {
        var p = g.pose;
        p.shL = [-0.75, 0, 0.25]; p.shR = [-0.75, 0, -0.25];
        p.elL = [-0.95, 0, 0.18]; p.elR = [-0.95, 0, -0.18];
        p.torso = [-0.16, 0, 0]; p.neck = [0.12, 0, 0]; p.head = [0.15, 0, 0];
        p.rp = [0, 0.045, -0.04];
        p.footL = [0.5, 0, 0]; p.footR = [0.5, 0, 0];
        p.kneeL = [0.14, 0, 0]; p.kneeR = [0.14, 0, 0];
        p.hipL = [-0.06, 0, -0.05]; p.hipR = [-0.06, 0, 0.05];
        if (t > 1.0) {
          var w = Math.sin(t * 6.5);
          p.rp[1] = 0.045 + 0.012 * Math.sin(t * 6);
          p.shL[0] -= 0.07 * w; p.shR[0] -= 0.07 * w;
          p.head = [0.12 + 0.04 * w, 0.08 * Math.sin(t * 5), 0];
        }
        g.char.setFace(t > 0.5 ? 'pain' : 'shock');
        g.band.update([
          g.char.waistPoint('front'), g.char.crotchPoint(), g.char.handPoint()
        ], 0.13, g.tension(0.35));
        if (g.once('yank', t > 0.55)) { g.sfx.yank(); g.fx.painStar(g.char.crotchPoint()); }
        if (g.once('say', t > 0.6)) g.say(W.pick(this.lines.start));
        g.creakLoop(t, 1.5);
      }
    },

    atomic: {
      label: 'Atomic Wedgie', emoji: '🌀',
      tip: 'Over the head. Legendary.',
      pantsDown: true, prop: null, intro: 0.3,
      lines: {
        start: ['Uh oh.', 'That hook looks… stabby.', 'Wait, that goes OVER—'],
        idle: ['I CAN SEE MY UNDIES!', 'It’s so DARK in here!', 'mmph!! mmph!!', 'This is a fashion statement now.'],
        release: ['My neck sounds like bubble wrap.', 'I saw the void.', 'Atomic-ly embarrassing.']
      },
      step: function (g, t, dt) {
        var p = g.pose, c = g.char;
        if (t < 0.55) {
          // grab & pull like a classic
          p.shL = [0.85, 0, 0.2]; p.shR = [0.85, 0, -0.2];
          p.elL = [0.9, 0, 0.15]; p.elR = [0.9, 0, -0.15];
          p.torso = [0.3, 0, 0]; p.rp = [0, 0.04, 0];
          p.footL = [0.5, 0, 0]; p.footR = [0.5, 0, 0];
          c.setFace(t < 0.25 ? 'shock' : 'strain');
          g.band.update([c.waistPoint('back'), c.buttPoint(), c.handPoint()], 0.13, 0.3);
        } else if (t < 1.25) {
          // stretch it skyward
          var k = W.ease.inOutQuad((t - 0.55) / 0.7);
          p.shL = [-2.6, 0, -0.35]; p.shR = [-2.6, 0, 0.35];
          p.elL = [-0.25, 0, 0]; p.elR = [-0.25, 0, 0];
          p.torso = [-0.14, 0, 0]; p.neck = [-0.35, 0, 0];
          p.rp = [0, 0.05 + 0.06 * k, 0];
          p.footL = [0.55, 0, 0]; p.footR = [0.55, 0, 0];
          c.setFace('strain');
          var top = c.headPoint(0, 0.13 + 0.3 * k, 0);
          g.band.update([c.waistPoint('back'), c.buttPoint(), c.torsoPoint(0.30, -0.15), top],
            0.13, 0.6 + 0.3 * k);
          if (g.once('stretch', t > 0.6)) g.sfx.creak(1.6);
        } else if (t < 1.55) {
          // snap it over the head
          p.shL = [-0.4, 0, -1.1]; p.shR = [-0.4, 0, 1.1];
          p.elL = [-1.1, 0, 0]; p.elR = [-1.1, 0, 0];
          p.torso = [0.55, 0, 0]; p.neck = [0.55, 0, 0]; p.head = [0.3, 0, 0];
          p.rp = [0, 0.02, 0];
          p.kneeL = [0.2, 0, 0]; p.kneeR = [0.2, 0, 0];
          c.setFace('dizzy');
          g.band.update([
            c.waistPoint('back'), c.buttPoint(), c.torsoPoint(0.30, -0.15),
            c.headPoint(0, 0.25, 0), c.headPoint(0, -0.02, 0.16)
          ], 0.13, 0.95);
          if (g.once('atomic', t > 1.42)) {
            g.sfx.snap(); g.sfx.boing(1.4);
            g.fx.confettiBurst(c.headPoint(0, 0.05, 0), 44);
            g.fx.painStar(c.headPoint(0, 0, 0.14));
            g.say(W.pick(['ATOMIC!!', 'OVER THE HEAD!!', 'FULL ORBIT!!']));
            g.ui.bumpCounter();
            g.markAchievement('atomic1');
            g.poppedAcc();
          }
        } else {
          // hooked — struggle forever
          var t2 = t - 1.55;
          p.shL = [-0.4 + 0.25 * Math.sin(t2 * 7), 0, -1.1 - 0.25 * Math.sin(t2 * 6)];
          p.shR = [-0.4 + 0.25 * Math.sin(t2 * 7 + 2), 0, 1.1 + 0.25 * Math.sin(t2 * 6 + 1)];
          p.elL = [-1.1, 0, 0]; p.elR = [-1.1, 0, 0];
          p.torso = [0.55, 0, 0]; p.neck = [0.5, 0.12 * Math.sin(t2 * 5), 0];
          p.head = [0.3, 0.18 * Math.sin(t2 * 5.5), 0];
          p.rp = [0, Math.abs(0.035 * Math.sin(t2 * 4.6)), 0];
          p.kneeL = [0.25 + 0.15 * Math.sin(t2 * 6), 0, 0];
          p.kneeR = [0.25 + 0.15 * Math.sin(t2 * 6 + 2.5), 0, 0];
          c.setFace('dizzy');
          g.band.update([
            c.waistPoint('back'), c.buttPoint(), c.torsoPoint(0.30, -0.15),
            c.headPoint(0, 0.25, 0), c.headPoint(0, -0.02, 0.16)
          ], 0.13, 0.95);
          g.creakLoop(t, 2.2);
          if (g.once('say2', t > 1.9)) g.say(W.pick(this.lines.idle));
        }
        if (g.once('say', t > 0.5)) g.say(W.pick(this.lines.start));
        if (g.once('yank', t > 0.5)) g.sfx.yank();
      }
    },

    squeaky: {
      label: 'Squeaky Clean', emoji: '🧼',
      tip: 'Front and back, spin to shine.',
      pantsDown: true, prop: null, intro: 0.3,
      lines: {
        start: ['What’s "squeaky clean"??', 'NO NO NO—'],
        idle: ['STOP SPINNING ME!!', 'I’M GETTING ROPE BURN!!', 'squeak— squeak— SQUEAK!!', 'WHO WASHES LIKE THIS?!'],
        release: ['I’m… sparkling?', 'Everything is blurry.', 'I saw my own back.']
      },
      step: function (g, t, dt) {
        var p = g.pose;
        var yaw = 2.2 * Math.sin(t * 2.3);
        p.rr = [0, yaw, 0];
        p.rp = [0, -0.05, 0];
        p.pelvis = [0, yaw * 0.25, 0];
        p.shL = [-0.3, 0, -1.25 - 0.3 * Math.sin(t * 9)];
        p.shR = [-0.3, 0, 1.25 + 0.3 * Math.sin(t * 9 + 2)];
        p.elL = [-0.6, 0, 0]; p.elR = [-0.6, 0, 0];
        p.torso = [0.12, 0, 0]; p.neck = [0.05, 0, 0];
        p.kneeL = [0.32, 0, 0]; p.kneeR = [0.32, 0, 0];
        p.footL = [0.5, 0, 0]; p.footR = [0.5, 0, 0];
        g.char.setFace(t > 1.2 ? 'dizzy' : 'pain');
        // band tip orbits opposite the spin → the band twists around Riley
        var ang = -yaw * 1.15;
        var rootW = g.char.root.position;
        var tip = W.V3(rootW.x + Math.sin(ang) * 0.5, 1.42, rootW.z - Math.cos(ang) * 0.5);
        g.band.update([g.char.waistPoint('back'), g.char.buttPoint(), tip], 0.13, 0.8);
        // squeak on each swing extreme
        var half = Math.floor((t * 2.3) / Math.PI);
        if (g.once('sq' + half, true)) g.sfx.creak(half % 2 ? 1.35 : 0.8);
        if (g.once('say', t > 0.5)) g.say(W.pick(this.lines.start));
      }
    },

    hanging: {
      label: 'Hanging Wedgie', emoji: '🪝',
      tip: 'Coat hook. Feet off the floor.',
      pantsDown: true, prop: 'hook', intro: 0.75,
      lines: {
        start: ['GET ME DOWN!!', 'NOT THE HOOK!!', 'I’m too heavy for cotton!!'],
        idle: ['Somebody?? ANYBODY??', '…gravity is rude.', 'I can hear my seams crying.', 'This hook and I are BONDED now.'],
        release: ['My spine is a zigzag.', 'Free at last!', 'That hook owes me therapy.']
      },
      step: function (g, t, dt) {
        var p = g.pose, c = g.char;
        var rise = W.ease.outBack(Math.min(1, t / 0.7));
        var hangY = 1.32;
        p.rp = [0.14 * Math.sin(t * 1.1) * Math.min(1, t / 1.2), hangY * rise, 0];
        var sway = 0.14 * Math.sin(t * 1.1) * Math.min(1, t / 1.2);
        p.pelvis = [0, 0.06 * Math.sin(t * 1.1), sway];
        p.torso = [1.02, 0, 0];
        p.neck = [0.32, 0, 0]; p.head = [0.22, 0.1 * Math.sin(t * 2), 0];
        p.shL = [-2.35 + 0.15 * Math.sin(t * 5), 0, -0.45];
        p.shR = [-2.35 + 0.15 * Math.sin(t * 5 + 2.4), 0, 0.45];
        p.elL = [-0.3, 0, 0]; p.elR = [-0.3, 0, 0];
        // kicking legs
        p.hipL = [-0.5 + 0.38 * Math.sin(t * 4.2), 0, -0.06];
        p.hipR = [-0.5 + 0.38 * Math.sin(t * 4.2 + Math.PI), 0, 0.06];
        p.kneeL = [0.55 + 0.3 * Math.sin(t * 4.2), 0, 0];
        p.kneeR = [0.55 + 0.3 * Math.sin(t * 4.2 + Math.PI), 0, 0];
        p.footL = [0.35, 0, 0]; p.footR = [0.35, 0, 0];
        c.setFace(t > 5 ? 'dizzy' : 'strain');
        g.band.update([
          c.waistPoint('back'), c.buttPoint(), g.props.hook.tip()
        ], 0.13, 0.9);
        if (g.once('clank', t > 0.62)) g.sfx.clank();
        if (g.once('say', t > 0.8)) g.say(W.pick(this.lines.start));
        if (g.once('shoes', t > 0.8)) g.popShoes();
        if (g.once('hang10', t > 10)) g.markAchievement('hang10');
        g.creakLoop(t, 2.0);
      }
    },

    bouncy: {
      label: 'Bouncy Wedgie', emoji: '🦘',
      tip: 'Bungee-grade. Boing.',
      pantsDown: true, prop: 'bungee', intro: 0.75,
      lines: {
        start: ['WHAT IS THAT SPRING?!', 'I’M NOT A YO-YO!!'],
        idle: ['BOING!!', 'BOING— OW— BOING—', 'My stomach stayed UP there!', 'boing… boing… save me…'],
        release: ['I bounced OFF my bones.', 'No more trampolines. Ever.']
      },
      step: function (g, t, dt) {
        var p = g.pose, c = g.char;
        var rise = W.ease.outBack(Math.min(1, t / 0.6));
        var bounce = Math.abs(Math.sin(t * 2.7));
        var y = 0.82 + 0.52 * bounce;
        p.rp = [0.05 * Math.sin(t * 2.7 * 2), y * rise, 0.04 * Math.sin(t * 2.7)];
        p.pelvis = [0, 0, 0.05 * Math.sin(t * 5.4)];
        p.torso = [1.12, 0, 0];
        p.neck = [0.35, 0, 0]; p.head = [0.25, 0, 0];
        p.shL = [-2.5 + 0.2 * Math.sin(t * 6), 0, -0.5];
        p.shR = [-2.5 + 0.2 * Math.sin(t * 6 + 2.2), 0, 0.5];
        p.elL = [-0.35, 0, 0]; p.elR = [-0.35, 0, 0];
        p.hipL = [-0.35 + 0.3 * Math.sin(t * 6.5), 0, -0.05];
        p.hipR = [-0.35 + 0.3 * Math.sin(t * 6.5 + Math.PI), 0, 0.05];
        p.kneeL = [0.7 + 0.25 * Math.sin(t * 6.5), 0, 0];
        p.kneeR = [0.7 + 0.25 * Math.sin(t * 6.5 + Math.PI), 0, 0];
        c.setFace(bounce > 0.7 ? 'pain' : (t > 8 ? 'dizzy' : 'strain'));
        // the spring bottom rides above the waistband loop
        var loopY = c.root.position.y + 1.52;
        var loop = W.V3(0, loopY, -0.05);
        g.spring.update(W.V3(0, 4.6, 0), loop);
        g.band.update([c.waistPoint('back'), c.buttPoint(), loop], 0.13, 0.9);
        // boing on each stretch
        var half = Math.floor((t * 2.7) / Math.PI);
        if (g.once('b' + half, true)) {
          g.sfx.boing(0.8 + 0.5 * bounce);
          g.session.bounces++;
          if (g.session.bounces === 20) g.markAchievement('bounce20');
          if (g.session.bounces > 3 && Math.random() < 0.3) g.say(W.pick(this.lines.idle));
        }
        if (g.once('say', t > 0.7)) g.say(W.pick(this.lines.start));
      }
    },

    dangling: {
      label: 'Dangling Wedgie', emoji: '🌿',
      tip: 'From a branch. Take a nap.',
      pantsDown: true, prop: 'branch', intro: 0.8,
      lines: {
        start: ['A TREE?! SERIOUSLY?!', 'I’m not ORNAMENT!!'],
        idle: ['…just hanging out. 🌳', 'Is that bird JUDGING me?', '…zzz…', 'Nature is wonderful.'],
        release: ['That was almost peaceful.', 'I have leaves in places.']
      },
      step: function (g, t, dt) {
        var p = g.pose, c = g.char;
        var rise = W.ease.outBack(Math.min(1, t / 0.7));
        var hangY = 1.42;
        p.rp = [0.1 * Math.sin(t * 0.65) * Math.min(1, t / 1.5), hangY * rise, 0];
        p.rr = [0, 0.5 * Math.sin(t * 0.3), 0];
        p.pelvis = [0, 0, 0.07 * Math.sin(t * 0.65)];
        p.torso = [0.95, 0, 0];
        p.neck = [0.2, 0, 0]; p.head = [0.12, 0.2 * Math.sin(t * 0.4), 0];
        p.shL = [0.12, 0, -0.16]; p.shR = [0.12, 0, 0.16];
        p.elL = [-0.1, 0, 0]; p.elR = [-0.1, 0, 0];
        p.hipL = [-0.25 + 0.07 * Math.sin(t * 0.9), 0, -0.05];
        p.hipR = [-0.25 + 0.07 * Math.sin(t * 0.9 + 2), 0, 0.05];
        p.kneeL = [0.3 + 0.06 * Math.sin(t * 0.9), 0, 0];
        p.kneeR = [0.3 + 0.06 * Math.sin(t * 0.9 + 2), 0, 0];
        c.setFace(t > 7 ? 'sleepy' : 'strain');
        g.band.update([
          c.waistPoint('back'), c.buttPoint(), g.props.branch.tip()
        ], 0.13, 0.75);
        if (g.once('say', t > 0.85)) g.say(W.pick(this.lines.start));
        if (g.once('zzz', t > 9)) g.say('…zzz…');
        g.creakLoop(t, 3.2, 0.5);
      }
    },

    chair: {
      label: 'Chair Wedgie', emoji: '🪑',
      tip: 'Sit first. Regret forever.',
      pantsDown: true, prop: 'chair', intro: 0.85,
      lines: {
        start: ['This chair has TEETH!', 'I sat down and it ATTACKED!'],
        idle: ['I’m fused to the FURNITURE!', 'The seat and I are one now.', 'Un-lean… un-LEAN!!'],
        release: ['Standing up. Forever.', 'That chair is a predator.']
      },
      step: function (g, t, dt) {
        var p = g.pose, c = g.char;
        if (t < 0.5) {
          // hop backwards onto the seat
          var k = t / 0.5;
          var arc = Math.sin(k * Math.PI) * 0.22;
          p.rp = [0, -0.37 * W.ease.inOutQuad(k) + arc, -0.42 * W.ease.inOutQuad(k)];
          p.hipL = [-1.0, 0, -0.06]; p.hipR = [-1.0, 0, 0.06];
          p.kneeL = [1.8, 0, 0]; p.kneeR = [1.8, 0, 0];
          p.shL = [-0.8, 0, -0.4]; p.shR = [-0.8, 0, 0.4];
          p.elL = [-0.9, 0, 0]; p.elR = [-0.9, 0, 0];
          p.torso = [0.15, 0, 0];
          c.setFace('shock');
          if (g.once('thud', t > 0.42)) { g.sfx.thud(); g.fx.painStar(c.buttPoint()); }
        } else {
          var t2 = t - 0.5;
          // seated, band stretching over the chair back
          p.rp = [0, -0.37 + 0.012 * Math.sin(t2 * 6), -0.42];
          p.hipL = [-1.42, 0, -0.07]; p.hipR = [-1.42, 0, 0.07];
          p.kneeL = [1.28 + 0.38 * Math.sin(t2 * 5), 0, 0];
          p.kneeR = [1.28 + 0.38 * Math.sin(t2 * 5 + Math.PI), 0, 0];
          p.footL = [-0.1, 0, 0]; p.footR = [-0.1, 0, 0];
          p.torso = [0.42, 0, 0]; p.neck = [-0.28, 0, 0];
          p.shL = [-0.55, 0, -0.5]; p.shR = [-0.55, 0, 0.5];
          p.elL = [-0.7, 0, 0]; p.elR = [-0.7, 0, 0];
          c.setFace(t2 > 1 ? 'pain' : 'shock');
          if (g.once('say', t2 > 0.4)) g.say(W.pick(this.lines.start));
          g.creakLoop(t, 1.8);
        }
        g.band.update([
          c.waistPoint('back'), c.buttPoint(), g.props.chair.tip()
        ], 0.13, 0.8);
      }
    }
  };

  W.WEDGIE_ORDER = ['normal', 'melvin', 'atomic', 'squeaky', 'hanging', 'bouncy', 'dangling', 'chair'];

  var ACHIEVEMENTS = [
    { id: 'wedgie1', title: 'First Wedgie!', desc: 'Riley’s seams will remember this.' },
    { id: 'atomic1', title: 'Atomic Achieved', desc: 'Waistband over the head.' },
    { id: 'all8', title: 'Wedgie Encyclopedia', desc: 'Tried all eight wedgies.' },
    { id: 'total10', title: 'Wedgie Apprentice', desc: '10 wedgies given.' },
    { id: 'total25', title: 'Wedgie Master', desc: '25 wedgies given.' },
    { id: 'total50', title: 'Wedgie Legend', desc: '50 wedgies given.' },
    { id: 'nice', title: 'nice.', desc: '69 wedgies. Nice.' },
    { id: 'hang10', title: 'Certifiable Coat Hanger', desc: 'Left Riley hanging for 10+ seconds.' },
    { id: 'bounce20', title: 'Human Yo-Yo', desc: '20 bounces in one go.' },
    { id: 'rip', title: 'These Were LUCKY?!', desc: 'Witnessed an underwear structural failure.' },
    { id: 'skirt', title: 'Bold Fashion Choice', desc: 'Wedgied Riley while wearing a skirt.' }
  ];

  var IDLE_LINES = [
    'Dress me up! …please?',
    'I look GREAT, right?',
    'This rug really ties the room together.',
    'Try the hook. I DARE you.',
    'Whatever you pick… I regret it already.',
    'Spin me around! Gently!!',
    'My undies have seen things.'
  ];

  /* ------------------------------------------------------------------ *
   *  game object
   * ------------------------------------------------------------------ */
  W.Game = function (scene, ui) {
    var game = this;
    var char = W.char;
    var band = new W.Band(scene);
    var spring = new W.Spring(scene);
    var fx = new W.Fx(scene);
    var props = {
      hook: new W.HookProp(scene),
      branch: new W.BranchProp(scene),
      chair: new W.ChairProp(scene)
    };
    var crumple = new W.PantsCrumple(scene);

    band.setStyle(char.undiesStyle());
    char.onUndiesChange(function (style) { band.setStyle(style); });

    // ----- persistent state ------------------------------------------------
    var store = { count: 0, achievements: {}, outfit: null };
    try {
      var saved = localStorage.getItem('ws3d-save');
      if (saved) {
        var parsed = JSON.parse(saved);
        store.count = parsed.count || 0;
        store.achievements = parsed.achievements || {};
        if (parsed.outfit) {
          var o = char.outfit;
          // skin is a plain string; the rest are { id, color } objects
          if (typeof parsed.outfit.skin === 'string') o.skin = parsed.outfit.skin;
          for (var k in parsed.outfit) {
            if (k === 'skin' || !o[k] || typeof parsed.outfit[k] !== 'object' || !parsed.outfit[k]) continue;
            W.extend(o[k], parsed.outfit[k]);
          }
        }
      }
    } catch (e) { /* private mode etc. */ }

    function persist() {
      try {
        localStorage.setItem('ws3d-save', JSON.stringify({
          count: store.count, achievements: store.achievements, outfit: char.outfit
        }));
      } catch (e) {}
    }

    // re-apply the (possibly restored) outfit
    char.equip('skin', null, char.outfit.skin);
    char.equip('hair', char.outfit.hair.id, char.outfit.hair.color);
    char.equip('top', char.outfit.top.id, char.outfit.top.color);
    char.equip('bottom', char.outfit.bottom.id, char.outfit.bottom.color);
    char.equip('undies', char.outfit.undies.id);
    char.equip('shoes', char.outfit.shoes.id, char.outfit.shoes.color);
    char.equip('acc', char.outfit.acc.id, char.outfit.acc.color);

    // ----- runtime state ----------------------------------------------------
    var state = 'idle';
    var stateT = 0;
    var wedgie = null;        // active wedgie def
    var wedgieId = null;
    var wedgieT = 0;
    var onceFlags = {};
    var queuedWedgie = null;
    var fastRelease = false;
    var droppedBottom = null; // id of pants that fell
    var pantsDropped = false;
    var idleChatterT = 5;
    var idleRubT = 0;         // butt-rub mini-animation timer
    var sinceRelease = 99;
    var ripMode = false;

    game.session = { bounces: 0 };
    game.pose = basePose();
    game.char = char;
    game.band = band;
    game.spring = spring;
    game.fx = fx;
    game.props = props;
    game.crumple = crumple;
    game.sfx = W.sfx;
    game.ui = ui;

    ui.setCount(store.count);
    for (var ai = 0; ai < ACHIEVEMENTS.length; ai++) {
      if (store.achievements[ACHIEVEMENTS[ai].id]) ui.markAchievement(ACHIEVEMENTS[ai].id);
    }

    // ----- helpers exposed to wedgie steps -----------------------------------
    game.once = function (key, cond) {
      if (!cond) return false;
      if (onceFlags[key]) return false;
      onceFlags[key] = true;
      return true;
    };
    game.tension = function (base) {
      return W.clamp01((base || 0.3) + (game.lastStretch || 0) * 0.8);
    };
    game.say = function (text, dur) { ui.say(text, dur); };

    game.creakLoop = function (t, interval, volume) {
      var k = Math.floor(t / (interval || 2));
      if (game.once('creak' + k, t > 0.8)) W.sfx.creak(W.range(0.85, 1.2));
    };

    game.popShoes = function () {
      if (char.outfit.shoes.id === 'none') return;
      char.holders.shoes.forEach(function (h) {
        if (h.children.length) fx.tossHolder(h);
      });
    };
    game.poppedAcc = function () {
      var h = char.holders.acc[0];
      if (h.children.length) {
        fx.tossHolder(h, W.V3(W.range(-0.6, 0.6), W.range(2.4, 3.2), W.range(-0.4, 0.4)));
      }
    };

    game.markAchievement = function (id) {
      if (store.achievements[id]) return;
      store.achievements[id] = true;
      persist();
      for (var i = 0; i < ACHIEVEMENTS.length; i++) {
        if (ACHIEVEMENTS[i].id === id) ui.toastAchievement(ACHIEVEMENTS[i]);
      }
    };

    function checkTotalAchievements() {
      var c = store.count;
      if (c >= 1) game.markAchievement('wedgie1');
      if (c >= 10) game.markAchievement('total10');
      if (c >= 25) game.markAchievement('total25');
      if (c >= 50) game.markAchievement('total50');
      if (c === 69) game.markAchievement('nice');
      // all 8 types tried?
      var tried = 0;
      for (var i = 0; i < W.WEDGIE_ORDER.length; i++) {
        if (store.achievements['did_' + W.WEDGIE_ORDER[i]]) tried++;
      }
      if (tried >= W.WEDGIE_ORDER.length) game.markAchievement('all8');
    }

    // ----- pants-down choreography --------------------------------------------
    function dropPants() {
      var b = char.outfit.bottom;
      if (b.id === 'none' || b.id === 'bottom_skirt') {
        if (b.id === 'bottom_skirt') game.markAchievement('skirt');
        return;
      }
      droppedBottom = b.id;
      crumple.setColor(b.color);
      char.equip('bottom', 'none');
      var rootW = char.root.position;
      crumple.showAt(rootW.x, 0.05, rootW.z + 0.1);
      W.sfx.pop();
      fx.painStar(char.buttPoint());
      ui.say(W.pick(['PANTS!! Why the PANTS?!', 'Hey!! Those were buttoned!!', 'Cold! So COLD!']), 1.8);
    }

    // ----- state machine ------------------------------------------------------
    game.startWedgie = function (id) {
      if (!W.WEDGIES[id]) return;
      W.sfx.unlock();
      if (state === 'active' || state === 'intro') {
        // switching mid-wedgie: quick release then queue
        queuedWedgie = id;
        game.release(true);
        return;
      }
      if (state === 'releasing' || state === 'post' || state === 'flopped') {
        queuedWedgie = id;
        return;
      }
      wedgie = W.WEDGIES[id];
      wedgieId = id;
      wedgieT = 0;
      onceFlags = {};
      ripMode = false;
      fastRelease = false;
      pantsDropped = false;
      game.session = { bounces: 0 };
      idleChatterT = W.range(4, 8);
      store.count++;
      store.achievements['did_' + id] = true;
      persist();
      ui.setCount(store.count);
      ui.bumpCounter();
      checkTotalAchievements();

      state = 'intro';
      stateT = 0;
      if (wedgie.prop === 'hook') { props.hook.enter(); W.sfx.whoosh(); }
      else if (wedgie.prop === 'branch') { props.branch.enter(); W.sfx.whoosh(); }
      else if (wedgie.prop === 'chair') { props.chair.enter(); W.sfx.whoosh(); }
      else if (wedgie.prop === 'bungee') { W.sfx.whoosh(); }
    };

    game.release = function (fast) {
      if (state !== 'active' && state !== 'intro') return;
      fastRelease = !!fast;
      sinceRelease = 0;
      // rip chance on repeat atomics
      if (wedgieId === 'atomic' && !fastRelease) {
        if (store.count >= 4 && Math.random() < 0.22) ripMode = true;
      }
      state = 'releasing';
      stateT = 0;
      if (ripMode) {
        W.sfx.rip();
        band.hide();
        game.markAchievement('rip');
        ui.say(W.pick(['RRRIP!! MY LUCKY UNDIES!!', 'They TORE!! Do you know what those MEANT to me?!']), 2.6);
        fx.confettiBurst(char.buttPoint(), 20);
      } else {
        W.sfx.snap();
      }
      props.hook.exit(); props.branch.exit(); props.chair.exit();
      spring.hide();
      char.setUndiesStretch(0);
      // bring the tossed accessories back after the dust settles
      setTimeout(function () {
        char.reattach('shoes');
        char.reattach('acc');
        char.equip('shoes');
        char.equip('acc');
      }, 600);
    };

    game.getWedgie = function () { return (state === 'active') ? wedgieId : null; };
    game.getDebugState = function () {
      return {
        state: state, stateT: stateT, wedgieId: wedgieId, wedgieT: wedgieT,
        queued: queuedWedgie, intro: wedgie ? wedgie.intro : null
      };
    };
    game.isBusy = function () { return state !== 'idle'; };

    // idle overlay: Riley sheepishly rubs the affected area
    function idleOverlay(dt) {
      sinceRelease += dt;
      idleRubT += dt;
      if (sinceRelease > 6 && sinceRelease < 26) {
        var cyc = idleRubT % 7;
        if (cyc < 1.3) {
          var p = game.pose;
          p.shL = [0.72, 0, 0.3]; p.shR = [0.72, 0, -0.3];
          p.elL = [1.5, 0, 0.25]; p.elR = [1.5, 0, -0.25];
          p.neck = [-0.1, 0.06 * Math.sin(idleRubT * 3), 0];
          char.setFace('pain');
          if (game.once('rub' + Math.floor(idleRubT / 7), cyc > 0.1)) {
            if (Math.random() < 0.5) ui.say(W.pick(['Still stings…', 'Never again. …okay maybe once more.', 'I’m walking funny.']), 1.6);
          }
        }
      }
    }

    game.update = function (dt, time) {
      stateT += dt;
      var p = game.pose;

      // reset pose targets each frame
      var base = basePose();
      for (var k in base) p[k] = base[k];

      char.update(dt, time);

      if (state === 'idle') {
        // breathing & fidgeting
        p.torso = [0.04 + 0.02 * Math.sin(time * 1.9), 0, 0];
        p.shL = [0.08, 0, -0.07 - 0.025 * Math.sin(time * 1.9 + 1)];
        p.shR = [0.08, 0, 0.07 + 0.025 * Math.sin(time * 1.9 + 1)];
        p.head = [0, 0.05 * Math.sin(time * 0.6), 0];
        p.rp = [0, 0.004 * Math.sin(time * 1.9), 0];
        char.setFace('neutral');
        idleOverlay(dt);
        idleChatterT -= dt;
        if (idleChatterT <= 0) {
          idleChatterT = W.range(9, 16);
          if (sinceRelease > 4) ui.say(W.pick(IDLE_LINES), 2.8);
        }
        band.hide();
        applyPose(char, p, dt, 10);
      } else if (state === 'intro') {
        var introDur = wedgie.intro || 0.3;
        if (wedgie.pantsDown && stateT > 0.15 && !pantsDropped) {
          pantsDropped = true;
          dropPants();
        }
        // stand tense while the prop arrives
        p.torso = [0.1, 0, 0];
        p.shL = [0.15, 0, -0.2]; p.shR = [0.15, 0, 0.2];
        char.setFace('shock');
        if (stateT >= introDur) {
          state = 'active';
          wedgieT = 0;
          onceFlags = {};
        }
        applyPose(char, p, dt, 10);
      } else if (state === 'active') {
        wedgieT += dt;
        wedgie.step(game, wedgieT, dt);
        char.setUndiesStretch(game.lastStretch || 0);
        // idle commentary while hanging around
        idleChatterT -= dt;
        if (idleChatterT <= 0) {
          idleChatterT = W.range(6, 10);
          if (wedgie.lines.idle) ui.say(W.pick(wedgie.lines.idle), 2.6);
        }
        applyPose(char, p, dt, 12);
      } else if (state === 'releasing') {
        var relDur = fastRelease ? 0.35 : 0.55;
        char.setFace(ripMode ? 'dizzy' : 'pain');
        if (!ripMode && stateT < 0.25) {
          // band snaps back
          g_retract(dt);
        } else {
          band.hide();
        }
        if (wedgieId === 'hanging' || wedgieId === 'bouncy' || wedgieId === 'dangling') {
          if (game.once('plop', stateT > relDur * 0.6)) { W.sfx.thud(); fx.painStar(char.buttPoint()); }
        }
        applyPose(char, p, dt, 14);
        if (stateT >= relDur) {
          if (ripMode) {
            state = 'flopped';
            stateT = 0;
            ui.say(W.pick(['These were my FANCY ones…', 'RIP. Literally.']), 2.2);
          } else {
            state = 'post';
            stateT = 0;
            if (wedgie && wedgie.lines.release && !fastRelease) {
              ui.say(W.pick(wedgie.lines.release), 2.4);
              W.sfx.tada();
            }
          }
          // pants come back (Riley keeps spares)
          if (droppedBottom) {
            var spareBottom = droppedBottom;
            setTimeout(function () {
              if (char.outfit.bottom.id === 'none') char.equip('bottom', spareBottom);
              droppedBottom = null;
            }, 400);
            setTimeout(function () { crumple.hide(); }, 1500);
          }
        }
      } else if (state === 'flopped') {
        // sitting on the floor after a catastrophic rip
        p.rp = [0, -0.56, 0];
        p.hipL = [-1.35, 0, -0.12]; p.hipR = [-1.35, 0, 0.12];
        p.kneeL = [0.12, 0, 0]; p.kneeR = [0.12, 0, 0];
        p.shL = [0.95, 0, -0.3]; p.shR = [0.95, 0, 0.3];
        p.elL = [-0.1, 0, 0]; p.elR = [-0.1, 0, 0];
        p.torso = [0.38, 0, 0]; p.neck = [0.3, 0.15 * Math.sin(stateT * 3), 0]; p.head = [0.15, 0, 0];
        char.setFace('dizzy');
        applyPose(char, p, dt, 9);
        if (stateT > 1.7) { state = 'post'; stateT = 0; ui.say('I have ONE pair left. ONE.', 2.2); W.sfx.tada(); }
      } else if (state === 'post') {
        // shimmy the undies back into place
        var t2 = stateT;
        p.shL = [-0.5, 0, 0.32]; p.shR = [-0.5, 0, -0.32];
        p.elL = [-1.25, 0, 0.15]; p.elR = [-1.25, 0, -0.15];
        p.pelvis = [0, 0, 0.13 * Math.sin(t2 * 9)];
        p.rp = [0, 0, 0.02 * Math.sin(t2 * 9)];
        p.torso = [0.08, 0, -0.05 * Math.sin(t2 * 9)];
        char.setFace(t2 > 1.0 ? 'happy' : 'pain');
        applyPose(char, p, dt, 12);
        if (stateT > 1.5) {
          state = 'idle';
          stateT = 0;
          sinceRelease = 0;
          idleRubT = 0;
          onceFlags = {};
          if (queuedWedgie) {
            var q = queuedWedgie; queuedWedgie = null;
            game.startWedgie(q);
          }
        }
      }

      // idle-state queued wedgie (e.g. clicked during 'post')
      if (state === 'idle' && queuedWedgie) {
        var q2 = queuedWedgie; queuedWedgie = null;
        game.startWedgie(q2);
      }

      props.hook.update(dt);
      props.branch.update(dt);
      props.chair.update(dt);
      fx.update(dt);
      if (ui.tickWedgie) ui.tickWedgie(state === 'active' || state === 'intro' ? wedgieId : null);

      // track band tip for tension calculation
      if (band.mesh.visible) {
        var arr = band.mesh.geometry.attributes.position.array;
        var n = arr.length / 6;
        if (!bandLastTipVec) bandLastTipVec = W.V3(0, 0, 0);
        bandLastTipVec.set(arr[(n - 1) * 6], arr[(n - 1) * 6 + 1], arr[(n - 1) * 6 + 2]);
        game.lastStretch = char.waistPoint('back').distanceTo(bandLastTipVec) * 0.45;
      } else {
        game.lastStretch = 0;
      }
    };

    var bandLastTipVec = null;

    function g_retract(dt) {
      // pull the band tip back down toward the waist before hiding
      var c = char;
      if (!band.mesh.visible) return;
      var arr = band.mesh.geometry.attributes.position.array;
      var n = arr.length / 6;
      var tip = W.V3(arr[(n - 1) * 6], arr[(n - 1) * 6 + 1], arr[(n - 1) * 6 + 2]);
      var waist = c.waistPoint('back');
      tip.lerp(waist, Math.min(1, dt * 14));
      band.update([waist, c.buttPoint(), tip], 0.13, 0.1);
    }

    // ----- wardrobe API for the UI ---------------------------------------------
    game.equip = function (cat, itemId, colorHex) {
      char.equip(cat, itemId, colorHex);
      persist();
    };
    game.randomize = function () {
      var wd = W.WARDROBE;
      function pickItem(cat) { return W.pick(wd[cat].items).id; }
      function pickColor(cat) {
        if (wd[cat].colors) return W.pick(wd[cat].colors);
        return undefined;
      }
      game.equip('skin', null, W.pick(wd.skin.items).color);
      game.equip('hair', pickItem('hair'), pickColor('hair'));
      game.equip('top', pickItem('top'), pickColor('top'));
      game.equip('bottom', pickItem('bottom'), pickColor('bottom'));
      game.equip('undies', pickItem('undies'));
      game.equip('shoes', pickItem('shoes'), pickColor('shoes'));
      game.equip('acc', pickItem('acc'), pickColor('acc'));
      char.setFace('happy');
      ui.say(W.pick(['Ooh! Fashion!', 'I feel PRETTY!', 'Does this say "victim"?', 'Cute!! Aggressively cute!!']), 2.4);
      W.sfx.pop();
    };
    game.strip = function () {
      game.equip('top', 'none');
      game.equip('bottom', 'none');
      game.equip('acc', 'none');
      char.setFace('shock');
      ui.say(W.pick(['BRRR! Cold!', 'Straight to the undies? Bold.', 'At least they’re clean… probably.']), 2.6);
      W.sfx.pop();
    };
    game.resetSave = function () {
      store.count = 0;
      store.achievements = {};
      persist();
      ui.setCount(0);
      ui.toast('🔄 Counter reset. Riley thanks you. (Not really.)');
    };
    game.getTotal = function () { return store.count; };

    return game;
  };
})();
