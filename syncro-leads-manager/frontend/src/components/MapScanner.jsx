import React, { useState, useEffect } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';

// Usamos la API Key del usuario
const API_KEY = 'AIzaSyDrMg06N_fBhvDWxag84TP64_7YA0MuTlk';

const ScanZoneCircle = ({ lat, lng, radius }) => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        // Crear el círculo
        const circle = new window.google.maps.Circle({
            strokeColor: '#22c55e', // Green 500
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#22c55e',
            fillOpacity: 0.15,
            map: map,
            center: { lat: parseFloat(lat), lng: parseFloat(lng) },
            radius: radius || 3000,
            clickable: false
        });

        return () => {
            circle.setMap(null);
        };
    }, [map, lat, lng, radius]);

    return null;
};

const MapScanner = () => {
    const [center, setCenter] = useState({ lat: 6.2476, lng: -75.5658 });
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [stats, setStats] = useState({ saved: 0, skipped: 0 });
    const [scanZones, setScanZones] = useState([]);

    // Cargar zonas escaneadas al inicio
    useEffect(() => {
        fetchScanZones();
    }, []);

    const fetchScanZones = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/scan-zones');
            const data = await res.json();
            if (Array.isArray(data)) {
                setScanZones(data);
            }
        } catch (error) {
            console.error("Error fetching zones:", error);
        }
    };

    const handleScan = async () => {
        setLoading(true);
        setResults([]); // Limpiar anteriores
        setNextPageToken(null);
        setStats({ saved: 0, skipped: 0 });

        try {
            const response = await fetch('http://localhost:8000/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat: center.lat,
                    lng: center.lng,
                    radius: 5000
                }),
            });
            const data = await response.json();
            setResults(data.data || []);
            setNextPageToken(data.next_page_token);

            setStats({
                saved: data.saved_new,
                skipped: data.duplicates_skipped
            });

            // Actualizar zonas visuales después de escanear
            fetchScanZones();

            if (data.count > 0) {
                alert(`🌪️ ¡Éxito! Estrategia Multi-Keyword completada.\n\nSe encontraron ${data.count} posibles clientes únicos combinando varias búsquedas (Taller, Repuestos, Mecánico, etc).`);
            } else {
                alert("⚠️ No se encontraron resultados en esta zona.");
            }
        } catch (error) {
            console.error("Error scanning:", error);
            alert("Error al conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = async () => {
        if (!nextPageToken) return;
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat: center.lat,
                    lng: center.lng,
                    radius: 5000,
                    page_token: nextPageToken
                }),
            });
            const data = await response.json();

            setResults(prev => [...prev, ...data.data]);
            setNextPageToken(data.next_page_token);

            setStats(prev => ({
                saved: prev.saved + data.saved_new,
                skipped: prev.skipped + data.duplicates_skipped
            }));

        } catch (error) {
            console.error("Error loading more:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full relative">
            {/* Header / Barra de Control */}
            <div className="bg-white p-4 shadow-md z-10 flex justify-between items-center px-8 border-b border-slate-200">
                <h1 className="text-xl font-bold text-slate-800">Syncro Leads Manager</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleScan}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-white shadow-sm flex items-center gap-2 ${loading ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? '⏳ Escaneando Múltiples Keywords...' : '🌪️ Escaneo Profundo (Multi-Keyword)'}
                    </button>
                    <div className="ml-4 flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        <div className="w-3 h-3 rounded-full bg-green-500 opacity-50 border border-green-600"></div>
                        Zonas ya exploradas
                    </div>
                </div>
            </div>

            {/* Resultados Flotantes */}
            {results.length > 0 && (
                <div className="absolute top-24 right-4 w-96 bg-white shadow-2xl rounded-xl border border-slate-100 max-h-[calc(100vh-8rem)] flex flex-col z-20 overflow-hidden text-slate-800">
                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="font-bold text-slate-800">Resultados ({results.length})</h2>
                            <button
                                onClick={() => setResults([])}
                                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                            >
                                ✕ Cerrar Lista
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="bg-green-50 text-green-700 p-2 rounded border border-green-100">
                                <span className="block font-bold text-lg">{stats.saved}</span>
                                Nuevos Guardados
                            </div>
                            <div className="bg-orange-50 text-orange-700 p-2 rounded border border-orange-100">
                                <span className="block font-bold text-lg">{stats.skipped}</span>
                                Repetidos (Ignorados)
                            </div>
                        </div>
                    </div>

                    <div className="overflow-y-auto p-2 space-y-2 bg-slate-50/50 flex-grow">
                        {results.map((place, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-slate-900 text-sm">{place.name}</h3>
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{place.rating || '-'}★</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{place.address}</p>
                                <div className="mt-2 flex justify-between items-center">
                                    <p className="text-xs font-mono text-green-700 bg-green-50 px-2 py-1 rounded">{place.phone}</p>
                                    <a href={place.maps_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Ver en Maps ↗</a>
                                </div>
                            </div>
                        ))}

                        {nextPageToken ? (
                            <button
                                onClick={handleLoadMore}
                                disabled={loading}
                                className="w-full py-3 mt-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium text-sm border border-blue-100 transition-colors flex justify-center items-center gap-2"
                            >
                                {loading ? 'Cargando...' : '⬇️ Cargar siguientes 20...'}
                            </button>
                        ) : (
                            <div className="mt-4 p-3 bg-slate-100 rounded-lg text-center text-xs text-slate-500">
                                <p>🛑 Límite de Google Maps alcanzado (60 máx).</p>
                                <p className="mt-1">Mueve el mapa a otra zona y escanea de nuevo.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mapa */}
            <div className="flex-grow w-full h-full relative" style={{ minHeight: '400px' }}>
                <APIProvider apiKey={API_KEY}>
                    <Map
                        defaultCenter={center}
                        defaultZoom={13}
                        onCenterChanged={(ev) => setCenter(ev.detail.center)}
                        gestureHandling={'greedy'}
                        disableDefaultUI={false}
                        style={{ width: '100%', height: '100%' }}
                        className="w-full h-full"
                    >
                        {scanZones.map((zone, idx) => (
                            <ScanZoneCircle
                                key={idx}
                                lat={zone.lat}
                                lng={zone.lng}
                                radius={zone.radius || 3000}
                            />
                        ))}
                    </Map>
                </APIProvider>
            </div>
        </div>
    );
};

export default MapScanner;
