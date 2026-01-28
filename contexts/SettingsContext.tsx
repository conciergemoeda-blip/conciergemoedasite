import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SITE_CONFIG as DEFAULT_CONFIG } from '../constants';

interface SiteSettings {
    whatsapp: string;
    email: string;
    bannerUrl?: string;
    formattedWhatsapp?: string;
}

interface SettingsContextType {
    settings: SiteSettings;
    loading: boolean;
    updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
    refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SiteSettings>({
        whatsapp: DEFAULT_CONFIG.whatsapp,
        email: DEFAULT_CONFIG.email,
        bannerUrl: '',
        formattedWhatsapp: DEFAULT_CONFIG.formattedWhatsapp
    });
    const [loading, setLoading] = useState(true);

    const formatWhatsapp = (phone: string) => {
        const cleaned = phone.replace(/\D/g, '');
        let numbers = cleaned;
        if (cleaned.startsWith('55')) {
            numbers = cleaned.substring(2);
        }

        if (numbers.length === 11) {
            return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`;
        }
        return phone;
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .eq('id', 'main')
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching settings:', error);
            }

            if (data) {
                setSettings({
                    whatsapp: data.whatsapp,
                    email: data.email,
                    bannerUrl: data.banner_url || '',
                    formattedWhatsapp: formatWhatsapp(data.whatsapp)
                });
            }
        } catch (err) {
            console.error('Unexpected error loading settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateSettings = async (newSettings: Partial<SiteSettings>) => {
        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({
                    id: 'main',
                    whatsapp: newSettings.whatsapp,
                    email: newSettings.email,
                    banner_url: newSettings.bannerUrl,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            // Update local state
            const updated = { ...settings, ...newSettings };
            if (newSettings.whatsapp) {
                updated.formattedWhatsapp = formatWhatsapp(newSettings.whatsapp);
            }
            setSettings(updated);
        } catch (err) {
            console.error('Error updating settings:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, loading, updateSettings, refreshSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
