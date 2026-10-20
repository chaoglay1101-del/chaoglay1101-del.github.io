/* ==========================================================================
   Personal website — step-through stories
   research.html: the findings in six steps, each with its chart.
   cv.html: the CV in two minutes, a timeline, cohort strips and an evidence
   index that marks the lines proving each skill.

   Ideas borrowed from Slidev decks: content revealed one click at a time
   (v-click), hand-drawn annotations tied to a click (v-mark), links to a step
   and click (Slidev's /8?clicks=5 becomes #step-4.2 here), and a presentation
   mode. Progressive enhancement only: both pages read completely without this
   file, every element it drives is screen-only, and nothing here is printed.

   Text: every visible string comes from the page, so translation stays in
   i18n.js. Hidden <span data-s="..."> elements carry the labels the charts
   need; main.js translates them like any other key and announces a language
   change with a "site:languagechange" event.
   ========================================================================== */

(function () {
  "use strict";

  // A failure here must not leave the sections half-built (dimmed steps, empty
  // charts). html.story-off hides them, and the pages read as they did before.
  try {
    run();
  } catch (error) {
    document.documentElement.classList.add("story-off");
    if (window.console && window.console.error) { window.console.error("story.js stopped:", error); }
  }

  function run() {
    var root = document.documentElement;
    var deckEl = document.querySelector("[data-deck]");
    var evidenceIndex = document.querySelector("[data-evidence-index]");
    var cohortSlots = Array.prototype.slice.call(document.querySelectorAll("[data-cohort]"));
    if (!deckEl && !evidenceIndex && !cohortSlots.length) {
      return;
    }

    var REDUCED = Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    var WIDE = window.matchMedia ? window.matchMedia("(min-width: 900px)") : { matches: true };
    var MINUS = "−";

    function $(selector, context) { return (context || document).querySelector(selector); }
    function $$(selector, context) { return Array.prototype.slice.call((context || document).querySelectorAll(selector)); }
    function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }
    function fmt(value, digits) { return (value < 0 ? MINUS : "") + Math.abs(value).toFixed(digits); }
    function fmtSigned(value, digits) {
      var text = Math.abs(value).toFixed(digits);
      if (Number(text) === 0) { return text; }
      return (value < 0 ? MINUS : "+") + text;
    }
    function fmtTick(value, digits) { return value === 0 ? "0" : fmt(value, digits); }

    /* --- Strings ------------------------------------------------------------ */

    var STR = {};
    function loadStrings() {
      STR = {};
      $$("[data-s]").forEach(function (node) {
        STR[node.getAttribute("data-s")] = node.textContent.replace(/\s+/g, " ").trim();
      });
    }
    function s(key, vars) {
      var text = Object.prototype.hasOwnProperty.call(STR, key) ? STR[key] : key;
      if (vars) {
        text = text.replace(/\{(\w+)\}/g, function (_, name) {
          return vars[name] !== undefined ? String(vars[name]) : "";
        });
      }
      return text;
    }

    /* --- SVG helpers ---------------------------------------------------------- */

    var NS = "http://www.w3.org/2000/svg";
    function r1(value) { return Math.round(value * 10) / 10; }
    function S(tag, attrs, children) {
      var node = document.createElementNS(NS, tag);
      if (attrs) {
        Object.keys(attrs).forEach(function (name) {
          var value = attrs[name];
          if (value !== null && value !== undefined && value !== false) { node.setAttribute(name, value); }
        });
      }
      if (children) {
        [].concat(children).forEach(function (child) {
          if (child === null || child === undefined || child === false) { return; }
          node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
        });
      }
      return node;
    }
    function Tx(x, y, text, cls, extra) {
      var attrs = { x: r1(x), y: r1(y), "class": cls };
      if (extra) { Object.keys(extra).forEach(function (name) { attrs[name] = extra[name]; }); }
      return S("text", attrs, [String(text)]);
    }
    function seg(x1, y1, x2, y2, cls, extra) {
      var attrs = { d: "M" + r1(x1) + "," + r1(y1) + "L" + r1(x2) + "," + r1(y2), "class": cls };
      if (extra) { Object.keys(extra).forEach(function (name) { attrs[name] = extra[name]; }); }
      return S("path", attrs);
    }
    function lin(d0, d1, r0, r2) { return function (v) { return r0 + (v - d0) / (d1 - d0) * (r2 - r0); }; }
    function svgRoot(width, height, label) {
      return S("svg", { viewBox: "0 0 " + width + " " + height, width: width, height: height, "class": "viz", role: "img", "aria-label": label });
    }
    var measure = document.createElement("canvas").getContext("2d");
    var bodyFont = "";
    function textW(text, size, weight) {
      if (!measure) { return String(text).length * (size || 12) * 0.6; }
      measure.font = (weight || 400) + " " + (size || 12) + "px " + (bodyFont || "sans-serif");
      return measure.measureText(String(text)).width;
    }
    function hit(node, title, value) {
      node.setAttribute("class", "hit");
      node.setAttribute("data-tip-t", title);
      node.setAttribute("data-tip-v", value);
      node.setAttribute("tabindex", "0");
      node.setAttribute("role", "img");
      node.setAttribute("aria-label", title + ": " + value);
      return node;
    }

    // Deterministic "hand-drawn" shapes, so annotations look like Slidev's v-mark.
    function rng(seed) {
      var a = seed >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) >>> 0;
        var q = a;
        q = Math.imul(q ^ (q >>> 15), q | 1);
        q ^= q + Math.imul(q ^ (q >>> 7), q | 61);
        return ((q ^ (q >>> 14)) >>> 0) / 4294967296;
      };
    }
    function smooth(points) {
      var d = "M" + points[0][0].toFixed(1) + "," + points[0][1].toFixed(1);
      for (var i = 0; i < points.length - 1; i++) {
        var p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
        d += "C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + "," + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) +
          " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + "," + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) +
          " " + p2[0].toFixed(1) + "," + p2[1].toFixed(1);
      }
      return d;
    }
    function roughEllipse(cx, cy, rx, ry, seed) {
      var r = rng(seed || 7), n = 26, start = -2.3 + r() * 0.5, sweep = Math.PI * 2 + 0.38 + r() * 0.2, points = [];
      for (var i = 0; i <= n; i++) {
        var angle = start + sweep * i / n, k = 1 + (r() - 0.5) * 0.07 + (i / n) * 0.07;
        points.push([cx + Math.cos(angle) * rx * k, cy + Math.sin(angle) * ry * k]);
      }
      return smooth(points);
    }
    function roughRect(x, y, w, h, seed) {
      var r = rng(seed || 3);
      function j() { return (r() - 0.5) * 4; }
      var corners = [[x + j(), y + j()], [x + w + j(), y + j()], [x + w + j(), y + h + j()], [x + j(), y + h + j()], [x + 8 + j(), y - 1 + j()]];
      var points = [];
      for (var i = 0; i < corners.length - 1; i++) {
        for (var k = 0; k < 4; k++) {
          var t = k / 4;
          points.push([
            corners[i][0] + (corners[i + 1][0] - corners[i][0]) * t + (r() - 0.5) * 1.3,
            corners[i][1] + (corners[i + 1][1] - corners[i][1]) * t + (r() - 0.5) * 1.3
          ]);
        }
      }
      points.push(corners[corners.length - 1]);
      return smooth(points);
    }
    function pen(d, mark, warn, step) {
      return S("path", { d: d, "class": "mk-pen" + (warn ? " warn" : ""), pathLength: "1", "data-mark": String(mark), "data-for-step": step === undefined ? null : String(step) });
    }
    function tag(x, y, text, mark, tone, anchor, width, step) {
      var w = textW(text, 12, 600) + 16, h = 22;
      var x0 = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
      if (width) { x0 = clamp(x0, 2, width - w - 2); }
      return S("g", { "class": "mk-tag " + (tone || "find"), "data-mark": String(mark), "data-for-step": step === undefined ? null : String(step) }, [
        S("rect", { x: r1(x0), y: r1(y - h / 2), width: r1(w), height: h, rx: 6 }),
        Tx(x0 + 8, y + 4.2, text, "mk-tag-text")
      ]);
    }
    function decollide(items, gap, low, high) {
      items.forEach(function (item) { item.ly = item.y; });
      var sorted = items.slice().sort(function (a, b) { return a.ly - b.ly; });
      for (var pass = 0; pass < 40; pass++) {
        var moved = false;
        for (var i = 1; i < sorted.length; i++) {
          var d = sorted[i].ly - sorted[i - 1].ly;
          if (d < gap) { var push = (gap - d) / 2; sorted[i - 1].ly -= push; sorted[i].ly += push; moved = true; }
        }
        sorted.forEach(function (item) { item.ly = clamp(item.ly, low, high); });
        if (!moved) { break; }
      }
    }
    function sigDot(type, cx, cy, radius) {
      return S("circle", { cx: r1(cx), cy: r1(cy), r: radius, "class": "dot " + (type === "sig" ? "dot-sig" : type === "marg" ? "dot-marg" : "dot-ns") });
    }
    function sigLegend(x, y, types) {
      var group = S("g", null), cursor = x;
      types.forEach(function (type) {
        var label = s("lg." + type);
        group.appendChild(sigDot(type, cursor + 5, y - 4, 4.5));
        group.appendChild(Tx(cursor + 14, y, label, "t-legend"));
        cursor += 14 + textW(label, 11.5) + 16;
      });
      return group;
    }

    /* --- Research data ---------------------------------------------------------
       Copied from the tables on research.html (Data, Results, Robustness). When a
       number changes there, change it here as well; each chart's "Numbers" link
       points at the rows it uses, so the two can be compared on the page. */

    var DATA = {
      dpp: [ // Data: IMF_FAS_FCMIBT, % of GDP, 2014 and 2022
        { id: "id", a: 111, b: 268 },
        { id: "my", a: 366, b: 719 },
        { id: "th", a: 124, b: 532 }
      ],
      avg: [ // Robustness paragraph (country averages); Data table (observations)
        { id: "id", dpp: 164, nfm: 2.2, obs: 200 },
        { id: "th", dpp: 271, nfm: 1.2, obs: 63 },
        { id: "my", dpp: 540, nfm: 1.2, obs: 81 }
      ],
      specs: [ // Results table, bank-clustered SE
        { key: "r1", coef: -0.000292, se: 0.000177, stars: "*" },
        { key: "r2", coef: -0.000264, se: 0.000201, stars: "" },
        { key: "r3", coef: -0.000208, se: 0.000333, stars: "" },
        { key: "r4", coef: -0.010171, se: 0.005116, stars: "**" },
        { key: "r4b", coef: -0.006507, se: 0.005227, stars: "" },
        { key: "r5", coef: -0.010829, se: 0.005432, stars: "**" }
      ],
      decomp: [ // Robustness and diagnostics
        { key: "d1", coef: -0.010171, se: 0.005116, p: "0.048", digits: 6 },
        { key: "d2", coef: -0.0102, se: 0.0035, p: "0.004", digits: 4 },
        { key: "d3", coef: -0.0124, se: 0.0175, p: "0.48", digits: 4 },
        { key: "d4", coef: -0.0049, se: 0.0079, p: "0.53", digits: 4 },
        { key: "d5", coef: -0.0035, se: 0.0083, p: "0.67", digits: 4 }
      ],
      countries: [ // Robustness: country subsamples, no year effects
        { id: "id", coef: -0.001420, se: 0.014970, stars: "", obs: 200 },
        { id: "my", coef: 0.005521, se: 0.005378, stars: "", obs: 81 },
        { id: "th", coef: 0.001687, se: 0.000870, stars: "*", obs: 63 }
      ]
    };

    /* --- Research charts -------------------------------------------------------- */

    function chartDpp(W, maxH) {
      var narrow = W < 460;
      var H = Math.round(Math.min(maxH, clamp(W * 0.62, 270, 400)));
      var m = { t: 24, b: 30, l: narrow ? 58 : 80, r: narrow ? 122 : 156 };
      var xA = m.l, xB = W - m.r, y = lin(0, 800, H - m.b, m.t);
      var svg = svgRoot(W, H, s("dpp.aria"));
      var hits = S("g", null);
      svg.appendChild(hits);
      svg.appendChild(seg(xA, m.t - 10, xA, H - m.b + 6, "rule"));
      svg.appendChild(seg(xB, m.t - 10, xB, H - m.b + 6, "rule"));
      svg.appendChild(Tx(xA, H - 8, "2014", "t-axis t-strong", { "text-anchor": "middle" }));
      svg.appendChild(Tx(xB, H - 8, "2022", "t-axis t-strong", { "text-anchor": "middle" }));
      var rows = DATA.dpp.map(function (d) { return { id: d.id, a: d.a, b: d.b, ya: y(d.a), yb: y(d.b), name: s("c." + d.id) }; });
      rows.forEach(function (d) {
        svg.appendChild(S("path", { d: "M" + r1(xA) + "," + r1(d.ya) + "L" + r1(xB) + "," + r1(d.yb), "class": "series-line draw", stroke: "var(--c-" + d.id + ")", pathLength: "1" }));
      });
      rows.forEach(function (d) {
        var dx = xB - xA, dy = d.yb - d.ya, len = Math.sqrt(dx * dx + dy * dy) || 1;
        var mx = (xA + xB) / 2 + dy / len * 15, my = (d.ya + d.yb) / 2 - dx / len * 15;
        svg.appendChild(Tx(mx, my + 4, "×" + (d.b / d.a).toFixed(1), "t-mult t-halo", { "text-anchor": "middle", "data-mark": "1" }));
      });
      var left = rows.map(function (d) { return { id: d.id, y: d.ya, v: d.a }; });
      decollide(left, 15, m.t, H - m.b);
      left.forEach(function (item) {
        if (Math.abs(item.ly - item.y) > 2) { svg.appendChild(seg(xA - 12, item.ly, xA - 6, item.y, "leader")); }
        svg.appendChild(Tx(xA - 14, item.ly + 4, item.v + "%", "t-value", { "text-anchor": "end" }));
      });
      var right = rows.map(function (d) { return { id: d.id, y: d.yb, v: d.b, name: d.name }; });
      decollide(right, 16, m.t, H - m.b);
      right.forEach(function (item) {
        svg.appendChild(S("text", { x: r1(xB + 12), y: r1(item.ly + 4), "class": "t-label" }, [item.name, S("tspan", { "class": "t-value", dx: 6 }, [item.v + "%"])]));
      });
      rows.forEach(function (d) {
        [[xA, d.ya, 2014, d.a], [xB, d.yb, 2022, d.b]].forEach(function (p) {
          svg.appendChild(S("circle", { cx: r1(p[0]), cy: r1(p[1]), r: 5, "class": "dot pop", fill: "var(--c-" + d.id + ")" }));
          hits.appendChild(hit(S("circle", { cx: r1(p[0]), cy: r1(p[1]), r: 13 }), d.name + " · " + p[2], s("dpp.value", { v: p[3] })));
        });
      });
      var th = right.filter(function (item) { return item.id === "th"; })[0];
      var thWidth = textW(th.name, 12.5, 600) + 6 + textW(th.v + "%", 12);
      svg.appendChild(pen(roughEllipse(xB + 12 + thWidth / 2, th.ly, thWidth / 2 + 13, 14, 11), 2));
      // On a phone the 2014 labels reach the middle, so the note starts right of the dots.
      svg.appendChild(narrow ? tag(xA + 14, y(45), s("dpp.bankOnly"), 3, "warn", "start", W)
        : tag((xA + xB) / 2, y(45), s("dpp.bankOnly"), 3, "warn", "middle", W));
      return svg;
    }

    function chartAvg(W, maxH) {
      var narrow = W < 460;
      var H = Math.round(Math.min(maxH, clamp(W * 0.66, 280, 410)));
      var m = { t: 34, r: 20, b: 46, l: 46 };
      var x = lin(0, 600, m.l, W - m.r), y = lin(0, 3, H - m.b, m.t);
      var svg = svgRoot(W, H, s("avg.aria"));
      var hits = S("g", null);
      svg.appendChild(hits);
      [0, 1, 2, 3].forEach(function (v) {
        svg.appendChild(seg(m.l, y(v), W - m.r, y(v), v === 0 ? "rule" : "gridline"));
        svg.appendChild(Tx(m.l - 8, y(v) + 4, v === 0 ? "0" : v + "%", "t-axis", { "text-anchor": "end" }));
      });
      (narrow ? [0, 200, 400, 600] : [0, 100, 200, 300, 400, 500, 600]).forEach(function (v) {
        svg.appendChild(Tx(x(v), H - m.b + 18, v === 0 ? "0" : v + "%", "t-axis", { "text-anchor": "middle" }));
      });
      svg.appendChild(Tx(W - m.r, H - 6, s("avg.x"), "t-axis", { "text-anchor": "end" }));
      svg.appendChild(Tx(m.l - 8, 14, s("avg.y"), "t-axis", { "text-anchor": "start" }));
      var P = {};
      DATA.avg.forEach(function (d) { P[d.id] = { x: x(d.dpp), y: y(d.nfm), d: d, name: s("c." + d.id) }; });
      var bx = P.id.x + 26, yTop = P.id.y, yBot = y(1.2);
      svg.appendChild(S("path", { d: "M" + r1(bx) + "," + r1(yBot) + "L" + r1(P.my.x) + "," + r1(yBot), "class": "mk-guide", "data-mark": "2" }));
      svg.appendChild(pen("M" + r1(bx - 6) + "," + r1(yTop) + "L" + r1(bx) + "," + r1(yTop + 1) + "L" + r1(bx + 1) + "," + r1(yBot) + "L" + r1(bx - 6) + "," + r1(yBot - 1), 2));
      svg.appendChild(tag(bx + 9, (yTop + yBot) / 2, s("avg.gap"), 2, "find", "start", W));
      Object.keys(P).forEach(function (id) {
        var p = P[id];
        svg.appendChild(S("circle", { cx: r1(p.x), cy: r1(p.y), r: 7, "class": "dot pop", fill: "var(--c-" + id + ")" }));
        var labelY = id === "id" ? p.y - 38 : p.y + 24;
        var anchor = "middle", labelX = p.x;
        var obsText = s("avg.obs", { n: p.d.obs });
        var wName = Math.max(textW(p.name, 12.5, 600), textW(obsText, 11.5));
        if (labelX + wName / 2 > W - 2) { anchor = "end"; labelX = Math.min(p.x + 10, W - 2); }
        svg.appendChild(Tx(labelX, labelY, p.name, "t-label", { "text-anchor": anchor }));
        svg.appendChild(Tx(labelX, labelY + 14, obsText, "t-axis", { "text-anchor": anchor }));
        hits.appendChild(hit(S("circle", { cx: r1(p.x), cy: r1(p.y), r: 16 }), p.name, s("avg.tip", { d: p.d.dpp, m: p.d.nfm.toFixed(1), n: p.d.obs })));
      });
      svg.appendChild(pen(roughEllipse(P.id.x, P.id.y, 16, 16, 5), 1));
      // On a phone the Indonesia label fills the top, so the caveat sits in the empty lower right.
      svg.appendChild(tag(W - m.r - 2, narrow ? y(0.35) : y(2.72), s("avg.three"), 3, "warn", "end", W));
      return svg;
    }

    function chartTstat(W, maxH) {
      var narrow = W < 460;
      var rows = DATA.specs.map(function (spec) {
        return { coef: spec.coef, se: spec.se, stars: spec.stars, tv: spec.coef / spec.se, name: s("spec." + spec.key) };
      });
      var labelW = Math.min(W * 0.4, Math.max.apply(null, rows.map(function (row) { return textW(row.name, 12.5); })) + 12);
      var m = { t: 64, b: 48, l: labelW + 8, r: 64 };
      var gap = 24;
      var rowH = clamp(Math.floor((maxH - m.t - m.b - gap) / 6), 28, narrow ? 36 : 42);
      var H = m.t + m.b + gap + rowH * 6;
      var x = lin(-2.6, 0.6, m.l, W - m.r);
      function cy(i) { return m.t + rowH * (i + 0.5) + (i >= 3 ? gap : 0); }
      var svg = svgRoot(W, H, s("tstat.aria"));
      var hits = S("g", null);
      svg.appendChild(hits);
      var top = m.t - 14, bottom = H - m.b + 4;
      svg.appendChild(S("rect", { x: r1(x(-2.6)), y: top, width: r1(x(-1.645) - x(-2.6)), height: bottom - top, "class": "band" }));
      svg.appendChild(S("rect", { x: r1(x(-2.6)), y: top, width: r1(x(-1.96) - x(-2.6)), height: bottom - top, "class": "band-2" }));
      svg.appendChild(seg(x(-1.96), top, x(-1.96), bottom, "thr"));
      svg.appendChild(seg(x(-1.645), top, x(-1.645), bottom, "thr"));
      svg.appendChild(Tx(x(-1.96) - 4, top - 6, "5%", "t-axis", { "text-anchor": "end" }));
      svg.appendChild(Tx(x(-1.645) + 4, top - 6, "10%", "t-axis", { "text-anchor": "start" }));
      svg.appendChild(seg(x(0), top, x(0), bottom, "zero"));
      (narrow ? [-2, -1, 0] : [-2.5, -2, -1.5, -1, -0.5, 0, 0.5]).forEach(function (v) {
        svg.appendChild(Tx(x(v), H - m.b + 22, fmtTick(v, v % 1 ? 1 : 0), "t-axis", { "text-anchor": "middle" }));
      });
      svg.appendChild(Tx((m.l + W - m.r) / 2, H - 6, s("tstat.x"), "t-axis", { "text-anchor": "middle" }));
      svg.appendChild(sigLegend(0, 16, ["sig", "marg", "ns"]));
      svg.appendChild(Tx(1, cy(0) - rowH / 2 - 6, s("tstat.linear"), "t-group"));
      svg.appendChild(Tx(1, cy(3) - rowH / 2 - 6, s("tstat.log"), "t-group"));
      rows.forEach(function (row, i) {
        var yy = cy(i), type = row.stars === "**" ? "sig" : row.stars === "*" ? "marg" : "ns";
        svg.appendChild(seg(m.l, yy, W - m.r, yy, "row-guide"));
        svg.appendChild(Tx(1, yy + 4, row.name, "t-row"));
        var dot = sigDot(type, x(row.tv), yy, 6);
        dot.setAttribute("class", dot.getAttribute("class") + " pop");
        svg.appendChild(dot);
        svg.appendChild(Tx(W - 2, yy + 4, fmt(row.tv, 2) + row.stars, "t-value", { "text-anchor": "end" }));
        hits.appendChild(hit(S("rect", { x: 0, y: r1(yy - rowH / 2), width: W, height: rowH, rx: 6 }), row.name,
          "t = " + fmt(row.tv, 2) + row.stars + " · " + fmt(row.coef, 6) + " (" + row.se.toFixed(6) + ")"));
      });
      var lx = x(rows[3].tv);
      svg.appendChild(pen(roughEllipse(lx, cy(3), 16, 13, 21), 1));
      svg.appendChild(tag(lx - 12, cy(3) - rowH / 2 - gap / 2 - 1, s("tstat.double"), 2, "find", "start", W));
      svg.appendChild(pen(roughRect(-9, cy(0) - rowH / 2 + 2, x(-0.3) + 9, cy(2) - cy(0) + rowH - 4, 31), 3, true));
      return svg;
    }

    function ciChart(W, maxH, rows, opt) {
      var stacked = W < 460;
      var gaps = opt.gaps || [], gapH = stacked ? 10 : 22;
      // Stacked (phone) rows carry their label and value on the line above the
      // interval, which leaves no room for a note there: it gets a lane below.
      var noteRow = stacked && opt.noteRow !== undefined ? opt.noteRow : -1, noteH = noteRow > -1 ? 32 : 0;
      function gapsBefore(i) {
        var g = 0;
        gaps.forEach(function (after) { if (i > after) { g += gapH; } });
        return g + (i > noteRow && noteRow > -1 ? noteH : 0);
      }
      var m, rowH;
      if (stacked) {
        m = { t: opt.topNarrow || opt.top, b: 48, l: 6, r: 6 };
        rowH = opt.colored ? 56 : 50;
      } else {
        var labelW = Math.min(W * 0.42, Math.max.apply(null, rows.map(function (row) {
          return Math.max(textW(row.name, 12.5, opt.colored ? 600 : 400), row.sub ? textW(row.sub, 11.5) : 0);
        })) + 12);
        m = { t: opt.top, b: 48, l: labelW + 8, r: 70 };
        rowH = clamp(Math.floor((maxH - m.t - m.b - gaps.length * gapH - (opt.padBottom || 0)) / rows.length), opt.minRow || 30, opt.maxRow || 46);
      }
      var inner = rowH * rows.length + gaps.length * gapH + noteH + (stacked ? 0 : (opt.padBottom || 0));
      var H = m.t + inner + m.b;
      var x = lin(opt.lo, opt.hi, m.l, W - m.r);
      var svg = svgRoot(W, H, opt.aria);
      var hits = S("g", null);
      svg.appendChild(hits);
      var top = m.t - 6, bottom = m.t + inner + 4;
      (stacked ? opt.ticksNarrow : opt.ticks).forEach(function (v) {
        svg.appendChild(seg(x(v), top, x(v), bottom, v === 0 ? "zero" : "gridline"));
        svg.appendChild(Tx(x(v), bottom + 18, fmtTick(v, 2), "t-axis", { "text-anchor": "middle" }));
      });
      svg.appendChild(Tx((m.l + W - m.r) / 2, H - 6, opt.xTitle, "t-axis", { "text-anchor": "middle" }));
      if (opt.legend) { svg.appendChild(sigLegend(0, 16, opt.legend)); }
      rows.forEach(function (row, i) {
        var rowTop = m.t + rowH * i + gapsBefore(i);
        var yy = stacked ? rowTop + rowH - 16 : rowTop + rowH / 2;
        var lo = row.coef - 1.96 * row.se, hi = row.coef + 1.96 * row.se;
        row.cy = yy; row.top = rowTop; row.labelY = stacked ? rowTop + 15 : yy + 4;
        if (stacked) {
          var label = S("text", { x: 1, y: r1(row.labelY), "class": opt.colored ? "t-label" : "t-row" }, [row.name]);
          if (row.sub) { label.appendChild(S("tspan", { "class": "t-axis", dx: 6 }, [row.sub])); }
          svg.appendChild(label);
          svg.appendChild(Tx(W - 2, row.labelY, row.value, "t-value", { "text-anchor": "end" }));
        } else {
          if (row.sub) {
            svg.appendChild(Tx(1, yy - 2, row.name, opt.colored ? "t-label" : "t-row"));
            svg.appendChild(Tx(1, yy + 13, row.sub, "t-axis"));
          } else {
            svg.appendChild(Tx(1, yy + 4, row.name, "t-row"));
          }
          svg.appendChild(Tx(W - 2, yy + 4, row.value, "t-value", { "text-anchor": "end" }));
        }
        var cls = row.color ? "" : (row.sig ? " ci-sig" : " ci-ns");
        var stroke = row.color ? { stroke: row.color } : null;
        svg.appendChild(seg(x(lo), yy, x(hi), yy, "ci grow" + cls, stroke));
        svg.appendChild(seg(x(lo), yy - 5, x(lo), yy + 5, "ci" + cls, stroke));
        svg.appendChild(seg(x(hi), yy - 5, x(hi), yy + 5, "ci" + cls, stroke));
        var dot = row.color
          ? S("circle", { cx: r1(x(row.coef)), cy: r1(yy), r: 6, "class": "dot pop", fill: row.color })
          : sigDot(row.sig ? "sig" : "ns", x(row.coef), yy, 6);
        if (!row.color) { dot.setAttribute("class", dot.getAttribute("class") + " pop"); }
        svg.appendChild(dot);
        hits.appendChild(hit(S("rect", { x: 0, y: r1(rowTop), width: W, height: rowH, rx: 6 }), row.name, row.tip));
      });
      var noteY = noteRow > -1 ? rows[noteRow].top + rowH + noteH / 2 : null;
      return { svg: svg, x: x, rows: rows, rowH: rowH, stacked: stacked, noteY: noteY };
    }

    function chartDecomp(W, maxH) {
      var rows = DATA.decomp.map(function (d) {
        var lo = d.coef - 1.96 * d.se, hi = d.coef + 1.96 * d.se;
        return {
          name: s("dec." + d.key), coef: d.coef, se: d.se, sig: parseFloat(d.p) < 0.05, value: fmt(d.coef, 4),
          tip: s("ci.tip", { c: fmt(d.coef, d.digits), lo: fmt(lo, 4), hi: fmt(hi, 4), p: d.p })
        };
      });
      var c = ciChart(W, maxH, rows, {
        aria: s("dec.aria"), top: 58, topNarrow: 66, lo: -0.05, hi: 0.03, gaps: [1, 3], noteRow: 3,
        ticks: [-0.04, -0.03, -0.02, -0.01, 0, 0.01, 0.02], ticksNarrow: [-0.04, -0.02, 0, 0.02],
        xTitle: s("dec.x"), legend: ["sig", "ns"], minRow: 30, maxRow: 44
      });
      var x = c.x, R = c.rows;
      var bx0 = x(-0.0124) - 12, bx1 = x(-0.0102) + 12;
      c.svg.appendChild(pen(roughRect(bx0, R[0].cy - 13, bx1 - bx0, R[2].cy - R[0].cy + 26, 41), 1));
      c.svg.appendChild(tag((bx0 + bx1) / 2, c.stacked ? R[0].top - 14 : R[0].cy - c.rowH / 2 - 14, s("dec.same"), 1, "find", "middle", W));
      c.svg.appendChild(pen(roughEllipse(x(R[3].coef), R[3].cy, 15, 12, 43), 2, true));
      if (c.stacked) {
        c.svg.appendChild(tag(x(R[3].coef), c.noteY, s("dec.half"), 2, "warn", "middle", W));
      } else {
        c.svg.appendChild(tag(x(R[3].coef) - 10, (R[3].cy + R[4].cy) / 2, s("dec.half"), 2, "warn", "start", W));
      }
      return c.svg;
    }

    function chartCountries(W, maxH) {
      var rows = DATA.countries.map(function (d) {
        var lo = d.coef - 1.96 * d.se, hi = d.coef + 1.96 * d.se;
        return {
          name: s("c." + d.id), sub: s("cty.obs", { n: d.obs }), coef: d.coef, se: d.se, color: "var(--c-" + d.id + ")",
          value: fmtSigned(d.coef, 4) + d.stars,
          tip: s("ci.tip", { c: fmtSigned(d.coef, 6) + d.stars, lo: fmt(lo, 4), hi: fmt(hi, 4), p: d.stars ? "< 0.10" : "> 0.10" })
        };
      });
      var c = ciChart(W, maxH, rows, {
        aria: s("cty.aria"), top: 50, topNarrow: 36, lo: -0.035, hi: 0.035, colored: true, padBottom: 34, noteRow: 2,
        ticks: [-0.03, -0.02, -0.01, 0, 0.01, 0.02, 0.03], ticksNarrow: [-0.02, 0, 0.02],
        xTitle: s("dec.x"), minRow: 46, maxRow: 60
      });
      var th = c.rows[2];
      c.svg.appendChild(pen(roughEllipse(c.x(th.coef), th.cy, 17, 13, 51), 1));
      if (c.stacked) {
        c.svg.appendChild(tag(c.x(th.coef), c.noteY, s("cty.incumbent"), 2, "find", "middle", W));
      } else {
        c.svg.appendChild(tag(c.x(th.coef), th.cy + c.rowH / 2 + 14, s("cty.incumbent"), 2, "find", "middle", W));
      }
      c.svg.appendChild(tag(W - 2, 18, s("cty.few"), 3, "warn", "end", W));
      return c.svg;
    }

    function icon(kind) {
      var d = kind === "yes" ? "M4 10.5l4 4 8-9" : kind === "no" ? "M5.5 5.5l9 9M14.5 5.5l-9 9" : "M3.5 10h12M11 5.5l4.5 4.5-4.5 4.5";
      return S("svg", { viewBox: "0 0 20 20", "aria-hidden": "true", focusable: "false" }, [
        S("path", { d: d, fill: "none", stroke: "currentColor", "stroke-width": "2.2", "stroke-linecap": "round", "stroke-linejoin": "round" })
      ]);
    }
    function ledger() {
      var wrap = document.createElement("div");
      wrap.className = "ledger";
      [
        { kind: "yes", mark: 1, items: ["y1", "y2", "y3"] },
        { kind: "no", mark: 2, items: ["n1", "n2", "n3", "n4"] },
        { kind: "next", mark: 3, items: ["x1"] }
      ].forEach(function (group) {
        var section = document.createElement("section");
        section.className = "ledger-group " + group.kind;
        section.setAttribute("data-mark", String(group.mark));
        var heading = document.createElement("h4");
        heading.appendChild(icon(group.kind));
        heading.appendChild(document.createTextNode(s("l." + group.kind)));
        section.appendChild(heading);
        var list = document.createElement("ul");
        list.className = "ledger-list";
        group.items.forEach(function (key, i) {
          var item = document.createElement("li");
          item.className = "ledger-item";
          item.style.setProperty("--i", i);
          item.appendChild(icon(group.kind));
          var body = document.createElement("div");
          var title = document.createElement("strong");
          title.textContent = s("l." + key);
          var detail = document.createElement("span");
          detail.textContent = s("l." + key + "d");
          body.appendChild(title);
          body.appendChild(detail);
          item.appendChild(body);
          list.appendChild(item);
        });
        section.appendChild(list);
        wrap.appendChild(section);
      });
      return wrap;
    }

    /* --- CV visuals -------------------------------------------------------------- */

    // Decimal years from the CV: April 2023 starts at 2023 + 3/12, June 2024 ends at 2024 + 6/12.
    var TIMELINE = {
      from: 2023, to: 2028,
      lanes: ["edu", "res", "prac"],
      items: [
        { id: "sim", lane: "edu", from: 2023 + 3 / 12, to: 2024 + 6 / 12 },     // April 2023 – June 2024
        { id: "bsc", lane: "edu", from: 2024 + 8 / 12, to: 2026 + 6 / 12 },     // September 2024 – June 2026
        { id: "conferral", lane: "edu", at: 2026 + 10 / 12 + 12 / 365 },         // 12 November 2026
        { id: "next", lane: "edu", from: 2027, to: 2028, open: true },          // applying now
        { id: "research", lane: "res", from: 2025 + 8 / 12, to: 2026 + 6 / 12 }, // 2025–2026 final-year project
        { id: "intern", lane: "prac", from: 2025 + 6 / 12, to: 2025 + 9 / 12 },  // July – September 2025
        { id: "tableau", lane: "prac", at: 2025 + 11.5 / 12 }                     // submitted December 2025
      ],
      focus: [["sim", "bsc", "conferral"], ["tableau", "research"], ["research"], ["research"], ["intern"], ["next"]]
    };

    function chartTimeline(W, focusStep) {
      var narrow = W < 460;
      var laneLabelW = Math.max.apply(null, TIMELINE.lanes.map(function (lane) { return textW(s("tl.lane." + lane), 11.5, 600); })) + 14;
      var m = { t: 18, b: 30, l: narrow ? laneLabelW : laneLabelW + 6, r: 8 };
      var laneH = narrow ? 34 : 50;
      var H = m.t + laneH * TIMELINE.lanes.length + m.b;
      var x = lin(TIMELINE.from, TIMELINE.to, m.l, W - m.r);
      var svg = svgRoot(W, H, s("tl.aria"));
      var hits = S("g", null);
      svg.appendChild(hits);
      var focus = TIMELINE.focus[focusStep] || [];
      function laneY(lane) { return m.t + laneH * (TIMELINE.lanes.indexOf(lane) + 0.62); }
      for (var year = TIMELINE.from; year <= TIMELINE.to; year++) {
        svg.appendChild(seg(x(year), m.t - 6, x(year), H - m.b + 4, "gridline"));
        if (year < TIMELINE.to) { svg.appendChild(Tx(x(year + 0.5), H - 8, String(year), "t-axis", { "text-anchor": "middle" })); }
      }
      TIMELINE.lanes.forEach(function (lane) {
        svg.appendChild(Tx(1, laneY(lane) + 4, s("tl.lane." + lane), "t-group"));
      });
      // Shapes first, so the labels can be placed around everything already drawn.
      var taken = [], groups = {};
      TIMELINE.items.forEach(function (item) {
        var on = focus.indexOf(item.id) > -1;
        var yy = laneY(item.lane);
        var group = S("g", { "class": "tl-item" + (on ? " is-focus" : "") + (item.open ? " is-open" : "") });
        var label = s("tl." + item.id), when = s("tl.when." + item.id);
        var bounds;
        if (item.at !== undefined) {
          var cx = x(item.at);
          group.appendChild(S("path", { d: "M" + r1(cx) + "," + r1(yy - 7) + "l7,7l-7,7l-7,-7z", "class": "tl-mark" }));
          bounds = { x0: cx - 8, x1: cx + 8 };
          hits.appendChild(hit(S("circle", { cx: r1(cx), cy: r1(yy), r: 13 }), label, when));
        } else {
          var x0 = x(item.from), x1 = x(item.to);
          group.appendChild(S("rect", { x: r1(x0), y: r1(yy - 7), width: r1(Math.max(4, x1 - x0)), height: 14, rx: 7, "class": "tl-bar" }));
          bounds = { x0: x0, x1: x1 };
          hits.appendChild(hit(S("rect", { x: r1(x0 - 4), y: r1(yy - 14), width: r1(x1 - x0 + 8), height: 28, rx: 8 }), label, when));
        }
        item.bounds = bounds;
        item.y = yy;
        taken.push({ x0: bounds.x0, x1: bounds.x1, y0: yy - 7, y1: yy + 7 });
        groups[item.id] = group;
        svg.appendChild(group);
      });
      function itemById(id) { return TIMELINE.items.filter(function (it) { return it.id === id; })[0]; }
      var edu = itemById("sim"), conf = itemById("conferral"), tab = itemById("tableau"), res = itemById("research");
      var ax = (tab.bounds.x0 + tab.bounds.x1) / 2, edge = W - 3;
      function boxAround(it, padX, padY) {
        return { x0: it.bounds.x0 - padX, x1: Math.min(it.bounds.x1 + padX, edge), y0: it.y - padY, y1: it.y + padY };
      }
      // Each step's pen marks, as boxes: the current step's are kept clear of labels.
      var penBoxes = [
        [{ x0: edu.bounds.x0 - 12, x1: Math.min(conf.bounds.x1 + 12, edge), y0: edu.y - 12, y1: edu.y + 12 }],
        [{ x0: ax - 16, x1: ax + 16, y0: tab.y - 15, y1: tab.y + 15 }, { x0: ax - 1, x1: ax + 18, y0: res.y + 7, y1: tab.y - 11 }],
        [boxAround(res, 11, 12)],
        [{ x0: res.bounds.x1 - 16, x1: res.bounds.x1 + 16, y0: res.y - 12, y1: res.y + 12 }],
        [boxAround(itemById("intern"), 11, 12)],
        [boxAround(itemById("next"), 11, 12)]
      ];
      (penBoxes[focusStep] || []).forEach(function (box) { taken.push(box); });

      // Labels go above their item unless that would touch another label, shape
      // or the current pen mark; then below, then beside it. Right to left, so
      // the later items, whose labels have the least room, choose first. A
      // phone shows only the labels the current step is about.
      function free(box) {
        if (box.x0 < 0 || box.x1 > W - 1) { return false; }
        return taken.every(function (o) { return box.x1 + 6 <= o.x0 || o.x1 + 6 <= box.x0 || box.y1 <= o.y0 || o.y1 <= box.y0; });
      }
      TIMELINE.items.slice().sort(function (a, b) { return b.bounds.x0 - a.bounds.x0; }).forEach(function (item) {
        if (narrow && focus.indexOf(item.id) < 0) { return; }
        var label = s("tl." + item.id), w = textW(label, 11.5, 600);
        function spot(where) {
          var ly, lx, anchor, left;
          if (where === "side") {
            ly = item.y + 4; lx = item.bounds.x1 + 14; anchor = "start"; left = lx;
          } else if (where === "below") {
            ly = item.y + 22;
            lx = clamp((item.bounds.x0 + item.bounds.x1) / 2, m.l + w / 2, W - 2 - w / 2);
            anchor = "middle"; left = lx - w / 2;
          } else if (item.id === "intern" || item.id === "conferral") {
            ly = item.y - 16; lx = Math.max(item.bounds.x1, m.l + w); anchor = "end"; left = lx - w;
          } else {
            ly = item.y - 16; lx = Math.min(item.bounds.x0, W - 2 - w); anchor = "start"; left = lx;
          }
          return { lx: lx, ly: ly, anchor: anchor, box: { x0: left, x1: left + w, y0: ly - 9, y1: ly + 2 } };
        }
        var order = narrow && item.id === "conferral" ? ["below", "above", "side"] : ["above", "below", "side"];
        var spots = order.map(spot);
        var pick = spots.filter(function (one) { return free(one.box); })[0] || spots[0];
        taken.push(pick.box);
        groups[item.id].appendChild(Tx(pick.lx, pick.ly, label, "t-tl", { "text-anchor": pick.anchor }));
      });

      // One annotation per step, drawn on the item that step is about.
      function around(id, step, seed, warn) {
        var box = boxAround(itemById(id), 9, 9);
        return pen(roughRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0, seed), 1, warn, step);
      }
      svg.appendChild(pen(roughRect(edu.bounds.x0 - 10, edu.y - 10, Math.min(conf.bounds.x1 + 10, edge) - edu.bounds.x0 + 10, 20, 61), 1, false, 0));
      svg.appendChild(pen(roughEllipse(ax, tab.y, 14, 13, 62), 1, false, 1));
      svg.appendChild(pen("M" + r1(ax + 3) + "," + r1(tab.y - 13) + "C" + r1(ax + 16) + "," + r1(tab.y - laneH * 0.5) + " " + r1(ax + 14) + "," + r1(res.y + 18) + " " + r1(ax + 6) + "," + r1(res.y + 9) +
        "M" + r1(ax + 1) + "," + r1(res.y + 16) + "L" + r1(ax + 6) + "," + r1(res.y + 9) + "L" + r1(ax + 12) + "," + r1(res.y + 14), 2, false, 1));
      svg.appendChild(around("research", 2, 63));
      svg.appendChild(pen(roughEllipse(res.bounds.x1, res.y, 14, 10.5, 64), 1, false, 3));
      svg.appendChild(around("intern", 4, 65));
      svg.appendChild(around("next", 5, 66));
      return svg;
    }

    var COHORT = {
      research: { mine: 80, mean: 67, uq: 73, max: 84 }, // cv.research.grade1
      tableau: { mine: 70, mean: 63.7, uq: 70, max: 76 }  // cv.research.grade2
    };

    function chartCohort(W, key) {
      var d = COHORT[key];
      var H = 46;
      var x = lin(55, 90, 10, W - 10);
      var svg = svgRoot(W, H, s("cohort.aria." + key));
      var yy = 22;
      svg.appendChild(seg(x(55), yy, x(90), yy, "rule"));
      [60, 70, 80, 90].forEach(function (v) {
        svg.appendChild(seg(x(v), yy - 3, x(v), yy + 3, "rule"));
        svg.appendChild(Tx(x(v), H - 4, String(v), "t-axis", { "text-anchor": "middle" }));
      });
      svg.appendChild(S("rect", { x: r1(x(d.uq)), y: yy - 5, width: r1(x(d.max) - x(d.uq)), height: 10, rx: 5, "class": "cohort-top grow" }));
      svg.appendChild(S("circle", { cx: r1(x(d.mean)), cy: yy, r: 4.5, "class": "cohort-mean pop" }));
      svg.appendChild(seg(x(d.uq), yy - 9, x(d.uq), yy + 9, "cohort-tick"));
      svg.appendChild(seg(x(d.max), yy - 9, x(d.max), yy + 9, "cohort-tick"));
      svg.appendChild(S("circle", { cx: r1(x(d.mine)), cy: yy, r: 7, "class": "dot cohort-me pop" }));
      return svg;
    }

    function cohortLegend(key) {
      var d = COHORT[key];
      var p = document.createElement("p");
      p.className = "cohort-legend";
      [["me", d.mine], ["mean", d.mean], ["uq", d.uq], ["max", d.max], ["band", null]].forEach(function (pair) {
        var span = document.createElement("span");
        var swatch = document.createElement("i");
        swatch.className = "ck ck-" + pair[0];
        swatch.setAttribute("aria-hidden", "true");
        span.appendChild(swatch);
        span.appendChild(document.createTextNode(s("cohort." + pair[0]) + (pair[1] === null ? "" : " " + pair[1])));
        p.appendChild(span);
      });
      return p;
    }

    function renderCohorts() {
      cohortSlots.forEach(function (slot) {
        var key = slot.getAttribute("data-cohort");
        if (!COHORT[key]) { return; }
        var plot = $(".cohort-plot", slot) || slot;
        var W = Math.max(240, Math.round(plot.getBoundingClientRect().width || 320));
        plot.replaceChildren(chartCohort(W, key), cohortLegend(key));
      });
    }

    /* --- Tooltip, toast, floating bar --------------------------------------------- */

    var tip = document.createElement("div");
    tip.className = "story-tip";
    tip.setAttribute("aria-hidden", "true");
    document.body.appendChild(tip);
    function showTip(title, value, x, y) {
      tip.replaceChildren();
      var strong = document.createElement("strong");
      strong.textContent = value;
      var span = document.createElement("span");
      span.textContent = title;
      tip.appendChild(strong);
      tip.appendChild(span);
      tip.classList.add("is-on");
      var w = tip.offsetWidth, h = tip.offsetHeight;
      var left = clamp(x + 14, 8, window.innerWidth - w - 8);
      var top = y - h - 12;
      if (top < 8) { top = y + 18; }
      tip.style.transform = "translate(" + Math.round(left) + "px," + Math.round(top) + "px)";
    }
    function hideTip() { tip.classList.remove("is-on"); }
    document.addEventListener("pointermove", function (event) {
      var target = event.target.closest && event.target.closest("[data-tip-v]");
      if (target) { showTip(target.getAttribute("data-tip-t"), target.getAttribute("data-tip-v"), event.clientX, event.clientY); }
      else { hideTip(); }
    });
    document.addEventListener("focusin", function (event) {
      var target = event.target.closest && event.target.closest("[data-tip-v]");
      if (target) {
        var box = target.getBoundingClientRect();
        showTip(target.getAttribute("data-tip-t"), target.getAttribute("data-tip-v"), box.left + box.width / 2, box.top);
      }
    });
    document.addEventListener("focusout", hideTip);
    window.addEventListener("scroll", hideTip, { passive: true });

    var toastEl = document.createElement("div");
    toastEl.className = "story-toast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    document.body.appendChild(toastEl);
    var toastTimer = 0;
    function toast(message, ms) {
      toastEl.textContent = message;
      toastEl.classList.add("is-on");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, ms || 2600);
    }

    // A small bar at the foot of the screen while the reader is away from where
    // they started: jumping to a table row from a chart, or stepping through
    // the evidence for a skill. "Back" returns to the starting point.
    var bar = $("[data-jump-bar]");
    var barReturn = null, barNext = null, barClose = null;
    function openBar(label, onNext, onBack, onClose) {
      if (!bar) { return; }
      $("[data-jump-label]", bar).textContent = label;
      $("[data-jump-next]", bar).hidden = !onNext;
      barNext = onNext; barReturn = onBack; barClose = onClose;
      bar.hidden = false;
    }
    function closeBar() {
      if (!bar || bar.hidden) { return; }
      bar.hidden = true;
      if (barClose) { barClose(); }
      barNext = barReturn = barClose = null;
    }
    if (bar) {
      bar.addEventListener("click", function (event) {
        var button = event.target.closest("button");
        if (!button) { return; }
        if (button.hasAttribute("data-jump-next") && barNext) { barNext(); }
        else if (button.hasAttribute("data-jump-back")) { var back = barReturn; closeBar(); if (back) { back(); } }
        else if (button.hasAttribute("data-jump-close")) { closeBar(); }
      });
    }
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && bar && !bar.hidden && !root.classList.contains("is-presenting")) { closeBar(); }
    });
    function scrollToEl(node, block) {
      node.scrollIntoView({ block: block || "center", behavior: REDUCED ? "auto" : "smooth" });
    }

    /* --- Deck: steps, clicks, scroll, stage, presentation --------------------------- */

    var deck = null;
    if (deckEl) {
      deck = (function () {
        var kind = deckEl.getAttribute("data-deck");
        var prefix = deckEl.getAttribute("data-deck-prefix") || "step";
        var timerBudget = (deckEl.getAttribute("data-deck-timer") || "").split(",").filter(Boolean).map(Number);
        var STEPS = $$(".step", deckEl);
        var N = STEPS.length;
        var MAXC = STEPS.map(function (step) { return Number(step.getAttribute("data-clicks")) || 0; });
        var SCENES = STEPS.map(function (step) { return $(".scene", step); });
        var stage = $(".story-stage", deckEl);
        var stageScenes = $(".stage-scenes", deckEl);
        var stageVisual = $("[data-visual]", deckEl);
        var pills = $(".stage-pills", deckEl);
        var presentUI = $("[data-present-ui]");
        var BUILD = { dpp: chartDpp, avg: chartAvg, tstat: chartTstat, decomp: chartDecomp, countries: chartCountries, ledger: ledger };
        var cur = 0, click = 0, presenting = false, placed = null;
        var played = STEPS.map(function () { return 0; });
        var startedByScroll = STEPS.map(function () { return false; });
        var scrollCur = -1, autoTimer = 0, suppressUntil = 0;

        function levelFor(k) {
          if (k === cur) { return click; }
          return presenting ? 0 : played[k];
        }
        function applyMarks() {
          STEPS.forEach(function (step, k) {
            var level = levelFor(k);
            $$("[data-mark]", step).forEach(function (node) {
              if (node.hasAttribute("data-for-step")) { return; }
              node.classList.toggle("is-on", Number(node.getAttribute("data-mark")) <= level);
            });
            if (SCENES[k]) {
              $$("[data-mark]", SCENES[k]).forEach(function (node) {
                node.classList.toggle("is-on", Number(node.getAttribute("data-mark")) <= level);
              });
            }
          });
          if (stageVisual) {
            $$("[data-for-step]", stageVisual).forEach(function (node) {
              var k = Number(node.getAttribute("data-for-step"));
              node.classList.toggle("is-on", k === cur && Number(node.getAttribute("data-mark")) <= click);
            });
          }
        }
        function syncScenes() {
          SCENES.forEach(function (scene, i) {
            if (!scene) { return; }
            var hiddenScene = placed === "stage" && i !== cur;
            scene.classList.toggle("is-active", i === cur);
            if (hiddenScene) { scene.setAttribute("aria-hidden", "true"); scene.inert = true; }
            else { scene.removeAttribute("aria-hidden"); scene.inert = false; }
          });
        }
        function placeScenes() {
          if (!stageScenes) { placed = "none"; return false; }
          var want = (presenting || WIDE.matches) ? "stage" : "inline";
          if (want === placed) { return false; }
          placed = want;
          SCENES.forEach(function (scene, i) {
            if (!scene) { return; }
            if (want === "stage") { stageScenes.appendChild(scene); }
            else { STEPS[i].appendChild(scene); }
          });
          syncScenes();
          return true;
        }
        function render() {
          var maxH = (presenting || WIDE.matches) ? Math.max(250, window.innerHeight - (presenting ? 250 : 320)) : 460;
          SCENES.forEach(function (scene) {
            if (!scene) { return; }
            var plot = $(".scene-plot", scene);
            var build = BUILD[scene.getAttribute("data-scene")];
            if (!plot || !build) { return; }
            var W = Math.max(280, Math.round(plot.getBoundingClientRect().width || 560));
            plot.replaceChildren(build(W, maxH));
          });
          if (stageVisual) {
            var Wv = Math.max(280, Math.round(stageVisual.getBoundingClientRect().width || 560));
            stageVisual.replaceChildren(chartTimeline(Wv, cur));
          }
          renderCohorts();
          applyMarks();
        }
        function animateIn(container) {
          if (REDUCED || !container || typeof Element.prototype.animate !== "function") { return; }
          $$(".draw", container).forEach(function (node, k) {
            node.animate([{ strokeDasharray: "1", strokeDashoffset: "1" }, { strokeDasharray: "1", strokeDashoffset: "0" }],
              { duration: 900, delay: 80 * k, easing: "cubic-bezier(.3,.7,.2,1)", fill: "backwards" });
          });
          $$(".pop", container).forEach(function (node, k) {
            node.animate([{ opacity: 0, transform: "scale(.3)" }, { opacity: 1, transform: "scale(1)" }],
              { duration: 420, delay: 160 + 60 * k, easing: "cubic-bezier(.2,.8,.2,1.2)", fill: "backwards" });
          });
          $$(".grow", container).forEach(function (node, k) {
            node.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
              { duration: 600, delay: 120 + 70 * k, easing: "cubic-bezier(.3,.7,.2,1)", fill: "backwards" });
          });
        }
        function setState(i, c, source) {
          i = clamp(i, 0, N - 1);
          c = clamp(c, 0, MAXC[i]);
          var changed = i !== cur;
          if (changed) { played[cur] = (!presenting && startedByScroll[cur]) ? MAXC[cur] : Math.max(played[cur], click); }
          cur = i;
          click = c;
          played[i] = Math.max(played[i], c);
          STEPS.forEach(function (step, k) { step.classList.toggle("is-active", k === i); });
          syncScenes();
          if (stageVisual && changed) { stageVisual.replaceChildren(chartTimeline(Math.max(280, Math.round(stageVisual.getBoundingClientRect().width || 560)), cur)); }
          if (changed) { animateIn(SCENES[i]); animateIn($(".step-visual", STEPS[i])); }
          applyMarks();
          updateStageUI();
          updatePresentUI();
          // The address follows the deck only while presenting or after a link to a
          // step, as in Slidev. Reading by scroll leaves it alone, so the hash of a
          // page section (or #evidence-...) is not overwritten while passing by.
          if (source === "present" || source === "link") { syncHash(); }
        }

        function cancelAuto() { clearTimeout(autoTimer); autoTimer = 0; }
        function activateFromScroll(i) {
          if (presenting || i === scrollCur) { return; }
          scrollCur = i;
          startedByScroll[i] = true;
          cancelAuto();
          for (var k = 0; k < i; k++) { played[k] = MAXC[k]; }
          var target = MAXC[i];
          if (REDUCED || played[i] >= target) { setState(i, target, "scroll"); return; }
          setState(i, played[i], "scroll");
          function stepUp() {
            if (cur !== i || presenting) { autoTimer = 0; return; }
            if (click < target) { setState(i, click + 1, "scroll"); autoTimer = setTimeout(stepUp, 650); }
            else { autoTimer = 0; }
          }
          autoTimer = setTimeout(stepUp, 380);
        }
        if ("IntersectionObserver" in window) {
          var observer = new IntersectionObserver(function (entries) {
            if (presenting || Date.now() < suppressUntil) { return; }
            entries.forEach(function (entry) { if (entry.isIntersecting) { activateFromScroll(STEPS.indexOf(entry.target)); } });
          }, { rootMargin: "-44% 0px -50% 0px", threshold: 0 });
          STEPS.forEach(function (step) { observer.observe(step); });
        }

        // Links to a step and click: #step-4.2 (Slidev: /4?clicks=2).
        var hashRe = new RegExp("^#" + prefix + "-(\\d+)(?:\\.(\\d+))?$");
        var lastHash = "";
        function hashFor(i, c) { return "#" + prefix + "-" + (i + 1) + (c ? "." + c : ""); }
        function syncHash() {
          var hash = hashFor(cur, click);
          if (hash === lastHash) { return; }
          lastHash = hash;
          try { window.history.replaceState(null, "", hash); } catch (error) { /* history unavailable */ }
        }
        function readLink(hash) {
          var match = hashRe.exec(hash || "");
          return match ? { i: Number(match[1]) - 1, c: match[2] !== undefined ? Number(match[2]) : null } : null;
        }
        function scrollToStep(i, smoothScroll) {
          var previous = root.style.scrollBehavior;
          if (!smoothScroll) { root.style.scrollBehavior = "auto"; }
          STEPS[i].scrollIntoView({ block: WIDE.matches ? "center" : "start", behavior: smoothScroll && !REDUCED ? "smooth" : "auto" });
          root.style.scrollBehavior = previous;
        }
        function go(link, smoothScroll) {
          if (!link) { return; }
          var i = clamp(link.i, 0, N - 1);
          var c = link.c === null ? MAXC[i] : clamp(link.c, 0, MAXC[i]);
          cancelAuto();
          played[i] = Math.max(played[i], c);
          scrollCur = i;
          suppressUntil = Date.now() + (smoothScroll ? 1400 : 700);
          setState(i, c, "link");
          if (!presenting) { scrollToStep(i, smoothScroll); }
        }
        window.addEventListener("hashchange", function () { var link = readLink(window.location.hash); if (link) { go(link, true); } });
        document.addEventListener("click", function (event) {
          var anchor = event.target.closest && event.target.closest('a[href^="#' + prefix + '-"]');
          if (!anchor) { return; }
          var link = readLink(anchor.getAttribute("href"));
          if (link) { event.preventDefault(); go(link, true); }
        });

        function buildPills() {
          if (!pills) { return; }
          pills.replaceChildren();
          STEPS.forEach(function (step, i) {
            var item = document.createElement("li");
            var button = document.createElement("button");
            button.type = "button";
            button.textContent = String(i + 1);
            button.setAttribute("data-go", String(i));
            var heading = $("h3", step);
            button.setAttribute("aria-label", s("ui.stepN", { n: i + 1 }) + (heading ? ": " + heading.textContent : ""));
            item.appendChild(button);
            pills.appendChild(item);
          });
          updateStageUI();
        }
        function updateStageUI() {
          if (!pills) { return; }
          $$("button", pills).forEach(function (button, i) {
            button.setAttribute("aria-current", i === cur ? "step" : "false");
            button.classList.toggle("is-done", i !== cur && played[i] >= MAXC[i]);
          });
        }
        if (pills) {
          pills.addEventListener("click", function (event) {
            var button = event.target.closest("button[data-go]");
            if (button) { go({ i: Number(button.getAttribute("data-go")), c: null }, true); }
          });
        }

        // Presentation mode.
        var countEl = presentUI && $("[data-present-count]", presentUI);
        var fillEl = presentUI && $("[data-present-fill]", presentUI);
        var trackEl = presentUI && $("[data-present-track]", presentUI);
        var prevBtn = presentUI && $("[data-present-prev]", presentUI);
        var nextBtn = presentUI && $("[data-present-next]", presentUI);
        var timerEl = presentUI && $("[data-present-timer]", presentUI);
        var TOTAL = MAXC.reduce(function (sum, value) { return sum + value + 1; }, 0);
        var timerStart = 0, timerTick = 0, timerShown = false;
        if (trackEl) {
          var acc = 0;
          MAXC.forEach(function (value, i) {
            if (i > 0) {
              var tick = document.createElement("span");
              tick.className = "present-tick";
              tick.style.left = (acc / TOTAL * 100).toFixed(2) + "%";
              trackEl.appendChild(tick);
            }
            acc += value + 1;
          });
        }
        function clock(seconds) { return Math.floor(seconds / 60) + ":" + ("0" + Math.floor(seconds % 60)).slice(-2); }
        function updateTimer() {
          if (!timerEl || !timerBudget.length) { return; }
          var elapsed = timerStart ? (Date.now() - timerStart) / 1000 : 0;
          var total = timerBudget.reduce(function (a, b) { return a + b; }, 0);
          var budgetSoFar = timerBudget.slice(0, cur + 1).reduce(function (a, b) { return a + b; }, 0);
          timerEl.textContent = s("ui.timer", { t: clock(elapsed), total: clock(total), step: timerBudget[cur] || 0 });
          timerEl.classList.toggle("is-over", elapsed > budgetSoFar);
        }
        function updatePresentUI() {
          if (!presentUI) { return; }
          if (countEl) { countEl.textContent = s("ui.count", { s: cur + 1, n: N, c: click, m: MAXC[cur] }); }
          var done = MAXC.slice(0, cur).reduce(function (sum, value) { return sum + value + 1; }, 0) + click + 1;
          if (fillEl) { fillEl.style.width = (done / TOTAL * 100).toFixed(2) + "%"; }
          if (prevBtn) { prevBtn.disabled = cur === 0 && click === 0; }
          if (nextBtn) { nextBtn.disabled = cur === N - 1 && click === MAXC[N - 1]; }
          updateTimer();
        }
        function toggleTimer(force) {
          if (!timerEl || !timerBudget.length) { return; }
          timerShown = force === undefined ? !timerShown : force;
          timerEl.hidden = !timerShown;
          updateTimer();
        }
        function enterPresent(fromStart) {
          if (presenting || !presentUI) { return; }
          presenting = true;
          cancelAuto();
          closeBar();
          root.classList.add("is-presenting");
          deckEl.classList.add("is-presenting");
          presentUI.hidden = false;
          placeScenes();
          render();
          setState(fromStart ? 0 : cur, 0, "present");
          animateIn(SCENES[cur]);
          timerStart = Date.now();
          clearInterval(timerTick);
          if (timerBudget.length) { timerTick = setInterval(updateTimer, 500); }
          try { deckEl.focus({ preventScroll: true }); } catch (error) { deckEl.focus(); }
        }
        function exitPresent() {
          if (!presenting) { return; }
          presenting = false;
          played[cur] = Math.max(played[cur], click);
          clearInterval(timerTick);
          root.classList.remove("is-presenting");
          deckEl.classList.remove("is-presenting");
          presentUI.hidden = true;
          try { if (document.fullscreenElement && document.exitFullscreen) { document.exitFullscreen(); } } catch (error) { /* ignore */ }
          placeScenes();
          render();
          scrollCur = cur;
          suppressUntil = Date.now() + 700;
          scrollToStep(cur, false);
          applyMarks();
        }
        function next() {
          if (click < MAXC[cur]) { setState(cur, click + 1, "present"); }
          else if (cur < N - 1) { setState(cur + 1, 0, "present"); }
        }
        function prev() {
          if (click > 0) { setState(cur, click - 1, "present"); }
          else if (cur > 0) { setState(cur - 1, MAXC[cur - 1], "present"); }
        }
        function toggleFullscreen() {
          try {
            if (document.fullscreenElement) { document.exitFullscreen(); }
            else if (root.requestFullscreen) { var request = root.requestFullscreen(); if (request && request.catch) { request.catch(function () {}); } }
          } catch (error) { /* fullscreen refused */ }
        }
        var fsBtn = presentUI && $("[data-present-fullscreen]", presentUI);
        if (fsBtn && !document.fullscreenEnabled) { fsBtn.hidden = true; }
        var timerBtn = presentUI && $("[data-present-timer-toggle]", presentUI);
        if (timerBtn) { timerBtn.hidden = !timerBudget.length; }

        document.addEventListener("keydown", function (event) {
          if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) { return; }
          var target = event.target || {};
          if (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName || "") || target.isContentEditable) { return; }
          var onControl = target.closest && target.closest("button, a, summary");
          if (presenting) {
            if ((event.key === "Enter" || event.key === " ") && onControl) { return; }
            if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].indexOf(event.key) > -1) { event.preventDefault(); next(); }
            else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].indexOf(event.key) > -1) { event.preventDefault(); prev(); }
            else if (event.key === "Home") { event.preventDefault(); setState(0, 0, "present"); }
            else if (event.key === "End") { event.preventDefault(); setState(N - 1, MAXC[N - 1], "present"); }
            else if (event.key === "Escape" || event.key === "p" || event.key === "P") { event.preventDefault(); exitPresent(); }
            else if (event.key === "f" || event.key === "F") { event.preventDefault(); toggleFullscreen(); }
            else if (event.key === "t" || event.key === "T") { event.preventDefault(); toggleTimer(); }
          } else if (event.key === "p" || event.key === "P") {
            event.preventDefault();
            enterPresent(false);
          }
        });
        var swipeX = null, swipeY = null;
        deckEl.addEventListener("pointerdown", function (event) { if (presenting) { swipeX = event.clientX; swipeY = event.clientY; } });
        deckEl.addEventListener("pointerup", function (event) {
          if (!presenting || swipeX === null) { return; }
          var dx = event.clientX - swipeX, dy = event.clientY - swipeY;
          swipeX = null;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) { if (dx < 0) { next(); } else { prev(); } }
        });
        document.addEventListener("click", function (event) {
          var button = event.target.closest && event.target.closest("[data-story]");
          if (!button) { return; }
          var action = button.getAttribute("data-story");
          if (action === "present") { enterPresent(button.hasAttribute("data-from-start")); }
          else if (action === "exit") { exitPresent(); }
          else if (action === "next") { next(); }
          else if (action === "prev") { prev(); }
          else if (action === "fullscreen") { toggleFullscreen(); }
          else if (action === "timer") { toggleTimer(); }
          else if (action === "copy-link") { copyLink(); }
        });
        function copyLink() {
          var url = window.location.href.split("#")[0] + hashFor(cur, click);
          function fail() { toast(s("ui.copyFail", { u: url }), 6000); }
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(url).then(function () { toast(s("ui.copied", { h: hashFor(cur, click) })); }, fail);
            } else { fail(); }
          } catch (error) { fail(); }
        }

        // Numbers links: jump to the table rows a chart uses and mark them.
        deckEl.addEventListener("click", function (event) {
          var cite = event.target.closest && event.target.closest("[data-cite]");
          if (!cite) { return; }
          var ids = cite.getAttribute("data-cite").split(/\s+/);
          var targets = [];
          ids.forEach(function (id) { targets = targets.concat($$('[data-cite-id="' + id + '"]')); });
          if (!targets.length) { return; }
          event.preventDefault();
          var fromStep = cur;
          $$(".is-cited").forEach(function (node) { node.classList.remove("is-cited"); });
          targets.forEach(function (node) { node.classList.add("is-cited"); });
          scrollToEl(targets[0], "center");
          openBar(s("ui.citeLabel", { n: fromStep + 1 }), null, function () { go({ i: fromStep, c: null }, true); }, function () {
            $$(".is-cited").forEach(function (node) { node.classList.remove("is-cited"); });
          });
        });

        deckEl.classList.add("is-ready");
        return {
          init: function () {
            placeScenes();
            render();
            buildPills();
            setState(0, 0, "init");
            animateIn(SCENES[0]);
            var link = readLink(window.location.hash);
            if (link) { setTimeout(function () { go(link, false); }, 60); }
          },
          relayout: function (force) { if (placeScenes() || force) { render(); } },
          refreshText: function () { render(); buildPills(); updatePresentUI(); }
        };
      })();
    }

    /* --- Evidence index (cv.html): mark the lines that prove a skill ----------------- */

    var evidence = null;
    if (evidenceIndex) {
      evidence = (function () {
        var chips = $$("[data-evidence]", evidenceIndex);
        var status = $("[data-evidence-status]", evidenceIndex);
        var active = null, index = 0;
        function matches(key) { return $$('[data-ev~="' + key + '"]'); }
        function label(key) {
          var chip = chips.filter(function (c) { return c.getAttribute("data-evidence") === key; })[0];
          return chip ? $("[data-i18n]", chip).textContent : key;
        }
        function counts() {
          chips.forEach(function (chip) {
            var count = $(".ev-count", chip);
            if (count) { count.textContent = String(matches(chip.getAttribute("data-evidence")).length); }
          });
        }
        function clear(keepHash) {
          $$(".ev-on, .ev-current").forEach(function (node) { node.classList.remove("ev-on", "ev-current"); });
          chips.forEach(function (chip) { chip.setAttribute("aria-pressed", "false"); });
          active = null;
          if (status) { status.textContent = ""; }
          if (!keepHash && /^#evidence-/.test(window.location.hash)) {
            try { window.history.replaceState(null, "", window.location.pathname + window.location.search); } catch (error) { /* ignore */ }
          }
        }
        function show(key, step) {
          var list = matches(key);
          if (!list.length) { return; }
          if (active !== key) {
            clear(true);
            active = key;
            index = 0;
            list.forEach(function (node) { node.classList.add("ev-on"); });
            chips.forEach(function (chip) { chip.setAttribute("aria-pressed", String(chip.getAttribute("data-evidence") === key)); });
            try { window.history.replaceState(null, "", "#evidence-" + key); } catch (error) { /* ignore */ }
          } else {
            index = (index + (step || 1) + list.length) % list.length;
          }
          list.forEach(function (node, i) { node.classList.toggle("ev-current", i === index); });
          var text = s("ev.status", { name: label(key), i: index + 1, n: list.length });
          if (status) { status.textContent = text; }
          scrollToEl(list[index], "center");
          openBar(text, list.length > 1 ? function () { show(key, 1); } : null, function () { scrollToEl(evidenceIndex, "center"); }, function () { clear(false); });
        }
        evidenceIndex.addEventListener("click", function (event) {
          var chip = event.target.closest("[data-evidence]");
          if (chip) { show(chip.getAttribute("data-evidence"), 1); }
        });
        function fromHash() {
          var match = /^#evidence-([a-z-]+)$/.exec(window.location.hash || "");
          if (match) { show(match[1], 0); }
        }
        window.addEventListener("hashchange", fromHash);
        return {
          init: function () { counts(); setTimeout(fromHash, 80); },
          refreshText: function () {
            if (active) {
              var text = s("ev.status", { name: label(active), i: index + 1, n: matches(active).length });
              if (status) { status.textContent = text; }
              if (bar && !bar.hidden) { $("[data-jump-label]", bar).textContent = text; }
            }
          }
        };
      })();
    }

    /* --- Start ---------------------------------------------------------------------- */

    function refreshAll() {
      bodyFont = window.getComputedStyle(document.body).fontFamily;
      loadStrings();
      renderCohorts();
      if (deck) { deck.refreshText(); }
      if (evidence) { evidence.refreshText(); }
    }

    var siteHeader = $(".site-header");
    var pinnedStage = $(".story--cv .story-stage");
    function measureHeader() {
      if (siteHeader) { root.style.setProperty("--story-header", siteHeader.offsetHeight + "px"); }
      if (pinnedStage) {
        var pinned = window.getComputedStyle(pinnedStage).position === "sticky";
        root.style.setProperty("--story-stage", (pinned ? pinnedStage.offsetHeight : 0) + "px");
      }
    }
    measureHeader();
    bodyFont = window.getComputedStyle(document.body).fontFamily;
    loadStrings();
    renderCohorts();
    if (deck) { deck.init(); }
    if (evidence) { evidence.init(); }
    measureHeader();

    document.addEventListener("site:languagechange", function () {
      measureHeader();
      root.classList.add("story-no-anim");
      refreshAll();
      measureHeader();
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { root.classList.remove("story-no-anim"); });
      });
    });

    var resizeTimer = 0, lastWidth = window.innerWidth, lastHeight = window.innerHeight;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (window.innerWidth === lastWidth && Math.abs(window.innerHeight - lastHeight) < 80) { return; }
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        measureHeader();
        if (deck) { deck.relayout(true); }
        renderCohorts();
        measureHeader();
      }, 140);
    });
    if (deck && WIDE.addEventListener) {
      WIDE.addEventListener("change", function () { deck.relayout(false); });
    }
  }
})();
