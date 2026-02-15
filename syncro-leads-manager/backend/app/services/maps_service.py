import requests
import time

# CONFIGURACIÓN
# Idealmente esto va en variables de entorno
API_KEY = "AIzaSyDrMg06N_fBhvDWxag84TP64_7YA0MuTlk"
FIELD_MASK = "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.id,places.addressComponents"

def search_places_service(lat, lng, radius=5000, query="Taller de motos", page_token=None):
    url = "https://places.googleapis.com/v1/places:searchText"
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': FIELD_MASK + ",nextPageToken"
    }
    
    payload = {
        'textQuery': query,
        'languageCode': 'es',
        'maxResultCount': 20, # Google Places v1 devuelve max 20 por página
        'locationBias': {
            'circle': {
                'center': {
                    'latitude': lat,
                    'longitude': lng
                },
                'radius': radius
            }
        }
    }

    if page_token:
        payload['pageToken'] = page_token

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        places = data.get('places', [])
        next_token = data.get('nextPageToken') # Token para la siguiente página
        
        # Formatear respuesta limpia
        formatted_results = []
        
        # FILTROS DE PALABRAS CLAVE (Hardcoded por seguridad)
        NEGATIVE_KEYWORDS = ['carniceria', 'panaderia', 'estetica', 'peluqueria', 'restaurante', 'comida', 'fruver', 'drogueria', 'farmacia', 'ropa', 'zapatos', 'veterinaria', 'iglesia']
        POSITIVE_KEYWORDS = ['moto', 'taller', 'repuestos', 'mecanic', 'yamaha', 'honda', 'suzuki', 'bajaj', 'akt', 'auteco', 'tvs', 'hero', 'kawasaki', 'ktm', 'ducati', 'bmw', 'triumph', 'royal enfield', 'benelli', 'sym', 'kymco', 'piaggio', 'vespa', 'aprilia', 'motul', 'mobil', 'castrol', 'liqui moly', 'ipone', 'repsol', 'shell', 'terpel', 'frenos', 'llantas', 'aceite', 'bujias', 'baterias', 'cascos', 'lujos', 'accesorios', 'servicio tecnico', 'centro de servicio', 'concesionario', 'compraventa']

        for place in places:
            name = place.get('displayName', {}).get('text', '').lower()
            types = [t.lower() for t in place.get('types', [])] # Google Places Types
            
            # 1. Filtro Negativo (BLOQUEO DURO)
            if any(bad in name for bad in NEGATIVE_KEYWORDS):
                print(f"🚫 Omitiendo {name}: Contiene palabra bloqueada.")
                continue

            # 2. Filtro Positivo (NECESARIO si la API trae basura)
            # Solo si el nombre NO tiene nada de motos, verificamos tipos
            if not any(good in name for good in POSITIVE_KEYWORDS):
                # Si tampoco tiene tipos relevantes, adiós
                if not any('motor' in t or 'repair' in t or 'vehicle' in t for t in types):
                    print(f"⚠️ Omitiendo {name}: No parece relevante (Nombre/Tipos).")
                    continue

            # Extraer Ciudad
            city = "Desconocida"
            for comp in place.get('addressComponents', []):
                if 'locality' in comp.get('types', []):
                    city = comp.get('longText')
                    break
            
            formatted_results.append({
                'id': place.get('id'),
                'name': place.get('displayName', {}).get('text'),
                'phone': place.get('nationalPhoneNumber', 'No disponible'),
                'address': place.get('formattedAddress'),
                'city': city,
                'website': place.get('websiteUri'),
                'rating': place.get('rating'),
                'reviews': place.get('userRatingCount'),
                'maps_link': place.get('googleMapsUri')
            })
            
        return formatted_results, next_token
            
    except Exception as e:
        print(f"Error en servicio de mapas: {e}")
        return [], None
