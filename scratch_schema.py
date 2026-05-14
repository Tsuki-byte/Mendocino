import requests

URL = "https://errspjsarhkqexanostz.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycnNwanNhcmhrcWV4YW5vc3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjEzNDgsImV4cCI6MjA5MDYzNzM0OH0.Cs-VzZVnYz614Ogg9DHy-3mEkCXRzq9uMxninyCFv9w"

response = requests.get(URL)
if response.status_code == 200:
    data = response.json()
    motores = data.get("definitions", {}).get("motores", {}).get("properties", {})
    print(list(motores.keys()))
else:
    print(response.text)
