import React, { useEffect, useState } from 'react';
import { Users, MessageSquare, TrendingUp } from 'lucide-react';

const Dashboard = () => {
    const [stats, setStats] = useState({ total_leads: 0, contacted_leads: 0, new_leads: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/stats');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Error loading stats:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Panel Principal</h1>

            {loading ? (
                <p className="text-slate-400">Cargando estadísticas...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Tarjeta 1: Total Leads */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
                        <div>
                            <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Leales</h3>
                            <p className="text-4xl font-bold text-slate-900 mt-2">{stats.total_leads}</p>
                            <span className="text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full mt-2 inline-block">
                                Capturados por el mapa
                            </span>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <Users size={24} />
                        </div>
                    </div>

                    {/* Tarjeta 2: Mensajes Enviados (Simulado con Contactados por ahora) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
                        <div>
                            <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Contactados</h3>
                            <p className="text-4xl font-bold text-slate-900 mt-2">{stats.contacted_leads}</p>
                            <span className="text-blue-600 text-xs font-medium bg-blue-50 px-2 py-1 rounded-full mt-2 inline-block">
                                Mensajes enviados
                            </span>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                            <MessageSquare size={24} />
                        </div>
                    </div>

                    {/* Tarjeta 3: Por Contactar (Nuevos) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
                        <div>
                            <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Pendientes</h3>
                            <p className="text-4xl font-bold text-slate-900 mt-2">{stats.new_leads}</p>
                            <span className="text-orange-600 text-xs font-medium bg-orange-50 px-2 py-1 rounded-full mt-2 inline-block">
                                Listos para contactar
                            </span>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">🚀 ¿Listo para crecer?</h3>
                    <p className="text-slate-300 mb-6 max-w-lg">
                        Tienes {stats.new_leads} nuevos talleres esperando recibir tu propuesta. Comienza una campaña ahora mismo.
                    </p>
                    <Link to="/campaigns" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-500/25">
                        Iniciar Campaña
                    </Link>
                </div>

                {/* Decoración de fondo */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
            </div>
        </div>
    );
};

export default Dashboard;
