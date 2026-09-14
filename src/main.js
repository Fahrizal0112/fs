import * as THREE from "three";
import { animate, createTimeline, stagger } from "animejs";
import "./style.css";
import galleryManifest from "./gallery-manifest.json";

var galleryModules = import.meta.glob("./gallery/*.jpg", { eager: true, import: "default" });

(function () {
  "use strict";

  var JADIAN_DATE = "2025-11-29T00:00:00+07:00";
  var TARGET_ANNIV = "2026-11-29T00:00:00+07:00";

  /* ---------- shared motion preference, used by every animated bit below ---------- */
  var reducedMotion = false;
  try {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) { reducedMotion = false; }

  function toArray(nodeList) { return Array.prototype.slice.call(nodeList || []); }

  /* ---------- everything below only runs once the site is actually unlocked ---------- */
  function initSite() {

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
      btn.setAttribute("aria-label", "View photo " + (photo.label || index + 1));
      var img = document.createElement("img");
      img.src = photo.src;
      img.alt = "";
      img.loading = "lazy";
      btn.appendChild(img);
      btn.addEventListener("click", function () { openLightbox(index); });
      grid.appendChild(btn);
    });

    var lightbox = document.getElementById("lightbox");
    var lightboxFigure = lightbox.querySelector(".lightbox-figure");
    var lightboxImg = document.getElementById("lightboxImg");
    var lightboxCaption = document.getElementById("lightboxCaption");
    var closeBtn = document.getElementById("lightboxClose");
    var prevBtn = document.getElementById("lightboxPrev");
    var nextBtn = document.getElementById("lightboxNext");
    var currentIndex = 0;

    function applyPhoto(photo) {
      lightboxImg.src = photo.src;
      lightboxImg.alt = photo.label ? "Photo from " + photo.label : "Memory photo";
      lightboxCaption.textContent = photo.label || "";
    }

    // crossfade between photos when navigating prev/next inside an already-open lightbox
    function showAt(index, animateSwap) {
      currentIndex = (index + galleryPhotos.length) % galleryPhotos.length;
      var photo = galleryPhotos[currentIndex];
      if (animateSwap && !reducedMotion) {
        animate(lightboxImg, {
          opacity: [1, 0.12],
          duration: 130,
          ease: "inQuad",
          onComplete: function () {
            applyPhoto(photo);
            animate(lightboxImg, { opacity: [0.12, 1], duration: 240, ease: "outQuad" });
          }
        });
      } else {
        applyPhoto(photo);
      }
    }

    function openLightbox(index) {
      showAt(index, false);
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (reducedMotion) {
        lightbox.style.opacity = "";
        lightboxFigure.style.opacity = "";
        lightboxFigure.style.transform = "";
      } else {
        animate(lightbox, { opacity: [0, 1], duration: 200, ease: "linear" });
        animate(lightboxFigure, { opacity: [0, 1], scale: [0.86, 1], duration: 420, ease: "outBack(1.7)" });
      }
    }

    function finalizeClose() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      lightbox.style.opacity = "";
      lightboxFigure.style.opacity = "";
      lightboxFigure.style.transform = "";
    }

    function closeLightbox() {
      if (reducedMotion) {
        finalizeClose();
        return;
      }
      animate(lightboxFigure, { opacity: [1, 0], scale: [1, 0.92], duration: 220, ease: "inQuad" });
      animate(lightbox, { opacity: [1, 0], duration: 260, ease: "linear", onComplete: finalizeClose });
    }

    closeBtn.addEventListener("click", closeLightbox);
    prevBtn.addEventListener("click", function () { showAt(currentIndex - 1, true); });
    nextBtn.addEventListener("click", function () { showAt(currentIndex + 1, true); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") showAt(currentIndex - 1, true);
      else if (e.key === "ArrowRight") showAt(currentIndex + 1, true);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGallery);
  } else {
    initGallery();
  }

  function pad(n) { return String(n).padStart(2, "0"); }

  /* ---------- countdown digits give a small pop whenever they actually change ---------- */
  var cdPrev = { d: null, h: null, m: null, s: null };
  function bumpDigit(el, key, text, big) {
    if (!el) return;
    var changed = cdPrev[key] !== null && cdPrev[key] !== text;
    el.textContent = text;
    cdPrev[key] = text;
    if (changed && !reducedMotion) {
      animate(el, big
        ? { scale: [1, 1.26, 1], duration: 460, ease: "outBack(2.2)" }
        : { scale: [1, 1.1, 1], duration: 240, ease: "outQuad" });
    }
  }

  function updateDayCount() {
    var start = new Date(JADIAN_DATE);
    var now = new Date();
    var days = Math.max(0, Math.floor((now - start) / 86400000));
    var hero = document.getElementById("dayCount");
    if (hero) hero.textContent = "We've been together for " + days + " days";
    var inline = document.getElementById("nowDayCount");
    if (inline) inline.textContent = "it's been " + days + " days";
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
      bumpDigit(d, "d", "00", false);
      bumpDigit(h, "h", "00", false);
      bumpDigit(m, "m", "00", false);
      bumpDigit(s, "s", "00", false);
      return;
    }
    var days = Math.floor(diff / 86400000); diff -= days * 86400000;
    var hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
    var mins = Math.floor(diff / 60000); diff -= mins * 60000;
    var secs = Math.floor(diff / 1000);
    bumpDigit(d, "d", pad(days), true);
    bumpDigit(h, "h", pad(hours), true);
    bumpDigit(m, "m", pad(mins), true);
    bumpDigit(s, "s", pad(secs), false);
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

  /* ---------- anime.js entrance choreography ----------
     Splits headings into words and orchestrates a per-section timeline
     (tag -> heading -> photo -> copy -> extras) that plays once as each
     card scrolls into view, on top of the CSS reveal above. Wrapped in a
     try/catch that falls back to "just show everything" so a library
     hiccup can never leave the page stuck invisible. */
  try {
    if (!reducedMotion) {
      function splitWords(el) {
        if (!el || el.dataset.split === "1") return;
        var nodes = toArray(el.childNodes);
        var frag = document.createDocumentFragment();
        nodes.forEach(function (node) {
          if (node.nodeType === Node.TEXT_NODE) {
            node.textContent.split(/(\s+)/).forEach(function (part) {
              if (part === "") return;
              if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(part));
              } else {
                var span = document.createElement("span");
                span.className = "word";
                span.textContent = part;
                frag.appendChild(span);
              }
            });
          } else {
            var wrap = document.createElement("span");
            wrap.className = "word";
            wrap.appendChild(node.cloneNode(true));
            frag.appendChild(wrap);
          }
        });
        el.textContent = "";
        el.appendChild(frag);
        el.dataset.split = "1";
      }

      function gridColumnCount(grid) {
        if (!grid) return 1;
        try {
          var cols = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean);
          return Math.max(1, cols.length);
        } catch (e) { return 1; }
      }

      // hero: plays once, immediately
      (function revealHero() {
        var heroInner = document.querySelector(".hero-inner");
        if (!heroInner) return;
        var namesEl = heroInner.querySelector(".names");
        splitWords(namesEl);
        var words = namesEl ? namesEl.querySelectorAll(".word") : [];
        createTimeline({ defaults: { ease: "outExpo" } })
          .add(".hero .eyebrow", { opacity: [0, 1], translateY: [12, 0], duration: 650 })
          .add(words, { opacity: [0, 1], translateY: [28, 0], rotateZ: [5, -1], duration: 900, delay: stagger(70) }, "-=380")
          .add(".hero .since", { opacity: [0, 1], translateY: [12, 0], duration: 650 }, "-=480")
          .add(".hero .daycount", { opacity: [0, 1], duration: 550 }, "-=380")
          .add(".hero .scroll-hint", { opacity: [0, 1], translateY: [10, 0], duration: 550 }, "-=280");
      })();

      // every other section: plays once, the first time it enters the viewport
      function revealCard(card) {
        var tag = card.querySelector(".tag");
        var heading = card.querySelector("h2");
        splitWords(heading);
        var words = heading ? heading.querySelectorAll(".word") : [];
        var photo = card.querySelector(".photo-frame");
        var story = card.querySelector(".story");
        var letterParas = card.querySelectorAll(".letter-body p");
        var cdUnits = card.querySelectorAll(".cd-unit");
        var galleryGrid = card.querySelector("#galleryGrid");
        var thumbs = galleryGrid ? galleryGrid.querySelectorAll(".gallery-thumb") : [];

        var tl = createTimeline({ defaults: { ease: "outQuart" } });

        if (tag) tl.add(tag, { opacity: [0, 1], translateX: [-18, 0], duration: 520 });
        if (words.length) tl.add(words, { opacity: [0, 1], translateY: [22, 0], rotateZ: [3, 0], duration: 640, delay: stagger(45) }, tag ? "-=340" : 0);
        if (photo) tl.add(photo, { opacity: [0, 1], scale: [0.93, 1], duration: 760, ease: "outExpo" }, "-=340");
        if (story) tl.add(story, { opacity: [0, 1], translateY: [16, 0], duration: 620 }, "-=420");
        if (letterParas.length) tl.add(letterParas, { opacity: [0, 1], translateY: [14, 0], duration: 560, delay: stagger(130) }, "-=280");
        if (cdUnits.length) tl.add(cdUnits, { opacity: [0, 1], translateY: [18, 0], scale: [0.82, 1], duration: 560, delay: stagger(90, { from: "center" }) }, "-=260");
        if (thumbs.length) {
          var cols = gridColumnCount(galleryGrid);
          tl.add(thumbs, {
            opacity: [0, 1],
            scale: [0.5, 1],
            duration: 520,
            delay: stagger(16, { grid: [cols, Math.ceil(thumbs.length / cols)], from: "center" })
          }, "-=260");
        }
      }

      var sectionCards = document.querySelectorAll(".scene:not(.hero) .card");
      sectionCards.forEach(function (card) { splitWords(card.querySelector("h2")); });

      if ("IntersectionObserver" in window) {
        var revealObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              revealCard(entry.target);
              revealObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.28 });
        sectionCards.forEach(function (card) { revealObserver.observe(card); });
      } else {
        document.documentElement.classList.add("anime-fallback");
      }
    }
  } catch (e) {
    document.documentElement.classList.add("anime-fallback");
  }

  /* ---------- 3D starfield / galaxy that morphs shape as the page scrolls ---------- */
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
    g.addColorStop(0.2, "rgba(255,255,255,0.92)");
    g.addColorStop(0.5, "rgba(245,230,200,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  function makeSpiralGalaxy(n) {
    var arr = new Float32Array(n * 3);
    var arms = 2;
    for (var i = 0; i < n; i++) {
      var arm = i % arms;
      var dist = Math.pow(Math.random(), 0.75) * 4.4 + 0.2;
      var angle = dist * 1.6 + arm * Math.PI + (Math.random() - 0.5) * 0.38;
      var r = 0.95 + Math.random() * 0.1;
      arr[i * 3] = Math.cos(angle) * dist * r;
      arr[i * 3 + 1] = Math.sin(angle) * dist * 0.78 * r;
      arr[i * 3 + 2] = (Math.random() - 0.5) * (0.85 / (dist * 0.45 + 0.8));
    }
    return arr;
  }

  function makeOrbitalRing(n) {
    var arr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var angle = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.05;
      var radius = i % 2 === 0 ? 3.2 : 2.4;
      var jitter = 0.94 + Math.random() * 0.12;
      arr[i * 3] = Math.cos(angle) * radius * jitter;
      arr[i * 3 + 1] = Math.sin(angle) * radius * 0.65 * jitter;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    return arr;
  }

  function makeConstellationField(n) {
    var arr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var theta = (i / n) * Math.PI * 2 * 7;
      var phi = Math.acos(2 * (i / n) - 1);
      var r = 3.6 + Math.random() * 1.6;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.75;
      arr[i * 3 + 2] = r * Math.cos(phi) * 0.6;
    }
    return arr;
  }

  function makeRadiantCore(n) {
    var arr = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var u = Math.random(), v = Math.random();
      var theta = u * Math.PI * 2;
      var phi = Math.acos(2 * v - 1);
      var r = Math.pow(Math.random(), 1.8) * 3.2 + 0.3;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.85;
      arr[i * 3 + 2] = r * Math.cos(phi) * 0.7;
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
    makeScatter(N),                                                   // 0 hero: deep cosmos
    makeTwoClusters(N, -3.1, 0.35, -0.4, 3.0, -0.3, 0.5, 1.05),        // 1 first met: dual star clusters
    makeBridgingClusters(N, -1.3, 0.25, -0.3, 1.3, -0.2, 0.35, 0.95),  // 2 growing closer: cosmic bridge
    makeSpiralGalaxy(N),                                              // 3 officially together: spiral galaxy
    makeBurst(N),                                                     // 4 memorable moment: stellar sparkle
    makeOrbitalRing(N),                                               // 5 present day: celestial orbit
    makeConstellationField(N),                                        // 6 memory gallery: constellation field
    makeRadiantCore(N),                                               // 7 countdown: radiant core
    makeRadiantCore(N)                                                // 8 letter: warm starlight canopy
  ];

  var shapeColorHex = [0xd4deee, 0xc2d0ea, 0xd0c5e2, 0xdfb77c, 0xf6deaa, 0xdfb77c, 0xc8bed8, 0xecd5ab, 0xf2dfc0];
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

  /* ---------- the 3D model: celestial astrolabe with starlight core & orbital rings ---------- */
  var ambientLight = new THREE.AmbientLight(0x403856, 1.2);
  scene.add(ambientLight);

  var keyLight = new THREE.PointLight(0xdfb77c, 2.4, 32, 2);
  keyLight.position.set(3.5, 3.8, 5.2);
  scene.add(keyLight);

  var rimLight = new THREE.PointLight(0xa59ac8, 1.5, 32, 2);
  rimLight.position.set(-4.2, -2.5, 3.2);
  scene.add(rimLight);

  var celestialGroup = new THREE.Group();
  var coreMesh = null;
  var ringOuter = null;
  var ringInner = null;

  try {
    // 1. Central luminous starlight core
    var coreGeo = new THREE.IcosahedronGeometry(0.75, 3);
    var coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xdfb77c,
      emissive: 0x422f12,
      emissiveIntensity: 0.5,
      metalness: 0.72,
      roughness: 0.22,
      clearcoat: 0.95,
      clearcoatRoughness: 0.18,
      transparent: true,
      opacity: 0
    });
    coreMesh = new THREE.Mesh(coreGeo, coreMaterial);
    coreMesh.renderOrder = 0;
    celestialGroup.add(coreMesh);

    // 2. Outer slender orbital ring
    var outerRingGeo = new THREE.TorusGeometry(2.05, 0.018, 16, 120);
    var ringMat1 = new THREE.MeshPhysicalMaterial({
      color: 0xebd0d7,
      emissive: 0x221319,
      emissiveIntensity: 0.35,
      metalness: 0.9,
      roughness: 0.18,
      clearcoat: 1,
      transparent: true,
      opacity: 0
    });
    ringOuter = new THREE.Mesh(outerRingGeo, ringMat1);
    ringOuter.rotation.x = Math.PI * 0.28;
    ringOuter.rotation.y = Math.PI * 0.15;
    celestialGroup.add(ringOuter);

    // 3. Inner slender orbital ring (tilted at counter angle)
    var innerRingGeo = new THREE.TorusGeometry(1.42, 0.015, 16, 90);
    var ringMat2 = new THREE.MeshPhysicalMaterial({
      color: 0xdfb77c,
      emissive: 0x261b0c,
      emissiveIntensity: 0.35,
      metalness: 0.92,
      roughness: 0.16,
      clearcoat: 1,
      transparent: true,
      opacity: 0
    });
    ringInner = new THREE.Mesh(innerRingGeo, ringMat2);
    ringInner.rotation.x = -Math.PI * 0.22;
    ringInner.rotation.z = Math.PI * 0.35;
    celestialGroup.add(ringInner);

    celestialGroup.scale.setScalar(0.001);
    scene.add(celestialGroup);
  } catch (e) {
    celestialGroup = null;
  }

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

    // the celestial astrolabe grows in around "Officially Together" and keeps glowing brighter through
    // the countdown and letter — creating a stunning, modern astronomical centerpiece.
    if (celestialGroup) {
      var growth = smoothstepClamp(idxFloat, 0.4, 3);
      var glow = smoothstepClamp(idxFloat, 3, 7);
      var pulse = withIdleMotion ? 1 + Math.sin(now * 0.0015) * 0.025 : 1;
      var scale = Math.max(0.001, (0.15 + 0.85 * growth) * pulse);

      celestialGroup.scale.setScalar(scale);

      if (coreMesh) {
        coreMesh.material.opacity = growth * 0.85;
        coreMesh.material.emissiveIntensity = 0.35 + 0.5 * glow;
      }
      if (ringOuter) {
        ringOuter.material.opacity = growth * 0.9;
        ringOuter.material.emissiveIntensity = 0.25 + 0.4 * glow;
      }
      if (ringInner) {
        ringInner.material.opacity = growth * 0.9;
        ringInner.material.emissiveIntensity = 0.25 + 0.4 * glow;
      }

      if (withIdleMotion) {
        celestialGroup.rotation.y += 0.0028;
        celestialGroup.rotation.x = Math.sin(now * 0.0007) * 0.08 + (frac - 0.5) * 0.22;
        celestialGroup.position.y = Math.sin(now * 0.0005) * 0.08;

        if (ringOuter) ringOuter.rotation.z += 0.0035;
        if (ringInner) ringInner.rotation.z -= 0.0045;

        camera.position.x += (mouseTX * 0.35 - camera.position.x) * 0.04;
        camera.position.y += (-mouseTY * 0.22 - camera.position.y) * 0.04;
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
  } // end initSite()

  /* ---------- H-1 lock: site stays closed until the day before the anniversary ----------
     Add ?dev=1 to the URL to bypass the lock while building/testing. */
  var UNLOCK_DATE = "2026-11-28T00:00:00+07:00";

  function hasDevBypass() {
    try {
      return new URLSearchParams(window.location.search).get("dev") === "1";
    } catch (e) { return false; }
  }

  function isUnlocked() {
    return hasDevBypass() || new Date() >= new Date(UNLOCK_DATE);
  }

  function unlockSite() {
    document.documentElement.classList.add("unlocked");
    document.documentElement.classList.remove("locked");
    initSite();
  }

  if (isUnlocked()) {
    unlockSite();
  } else {
    document.documentElement.classList.add("locked");
    (function tickLock() {
      var target = new Date(UNLOCK_DATE);
      var timer;

      function paint() {
        if (isUnlocked()) {
          clearInterval(timer);
          unlockSite();
          return;
        }
        var diff = target - new Date();
        var days = Math.floor(diff / 86400000); diff -= days * 86400000;
        var hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
        var mins = Math.floor(diff / 60000); diff -= mins * 60000;
        var secs = Math.floor(diff / 1000);
        var elD = document.getElementById("lock-days");
        var elH = document.getElementById("lock-hours");
        var elM = document.getElementById("lock-mins");
        var elS = document.getElementById("lock-secs");
        if (elD) elD.textContent = String(days).padStart(2, "0");
        if (elH) elH.textContent = String(hours).padStart(2, "0");
        if (elM) elM.textContent = String(mins).padStart(2, "0");
        if (elS) elS.textContent = String(secs).padStart(2, "0");
      }

      timer = setInterval(paint, 1000);
      paint();
    })();
  }
})();
