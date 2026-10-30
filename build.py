import re, sys, pathlib, hashlib, shutil
# Gera app/ (index.html, sw.js, manifest, ícones) a partir de src/ e pwa/.  Uso: python build.py
ROOT = pathlib.Path(__file__).resolve().parent
STANDALONE = True
src = ROOT / 'src'
order = ['engine.js', 'defaults.js', 'store.js', 'ui_core.js', 'charts.js', 'io.js', 'main.js', 'v_hoje.js', 'v_semana.js', 'v_painel.js', 'v_rotina.js', 'v_ajustes.js']
# main.js precisa vir depois das views para o boot; mas views usam ACT/VIEWS definidos em main.js -> main primeiro, boot por último
js = '\n'.join((src / f).read_text() for f in order if f != 'main.js')
main = (src / 'main.js').read_text()
head_vars, boot_part = main.split("/* ---- boas-vindas ---- */")[0], "/* ---- boas-vindas ---- */" + main.split("/* ---- boas-vindas ---- */")[1]
# ordem final: engine, defaults, store, ui_core, charts, io, main(core), views, boot
core = '\n'.join((src / f).read_text() for f in ['engine.js', 'defaults.js', 'store.js', 'ui_core.js', 'charts.js', 'minixlsx.js', 'io.js'])
views = '\n'.join((src / f).read_text() for f in ['v_hoje.js', 'v_semana.js', 'v_painel.js', 'v_rotina.js', 'v_ajustes.js'])
script = core + '\n' + head_vars + '\n' + views + '\n' + boot_part
script = script.replace("if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.OPX = api;", "root.OPX = api;")
script = re.sub(r"if \(typeof module !== 'undefined' && module\.exports\) module\.exports = \w+;", '', script)
css = (src / 'style.css').read_text()
if STANDALONE:
    script = script.replace("var STANDALONE = false;", "var STANDALONE = true;", 1)
    out_dir = ROOT / 'app'; out_dir.mkdir(exist_ok=True)
    body = f"""<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>OP% Rotina</title>
<meta name="description" content="OP%: planeje a rotina, registre em dois toques e acompanhe execução, metas, XP e sequência.">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#ecf1f0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0a1416" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon.svg" type="image/svg+xml">
<link rel="icon" href="icons/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="OP%">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>
{css}
[hidden]{{display:none!important}}
</style>
</head>
<body>
<div id="app" aria-live="polite"></div>
<noscript>O OP% precisa de JavaScript para funcionar.</noscript>
<script>
{script}
</script>
<script>
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {{
  window.addEventListener('load', function () {{ navigator.serviceWorker.register('sw.js').catch(function () {{}}); }});
}}
</script>
</body>
</html>
"""
    (out_dir / 'index.html').write_text(body)
    h = hashlib.sha1(body.encode()).hexdigest()[:10]
    sw = (ROOT / 'pwa' / 'sw.js').read_text().replace('__BUILD__', h)
    (out_dir / 'sw.js').write_text(sw)
    shutil.copy(ROOT / 'pwa' / 'manifest.webmanifest', out_dir / 'manifest.webmanifest')
    shutil.copytree(ROOT / 'pwa' / 'icons', out_dir / 'icons', dirs_exist_ok=True)
    print('standalone ok', len(body)//1024, 'KB, build', h)
