import pandas as pd
import json

# Load the file
df = pd.read_csv('farmers_markets_shortened.tsv', sep='\t')

# --- Helper Functions ---
def parse_working_hours(wh_str):
    default = {k: "closed" for k in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]}
    if pd.isna(wh_str) or str(wh_str).strip() == '':
        return default
    try:
        data = json.loads(wh_str)
        if not data: return default
    except:
        return default

    # Map keys and standardize values
    key_map = {
        "monday": "Monday", "tuesday": "Tuesday", "wednesday": "Wednesday",
        "thursday": "Thursday", "friday": "Friday", "saturday": "Saturday", "sunday": "Sunday"
    }
    schedule = default.copy()
    for k, v in data.items():
        if k.lower() in key_map:
            if isinstance(v, list):
                val = ", ".join(str(x) for x in v)
            elif v is None or str(v).strip() == "":
                val = "closed"
            else:
                val = str(v)
            schedule[key_map[k.lower()]] = val
    return schedule

def flatten_characteristics(char_str):
    if pd.isna(char_str) or str(char_str).strip() == '':
        return []
    try:
        data = json.loads(char_str)
        if not data: return []
    except:
        return []

    values = []
    def extract(obj):
        if isinstance(obj, dict):
            for v in obj.values(): extract(v)
        elif isinstance(obj, list):
            for v in obj: extract(v)
        elif isinstance(obj, str) and obj.strip():
            values.append(obj)
            
    extract(data)
    return sorted(list(set(values)))

def get_services(row):
    services = set()
    if pd.notna(row['Main type']):
        services.add(row['Main type'].strip())
    if pd.notna(row['All types']):
        services.update([t.strip() for t in str(row['All types']).split(',') if t.strip()])
    return sorted(list(services))

def get_website(row):
    # Priority: Website -> Social Media (in order)
    if pd.notna(row['Website']) and str(row['Website']).strip() != '':
        return str(row['Website']).strip()
    
    socials = ['Facebook link', 'Youtube link', 'Twitter link', 'Instagram link', 'Linkedin link']
    for col in socials:
        if pd.notna(row[col]) and str(row[col]).strip() != '':
            return str(row[col]).strip()
    return None

def clean_district(val):
    if pd.isna(val): return None
    val = str(val).strip()
    return val.replace("Distrito de ", "")

# --- Main Transformation ---
results = []
for idx, row in df.iterrows():
    item = {
        'Name': row['Name'],
        'Services': get_services(row),
        'Features': flatten_characteristics(row['Characteristics']),
        'Website': get_website(row),
        'Phone': str(row['Phone']) if pd.notna(row['Phone']) else None,
        'Full Address': row['Full address'],
        'City': row['Level 2 division'] if pd.notna(row['Level 2 division']) else None,
        'District': clean_district(row['Level 1 division']),
        'Longitude': row['Longitude'],
        'Latitude': row['Latitude'],
        'Email': row['Email'] if pd.notna(row['Email']) else None,
        'Schedule': parse_working_hours(row['Working hours'])
    }
    results.append(item)

# Output to file
with open('farmers_markets_cleaned.json', 'w', encoding='utf-8') as f:
    f.write(json.dumps(results, indent=4, ensure_ascii=False))

print("Transformation complete! File saved as farmers_markets_cleaned.json")