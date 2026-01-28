import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon issue
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

interface MapLocationPickerProps {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number) => void;
}

// Component to handle map clicks and marker updates
const LocationMarker: React.FC<{
    position: [number, number];
    setPosition: (pos: [number, number]) => void;
}> = ({ position, setPosition }) => {
    const map = useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    // Custom Icon (Green for brand consistency)
    const customIcon = useMemo(() => new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }), []);

    return (
        <Marker
            position={position}
            icon={customIcon}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    const marker = e.target;
                    const pos = marker.getLatLng();
                    setPosition([pos.lat, pos.lng]);
                },
            }}
        />
    );
};

// Component to handle map centering when coordinates change externally (e.g., "Use current location")
const ChangeView: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        // Fix for grey areas (forces map to recalculate its container size)
        map.invalidateSize();
        // Smooth transition to new coordinates
        map.flyTo(center, map.getZoom(), {
            duration: 1.5,
            easeLinearity: 0.25
        });
    }, [center, map]);
    return null;
};

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ lat, lng, onChange }) => {
    const [position, setLocalPosition] = useState<[number, number]>([lat, lng]);
    const [mapType, setMapType] = useState<'STREET' | 'SATELLITE'>('STREET');

    // Update internal state when props change (e.g. from buttons or manual input)
    useEffect(() => {
        setLocalPosition([lat, lng]);
    }, [lat, lng]);

    const handleSetPosition = (pos: [number, number]) => {
        setLocalPosition(pos);
        onChange(pos[0], pos[1]);
    };

    return (
        <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-10">
            <MapContainer
                center={position}
                zoom={14}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
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
                <LocationMarker position={position} setPosition={handleSetPosition} />
                <ChangeView center={position} />
            </MapContainer>

            {/* Map Type Toggle */}
            <div className="absolute top-2 right-2 z-[400] flex bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-sm border border-gray-100">
                <button
                    type="button"
                    onClick={() => setMapType('STREET')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${mapType === 'STREET' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Mapa
                </button>
                <button
                    type="button"
                    onClick={() => setMapType('SATELLITE')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${mapType === 'SATELLITE' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    Satélite
                </button>
            </div>

            {/* Legend/Hint */}
            <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] text-gray-500 border border-gray-100 font-medium">
                Clique no mapa ou arraste o pin
            </div>
        </div>
    );
};
