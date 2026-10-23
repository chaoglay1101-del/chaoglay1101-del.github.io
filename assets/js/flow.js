/* Current lines behind the page heroes and footers (elements marked data-flow).

   A streamline field: evenly spaced lines that follow a smooth, mostly
   rightward vector field, the way a wind or ocean-current map draws air and
   water. The site is about payment flows, so the texture is a flow too.

   What moves, and why:
   - On load a front sweeps the lines in from left to right (about two
     seconds). After that the lines themselves hold still.
   - In a hero that is on screen, a few faint glints run along the lines, so
     the current reads as moving water rather than a printed pattern.
   - The pointer is a finger in the stream: lines part around it and close
     again behind it. A click or tap sends a ripple out through the lines.
   Under prefers-reduced-motion the lines appear at once, nothing runs along
   them, and the pointer leaves them alone.

   Decoration only: the canvases are aria-hidden, ignore the pointer (the host
   listens instead, so links and buttons work as before), are hidden in print,
   and nothing on the page depends on this script. Colours come from the
   --flow-* custom properties in styles.css, so both themes stay in CSS. The
   value of data-flow seeds the field, so each page gets its own current;
   data-flow-still marks a footer: no intro and no glints, since it is reached
   by scrolling, but it still answers the pointer. */
(function () {
  "use strict";

  var hosts = Array.prototype.slice.call(document.querySelectorAll("[data-flow]"));
  var probe = document.createElement("canvas");
  if (!hosts.length || !probe.getContext || !probe.getContext("2d")) {
    return;
  }

  var reduceMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

  var STEP = 2;           // tracing step, CSS pixels
  var MAX_HALF = 230;     // longest reach either side of a seed
  var MIN_LEN = 40;       // shorter lines are dropped as specks
  var GROW = 320;         // intro: pixels a line grows per second
  var SWEEP = 1.5;        // intro: seconds for the front to cross the hero
  var GLINT_SPEED = 70;   // glints: pixels per second along a line
  var GLINT_TAIL = 16;    // glints: tail length in tracing steps
  var GLINT_AREA = 26000; // glints: one alive per this many square pixels
  var PUSH = 24;          // pointer: how far lines part, pixels
  var PUSH_R = 90;        // pointer: radius of the parting
  var RIPPLE_SPEED = 320; // ripple: pixels per second
  var RIPPLE_LIFE = 1.5;  // ripple: seconds
  var RIPPLE_AMP = 12;    // ripple: largest displacement, pixels

  function rng(seed) {
    // mulberry32: a small deterministic generator, so a page's lines are stable.
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Mostly rightward and slightly rising, bent by three waves of different
  // lengths: a long swell, a shorter cross-current, and a little chop.
  function makeField(seed) {
    var p = seed * 1.618;
    return function (x, y) {
      return -0.08 +
        0.5 * Math.sin(x * 0.0047 + y * 0.0029 + p) +
        0.3 * Math.sin(y * 0.0088 - x * 0.0021 + 1.7 * p) +
        0.1 * Math.sin((x - y) * 0.015 + 0.6 + 2.3 * p);
    };
  }

  // Evenly spaced streamlines, after Jobard and Lefer (1997): seed on a grid,
  // trace both ways with a midpoint step, and stop a line where it would come
  // closer than half the spacing to a line already placed.
  function traceLines(width, height, angle, sep, random) {
    var test = sep * 0.55;
    var cols = Math.ceil(width / sep) + 3;
    var rows = Math.ceil(height / sep) + 3;
    var grid = new Array(cols * rows);

    function index(x, y) {
      return (Math.floor(y / sep) + 1) * cols + (Math.floor(x / sep) + 1);
    }
    function crowded(x, y, distance) {
      var cx = Math.floor(x / sep) + 1;
      var cy = Math.floor(y / sep) + 1;
      var d2 = distance * distance;
      for (var j = cy - 1; j <= cy + 1; j++) {
        if (j < 0 || j >= rows) continue;
        for (var i = cx - 1; i <= cx + 1; i++) {
          if (i < 0 || i >= cols) continue;
          var bucket = grid[j * cols + i];
          if (!bucket) continue;
          for (var k = 0; k < bucket.length; k += 2) {
            var dx = bucket[k] - x;
            var dy = bucket[k + 1] - y;
            if (dx * dx + dy * dy < d2) return true;
          }
        }
      }
      return false;
    }
    function walk(x, y, dir) {
      var out = [];
      for (var travelled = 0; travelled < MAX_HALF; travelled += STEP) {
        var a = angle(x, y);
        var b = angle(x + Math.cos(a) * STEP * 0.5 * dir, y + Math.sin(a) * STEP * 0.5 * dir);
        x += Math.cos(b) * STEP * dir;
        y += Math.sin(b) * STEP * dir;
        if (x < -6 || y < -6 || x > width + 6 || y > height + 6 || crowded(x, y, test)) break;
        out.push(x, y);
      }
      return out;
    }

    var seeds = [];
    for (var sy = sep * 0.5; sy < height; sy += sep) {
      for (var sx = sep * 0.5; sx < width; sx += sep) {
        seeds.push([sx + (random() - 0.5) * sep * 0.6, sy + (random() - 0.5) * sep * 0.6]);
      }
    }
    for (var s = seeds.length - 1; s > 0; s--) {
      var r = Math.floor(random() * (s + 1));
      var swap = seeds[s];
      seeds[s] = seeds[r];
      seeds[r] = swap;
    }

    var lines = [];
    seeds.forEach(function (seed) {
      if (crowded(seed[0], seed[1], sep)) return;
      var back = walk(seed[0], seed[1], -1);
      var ahead = walk(seed[0], seed[1], 1);
      var count = back.length / 2 + 1 + ahead.length / 2;
      if ((count - 1) * STEP < MIN_LEN) return;
      // Upstream first, so a line grows in the direction the current runs.
      var pts = new Float32Array(count * 2);
      var n = 0;
      for (var b = back.length - 2; b >= 0; b -= 2) {
        pts[n++] = back[b];
        pts[n++] = back[b + 1];
      }
      pts[n++] = seed[0];
      pts[n++] = seed[1];
      for (var f = 0; f < ahead.length; f++) pts[n++] = ahead[f];
      for (var q = 0; q < pts.length; q += 2) {
        var at = index(pts[q], pts[q + 1]);
        (grid[at] || (grid[at] = [])).push(pts[q], pts[q + 1]);
      }
      lines.push({ pts: pts, start: 0 });
    });
    return lines;
  }

  function parseHex(value, fallback) {
    var m = /^#([0-9a-f]{6})$/i.exec(String(value).trim());
    var hex = m ? m[1] : fallback;
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }

  function Flow(host) {
    this.host = host;
    this.seed = parseInt(host.getAttribute("data-flow"), 10) || 1;
    this.base = document.createElement("canvas");
    this.live = document.createElement("canvas");
    [this.base, this.live].forEach(function (canvas) {
      canvas.className = "flow-canvas screen-only";
      canvas.setAttribute("aria-hidden", "true");
    });
    // Same z-index, so document order decides: glints and ripples go above the lines.
    host.insertBefore(this.base, host.firstChild);
    host.insertBefore(this.live, this.base.nextSibling);
    this.bctx = this.base.getContext("2d");
    this.lctx = this.live.getContext("2d");
    this.width = 0;
    this.height = 0;
    this.lines = [];
    this.total = 0;
    this.glints = [];
    this.ripples = [];
    this.pointer = { x: 0, y: 0, inside: false, moved: false, s: 0 };
    this.bent = false;
    this.visible = false;
    this.intro = null;
    this.frame = 0;
    this.still = host.hasAttribute("data-flow-still");
    this.angle = makeField(this.seed);
  }

  Flow.prototype.readColours = function () {
    var style = getComputedStyle(this.host);
    this.colA = parseHex(style.getPropertyValue("--flow-a"), "2a6f9f");
    this.colB = parseHex(style.getPropertyValue("--flow-b"), "1a9a88");
    this.colHead = parseHex(style.getPropertyValue("--flow-head"), "1c5f8f");
    this.alpha = parseFloat(style.getPropertyValue("--flow-alpha")) || 0.3;
  };

  Flow.prototype.measure = function () {
    var rect = this.host.getBoundingClientRect();
    var width = Math.round(rect.width);
    var height = Math.round(rect.height);
    if (width === this.width && height === this.height) return false;
    this.width = width;
    this.height = height;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    var self = this;
    [this.base, this.live].forEach(function (canvas) {
      canvas.width = Math.max(1, Math.round(width * self.dpr));
      canvas.height = Math.max(1, Math.round(height * self.dpr));
    });
    this.bctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.lctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    var sep = width < 640 ? 13 : 15;
    var random = rng(this.seed * 9973 + 17);
    this.lines = traceLines(width, height, this.angle, sep, random);
    var total = 0;
    this.lines.forEach(function (line) {
      // The front reaches a line when it passes the line's upstream end.
      line.start = 0.1 + Math.max(0, line.pts[0] / Math.max(1, width)) * SWEEP + random() * 0.25;
      line.weight = 0.8 + random() * 0.6;
      total += line.pts.length / 2;
      line.cum = total;
    });
    this.total = total;
    this.glints = [];
    return true;
  };

  Flow.prototype.colourFor = function (line) {
    var mid = line.pts[(line.pts.length >> 2) * 2 + 1];
    var t = Math.min(1, Math.max(0, mid / Math.max(1, this.height)));
    return [
      Math.round(this.colA[0] + (this.colB[0] - this.colA[0]) * t),
      Math.round(this.colA[1] + (this.colB[1] - this.colA[1]) * t),
      Math.round(this.colA[2] + (this.colB[2] - this.colA[2]) * t)
    ];
  };

  // Fill a line up to point `upto` as one tapered ribbon: pointed at both ends
  // and fullest in the middle, the way a brush stroke or a wind-map trace
  // reads. One fill per line, so no joins double up into dots.
  Flow.prototype.ribbon = function (line, upto) {
    var pts = this.bent ? this.displaced(line.pts) : line.pts;
    var last = line.pts.length / 2 - 1;
    if (upto > last) upto = last;
    if (upto < 1) return;
    var c = line.rgb || (line.rgb = this.colourFor(line));
    var ctx = this.bctx;
    var side = [];
    var other = [];
    for (var i = 0; i <= upto; i++) {
      var a = Math.max(0, i - 1);
      var b = Math.min(last, i + 1);
      var dx = pts[b * 2] - pts[a * 2];
      var dy = pts[b * 2 + 1] - pts[a * 2 + 1];
      var length = Math.sqrt(dx * dx + dy * dy) || 1;
      var half = (0.15 + 0.6 * Math.sin((Math.PI * i) / last)) * line.weight;
      var nx = (-dy / length) * half;
      var ny = (dx / length) * half;
      side.push(pts[i * 2] + nx, pts[i * 2 + 1] + ny);
      other.push(pts[i * 2] - nx, pts[i * 2 + 1] - ny);
    }
    ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + this.alpha + ")";
    ctx.beginPath();
    ctx.moveTo(side[0], side[1]);
    for (var s = 2; s < side.length; s += 2) ctx.lineTo(side[s], side[s + 1]);
    for (var o = other.length - 2; o >= 0; o -= 2) ctx.lineTo(other[o], other[o + 1]);
    ctx.closePath();
    ctx.fill();
  };

  // Where the pointer and the ripples have moved each point of a line. Only
  // called while something is bending the field.
  Flow.prototype.displaced = function (pts) {
    var out = this.scratch && this.scratch.length >= pts.length ? this.scratch : (this.scratch = new Float32Array(pts.length * 2));
    var p = this.pointer;
    var reach = PUSH_R * 2.2;
    for (var i = 0; i < pts.length; i += 2) {
      var x = pts[i];
      var y = pts[i + 1];
      var ox = 0;
      var oy = 0;
      if (p.s > 0.001) {
        var dx = x - p.x;
        var dy = y - p.y;
        if (dx > -reach && dx < reach && dy > -reach && dy < reach) {
          var d = Math.sqrt(dx * dx + dy * dy) || 1;
          var f = p.s * PUSH * Math.exp(-(d * d) / (PUSH_R * PUSH_R));
          ox += (dx / d) * f;
          oy += (dy / d) * f;
        }
      }
      for (var r = 0; r < this.ripples.length; r++) {
        var w = this.ripples[r];
        var rx = x - w.x;
        var ry = y - w.y;
        var rd = Math.sqrt(rx * rx + ry * ry) || 1;
        var off = rd - w.radius;
        if (off > -60 && off < 60) {
          var g = w.amp * Math.exp(-(off * off) / 700);
          ox += (rx / rd) * g;
          oy += (ry / rd) * g;
        }
      }
      out[i] = x + ox;
      out[i + 1] = y + oy;
    }
    return out;
  };

  Flow.prototype.paint = function () {
    this.bctx.clearRect(0, 0, this.width, this.height);
    for (var i = 0; i < this.lines.length; i++) {
      this.ribbon(this.lines[i], this.lines[i].drawn);
    }
  };

  Flow.prototype.drawStill = function () {
    this.intro = null;
    this.lctx.clearRect(0, 0, this.width, this.height);
    this.lines.forEach(function (line) {
      line.rgb = null;
      line.drawn = line.pts.length / 2 - 1;
    });
    this.paint();
  };

  Flow.prototype.startIntro = function () {
    this.bctx.clearRect(0, 0, this.width, this.height);
    this.lines.forEach(function (line) {
      line.rgb = null;
      line.drawn = 0;
    });
    this.intro = { t0: performance.now(), done: false };
    this.kick();
  };

  // After a resize or a theme change mid-intro: keep the clock, redraw what the
  // front has already reached with the new lines or colours, and carry on.
  Flow.prototype.resumeIntro = function () {
    this.lines.forEach(function (line) {
      line.rgb = null;
      line.drawn = 0;
    });
    this.kick();
  };

  Flow.prototype.kick = function () {
    if (this.frame) return;
    var self = this;
    var previous = performance.now();
    function tick(now) {
      var dt = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      var busy = self.step(now, dt);
      self.frame = busy ? requestAnimationFrame(tick) : 0;
    }
    this.frame = requestAnimationFrame(tick);
  };

  // Glints run only in a hero that is on screen, in a tab that is showing,
  // once the intro is over, and never under reduced motion.
  Flow.prototype.glinting = function () {
    return !this.still && this.visible && !document.hidden && !reduceMotion.matches &&
      this.intro && this.intro.done && this.total > 0 &&
      !document.documentElement.classList.contains("is-presenting");
  };

  Flow.prototype.spawnGlint = function () {
    // Pick a point uniformly along all the lines, so long lines carry more.
    var at = Math.random() * this.total;
    var lo = 0;
    var hi = this.lines.length - 1;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (this.lines[mid].cum < at) lo = mid + 1; else hi = mid;
    }
    var line = this.lines[lo];
    var n = line.pts.length / 2;
    if (n < GLINT_TAIL * 2) return;
    this.glints.push({
      line: line,
      pos: Math.random() * (n - GLINT_TAIL),
      speed: (GLINT_SPEED * (0.7 + Math.random() * 0.6)) / STEP,
      age: 0,
      life: 1.6 + Math.random() * 1.8
    });
  };

  // One animation frame. Returns whether anything is still moving, so the
  // loop stops itself when the hero is still or off screen.
  Flow.prototype.step = function (now, dt) {
    var ctx = this.lctx;
    ctx.clearRect(0, 0, this.width, this.height);
    var busy = false;
    var head = this.colHead;

    if (this.intro && !this.intro.done) {
      var elapsed = (now - this.intro.t0) / 1000;
      var growing = false;
      var moved = false;
      ctx.lineCap = "round";
      ctx.lineWidth = 1.4;
      this.lines.forEach(function (line) {
        var last = line.pts.length / 2 - 1;
        if (line.drawn >= last) return;
        growing = true;
        if (elapsed < line.start) return;
        var target = Math.min(last, Math.floor(((elapsed - line.start) * GROW) / STEP));
        if (target > line.drawn) {
          line.drawn = target;
          moved = true;
        }
        if (line.drawn >= last) return;
        // A short bright head at the growing tip.
        var from = Math.max(0, line.drawn - 8);
        ctx.strokeStyle = "rgba(" + head[0] + "," + head[1] + "," + head[2] + ",0.55)";
        ctx.beginPath();
        ctx.moveTo(line.pts[from * 2], line.pts[from * 2 + 1]);
        for (var k = from + 1; k <= line.drawn; k++) ctx.lineTo(line.pts[k * 2], line.pts[k * 2 + 1]);
        ctx.stroke();
      });
      if (moved) this.paint();
      if (!growing) this.intro.done = true;
      busy = busy || growing;
    }

    // The pointer eases in and out, so the lines part and close smoothly.
    var p = this.pointer;
    var target = p.inside && !reduceMotion.matches ? 1 : 0;
    var before = p.s;
    p.s += (target - p.s) * Math.min(1, dt * 7);
    if (Math.abs(target - p.s) < 0.002) p.s = target;

    var self = this;
    this.ripples = this.ripples.filter(function (w) {
      w.age += dt;
      w.radius = w.age * RIPPLE_SPEED;
      var left = 1 - w.age / RIPPLE_LIFE;
      w.amp = RIPPLE_AMP * left * left;
      return w.age < RIPPLE_LIFE;
    });

    // Repaint the lines only when the bend has changed: a resting pointer
    // costs nothing.
    var bending = p.s > 0.001 || this.ripples.length > 0;
    var changed = p.s !== before || p.moved || this.ripples.length > 0;
    p.moved = false;
    if (changed && (bending || this.bent) && (!this.intro || this.intro.done)) {
      this.bent = bending;
      this.paint();
    }
    busy = busy || this.ripples.length > 0 || p.s !== target;

    // Faint rings show where a ripple has got to.
    if (this.ripples.length) {
      ctx.lineWidth = 1;
      this.ripples.forEach(function (w) {
        var fade = 1 - w.age / RIPPLE_LIFE;
        ctx.strokeStyle = "rgba(" + head[0] + "," + head[1] + "," + head[2] + "," + (0.35 * fade * fade).toFixed(3) + ")";
        ctx.beginPath();
        ctx.arc(w.x, w.y, Math.max(0, w.radius), 0, Math.PI * 2);
        ctx.stroke();
      });
    }

    if (this.glinting()) {
      var wanted = Math.max(4, Math.round((this.width * this.height) / GLINT_AREA));
      if (this.glints.length < wanted && Math.random() < dt * 6) this.spawnGlint();
      busy = true;
    }
    if (this.glints.length) {
      ctx.lineCap = "round";
      ctx.lineWidth = 1.6;
      this.glints = this.glints.filter(function (g) {
        g.age += dt;
        g.pos += g.speed * dt;
        var n = g.line.pts.length / 2;
        return g.age < g.life && g.pos < n - 1 && self.glinting();
      });
      this.glints.forEach(function (g) {
        var pts = self.bent ? self.displaced(g.line.pts) : g.line.pts;
        var tip = Math.floor(g.pos);
        var tail = Math.max(0, tip - GLINT_TAIL);
        // In and out over the first and last half second of its life, and
        // brighter towards the tip: the tail is drawn in four steps of alpha.
        var fade = Math.min(1, g.age / 0.5, (g.life - g.age) / 0.5);
        var chunk = Math.max(1, Math.ceil((tip - tail) / 4));
        for (var from = tail, part = 1; from < tip; from += chunk, part++) {
          var to = Math.min(tip, from + chunk);
          ctx.strokeStyle = "rgba(" + head[0] + "," + head[1] + "," + head[2] + "," + (0.15 * part * fade).toFixed(3) + ")";
          ctx.beginPath();
          ctx.moveTo(pts[from * 2], pts[from * 2 + 1]);
          for (var i = from + 1; i <= to; i++) ctx.lineTo(pts[i * 2], pts[i * 2 + 1]);
          ctx.stroke();
        }
      });
      busy = busy || this.glints.length > 0;
    }
    return busy;
  };

  Flow.prototype.local = function (event) {
    var rect = this.host.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  Flow.prototype.hover = function (event, inside) {
    if (reduceMotion.matches || event.pointerType === "touch" || !this.started) return;
    var at = this.local(event);
    this.pointer.x = at.x;
    this.pointer.y = at.y;
    this.pointer.inside = inside;
    this.pointer.moved = true;
    this.kick();
  };

  Flow.prototype.ripple = function (event) {
    if (reduceMotion.matches || !this.started || this.ripples.length > 4) return;
    var at = this.local(event);
    this.ripples.push({ x: at.x, y: at.y, age: 0, radius: 0, amp: RIPPLE_AMP });
    this.kick();
  };

  var flows = hosts.map(function (host) {
    var flow = new Flow(host);
    host.addEventListener("pointermove", function (event) {
      flow.hover(event, true);
    });
    host.addEventListener("pointerleave", function (event) {
      flow.hover(event, false);
    });
    host.addEventListener("pointerdown", function (event) {
      flow.ripple(event);
    });
    return flow;
  });

  function begin(flow) {
    flow.readColours();
    flow.measure();
    if (reduceMotion.matches || flow.still) {
      flow.drawStill();
    } else {
      flow.startIntro();
    }
    flow.started = true;
  }

  // Start each intro the first time its host is on screen, and run the glints
  // only while it is.
  if ("IntersectionObserver" in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var flow = flows[hosts.indexOf(entry.target)];
        if (!flow) return;
        flow.visible = entry.isIntersecting;
        if (!entry.isIntersecting) return;
        if (!flow.started) begin(flow);
        flow.kick();
      });
    });
    hosts.forEach(function (host) {
      seen.observe(host);
    });
  } else {
    flows.forEach(function (flow) {
      flow.visible = true;
      begin(flow);
    });
  }
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) {
      flows.forEach(function (flow) {
        if (flow.started) flow.kick();
      });
    }
  });

  // A new size (a rotated phone, the language switch reflowing the hero) or a
  // new theme redraws the lines at once, without replaying the intro.
  function redraw(force) {
    flows.forEach(function (flow) {
      if (!flow.started) return;
      var resized = flow.measure();
      if (!resized && !force) return;
      flow.readColours();
      if (flow.intro && !flow.intro.done) {
        flow.resumeIntro();
      } else {
        flow.drawStill();
      }
    });
  }
  var pending = 0;
  function soon(force) {
    clearTimeout(pending);
    pending = setTimeout(function () {
      redraw(force);
    }, 150);
  }
  if ("ResizeObserver" in window) {
    var sizes = new ResizeObserver(function () {
      soon(false);
    });
    hosts.forEach(function (host) {
      sizes.observe(host);
    });
  } else {
    window.addEventListener("resize", function () {
      soon(false);
    });
  }
  if ("MutationObserver" in window) {
    new MutationObserver(function () {
      soon(true);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    // Leaving presentation mode (story.js sets html.is-presenting) restarts
    // the glints it paused.
    new MutationObserver(function () {
      flows.forEach(function (flow) {
        if (flow.started) flow.kick();
      });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  }
  if (window.matchMedia) {
    var scheme = window.matchMedia("(prefers-color-scheme: dark)");
    if (scheme.addEventListener) {
      scheme.addEventListener("change", function () {
        soon(true);
      });
    }
  }
})();
