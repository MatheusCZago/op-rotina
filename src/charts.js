/* ===== OP% · gráficos SVG (sem biblioteca) ===== */
var Charts = (function () {
  var REG = {};
  var f = function (v) { return Math.round(v * 10) / 10; };
  function nice(max) {
    if (!(max > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(max))), n = max / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }
  function topRound(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h));
    return 'M' + f(x) + ',' + f(y + h) + 'V' + f(y + r) + 'Q' + f(x) + ',' + f(y) + ' ' + f(x + r) + ',' + f(y) + 'H' + f(x + w - r) + 'Q' + f(x + w) + ',' + f(y) + ' ' + f(x + w) + ',' + f(y + r) + 'V' + f(y + h) + 'Z';
  }
  function rightRound(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, h / 2, w));
    return 'M' + f(x) + ',' + f(y) + 'H' + f(x + w - r) + 'Q' + f(x + w) + ',' + f(y) + ' ' + f(x + w) + ',' + f(y + r) + 'V' + f(y + h - r) + 'Q' + f(x + w) + ',' + f(y + h) + ' ' + f(x + w - r) + ',' + f(y + h) + 'H' + f(x) + 'Z';
  }
  function xlabels(items, W, H, gap) {
    // items: [{x, t}] — escolhe rótulos sem sobreposição: o último tem prioridade, depois os demais da esquerda p/ direita
    var n = items.length, out = '', placed = [], order = [n - 1], i;
    for (i = 0; i < n - 1; i++) order.push(i);
    order.forEach(function (idx) {
      var it = items[idx]; if (!it || it.skip) return;
      var w = String(it.t).length * 6.3, x = Math.min(Math.max(it.x, w / 2 + 1), W - w / 2 - 1), a = x - w / 2 - (gap || 8), b = x + w / 2 + (gap || 8);
      for (var k = 0; k < placed.length; k++) if (a < placed[k][1] && b > placed[k][0]) return;
      placed.push([a, b]);
      out += '<text class="ax" x="' + f(x) + '" y="' + (H - 6) + '" text-anchor="middle">' + it.t + '</text>';
    });
    return out;
  }
  function yAxis(o, W, H, m, yMax) {
    var s = '', t = o.ticks || [0, 0.5, 1].map(function (k) { return k * yMax; });
    t.forEach(function (v) {
      var y = m.t + (1 - v / yMax) * (H - m.t - m.b);
      s += '<line class="' + (v === 0 ? 'axl' : 'gl') + '" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + f(y) + '" y2="' + f(y) + '"/>' +
        '<text class="ax" x="' + (m.l - 6) + '" y="' + f(y + 4) + '" text-anchor="end">' + (o.tickFmt ? o.tickFmt(v) : v) + '</text>';
    });
    return s;
  }
  function cols(o, W) {
    var H = o.h || 190, m = { l: o.mlft || 34, r: o.showMeta ? 8 : 6, t: 14, b: 24 };
    var n = o.data.length, pw = W - m.l - m.r, slot = pw / n, bw = Math.min(24, slot * 0.68);
    var vals = o.data.map(function (d) { return d.v; }).filter(function (v) { return v != null; });
    var yMax = o.yMax || nice(Math.max.apply(null, vals.concat([0])) * 1.12);
    var ph = H - m.t - m.b, s = yAxis(o, W, H, m, yMax);
    var every = Math.max(1, Math.ceil(n * (o.xw || 34) / pw)), xl = [];
    o.data.forEach(function (d, i) {
      var cx = m.l + slot * (i + 0.5), x = cx - bw / 2;
      if (d.v != null && d.v > 0) {
        var h = Math.max(2, d.v / yMax * ph), y = m.t + ph - h;
        s += '<path d="' + topRound(x, y, bw, h, 4) + '" fill="' + (d.fill || 'var(--accent)') + '"' + (d.dim ? ' opacity=".4"' : '') + '/>';
        if (o.vals && (n <= 8 || (i % every === 0) || i === n - 1)) s += '<text class="lbl" x="' + f(cx) + '" y="' + f(y - 5) + '" text-anchor="middle">' + (o.valFmt ? o.valFmt(d.v) : d.v) + '</text>';
      } else if (d.v === 0 && o.zeroTick) s += '<rect x="' + f(x) + '" y="' + (m.t + ph - 2) + '" width="' + f(bw) + '" height="2" fill="var(--line-2)"/>';
      xl.push({ x: cx, t: d.x, skip: !(i % every === 0 || i === n - 1) });
      s += '<rect class="hit" x="' + f(m.l + slot * i) + '" y="' + m.t + '" width="' + f(slot) + '" height="' + ph + '" fill="transparent" data-tip="' + (d.tip || '').replace(/"/g, '&quot;') + '"/>';
    });
    s += xlabels(xl, W, H);
    if (o.meta != null) {
      var my = m.t + (1 - o.meta / yMax) * ph;
      s += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + f(my) + '" y2="' + f(my) + '" stroke="var(--ink-3)" stroke-width="1.5"/>';
    }
    return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (o.alt || '') + '">' + s + '</svg>';
  }
  function line(o, W) {
    var H = o.h || 190, m = { l: o.mlft || 34, r: 14, t: 18, b: 24 };
    var n = o.data.length, pw = W - m.l - m.r, ph = H - m.t - m.b;
    var vals = o.data.map(function (d) { return d.v; }).filter(function (v) { return v != null; });
    var yMax = o.yMax || nice(Math.max.apply(null, vals.concat([0])) * 1.12);
    var px = function (i) { return m.l + (n === 1 ? pw / 2 : pw * i / (n - 1)); }, py = function (v) { return m.t + (1 - v / yMax) * ph; };
    var s = yAxis(o, W, H, m, yMax), seg = [], cur = [];
    o.data.forEach(function (d, i) { if (d.v == null) { if (cur.length) seg.push(cur); cur = []; } else cur.push([px(i), py(d.v)]); });
    if (cur.length) seg.push(cur);
    seg.forEach(function (p) {
      if (p.length > 1) {
        s += '<path d="M' + p[0][0] + ',' + (m.t + ph) + p.map(function (q) { return 'L' + f(q[0]) + ',' + f(q[1]); }).join('') + 'L' + p[p.length - 1][0] + ',' + (m.t + ph) + 'Z" fill="var(--accent)" opacity=".1"/>';
        s += '<path d="M' + p.map(function (q) { return f(q[0]) + ',' + f(q[1]); }).join('L') + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
      }
    });
    var every = Math.max(1, Math.ceil(n * (o.xw || 40) / pw)), xl = [];
    o.data.forEach(function (d, i) {
      xl.push({ x: px(i), t: d.x, skip: !(i % every === 0 || i === n - 1) });
      s += '<rect class="hit" x="' + f(px(i) - pw / n / 2) + '" y="' + m.t + '" width="' + f(pw / n) + '" height="' + ph + '" fill="transparent" data-tip="' + (d.tip || '').replace(/"/g, '&quot;') + '"/>';
    });
    s += xlabels(xl, W, H);
    var li = -1; o.data.forEach(function (d, i) { if (d.v != null) li = i; });
    if (li >= 0) {
      var ex = px(li), ey = py(o.data[li].v);
      s += '<circle cx="' + f(ex) + '" cy="' + f(ey) + '" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>' +
        '<text class="lbl" x="' + f(Math.min(ex, W - m.r)) + '" y="' + f(ey - 10) + '" text-anchor="' + (li > n / 2 ? 'end' : 'start') + '">' + (o.valFmt ? o.valFmt(o.data[li].v) : o.data[li].v) + '</text>';
    }
    if (o.meta != null) {
      var my = py(o.meta);
      s += '<line x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + f(my) + '" y2="' + f(my) + '" stroke="var(--ink-3)" stroke-width="1.5"/>';
    }
    return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (o.alt || '') + '">' + s + '</svg>';
  }
  function hbars(o, W) {
    var lw = o.lw || 88, m = { l: lw, r: 56, t: 4, b: 4 }, rowH = 40, H = m.t + m.b + o.data.length * rowH;
    var pw = W - m.l - m.r, vals = [];
    o.data.forEach(function (d) { vals.push(d.a || 0, d.b || 0); });
    var mx = nice(Math.max.apply(null, vals.concat([0.001])) * 1.02), s = '';
    o.data.forEach(function (d, i) {
      var y = m.t + i * rowH, bh = 11;
      s += '<text class="ax" style="fill:var(--ink)" x="0" y="' + (y + rowH / 2 + 4) + '" font-size="12.5">' + (d.label.length > 13 ? d.label.slice(0, 12) + '…' : d.label) + '</text>';
      var wa = (d.a || 0) / mx * pw, wb = (d.b || 0) / mx * pw;
      if (wa > 0) s += '<path d="' + rightRound(m.l, y + 6, wa, bh, 4) + '" fill="var(--plan)"/>';
      if (wb > 0) s += '<path d="' + rightRound(m.l, y + 6 + bh + 2, wb, bh, 4) + '" fill="var(--accent)"/>';
      s += '<text class="lbl" x="' + f(m.l + Math.max(wb, 0) + 6) + '" y="' + (y + 6 + bh + 2 + 9) + '">' + (o.valFmt ? o.valFmt(d.b || 0) : d.b) + '</text>';
      s += '<rect class="hit" x="0" y="' + y + '" width="' + W + '" height="' + rowH + '" fill="transparent" data-tip="' + (d.tip || '').replace(/"/g, '&quot;') + '"/>';
    });
    return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (o.alt || '') + '">' + s + '</svg>';
  }
  function table(t) {
    return '<div class="tbl-wrap"><table class="t"><thead><tr>' + t.head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
      t.rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function draw(host) {
    var o = REG[host.getAttribute('data-chart')]; if (!o) return;
    if (host.getAttribute('data-view') === 'tabela') { host.innerHTML = table(o.table); return; }
    var W = Math.floor(host.clientWidth || host.parentNode.clientWidth || 320);
    if (W < 80) return;
    host.innerHTML = o.kind === 'line' ? line(o, W) : o.kind === 'hbars' ? hbars(o, W) : cols(o, W);
  }
  return {
    host: function (id, spec) { REG[id] = spec; return '<div class="chart" data-chart="' + id + '"></div>'; },
    drawAll: function () { $$('.chart[data-chart]').forEach(draw); },
    draw: draw,
    reset: function () { REG = {}; }
  };
})();
