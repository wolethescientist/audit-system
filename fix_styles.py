with open('generate_user_manual.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("styles['BodyText']", "styles['CustomBody']")

with open('generate_user_manual.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed style references')
