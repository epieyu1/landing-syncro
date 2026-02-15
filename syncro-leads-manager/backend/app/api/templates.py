from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.core.database import get_db, engine
from app import models

# Crear tablas si no existen
models.Base.metadata.create_all(bind=engine)

router = APIRouter()

# Schemas Pydantic
class TemplateBase(BaseModel):
    name: str
    content: str

class TemplateCreate(TemplateBase):
    pass

class Template(TemplateBase):
    id: int
    
    class Config:
        orm_mode = True

# Rutas CRUD
@router.post("/templates/", response_model=Template)
def create_template(template: TemplateCreate, db: Session = Depends(get_db)):
    db_template = models.Template(name=template.name, content=template.content)
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@router.get("/templates/", response_model=List[Template])
def read_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    templates = db.query(models.Template).offset(skip).limit(limit).all()
    return templates

    db.delete(db_template)
    db.commit()
    return {"ok": True}

@router.put("/templates/{template_id}", response_model=Template)
def update_template(template_id: int, template: TemplateCreate, db: Session = Depends(get_db)):
    db_template = db.query(models.Template).filter(models.Template.id == template_id).first()
    if db_template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db_template.name = template.name
    db_template.content = template.content
    db.commit()
    db.refresh(db_template)
    return db_template
