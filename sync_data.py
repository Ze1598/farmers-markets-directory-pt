import json
import os

def sync_data():
    """
    Reads data.json and updates data.js with the content.
    This allows editing the JSON file (easier) and automatically updating the JS file used by the app.
    """
    json_path = 'data.json'
    js_path = 'data.js'

    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Extract the list of farmers markets
        farmers_markets = data.get('farmers_markets', [])

        # Create the JS content
        js_content = f"let farmersMarkets = {json.dumps(farmers_markets, indent=4, ensure_ascii=False)};"

        with open(js_path, 'w', encoding='utf-8') as f:
            f.write(js_content)

        print(f"Successfully synced {json_path} to {js_path}")
        print(f"Total farmers markets: {len(farmers_markets)}")

    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    sync_data()
