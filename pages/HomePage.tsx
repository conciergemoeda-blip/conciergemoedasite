import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PropertyCard } from '../components/PropertyCard';
import { PropertySkeleton } from '../components/PropertySkeleton';
import { EmptyState } from '../components/EmptyState';
import { useProperties } from '../hooks/useProperties';
import { Page, Property } from '../types';

interface HomePageProps {
    onNavigate: (page: Page) => void;
    onPropertySelect: (property: Property) => void;
}

const COMMON_AMENITIES = [
    'Piscina',
    'Churrasqueira',
    'Wi-Fi',
    'Ar Condicionado',
    'Playground',
    'Vista Panorâmica',
    'Cozinha Gourmet',
    'Fogão a Lenha'
];

const POPULAR_LOCATIONS = [
    { name: 'Moeda (Cidade)', type: 'Centro', icon: 'location_city' },
    { name: 'Serra da Moeda', type: 'Região', icon: 'landscape' },
    { name: 'Taquaraçu', type: 'Povoado', icon: 'holiday_village' },
    { name: 'Barra', type: 'Povoado', icon: 'holiday_village' },
    { name: 'Sertão', type: 'Zona Rural', icon: 'nature_people' }
];

const MAX_PRICE_RANGE = 3000;
const MIN_PRICE_GAP = 100;

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onPropertySelect }) => {
    // Use Supabase Data
    const { properties, loading, error, hasMore, loadMore } = useProperties();

    // Basic Search States
    const [searchTerm, setSearchTerm] = useState(''); // Used for location generic search
    const [locationFilter, setLocationFilter] = useState<string>(''); // For location picker
    const [guestFilter, setGuestFilter] = useState<string>(''); // For guest picker string representation
    const [guestsFilter, setGuestsFilter] = useState(2); // Numeric filter logic


    // Parallax scroll state
    const [scrollY, setScrollY] = useState(0);

    // Calendar & Picker States
    const [isGuestPickerOpen, setIsGuestPickerOpen] = useState(false);
    const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);

    const searchBoxRef = useRef<HTMLDivElement>(null);

    // Advanced Filters States
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [minBaths, setMinBaths] = useState<number>(0);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

    // Derived Filter Logic (combining Supabase data with UI filters)
    const filteredProperties = properties.filter(prop => {
        // 1. Search & Location
        const searchLower = searchTerm.toLowerCase();
        const locationLower = locationFilter.toLowerCase();

        const matchesSearch = !searchTerm || prop.title.toLowerCase().includes(searchLower) || prop.location.toLowerCase().includes(searchLower);
        const matchesLocation = !locationFilter || prop.location.toLowerCase().includes(locationLower);

        // 2. Guests
        const matchesGuests = prop.guests >= (parseInt(guestFilter) || guestsFilter);

        // 3. Price Range
        const price = prop.price;
        const matchesMinPrice = !minPrice || price >= parseInt(minPrice);
        const matchesMaxPrice = !maxPrice || price <= parseInt(maxPrice);

        // 4. Specs (Baths)
        const matchesBaths = !minBaths || prop.baths >= minBaths;

        // 5. Amenities (Case insensitive check)
        const matchesAmenities = selectedAmenities.length === 0 ||
            selectedAmenities.every(filterAmenity =>
                prop.amenities?.some(a => a.toLowerCase().includes(filterAmenity.toLowerCase()))
            );

        // 6. Active Status
        const isActive = !prop.tags.includes('Pausado' as any);

        return matchesSearch && matchesLocation && matchesGuests && matchesMinPrice && matchesMaxPrice && matchesBaths && matchesAmenities && isActive;
    });

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        // We handle click outside via the backdrop now for better modal UX
        function handleClickOutside(event: MouseEvent) {
            // Logic handled by backdrops
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleAmenity = (amenity: string) => {
        if (selectedAmenities.includes(amenity)) {
            setSelectedAmenities(prev => prev.filter(a => a !== amenity));
        } else {
            setSelectedAmenities(prev => [...prev, amenity]);
        }
    };

    // Slider Handlers
    const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        const currentMax = maxPrice === '' ? MAX_PRICE_RANGE : parseInt(maxPrice);

        if (val <= currentMax - MIN_PRICE_GAP) {
            setMinPrice(val.toString());
        }
    };

    const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        const currentMin = minPrice === '' ? 0 : parseInt(minPrice);

        if (val >= currentMin + MIN_PRICE_GAP) {
            setMaxPrice(val.toString());
        }
    };

    // Guest Logic
    const handleGuestChange = (operation: 'inc' | 'dec') => {
        const current = guestFilter ? parseInt(guestFilter) : 0;
        let newValue = current;

        if (operation === 'inc') {
            newValue = current + 1;
        } else {
            newValue = Math.max(0, current - 1);
        }

        setGuestFilter(newValue > 0 ? newValue.toString() : '');
    };

    // Location Logic
    const handleLocationSelect = (locationName: string) => {
        setLocationFilter(locationName);
        setIsLocationPickerOpen(false);
    };



    const handleApplyFilters = () => {
        setIsFiltersOpen(false);
        // Smooth scroll to results
        setTimeout(() => {
            document.getElementById('properties-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const clearAllFilters = () => {
        setGuestFilter('');
        setGuestsFilter(2);
        setLocationFilter('');
        setSearchTerm('');
        setMinPrice('');
        setMaxPrice('');
        setMinBaths(0);
        setSelectedAmenities([]);
    };

    // Derived values for UI rendering
    const sliderMin = minPrice === '' ? 0 : parseInt(minPrice);
    const sliderMax = maxPrice === '' ? MAX_PRICE_RANGE : parseInt(maxPrice);
    const currentGuests = guestFilter ? parseInt(guestFilter) : 0;

    // SEO: Set Title
    useEffect(() => {
        document.title = "Aluguel de Temporada Moeda MG | Chalés e Sítios";
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative min-h-[85dvh] md:h-[85vh] w-full flex flex-col">

                {/* Hero Section with Parallax & New Brand Colors */}
                <div className="relative h-[600px] flex flex-col items-center justify-center">

                    {/* Background Wrapper - Handles Clipping for Parallax */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div
                            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000"
                            style={{
                                backgroundImage: 'url("https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=70&w=1400&auto=format&fit=crop")',
                                transform: `translateY(${scrollY * 0.5}px)` // Parallax effect
                            }}
                        ></div>

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 via-primary/10 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    </div>

                    <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-4 animate-fade-in-up pt-12 md:pt-0">
                        <div className="inline-block bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30 text-white font-bold text-sm tracking-widest uppercase mb-2 shadow-lg">
                            Moeda &bull; Minas Gerais
                        </div>

                        <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-4 leading-tight drop-shadow-2xl">
                            Sítios e Chalés em <br className="md:hidden" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-white">Moeda MG</span>
                        </h1>

                        <p className="text-base md:text-xl text-gray-200 max-w-xl font-light leading-relaxed mx-auto">
                            Descubra refúgios inesquecíveis. A melhor curadoria de imóveis para conectar-se com a natureza.
                        </p>
                    </div>

                    {/* Mobile-First Search Box - Absolute on Desktop */}
                    <div className="w-full max-w-4xl mx-auto relative z-20 md:absolute md:bottom-12 md:left-1/2 md:-translate-x-1/2 px-4 md:px-0">
                        <div ref={searchBoxRef} className="w-full bg-white rounded-3xl p-2 shadow-2xl flex flex-col md:flex-row items-stretch gap-2 animate-fade-in-up delay-100 text-left">

                            {/* Location Input with Autocomplete */}
                            <div className="flex-1 px-4 md:px-6 py-2 md:py-3 w-full border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group relative">
                                <div
                                    className="w-full h-full"
                                    onClick={() => setIsLocationPickerOpen(true)}
                                >
                                    <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Onde</label>
                                    <div className="flex items-center">
                                        <span className="material-symbols-outlined text-gray-400 mr-2 md:hidden">location_on</span>
                                        <input
                                            type="text"
                                            placeholder="Buscar destinos"
                                            className="w-full bg-transparent font-semibold text-gray-900 placeholder-gray-400 focus:outline-none text-sm md:text-base cursor-pointer"
                                            value={locationFilter}
                                            onChange={(e) => setLocationFilter(e.target.value)}
                                            autoComplete="off"
                                        />
                                        {locationFilter && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setLocationFilter(''); }}
                                                className="p-1 hover:bg-gray-200 rounded-full text-gray-400"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Location Dropdown */}
                                {isLocationPickerOpen && (
                                    <>
                                        {/* Backdrop */}
                                        <div
                                            className="fixed inset-0 z-[60] md:hidden"
                                            onClick={() => setIsLocationPickerOpen(false)}
                                        ></div>

                                        <div className="absolute top-[calc(100%+16px)] left-0 w-full md:w-[350px] bg-white rounded-3xl shadow-2xl z-[70] overflow-hidden animate-fade-in-up py-2 border border-gray-100">
                                            <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Destinos Populares</div>

                                            <div
                                                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                                onClick={() => handleLocationSelect('')}
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                    <span className="material-symbols-outlined">map</span>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">Qualquer lugar</div>
                                                    <div className="text-xs text-gray-500">Explorar toda a região</div>
                                                </div>
                                            </div>

                                            {POPULAR_LOCATIONS.filter(loc => loc.name.toLowerCase().includes(locationFilter.toLowerCase())).map((loc) => (
                                                <div
                                                    key={loc.name}
                                                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                                    onClick={() => handleLocationSelect(loc.name)}
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                                                        <span className="material-symbols-outlined">{loc.icon}</span>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900">{loc.name}</div>
                                                        <div className="text-xs text-gray-500">{loc.type}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>


                            {/* Guests - Replaced Input with Stepper Popover */}
                            <div className="flex-1 px-4 md:px-6 py-2 md:py-3 w-full border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group relative">
                                <div
                                    className="w-full h-full"
                                    onClick={() => setIsGuestPickerOpen(true)}
                                >
                                    <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Hóspedes</label>
                                    <div className="flex items-center">
                                        <span className="material-symbols-outlined text-gray-400 mr-2 md:hidden">group</span>
                                        <div className={`text-sm md:text-base font-semibold truncate ${currentGuests > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {currentGuests > 0 ? `${currentGuests} hóspedes` : 'Quantos?'}
                                        </div>
                                    </div>
                                </div>

                                {/* Guest Picker Popover */}
                                {isGuestPickerOpen && (
                                    <>
                                        {/* Backdrop */}
                                        <div
                                            className="fixed inset-0 bg-black/30 z-[60] backdrop-blur-[2px] transition-opacity"
                                            onClick={() => setIsGuestPickerOpen(false)}
                                        ></div>

                                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[350px] md:absolute md:top-[calc(100%+16px)] md:left-auto md:right-0 md:translate-y-0 md:translate-x-0 md:w-[350px] bg-white rounded-3xl shadow-2xl z-[70] overflow-hidden animate-fade-in-up">
                                            <div className="p-6">
                                                <div className="flex justify-between items-center mb-6">
                                                    <h3 className="font-bold text-lg text-gray-900">Quem vai?</h3>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setIsGuestPickerOpen(false); }}
                                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-gray-500">close</span>
                                                    </button>
                                                </div>

                                                <div className="flex justify-between items-center py-4 border-b border-gray-100">
                                                    <div>
                                                        <div className="font-bold text-gray-900">Hóspedes</div>
                                                        <div className="text-sm text-gray-500">Adultos e crianças</div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleGuestChange('dec'); }}
                                                            className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${currentGuests <= 0 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-400 text-gray-600 hover:border-gray-900 hover:text-gray-900'}`}
                                                            disabled={currentGuests <= 0}
                                                        >
                                                            <span className="material-symbols-outlined text-sm">remove</span>
                                                        </button>

                                                        <span className="text-gray-900 font-bold w-4 text-center">{currentGuests}</span>

                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleGuestChange('inc'); }}
                                                            className="w-8 h-8 rounded-full border border-gray-400 text-gray-600 hover:border-gray-900 hover:text-gray-900 flex items-center justify-center transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">add</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mt-6 flex justify-end">
                                                    <button
                                                        onClick={() => setIsGuestPickerOpen(false)}
                                                        className="bg-gray-900 text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-black transition-colors shadow-lg active:scale-95"
                                                    >
                                                        Confirmar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Buttons Container */}
                            <div className="flex flex-row md:items-center gap-2 p-1 mt-2 md:mt-0">
                                {/* Filter Button */}
                                <button
                                    onClick={() => setIsFiltersOpen(true)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl p-4 md:p-4 flex-1 md:flex-none transition-colors flex items-center justify-center relative active:scale-95"
                                    title="Filtros Avançados"
                                >
                                    <span className="material-symbols-outlined">tune</span>
                                    {(minPrice || maxPrice || minBaths > 0 || selectedAmenities.length > 0) && (
                                        <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-white"></span>
                                    )}
                                </button>

                                {/* Search Button */}
                                <button
                                    onClick={handleApplyFilters}
                                    className="bg-primary hover:bg-primary-dark text-white rounded-2xl p-4 md:px-8 flex-[3] md:flex-auto transition-all active:scale-95 w-full md:w-auto flex items-center justify-center gap-2 font-bold shadow-lg"
                                >
                                    <span className="material-symbols-outlined">search</span>
                                    <span className="hidden md:inline">Buscar</span>
                                    <span className="md:hidden">Buscar Imóveis</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section >

            {/* Advanced Filters Modal */}
            {
                isFiltersOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsFiltersOpen(false)}></div>
                        <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in-up">
                            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
                                <button onClick={() => setIsFiltersOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                                <h2 className="text-xl font-bold font-serif">Filtros Avançados</h2>
                                <button onClick={clearAllFilters} className="text-sm font-bold text-gray-500 hover:text-gray-900 underline">
                                    Limpar
                                </button>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* Price Range Slider */}
                                <div>
                                    <div className="flex justify-between items-end mb-6">
                                        <h3 className="text-lg font-bold text-gray-900">Faixa de Preço (diária)</h3>
                                        <div className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                                            R$ {sliderMin} - R$ {sliderMax}+
                                        </div>
                                    </div>

                                    {/* Dual Slider Container */}
                                    <div className="relative w-full h-12 flex items-center justify-center px-2">
                                        {/* Visual Track Background */}
                                        <div className="absolute w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                            {/* Active Selection Color */}
                                            <div
                                                className="h-full bg-primary absolute top-0"
                                                style={{
                                                    left: `${(sliderMin / MAX_PRICE_RANGE) * 100}%`,
                                                    right: `${100 - (sliderMax / MAX_PRICE_RANGE) * 100}%`
                                                }}
                                            ></div>
                                        </div>

                                        {/* Range Inputs (stacked) */}
                                        <input
                                            type="range"
                                            min="0"
                                            max={MAX_PRICE_RANGE}
                                            step="50"
                                            value={sliderMin}
                                            onChange={handleMinSliderChange}
                                            className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer z-20"
                                        />
                                        <input
                                            type="range"
                                            min="0"
                                            max={MAX_PRICE_RANGE}
                                            step="50"
                                            value={sliderMax}
                                            onChange={handleMaxSliderChange}
                                            className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer z-20"
                                        />
                                    </div>

                                    <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-wider mt-[-10px]">
                                        <span>R$ 0</span>
                                        <span>R$ {MAX_PRICE_RANGE}+</span>
                                    </div>
                                </div>

                                {/* Rooms and Beds */}
                                <div className="border-t border-gray-100 pt-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Banheiros</h3>
                                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                        {[0, 1, 2, 3, 4, 5].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => setMinBaths(num)}
                                                className={`px-6 py-2 rounded-full text-sm font-bold border transition-all whitespace-nowrap ${minBaths === num
                                                    ? 'bg-gray-900 text-white border-gray-900'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
                                                    }`}
                                            >
                                                {num === 0 ? 'Qualquer' : `${num}+`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Amenities */}
                                <div className="border-t border-gray-100 pt-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Comodidades</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {COMMON_AMENITIES.map(amenity => (
                                            <label key={amenity} className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${selectedAmenities.includes(amenity) ? 'bg-primary border-primary' : 'border-gray-300 group-hover:border-gray-400'
                                                    }`}>
                                                    {selectedAmenities.includes(amenity) && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={selectedAmenities.includes(amenity)}
                                                    onChange={() => toggleAmenity(amenity)}
                                                />
                                                <span className="text-gray-700">{amenity}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6">
                                <button
                                    onClick={handleApplyFilters}
                                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-lg py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.01]"
                                >
                                    Mostrar Resultados
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Featured Properties */}
            <section id="properties-section" className="py-12 md:py-20 bg-background-light">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-8 md:mb-12">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-2 md:mb-3">
                                {loading ? 'Carregando Imóveis...' : (filteredProperties.length < properties.length ? 'Resultados da Busca' : 'Destaques da Coleção')}
                            </h2>
                            <p className="text-gray-500 text-sm md:text-base max-w-2xl">
                                {loading ? 'Buscando as melhores opções para você.' : 'Descubra propriedades exclusivas selecionadas para proporcionar momentos inesquecíveis.'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                        {loading && properties.length === 0 ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <PropertySkeleton key={i} />
                            ))
                        ) : filteredProperties.length > 0 ? (
                            <>
                                {filteredProperties.map((property, index) => (
                                    <div key={property.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                                        <PropertyCard
                                            property={property}
                                            onClick={() => onPropertySelect(property)} // Corrected prop
                                        />
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="col-span-full">
                                <EmptyState
                                    onReset={clearAllFilters}
                                    title="Nenhum imóvel encontrado"
                                    message="Tente ajustar seus filtros para encontrar o que procura."
                                />
                            </div>
                        )}
                    </div>

                    {/* Load More Button */}
                    {hasMore && !searchTerm && !locationFilter && (
                        <div className="mt-12 text-center">
                            <button
                                onClick={loadMore}
                                disabled={loading}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-gray-200 rounded-full text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                        Carregando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">add</span>
                                        Ver mais imóveis
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Features/Trust Section */}
            <section id="features-section" className="py-16 md:py-24 bg-white border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        {/* Feature 1 */}
                        <div className="flex flex-col items-center group animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:shadow-lg">
                                <span className="material-symbols-outlined text-3xl icon-filled group-hover:text-white transition-colors">verified_user</span>
                            </div>
                            <h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">Curadoria Premium</h3>
                            <p className="text-gray-500 leading-relaxed">Propriedades selecionadas e verificadas presencialmente para sua total tranquilidade.</p>
                        </div>

                        {/* Feature 2 */}
                        <div className="flex flex-col items-center group animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center text-secondary mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-secondary group-hover:shadow-lg">
                                <span className="material-symbols-outlined text-3xl icon-filled group-hover:text-white transition-colors">forum</span>
                            </div>
                            <h3 className="font-bold text-xl mb-3 group-hover:text-secondary transition-colors">Suporte Personalizado</h3>
                            <p className="text-gray-500 leading-relaxed">Tire dúvidas e receba indicações sobre a região diretamente pelo nosso WhatsApp.</p>
                        </div>

                        {/* Feature 3 */}
                        <div className="flex flex-col items-center group animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:shadow-lg">
                                <span className="material-symbols-outlined text-3xl icon-filled group-hover:text-white transition-colors">spa</span>
                            </div>
                            <h3 className="font-bold text-xl mb-3 group-hover:text-primary transition-colors">Experiências Locais</h3>
                            <p className="text-gray-500 leading-relaxed">Dicas exclusivas de cachoeiras, restaurantes e trilhas em Moeda.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};