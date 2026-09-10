import json
import random
import re
import time
import os
from flask import Flask, jsonify
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
import requests

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

app = Flask(__name__)
CORS(app)  # Enables cross-origin requests for your React frontend

DB_FILE = "fragments.json"
TARGET_ARTIST_URL = "https://open.spotify.com/artist/5UQfPgBcqFOA5pZxduU04i/discography/all"

# ==========================================
# FILE / STORAGE HELPERS
# ==========================================
def load_fragments():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w") as f:
            json.dump([], f)
        return []
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_fragments(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)

def get_id_from_url(url):
    parts = url.strip("/").split("/")
    return parts[-1] if "discography" not in parts[-1] else parts[-2]

# ==========================================
# SCRAPER LOGIC
# ==========================================
class HandleSpotifyInternalAPIRequest:
    def __init__(self, url: str, headers: dict, post_data: dict):
        self.url = url
        self.headers = headers
        self.post_data = post_data

    def fetch_playlist_contents(self, offset=0, limit=50):
        self.post_data["variables"].update({"offset": offset, "limit": limit})
        self.post_data["operationName"] = "queryArtistDiscographyAll"
        response = requests.post(self.url, headers=self.headers, json=self.post_data)
        return response.json()

def get_id_from_url(url):
    """Extracts the Spotify ID (e.g. 5UQfPgBcqFOA5pZxduU04i) from artist or playlist URLs."""
    match = re.search(r'/(artist|playlist)/([a-zA-Z0-9]+)', url)
    if match:
        return match.group(2)
    return None

def open_playlist_in_browser(playlist_url):
    options = webdriver.ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-gpu")
    options.add_argument("--user-data-dir=/tmp/selenium-profile")
    options.set_capability("goog:loggingPrefs", {"performance": "ALL"})
        
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
    driver.execute_cdp_cmd("Network.enable", {})

    artist_id = get_id_from_url(playlist_url)

    try:
        print(f"Opening URL: {playlist_url}")
        driver.get(playlist_url)

        # Allow initial render and trigger scroll to guarantee GraphQL request fires
        time.sleep(3)
        driver.execute_script("window.scrollTo(0, 300);")
        time.sleep(3)

        logs = driver.get_log("performance")

        for entry in logs:
            message = json.loads(entry["message"])["message"]

            if message["method"] == "Network.requestWillBeSent":
                request = message["params"]["request"]
                api_url = request.get("url", "")
                post_data = request.get("postData", "")

                if (re.search(r"pathfinder/v\d+/query", api_url) 
                    and request.get("method") == "POST" 
                    and post_data 
                    and artist_id in post_data):

                    driver.quit()
                    return api_url, request.get("headers"), json.loads(post_data)


        raise Exception("Could not find the required request in the logs.")

    except Exception as e:
        print(f"An error occurred: {e}")
        driver.quit()
        return None, None, None
    
def extract_albums_from_graphql(data):
    """Extracts album/release details and 640px cover art from Spotify response."""
    results = []

    try:
        discography_items = (
            data.get("data", {})
            .get("artistUnion", {})
            .get("discography", {})
            .get("all", {})
            .get("items", [])
        )

        for item in discography_items:
            releases = item.get("releases", {}).get("items", [])
            for release in releases:
                release_id = release.get("id")
                name = release.get("name")
                
                # Extract date info
                date_info = release.get("date", {})
                release_date = date_info.get("isoString", "").split("T")[0] or str(date_info.get("year", ""))

                # Extract 640px cover art image URL
                sources = release.get("coverArt", {}).get("sources", [])
                image_url = None
                
                for source in sources:
                    if source.get("height") == 640 or source.get("width") == 640:
                        image_url = source.get("url")
                        break
                
                # Fallback to first image source if size 640 is missing
                if not image_url and sources:
                    image_url = sources[0].get("url")

                if release_id and name:
                    results.append({
                        "id": release_id,
                        "name": name,
                        "type": release.get("type", "SINGLE"),
                        "release_date": release_date,
                        "cover_art": image_url
                    })

    except (KeyError, TypeError) as e:
        print(f"[Extractor Error] Unable to parse structure: {e}")

    return results

def run_scraper_job():
    """Main task to scrape Spotify, compare with local JSON, and save new items."""
    print("[Scraper Task] Checking for new releases...")
    api_url, headers, post_data = open_playlist_in_browser(TARGET_ARTIST_URL)
    
    if not api_url:
        print("[Scraper Task] Failed to capture API credentials.")
        return

    handler = HandleSpotifyInternalAPIRequest(api_url, headers, post_data)
    raw_response = handler.fetch_playlist_contents()

    scraped_items = extract_albums_from_graphql(raw_response)
    current_fragments = load_fragments()
    updated = False

    for item in scraped_items:
        spotify_link = f"https://open.spotify.com/album/{item['id']}"
        
        # Avoid duplicate fragments
        exists = any(f.get("spotifyLink") == spotify_link for f in current_fragments)
        if not exists:
            frag_num = str(len(current_fragments) + 1).zfill(3)
            new_fragment = {
                "id": frag_num,
                "code": f"fragment_{frag_num}",
                "title": item["name"],
                "category": "songs",
                "recovered": item.get("release_date", "auto-scraped"),
                "integrity": random.randint(10, 100),
                "type": item.get("type", "SINGLE"),
                "coverArt": item.get("cover_art"),  # <-- Dynamic cover art URL
                "spotify": f"https://open.spotify.com/embed/album/{item['id']}?utm_source=generator&theme=0",
                "spotifyLink": spotify_link,
                "note": "Scraped from discography page.",
                "scrawl": "added dynamically via python scraper."
            }
            current_fragments.insert(0, new_fragment)
            updated = True
            print(f"[+] Added new fragment: {item['name']}")

    if updated:
        save_fragments(current_fragments)
        print("[Scraper Task] Local fragments.json updated.")
    else:
        print("[Scraper Task] No new releases found.")

# ==========================================
# FLASK API ENDPOINTS
# ==========================================
@app.route("/api/fragments", methods=["GET"])
def get_fragments():
    """Returns the stored fragments JSON to your React app."""
    return jsonify(load_fragments())

@app.route("/api/scrape", methods=["POST"])
def trigger_scrape():
    """Manual trigger to run the scraper on demand."""
    run_scraper_job()
    return jsonify({"status": "complete", "data": load_fragments()})

# ==========================================
# STARTUP & SCHEDULER
# ==========================================
if __name__ == "__main__":
    # Schedule background scraper (e.g. run every 6 hours)
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=run_scraper_job, trigger="interval", hours=6)
    scheduler.start()

    # Run initial scrape on server start
    run_scraper_job()

    # Run Flask server
    app.run(port=4000, debug=True, use_reloader=False)