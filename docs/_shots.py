import os, sys, time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:5200"
OUT = os.path.join(os.path.dirname(__file__), "img")
os.makedirs(OUT, exist_ok=True)
EMAIL, PWD = "manager@devox.ma", "password123"


def shot(page, name, full=True):
    page.wait_for_timeout(1500)
    path = os.path.join(OUT, name)
    page.screenshot(path=path, full_page=full)
    print("saved", path)


def run(p):
    browser = p.chromium.launch(channel="msedge", headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
    page = ctx.new_page()

    # --- Login screen (avant connexion) ---
    page.goto(f"{BASE}/login", wait_until="networkidle")
    shot(page, "01-login.png")

    # --- Connexion ---
    try:
        page.fill("input[type=email]", EMAIL)
    except Exception:
        page.fill("input", EMAIL)
    page.fill("input[type=password]", PWD)
    page.keyboard.press("Enter")
    page.wait_for_timeout(3000)

    routes = [
        ("/board", "02-board.png"),
        ("/planning", "03-planning.png"),
        ("/leaves", "04-leaves.png"),
        ("/team", "05-team.png"),
        ("/dashboard", "06-dashboard.png"),
        ("/my-tasks", "07-my-tasks.png"),
    ]
    for route, name in routes:
        page.goto(f"{BASE}{route}", wait_until="networkidle")
        page.wait_for_timeout(2500)  # laisser charts / data se rendre
        shot(page, name)

    ctx.close()
    browser.close()


with sync_playwright() as p:
    run(p)
print("DONE")
