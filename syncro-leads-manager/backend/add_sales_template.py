from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app import models

# Asegurar que las tablas existan
models.Base.metadata.create_all(bind=engine)

def add_sales_template():
    db = SessionLocal()
    
    pitch_name = "Pitch de Ventas (Beneficios)"
    pitch_content = """🚀 *Syncro Motos*: El copiloto digital de tu taller.

¿Por qué más de 500 talleres en Colombia nos usan?
✅ *Adiós al papel:* Órdenes de trabajo digitales y profesionales.
✅ *Historial por Placa:* Sabe qué se le hizo a cada moto y cuándo.
✅ *Alertas Automáticas:* Tu taller le escribe al cliente cuando la moto está lista.
✅ *Facturación DIAN:* Cumple la ley sin dolores de cabeza.

🎁 *Oferta Exclusiva:*
Prueba todas las funciones **GRATIS por 15 días**.
Sin contratos, sin tarjetas de crédito.

¿Te activo tu cuenta de prueba ya mismo? 🔧"""

    # Verificar si ya existe
    existing = db.query(models.Template).filter(models.Template.name == pitch_name).first()
    if existing:
        print(f"🔄 Actualizando plantilla: {pitch_name}")
        existing.content = pitch_content
    else:
        template = models.Template(name=pitch_name, content=pitch_content)
        db.add(template)
        print(f"✅ Creada nueva plantilla: {pitch_name}")

    db.commit()
    db.close()

if __name__ == "__main__":
    add_sales_template()
