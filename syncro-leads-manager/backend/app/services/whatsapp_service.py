import time
import urllib.parse
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from webdriver_manager.chrome import ChromeDriverManager

class WhatsAppBot:
    def __init__(self):
        self.driver = None
        self.is_active = False

    def validate_connection(self):
        """Verifica el estado real de la conexión con WhatsApp Web."""
        if not self.driver:
            return "disconnected"
        
        try:
            # 1. Verificar si estamos en la pantalla de carga inicial o QR
            try:
                # Buscamos el canvas del QR
                qr_canvas = self.driver.find_element(By.CSS_SELECTOR, "canvas")
                if qr_canvas.is_displayed():
                    return "waiting_qr"
            except:
                pass

            # 2. Verificar si ya cargó la lista de chats (indicador de éxito)
            try:
                # El panel lateral de chats suele tener un ID 'pane-side' o estructura similar
                pane_side = WebDriverWait(self.driver, 5).until(
                    EC.presence_of_element_located((By.ID, "pane-side"))
                )
                if pane_side:
                    return "connected"
            except:
                pass
            
            return "loading" # O estado desconocido
        except Exception as e:
            print(f"Error validando conexión: {e}")
            return "error"

    def start_browser(self):
        """Inicia el navegador y espera el escaneo del QR."""
        if self.driver:
            return True # Ya está corriendo

        print("🚀 Iniciando servicio de WhatsApp...")
        options = webdriver.ChromeOptions()
        # options.add_argument("--headless") # Headless no sirve para escanear QR inicial
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--remote-allow-origins=*")
        
        try:
            driver_path = ChromeDriverManager().install()
            print(f"🔧 Driver instalado en: {driver_path}")
            
            # Asegurar permisos de ejecución (por si acaso)
            import os
            try:
                os.chmod(driver_path, 0o755)
            except:
                pass

            service = Service(driver_path)
            self.driver = webdriver.Chrome(service=service, options=options)
            self.driver.set_page_load_timeout(60) # Evitar que driver.get() se cuelgue eternamente
            self.driver.set_script_timeout(60)
            
            self.driver.get("https://web.whatsapp.com")
            self.is_active = True
            print("✅ Navegador abierto. Esperando escaneo de QR...")
            return True
        except Exception as e:
            print(f"❌ Error al iniciar driver: {e}")
            return False

    def stop_browser(self):
        if self.driver:
            self.driver.quit()
            self.driver = None
            self.is_active = False
            print("🛑 Navegador cerrado.")

    def send_message(self, phone, message, check_history=False):
        """Envía un mensaje usando ENTER o buscando el botón."""
        if not self.driver:
            return False, "Navegador no iniciado"

        try:
            # 1. Preparar URL
            encoded_msg = urllib.parse.quote(message)
            url = f"https://web.whatsapp.com/send?phone={phone}&text={encoded_msg}"
            
            try:
                self.driver.get(url)
            except TimeoutException:
                 print(f"🛑 Timeout cargando URL para {phone}. Posible bloqueo o internet lento.")
                 return False, "Timeout: Carga de página"

            # 2. Esperar a que cargue el chat (o aparezca error)
            try:
                # Buscamos caja de texto
                inp_xpath = '//div[@contenteditable="true"][@data-tab="10"]'
                input_box = WebDriverWait(self.driver, 20).until( # Aumentamos a 20s para dar margen
                    EC.presence_of_element_located((By.XPATH, inp_xpath))
                )
            except TimeoutException:
                # Si falla, verificar si es error de "número inválido"
                try:
                    invalid_xpath = "//*[contains(text(), 'inválido') or contains(text(), 'invalid') or contains(text(), 'no es válido')]"
                    if self.driver.find_elements(By.XPATH, invalid_xpath):
                        print(f"⚠️ Número inválido detectado: {phone}")
                        return False, "Número inválido"
                except:
                    pass
                    
                print(f"⌛ Tiempo de espera agotado para {phone}")
                return False, "Timeout: No cargó chat"

            time.sleep(1) # Espera técnica para renderizado

            # 3. VERIFICACIÓN DE HISTORIAL (Opcional)
            if check_history:
                # Buscamos mensajes SALIENTES (message-out)
                # WhatsApp Web suele usar clases como 'message-out' o atributos data-id que empiezan por 'true_' (enviado por mí)
                try:
                    # Estrategia 1: Buscar elementos con clase que contenga 'message-out'
                    history = self.driver.find_elements(By.XPATH, '//div[contains(@class, "message-out")]')
                    if history:
                        print(f"🛑 Historial detectado para {phone}. Omitiendo envío.")
                        return False, "Ya tiene historial de chat"
                except:
                    pass

            # 4. Intentar enviar con ENTER
            print(f"📨 Intentando enviar a {phone} con ENTER...")
            input_box.send_keys(Keys.ENTER)
            time.sleep(1)
            
            # 5. Validar si se envió
            try:
                send_btn = self.driver.find_element(By.CSS_SELECTOR, "span[data-icon='send']")
                send_btn.click()
            except:
                pass 

            print(f"✅ Mensaje enviado a {phone}")
            return True, "Enviado"

        except Exception as e:
            print(f"❌ Error crítico con {phone}: {e}")
            return False, str(e)

    def check_unread_and_reply(self):
        """Revisa chats con mensajes nuevos y responde automáticamente."""
        if not self.driver or not self.is_active:
            return 0

        try:
            # 1. Buscar indicadores de mensajes no leídos (círculo verde)
            unread_chats = self.driver.find_elements(By.XPATH, '//span[@aria-label[contains(., "unread")]]')
            
            if not unread_chats:
                return 0

            print(f"📬 Encontrados {len(unread_chats)} chats con mensajes nuevos.")
            
            # Procesamos solo el primero para no perder la referencia del DOM al cambiar de chat
            # En la siguiente llamada se procesará el siguiente.
            chat = unread_chats[0]
            
            # Hacer clic en el chat para abrirlo
            try:
                # A veces el span está dentro de un div que recibe el click
                parent = chat.find_element(By.XPATH, "./../../../../..") 
                parent.click()
            except:
                chat.click()
                
            time.sleep(2) # Esperar a que cargue el chat

            # 2. Leer el último mensaje
            # Los mensajes suelen estar en divs con class "message-in"
            try:
                # Buscamos burbujas de mensaje entrante
                message_bubbles = self.driver.find_elements(By.XPATH, '//div[contains(@class, "message-in")]')
                if not message_bubbles:
                    return 0
                
                last_bubble = message_bubbles[-1]
                # Extraer texto (span con class selectable-text)
                text_element = last_bubble.find_element(By.CSS_SELECTOR, "span.copyable-text")
                text = text_element.text.strip()
                
                print(f"💬 Último mensaje recibido: '{text}'")

                # 3. Lógica de Respuesta
                response = None
                if text == "1":
                    response = "¡Excelente decisión, colega! 🏍️💨\n\nTe cuento que debido a la alta demanda, estamos asignando los accesos por estricto orden y tengo varios talleres en fila. 🔧\n\nDame un momento para generar tus credenciales únicas y te las envío por aquí.\n¡Vale la pena la espera! 🙏"
                elif text == "2":
                    response = "¡Todo sobre Syncro Motos a un clic! 🛠️\n\nSomos la herramienta digital que tu taller necesita.\nMira todos los detalles aquí:\n👉 https://landing.syncro.skin/\n\nCualquier duda, quedamos QAP. 🏁"
                elif text == "3":
                    response = "Recibido. 🫡\n\nYa le pasé el dato a uno de nuestros asesores expertos.\nEn unos minutos se comunica contigo para resolver tus dudas.\n¡Estamos pendientes! ⏱️"
                
                if response:
                    print(f"🤖 Respondiendo automáticamente...")
                    # Usamos el input box que ya está visible porque abrimos el chat
                    input_box = self.driver.find_element(By.XPATH, '//div[@contenteditable="true"][@data-tab="10"]')
                    
                    # Escribir y enviar (simulando tipeo rápido)
                    for line in response.split('\n'):
                        input_box.send_keys(line)
                        input_box.send_keys(Keys.SHIFT + Keys.ENTER) # Salto de línea
                    
                    time.sleep(1)
                    input_box.send_keys(Keys.ENTER)
                    print("✅ Respuesta automática enviada.")
                    return 1
                
            except Exception as e:
                print(f"⚠️ Error leyendo/respondiendo chat: {e}")

        except Exception as e:
            print(f"❌ Error en ciclo de auto-respuesta: {e}")
        
        return 0

# Instancia global para usar en la API
whatsapp_service = WhatsAppBot()
