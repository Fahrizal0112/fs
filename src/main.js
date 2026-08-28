import * as THREE from "three";
import "./style.css";
import galleryManifest from "./gallery-manifest.json";

var galleryModules = import.meta.glob("./gallery/*.jpg", { eager: true, import: "default" });

(function () {
  "use strict";

  var JADIAN_DATE = "2025-11-29T00:00:00+07:00";
  var TARGET_ANNIV = "2026-11-29T00:00:00+07:00";

  /* ---------- gallery: render all photos + lightbox viewer ---------- */
  var galleryPhotos = galleryManifest.map(function (entry) {
    return { src: galleryModules["./gallery/" + entry.file], label: entry.label };
  });

  function initGallery() {
    var grid = document.getElementById("galleryGrid");
    if (!grid) return;

    galleryPhotos.forEach(function (photo, index) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gallery-thumb";
      btn.setAttribute("aria-label", "Buka foto " + (photo.label || index + 1));
      var img = document.createElement("img");
      img.src = photo.src;
      img.alt = "";
      img.loading = "lazy";
      btn.appendChild(img);
      btn.addEventListener("click", function () { openLightbox(index); });
      grid.appendChild(btn);
    });

    var lightbox = document.getElementById("lightbox");
    var lightboxImg = document.getElementById("lightboxImg");
    var lightboxCaption = document.getElementById("lightboxCaption");
    var closeBtn = document.getElementById("lightboxClose");
    var prevBtn = document.getElementById("lightboxPrev");
    var nextBtn = document.getElementById("lightboxNext");
    var currentIndex = 0;

    function showAt(index) {
      currentIndex = (index + galleryPhotos.length) % galleryPhotos.length;
      var photo = galleryPhotos[currentIndex];
      lightboxImg.src = photo.src;
      lightboxImg.alt = photo.label ? "Foto tanggal " + photo.label : "Foto kenangan";
      lightboxCaption.textContent = photo.label || "";
    }

    function openLightbox(index) {
      showAt(index);
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function closeLightbox() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    closeBtn.addEventListener("click", closeLightbox);
    prevBtn.addEventListener("click", function () { showAt(currentIndex - 1); });
    nextBtn.addEventListener("click", function () { showAt(currentIndex + 1); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") showAt(currentIndex - 1);
      else if (e.key === "ArrowRight") showAt(currentIndex + 1);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGallery);
  } else {
    initGallery();
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  function updateDayCount() {
    var start = new Date(JADIAN_DATE);
    var now = new Date();
    var days = Math.max(0, Math.floor((now - start) / 86400000));
    var hero = document.getElementById("dayCount");
    if (hero) hero.textContent = "Sudah " + days + " hari kita jalan bareng";
    var inline = document.getElementById("nowDayCount");
    if (inline) inline.textContent = "sudah " + days + " hari";
  }

  function updateCountdown() {
    var target = new Date(TARGET_ANNIV);
    var now = new Date();
    var diff = target - now;
    var section = document.getElementById("countdown-section");
    var d = document.getElementById("cd-days");
    var h = document.getElementById("cd-hours");
    var m = document.getElementById("cd-mins");
    var s = document.getElementById("cd-secs");
    if (diff <= 0) {
      if (section) section.classList.add("arrived");
      if (d) d.textContent = "00";
      if (h) h.textContent = "00";
      if (m) m.textContent = "00";
      if (s) s.textContent = "00";
      return;
    }
    var days = Math.floor(diff / 86400000); diff -= days * 86400000;
    var hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
    var mins = Math.floor(diff / 60000); diff -= mins * 60000;
    var secs = Math.floor(diff / 1000);
    if (d) d.textContent = pad(days);
    if (h) h.textContent = pad(hours);
    if (m) m.textContent = pad(mins);
    if (s) s.textContent = pad(secs);
  }

  updateDayCount();
  updateCountdown();
  setInterval(updateDayCount, 3600000);
  setInterval(updateCountdown, 1000);

  /* ---------- scroll-reveal fallback for browsers without CSS scroll-driven animations ---------- */
  var supportsScrollTimeline = false;
  try {
    supportsScrollTimeline = CSS.supports("(animation-timeline: view()) and (animation-range: entry)");
  } catch (e) { supportsScrollTimeline = false; }

  if (!supportsScrollTimeline) {
    var cards = document.querySelectorAll(".scene:not(.hero) .card");
    cards.forEach(function (el) { el.classList.add("js-reveal-init"); });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      cards.forEach(function (el) { io.observe(el); });
    } else {
      cards.forEach(function (el) { el.classList.add("in-view"); });
    }
  }

  /* ---------- 3D starfield / galaxy that morphs shape as the page scrolls ---------- */
  var reducedMotion = false;
  try {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) { reducedMotion = false; }

  var webglAvailable = false;
  try {
    var testCanvas = document.createElement("canvas");
    webglAvailable = !!(window.WebGLRenderingContext && (testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl")));
  } catch (e) { webglAvailable = false; }
  if (!webglAvailable) return; // graceful degrade: body gradient still looks fine alone

  var canvas = document.getElementById("galaxy");
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 8.4;

  function smoothstepClamp(value, edge0, edge1) {
    var t = (value - edge0) / (edge1 - edge0);
    t = Math.min(1, Math.max(0, t));
    return t * t * (3 - 2 * t);
  }

  var N = 1700;

  function dotTexture() {
    var size = 64;
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(255,255,255,0.7)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  function heartPoint(t) {
    var x = 16 * Math.pow(Math.sin(t), 3);
    var y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x: x, y: y };
  }

  function makeHeart(n, scale, fill) {
    var arr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var t = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.03;
      var p = heartPoint(t);
      var r = fill ? 0.9 + Math.random() * 0.22 : 0.98 + Math.random() * 0.06;
      arr[i * 3] = p.x * scale * r;
      arr[i * 3 + 1] = p.y * scale * r;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.55;
    }
    return arr;
  }

  function makeInfinity(n) {
    var arr = new Float32Array(n * 3);
    var a = 3.3;
    for (var i = 0; i < n; i++) {
      var t = (i / n) * Math.PI * 2;
      var denom = 1 + Math.sin(t) * Math.sin(t);
      var x = (a * Math.cos(t)) / denom;
      var y = (a * Math.sin(t) * Math.cos(t)) / denom;
      var r = 0.92 + Math.random() * 0.18;
      arr[i * 3] = x * r;
      arr[i * 3 + 1] = y * r * 1.15;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    }
    return arr;
  }

  function sphereJitter(cx, cy, cz, radius) {
    var u = Math.random(), v = Math.random();
    var theta = u * Math.PI * 2;
    var phi = Math.acos(2 * v - 1);
    var r = radius * Math.pow(Math.random(), 1 / 3);
    return {
      x: cx + r * Math.sin(phi) * Math.cos(theta),
      y: cy + r * Math.sin(phi) * Math.sin(theta) * 0.7,
      z: cz + r * Math.cos(phi) * 0.6
    };
  }

  function makeTwoClusters(n, ax, ay, az, bx, by, bz, radius) {
    var arr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var p = i % 2 === 0 ? sphereJitter(ax, ay, az, radius) : sphereJitter(bx, by, bz, radius);
      arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z;
    }
    return arr;
  }

  function makeBridgingClusters(n, ax, ay, az, bx, by, bz, radius) {
    var arr = new Float32Array(n * 3);
    var bridgeCount = Math.floor(n * 0.12);
    for (var i = 0; i < n; i++) {
      var p;
      if (i < bridgeCount) {
        var t = i / bridgeCount;
        p = {
          x: ax + (bx - ax) * t + (Math.random() - 0.5) * 0.3,
          y: ay + (by - ay) * t + (Math.random() - 0.5) * 0.3,
          z: az + (bz - az) * t + (Math.random() - 0.5) * 0.3
        };
      } else {
        p = (i % 2 === 0) ? sphereJitter(ax, ay, az, radius) : sphereJitter(bx, by, bz, radius);
      }
      arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z;
    }
    return arr;
  }

  function makeScatter(n) {
    var arr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 15;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6.5;
    }
    return arr;
  }

  function makeBurst(n) {
    var arr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var u = Math.random(), v = Math.random();
      var theta = u * Math.PI * 2;
      var phi = Math.acos(2 * v - 1);
      var r = 2.2 + Math.random() * 5.4;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.8;
      arr[i * 3 + 2] = r * Math.cos(phi) * 0.7;
    }
    return arr;
  }

  var shapePositions = [
    makeScatter(N),                                                   // 0 hero
    makeTwoClusters(N, -3.1, 0.35, -0.4, 3.0, -0.3, 0.5, 1.05),        // 1 pertama ketemu
    makeBridgingClusters(N, -1.3, 0.25, -0.3, 1.3, -0.2, 0.35, 0.95),  // 2 mulai dekat
    makeHeart(N, 0.145, true),                                        // 3 jadian
    makeBurst(N),                                                     // 4 momen berkesan
    makeInfinity(N),                                                  // 5 sekarang
    makeInfinity(N),                                                  // 6 galeri kenangan
    makeHeart(N, 0.17, false),                                        // 7 countdown
    makeHeart(N, 0.17, false)                                         // 8 surat
  ];

  var shapeColorHex = [0x9fb4ff, 0xb9a6e0, 0xd9a8c9, 0xf2b6c6, 0xe8c07d, 0xcf9fd0, 0xcf9fd0, 0xf7c9d6, 0xf7c9d6];
  var shapeColors = shapeColorHex.map(function (h) { return new THREE.Color(h); });

  var geometry = new THREE.BufferGeometry();
  var current = new Float32Array(N * 3);
  current.set(shapePositions[0]);
  geometry.setAttribute("position", new THREE.BufferAttribute(current, 3));

  var material = new THREE.PointsMaterial({
    size: 0.075,
    map: dotTexture(),
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: shapeColors[0]
  });

  var points = new THREE.Points(geometry, material);
  points.renderOrder = 1;
  scene.add(points);

  /* ---------- the 3D model: a lit, glossy heart mesh that grows through the story ---------- */
  var ambientLight = new THREE.AmbientLight(0x554a7a, 1.0);
  scene.add(ambientLight);

  var keyLight = new THREE.PointLight(0xe8c07d, 2.1, 30, 2);
  keyLight.position.set(3.2, 3.6, 5);
  scene.add(keyLight);

  var rimLight = new THREE.PointLight(0xb9a6e0, 1.3, 30, 2);
  rimLight.position.set(-4, -2.2, 3);
  scene.add(rimLight);

  function heartOutline2D() {
    var shape = new THREE.Shape();
    var x = 0, y = 0;
    shape.moveTo(x + 0.25, y + 0.25);
    shape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.2, y, x, y);
    shape.bezierCurveTo(x - 0.3, y, x - 0.3, y + 0.35, x - 0.3, y + 0.35);
    shape.bezierCurveTo(x - 0.3, y + 0.55, x - 0.1, y + 0.77, x + 0.25, y + 0.95);
    shape.bezierCurveTo(x + 0.6, y + 0.77, x + 0.8, y + 0.55, x + 0.8, y + 0.35);
    shape.bezierCurveTo(x + 0.8, y + 0.35, x + 0.8, y, x + 0.5, y);
    shape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);
    return shape;
  }

  var heartMesh = null;
  try {
    var heartGeo = new THREE.ExtrudeGeometry(heartOutline2D(), {
      depth: 0.32,
      bevelEnabled: true,
      bevelSegments: 6,
      steps: 2,
      bevelSize: 0.06,
      bevelThickness: 0.06,
      curveSegments: 24
    });
    heartGeo.center();
    heartGeo.rotateZ(Math.PI);
    heartGeo.scale(2.5, 2.5, 2.5);

    var heartMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf2b6c6,
      emissive: 0x3a1020,
      emissiveIntensity: 0.3,
      metalness: 0.2,
      roughness: 0.26,
      clearcoat: 0.65,
      clearcoatRoughness: 0.3,
      transparent: true,
      opacity: 0
    });

    heartMesh = new THREE.Mesh(heartGeo, heartMaterial);
    heartMesh.renderOrder = 0;
    heartMesh.scale.setScalar(0.001);
    scene.add(heartMesh);
  } catch (e) { heartMesh = null; }

  var mouseTX = 0, mouseTY = 0;
  window.addEventListener("mousemove", function (e) {
    if (reducedMotion) return;
    mouseTX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseTY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  var tempColor = new THREE.Color();
  var smoothedFrac = 0;

  function getScrollProgress() {
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return 0;
    var top = window.scrollY || document.documentElement.scrollTop;
    return Math.min(1, Math.max(0, top / maxScroll));
  }

  function render(withIdleMotion) {
    var rawFrac = getScrollProgress();
    // ease toward the real scroll position instead of snapping to it — this is what
    // keeps the motion feeling fluid/alive rather than stiff.
    if (withIdleMotion) {
      smoothedFrac += (rawFrac - smoothedFrac) * 0.07;
    } else {
      smoothedFrac = rawFrac;
    }
    var frac = smoothedFrac;
    var now = Date.now();

    var count = shapePositions.length;
    var idxFloat = frac * (count - 1);
    var i0 = Math.floor(idxFloat);
    var i1 = Math.min(i0 + 1, count - 1);
    var t = idxFloat - i0;
    t = t * t * (3 - 2 * t);

    var A = shapePositions[i0], B = shapePositions[i1];
    var pos = geometry.attributes.position.array;
    for (var k = 0; k < N * 3; k++) {
      pos[k] = A[k] + (B[k] - A[k]) * t;
    }
    geometry.attributes.position.needsUpdate = true;

    tempColor.copy(shapeColors[i0]).lerp(shapeColors[i1], t);
    material.color.copy(tempColor);

    if (withIdleMotion) {
      points.rotation.y += 0.0009;
      points.rotation.x = Math.sin(now * 0.00012) * 0.05;
    }

    // the heart mesh grows in around "Jadian" and keeps glowing brighter through
    // the countdown and letter — it's the actual 3D model in the scene.
    if (heartMesh) {
      var growth = smoothstepClamp(idxFloat, 0.5, 3);
      var glow = smoothstepClamp(idxFloat, 3, 7);
      var pulse = withIdleMotion ? 1 + Math.sin(now * 0.0016) * 0.035 : 1;
      var scale = Math.max(0.001, (0.12 + 0.88 * growth) * pulse);

      heartMesh.scale.setScalar(scale);
      heartMesh.material.opacity = growth * 0.85;
      heartMesh.material.emissiveIntensity = 0.22 + 0.45 * glow;

      if (withIdleMotion) {
        heartMesh.rotation.y += 0.0045;
        heartMesh.rotation.x = Math.sin(now * 0.0009) * 0.12 + (frac - 0.5) * 0.3;
        heartMesh.position.y = Math.sin(now * 0.0006) * 0.09;

        camera.position.x += (mouseTX * 0.4 - camera.position.x) * 0.04;
        camera.position.y += (-mouseTY * 0.25 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
      }
    }

    renderer.render(scene, camera);
  }

  function onResize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }

  if (reducedMotion) {
    render(false);
    window.addEventListener("scroll", function () { render(false); }, { passive: true });
    window.addEventListener("resize", function () { onResize(); render(false); }, { passive: true });
  } else {
    window.addEventListener("resize", onResize, { passive: true });
    (function loop() {
      render(true);
      requestAnimationFrame(loop);
    })();
  }
})();
