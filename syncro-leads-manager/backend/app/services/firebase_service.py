from datetime import datetime
from app.core import firebase_config

# Referencias a Colecciones
LEADS_COLLECTION = 'leads'
INTERACTIONS_COLLECTION = 'interactions'
BLACKLIST_COLLECTION = 'blacklist'
ANALYTICS_COLLECTION = 'analytics'

def get_db():
    return firebase_config.db

def save_lead_to_firebase(lead_data):
    """
    Guarda o actualiza un lead en Firestore.
    Usa el teléfono como ID para evitar duplicados garantizados.
    """
    db = get_db()
    if not db: return False, "Firebase no conectado"

    phone = lead_data.get('phone')
    if not phone or phone == 'No disponible':
        return False, "Sin teléfono válido"

    try:
        doc_ref = db.collection(LEADS_COLLECTION).document(phone)
        
        # Datos base
        payload = {
            'phone': phone,
            'name': lead_data.get('name'),
            'address': lead_data.get('address'),
            'google_id': lead_data.get('google_id'),
            'rating': lead_data.get('rating'),
            'maps_link': lead_data.get('maps_link'),
            'city': lead_data.get('city', 'Desconocida'),
            'category': lead_data.get('category', 'General'),
            'updated_at': firebase_config.firestore.SERVER_TIMESTAMP
        }
        
        # Si NO existe, creamos con datos iniciales
        if not doc_ref.get().exists:
            payload['created_at'] = firebase_config.firestore.SERVER_TIMESTAMP
            payload['status'] = 'Nuevo'
            payload['tags'] = ['importado_maps']
            payload['interaction_count'] = 0
            doc_ref.set(payload)
            return True, "Creado nuevo"
        else:
            # Si YA existe, solo actualizamos info básica, NO el estatus
            # Para no reiniciar un "Cliente" a "Nuevo"
            doc_ref.update(payload)
            return True, "Actualizado"

    except Exception as e:
        print(f"❌ Error Firebase save_lead: {e}")
        return False, str(e)

def check_lead_eligibility(phone):
    """
    Revisa si un número es apto para campaña.
    Verifica: Blacklist y Estado.
    """
    db = get_db()
    if not db: return True # Fallback local si falla nube
    
    try:
        # 1. Chequeo Blacklist
        bl_doc = db.collection(BLACKLIST_COLLECTION).document(phone).get()
        if bl_doc.exists:
            return False, f"En Lista Negra: {bl_doc.get('reason')}"
            
        # 2. Chequeo Lead Status
        lead_doc = db.collection(LEADS_COLLECTION).document(phone).get()
        if lead_doc.exists:
            data = lead_doc.to_dict()
            if data.get('status') in ['Cliente', 'No Interesa', 'Invalido']:
                return False, f"Estado no contactable: {data.get('status')}"
            
            # Chequeo de frecuencia (ej: no enviar si ya se envió hoy)
            last = data.get('last_interaction')
            # Aquí se podría agregar lógica de fechas
            
        return True, "Apto"

    except Exception as e:
        print(f"⚠️ Error verificando elegibilidad: {e}")
        return True, "Error chequeo (Permitido por defecto)"

def log_interaction(phone, campaign_data, success, error_msg=None):
    """
    Registra el intento de envío en el historial (Interactions)
    y actualiza el Lead principal.
    """
    db = get_db()
    if not db: return

    try:
        # 1. Guardar Log en 'interactions'
        interaction_payload = {
            'phone': phone,
            'campaign_name': campaign_data.get('campaign_name', 'General'),
            'template_id': campaign_data.get('template_id'),
            'sent_at': firebase_config.firestore.SERVER_TIMESTAMP,
            'status': 'Enviado' if success else 'Fallido',
            'error': error_msg
        }
        db.collection(INTERACTIONS_COLLECTION).add(interaction_payload)

        # 2. Actualizar Lead Principal
        lead_ref = db.collection(LEADS_COLLECTION).document(phone)
        update_payload = {
            'last_interaction': firebase_config.firestore.SERVER_TIMESTAMP,
            'interaction_count': firebase_config.firestore.Increment(1)
        }
        
        if success:
            update_payload['status'] = 'Contactado'
        elif error_msg and 'invalid' in error_msg.lower():
            update_payload['status'] = 'Invalido'
            # Mover a blacklist automáticamente podría ser opción
            
        lead_ref.update(update_payload)
        
        # 3. Analytics (Contadores rápidos)
        # Usamos la fecha de hoy como ID del documento de analytics
        date_str = datetime.now().strftime("%Y-%m-%d")
        stats_ref = db.collection(ANALYTICS_COLLECTION).document(date_str)
        
        stats_ref.set({
            'total_attempts': firebase_config.firestore.Increment(1),
            'success_count': firebase_config.firestore.Increment(1 if success else 0),
            'fail_count': firebase_config.firestore.Increment(0 if success else 1)
        }, merge=True)

    except Exception as e:
        print(f"❌ Error loggeando interacción: {e}")

def log_scan_zone(lat, lng, radius, found_count):
    """
    Registra una zona escaneada para no repetir.
    """
    db = get_db()
    if not db: return

    try:
        db.collection('scan_zones').add({
            'lat': lat,
            'lng': lng,
            'radius': radius,
            'found_count': found_count,
            'scanned_at': firebase_config.firestore.SERVER_TIMESTAMP
        })
    except Exception as e:
        print(f"⚠️ Error guardando zona escaneada: {e}")

def get_scan_zones():
    """
    Recupera todas las zonas escaneadas.
    """
    db = get_db()
    if not db: return []

    try:
        zones = []
        docs = db.collection('scan_zones').order_by('scanned_at', direction='DESCENDING').limit(100).stream()
        for doc in docs:
            data = doc.to_dict()
            # Convertir timestamp a string ISO si es necesario, o devolver tal cual
            zones.append(data)
        return zones
    except Exception as e:
        print(f"⚠️ Error obteniendo zonas: {e}")
        return []
