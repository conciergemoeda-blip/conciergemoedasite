import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon issue in Webpack/Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

interface PropertyMapProps {
    lat: number;
    lng: number;
    title: string;
}

// Component to handle map centering when coordinates change
const ChangeView: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
};

export const PropertyMap: React.FC<PropertyMapProps> = ({ lat, lng, title }) => {
    const position: [number, number] = [lat, lng];
    const [mapType, setMapType] = React.useState<'STREET' | 'SATELLITE'>('STREET');

    // Custom Icon for Concierge Moeda
    const customIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    return (
        <div className="w-full h-[300px] md:h-[450px] rounded-3xl overflow-hidden border border-gray-100 shadow-inner group relative">
            <MapContainer
                center={position}
                zoom={15}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%', zIndex: 10 }}
            >
                {mapType === 'STREET' ? (
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                ) : (
                    <TileLayer
                        attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                )}
                <Marker position={position} icon={customIcon}>
                    <Popup className="custom-popup">
                        <div className="font-bold text-gray-900">{title}</div>
                        <div className="text-xs text-gray-500 mt-1">Localização aproximada</div>
                    </Popup>
                </Marker>
                <ChangeView center={position} />
            </MapContainer>

            {/* Map Type Toggle */}
            <div className="absolute top-4 right-4 z-[20] flex bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-gray-100">
                <button
                    type="button"
                    onClick={() => setMapType('STREET')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mapType === 'STREET' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Mapa
                </button>
                <button
                    type="button"
                    onClick={() => setMapType('SATELLITE')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${mapType === 'SATELLITE' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Satélite
                </button>
            </div>


            {/* Google Maps Overlay Button */}
            <div className="absolute bottom-4 right-4 z-[20] transition-transform group-hover:scale-105">
                <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-800 hover:bg-white transition-all"
                >
                    <span className="material-symbols-outlined text-sm text-primary">map</span>
                    Abrir no Google Maps
                </a>
            </div>
        </div>
    );
};
