import sqlite3
import os

# Ruta absoluta a la base de datos
DB_PATH = "/Users/alexanderrestrepoepieyu/Desktop/landing-syncro/syncro-leads-manager/data/leads.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"❌ No se encontró la base de datos en: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("🔍 Verificando columnas...")
        cursor.execute("PRAGMA table_info(leads)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if "city" not in columns:
            print("➕ Agregando columna 'city'...")
            cursor.execute("ALTER TABLE leads ADD COLUMN city TEXT DEFAULT 'Desconocida'")
        else:
            print("✅ Columna 'city' ya existe.")
            
        if "category" not in columns:
            print("➕ Agregando columna 'category'...")
            cursor.execute("ALTER TABLE leads ADD COLUMN category TEXT DEFAULT 'General'")
        else:
            print("✅ Columna 'category' ya existe.")
            
        conn.commit()
        print("🚀 Migración completada exitosamente.")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
