import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, MessageSquareText, Users, Settings } from 'lucide-react';

const Sidebar = () => {
    const menuItems = [
        { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { path: '/map', name: 'Explorar Mapa', icon: <Map size={20} /> },
        { path: '/leads', name: 'Mis Leales', icon: <Users size={20} /> },
        { path: '/campaigns', name: 'Campañas', icon: <MessageSquareText size={20} /> },
    ];

    return (
        <div className="h-screen w-64 bg-slate-900 text-white flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    Syncro Leads
                </h1>
                <p className="text-xs text-slate-400 mt-1">Manager v1.0</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`
                        }
                    >
                        {item.icon}
                        <span className="font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl w-full transition-colors">
                    <Settings size={20} />
                    <span className="font-medium">Configuración</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
