import requests
import json

url = "https://uivxoxunwkgzstkybgnz.supabase.co"
key = "" # This will be passed from the env

headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}"
}

# 1. Total equipment count
r = requests.get(f"{url}/rest/v1/equipment?select=count", headers=headers, params={"count": "exact"})
print(f"Total Equipment: {r.headers.get('Content-Range')}")

# 2. Studios with equipment
r = requests.get(f"{url}/rest/v1/equipment?select=studio_id", headers=headers)
data = r.json()
studios = {}
for d in data:
    s_id = d.get('studio_id', 'none')
    studios[s_id] = studios.get(s_id, 0) + 1

print("\nStudio Equipment Distribution:")
for s_id, count in studios.items():
    print(f"Studio {s_id}: {count} items")
