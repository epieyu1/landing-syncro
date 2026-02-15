import requests
import json
import time
import pandas as pd
import os

# CONFIGURACIÓN
API_KEY = "AIzaSyDrMg06N_fBhvDWxag84TP64_7YA0MuTlk"

# Parámetros de búsqueda
QUERY = "Taller de motos en Medellín"
# Field mask para especificar qué campos queremos (ahorra costos y es requerido en v1)
FIELD_MASK = "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.id"

def search_places_new(query, api_key, page_token=None):
    url = "https://places.googleapis.com/v1/places:searchText"
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': api_key,
        'X-Goog-FieldMask': FIELD_MASK + ",nextPageToken"
    }
    
    payload = {
        'textQuery': query,
        'languageCode': 'es',
        'maxResultCount': 20, # Máximo permitido por página en v1
        # Opcional: Bias de ubicación (círculo)
        'locationBias': {
            'circle': {
                'center': {
                    'latitude': 6.2476,
                    'longitude': -75.5658
                },
                'radius': 5000.0
            }
        }
    }
    
    if page_token:
        payload['pageToken'] = page_token

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error en búsqueda: {e}")
        try:
            print(f"Detalle error: {response.text}")
        except:
            pass
        return {}

def main():
    print(f"🔍 Buscando '{QUERY}' con Places API (New)...")
    
    all_leads = []
    page_token = None
    total_pages = 0
    max_pages = 3 # Limitar seguridad inicial
    
    while total_pages < max_pages:
        data = search_places_new(QUERY, API_KEY, page_token)
        places = data.get('places', [])
        
        if not places:
            print("No se encontraron más lugares.")
            break
            
        for place in places:
            lead = {
                'Nombre': place.get('displayName', {}).get('text'),
                'Teléfono': place.get('nationalPhoneNumber', 'No disponible'),
                'Dirección': place.get('formattedAddress'),
                'Website': place.get('websiteUri', 'No disponible'),
                'Rating': place.get('rating', 'N/A'),
                'Reseñas': place.get('userRatingCount', 0),
                'Google Maps Link': place.get('googleMapsUri')
            }
            all_leads.append(lead)
            print(f"✅ Encontrado: {lead['Nombre']} ({lead['Teléfono']})")
        
        page_token = data.get('nextPageToken')
        total_pages += 1
        
        if not page_token:
            break
            
        print("⏳ Esperando siguiente página...")
        time.sleep(2)

    if all_leads:
        filename = 'prospectos_talleres_medellin_v2.csv'
        df = pd.DataFrame(all_leads)
        df.to_csv(filename, index=False, encoding='utf-8-sig')
        print(f"\n🎉 ¡Terminado! Se encontraron {len(all_leads)} talleres.")
        print(f"📁 Archivo guardado como: {os.path.abspath(filename)}")
    else:
        print("\n⚠️ No se encontraron resultados.")

if __name__ == "__main__":
    main()
