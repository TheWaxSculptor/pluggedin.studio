import urllib.request
import json
import time

SUPABASE_URL = "https://dovsqgkxxdpdkagzpykn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdnNxZ2t4eGRwZGthZ3pweWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMjI1NjEsImV4cCI6MjA5MTU5ODU2MX0.SBQQ5IwYy16tmxmGAkS6co8rNl5kPsPjAlOXLHSnQw8"

PHOTOS = [
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1559732782-9907f1ae9f13?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1621619856624-42fd07baf04d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1520529611470-366379c20790?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1589903308904-1010c2294adc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1557119220-671d1339ce61?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1514320298324-ee2645980004?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1519076900044-85503929d0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
]

def update_studios():
    # Fetch all studios
    url = f"{SUPABASE_URL}/rest/v1/studios?select=id"
    req = urllib.request.Request(url)
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    
    try:
        with urllib.request.urlopen(req) as response:
            studios = json.loads(response.read().decode())
            print(f"Found {len(studios)} studios.")
            
            for i, studio in enumerate(studios):
                photo_url = PHOTOS[i % len(PHOTOS)]
                studio_id = studio['id']
                
                update_url = f"{SUPABASE_URL}/rest/v1/studios?id=eq.{studio_id}"
                data = json.dumps({"image_url": photo_url}).encode()
                
                update_req = urllib.request.Request(update_url, data=data, method="PATCH")
                update_req.add_header("apikey", SUPABASE_KEY)
                update_req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
                update_req.add_header("Content-Type", "application/json")
                update_req.add_header("Prefer", "return=minimal")
                
                with urllib.request.urlopen(update_req) as update_resp:
                    print(f"Updated studio {studio_id} with photo {i+1}")
                    
                time.sleep(0.5) # Avoid rate limiting
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_studios()
