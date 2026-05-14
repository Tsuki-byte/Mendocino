import json

try:
    with open('temp_proyectos.json', 'r') as f:
        data = json.load(f)
    if isinstance(data, list):
        for item in data:
            if "6 caras" in item.get('nombre', ''):
                print(json.dumps(item, indent=2))
    else:
        print("Data is not a list")
        print(data)
except Exception as e:
    print(f"Error: {e}")
