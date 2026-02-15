from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.core.database import Base

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True) # Para no repetir
    name = Column(String)
    phone = Column(String)
    address = Column(String)
    rating = Column(String)
    website = Column(String)
    maps_link = Column(String)
    city = Column(String, default="Desconocida")
    category = Column(String, default="General")
    status = Column(String, default="Nuevo") # Nuevo, Contactado, Interesado, Cliente
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
