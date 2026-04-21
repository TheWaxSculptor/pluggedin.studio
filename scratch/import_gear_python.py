import csv
import json
import urllib.request
import urllib.parse
import time

# Constants
SUPABASE_URL = 'https://dovsqgkxxdpdkagzpykn.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdnNxZ2t4eGRwZGthZ3pweWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMjI1NjEsImV4cCI6MjA5MTU5ODU2MX0.SBQQ5IwYy16tmxmGAkS6co8rNl5kPsPjAlOXLHSnQw8'
GEAR_HUB_STUDIO_ID = '446e21fc-b61d-4fbc-8912-37bc3a612232'
CSV_PATH = '/Users/stirringstew/Documents/Electatech/PluggedIn.studio/Gearogs.warc/gearogs_list.csv'

def import_gear():
    print("🚀 Starting gear ingestion via Python (urllib)...")
    
    try:
        with open(CSV_PATH, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            equipment_list = []
            
            for row in reader:
                # Map CSV columns (Make, Model, URL) to schema (brand, name, description)
                item = {
                    "brand": row.get('Make', 'Unknown').strip(),
                    "name": row.get('Model', 'Unknown').strip(),
                    "description": f"Sourced from Gearogs: {row.get('URL', '').strip()}",
                    "studio_id": GEAR_HUB_STUDIO_ID,
                    "category": "Marketplace Gear",
                    "room": "Showroom"
                }
                equipment_list.append(item)
            
            total = len(equipment_list)
            print(f"📊 Parsed {total} records.")
            
            # Chunking for bulk insert
            chunk_size = 100
            for i in range(0, total, chunk_size):
                chunk = equipment_list[i:i + chunk_size]
                
                url = f"{SUPABASE_URL}/rest/v1/equipment"
                headers = {
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                }
                
                data = json.dumps(chunk).encode('utf-8')
                req = urllib.request.Request(url, data=data, headers=headers, method='POST')
                
                try:
                    with urllib.request.urlopen(req) as response:
                        if response.status in [200, 201, 204]:
                            print(f"📦 Inserted chunk {i//chunk_size + 1}/{total//chunk_size + 1}")
                        else:
                            print(f"❌ Error inserting chunk: {response.status}")
                except Exception as e:
                    print(f"❌ HTTP Error: {e}")
                
                time.sleep(0.1) # Be gentle on the rate limiting
                
            print("🎉 Ingestion complete!")
            
    except Exception as e:
        print(f"❌ Critical error: {e}")

if __name__ == "__main__":
    import_gear()
