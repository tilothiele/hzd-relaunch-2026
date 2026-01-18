import re
from playwright.sync_api import Playwright, sync_playwright, expect

from dotenv import load_dotenv
import os
import requests

load_dotenv()

username = os.getenv("CHROMOSOFT_USERNAME")
password = os.getenv("CHROMOSOFT_PASSWORD")

def runExport(page, rexp, filename):
    page.get_by_role("row", name="Geschlecht").get_by_role("button").click()
    page.locator("span").filter(has_text=rexp).click()
    page.locator(".ch_fld_cont_hldr > img").click()
    page.locator("input[name=\"chk_all_sel_reslts\"]").check()
    with page.expect_download() as download_info:
        page.get_by_role("img", name="speichere ausgewählte als").nth(1).click()
    download = download_info.value
    download.save_as(filename)

def run(playwright: Playwright) -> None:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(ignore_https_errors=True)
    page = context.new_page()
    page.goto("https://hzd.chromosoft.de/login")
    page.locator("input[name=\"username\"]").click()
    page.locator("input[name=\"username\"]").fill(username)
    page.locator("input[name=\"password\"]").click()
    page.locator("input[name=\"password\"]").fill(password)
    page.get_by_role("button", name="anmelden").click()
    
    page.get_by_role("listitem").filter(has_text="Suche").click()

    page.get_by_role("link", name="Powersuche").click()    
    runExport(page, re.compile(r"^Hündin$"), "./hzd-hunde-hundinnen.csv")

    page.get_by_role("link", name="Powersuche").click()
    runExport(page, re.compile(r"^Rüde$"), "./hzd-hunde-rueden.csv")
    
    page.get_by_role("link", name="abmelden").click()
    
    # ---------------------
    context.close()
    browser.close()


with sync_playwright() as playwright:
    run(playwright)
