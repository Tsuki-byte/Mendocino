import markdown
import os

with open("artifacts/manual_usuario_mendocino.md", "r", encoding="utf-8") as f:
    text = f.read()

try:
    html = markdown.markdown(text, extensions=['tables'])
except ImportError:
    # Si no hay markdown, instalémoslo o hagamos algo simple
    os.system("pip3 install markdown")
    import markdown
    html = markdown.markdown(text, extensions=['tables'])

full_html = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    body {{ font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; color: #333; }}
    h1 {{ color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }}
    h2 {{ color: #2980b9; margin-top: 30px; }}
    h3 {{ color: #16a085; }}
    p {{ margin-bottom: 15px; }}
    blockquote {{ border-left: 4px solid #f39c12; padding-left: 15px; color: #7f8c8d; background-color: #fdfbf7; padding: 10px; }}
    code {{ background-color: #f8f9fa; padding: 2px 4px; border-radius: 4px; font-family: monospace; }}
</style>
</head>
<body>
{html}
</body>
</html>
"""

with open("Manual_Mendocino.html", "w", encoding="utf-8") as f:
    f.write(full_html)
