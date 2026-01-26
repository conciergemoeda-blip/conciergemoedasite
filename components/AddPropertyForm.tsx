import React, { useState, useRef, useEffect } from 'react';
import { Property } from '../types';
import { PropertyCard } from './PropertyCard';

import { ADMIN_USER } from '../constants';
import { supabase } from '../lib/supabase';

interface AddPropertyFormProps {
    onSave: (property: Property) => void;
    onCancel: () => void;
    initialData?: Property | null;
}

const AMENITIES_OPTIONS = [
    'Piscina', 'Wi-Fi', 'Ar Condicionado', 'Churrasqueira',
    'Cozinha Gourmet', 'Estacionamento', 'Vista Panorâmica',
    'Lareira', 'Jacuzzi', 'Aceita Pets', 'Playground', 'Fogão a Lenha'
];

export const AddPropertyForm: React.FC<AddPropertyFormProps> = ({ onSave, onCancel, initialData }) => {
    // Default Empty State
    const defaultState: Partial<Property> = {
        id: Date.now().toString(),
        title: '',
        description: '',
        location: '',
        price: 0,
        rating: 5.0,
        reviews: 0,
        guests: 2,
        bedrooms: 1,
        beds: 1,
        baths: 1,
        imageUrl: '',
        gallery: [],
        amenities: [],
        tags: ['Novo'],
        ownerPhone: '',
        coordinates: { lat: -20.3387, lng: -44.0544 },
        owner: {
            name: ADMIN_USER.name,
            avatar: ADMIN_USER.avatar,
            isSuperhost: true,
            joinedDate: new Date().getFullYear().toString(),
            responseRate: '100%',
            responseTime: 'Poucos minutos',
            bio: 'Gestor de propriedades premium.'
        }
    };

    // Form State - Initialize with Safe Merge
    const [formData, setFormData] = useState<Partial<Property>>(() => {
        if (!initialData) return defaultState;
        return {
            ...defaultState,
            ...initialData,
            owner: {
                ...defaultState.owner!,
                ...(initialData.owner || {})
            },
            coordinates: {
                ...defaultState.coordinates!,
                ...(initialData.coordinates || {})
            }
        };
    });

    const [activeStep, setActiveStep] = useState(1);
    const [inputType, setInputType] = useState<'UPLOAD' | 'URL'>('UPLOAD');

    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Safety: Prevent double-click on "Next" from triggering "Save" immediately
    const [isSaveReady, setIsSaveReady] = useState(false);

    useEffect(() => {
        if (activeStep === 3) {
            setIsSaveReady(false);
            const timer = setTimeout(() => setIsSaveReady(true), 1000); // 1 second safety delay
            return () => clearTimeout(timer);
        }
    }, [activeStep]);

    // Refs for file inputs
    const fileInputRef = useRef<HTMLInputElement>(null); // Main Image
    const galleryInputRef = useRef<HTMLInputElement>(null); // Gallery Images
    const avatarInputRef = useRef<HTMLInputElement>(null); // Owner Avatar

    const isEditing = !!initialData;

    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOwnerChange = (field: keyof NonNullable<Property['owner']>, value: string) => {
        setFormData(prev => ({
            ...prev,
            owner: {
                ...(prev.owner || defaultState.owner!),
                [field]: value
            }
        }));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, price: Number(e.target.value) }));
    };

    // Numeric Stepper Logic
    const handleCounter = (field: keyof Property, operation: 'inc' | 'dec') => {
        setFormData(prev => {
            const currentVal = Number(prev[field]) || 0;
            const newVal = operation === 'inc' ? currentVal + 1 : Math.max(0, currentVal - 1);
            return { ...prev, [field]: newVal };
        });
    };

    const handleCoordinateChange = (field: 'lat' | 'lng', value: string) => {
        setFormData(prev => ({
            ...prev,
            coordinates: {
                ...prev.coordinates!,
                [field]: parseFloat(value) || 0
            }
        }));
    };

    const handleUseCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        coordinates: {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        }
                    }));
                },
                (error) => {
                    alert('Erro ao obter localização: ' + error.message);
                }
            );
        } else {
            alert('Geolocalização não suportada pelo seu navegador.');
        }
    };

    const handleAmenityToggle = (amenity: string) => {
        setFormData(prev => {
            const current = prev.amenities || [];
            if (current.includes(amenity)) {
                return { ...prev, amenities: current.filter(a => a !== amenity) };
            } else {
                return { ...prev, amenities: [...current, amenity] };
            }
        });
    };

    // --- MAIN IMAGE UPLOAD LOGIC ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        processFile(file);
    };


    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('property-images')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('property-images')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error: any) {
            console.error('Upload Error:', error);
            alert(`Erro no upload: ${error.message}`);
            return null;
        }
    };

    const processFile = async (file?: File) => {
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 5MB.');
            return;
        }

        setIsUploading(true);
        const publicUrl = await uploadImage(file);
        setIsUploading(false);

        if (publicUrl) {
            setFormData(prev => ({
                ...prev,
                imageUrl: publicUrl
            }));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        processFile(file);
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, imageUrl: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- GALLERY UPLOAD LOGIC ---
    const triggerGalleryUpload = () => {
        galleryInputRef.current?.click();
    };

    const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files) as File[];
            processGalleryFiles(files);
        }
    };

    const processGalleryFiles = async (files: File[]) => {
        setIsUploading(true);

        // Parallel uploads
        const uploadPromises = files.map(file => uploadImage(file));
        const results = await Promise.all(uploadPromises);

        setIsUploading(false);

        // Filter out failures (nulls)
        const successfulUrls = results.filter((url): url is string => url !== null);

        if (successfulUrls.length > 0) {
            setFormData(prev => ({
                ...prev,
                gallery: [...(prev.gallery || []), ...successfulUrls]
            }));
        }
    };

    const handleRemoveGalleryImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            gallery: prev.gallery?.filter((_, i) => i !== index)
        }));
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const url = await uploadImage(file);
        setIsUploading(false);

        if (url) {
            handleOwnerChange('avatar', url);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent saving if not on the last step
        if (activeStep < 3) {
            setActiveStep(prev => prev + 1);
            return;
        }

        if (isUploading) {
            alert("Aguarde o upload das imagens terminar.");
            return;
        }

        if (!formData.title || !formData.price || !formData.imageUrl || !formData.ownerPhone || !formData.owner?.name) {
            alert("Preencha todos os campos obrigatórios:\n- Título\n- Preço\n- Foto Principal\n- Nome do Anfitrião\n- WhatsApp");
            return;
        }
        onSave(formData as Property);
    };

    // Preview Object
    const previewProperty = {
        ...formData,
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=2065&auto=format&fit=crop',
        gallery: formData.gallery && formData.gallery.length > 0 ? formData.gallery : (formData.imageUrl ? [formData.imageUrl] : [])
    } as Property;

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
            {/* Left Column: Form */}
            <div className="flex-1 bg-white rounded-3xl shadow-soft border border-gray-100 p-6 md:p-8 relative overflow-hidden">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 h-1.5 bg-gray-100 w-full">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${(activeStep / 3) * 100}%` }}
                    ></div>
                </div>

                <div className="flex justify-between items-center mb-8 mt-2">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-gray-900">{isEditing ? 'Editar Imóvel' : 'Cadastrar Imóvel'}</h2>
                        <p className="text-sm text-gray-500">{isEditing ? 'Atualize as informações do anúncio.' : 'Preencha as informações para anunciar.'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map(step => (
                            <div
                                key={step}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${activeStep >= step
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-gray-100 text-gray-400'
                                    }`}
                            >
                                {step}
                            </div>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Step 1: Basic Info */}
                    {activeStep === 1 && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-gray-400">title</span>
                                    Título do Anúncio *
                                </label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Ex: Sítio Vista da Serra - Refúgio Completo"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-400">payments</span>
                                        Preço (Diária) *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3.5 text-gray-500 font-bold">R$</span>
                                        <input
                                            name="price"
                                            type="number"
                                            value={formData.price || ''}
                                            onChange={handlePriceChange}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-bold text-gray-900"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-400">location_on</span>
                                        Localização (Cidade/Bairro) *
                                    </label>
                                    <input
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        placeholder="Ex: Taquaraçu, Moeda"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Coordinates Section */}
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-400">map</span>
                                        Coordenadas (Mapa)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleUseCurrentLocation}
                                        className="text-xs bg-white border border-gray-200 text-primary font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-sm">my_location</span>
                                        Usar minha localização
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.coordinates?.lat}
                                            onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.coordinates?.lng}
                                            onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-gray-400">description</span>
                                    Descrição Completa
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Descreva o que torna este lugar especial, a vista, o ambiente..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Details & Media */}
                    {activeStep === 2 && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider border-b border-gray-100 pb-2">Capacidade e Estrutura</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { field: 'guests', label: 'Hóspedes', icon: 'group' },
                                        { field: 'bedrooms', label: 'Quartos', icon: 'bed' },
                                        { field: 'beds', label: 'Camas', icon: 'single_bed' },
                                        { field: 'baths', label: 'Banheiros', icon: 'shower' }
                                    ].map((item) => (
                                        <div key={item.field} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center">
                                            <div className="text-gray-400 mb-2">
                                                <span className="material-symbols-outlined">{item.icon}</span>
                                            </div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-3">{item.label}</label>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCounter(item.field as keyof Property, 'dec')}
                                                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition-colors shadow-sm active:scale-95"
                                                >
                                                    <span className="material-symbols-outlined text-sm">remove</span>
                                                </button>
                                                <span className="text-xl font-bold text-gray-900 w-6 text-center">
                                                    {formData[item.field as keyof Property] as number}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCounter(item.field as keyof Property, 'inc')}
                                                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition-colors shadow-sm active:scale-95"
                                                >
                                                    <span className="material-symbols-outlined text-sm">add</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* MAIN IMAGE SECTION */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider border-b border-gray-100 pb-2">Foto de Capa (Principal)</h3>

                                {formData.imageUrl ? (
                                    <div className="relative w-full h-72 rounded-2xl overflow-hidden border border-gray-200 group shadow-md">
                                        <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-50 transition-colors shadow-lg transform translate-y-2 group-hover:translate-y-0 duration-300"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                                Remover foto
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex bg-gray-100 p-1.5 rounded-xl w-fit">
                                            <button
                                                type="button"
                                                onClick={() => setInputType('UPLOAD')}
                                                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${inputType === 'UPLOAD' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                            >
                                                <span className="material-symbols-outlined text-sm">cloud_upload</span>
                                                Upload
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setInputType('URL')}
                                                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${inputType === 'URL' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                            >
                                                <span className="material-symbols-outlined text-sm">link</span>
                                                Link / URL
                                            </button>
                                        </div>

                                        {inputType === 'UPLOAD' ? (
                                            <div
                                                onClick={triggerFileUpload}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all group min-h-[250px] ${isDragging
                                                    ? 'border-primary bg-primary/5 scale-[1.01]'
                                                    : 'border-gray-300 hover:bg-gray-50 hover:border-primary/50'
                                                    }`}
                                            >
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileSelect}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-transform duration-300 ${isDragging ? 'bg-white scale-110 shadow-md' : 'bg-blue-50 text-blue-500 group-hover:scale-110'}`}>
                                                    <span className={`material-symbols-outlined text-4xl ${isDragging ? 'text-primary' : 'text-blue-500'}`}>
                                                        {isDragging ? 'download' : 'add_photo_alternate'}
                                                    </span>
                                                </div>
                                                <p className="text-base font-bold text-gray-700">Clique ou arraste a capa aqui</p>
                                                <p className="text-sm text-gray-400 mt-2 mb-6">JPG, PNG ou WebP (Máx. 5MB)</p>

                                                <div className="flex items-center gap-3 w-full max-w-sm">
                                                    <button type="button" className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95" onClick={(e) => { e.stopPropagation(); triggerFileUpload(); }}>
                                                        <span className="material-symbols-outlined text-sm">smartphone</span>
                                                        Do Dispositivo
                                                    </button>
                                                    <button type="button" className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95" onClick={(e) => { e.stopPropagation(); triggerFileUpload(); }}>
                                                        <span className="material-symbols-outlined text-sm text-blue-600">add_to_drive</span>
                                                        Google Drive
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Colar Link da Imagem</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        name="imageUrl"
                                                        value={formData.imageUrl}
                                                        onChange={handleChange}
                                                        placeholder="https://exemplo.com/imagem.jpg"
                                                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">info</span>
                                                    Certifique-se que o link é público e direto para a imagem.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* GALLERY SECTION */}
                            <div className="pt-6 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Galeria de Fotos</h3>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={triggerGalleryUpload}
                                            className="text-xs font-bold text-primary border border-primary/20 bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
                                            Adicionar Fotos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={triggerGalleryUpload}
                                            className="text-xs font-bold text-gray-600 border border-gray-200 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-sm text-blue-600">add_to_drive</span>
                                            Drive
                                        </button>
                                    </div>
                                    <input
                                        type="file"
                                        ref={galleryInputRef}
                                        onChange={handleGallerySelect}
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                    />
                                </div>

                                {formData.gallery && formData.gallery.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {formData.gallery.map((img, index) => (
                                            <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                                                <img src={img} alt={`Gallery ${index}`} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveGalleryImage(index)}
                                                        className="bg-white/90 text-red-600 p-2 rounded-full hover:bg-white transition-colors"
                                                        title="Remover"
                                                    >
                                                        <span className="material-symbols-outlined text-sm font-bold">close</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {/* Add Button in Grid */}
                                        <button
                                            type="button"
                                            onClick={triggerGalleryUpload}
                                            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-2xl">add</span>
                                            <span className="text-xs font-bold mt-1">Adicionar</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={triggerGalleryUpload}
                                        className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 text-gray-400">
                                            <span className="material-symbols-outlined">collections</span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-600">Nenhuma foto extra adicionada</p>
                                        <p className="text-xs text-gray-400 mt-1">Adicione fotos da sala, quartos, cozinha e áreas externas.</p>
                                        <div className="flex gap-2 mt-4">
                                            <span className="text-xs font-bold text-primary underline">Carregar do Dispositivo</span>
                                            <span className="text-xs text-gray-300">|</span>
                                            <span className="text-xs font-bold text-blue-600 underline">Importar do Drive</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Amenities & Contact */}
                    {activeStep === 3 && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Owner Profile Section */}
                            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 mb-6">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider border-b border-blue-100 pb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">person</span>
                                    Perfil do Anfitrião
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Anfitrião *</label>
                                        <input
                                            name="ownerName"
                                            value={formData.owner?.name || ''}
                                            onChange={(e) => handleOwnerChange('name', e.target.value)}
                                            placeholder="Ex: Leonardo"
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary font-medium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Bio / Descrição *</label>
                                        <textarea
                                            name="ownerBio"
                                            value={formData.owner?.bio || ''}
                                            onChange={(e) => handleOwnerChange('bio', e.target.value)}
                                            rows={2}
                                            placeholder="Ex: Apaixonado por natureza e boas experiências..."
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Foto de Perfil (Avatar)</label>
                                        <div className="flex items-start gap-4">
                                            {/* Avatar Preview */}
                                            <div className="relative group shrink-0">
                                                <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-gray-50">
                                                    {formData.owner?.avatar ? (
                                                        <img src={formData.owner.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <span className="material-symbols-outlined text-3xl">person</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {formData.owner?.avatar && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOwnerChange('avatar', '')}
                                                        className="absolute -top-1 -right-1 bg-white text-red-500 rounded-full p-0.5 shadow-sm border border-gray-200 hover:bg-red-50"
                                                        title="Remover"
                                                    >
                                                        <span className="material-symbols-outlined text-sm block">close</span>
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex-1 space-y-3">
                                                {/* Upload Button */}
                                                <div>
                                                    <input
                                                        type="file"
                                                        ref={avatarInputRef}
                                                        onChange={handleAvatarUpload}
                                                        accept="image/*"
                                                        className="hidden"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => avatarInputRef.current?.click()}
                                                        disabled={isUploading}
                                                        className="text-sm font-bold text-gray-700 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
                                                    >
                                                        {isUploading ? (
                                                            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                                                        ) : (
                                                            <span className="material-symbols-outlined">upload</span>
                                                        )}
                                                        {isUploading ? 'Enviando...' : 'Carregar do Dispositivo'}
                                                    </button>
                                                </div>

                                                {/* URL Fallback */}
                                                <div className="relative">
                                                    <input
                                                        name="ownerAvatar"
                                                        value={formData.owner?.avatar || ''}
                                                        onChange={(e) => handleOwnerChange('avatar', e.target.value)}
                                                        placeholder="Ou cole o link da imagem aqui..."
                                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary text-gray-600"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#25D366]">chat</span>
                                    WhatsApp do Proprietário (apenas números) *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-gray-500 font-bold flex items-center gap-1 border-r border-gray-200 pr-2">
                                        <img src="https://flagcdn.com/w20/br.png" alt="BR" className="w-5 rounded-sm" />
                                        +55
                                    </span>
                                    <input
                                        name="ownerPhone"
                                        value={formData.ownerPhone}
                                        onChange={handleChange}
                                        placeholder="31999999999"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-24 pr-4 py-3.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider border-b border-gray-100 pb-2">Comodidades</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {AMENITIES_OPTIONS.map(amenity => (
                                        <label key={amenity} className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${formData.amenities?.includes(amenity)
                                            ? 'bg-primary/5 border-primary text-primary-dark shadow-sm'
                                            : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                            }`}>
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${formData.amenities?.includes(amenity) ? 'bg-primary border-primary' : 'border-gray-300 bg-white group-hover:border-gray-400'
                                                }`}>
                                                {formData.amenities?.includes(amenity) && <span className="material-symbols-outlined text-white text-xs font-bold">check</span>}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={formData.amenities?.includes(amenity)}
                                                onChange={() => handleAmenityToggle(amenity)}
                                            />
                                            <span className="text-sm font-medium">{amenity}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center pt-8 border-t border-gray-100 mt-8">
                        {activeStep === 1 ? (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="text-gray-500 font-bold hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setActiveStep(prev => prev - 1)}
                                className="text-gray-600 font-bold hover:text-gray-900 flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <span className="material-symbols-outlined">arrow_back</span> Anterior
                            </button>
                        )}

                        {activeStep < 3 ? (
                            <button
                                type="button"
                                onClick={() => setActiveStep(prev => prev + 1)}
                                className="bg-gray-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:bg-black transition-all flex items-center gap-2 transform active:scale-95"
                            >
                                Próximo <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={!isSaveReady || isUploading}
                                className={`bg-primary text-white px-8 py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 transform active:scale-95 ${(!isSaveReady || isUploading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-dark'}`}
                            >
                                <span className="material-symbols-outlined">check_circle</span>
                                {isEditing ? 'Salvar Alterações' : 'Publicar Imóvel'}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Right Column: Preview */}
            <div className="w-full lg:w-[400px] flex flex-col gap-6">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100 rounded-2xl p-5 text-sm text-yellow-900 flex items-start gap-3 shadow-sm">
                    <div className="bg-white p-2 rounded-full shadow-sm">
                        <span className="material-symbols-outlined text-yellow-600 text-xl">visibility</span>
                    </div>
                    <div>
                        <p className="font-bold mb-1">Pré-visualização em Tempo Real</p>
                        <p className="opacity-80 text-xs">Veja exatamente como seu anúncio aparecerá para os hóspedes no site.</p>
                    </div>
                </div>

                {/* Prevent navigation on preview click */}
                <div className="pointer-events-none sticky top-24">
                    <div className="transform scale-95 lg:scale-100 origin-top transition-transform">
                        <PropertyCard
                            property={previewProperty}
                            onClick={() => { }}
                        />
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
                        <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400">checklist</span>
                            Status do Cadastro
                        </h4>
                        <ul className="text-sm space-y-3">
                            <li className="flex justify-between items-center group">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${formData.title ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    Título
                                </span>
                                <span className={formData.title ? "text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded" : "text-gray-400 text-xs"}>{formData.title ? "OK" : "Pendente"}</span>
                            </li>
                            <li className="flex justify-between items-center group">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${formData.price ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    Preço Base
                                </span>
                                <span className={formData.price && formData.price > 0 ? "text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded" : "text-gray-400 text-xs"}>{formData.price ? "OK" : "Pendente"}</span>
                            </li>
                            <li className="flex justify-between items-center group">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${formData.imageUrl ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    Foto Principal
                                </span>
                                <span className={formData.imageUrl ? "text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded" : "text-gray-400 text-xs"}>{formData.imageUrl ? "OK" : "Pendente"}</span>
                            </li>
                            <li className="flex justify-between items-center group">
                                <span className="text-gray-600 flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${formData.ownerPhone ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    WhatsApp
                                </span>
                                <span className={formData.ownerPhone ? "text-green-600 font-bold text-xs bg-green-50 px-2 py-0.5 rounded" : "text-gray-400 text-xs"}>{formData.ownerPhone ? "OK" : "Pendente"}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};