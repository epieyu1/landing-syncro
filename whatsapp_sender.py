import json
import time
import random
import urllib.parse
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# CONFIGURACIÓN
JSON_FILE = 'leads_ready.json'
DELAY_BETWEEN_MESSAGES = 45 # Segundos fijos según solicitud

# MENSAJE BASE (Los {placeholders} se reemplazan automáticamente)
MESSAGE_TEMPLATE = """Hola *{nombre_taller}*, un gran saludo.

Veo que son referentes en *{barrio}* y quería compartirles algo innovador.

Hemos lanzado la primera **'Caja de Herramientas Digital'** para talleres de motos: **Syncro Motos**.

Más que organizar papeles, es un sistema integral con:
🧠 **IA ("Magnus")**: Detecta fallos y oportunidades de venta.
🧾 **Facturación Electrónica**: Habilitada y fácil.
☁️ **Modo Híbrido**: Funciona sin internet y sincroniza todo en la nube al conectar.
📊 **CRM & Agenda**: Recordatorios automáticos para sus clientes.

¿Les podría enviar un video de 30seg mostrando cómo funciona?"""

def setup_driver():
    """Configura el navegador Chrome."""
    print("🚀 Iniciando navegador...")
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless") # No usar headless para poder escanear QR
    
    # Intentar usar ChromeDriverManager para descargar el driver compatible automáticamente
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    except Exception as e:
        print(f"Error iniciando driver automático: {e}")
        print("Intentando driver del sistema...")
        driver = webdriver.Chrome(options=options)
        
    return driver

def send_whatsapp_message(driver, phone, message):
    """Envía un mensaje a un número específico."""
    try:
        # Codificar el mensaje para URL
        encoded_message = urllib.parse.quote(message)
        url = f"https://web.whatsapp.com/send?phone={phone}&text={encoded_message}"
        
        driver.get(url)
        
        # Esperar a que cargue el botón de enviar (o el chat)
        # Buscamos el botón de enviar (icono de avión de papel)
        try:
            send_button = WebDriverWait(driver, 30).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "span[data-icon='send']"))
            )
            time.sleep(2) # Pequeña pausa "humana" antes de clicar
            send_button.click()
            print(f"✅ Mensaje enviado a {phone}")
            return True
        except Exception as e:
            print(f"⚠️ No se encontró botón de enviar para {phone}. ¿Número inválido?")
            return False
            
    except Exception as e:
        print(f"❌ Error enviando a {phone}: {e}")
        return False

def main():
    # 1. Cargar datos
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            leads = json.load(f)
    except FileNotFoundError:
        print("❌ No se encuentra el archivo json. Ejecuta primero prepare_data.py")
        return

    print(f"📋 Cargados {len(leads)} contactos.")
    
    # 2. Iniciar navegador
    driver = setup_driver()
    driver.get("https://web.whatsapp.com")
    
    print("\n" + "="*50)
    print("📲 POR FAVOR, ESCANEA EL CÓDIGO QR EN EL NAVEGADOR")
    print("Presiona ENTER en esta terminal una vez que hayas iniciado sesión y veas tus chats.")
    print("="*50 + "\n")
    input("Presiona ENTER para comenzar el envío masivo...")
    
    # 3. Bucle de envío
    count = 0
    for lead in leads:
        name = lead['nombre']
        phone = lead['telefono']
        barrio = lead['barrio']
        
        # Personalizar mensaje
        msg = MESSAGE_TEMPLATE.format(nombre_taller=name, barrio=barrio)
        
        print(f"\n[{count+1}/{len(leads)}] Procesando: {name} ({barrio})...")
        
        success = send_whatsapp_message(driver, phone, msg)
        
        if success:
            count += 1
            print(f"⏳ Esperando {DELAY_BETWEEN_MESSAGES} segundos por seguridad...")
            time.sleep(DELAY_BETWEEN_MESSAGES)
        else:
            print("⏩ Saltando espera por error.")
            
    print("\n🎉 ¡Proceso finalizado!")
    driver.quit()

if __name__ == "__main__":
    main()
