import urllib.request
import json

url = "https://errspjsarhkqexanostz.supabase.co/rest/v1/motores?select=nombre,estado"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycnNwanNhcmhrcWV4YW5vc3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjEzNDgsImV4cCI6MjA5MDYzNzM0OH0.Cs-VzZVnYz614Ogg9DHy-3mEkCXRzq9uMxninyCFv9w"

req = urllib.request.Request(url, headers={"apikey": key, "Authorization": f"Bearer {key}"})

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        for row in data:
            if "6 caras" in row.get('nombre', ''):
                print("FOUND:", row['nombre'])
                print("STATE:", json.dumps(row['estado'], indent=2))
except Exception as e:
    print(e)
