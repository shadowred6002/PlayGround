/* Wedgie Studio 3D — renderer boot & interaction glue */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  if (params.has('nohelp') || params.has('nointro')) {
    try { localStorage.setItem('ws3d-help-seen', '1'); } catch (e) {}
  }
  if (params.has('reset')) {
    try { localStorage.removeItem('ws3d-save'); } catch (e) {}
  }

  var loading = document.getElementById('loading');
  var loadingText = document.getElementById('loadingText');
  var viewport = document.getElementById('viewport');
  var canvas = document.getElementById('scene');

  if (typeof THREE === 'undefined') {
    if (loadingText) loadingText.textContent = 'Three.js failed to load. Check the vendor folder.';
    return;
  }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    if (loadingText) loadingText.textContent = 'WebGL is unavailable in this browser. Try Chrome, Edge or Firefox.';
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(viewport.clientWidth || window.innerWidth, viewport.clientHeight || window.innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.NoToneMapping;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(2.55, 1.9, 4.25);

  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.08, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.rotateSpeed = 0.72;
  controls.zoomSpeed = 0.85;
  controls.enablePan = false;
  controls.minDistance = 2.1;
  controls.maxDistance = 9;
  controls.minPolarAngle = 0.22;
  controls.maxPolarAngle = Math.PI * 0.485;
  controls.update();

  var world = null;
  var game = null;
  var ui = null;

  try {
    W.buildCharacter();
    scene.add(W.char.root);
    world = W.buildWorld(scene);

    ui = new W.UI();
    game = new W.Game(scene, ui);
    ui.bind(game);

    // the 2D game's styling stays untouched — this is a separate studio
    if (window.innerWidth >= 1024) {
      document.getElementById('wardrobe').classList.add('open');
    }
  } catch (err) {
    console.error('Wedgie Studio 3D failed to start:', err);
    if (loadingText) loadingText.textContent = 'Something snapped: ' + (err && err.message ? err.message : err);
    return;
  }

  // wardrobe close button is presentation-only, so wire it here
  document.getElementById('wardrobeClose').addEventListener('click', function () {
    document.getElementById('wardrobe').classList.remove('open');
  });
  document.getElementById('helpStart').addEventListener('click', function () {
    document.getElementById('helpModal').classList.remove('open');
  });

  function toggleWardrobe(force) {
    var panel = document.getElementById('wardrobe');
    if (force === undefined) panel.classList.toggle('open');
    else panel.classList.toggle('open', !!force);
  }

  function closeTopModal() {
    var open = document.querySelector('.modal.open');
    if (open) open.classList.remove('open');
    return !!open;
  }

  window.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;

    if (e.key >= '1' && e.key <= '8') {
      var id = W.WEDGIE_ORDER[parseInt(e.key, 10) - 1];
      if (id) game.startWedgie(id);
      return;
    }
    var k = e.key.toLowerCase();
    if (k === 'r') game.release();
    else if (k === 'w') toggleWardrobe();
    else if (k === 'h') ui.openHelp();
    else if (k === 'm') document.getElementById('btnSound').click();
    else if (e.key === 'Escape') {
      if (!closeTopModal()) toggleWardrobe(false);
    }
  });

  window.addEventListener('pointerdown', function () { W.sfx.unlock(); }, { once: true });

  // ---- responsive sizing -------------------------------------------------
  var baseCameraDistance = camera.position.distanceTo(controls.target);
  var compactCamera = false;

  // Short phones get a slightly wider shot so the wedgie tray never covers
  // Riley's feet.
  function frameCamera() {
    var compact = window.innerWidth <= 760 && window.innerHeight <= 720;
    if (compact === compactCamera) return;
    compactCamera = compact;
    var dir = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(dir, baseCameraDistance * (compact ? 1.24 : 1));
    controls.update();
  }

  function resize() {
    var w = viewport.clientWidth || window.innerWidth;
    var h = viewport.clientHeight || window.innerHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    frameCamera();
  }
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(viewport);
  }
  resize();

  // ---- main loop ---------------------------------------------------------
  var clock = new THREE.Clock();
  var headPos = new THREE.Vector3();

  function frame() {
    requestAnimationFrame(frame);
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;

    game.update(dt, t);
    if (world) world.update(dt, t);
    controls.update();
    renderer.render(scene, camera);

    // keep the speech bubble pinned above Riley's head
    headPos.copy(W.char.headPoint(0, 0.19, 0));
    headPos.project(camera);
    var w = viewport.clientWidth || window.innerWidth;
    var h = viewport.clientHeight || window.innerHeight;
    var x = (headPos.x * 0.5 + 0.5) * w;
    var y = (-headPos.y * 0.5 + 0.5) * h - 24;
    var onScreen = headPos.z < 1 && x > -60 && x < w + 60 && y > -20 && y < h + 60;
    ui.updateBubble(
      Math.max(96, Math.min(w - 96, x)),
      Math.max(72, Math.min(h - 110, y)),
      onScreen
    );
  }

  // expose a small debug handle for manual testing
  window.ws3d = { scene: scene, camera: camera, renderer: renderer, game: game, ui: ui, controls: controls };
  frame();
})();
