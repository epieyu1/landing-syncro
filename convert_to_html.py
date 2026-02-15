
import csv

def generate_html(input_csv, output_html):
    with open(input_csv, 'r') as f:
        reader = csv.reader(f)
        headers = next(reader)
        rows = list(reader)

    # Map headers to requested uppercase labels
    header_map = {
        'Nombre': 'NOMBRE',
        'Teléfono': 'TELEFONO',
        'Dirección': 'DIRECCION',
        'Website': 'WEBSITE',
        'Rating': 'RATING',
        'Reseñas': 'RESEÑAS',
        'Google Maps Link': 'LINK GOOGLE MAPS'
    }
    
    new_headers = [header_map.get(h, h.upper()) for h in headers]

    html_content = """
<!DOCTYPE html>
<html>
<head>
<style>
table {
  font-family: arial, sans-serif;
  border-collapse: collapse;
  width: 100%;
}

td, th {
  border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;
}

tr:nth-child(even) {
  background-color: #dddddd;
}
</style>
</head>
<body>

<h2>Talleres de Motos Medellín</h2>

<table>
  <tr>
"""
    for h in new_headers:
        html_content += f"    <th>{h}</th>\n"
    html_content += "  </tr>\n"

    for row in rows:
        html_content += "  <tr>\\n"
        for cell in row:
            html_content += f"    <td>{cell}</td>\\n"
        html_content += "  </tr>\\n"

    html_content += """
</table>

</body>
</html>
"""

    with open(output_html, 'w') as f:
        f.write(html_content)

def generate_semicolon_csv(input_csv, output_csv):
    with open(input_csv, 'r') as f:
        reader = csv.reader(f)
        headers = next(reader)
        rows = list(reader)

    # Map headers
    header_map = {
        'Nombre': 'NOMBRE',
        'Teléfono': 'TELEFONO',
        'Dirección': 'DIRECCION',
        'Website': 'WEBSITE',
        'Rating': 'RATING',
        'Reseñas': 'RESEÑAS',
        'Google Maps Link': 'LINK GOOGLE MAPS'
    }
    new_headers = [header_map.get(h, h.upper()) for h in headers]

    with open(output_csv, 'w', newline='') as f:
        writer = csv.writer(f, delimiter=';')
        writer.writerow(new_headers)
        writer.writerows(rows)

if __name__ == "__main__":
    base_path = '/Users/alexanderrestrepoepieyu/.gemini/antigravity/brain/5b155780-b9e9-4ac3-803b-5a797428856e/'
    csv_path = base_path + 'talleres_medellin.csv'
    html_path = base_path + 'talleres_medellin.html'
    semicolon_csv_path = base_path + 'talleres_medellin_excel.csv'
    
    generate_html(csv_path, html_path)
    generate_semicolon_csv(csv_path, semicolon_csv_path)
