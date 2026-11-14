from requests.exceptions import RequestException
from dataclasses import dataclass, asdict
from bs4 import BeautifulSoup
from typing import List, Optional
from pathlib import Path
import requests
import json

@dataclass
class BursaStock:
    code: str
    ticker: str
    name: str
    short_name: str
    sector: str
    market: str
    aliases: List[str] 

def fetch_raw_html(timeout_sec: int = 10)->str:
    klse_url=  "https://www.klsescreener.com/v2/screener/quote_results"
    headers = {    
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"    
    }
    try:
        response = requests.get(
            url = klse_url,
            headers=headers,
            timeout=timeout_sec
        )    
        response.raise_for_status()
        response.encoding = response.apparent_encoding or "utf-8"
        return response.text
    except RequestException as err:
        # TODO: Fallback to previous db and log error
        return None
   



def parse_html_to_stocks(html: str)-> List[BursaStock]:
    stocks : List[BursaStock] = []
    soup = BeautifulSoup(html,"html.parser")
    rows = soup.find_all("tr", class_ = "list")
    for i in range(len(rows)):
        name = rows[i].find("td").get("title").strip()
        short_name = rows[i].find("td").find('a').text.strip()
        code = rows[i].find_all("td")[1].text.strip()
        if not (code.isdigit() and len(code) == 4):
            continue
        cat_text = rows[i].find_all("td")[2].text.strip()
        cat_parts = cat_text.split(",")
        sector = cat_parts[0].strip()
        market = cat_parts[1].strip() if len(cat_parts) > 1 else "Main Market"
        
        stock_item = BursaStock(
            code = code,
            name = name,
            market = market,
            sector = sector,
            short_name = short_name,
            aliases = [],
            ticker = code + ".KL"
        )
        stocks.append(
            stock_item
        )  
    return stocks


def save_to_json(stock_list: list) -> None:
    stock_dict = [asdict(stock) for stock in stock_list]
    target_paths = [
        Path(__file__).resolve().parent / "bursa_stock_list.json",
        Path(__file__).resolve().parent.parent / "bursa_stock_list.json"
    ]
    for target in target_paths:
        try:
            with open(target, "w", encoding="utf-8") as f:
                json.dump(stock_dict, f, indent=4)
            print(f"[Sync] Saved {len(stock_dict)} Bursa stocks to {target}")
        except Exception as e:
            print(f"[Sync Warning] Could not save to {target}: {e}")


if __name__ == "__main__":
    html = fetch_raw_html()
    if html:
        stock_list = parse_html_to_stocks(html)
        save_to_json(stock_list)
    else:
        print("[Sync Error] Could not retrieve HTML from KLSE Screener.")   



        

