import re
import tempfile
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
    with page.expect_download(timeout=200000) as download_info:
        page.get_by_role("img", name="speichere ausgewählte als").nth(1).click()
    download = download_info.value
    download.save_as(filename)

def mergeCsvFiles(sources, destination):
    parts = []
    for index, source in enumerate(sources):
        with open(source, "rb") as input_file:
            if index > 0:
                input_file.readline()
            parts.append(input_file.read())

    if parts and parts[0] and not parts[0].endswith((b"\n", b"\r")):
        parts[0] += b"\n"

    with open(destination, "wb") as output:
        output.write(b"".join(parts))

def run(playwright: Playwright) -> None:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(ignore_https_errors=True)
    page = context.new_page()
    page.set_default_timeout(100000)
    page.set_default_navigation_timeout(100000)
    page.goto("https://hzd.chromosoft.de/login")
    page.locator("input[name=\"username\"]").click()
    page.locator("input[name=\"username\"]").fill(username)
    page.locator("input[name=\"password\"]").click()
    page.locator("input[name=\"password\"]").fill(password)
    page.get_by_role("button", name="anmelden").click()

    page.get_by_role("listitem").filter(has_text="Suche").click()

    female_export = tempfile.NamedTemporaryFile(suffix=".csv", delete=False)
    male_export = tempfile.NamedTemporaryFile(suffix=".csv", delete=False)
    female_export.close()
    male_export.close()

    try:
        page.get_by_role("link", name="Powersuche").click()
        runExport(page, re.compile(r"^Hündin$"), female_export.name)

        page.get_by_role("link", name="Powersuche").click()
        runExport(page, re.compile(r"^Rüde$"), male_export.name)

        page.get_by_role("link", name="abmelden").click()
    finally:
        context.close()
        browser.close()

    try:
        mergeCsvFiles(
            [female_export.name, male_export.name],
            "./alle_hzd_hunde.csv",
        )
    finally:
        for path in (female_export.name, male_export.name):
            if os.path.exists(path):
                os.remove(path)


with sync_playwright() as playwright:
    run(playwright)
