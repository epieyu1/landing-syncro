from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app import models

# Asegurar que las tablas existan
models.Base.metadata.create_all(bind=engine)

def seed_templates():
    db = SessionLocal()
    
    # Plantillas de Alto Impacto
    templates = [
        {
            "name": "Menú Principal (Opciones)",
            "content": """Hola *{nombre_taller}*, moderniza tu taller con **Syncro Motos**. 🚀

Te ofrecemos:
✅ **Facturación Electrónica** fácil y legal.
✨ **IA Integrada** para tus clientes.
🤝 **Configuración Asistida GRATIS**.

¿Cómo quieres continuar? Responde con un número:

1️⃣ **Activar Prueba Gratis** (15 días regalo).
2️⃣ **Ver Web y Detalles** 👉 https://landing.syncro.skin/
3️⃣ **Hablar con Asesor Experto**.

Quedo atento a tu respuesta. 👇"""
        },
        {
            "name": "Propuesta Directa (Credenciales)",
            "content": """👋 Hola *{nombre_taller}*.

¿Te interesa probar un sistema que organiza tu taller y fideliza clientes automáticamente?

Tengo 3 pases de prueba gratuitos (15 días) disponibles hoy. ¿Te gustaría que te active uno con tus credenciales?

Avísame y te las envío por aquí. 🏍️"""
        },
        {
            "name": "Seguimiento Corto",
            "content": """Hola *{nombre_taller}*, ¿pudiste revisar mi mensaje anterior?

Solo quería saber si te interesa recibir las credenciales para la prueba gratis de Syncro Motos. Es sin compromiso y no pide tarjeta.

¿Qué dices? 👍"""
        }
    ]

    print("🌱 Sembrando/Actualizando plantillas...")
    for t_data in templates:
        # Verificar si ya existe
        existing = db.query(models.Template).filter(models.Template.name == t_data["name"]).first()
        if existing:
            print(f"🔄 Actualizando contenido de: {t_data['name']}")
            existing.content = t_data["content"]
        else:
            template = models.Template(name=t_data["name"], content=t_data["content"])
            db.add(template)
            print(f"✅ Creada nueva: {t_data['name']}")

    db.commit()
    db.close()
    print("✨ ¡Plantillas actualizadas correctamente!")

if __name__ == "__main__":
    seed_templates()
