import os, re

HERE = os.path.dirname(__file__)
src = open(os.path.join(HERE, "rapport-stage-cadence.md"), encoding="utf-8").read()

# Remplace chaque bloc ```mermaid ... ``` par l'image de diagramme correspondante (dans l'ordre).
counter = {"n": 0}


def repl(_m):
    counter["n"] += 1
    return f"![Diagramme {counter['n']}](img/diagram-{counter['n']}.png)"


out = re.sub(r"```mermaid\n.*?```", repl, src, flags=re.DOTALL)
# Retire le commentaire HTML d'en-tête (inutile dans le Word).
out = re.sub(r"^<!--.*?-->\n", "", out, count=1, flags=re.DOTALL)

dst = os.path.join(HERE, "rapport-stage-cadence.print.md")
open(dst, "w", encoding="utf-8").write(out)
print(f"{counter['n']} blocs mermaid remplacés -> {dst}")
