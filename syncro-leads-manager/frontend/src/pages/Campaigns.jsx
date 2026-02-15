import React, { useState, useEffect } from 'react';
import TemplateManager from '../components/TemplateManager';
import { Send, Smartphone, CheckCircle, Loader2, Sparkles } from 'lucide-react';

const Campaigns = () => {
    const [status, setStatus] = useState('disconnected'); // disconnected, connecting, connected, sending
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);
    const [targetStatus, setTargetStatus] = useState('Nuevo'); // Estado objetivo para la campaña
    const [templates, setTemplates] = useState([]);
    const [sendingStats, setSendingStats] = useState(null);

    // Estado para Auto-Respuesta
    const [autoReplyActive, setAutoReplyActive] = useState(false);
    const [repliedCount, setRepliedCount] = useState(0);

    // Cargar plantillas para el selector
    const loadTemplates = () => {
        fetch('http://localhost:8000/api/templates/')
            .then(res => res.json())
            .then(data => setTemplates(data));
    };

    useEffect(() => {
        loadTemplates();
    }, []);

    // Efecto para monitorear estado de conexión (QR escaneado)
    useEffect(() => {
        let interval;
        const checkStatus = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/whatsapp/status');
                const data = await res.json();

                // 1. Sincronizar estado de conexión
                if (data.status === 'connected' && status !== 'connected' && status !== 'sending') {
                    setStatus('connected');
                }
                if (data.status === 'disconnected' && status === 'connected') {
                    setStatus('disconnected');
                }

                // 2. Sincronizar estado de CAMPAÑA (Persistencia)
                if (data.is_campaign_running) {
                    if (status !== 'sending') setStatus('sending');
                } else {
                    // Si estaba enviando y ya no, significa que terminó
                    if (status === 'sending') {
                        setStatus('connected');
                        alert("¡Campaña finalizada!");
                    }
                }

            } catch (e) {
                // Ignorar errores de red momentáneos
            }
        };

        // Chequear inmediatamente al montar
        checkStatus();

        if (status === 'connecting' || status === 'connected' || status === 'disconnected' || status === 'sending') {
            interval = setInterval(checkStatus, 3000);
        }
        return () => clearInterval(interval);
    }, [status]);

    // Efecto para long-polling de respuestas
    useEffect(() => {
        let interval;
        if (autoReplyActive && status === 'connected') {
            interval = setInterval(async () => {
                try {
                    const res = await fetch('http://localhost:8000/api/whatsapp/check-replies', { method: 'POST' });
                    const data = await res.json();
                    if (data.status === 'ok' && data.replied > 0) {
                        setRepliedCount(prev => prev + data.replied);
                        console.log(`🤖 Auto-respondido a ${data.replied} chats.`);
                    }
                } catch (e) {
                    console.error("Error chequeando respuestas:", e);
                }
            }, 5000); // Chequear cada 5 segundos
        }
        return () => clearInterval(interval);
    }, [autoReplyActive, status]);

    const handleConnect = async () => {
        setStatus('connecting');
        try {
            const res = await fetch('http://localhost:8000/api/whatsapp/connect', { method: 'POST' });
            const data = await res.json();
            if (data.status === 'started') {
                setStatus('connecting'); // Esperando que escanee
            } else {
                alert("Error al conectar: " + data.message);
                setStatus('disconnected');
            }
        } catch (e) {
            console.error(e);
            setStatus('disconnected');
        }
    };

    // No change needed in Campaigns.jsx for leads fetching as it doesn't fetch leads list for display. Just confirming.
    const handleSendCampaign = async () => {
        if (!selectedTemplateId) return alert("Selecciona una plantilla primero.");

        // Marcamos como enviando provisionalmente para UI feedback
        setStatus('sending');

        try {
            const res = await fetch('http://localhost:8000/api/whatsapp/send-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    template_id: selectedTemplateId,
                    leads_status: targetStatus, // Usar el estado seleccionado
                    limit: 1000
                })
            });
            const data = await res.json();
            setSendingStats(data);

            if (data.status === 'queued') {
                alert(`🚀 Campaña iniciada: ${data.message}`);
                // Dejamos el estado en 'sending', el poller lo mantendrá
            } else {
                // Si es warning o error, regresamos a conectado
                alert(`⚠️ Atención: ${data.message}`);
                setStatus('connected');
            }

        } catch (e) {
            console.error(e);
            alert("Error iniciando campaña");
            setStatus('connected');
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Crear Campaña</h1>
                    <p className="text-slate-500 mt-1">Gestiona tus mensajes y conecta tu WhatsApp</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                    <span className={`h-3 w-3 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-400 animate-pulse'}`}></span>
                    <span className="text-sm font-medium text-slate-600">
                        {status === 'connected' ? 'Sistema Online' : 'Desconectado'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1 min-h-0">
                {/* Columna Izquierda: Gestor */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                        1. Prepara tu Mensaje
                    </h2>
                    <TemplateManager />

                    {/* Helper de Ventas */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mt-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={18} className="text-blue-600" />
                            <h4 className="font-bold text-blue-800 text-sm">Tips de Venta Syncro</h4>
                        </div>
                        <ul className="text-xs text-blue-900 space-y-1 list-disc list-inside opacity-80 font-medium">
                            <li>⚡ <strong>Facturación Electrónica</strong> y POS.</li>
                            <li>🤖 <strong>IA Integrada</strong> (Agenda y Alertas).</li>
                            <li>🤝 <strong>Configuración Asistida GRATIS</strong>.</li>
                            <li>🎁 <strong>15 Días GRATIS</strong> sin contrato.</li>
                        </ul>
                    </div>
                </div>

                {/* Columna Derecha: Configuración */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                        2. Configura el Envío
                    </h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center justify-center text-center h-[600px]">

                        {status === 'disconnected' && (
                            <>
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                    <Smartphone size={32} className="text-slate-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Conexión Requerida</h3>
                                <p className="text-slate-500 max-w-xs mx-auto mb-6">
                                    Para enviar mensajes, necesitamos abrir una sesión de WhatsApp Web.
                                </p>
                                <button
                                    onClick={handleConnect}
                                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all active:scale-95"
                                >
                                    Abrir WhatsApp Web
                                </button>
                            </>
                        )}

                        {status === 'connecting' && (
                            <>
                                <div className="mb-4 animate-spin text-green-500">
                                    <Loader2 size={48} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800">Iniciando...</h3>
                                <p className="text-slate-500">Escanea el QR en la ventana que se abrió.</p>
                            </>
                        )}

                        {(status === 'connected' || status === 'sending') && (
                            <div className="w-full max-w-md animate-in fade-in zoom-in duration-300">
                                <div className="bg-green-50 text-green-800 p-4 rounded-xl flex items-center gap-3 mb-6 border border-green-100">
                                    <CheckCircle size={24} />
                                    <div className="text-left">
                                        <p className="font-bold">WhatsApp Conectado</p>
                                        <p className="text-sm opacity-80">Listo para enviar mensajes.</p>
                                    </div>
                                </div>

                                {/* Selector de Lista Objetivo */}
                                <div className="text-left mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">¿A quién le enviamos?</label>
                                    <select
                                        className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-700"
                                        value={targetStatus}
                                        onChange={(e) => setTargetStatus(e.target.value)}
                                    >
                                        <option value="Nuevo">📥 Por Contactar (Nuevos)</option>
                                        <option value="En Cola">⏳ En Cola (Reintentar pegados)</option>
                                        <option value="Error">❌ Errores (Reintentar fallidos)</option>
                                        <option value="Contactado">💬 Ya Contactados (Seguimiento)</option>
                                        <option value="Cliente">🤝 Clientes actuales</option>
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1 ml-1">
                                        {targetStatus === 'Nuevo' ? 'Lista principal de contactos capturados.' :
                                            targetStatus === 'En Cola' ? 'Útil si la campaña anterior se detuvo.' :
                                                targetStatus === 'Contactado' ? 'Para enviar un segundo mensaje (remarketing).' : ''}
                                    </p>
                                </div>

                                <div className="text-left mb-6">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Selecciona la Plantilla a enviar:</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                                            onMouseDown={loadTemplates} // Recargar al intentar abrir
                                        >
                                            <option value="">-- Elige una plantilla --</option>
                                            {templates.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                        <button onClick={loadTemplates} className="p-3 bg-slate-100 rounded-lg hover:bg-slate-200" title="Recargar lista">🔄</button>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSendCampaign}
                                    disabled={status === 'sending' || !selectedTemplateId}
                                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${status === 'sending'
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/30 active:scale-95'
                                        }`}
                                >
                                    {status === 'sending' ? (
                                        <>
                                            <Loader2 className="animate-spin" /> Enviando campaña...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} /> Enviar Mensajes Masivos
                                        </>
                                    )}
                                </button>

                                {sendingStats && (
                                    <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm mb-4">
                                        {sendingStats.message}
                                    </div>
                                )}

                                {/* Panel de Auto-Respuesta */}
                                <div className="mt-6 border-t border-slate-100 pt-6 animate-in slide-in-from-bottom-2">
                                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <div className="text-left">
                                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                🤖 Respuesta Automática
                                                {autoReplyActive && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>}
                                            </h4>
                                            <p className="text-xs text-slate-500">Si responden "1", "2" o "3", el bot actúa.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={autoReplyActive}
                                                onChange={() => setAutoReplyActive(!autoReplyActive)}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                        </label>
                                    </div>
                                    {repliedCount > 0 && (
                                        <p className="text-xs text-green-600 mt-2 font-medium bg-green-50 p-2 rounded-lg border border-green-100">
                                            ⚡ {repliedCount} respuestas enviadas automáticamente.
                                        </p>
                                    )}
                                </div>

                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Campaigns;
