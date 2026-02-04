import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PropertyCard } from '../components/PropertyCard';
import { PropertySkeleton } from '../components/PropertySkeleton';
import { EmptyState } from '../components/EmptyState';
import { useProperties } from '../hooks/useProperties';
import { useSettings } from '../contexts/SettingsContext';
import { Page, Property } from '../types';

interface HomePageProps {
    onNavigate: (page: Page) => void;
    onPropertySelect: (property: Property) => void;
}



const MAX_PRICE_RANGE = 3000;
const MIN_PRICE_GAP = 100;

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onPropertySelect }) => {
    // Use Supabase Data
    const { properties, loading, error, hasMore, loadMore } = useProperties();
    const { settings } = useSettings();

    // Basic Search States
    // Basic Search States
    // const [searchTerm, setSearchTerm] = useState(''); // Removed
    // const [locationFilter, setLocationFilter] = useState<string>(''); // Removed
    // Basic Search States
    const [guestFilter, setGuestFilter] = useState<string>(''); // For guest picker string representation

    // Parallax scroll state
    const [scrollY, setScrollY] = useState(0);

    // Calendar & Picker States
    const [isGuestPickerOpen, setIsGuestPickerOpen] = useState(false);
    const [isPricePickerOpen, setIsPricePickerOpen] = useState(false);

    const searchBoxRef = useRef<HTMLDivElement>(null);

    // Advanced Filters States
    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');

    // Derived Filter Logic (combining Supabase data with UI filters)
    const filteredProperties = properties.filter(prop => {
        // 1. Guests
        const matchesGuests = !guestFilter || prop.guests >= parseInt(guestFilter);

        // 2. Price Range
        const effectivePrice = prop.price || prop.seasonal_price || prop.weekend_price || 0;
        const matchesMinPrice = !minPrice || effectivePrice >= parseInt(minPrice);
        const matchesMaxPrice = !maxPrice || effectivePrice <= parseInt(maxPrice);

        // 3. Active Status
        const isActive = !prop.tags.includes('Pausado' as any);

        return matchesGuests && matchesMinPrice && matchesMaxPrice && isActive;
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

    const handleApplyFilters = () => {
        setIsGuestPickerOpen(false);
        setIsPricePickerOpen(false);
        // Smooth scroll to results
        setTimeout(() => {
            document.getElementById('properties-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const clearAllFilters = () => {
        setGuestFilter('');
        setMinPrice('');
        setMaxPrice('');
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
                                backgroundImage: `url("${settings.bannerUrl || 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=70&w=1400&auto=format&fit=crop'}")`,
                                transform: `translateY(${scrollY * 0.5}px)`, // Parallax effect
                                filter: 'brightness(0.8)'
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
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-white whitespace-nowrap">Moeda MG</span>
                        </h1>

                        <p className="text-base md:text-xl text-gray-200 max-w-xl font-light leading-relaxed mx-auto">
                            Descubra refúgios inesquecíveis. A melhor curadoria de imóveis para conectar-se com a natureza.
                        </p>
                    </div>

                    {/* Mobile-First Search Box - Absolute on Desktop */}
                    <div className="w-full max-w-4xl mx-auto relative z-20 md:absolute md:bottom-12 md:left-1/2 md:-translate-x-1/2 px-4 md:px-0">
                        <div ref={searchBoxRef} className="w-full bg-white rounded-3xl p-2 shadow-2xl flex flex-col md:flex-row items-stretch gap-2 animate-fade-in-up delay-100 text-left">

                            {/* Location Input with Autocomplete */}



                            {/* Guests - Picker */}
                            <div className="flex-1 px-4 md:px-6 py-2 md:py-3 w-full border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group relative">
                                <div
                                    className="w-full h-full"
                                    onClick={() => { setIsGuestPickerOpen(true); setIsPricePickerOpen(false); }}
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
                                        <div
                                            className="fixed inset-0 bg-black/5 z-[60] backdrop-blur-[1px]"
                                            onClick={() => setIsGuestPickerOpen(false)}
                                        ></div>

                                        <div className="absolute top-[calc(100%+16px)] left-0 w-[300px] bg-white rounded-3xl shadow-2xl z-[70] overflow-hidden animate-fade-in-up border border-gray-100 p-6">

                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-bold text-lg text-gray-900">Quem vai?</h3>
                                                <div className="flex gap-2">
                                                    {currentGuests > 0 && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setGuestFilter(''); }}
                                                            className="px-3 py-1 text-xs font-bold text-gray-500 hover:text-gray-900 underline transition-colors"
                                                        >
                                                            Limpar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setIsGuestPickerOpen(false); }}
                                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-gray-400">close</span>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-bold text-gray-900">Total</div>
                                                    <div className="text-xs text-gray-500">Pessoas</div>
                                                </div>
                                                <div className="flex items-center gap-3">
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
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Price - Picker (Previously Location/Filter) */}
                            <div className="flex-1 px-4 md:px-6 py-2 md:py-3 w-full border-b md:border-b-0 md:border-r border-gray-100 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group relative">
                                <div
                                    className="w-full h-full"
                                    onClick={() => { setIsPricePickerOpen(true); setIsGuestPickerOpen(false); }}
                                >
                                    <label className="block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Preço</label>
                                    <div className="flex items-center">
                                        <span className="material-symbols-outlined text-gray-400 mr-2 md:hidden">payments</span>
                                        <div className={`text-sm md:text-base font-semibold truncate ${minPrice || maxPrice ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {(minPrice || maxPrice) ? `R$ ${sliderMin} - ${sliderMax}` : 'Qualquer valor'}
                                        </div>
                                    </div>
                                </div>

                                {/* Price Picker Popover */}
                                {isPricePickerOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 bg-black/5 z-[60] backdrop-blur-[1px]"
                                            onClick={() => setIsPricePickerOpen(false)}
                                        ></div>

                                        <div className="absolute top-[calc(100%+16px)] left-0 md:left-auto md:right-0 w-[320px] bg-white rounded-3xl shadow-2xl z-[70] overflow-hidden animate-fade-in-up border border-gray-100 p-6">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="font-bold text-lg text-gray-900">Faixa de Preço</h3>
                                                <div className="flex gap-2">
                                                    {(sliderMin > 0 || sliderMax < MAX_PRICE_RANGE) && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setMinPrice('');
                                                                setMaxPrice('');
                                                            }}
                                                            className="px-3 py-1 text-xs font-bold text-gray-500 hover:text-gray-900 underline transition-colors"
                                                        >
                                                            Limpar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setIsPricePickerOpen(false); }}
                                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-gray-400">close</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Price Slider Logic */}
                                            <div className="relative w-full h-12 flex items-center justify-center px-1 mb-2">
                                                <div className="absolute w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary absolute top-0"
                                                        style={{
                                                            left: `${(sliderMin / MAX_PRICE_RANGE) * 100}%`,
                                                            right: `${100 - (sliderMax / MAX_PRICE_RANGE) * 100}%`
                                                        }}
                                                    ></div>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={MAX_PRICE_RANGE}
                                                    step="50"
                                                    value={sliderMin}
                                                    onChange={handleMinSliderChange}
                                                    className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer z-20"
                                                />
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={MAX_PRICE_RANGE}
                                                    step="50"
                                                    value={sliderMax}
                                                    onChange={handleMaxSliderChange}
                                                    className="absolute w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer z-20"
                                                />
                                            </div>

                                            <div className="flex justify-between text-xs text-gray-500 font-bold uppercase tracking-wider mb-6">
                                                <span>R$ {sliderMin}</span>
                                                <span>R$ {sliderMax}+</span>
                                            </div>

                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => setIsPricePickerOpen(false)}
                                                    className="text-xs font-bold text-primary hover:text-primary-dark underline"
                                                >
                                                    Pronto
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>


                            {/* Buttons Container */}
                            <div className="p-1.5">
                                {/* Search Button */}
                                <button
                                    onClick={handleApplyFilters}
                                    className="bg-primary hover:bg-primary-dark text-white rounded-2xl px-8 h-full transition-all active:scale-95 w-full md:w-auto flex items-center justify-center gap-2 font-bold shadow-lg min-h-[56px] min-w-[140px]"
                                >
                                    <span className="material-symbols-outlined">search</span>
                                    <span>Buscar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section >

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
                    {hasMore && (
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
                                <span className="material-symbols-outlined text-3xl icon-filled group-hover:text-white transition-colors">handshake</span>
                            </div>
                            <h3 className="font-bold text-xl mb-3 group-hover:text-secondary transition-colors">Negociação Direta</h3>
                            <p className="text-gray-500 leading-relaxed">Sem intermediários. Combine valores, datas e detalhes diretamente com o proprietário.</p>
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