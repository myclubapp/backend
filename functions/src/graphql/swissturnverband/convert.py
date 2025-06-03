import json
from bs4 import BeautifulSoup # type: ignore
import base64

# Load the HTML content
file_path = './20250603_stv-vereine.html'
with open(file_path, 'r', encoding='utf-8') as file:
    html_content = file.read()

# Parse the HTML content using BeautifulSoup
soup = BeautifulSoup(html_content, 'html.parser')

# Extract information for each club
clubs = []

for element in soup.select('.tx-stv-clubfinder-result'):
    club_info = element.select_one('.tx-stv-clubfinder-club-info')
    club_contact = element.select_one('.tx-stv-clubfinder-club-contact')
    club_accordion = element.select('.tx-stv-clubfinder-club-accordion .accordion-item')

    # Extract basic club information
    club_id = club_accordion[0].select_one('.tx-stv-clubfinder-training')['data-clubuid'] if club_accordion and club_accordion[0].select_one('.tx-stv-clubfinder-training') else ''
    club_name = club_info.select_one('p b').text if club_info.select_one('p b') else ''
    club_website = club_info.select_one('a')['href'] if club_info.select_one('a') else ''
    contact_name = club_contact.select_one('div').text if club_contact.select_one('div') else ''
    contact_phone = club_contact.select_one('div[x-ms-format-detection="none"]').text if club_contact.select_one('div[x-ms-format-detection="none"]') else ''
    contact_email_element = club_contact.select_one('a[href^="javascript:linkTo_UnCryptMailto"]')

    # Extract email address by removing the span element
    contact_email = ''
    if contact_email_element:
        for span in contact_email_element.find_all('span', class_='d-none'):
            span.decompose()
        contact_email = contact_email_element.get_text()

    # Extract team information
    teams = []
    for accordion in club_accordion:
        team_id = accordion.select_one('.tx-stv-clubfinder-training')['data-clubuid'] if accordion.select_one('.tx-stv-clubfinder-training') else ''
        team_name = accordion.select_one('.accordion-title').text.strip() if accordion.select_one('.accordion-title') else ''
        team_info = accordion.select_one('.accordion-body-inner').text.strip() if accordion.select_one('.accordion-body-inner') else ''
        team_jahresbeitrag = ''
        team_jahresbeitrag_wert = None
        team_jahresbeitrag_waehrung = ''
        if 'Jahresbeitrag:' in team_info:
            jahresbeitrag_parts = team_info.split('Jahresbeitrag:')[1].strip().split('\n')
            for part in jahresbeitrag_parts:
                if 'CHF' in part:
                    team_jahresbeitrag = part.strip()
                    # Extrahiere den Wert und die Währung
                    parts = part.strip().split()
                    if len(parts) >= 2:
                        team_jahresbeitrag_waehrung = parts[0]
                        try:
                            team_jahresbeitrag_wert = float(parts[1])
                        except ValueError:
                            team_jahresbeitrag_wert = None
                    break

        teams.append({
            'id': team_id,
            'name': team_name,
            'info': team_info,
            'jahresbeitrag': team_jahresbeitrag,
            'jahresbeitragWert': team_jahresbeitrag_wert,
            'jahresbeitragWaehrung': team_jahresbeitrag_waehrung
        })

    latitude = accordion.select_one('.tx-stv-clubfinder-training')['data-latitude'] if accordion.select_one('.tx-stv-clubfinder-training') else ''
    longitude = accordion.select_one('.tx-stv-clubfinder-training')['data-longitude'] if accordion.select_one('.tx-stv-clubfinder-training') else ''

    clubs.append({
        'id': club_id,
        'name': club_name,
        'contactName': contact_name,
        'contactPhone': contact_phone,
        'contactEmail': contact_email,
        'website': club_website,
        'latitude': latitude,
        'longitude': longitude,
        'Teams': teams
    })

# Convert the list of clubs to JSON format
json_output = json.dumps(clubs, indent=2, ensure_ascii=False)

# Save to a JSON file
output_file_path = './clubs_data_final.json'
with open(output_file_path, 'w', encoding='utf-8') as json_file:
    json_file.write(json_output)

output_file_path