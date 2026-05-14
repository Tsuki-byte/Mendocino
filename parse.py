import re

with open('Manual_Mendocino.html', 'r', encoding='utf-8') as f:
    content = f.read()

# We want to match:
# <h3> (Title) </h3>
# (Content)
# Up until the next <h3>, <h2>, or <hr>

pattern = re.compile(r'(<h3>(.*?)</h3>)(.*?)(?=(<h3>|<h2>|<hr>))', re.DOTALL)

def replace_func(match):
    title = match.group(2)
    inner_content = match.group(3)
    
    return f"""<details style="margin-bottom: 20px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; overflow: hidden;">
    <summary style="font-size: 18px; font-weight: bold; cursor: pointer; color: #16a085; padding: 15px; background: #e2e8f0; border-bottom: 1px solid #cbd5e1; list-style: none; display: flex; justify-content: space-between; align-items: center;">
        <span>{title}</span>
        <span style="font-size: 14px; color: #64748b;">(Clic para expandir) 🔽</span>
    </summary>
    <div style="padding: 20px;">
        {inner_content}
    </div>
</details>
"""

new_content = pattern.sub(replace_func, content)

with open('Manual_Mendocino.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done")
