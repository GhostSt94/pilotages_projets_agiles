import os, re, json, tempfile
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(__file__)
MD = os.path.join(HERE, "rapport-stage-cadence.md")
OUT = os.path.join(HERE, "img", "diagrams")
os.makedirs(OUT, exist_ok=True)

# Noms de sortie, dans l'ordre d'apparition des blocs ```mermaid``` dans le rapport.
NAMES = [
    "fig-1-1-benchmark.png",
    "fig-1-2-planning-gantt.png",
    "fig-2-1-cas-utilisation.png",
    "fig-2-2-sequence-capacite.png",
    "fig-2-3-cycle-sprint.png",
    "fig-3-1-architecture.png",
    "fig-3-2-pipeline-requete.png",
    "fig-3-3-modele-donnees.png",
    "fig-3-4-algorithme-capacite.png",
    "fig-3-5-arborescence-ecrans.png",
]

src = open(MD, encoding="utf-8").read()
blocks = re.findall(r"```mermaid\n(.*?)```", src, re.DOTALL)
print(f"{len(blocks)} diagrammes trouvés (attendu {len(NAMES)})")

TPL = """<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
 html,body{{margin:0;background:#ffffff}}
 #c{{display:inline-block;padding:24px;background:#ffffff;
     font-family:Inter,'Segoe UI',Arial,sans-serif}}
 #c svg{{font-family:Inter,'Segoe UI',Arial,sans-serif !important}}
</style></head><body>
<div id="c"></div>
<script id="def" type="application/json">{json}</script>
<script type="module">
 import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
 mermaid.initialize({{
   startOnLoad:false,
   theme:'base',
   themeVariables:{{
     fontFamily:"Inter, 'Segoe UI', Arial, sans-serif",
     fontSize:'15px',
     primaryColor:'#EEF1FC',
     primaryBorderColor:'#2D4ECC',
     primaryTextColor:'#1A1B1E',
     lineColor:'#5B6470',
     secondaryColor:'#F1F2F5',
     secondaryBorderColor:'#C9CDD4',
     tertiaryColor:'#FFFFFF',
     tertiaryBorderColor:'#E4E6EA',
     clusterBkg:'#F6F7F9',
     clusterBorder:'#C9CDD4',
     noteBkgColor:'#E7EAFB',
     noteBorderColor:'#2D4ECC',
     titleColor:'#1A1B1E',
     actorBkg:'#EEF1FC',
     actorBorder:'#2D4ECC',
     labelBoxBkgColor:'#EEF1FC'
   }},
   flowchart:{{useMaxWidth:false, htmlLabels:true, curve:'basis', nodeSpacing:50, rankSpacing:60, padding:12}},
   sequence:{{useMaxWidth:false, actorMargin:60, boxMargin:12, messageFontSize:14, noteFontSize:13}},
   gantt:{{useMaxWidth:false, barHeight:26, fontSize:14, sectionFontSize:15, gridLineStartPadding:120}},
   er:{{useMaxWidth:false, entityPadding:16, fontSize:14}}
 }});
 try {{
   await document.fonts.ready;
   const def = JSON.parse(document.getElementById('def').textContent);
   const {{svg}} = await mermaid.render('g', def);
   document.getElementById('c').innerHTML = svg;
   window.__done = true;
 }} catch (e) {{
   document.getElementById('c').textContent = 'ERR: ' + e.message;
   window.__err = String(e); window.__done = true;
 }}
</script></body></html>"""


def run(p):
    browser = p.chromium.launch(channel="msedge", headless=True)
    # device_scale_factor=3 -> images nettes pour l'impression / Word
    ctx = browser.new_context(viewport={"width": 1900, "height": 1400}, device_scale_factor=3)
    page = ctx.new_page()
    for i, b in enumerate(blocks):
        name = NAMES[i] if i < len(NAMES) else f"diagram-{i+1}.png"
        html = TPL.format(json=json.dumps(b.strip()))
        f = os.path.join(tempfile.gettempdir(), f"diag-{i+1}.html")
        open(f, "w", encoding="utf-8").write(html)
        page.goto("file:///" + f.replace("\\", "/"))
        try:
            page.wait_for_function("window.__done === true", timeout=25000)
        except Exception:
            print(f"{name}: timeout")
        err = page.evaluate("window.__err || null")
        if err:
            print(f"{name}: ERREUR {err}")
        page.wait_for_timeout(500)
        el = page.query_selector("#c")
        el.screenshot(path=os.path.join(OUT, name))
        print("saved", name)
    ctx.close(); browser.close()


with sync_playwright() as p:
    run(p)
print("DONE")
