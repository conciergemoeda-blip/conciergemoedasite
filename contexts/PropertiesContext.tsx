import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Property } from '../types';

interface PropertiesContextType {
    properties: Property[];
    loading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    hasMore: boolean;
    addProperty: (property: Property) => Promise<Property>;
    updateProperty: (property: Property) => Promise<void>;
    deleteProperty: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
    loadMore: () => Promise<void>;
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

// --- MAPPERS ---

const dbToProperty = (dbData: any): Property => {
    try {
        return {
            id: dbData.id,
            ownerId: dbData.owner_id, // ✅ Map DB owner_id
            title: dbData.title || 'Sem Título',
            description: dbData.description || '',
            price: Number(dbData.price) || 0,
            location: dbData.location || 'Sem Localização',
            imageUrl: dbData.image_url || '',
            gallery: dbData.gallery || [],
            amenities: dbData.amenities || [],
            ownerPhone: dbData.owner_phone || '',
            owner: {
                name: dbData.owner_name || 'Concierge',
                avatar: dbData.owner_avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(dbData.owner_name || 'Host')}&background=random`,
                isSuperhost: false,
                joinedDate: '2024',
                responseRate: '100%',
                responseTime: '1h',
                bio: dbData.owner_bio || 'Anfitrião dedicado.'
            },
            guests: dbData.guests || 2,
            bedrooms: dbData.bedrooms || 1,
            beds: dbData.beds || 1,
            baths: dbData.baths || 1,
            coordinates: {
                lat: Number(dbData.lat) || 0,
                lng: Number(dbData.lng) || 0
            },
            rating: Number(dbData.rating) || 5.0,
            reviews: dbData.reviews_count || 0,
            tags: (Array.isArray(dbData.featured) ? dbData.featured : (dbData.featured ? ['Superhost'] : ['Novo'])) as any
        };
    } catch (error) {
        console.error("Error mapping property:", error, dbData);
        // Return a safe fallback object to prevent crash
        return {
            id: dbData?.id || 'error',
            title: 'Erro ao carregar',
            description: 'Dados inválidos',
            price: 0,
            location: '',
            imageUrl: '',
            gallery: [],
            amenities: [],
            ownerPhone: '',
            owner: { name: 'Erro', avatar: '', isSuperhost: false, joinedDate: '', responseRate: '', responseTime: '' },
            guests: 0, bedrooms: 0, beds: 0, baths: 0,
            coordinates: { lat: 0, lng: 0 },
            rating: 0, reviews: 0, tags: []
        };
    }
};

const propertyToDb = async (p: Property) => {
    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    return {
        title: p.title,
        description: p.description,
        price: p.price,
        location: p.location,
        image_url: p.imageUrl,
        gallery: p.gallery || [],
        amenities: p.amenities || [],
        owner_id: user?.id || null, // ✅ New: Track property owner
        owner_phone: p.ownerPhone || '',
        owner_name: p.owner?.name || 'Concierge',
        owner_bio: p.owner?.bio || '',
        owner_avatar_url: p.owner?.avatar || '',
        guests: p.guests,
        bedrooms: p.bedrooms,
        beds: p.beds,
        baths: p.baths,
        lat: p.coordinates?.lat || 0,
        lng: p.coordinates?.lng || 0,
        rating: p.rating || 5.0,
        reviews_count: p.reviews || 0,
        featured: p.tags?.includes('Superhost') || false
    };
};

export const PropertiesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const PAGE_SIZE = 12;

    const fetchProperties = async (pageToFetch = 1) => {
        try {
            if (pageToFetch === 1) setLoading(true);

            // Calculate range for Supabase
            const from = (pageToFetch - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, count, error } = await supabase
                .from('properties')
                .select('id, title, price, location, image_url, amenities, owner_id, owner_phone, owner_name, owner_bio, owner_avatar_url, guests, bedrooms, beds, baths, lat, lng, rating, reviews_count, featured, created_at', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (data) {
                const mapped = data.map(dbToProperty);
                if (pageToFetch === 1) {
                    setProperties(mapped);
                } else {
                    setProperties(prev => [...prev, ...mapped]);
                }

                if (count) {
                    setTotalPages(Math.ceil(count / PAGE_SIZE));
                }
                setPage(pageToFetch);
            }
        } catch (err: any) {
            console.error('Error fetching properties:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (page < totalPages) {
            await fetchProperties(page + 1);
        }
    };

    const addProperty = async (property: Property) => {
        try {
            const dbPayload = await propertyToDb(property);
            const { data, error } = await supabase
                .from('properties')
                .insert([dbPayload])
                .select()
                .single();

            if (error) throw error;
            const newProp = dbToProperty(data);
            setProperties(prev => [newProp, ...prev]);
            return newProp;
        } catch (err: any) {
            console.error('Error adding property:', err);
            throw err;
        }
    };

    const updateProperty = async (property: Property) => {
        try {
            const dbPayload = await propertyToDb(property);
            const { error } = await supabase
                .from('properties')
                .update(dbPayload)
                .eq('id', property.id);

            if (error) throw error;
            setProperties(prev => prev.map(p => p.id === property.id ? property : p));
        } catch (err: any) {
            console.error('Error updating property:', err);
            throw err;
        }
    };

    const deleteProperty = async (id: string) => {
        try {
            const { error } = await supabase
                .from('properties')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setProperties(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
            console.error('Error deleting property:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchProperties();

        const subscription = supabase
            .channel('properties_channel_global')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'properties' }, () => {
                fetchProperties();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <PropertiesContext.Provider value={{
            properties,
            loading,
            error,
            page,
            totalPages,
            hasMore: page < totalPages,
            addProperty,
            updateProperty,
            deleteProperty,
            refresh: () => fetchProperties(1),
            loadMore
        }}>
            {children}
        </PropertiesContext.Provider>
    );
};

export const useProperties = () => {
    const context = useContext(PropertiesContext);
    if (context === undefined) {
        throw new Error('useProperties must be used within a PropertiesProvider');
    }
    return context;
};
