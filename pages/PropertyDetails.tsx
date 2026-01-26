import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Property } from '../types';
import { Calendar } from '../components/Calendar';
import { PropertyMap } from '../components/PropertyMap';
import { ReviewSection } from '../components/ReviewSection';

interface PropertyDetailsProps {
    property: Property;
    onBack: () => void;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property, onBack }) => {
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [checkIn, setCheckIn] = useState<Date | null>(null);
    const [checkOut, setCheckOut] = useState<Date | null>(null);

    // Widget State
    const [isWidgetCalendarOpen, setIsWidgetCalendarOpen] = useState(false);
    const widgetRef = useRef<HTMLDivElement>(null);

    // Interaction States
    const [showShareToast, setShowShareToast] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Pricing Constants
    const CLEANING_FEE = 150;

    // Click Outside Listener to close widget calendar
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
                setIsWidgetCalendarOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Calendar Logic
    const handleDateSelect = (date: Date) => {
        if (!checkIn || (checkIn && checkOut)) {
            setCheckIn(date);
            setCheckOut(null);
        } else {
            // If clicking before checkin, reset start date
            if (date < checkIn) {
                setCheckIn(date);
            } else if (date.getTime() === checkIn.getTime()) {
                // Clicked same day twice? maybe allow deselect or just ignore. 
                // For now, let's treat it as resetting checkin to ensure 1 night min
                setCheckIn(date);
                setCheckOut(null);
            } else {
                setCheckOut(date);
            }
        }
    };

    const clearDates = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCheckIn(null);
        setCheckOut(null);
    };

    const nightsCount = useMemo(() => {
        if (checkIn && checkOut) {
            const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        return 0;
    }, [checkIn, checkOut]);

    const totalPrice = useMemo(() => {
        const nights = nightsCount > 0 ? nightsCount : 0;
        return (nights * property.price) + CLEANING_FEE;
    }, [nightsCount, property.price]);

    // Format Date Helper
    const formatDate = (date: Date | null) => {
        if (!date) return 'Adicionar data';
        return date.toLocaleDateString('pt-BR');
    };

    const formatCurrency = (val: number) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // WhatsApp Message Logic
    const openWhatsApp = () => {
        let message = `Olá! Gostaria de reservar o imóvel *${property.title}*.`;
        message += `\n\n📅 *Datas:* ${formatDate(checkIn)} a ${formatDate(checkOut)} (${nightsCount} noites)`;
        message += `\n💰 *Valor Estimado:* ${formatCurrency(totalPrice)}`;

        const encoded = encodeURIComponent(message);

        // Redirects to the specific property owner's phone number
        window.open(`https://wa.me/${property.ownerPhone}?text=${encoded}`, '_blank');
    };

    const handleReserveClick = () => {
        if (!checkIn || !checkOut) {
            setIsWidgetCalendarOpen(true);
            return;
        }
        openWhatsApp();
    };

    const handleMobileReserve = () => {
        if (!checkIn || !checkOut) {
            document.getElementById('availability-section')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            openWhatsApp();
        }
    };

    // Share Functionality
    const handleShare = async () => {
        const shareData = {
            title: property.title,
            text: `Dê uma olhada neste imóvel incrível: ${property.title} em ${property.location}.`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback for browsers that don't support navigator.share
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                setShowShareToast(true);
                setTimeout(() => setShowShareToast(false), 3000);
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const toggleSave = () => {
        setIsSaved(!isSaved);
    };

    // SEO: Dynamic Title
    useEffect(() => {
        if (property.title) {
            document.title = `${property.title} | Concierge Moeda`;
        }
        return () => {
            document.title = "Concierge Moeda"; // Reset on unmount
        };
    }, [property.title]);

    return (
        <div className="bg-white min-h-screen pb-32 lg:pb-20 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Breadcrumb / Back */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary mb-6 transition-colors"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Voltar para busca
                </button>

                {/* Title Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                    <div>
                        <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 mb-2">{property.title}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1 font-bold text-gray-900">
                                <span className="material-symbols-outlined text-secondary text-sm icon-filled">star</span>
                                {property.rating}
                            </span>
                            <button
                                onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })}
                                className="underline decoration-gray-300 hover:text-gray-900 transition-colors"
                            >
                                {property.reviews} avaliações
                            </button>
                            <span>•</span>
                            <span className="font-medium underline decoration-gray-300">{property.location}</span>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors active:scale-95"
                        >
                            <span className="material-symbols-outlined text-lg">ios_share</span> Compartilhar
                        </button>
                        <button
                            onClick={toggleSave}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold transition-colors active:scale-95 ${isSaved ? 'bg-red-50 border-red-200 text-red-600' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                            <span className={`material-symbols-outlined text-lg ${isSaved ? 'icon-filled' : ''}`}>favorite</span>
                            {isSaved ? 'Salvo' : 'Salvar'}
                        </button>
                    </div>
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-2 h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-sm mb-12">
                    <div
                        className="col-span-1 md:col-span-2 row-span-2 relative group cursor-pointer"
                        onClick={() => setIsGalleryOpen(true)}
                    >
                        <img src={property.imageUrl} alt="Main" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                    </div>
                    {property.gallery.map((img, idx) => (
                        <div
                            key={idx}
                            className="relative group cursor-pointer overflow-hidden"
                            onClick={() => setIsGalleryOpen(true)}
                        >
                            <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        </div>
                    ))}
                    {/* Fallback mock images if gallery is short */}
                    {/* Fallback mock images removed */}
                    <button
                        onClick={() => setIsGalleryOpen(true)}
                        className="absolute bottom-6 right-6 bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:scale-105 transition-transform z-10"
                    >
                        Mostrar todas as fotos
                    </button>
                </div>

                {/* Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">

                    {/* Left Column: Details */}
                    <div className="lg:col-span-2">

                        {/* Host Info - Header */}
                        <div className="flex justify-between items-center py-8 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Hospedado por {property.owner.name}</h2>
                                <p className="text-gray-500 mt-1">
                                    {property.guests} hóspedes · {property.bedrooms} quartos · {property.beds} camas · {property.baths} banheiros
                                </p>
                            </div>
                            <div className="h-14 w-14 rounded-full overflow-hidden border border-gray-100 shadow-sm">
                                <img src={property.owner.avatar} alt={property.owner.name} className="w-full h-full object-cover" />
                            </div>
                        </div>

                        {/* Highlights */}
                        <div className="py-8 border-b border-gray-100 space-y-6">
                            <div className="flex gap-4">
                                <span className="material-symbols-outlined text-gray-900 text-2xl">workspace_premium</span>
                                <div>
                                    <h3 className="font-bold text-gray-900">Reserva Direta</h3>
                                    <p className="text-gray-500 text-sm">Negocie diretamente com o dono do imóvel via WhatsApp.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="material-symbols-outlined text-gray-900 text-2xl">location_on</span>
                                <div>
                                    <h3 className="font-bold text-gray-900">Localização Privilegiada</h3>
                                    <p className="text-gray-500 text-sm">Próximo às principais cachoeiras e restaurantes de Moeda.</p>
                                </div>
                            </div>
                            {property.owner.isSuperhost && (
                                <div className="flex gap-4">
                                    <span className="material-symbols-outlined text-gray-900 text-2xl">verified_user</span>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{property.owner.name} é Superhost</h3>
                                        <p className="text-gray-500 text-sm">Superhosts são anfitriões experientes e muito bem avaliados.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="py-8 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre este lugar</h2>
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                {property.description}

                                <br /><br />
                                Um refúgio perfeito para quem busca conexão com a natureza, silêncio e ar puro. A casa dispõe de internet de alta velocidade, perfeita para home office com vista para as montanhas.
                            </p>
                        </div>

                        {/* Amenities */}
                        <div className="py-8 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">O que esse lugar oferece</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                {property.amenities.map(amenity => (
                                    <div key={amenity} className="flex items-center gap-3 text-gray-700">
                                        <span className="material-symbols-outlined text-2xl text-primary">check_circle</span>
                                        <span>{amenity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Owner Profile Detailed Section */}
                        <div className="py-8 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Conheça seu anfitrião</h2>

                            <div className="bg-gray-50 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
                                {/* Profile Card */}
                                <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center min-w-[200px] w-full md:w-auto relative overflow-hidden">
                                    {property.owner.isSuperhost && (
                                        <div className="absolute top-0 right-0 bg-secondary text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                                            SUPERHOST
                                        </div>
                                    )}
                                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-gray-50">
                                        <img src={property.owner.avatar} alt={property.owner.name} className="w-full h-full object-cover" />
                                    </div>
                                    <h3 className="font-bold text-xl text-gray-900 mb-1">{property.owner.name}</h3>
                                    <p className="text-xs text-gray-500 font-medium mb-4">{property.owner.joinedDate}</p>

                                    {property.owner.isSuperhost && (
                                        <div className="flex items-center gap-1 text-xs font-bold text-gray-900 mb-1">
                                            <span className="material-symbols-outlined text-secondary text-sm icon-filled">verified</span>
                                            Identidade Verificada
                                        </div>
                                    )}
                                </div>

                                {/* Stats & Info */}
                                <div className="flex-1 space-y-6">
                                    <div className="flex flex-wrap gap-6">
                                        <div>
                                            <div className="font-bold text-gray-900 text-lg">{property.rating}</div>
                                            <div className="text-xs text-gray-500">Avaliação</div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-lg">{property.reviews}</div>
                                            <div className="text-xs text-gray-500">Comentários</div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-lg">{property.owner.responseRate}</div>
                                            <div className="text-xs text-gray-500">Taxa de resposta</div>
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-lg">{property.owner.responseTime}</div>
                                            <div className="text-xs text-gray-500">Tempo de resposta</div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-6">
                                        {property.owner.bio && (
                                            <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">
                                                "{property.owner.bio}"
                                            </p>
                                        )}

                                        <button
                                            onClick={openWhatsApp}
                                            className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-lg flex items-center gap-2 w-fit active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-lg">chat</span>
                                            Falar com o Anfitrião
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                                        <span className="material-symbols-outlined text-sm">shield</span>
                                        Para sua segurança, pague sempre através do Concierge Moeda.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="py-8 border-b border-gray-100">
                            <ReviewSection propertyId={property.id} propertyName={property.title} />
                        </div>

                        {/* Location / Map Section */}
                        <div className="py-8 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Onde você vai estar</h2>
                            <p className="text-gray-500 mb-6">{property.location}</p>

                            {property.coordinates ? (
                                <PropertyMap
                                    lat={property.coordinates.lat}
                                    lng={property.coordinates.lng}
                                    title={property.title}
                                />
                            ) : (
                                <div className="bg-gray-100 rounded-2xl h-[300px] flex items-center justify-center text-gray-400">
                                    Mapa indisponível
                                </div>
                            )}
                        </div>

                        {/* Availability Section */}
                        <div id="availability-section" className="py-8">
                            <div className="flex justify-between items-baseline mb-2">
                                <h2 className="text-2xl font-bold text-gray-900">Disponibilidade</h2>
                                {(checkIn || checkOut) && (
                                    <button onClick={clearDates} className="text-sm font-bold text-gray-500 underline hover:text-gray-900">
                                        Limpar datas
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-500 mb-6">Selecione as datas de check-in e check-out</p>

                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                {/* Larger Static Calendar */}
                                <Calendar
                                    checkIn={checkIn}
                                    checkOut={checkOut}
                                    onDateSelect={handleDateSelect}
                                    className="w-full max-w-md border border-gray-200 rounded-2xl p-6 shadow-sm"
                                />

                                {/* Visual Trip Summary Card */}
                                <div className="flex-1 w-full bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">event_available</span>
                                        Resumo da Viagem
                                    </h4>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                            <div className="text-xs text-gray-500 uppercase font-bold">Check-in</div>
                                            <div className="font-medium text-gray-900">{checkIn ? checkIn.toLocaleDateString('pt-BR') : '-'}</div>
                                        </div>

                                        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                            <div className="text-xs text-gray-500 uppercase font-bold">Check-out</div>
                                            <div className="font-medium text-gray-900">{checkOut ? checkOut.toLocaleDateString('pt-BR') : '-'}</div>
                                        </div>

                                        {nightsCount > 0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">Total de noites</span>
                                                    <span className="text-2xl font-bold text-primary">{nightsCount}</span>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1 text-right">Aproveite seus dias em Moeda!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Floating Card (Hidden on Mobile) */}
                    <div className="relative hidden lg:block">
                        <div ref={widgetRef} className="sticky top-28 bg-white rounded-2xl shadow-xl border border-gray-200 p-6 z-20">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <span className="text-2xl font-bold text-gray-900">R$ {property.price}</span>
                                    <span className="text-gray-500"> / noite</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <span className="material-symbols-outlined text-secondary text-sm icon-filled">star</span>
                                    <span className="font-bold text-gray-900">{property.rating}</span>
                                </div>
                            </div>

                            {/* Integrated Date Picker / Inputs */}
                            <div className="relative border border-gray-300 rounded-xl mb-4">
                                <div
                                    className="grid grid-cols-2"
                                    onClick={() => setIsWidgetCalendarOpen(true)}
                                >
                                    <div className="p-3 border-r border-gray-300 cursor-pointer hover:bg-gray-50 rounded-tl-xl rounded-bl-xl">
                                        <label className="block text-[10px] font-bold uppercase text-gray-800">Check-in</label>
                                        <span className={`text-sm ${checkIn ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                                            {formatDate(checkIn)}
                                        </span>
                                    </div>
                                    <div className="p-3 cursor-pointer hover:bg-gray-50 rounded-tr-xl rounded-br-xl">
                                        <label className="block text-[10px] font-bold uppercase text-gray-800">Check-out</label>
                                        <span className={`text-sm ${checkOut ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                                            {formatDate(checkOut)}
                                        </span>
                                    </div>
                                </div>

                                {/* Calendar Popover */}
                                {isWidgetCalendarOpen && (
                                    <div className="absolute top-[calc(100%+12px)] right-0 left-[-16px] w-[calc(100%+32px)] md:left-0 md:w-full bg-white z-50 p-4 shadow-2xl border border-gray-100 rounded-2xl animate-fade-in-up">
                                        <Calendar
                                            checkIn={checkIn}
                                            checkOut={checkOut}
                                            onDateSelect={handleDateSelect}
                                            mini={true} // Slightly smaller cells for widget
                                            className="w-full"
                                        />
                                        <div className="flex justify-between items-center mt-4 border-t border-gray-100 pt-3">
                                            <button
                                                onClick={clearDates}
                                                className="text-xs font-bold text-gray-500 underline hover:text-gray-900"
                                            >
                                                Limpar datas
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setIsWidgetCalendarOpen(false); }}
                                                className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-black"
                                            >
                                                Fechar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border border-gray-300 rounded-xl overflow-hidden mb-4 p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-gray-800">Hóspedes</label>
                                    <span className="text-sm text-gray-600">{property.guests} máx</span>
                                </div>
                                <span className="material-symbols-outlined text-gray-400">expand_more</span>
                            </div>

                            <button
                                onClick={handleReserveClick}
                                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 px-6 rounded-xl font-bold text-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2 mb-4"
                            >
                                {checkIn && checkOut ? 'Reservar' : 'Verificar Disponibilidade'}
                            </button>

                            <p className="text-center text-xs text-gray-500 mb-6">
                                Você não será cobrado agora. Fale diretamente com o proprietário.
                            </p>

                            {/* Dynamic Pricing */}
                            {checkIn && checkOut && nightsCount > 0 ? (
                                <div className="space-y-3 text-gray-600 text-sm animate-fade-in">
                                    <div className="flex justify-between">
                                        <span className="underline">R$ {property.price} x {nightsCount} noites</span>
                                        <span>{formatCurrency(property.price * nightsCount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="underline">Taxa de limpeza</span>
                                        <span>{formatCurrency(CLEANING_FEE)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg text-gray-900 pt-4 border-t border-gray-100 mt-4">
                                        <span>Total Estimado</span>
                                        <span>{formatCurrency(totalPrice)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-sm text-gray-400 py-4 border-t border-gray-100 mt-4">
                                    Selecione datas para ver o orçamento
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Fixed Bottom Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 px-6 z-50 lg:hidden flex justify-between items-center pb-8 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-gray-900">
                                {checkIn && checkOut ? formatCurrency(totalPrice) : `R$ ${property.price}`}
                            </span>
                            {!checkIn && !checkOut && <span className="text-xs text-gray-500">/ noite</span>}
                        </div>
                        {checkIn && checkOut ? (
                            <span className="text-xs text-gray-600 font-medium underline decoration-gray-300">
                                {nightsCount} noites · Taxas inclusas
                            </span>
                        ) : (
                            <div className="flex items-center gap-1 text-xs text-gray-900 font-bold">
                                <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                                <span>Selecione as datas</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleMobileReserve}
                        className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold text-base shadow-lg active:scale-95 transition-all"
                    >
                        {checkIn && checkOut ? 'Reservar' : 'Verificar'}
                    </button>
                </div>

                {/* Gallery Modal */}
                {isGalleryOpen && (
                    <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                        <button
                            onClick={() => setIsGalleryOpen(false)}
                            className="absolute top-6 right-6 text-white hover:text-gray-300 z-10 p-2"
                        >
                            <span className="material-symbols-outlined text-3xl">close</span>
                        </button>
                        <div className="w-full max-w-5xl h-[80vh] overflow-y-auto no-scrollbar snap-y snap-mandatory">
                            <div className="space-y-4">
                                <img src={property.imageUrl} alt="Gallery 1" className="w-full rounded-lg snap-center" />
                                {property.gallery.map((img, i) => (
                                    <img key={i} src={img} alt={`Gallery ${i}`} className="w-full rounded-lg snap-center" />
                                ))}
                                {/* Extra mocks removed */}
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast Notification */}
                {showShareToast && (
                    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-xl z-[70] flex items-center gap-3 animate-fade-in-up">
                        <span className="material-symbols-outlined text-green-400">check_circle</span>
                        <span className="font-bold text-sm">Link copiado para a área de transferência!</span>
                    </div>
                )}

            </div>
        </div>
    );
};