from fastapi import APIRouter, BackgroundTasks, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from app.services.whatsapp_service import whatsapp_service
from app.core.database import get_db, SessionLocal
from app import models
import time

router = APIRouter()

class CampaignRequest(BaseModel):
    template_id: int
    leads_status: str = "Nuevo" # Enviar a todos los "Nuevos"
    limit: int = 1000 # Aumentado para tomar todos

import os
from app.services import firebase_service
from app.core import firebase_config

# Estado global de campaña (simulado en memoria)
CAMPAIGN_RUNNING = False

def background_send_campaign(template_content: str, lead_ids: List[int], campaign_name: str):
    """Tarea en segundo plano para enviar mensajes."""
    global CAMPAIGN_RUNNING
    CAMPAIGN_RUNNING = True
    
    db = SessionLocal() # Nueva sesión independiente
    try:
        leads = db.query(models.Lead).filter(models.Lead.id.in_(lead_ids)).all()
        print(f"🚀 Iniciando campaña '{campaign_name}' para {len(leads)} contactos...")
        
        for lead in leads:
            if not whatsapp_service.is_active:
                print("⚠️ Servicio WhatsApp detenido. Abortando campaña.")
                break
                
            # Personalizar mensaje
            msg = template_content.replace("{nombre_taller}", lead.name or "Amigo")
            msg = msg.replace("{barrio}", lead.address or "tu zona")
            
            print(f"📨 Procesando a {lead.name} ({lead.phone})...")
            
            # Enviar
            print(f"📡 Intentando envío a {lead.phone}...")
            print(f"📡 Intentando envío a {lead.phone}...")
            success, error = whatsapp_service.send_message(lead.phone, msg, check_history=True)
            print(f"   Resultado envío {lead.phone}: Success={success}, Error={error}")
            print(f"   Resultado envío {lead.phone}: Success={success}, Error={error}")
            
            # Actualizar estado local
            lead.status = "Contactado" if success else "Error"
            lead.notes = f"Enviado: {campaign_name}" if success else error
            db.commit() 
            
            # Registrar en Firebase (Interactions + Leads Update)
            firebase_service.log_interaction(
                phone=lead.phone,
                campaign_data={
                    'campaign_name': campaign_name,
                    'template_id': 'auto_template' # O pasar ID real si se tiene
                },
                success=success,
                error_msg=error
            )
            
            # Intervalo anti-ban (43 segundos)
            time.sleep(43) 
            
    except Exception as e:
        print(f"❌ Error en tarea de background: {e}")
    finally:
        CAMPAIGN_RUNNING = False
        print("🏁 Campaña finalizada (o detenida).")
        db.close() # Importante cerrar

@router.post("/whatsapp/connect")
def connect_whatsapp():
    """Abre el navegador para escanear QR."""
    success = whatsapp_service.start_browser()
    if success:
        return {"status": "started", "message": "Navegador abierto. Escanea el QR."}
    else:
        return {"status": "error", "message": "No se pudo iniciar el navegador."}

@router.post("/whatsapp/send-campaign")
def send_campaign(request: CampaignRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Inicia el envío masivo en segundo plano."""
    global CAMPAIGN_RUNNING
    if CAMPAIGN_RUNNING:
        return {"status": "error", "message": "Ya hay una campaña en ejecución. Espera a que termine."}

    if not whatsapp_service.driver:
        return {"status": "error", "message": "Primero conecta WhatsApp."}
        
    # Obtener plantilla
    template = db.query(models.Template).filter(models.Template.id == request.template_id).first()
    if not template:
        return {"status": "error", "message": "Plantilla no encontrada."}
        
    # 1. Obtener leads candidatos
    query = db.query(models.Lead).filter(models.Lead.status == request.leads_status)
    if request.limit > 0:
        query = query.limit(request.limit)
    candidates = query.all()
    
    if not candidates:
        return {"status": "warning", "message": "No hay contactos disponibles para enviar."}
    
    # 2. Filtrar y Bloquear (Anti-Duplicados Global con Firebase)
    lead_ids = []
    skipped_count = 0
    processed_phones = set() 
    
    print("☁️ Verificando elegibilidad en Firebase Cloud...")
    
    for lead in candidates:
        # A. Chequeo de lote actual
        if lead.phone in processed_phones:
            lead.status = "Omitido"
            lead.notes = "Duplicado en el mismo lote"
            skipped_count += 1
            continue
            
        # B. Chequeo de FIREBASE (Blacklist + Status)
        is_eligible, reason = firebase_service.check_lead_eligibility(lead.phone)
        if not is_eligible:
            lead.status = "Omitido"
            lead.notes = f"Bloqueado por Firebase: {reason}"
            skipped_count += 1
            continue

        # C. Verificar histórico local DB (Redundancia Inteligente)
        # Definimos qué estados prohibir. Si estamos reintentando una lista específica, 
        # no debemos prohibir esa misma lista.
        
        forbidden_statuses = ['Contactado', 'En Cola', 'Cliente', 'Interesado', 'Omitido', 'Error']
        
        # Si el usuario eligió explícitamente enviar a "En Cola" (Reintentar) o "Error", permitimos esos.
        if request.leads_status in forbidden_statuses:
            forbidden_statuses.remove(request.leads_status)

        already_sent = db.query(models.Lead).filter(
            models.Lead.phone == lead.phone, 
            models.Lead.status.in_(forbidden_statuses) 
        ).first()
        
        if already_sent:
            lead.status = "Omitido"
            lead.notes = f"Ya contactado anteriormente (Local ID: {already_sent.id})"
            skipped_count += 1
        else:
            lead.status = "En Cola"
            lead_ids.append(lead.id)
            processed_phones.add(lead.phone)
            
    db.commit()
    
    if not lead_ids:
        return {"status": "warning", "message": f"Todos los {len(candidates)} candidatos fueron omitidos (Firebase/Local)."}
        
    # 3. Lanzar tarea
    campaign_name = f"Campaña {request.leads_status} - {template.name}"
    background_tasks.add_task(background_send_campaign, template.content, lead_ids, campaign_name)
    
    msg = f"Encolados {len(lead_ids)} mensajes."
    if skipped_count > 0:
        msg += f" (Se omitieron {skipped_count} por seguridad)."
    
    return {"status": "queued", "count": len(lead_ids), "message": msg}

@router.get("/whatsapp/status")
def get_whatsapp_status():
    """Devuelve el estado real de la sesión."""
    status = whatsapp_service.validate_connection()
    return {"status": status, "is_campaign_running": CAMPAIGN_RUNNING}

@router.post("/whatsapp/check-replies")
def check_replies():
    """Verifica mensajes nuevos y responde automáticamente."""
    if not whatsapp_service.driver:
        return {"status": "error", "message": "WhatsApp no conectado"}
    
    replied_count = whatsapp_service.check_unread_and_reply()
    
    return {"status": "ok", "replied": replied_count}
