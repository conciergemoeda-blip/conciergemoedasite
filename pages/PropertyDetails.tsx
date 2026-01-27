import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Property } from '../types';
import { PropertyMap } from '../components/PropertyMap';
import { ReviewSection } from '../components/ReviewSection';

interface PropertyDetailsProps {
    property: Property;
    onBack: () => void;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property, onBack }) => {
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Combine main image + gallery for the lightbox
    const allImages = [property.imageUrl, ...property.gallery];

    const openGallery = (index: number) => {
        setCurrentImageIndex(index);
        setIsGalleryOpen(true);
    };

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    // Swipe Handlers
    const minSwipeDistance = 50;
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        if (isLeftSwipe) {
            setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
        }
        if (isRightSwipe) {
            setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
        }
    };
    // Widget State
    const [isWidgetCalendarOpen, setIsWidgetCalendarOpen] = useState(false);
    const widgetRef = useRef<HTMLDivElement>(null);

    // Interaction States
    const [showShareToast, setShowShareToast] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const formatCurrency = (val: number) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // WhatsApp Message Logic
    const openWhatsApp = () => {
        let message = `Olá! Gostaria de reservar o imóvel *${property.title}*.`;
        const encoded = encodeURIComponent(message);

        // Redirects to the specific property owner's phone number
        window.open(`https://wa.me/${property.ownerPhone}?text=${encoded}`, '_blank');
    };

    const handleReserveClick = () => {
        openWhatsApp();
    };

    const handleMobileReserve = () => {
        openWhatsApp();
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

    // SEO and Scroll Management
    useEffect(() => {
        window.scrollTo(0, 0);

        if (property) {
            const seoTitle = `${property.title} | Aluguel em Moeda, MG`;
            const seoDesc = `Reserve o ${property.title} em Moeda. ${property.description.substring(0, 150)}...`;

            document.title = seoTitle;

            // Update meta description
            const metaDesc = document.querySelector('meta[name="description"]');
            if (metaDesc) {
                metaDesc.setAttribute('content', seoDesc);
            }

            // Update Open Graph tags
            const ogTitle = document.querySelector('meta[property="og:title"]');
            const ogImage = document.querySelector('meta[property="og:image"]');
            if (ogTitle) ogTitle.setAttribute('content', seoTitle);
            if (ogImage) ogImage.setAttribute('content', property.imageUrl);
        }
        return () => {
            document.title = "Concierge Moeda"; // Reset on unmount
        };
    }, [property]);

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
                {/* Responsive Gallery Grid */}
                <div className="relative h-[300px] md:h-[500px] mb-8 md:mb-12 rounded-2xl overflow-hidden shadow-sm md:grid md:grid-cols-4 md:grid-rows-2 md:gap-2">
                    {/* Main Hero Image */}
                    <div
                        className="w-full h-full md:col-span-2 md:row-span-2 relative group cursor-pointer"
                        onClick={() => openGallery(0)}
                    >
                        <img
                            src={property.imageUrl}
                            alt="Capa"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                    </div>

                    {/* Side Images (Desktop Only) - Limit to 4 */}
                    {property.gallery.slice(0, 4).map((img, idx) => (
                        <div
                            key={idx}
                            className="hidden md:block relative group cursor-pointer overflow-hidden"
                            onClick={() => openGallery(idx + 1)}
                        >
                            <img src={img} alt={`Galeria ${idx}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        </div>
                    ))}

                    {/* View All Button */}
                    <button
                        onClick={() => openGallery(0)}
                        className="absolute bottom-4 right-4 bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:scale-105 transition-transform z-10 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">grid_view</span>
                        <span className="hidden sm:inline">Mostrar todas as fotos</span>
                        <span className="sm:hidden">Fotos</span>
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
                                            <p className="text-gray-600 text-sm leading-relaxed mb-2 italic">
                                                "{property.owner.bio}"
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                                        <span className="material-symbols-outlined text-sm">info</span>
                                        O Concierge Moeda é uma vitrine curada. A negociação e o pagamento são feitos diretamente com o proprietário.
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


                    </div>

                    {/* Right Column: Floating Card (Hidden on Mobile) */}
                    <div className="relative hidden lg:block">
                        <div ref={widgetRef} className="sticky top-28 bg-white rounded-2xl shadow-xl border border-gray-200 p-6 z-20">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <span className="text-2xl font-bold text-gray-900">R$ {property.price}</span>
                                    <span className="text-gray-500"> / diária</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <span className="material-symbols-outlined text-secondary text-sm icon-filled">star</span>
                                    <span className="font-bold text-gray-900">{property.rating}</span>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Diária (Seg a Qui)</span>
                                    <span className="font-bold text-gray-900">R$ {property.price}</span>
                                </div>
                                {property.weekend_price && property.weekend_price > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Final de Semana</span>
                                        <span className="font-bold text-gray-900">R$ {property.weekend_price}</span>
                                    </div>
                                )}
                                {property.cleaning_fee && property.cleaning_fee > 0 && (
                                    <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                                        <span className="text-gray-500 font-medium">Taxa de Limpeza</span>
                                        <span className="font-bold text-gray-900 text-xs">R$ {property.cleaning_fee} (única)</span>
                                    </div>
                                )}
                                {property.min_stay && property.min_stay > 1 && (
                                    <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                                        <span className="text-gray-500 font-medium">Estadia Mínima</span>
                                        <span className="font-bold text-gray-900 text-xs">{property.min_stay} diárias</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleReserveClick}
                                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 px-6 rounded-xl font-bold text-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2 mb-4"
                            >
                                Reservar via WhatsApp
                            </button>

                            <p className="text-center text-xs text-gray-500 mb-6">
                                Você falará diretamente com o proprietário para acertar as datas e pagamento.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Mobile Floating Booking Bar */}
                <div className="fixed bottom-6 left-4 right-4 bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 z-50 lg:hidden animate-fade-in-up">
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center px-1">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-bold text-gray-900">
                                    R$ {property.price}
                                </span>
                                <span className="text-xs text-gray-500">/ diária</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600 font-bold">
                                <span className="material-symbols-outlined text-secondary text-base icon-filled">star</span>
                                <span>{property.rating}</span>
                            </div>
                        </div>

                        {/* Mobile: Simple Pricing Badges */}
                        <div className="flex flex-wrap gap-2 px-1">
                            {property.weekend_price && property.weekend_price > 0 && (
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                                    FDS: R$ {property.weekend_price}
                                </span>
                            )}
                            {property.cleaning_fee && property.cleaning_fee > 0 && (
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                                    Limpeza: R$ {property.cleaning_fee}
                                </span>
                            )}
                            {property.min_stay && property.min_stay > 1 && (
                                <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold">
                                    Mín {property.min_stay} diárias
                                </span>
                            )}
                        </div>

                        <button
                            onClick={handleMobileReserve}
                            className="bg-[#25D366] hover:bg-[#128C7E] text-white w-full py-3.5 rounded-2xl font-bold text-base shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">chat</span>
                            Reservar via WhatsApp
                        </button>

                        <p className="text-[10px] text-gray-500 text-center leading-tight">
                            Você falará diretamente com o proprietário para acertar as datas e pagamento.
                        </p>
                    </div>
                </div>

                {/* Lightbox Gallery Modal */}
                {isGalleryOpen && (
                    <div
                        className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-fade-in"
                        onClick={() => setIsGalleryOpen(false)}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >

                        {/* Close Button */}
                        <button
                            onClick={() => setIsGalleryOpen(false)}
                            className="absolute top-6 right-6 text-white/80 hover:text-white z-50 p-2 transition-colors"
                        >
                            <span className="material-symbols-outlined text-4xl">close</span>
                        </button>

                        {/* Navigation Buttons */}
                        <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 md:p-4 rounded-full hover:bg-white/10 transition-all z-50 bg-black/20 backdrop-blur-sm"
                        >
                            <span className="material-symbols-outlined text-3xl md:text-5xl">chevron_left</span>
                        </button>

                        <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 md:p-4 rounded-full hover:bg-white/10 transition-all z-50 bg-black/20 backdrop-blur-sm"
                        >
                            <span className="material-symbols-outlined text-3xl md:text-5xl">chevron_right</span>
                        </button>

                        {/* Main Image Container */}
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-10" onClick={(e) => e.stopPropagation()}>
                            <div className="relative w-full h-[85vh] flex items-center justify-center">
                                <img
                                    src={allImages[currentImageIndex]}
                                    alt={`Gallery ${currentImageIndex}`}
                                    className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" // object-contain fixes the cropping issue!
                                />
                            </div>

                            {/* Counter / Caption */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/90 text-sm font-medium tracking-widest bg-black/20 px-4 py-2 rounded-full backdrop-blur-md">
                                {currentImageIndex + 1} / {allImages.length}
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