import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, MessageSquareText } from 'lucide-react';

const TemplateManager = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Estado para el formulario (Crear/Editar)
    const [currentTemplate, setCurrentTemplate] = useState({ id: null, name: '', content: '' });

    // Cargar plantillas al iniciar
    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/templates/');
            const data = await res.json();
            setTemplates(data);
        } catch (error) {
            console.error("Error cargando plantillas:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (template) => {
        setCurrentTemplate({ id: template.id, name: template.name, content: template.content });
        setIsEditing(true);
    };

    const handleCreateNew = () => {
        setCurrentTemplate({ id: null, name: '', content: '' });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!currentTemplate.name || !currentTemplate.content) return alert("Completa todos los campos");

        try {
            let res;
            if (currentTemplate.id) {
                // UPDATE (PUT)
                res = await fetch(`http://localhost:8000/api/templates/${currentTemplate.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: currentTemplate.name, content: currentTemplate.content }),
                });
            } else {
                // CREATE (POST)
                res = await fetch('http://localhost:8000/api/templates/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: currentTemplate.name, content: currentTemplate.content }),
                });
            }

            if (res.ok) {
                setIsEditing(false);
                setCurrentTemplate({ id: null, name: '', content: '' });
                fetchTemplates(); // Recargar lista
            } else {
                alert("Error guardando plantilla");
            }
        } catch (error) {
            console.error("Error guardando:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Seguro que quieres borrar esta plantilla?")) return;
        try {
            await fetch(`http://localhost:8000/api/templates/${id}`, { method: 'DELETE' });
            setTemplates(templates.filter(t => t.id !== id));
            // Si estamos editando la que borramos, cerrar editor
            if (currentTemplate.id === id) {
                setIsEditing(false);
                setCurrentTemplate({ id: null, name: '', content: '' });
            }
        } catch (error) {
            console.error("Error borrando:", error);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row overflow-hidden h-[600px]">
            {/* Lista Lateral */}
            <div className="w-full md:w-1/3 border-r border-slate-100 bg-slate-50 flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h3 className="font-bold text-slate-700">Mis Plantillas</h3>
                    <button
                        onClick={handleCreateNew}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        title="Crear Nueva"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? <p className="text-center p-4 text-slate-400">Cargando...</p> : (
                        templates.map((t) => (
                            <div
                                key={t.id}
                                onClick={() => handleEdit(t)}
                                className={`p-3 rounded-lg border shadow-sm cursor-pointer group transition-all ${currentTemplate.id === t.id
                                        ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                                        : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-medium ${currentTemplate.id === t.id ? 'text-blue-700' : 'text-slate-800'}`}>
                                        {t.name}
                                    </h4>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Borrar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.content}</p>
                            </div>
                        ))
                    )}
                    {templates.length === 0 && !loading && (
                        <p className="text-center text-sm text-slate-400 mt-10">No hay plantillas guardadas.</p>
                    )}
                </div>
            </div>

            {/* Área de Edición */}
            <div className="flex-1 p-6 relative bg-white">
                {isEditing ? (
                    <div className="h-full flex flex-col animate-in fade-in duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800">
                                {currentTemplate.id ? 'Editar Plantilla' : 'Nueva Plantilla'}
                            </h3>
                            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder="Nombre de la plantilla (ej: Saludo Informe)"
                            className="w-full p-3 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={currentTemplate.name}
                            onChange={(e) => setCurrentTemplate({ ...currentTemplate, name: e.target.value })}
                        />

                        <div className="relative flex-1">
                            <textarea
                                placeholder="Escribe tu mensaje aquí..."
                                className="w-full h-full p-4 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-sans text-slate-600 leading-relaxed"
                                value={currentTemplate.content}
                                onChange={(e) => setCurrentTemplate({ ...currentTemplate, content: e.target.value })}
                            ></textarea>
                            <div className="absolute bottom-4 right-4 text-xs text-slate-400 bg-white/80 px-2 py-1 rounded border border-slate-100">
                                Tip: Usa emojis 🏍️ para mayor impacto
                            </div>
                        </div>

                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-transform active:scale-95"
                            >
                                <Save size={18} /> {currentTemplate.id ? 'Guardar Cambios' : 'Crear Plantilla'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <MessageSquareText size={64} className="mb-4 opacity-50" />
                        <p className="text-lg font-medium text-slate-500">Selecciona una plantilla para verla</p>
                        <p className="text-sm">o crea una nueva para tus campañas</p>
                        <button
                            onClick={handleCreateNew}
                            className="mt-6 px-6 py-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors font-medium border border-slate-200"
                        >
                            + Crear Nueva
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplateManager;
