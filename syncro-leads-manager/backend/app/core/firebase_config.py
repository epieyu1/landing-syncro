import firebase_admin
from firebase_admin import credentials, firestore
import os

# Ruta al archivo de credenciales
# Asumimos que está en la raíz de 'backend/' junto a este módulo o un nivel arriba
# Ajustamos path relativo: ../../serviceAccountKey.json si estamos en app/core
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CRED_PATH = os.path.join(BASE_DIR, "serviceAccountKey.json")

def init_firebase():
    """Inicializa la app de Firebase si no está ya inicializada."""
    if not firebase_admin._apps:
        try:
            cred = credentials.Certificate(CRED_PATH)
            firebase_admin.initialize_app(cred)
            print("🔥 Firebase validado y conectado exitosamente.")
        except Exception as e:
            print(f"❌ Error conectando a Firebase: {e}")
            return None
            
    return firestore.client()

# Instancia global de la base de datos Firestore
db = init_firebase()
