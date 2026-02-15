import pandas as pd
import json
import re

# Nombre del archivo de entrada (generado anteriormente)
INPUT_CSV = 'prospectos_talleres_medellin_v2.csv'
OUTPUT_JSON = 'leads_ready.json'

def clean_phone(phone):
    """Limpia el número de teléfono y lo formatea para WhatsApp."""
    if not isinstance(phone, str):
        return None
    
    # Eliminar caracteres no numéricos excepto el +
    clean = re.sub(r'[^\d+]', '', phone)
    
    # Si es fijo (ej: 604...), lo descartamos para WhatsApp (devolver None)
    if clean.startswith('604') or clean.startswith('57604') or len(clean) < 10:
        return None
        
    # Si empieza con 3 (celular Colombia), agregar +57
    if clean.startswith('3'):
        return f"+57{clean}"
    
    # Si ya tiene +57, dejarlo así
    if clean.startswith('+57'):
        return clean
        
    return clean

def extract_barrio(address):
    """Intenta extraer el barrio/zona de la dirección."""
    if not isinstance(address, str):
        return "Medellín"
    
    # Normalmente la dirección en Google Maps es "Calle XX #YY-ZZ, Barrio, Medellín"
    parts = address.split(',')
    
    # Si tiene 3 o más partes, el penúltimo suele ser el barrio/comuna
    if len(parts) >= 3:
        potential_barrio = parts[-2].strip()
        # Filtrar si es "Medellín" o "Antioquia"
        if potential_barrio.lower() not in ['medellín', 'medellin', 'antioquia', 'colombia']:
            return potential_barrio
            
    return "Medellín"

def main():
    try:
        df = pd.read_csv(INPUT_CSV)
        print(f"📂 Archivo cargado: {len(df)} registros totales.")
    except FileNotFoundError:
        print(f"❌ Error: No se encuentra el archivo {INPUT_CSV}")
        return

    leads_ready = []
    
    for index, row in df.iterrows():
        name = row['Nombre']
        phone_raw = row['Teléfono']
        address = row['Dirección']
        
        phone_clean = clean_phone(phone_raw)
        
        if phone_clean:
            barrio = extract_barrio(address)
            
            lead = {
                "nombre": name,
                "telefono": phone_clean,
                "barrio": barrio,
                "maps_link": row.get('Google Maps Link', '')
            }
            leads_ready.append(lead)
    
    # Guardar JSON
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(leads_ready, f, ensure_ascii=False, indent=4)
        
    print(f"✨ ¡Procesamiento completado!")
    print(f"✅ Se generaron {len(leads_ready)} contactos listos para WhatsApp (se descartaron fijos/inválidos).")
    print(f"💾 Guardado en: {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
