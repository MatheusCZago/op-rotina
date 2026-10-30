/* ===== OP% · leitor/gravador mínimo de .xlsx (sem biblioteca, sem internet) =====
   Cobre só o que o OP% precisa: planilhas com texto, número, data/hora (como número + formato) e booleano.
   Leitura: zip (stored/deflate via DecompressionStream) + XML. Escrita: zip "stored" + XML. */
var MiniXLSX = (function () {
  var enc = new TextEncoder(), dec = new TextDecoder('utf-8');

  /* ---------- zip ---------- */
  var CRC = (function () { var t = new Uint32Array(256), c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zipWrite(files) {                                   // files: [{name, data:Uint8Array}]
    var parts = [], central = [], off = 0;
    function u16(v) { return [v & 255, (v >>> 8) & 255]; }
    function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    files.forEach(function (f) {
      var nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
      var lh = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(sz), u32(sz), u16(nm.length), u16(0));
      parts.push(new Uint8Array(lh), nm, f.data);
      central.push({ nm: nm, crc: crc, sz: sz, off: off });
      off += lh.length + nm.length + sz;
    });
    var cdStart = off, cdLen = 0;
    central.forEach(function (c) {
      var h = [].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(c.crc), u32(c.sz), u32(c.sz), u16(c.nm.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.off));
      parts.push(new Uint8Array(h), c.nm); cdLen += h.length + c.nm.length;
    });
    parts.push(new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(cdLen), u32(cdStart), u16(0))));
    var total = 0; parts.forEach(function (p) { total += p.length; });
    var out = new Uint8Array(total), p = 0; parts.forEach(function (x) { out.set(x, p); p += x.length; });
    return out;
  }
  async function inflateRaw(bytes) {
    if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador não consegue abrir planilhas. Use o backup .json.');
    var ds = new DecompressionStream('deflate-raw'), w = ds.writable.getWriter();
    w.write(bytes); w.close();
    return new Uint8Array(await new Response(ds.readable).arrayBuffer());
  }
  async function zipRead(buf) {
    var b = buf instanceof Uint8Array ? buf : new Uint8Array(buf), dv = new DataView(b.buffer, b.byteOffset, b.byteLength), i, eocd = -1;
    for (i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('Arquivo não é uma planilha .xlsx válida.');
    var n = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), files = {};
    for (i = 0; i < n; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('Planilha corrompida.');
      var method = dv.getUint16(p + 10, true), csz = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
      var name = dec.decode(b.subarray(p + 46, p + 46 + nl));
      p += 46 + nl + el + cl;
      if (/\/$/.test(name)) continue;
      var ln = dv.getUint16(lo + 26, true), le = dv.getUint16(lo + 28, true), st = lo + 30 + ln + le, raw = b.subarray(st, st + csz);
      files[name] = { method: method, raw: raw };
    }
    return files;
  }
  async function fileText(files, name) {
    var f = files[name]; if (!f) return null;
    var d = f.method === 0 ? f.raw : f.method === 8 ? await inflateRaw(f.raw) : null;
    if (!d) throw new Error('Compressão da planilha não suportada.');
    return dec.decode(d);
  }

  /* ---------- referências A1 ---------- */
  function colNum(s) { var c = 0; for (var i = 0; i < s.length; i++) c = c * 26 + s.charCodeAt(i) - 64; return c - 1; }
  function colName(n) { var s = ''; n++; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }
  function decode_range(ref) {
    var m = String(ref).match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/); if (!m) return { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
    var s = { r: +m[2] - 1, c: colNum(m[1]) }, e = m[3] ? { r: +m[4] - 1, c: colNum(m[3]) } : { r: s.r, c: s.c };
    return { s: s, e: e };
  }

  /* ---------- leitura ---------- */
  function xml(s) { return new DOMParser().parseFromString(s, 'application/xml'); }
  function kids(el, tag) { var o = []; for (var c = el.firstElementChild; c; c = c.nextElementSibling) if (c.localName === tag) o.push(c); return o; }
  function textOf(si) {                                         // <si><t> ou <r><t>…</t></r>…; ignora fonética (rPh)
    var out = '';
    for (var c = si.firstElementChild; c; c = c.nextElementSibling) {
      if (c.localName === 't') out += c.textContent;
      else if (c.localName === 'r') kids(c, 't').forEach(function (t) { out += t.textContent; });
    }
    return out;
  }
  async function read(data) {
    var files = await zipRead(data);
    var wbT = await fileText(files, 'xl/workbook.xml'); if (!wbT) throw new Error('Arquivo não é uma planilha .xlsx do Excel.');
    var relT = await fileText(files, 'xl/_rels/workbook.xml.rels'), ssT = await fileText(files, 'xl/sharedStrings.xml');
    var rels = {}; if (relT) Array.prototype.forEach.call(xml(relT).getElementsByTagName('Relationship'), function (r) { rels[r.getAttribute('Id')] = r.getAttribute('Target'); });
    var sst = []; if (ssT) kids(xml(ssT).documentElement, 'si').forEach(function (si) { sst.push(textOf(si)); });
    var wb = { SheetNames: [], Sheets: {} };
    var sheets = Array.prototype.slice.call(xml(wbT).getElementsByTagName('sheet'));
    for (var si = 0; si < sheets.length; si++) {
      var sh = sheets[si], name = sh.getAttribute('name'), rid = sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || sh.getAttribute('r:id');
      var tgt = rels[rid]; if (!tgt) continue;
      var path = tgt.charAt(0) === '/' ? tgt.slice(1) : 'xl/' + tgt.replace(/^\.\//, '');
      var sT = await fileText(files, path); if (!sT) continue;
      var cells = {}, minR = 1e9, minC = 1e9, maxR = -1, maxC = -1;
      Array.prototype.forEach.call(xml(sT).getElementsByTagName('c'), function (c) {
        var ref = c.getAttribute('r'), m = ref && ref.match(/^([A-Z]+)(\d+)$/); if (!m) return;
        var t = c.getAttribute('t'), vEl = null, isEl = null;
        for (var k = c.firstElementChild; k; k = k.nextElementSibling) { if (k.localName === 'v') vEl = k; else if (k.localName === 'is') isEl = k; }
        var v = null;
        if (t === 'inlineStr') v = isEl ? textOf(isEl) : null;
        else if (vEl) {
          var raw = vEl.textContent;
          if (t === 's') v = sst[+raw] == null ? null : sst[+raw];
          else if (t === 'str') v = raw;
          else if (t === 'b') v = raw === '1';
          else if (t === 'e') v = null;
          else if (raw !== '' && isFinite(+raw)) v = +raw;
        }
        if (v === null || v === '') return;
        var r = +m[2] - 1, cc = colNum(m[1]); cells[r + ',' + cc] = v;
        if (r < minR) minR = r; if (r > maxR) maxR = r; if (cc < minC) minC = cc; if (cc > maxC) maxC = cc;
      });
      var ws = { _cells: cells };
      if (maxR >= 0) ws['!ref'] = colName(minC) + (minR + 1) + ':' + colName(maxC) + (maxR + 1);
      wb.SheetNames.push(name); wb.Sheets[name] = ws;
    }
    return wb;
  }
  function sheet_to_json(ws) {                                  // header:1 — linhas dentro do intervalo, vazios = null
    if (!ws['!ref']) return [];
    var rg = decode_range(ws['!ref']), rows = [];
    for (var r = rg.s.r; r <= rg.e.r; r++) {
      var row = [];
      for (var c = rg.s.c; c <= rg.e.c; c++) { var v = ws._cells[r + ',' + c]; row.push(v === undefined ? null : v); }
      rows.push(row);
    }
    return rows;
  }

  /* ---------- escrita ---------- */
  var FMT = { 'dd/mm/yyyy': 1, 'hh:mm': 2, '0%': 3 };           // índices em cellXfs
  function esc(s) { return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function book_new() { return { SheetNames: [], Sheets: {} }; }
  function aoa_to_sheet(rows) { return { _rows: rows }; }
  function book_append_sheet(wb, ws, name) { wb.SheetNames.push(name); wb.Sheets[name] = ws; }
  function sheetXML(ws) {
    var rows = ws._rows, cols = ws['!cols'] || [], s = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
    var maxC = 0; rows.forEach(function (r) { if (r.length > maxC) maxC = r.length; });
    s += '<dimension ref="A1:' + colName(Math.max(0, maxC - 1)) + Math.max(1, rows.length) + '"/>';
    s += '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>';
    if (cols.length) s += '<cols>' + cols.map(function (c, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (c.wch + 2) + '" customWidth="1"/>'; }).join('') + '</cols>';
    s += '<sheetData>';
    rows.forEach(function (row, ri) {
      var cs = '';
      row.forEach(function (v, ci) {
        if (v === null || v === undefined || v === '') return;
        var ref = colName(ci) + (ri + 1), style = ri === 0 ? 4 : 0, num = null;
        if (typeof v === 'object' && v.t === 'n') { num = v.v; if (v.z && FMT[v.z]) style = FMT[v.z]; }
        else if (typeof v === 'number') num = v;
        if (typeof v === 'boolean') cs += '<c r="' + ref + '" t="b"' + (style ? ' s="' + style + '"' : '') + '><v>' + (v ? 1 : 0) + '</v></c>';
        else if (num !== null) { if (isFinite(num)) cs += '<c r="' + ref + '"' + (style ? ' s="' + style + '"' : '') + '><v>' + num + '</v></c>'; }
        else cs += '<c r="' + ref + '" t="inlineStr"' + (style ? ' s="' + style + '"' : '') + '><is><t xml:space="preserve">' + esc(v) + '</t></is></c>';
      });
      s += '<row r="' + (ri + 1) + '">' + cs + '</row>';
    });
    return s + '</sheetData></worksheet>';
  }
  function write(wb) {
    var X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', files = [], n = wb.SheetNames.length, i;
    var ct = X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';
    for (i = 1; i <= n; i++) ct += '<Override PartName="/xl/worksheets/sheet' + i + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
    ct += '</Types>';
    var rootRels = X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    var wbx = X + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>', wr = X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
    for (i = 1; i <= n; i++) {
      wbx += '<sheet name="' + esc(wb.SheetNames[i - 1]) + '" sheetId="' + i + '" r:id="rId' + i + '"/>';
      wr += '<Relationship Id="rId' + i + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + i + '.xml"/>';
    }
    wbx += '</sheets></workbook>'; wr += '<Relationship Id="rId' + (n + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    var styles = X + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="hh:mm"/></numFmts>' +
      '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
      '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
      '<xf numFmtId="9" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    files.push({ name: '[Content_Types].xml', data: enc.encode(ct) }, { name: '_rels/.rels', data: enc.encode(rootRels) }, { name: 'xl/workbook.xml', data: enc.encode(wbx) },
      { name: 'xl/_rels/workbook.xml.rels', data: enc.encode(wr) }, { name: 'xl/styles.xml', data: enc.encode(styles) });
    for (i = 1; i <= n; i++) files.push({ name: 'xl/worksheets/sheet' + i + '.xml', data: enc.encode(sheetXML(wb.Sheets[wb.SheetNames[i - 1]])) });
    var out = zipWrite(files);
    return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
  }

  return { read: read, write: write, utils: { sheet_to_json: sheet_to_json, decode_range: decode_range, book_new: book_new, aoa_to_sheet: aoa_to_sheet, book_append_sheet: book_append_sheet } };
})();
