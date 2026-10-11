import re
from playwright.sync_api import Playwright, sync_playwright
from dotenv import load_dotenv
import os

load_dotenv()


username = os.getenv("CHROMOSOFT_USERNAME")
password = os.getenv("CHROMOSOFT_PASSWORD")

def run(playwright: Playwright) -> None:
    browser = playwright.chromium.launch(
        headless=True,
        args=["--disable-dev-shm-usage", "--no-sandbox"],
    )
    context = browser.new_context(ignore_https_errors=True)
    page = context.new_page()
    page.set_default_timeout(100000)
    page.set_default_navigation_timeout(100000)
    page.goto("https://hzd.chromosoft.de/login")
    page.locator("input[name=\"username\"]").click()
    page.locator("input[name=\"username\"]").fill(username)
    page.locator("input[name=\"username\"]").press("Tab")
    page.locator("input[name=\"password\"]").fill(password)
    page.get_by_role("button", name="anmelden").click()
    page.get_by_role("listitem").filter(has_text="Suche").click()
    page.get_by_role("link", name="nach Personen").click()
    page.get_by_role("link", name="Powersuche").click()
    page.get_by_text("Person", exact=True).click()
    page.get_by_role("row", name="Region").get_by_role("textbox").click()
#    page.locator("span").filter(has_text=re.compile(r"^Nord$")).click()
    page.get_by_role("radio").first.check()
    page.locator(".ch_fld_cont_hldr > img").click()
    page.locator("input[name=\"chk_all_sel_reslts\"]").check()
    with page.expect_download(timeout=600000) as download_info:
        page.get_by_role("img", name="speichere ausgewählte als").nth(1).click()
    download = download_info.value

    filename = "alle_hzd_mitglieder.csv"

    download.save_as(f"./{filename}")
    print(f"Datei gespeichert unter: {filename}")

    context.close()
    browser.close()


with sync_playwright() as playwright:
    run(playwright)
