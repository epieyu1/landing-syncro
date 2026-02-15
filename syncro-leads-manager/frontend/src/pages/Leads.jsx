import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Star, ExternalLink, MessageCircle, Trash2, AlertTriangle } from 'lucide-react';

const Leads = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Nuevo'); // 'Nuevo', 'Contactado', 'Todos'

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/leads?limit=2000');
            const data = await res.json();
            setLeads(data);
        } catch (error) {
            console.error("Error fetching leads:", error);
        } finally {
            setLoading(false);
        }
    };

    const deleteLead = async (id) => {
        if (!window.confirm("¿Seguro que quieres borrar este contacto?")) return;
        try {
            await fetch(`http://localhost:8000/api/leads/${id}`, { method: 'DELETE' });
            setLeads(leads.filter(l => l.id !== id));
        } catch (error) {
            alert("Error borrando contacto");
        }
    };

    const deleteAllLeads = async () => {
        if (!window.confirm("⚠️ ¿BORRAR TODOS LOS CONTACTOS?\n\nEsta acción no se puede deshacer. ¿Deseas limpiar toda la lista?")) return;
        try {
            await fetch('http://localhost:8000/api/leads', { method: 'DELETE' });
            setLeads([]);
        } catch (error) {
            alert("Error limpiando lista");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Contactado': return 'bg-blue-100 text-blue-800';
            case 'Cliente': return 'bg-green-100 text-green-800';
            case 'Interesado': return 'bg-orange-100 text-orange-800';
            case 'En Cola': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    // Filtro inteligente
    // Filtro inteligente
    const filteredLeads = leads.filter(lead => {
        if (activeTab === 'Todos') return true;
        if (activeTab === 'Contactado') return ['Contactado', 'Cliente', 'Interesado', 'Error'].includes(lead.status);
        if (activeTab === 'En Cola') return lead.status === 'En Cola';
        return lead.status === activeTab;
    });

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Mis Contactos</h1>
                    <p className="text-slate-500 mt-1">
                        Gestiona tus oportunidades de negocio.
                    </p>
                </div>
                <div className="flex gap-4">
                    {leads.length > 0 && (
                        <button
                            onClick={deleteAllLeads}
                            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 border border-red-100 transition-colors"
                        >
                            <Trash2 size={16} /> Borrar Todo
                        </button>
                    )}
                    <button
                        onClick={fetchLeads}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        🔄 Actualizar Lista
                    </button>
                </div>
            </div>

            {/* Pestañas de Navegación Refinadas */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl mb-4 self-start flex-wrap gap-y-2">
                <button
                    onClick={() => setActiveTab('Nuevo')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'Nuevo'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    📥 Por Contactar ({leads.filter(l => l.status === 'Nuevo').length})
                </button>

                <button
                    onClick={() => setActiveTab('En Cola')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'En Cola'
                        ? 'bg-white text-yellow-600 shadow-sm ring-1 ring-yellow-200'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    ⏳ En Cola ({leads.filter(l => ['En Cola', 'Error'].includes(l.status)).length})
                </button>

                <button
                    onClick={() => setActiveTab('Contactado')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'Contactado'
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    💬 Ya Contactados ({leads.filter(l => ['Contactado', 'Cliente', 'Interesado'].includes(l.status)).length})
                </button>

                <button
                    onClick={() => setActiveTab('Todos')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'Todos'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    📂 Todos
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Taller</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Ubicación</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Contacto</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Calidad</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm text-center">Estado</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm">Notas</th>
                                <th className="p-4 font-semibold text-slate-600 text-sm text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-400">Cargando contactos...</td>
                                </tr>
                            ) : filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <MapPin size={48} className="mb-4 opacity-20" />
                                            <p className="text-lg text-slate-600">No hay contactos en esta lista</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLeads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-4">
                                            <p className="font-bold text-slate-800">{lead.name}</p>
                                            {lead.website && (
                                                <a href={lead.website} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                                                    Website <ExternalLink size={10} />
                                                </a>
                                            )}
                                        </td>
                                        <td className="p-4 max-w-xs">
                                            <p className="text-sm text-slate-500 truncate" title={lead.address}>{lead.address}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-slate-400" />
                                                <span className="font-mono text-sm text-slate-700">{lead.phone || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-orange-400">
                                                <span className="text-sm font-bold text-slate-700">{lead.rating || '-'}</span>
                                                <Star size={14} fill="currentColor" />
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs text-slate-500 italic">{lead.notes || '-'}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 hover:bg-green-50 text-slate-300 hover:text-green-600 rounded-lg transition-colors" title="Enviar Mensaje Directo">
                                                    <MessageCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => deleteLead(lead.id)}
                                                    className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                                                    title="Borrar Contacto"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Leads;
