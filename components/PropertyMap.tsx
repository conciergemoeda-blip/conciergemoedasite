import React, { useEffect, useRef } from 'react';

interface PropertyMapProps {
    lat: number;
    lng: number;
    title: string;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({ lat, lng, title }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        // Ensure Leaflet is available globally from script tag
        const L = (window as any).L;
        if (!L) return;

        // Initialize map only once
        if (mapInstance.current) {
            mapInstance.current.setView([lat, lng], 14);
            return;
        }

        // Create Map
        const map = L.map(mapRef.current, {
            center: [lat, lng],
            zoom: 14,
            scrollWheelZoom: false, // Disable scroll zoom for better UX
            zoomControl: true,
            dragging: !L.Browser.mobile, // Disable dragging on mobile initially to allow page scroll
        });

        // Add OpenStreetMap Tile Layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Custom Icon using Material Symbols
        const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
                <div class="relative flex items-center justify-center w-12 h-12 -translate-x-1/2 -translate-y-full">
                    <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg map-marker-pulse text-white z-10">
                        <span class="material-symbols-outlined text-2xl">location_on</span>
                    </div>
                    <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rotate-45 z-0"></div>
                </div>
            `,
            iconSize: [48, 48],
            iconAnchor: [24, 48],
        });

        // Add Marker
        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(`<b>${title}</b>`).openPopup();

        mapInstance.current = map;

        // Cleanup
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [lat, lng, title]);

    return (
        <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 z-0">
            <div ref={mapRef} className="w-full h-full z-0"></div>
        </div>
    );
};