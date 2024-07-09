import json
from bs4 import BeautifulSoup

# Load the HTML content
file_path = './mobilesports.html'  # Update with your file path
with open(file_path, 'r', encoding='utf-8') as file:
    html_content = file.read()

# Parse the HTML content using BeautifulSoup
soup = BeautifulSoup(html_content, 'html.parser')

# Extract information for each article
articles = []

for element in soup.select('.mosp-article-box__wrapper'):
    category = element.select_one('.box-pre-title').text if element.select_one('.box-pre-title') else ''
    title_element = element.select_one('h2 > a')
    title = title_element.text if title_element else ''
    link = title_element['href'] if title_element else ''
    description = element.select_one('p.is-style-small').text if element.select_one('p.is-style-small') else ''
    image_element = element.select_one('.lbwp-focuspoint img')
    image_url = image_element['src'] if image_element else ''
    post_id = element.select_one('.mosp-btn')['data-postid'] if element.select_one('.mosp-btn') else ''

    articles.append({
        'id': post_id,
        'category': category,
        'title': title,
        'description': description,
        'image': image_url,
        'link': link
    })

# Convert the list of articles to JSON format
json_output = json.dumps(articles, indent=2, ensure_ascii=False)

# Save to a JSON file
output_file_path = './mobilesports_data_with_id.json'  # Update with your desired output path
with open(output_file_path, 'w', encoding='utf-8') as json_file:
    json_file.write(json_output)

print(f"Data has been extracted and saved to {output_file_path}")