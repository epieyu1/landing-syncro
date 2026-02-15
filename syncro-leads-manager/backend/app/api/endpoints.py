from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.services.maps_service import search_places_service
from app.services import firebase_service
from app.core.database import get_db
from app import models

router = APIRouter()

class SearchRequest(BaseModel):
    lat: float
    lng: float
    radius: int = 5000
    query: str = "Taller de motos"
    page_token: str = None # Token para paginación

@router.post("/search")
def search_leads(request: SearchRequest, db: Session = Depends(get_db)):
    # Estrategia Multi-Keyword: Si la búsqueda es la por defecto, usamos varias palabras clave
    # para romper el límite de 60 resultados de Google.
    
    keywords = [request.query] # Por defecto, solo la que envió el usuario
    
    # Si la query es genérica, activamos el modo "Aspiradora"
    if "taller" in request.query.lower() or "moto" in request.query.lower():
        keywords = [
            "Taller de motos",
            "Mecánico de motos",
            "Repuestos para motos", 
            "Almacén de motos",
            "Centro de servicio de motos"
        ]
        print(f"🌪️ Modo Multi-Keyword Activado: Buscando {len(keywords)} términos...")

    all_results = []
    seen_ids = set()
    next_token = None # Solo devolveremos token de la primera (simplificación) o nulo

    for kw in keywords:
        print(f"🔎 Buscando: '{kw}'...")
        results, token = search_places_service(
            lat=request.lat,
            lng=request.lng,
            radius=request.radius,
            query=kw,
            page_token=request.page_token if kw == keywords[0] else None 
            # Solo paginamos la primera para no romper lógica, las otras van pag. 1
        )
        
        if kw == keywords[0]:
            next_token = token
            
        for item in results:
            if item['id'] not in seen_ids:
                item['category'] = kw # Guardamos la categoría del término de búsqueda
                seen_ids.add(item['id'])
                all_results.append(item)
    
    # 2. Guardar automáticamente en BD (Upsert: si existe, ignorar o actualizar)
    saved_count = 0
    
    for item in all_results:
        # A. Sincronizar con Firebase (Nube Maestra)
        if item.get('phone') and item['phone'] != "No disponible":
            firebase_service.save_lead_to_firebase(item)
            
        # B. Verificar si ya existe por google_id
        exists_id = db.query(models.Lead).filter(models.Lead.google_id == item['id']).first()
        
        # B. Verificar por Teléfono (si tiene)
        exists_phone = None
        if item['phone'] and item['phone'] != "No disponible":
            exists_phone = db.query(models.Lead).filter(models.Lead.phone == item['phone']).first()
            
        # C. Verificar por Nombre exacto (opcional, pero pedido por usuario)
        exists_name = db.query(models.Lead).filter(models.Lead.name == item['name']).first()

        if exists_id or exists_phone or exists_name:
            duplicates_count += 1
            continue # Saltamos este lead

        new_lead = models.Lead(
            google_id=item['id'],
            name=item['name'],
            phone=item['phone'],
            address=item['address'],
            rating=str(item['rating']) if item['rating'] else None,
            website=item['website'],
            maps_link=item['maps_link'],
            status="Nuevo",
            city=item.get('city', 'Desconocida'),
            category=kw # Guardamos qué keyword lo encontró (ej: Taller, Repuestos)
        )
        db.add(new_lead)
        saved_count += 1
            
    if saved_count > 0 or duplicates_count > 0:
        db.commit()
        
        # Registrar Zona en Firebase (Mapa de Conquista)
        firebase_service.log_scan_zone(
            lat=request.lat,
            lng=request.lng,
            radius=request.radius,
            found_count=len(all_results)
        )
    
    return {
        "status": "success", 
        "count": len(all_results), 
        "saved_new": saved_count,
        "duplicates_skipped": duplicates_count,
        "total_fetched": len(all_results),
        "next_page_token": next_token, # Token para la siguiente tanda
        "data": all_results
    }

@router.get("/scan-zones")
def get_scan_zones():
    """Devuelve las últimas zonas escaneadas para pintar círculos."""
    zones = firebase_service.get_scan_zones()
    # Limpiar timestamps para JSON
    clean_zones = []
    for z in zones:
        # Convertir timestamp a string si existe
        if 'scanned_at' in z and hasattr(z['scanned_at'], 'isoformat'):
            z['scanned_at'] = z['scanned_at'].isoformat()
        clean_zones.append(z)
    return clean_zones

@router.get("/leads")
def get_leads(skip: int = 0, limit: int = 2000, db: Session = Depends(get_db)):
    return db.query(models.Lead).order_by(models.Lead.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_leads = db.query(models.Lead).count()
    contacted_leads = db.query(models.Lead).filter(models.Lead.status == "Contactado").count()
    new_leads = db.query(models.Lead).filter(models.Lead.status == "Nuevo").count()
    
    return {
        "total_leads": total_leads,
        "contacted_leads": contacted_leads,
        "new_leads": new_leads,
        "response_rate": 0 # Placeholder for now
    }

@router.delete("/leads/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    """Borra un lead específico."""
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if lead:
        db.delete(lead)
        db.commit()
        return {"status": "deleted"}
    return {"status": "error", "message": "Lead not found"}

@router.delete("/leads")
def delete_all_leads(db: Session = Depends(get_db)):
    """Borra TODOS los leads."""
    count = db.query(models.Lead).delete()
    db.commit()
    return {"status": "deleted", "count": count}
