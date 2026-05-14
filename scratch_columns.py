import requests
import json

URL = "https://errspjsarhkqexanostz.supabase.co/rest/v1/motores?select=*&limit=1"
HEADERS = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycnNwanNhcmhrcWV4YW5vc3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjEzNDgsImV4cCI6MjA5MDYzNzM0OH0.Cs-VzZVnYz614Ogg9DHy-3mEkCXRzq9uMxninyCFv9w",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVycnNwanNhcmhrcWV4YW5vc3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjEzNDgsImV4cCI6MjA5MDYzNzM0OH0.Cs-VzZVnYz614Ogg9DHy-3mEkCXRzq9uMxninyCFv9w"
}

response = requests.get(URL, headers=HEADERS)
if response.status_code == 200:
    data = response.json()
    if data:
        print(list(data[0].keys()))
    else:
        print("Empty table")
else:
    print(response.text)
