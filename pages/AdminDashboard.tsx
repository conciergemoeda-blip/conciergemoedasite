import React, { useState, useRef, useEffect } from 'react';
import { LOGO_BASE64 } from '../constants_logo';
import { ADMIN_USER, MOCK_LEADS, MOCK_STATS, SITE_CONFIG } from '../constants';
import { supabase } from '../lib/supabase';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { Page, Property, Lead } from '../types';
import { AddPropertyForm } from '../components/AddPropertyForm';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useProperties } from '../hooks/useProperties';
import { useSettings } from '../contexts/SettingsContext';


type TabType = 'DASHBOARD' | 'PROPERTIES' | 'SETTINGS';

interface AdminDashboardProps {
    onNavigate: (page: Page) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
    const { user, signOut } = useAuth();
    const { showToast: triggerGlobalToast } = useToast();
    const [activeTab, setActiveTab] = useState<TabType>('DASHBOARD');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Supabase Hook
    const { properties, addProperty, updateProperty, deleteProperty, loading } = useProperties();

    // UI State
    const [isCreatingProperty, setIsCreatingProperty] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [propertySearch, setPropertySearch] = useState('');
    const [propertyStatusFilter, setPropertyStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Profile State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profileName, setProfileName] = useState(user?.user_metadata?.full_name || ADMIN_USER.name);
    const [profileAvatar, setProfileAvatar] = useState(user?.user_metadata?.avatar_url || ADMIN_USER.avatar);
    const [profileLoading, setProfileLoading] = useState(false);

    // Leads State (Mock for now, as CRM is external via WhatsApp)
    const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
    const [leadFilter, setLeadFilter] = useState<'ALL' | 'Novo' | 'Contatado' | 'Fechado'>('ALL');

    // Settings State
    const { settings, updateSettings, loading: settingsLoading } = useSettings();
    const [inputWhatsapp, setInputWhatsapp] = useState(settings.whatsapp.replace('55', ''));
    const [inputEmail, setInputEmail] = useState(settings.email);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Sync settings when they load from DB
    useEffect(() => {
        if (!settingsLoading) {
            setInputWhatsapp(settings.whatsapp.replace('55', ''));
            setInputEmail(settings.email);
        }
    }, [settings, settingsLoading]);


    // Chart Data (Mock)
    const data = [
        { name: 'Seg', leads: 4 },
        { name: 'Ter', leads: 3 },
        { name: 'Qua', leads: 7 },
        { name: 'Qui', leads: 5 },
        { name: 'Sex', leads: 9 },
        { name: 'Sab', leads: 12 },
        { name: 'Dom', leads: 8 },
    ];

    const filteredLeads = leads.filter(lead => {
        if (leadFilter === 'ALL') return true;
        return lead.status === leadFilter;
    });

    const filteredProperties = properties.filter(prop => {
        const matchesSearch = prop.title.toLowerCase().includes(propertySearch.toLowerCase()) ||
            prop.location.toLowerCase().includes(propertySearch.toLowerCase());

        // Mock status logic: we use a "Paused" tag for logic simulation
        const isPaused = prop.tags.includes('Pausado' as any);

        if (propertyStatusFilter === 'ACTIVE') return matchesSearch && !isPaused;
        if (propertyStatusFilter === 'PAUSED') return matchesSearch && isPaused;

        return matchesSearch;
    });

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const formatCurrency = (val: number) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // --- Actions ---

    const triggerToast = (message: string, type: any = 'success') => {
        triggerGlobalToast(message, type);
    };

    const compressImage = async (file: File): Promise<File> => {
        if (file.size <= 1 * 1024 * 1024) return file;
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1920;
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(file); return; }
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }));
                    } else { resolve(file); }
                }, 'image/jpeg', 0.8);
            };
            img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
            img.src = url;
        });
    };

    const handleSaveProperty = async (propertyData: Property) => {
        try {
            if (editingProperty) {
                await updateProperty(propertyData);
                triggerToast('Imóvel atualizado com sucesso!');
            } else {
                await addProperty(propertyData);
                triggerToast('Imóvel cadastrado com sucesso!');
            }
            setIsCreatingProperty(false);
            setEditingProperty(null);
        } catch (error) {
            console.error(error);
            triggerToast('Erro ao salvar imóvel.');
        }
    };

    const handleEditProperty = (prop: Property) => {
        setEditingProperty(prop);
        setIsCreatingProperty(true);
    };

    const handleToggleStatus = async (id: string) => {
        const prop = properties.find(p => p.id === id);
        if (!prop) return;

        const isPaused = prop.tags.includes('Pausado' as any);
        const newTags = isPaused
            ? prop.tags.filter(t => t !== 'Pausado' as any)
            : [...prop.tags, 'Pausado' as any];

        try {
            await updateProperty({ ...prop, tags: newTags });
            triggerToast(isPaused ? 'Imóvel ativado!' : 'Imóvel pausado!');
        } catch (e) {
            triggerToast('Erro ao atualizar status.');
        }
    };

    const handleDeleteProperty = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        if (deleteConfirmId === id) {
            // Confirmed
            try {
                await deleteProperty(id);
                triggerToast('Imóvel excluído.');
                setDeleteConfirmId(null);
            } catch (e) {
                triggerToast('Erro ao excluir imóvel.');
            }
        } else {
            // First click - ask for confirmation
            setDeleteConfirmId(id);
            // Auto-cancel confirmation after 3 seconds
            setTimeout(() => setDeleteConfirmId(prev => prev === id ? null : prev), 3000);
        }
    };

    const handleLeadStatusChange = (id: string, newStatus: string) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus as any } : l));
        triggerToast('Status do lead atualizado!');
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword) {
            triggerToast('Por favor, informe sua senha atual.');
            return;
        }

        if (newPassword.length < 6) {
            triggerToast('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setPasswordLoading(true);
        try {
            // Step 1: Verify current password by attempting a re-login
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user?.email || '',
                password: currentPassword
            });

            if (signInError) {
                throw new Error('A senha atual está incorreta.');
            }

            // Step 2: If verification passed, update to the new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            triggerToast('Senha alterada com sucesso!');
            setIsChangingPassword(false);
            setNewPassword('');
            setCurrentPassword('');
        } catch (err: any) {
            console.error(err);
            triggerToast(err.message || 'Erro ao alterar senha.');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Visual feedback immediate
        const reader = new FileReader();
        reader.onload = (event) => {
            setProfileAvatar(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to Supabase Storage
        setProfileLoading(true);
        try {
            const compressedFile = await compressImage(file);
            const fileExt = compressedFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, compressedFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setProfileAvatar(data.publicUrl);
            triggerToast('Foto carregada com sucesso!');
        } catch (error: any) {
            console.error('Error uploading avatar:', error.message);
            triggerToast('Erro no upload. Usando prévia local.');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setProfileLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: profileName,
                    avatar_url: profileAvatar
                }
            });

            if (error) throw error;
            triggerToast('Perfil atualizado com sucesso!');
        } catch (error: any) {
            console.error('Error saving profile:', error.message);
            triggerToast('Erro ao salvar perfil.');
        } finally {
            setProfileLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            const cleanWhatsapp = `55${inputWhatsapp.replace(/\D/g, '')}`;
            await updateSettings({
                whatsapp: cleanWhatsapp,
                email: inputEmail
            });
            triggerToast('Configurações atualizadas!');
        } catch (error) {
            console.error(error);
            triggerToast('Erro ao atualizar configurações.', 'error');
        } finally {
            setIsSavingSettings(false);
        }
    };


    const renderContent = () => {
        switch (activeTab) {
            case 'SETTINGS':
                return (
                    <div className="p-4 md:p-8 animate-fade-in max-w-4xl mx-auto pb-24 md:pb-8">
                        <div className="space-y-6">
                            {/* Profile Section */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                                <h2 className="text-xl font-bold text-gray-900 font-serif mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">person</span>
                                    Perfil do Proprietário
                                </h2>
                                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                                    <div className="relative group">
                                        <img src={profileAvatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-md" />
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-white">photo_camera</span>
                                        </div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-4 w-full text-center md:text-left">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome de Exibição</label>
                                                <input
                                                    type="text"
                                                    value={profileName}
                                                    onChange={(e) => setProfileName(e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all font-bold text-gray-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email de Login</label>
                                                <input
                                                    type="text"
                                                    disabled
                                                    value={user?.email || ADMIN_USER.email}
                                                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={profileLoading}
                                            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 mx-auto md:mx-0 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined">{profileLoading ? 'sync' : 'save'}</span>
                                            {profileLoading ? 'Salvando...' : 'Salvar Perfil'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Section */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                                <h2 className="text-xl font-bold text-gray-900 font-serif mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">contact_support</span>
                                    Contatos do Sistema (Rodapé e WhatsApp)
                                </h2>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp de Contato</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-3 text-gray-500 font-bold border-r border-gray-200 pr-2">+55</span>
                                                <input
                                                    type="text"
                                                    value={inputWhatsapp}
                                                    onChange={(e) => setInputWhatsapp(e.target.value)}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-16 pr-4 py-3 focus:outline-none focus:border-primary transition-all font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Email de Contato</label>
                                            <input
                                                type="email"
                                                value={inputEmail}
                                                onChange={(e) => setInputEmail(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSaveSettings}
                                            disabled={isSavingSettings}
                                            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <span className="material-symbols-outlined">{isSavingSettings ? 'sync' : 'save'}</span>
                                            {isSavingSettings ? 'Salvando...' : 'Atualizar Contatos'}
                                        </button>
                                    </div>


                                    {/* Banner Section */}
                                    <div className="border-t border-gray-100 pt-8 mt-8">
                                        <h2 className="text-xl font-bold text-gray-900 font-serif mb-6 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">image</span>
                                            Banner do Site
                                        </h2>

                                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                            <label className="block text-sm font-bold text-gray-700 mb-4">Imagem de Capa (Homepage)</label>

                                            <div className="relative group rounded-xl overflow-hidden aspect-[21/9] bg-gray-200 shadow-sm">
                                                <img
                                                    src={settings.bannerUrl || "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=70&w=1400&auto=format&fit=crop"}
                                                    alt="Banner Atual"
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    style={{ filter: 'brightness(0.8)' }}
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        onClick={() => document.getElementById('banner-upload')?.click()}
                                                        className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-lg"
                                                    >
                                                        <span className="material-symbols-outlined">upload</span>
                                                        Trocar Imagem
                                                    </button>
                                                </div>
                                            </div>

                                            <input
                                                id="banner-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    try {
                                                        setIsSavingSettings(true);
                                                        const compressedFile = await compressImage(file);
                                                        const fileExt = compressedFile.name.split('.').pop();
                                                        const fileName = `banner_${Date.now()}.${fileExt}`;
                                                        const filePath = `banners/${fileName}`;

                                                        const { error: uploadError } = await supabase.storage
                                                            .from('property-images')
                                                            .upload(filePath, compressedFile);

                                                        if (uploadError) throw uploadError;

                                                        const { data } = supabase.storage
                                                            .from('property-images')
                                                            .getPublicUrl(filePath);

                                                        await updateSettings({ bannerUrl: data.publicUrl });
                                                        triggerGlobalToast('Banner atualizado com sucesso!');
                                                    } catch (error: any) {
                                                        console.error('Error uploading banner:', error);
                                                        triggerGlobalToast('Erro ao atualizar banner.');
                                                    } finally {
                                                        setIsSavingSettings(false);
                                                    }
                                                }}
                                            />

                                            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">info</span>
                                                Tamanho recomendado: 1920x600px. Formatos: JPG, PNG.
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Security Section */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                                <h2 className="text-xl font-bold text-gray-900 font-serif mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">security</span>
                                    Segurança e Acesso
                                </h2>

                                {isChangingPassword ? (
                                    <form onSubmit={handlePasswordChange} className="space-y-4 animate-fade-in animate-scale-in">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Senha Atual</label>
                                                <input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    placeholder="Digite sua senha atual"
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all font-mono"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-2">Nova Senha</label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    placeholder="Mínimo 6 caracteres"
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-all font-mono"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button
                                                type="submit"
                                                disabled={passwordLoading}
                                                className="flex-1 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {passwordLoading ? 'Verificando e Atualizando...' : 'Confirmar Nova Senha'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setIsChangingPassword(false); setNewPassword(''); setCurrentPassword(''); }}
                                                className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <button
                                        onClick={() => setIsChangingPassword(true)}
                                        className="text-primary hover:text-primary-dark font-bold text-sm flex items-center gap-2 border border-primary/20 px-6 py-3 rounded-xl hover:bg-primary/5 transition-all active:scale-95"
                                    >
                                        <span className="material-symbols-outlined">lock_reset</span>
                                        Alterar Senha de Acesso
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'PROPERTIES':
                if (isCreatingProperty) {
                    return (
                        <div className="p-4 md:p-8 animate-fade-in max-w-7xl mx-auto pb-24 md:pb-8">
                            <button
                                onClick={() => { setIsCreatingProperty(false); setEditingProperty(null); }}
                                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 mb-6 transition-colors"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                                Voltar para lista
                            </button>
                            <AddPropertyForm
                                onSave={handleSaveProperty}
                                onCancel={() => { setIsCreatingProperty(false); setEditingProperty(null); }}
                                initialData={editingProperty}
                            />
                        </div>
                    );
                }

                return (
                    <div className="p-4 md:p-8 animate-fade-in max-w-7xl mx-auto pb-24 md:pb-8">
                        {/* Toolbar */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 font-serif">Gerenciar Propriedades</h2>
                                <p className="text-sm text-gray-500 mt-1">Visão geral do desempenho e disponibilidade.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <div className="relative group w-full sm:w-auto">
                                    <span className="absolute left-3 top-2.5 material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                                    <input
                                        type="text"
                                        placeholder="Buscar imóvel..."
                                        value={propertySearch}
                                        onChange={(e) => setPropertySearch(e.target.value)}
                                        className="pl-10 pr-4 py-3 md:py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all w-full sm:w-64"
                                    />
                                </div>
                                <button
                                    onClick={() => { setEditingProperty(null); setIsCreatingProperty(true); }}
                                    className="bg-primary hover:bg-primary-dark text-white px-5 py-3 md:py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 w-full sm:w-auto whitespace-nowrap flex-shrink-0"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                    <span>Novo Imóvel</span>
                                </button>
                            </div>
                        </div>

                        {/* Filters Bar */}
                        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                            <button
                                onClick={() => setPropertyStatusFilter('ALL')}
                                className={`px - 4 py - 2 rounded - full text - xs font - bold border transition - colors whitespace - nowrap ${propertyStatusFilter === 'ALL' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'} `}
                            >
                                Todos ({properties.length})
                            </button>
                            <button
                                onClick={() => setPropertyStatusFilter('ACTIVE')}
                                className={`px - 4 py - 2 rounded - full text - xs font - bold border transition - colors whitespace - nowrap ${propertyStatusFilter === 'ACTIVE' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'} `}
                            >
                                Ativos
                            </button>
                            <button
                                onClick={() => setPropertyStatusFilter('PAUSED')}
                                className={`px - 4 py - 2 rounded - full text - xs font - bold border transition - colors whitespace - nowrap ${propertyStatusFilter === 'PAUSED' ? 'bg-gray-500 text-white border-gray-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'} `}
                            >
                                Pausados
                            </button>
                        </div>

                        {/* MOBILE VIEW: Cards */}
                        <div className="md:hidden space-y-4">
                            {filteredProperties.length > 0 ? (
                                filteredProperties.map(prop => (
                                    <div key={prop.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="h-20 w-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                                                <img className="h-full w-full object-cover" src={prop.imageUrl} alt="" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-gray-900 line-clamp-1">{prop.title}</h3>
                                                    {prop.tags.includes('Pausado' as any) ? (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-100 text-gray-500 border border-gray-200 whitespace-nowrap ml-2">Pausado</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-green-50 text-green-700 border border-green-100 whitespace-nowrap ml-2">Ativo</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                                                    <span className="material-symbols-outlined text-[12px]">location_on</span>
                                                    {prop.location}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="font-bold text-sm text-primary">{formatCurrency(prop.price || prop.seasonal_price || prop.weekend_price || 0)}</div>
                                                    <div className="text-[10px] text-gray-400">/ diária</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-t border-b border-gray-50">
                                            <div>
                                                <div className="text-[10px] text-gray-400 uppercase font-bold">Performance</div>
                                                <div className="flex items-center text-sm font-bold text-gray-900 mt-1">
                                                    <span className="material-symbols-outlined text-secondary text-sm mr-1 icon-filled">star</span>
                                                    {prop.rating}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-gray-400 uppercase font-bold">Comissão (20%)</div>
                                                <div className="text-sm font-bold text-gray-900 mt-1">{formatCurrency((prop.price || prop.seasonal_price || prop.weekend_price || 0) * 0.20)}</div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 font-bold cursor-pointer" onClick={() => window.open(`https://wa.me/${prop.ownerPhone}`, '_blank')}>
                                                <span className="material-symbols-outlined text-[14px]">whatsapp</span>
                                                Proprietário
                                            </div >
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditProperty(prop)}
                                                    className="p-2 bg-gray-50 text-gray-600 rounded-lg border border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-colors" title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(prop.id)}
                                                    className={`p-2 rounded-lg border transition-colors ${prop.tags.includes('Pausado' as any) ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-orange-50 hover:text-orange-600'}`}
                                                    title={prop.tags.includes('Pausado' as any) ? "Ativar" : "Pausar"}
                                                >
                                                    <span className="material-symbols-outlined text-lg">{prop.tags.includes('Pausado' as any) ? "play_circle" : "pause"}</span>
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteProperty(prop.id, e)}
                                                    className={`p-2 rounded-lg border transition-all ${deleteConfirmId === prop.id ? 'bg-red-600 text-white border-red-600 animate-pulse' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'}`}
                                                    title={deleteConfirmId === prop.id ? "Confirmar Exclusão?" : "Excluir"}
                                                >
                                                    <span className="material-symbols-outlined text-lg">
                                                        {deleteConfirmId === prop.id ? 'check' : 'delete'}
                                                    </span>
                                                    {deleteConfirmId === prop.id && <span className="text-xs font-bold ml-1">Confirmar?</span>}
                                                </button>
                                            </div>
                                        </div >
                                    </div >
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">search_off</span>
                                    <p className="font-medium text-gray-900">Nenhum imóvel encontrado</p>
                                </div>
                            )}
                        </div >

                        {/* DESKTOP VIEW: Table */}
                        < div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" >
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Propriedade</th>
                                            <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Contato Proprietário</th>
                                            <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Performance</th>
                                            <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Diária Base</th>
                                            <th className="px-6 py-4 text-right text-xs font-extrabold text-gray-500 uppercase tracking-wider">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {filteredProperties.length > 0 ? (
                                            filteredProperties.map(prop => (
                                                <tr key={prop.id} className="hover:bg-gray-50/80 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="h-16 w-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm border border-gray-100 group-hover:scale-105 transition-transform duration-300">
                                                                <img className="h-full w-full object-cover" src={prop.imageUrl} alt="" />
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-bold text-gray-900 line-clamp-1">{prop.title}</div>
                                                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                                    <span className="material-symbols-outlined text-[10px]">location_on</span>
                                                                    {prop.location}
                                                                </div>
                                                                <div className="mt-1.5 flex items-center gap-2">
                                                                    {prop.tags.includes('Pausado' as any) ? (
                                                                        <span className="px-2 py-0.5 inline-flex text-[10px] leading-4 font-bold rounded bg-gray-100 text-gray-500 border border-gray-200">
                                                                            Pausado
                                                                        </span>
                                                                    ) : (
                                                                        <span className="px-2 py-0.5 inline-flex text-[10px] leading-4 font-bold rounded bg-green-50 text-green-700 border border-green-100">
                                                                            Ativo
                                                                        </span>
                                                                    )}
                                                                    {prop.featured && (
                                                                        <span className="px-2 py-0.5 inline-flex text-[10px] leading-4 font-bold rounded bg-amber-50 text-amber-700 border border-amber-100">
                                                                            Destaque
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                                                                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                    <span className="material-symbols-outlined text-sm">person</span>
                                                                </span>
                                                                Proprietário
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 bg-gray-50 w-fit px-2 py-1 rounded-lg border border-gray-100 cursor-pointer hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition-colors" title="Clique para chamar">
                                                                <span className="material-symbols-outlined text-[14px] text-green-600">whatsapp</span>
                                                                {prop.ownerPhone.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3')}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center text-sm font-bold text-gray-900">
                                                                <span className="material-symbols-outlined text-secondary text-sm mr-1 icon-filled">star</span>
                                                                {prop.rating}
                                                                <span className="text-xs text-gray-400 font-normal ml-1">({prop.reviews} avaliações)</span>
                                                            </div>
                                                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1 max-w-[100px]">
                                                                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(prop.rating / 5) * 100}%` }}></div>
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 mt-0.5">Alta procura</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <div className="font-bold text-gray-900">{formatCurrency(prop.price || prop.seasonal_price || prop.weekend_price || 0)}</div>
                                                        <div className="text-xs text-gray-400">Comissão (20%): {formatCurrency((prop.price || prop.seasonal_price || prop.weekend_price || 0) * 0.20)}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => handleEditProperty(prop)}
                                                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors border border-transparent hover:border-primary/10" title="Editar Imóvel">
                                                                <span className="material-symbols-outlined text-xl">edit_square</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleToggleStatus(prop.id)}
                                                                className={`p-2 rounded-lg transition-colors border border-transparent ${prop.tags.includes('Pausado' as any) ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'}`}
                                                                title={prop.tags.includes('Pausado' as any) ? "Ativar Anúncio" : "Pausar Anúncio"}
                                                            >
                                                                <span className="material-symbols-outlined text-xl">{prop.tags.includes('Pausado' as any) ? "play_circle" : "pause_circle"}</span>
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteProperty(prop.id, e)}
                                                                className={`p-2 rounded-lg transition-all border ${deleteConfirmId === prop.id ? 'bg-red-600 text-white border-red-600 w-auto px-3' : 'text-gray-400 border-transparent hover:text-red-500 hover:bg-red-50 hover:border-red-100'}`}
                                                                title={deleteConfirmId === prop.id ? "Clique para confirmar" : "Excluir Imóvel"}
                                                            >
                                                                <div className="flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-xl">
                                                                        {deleteConfirmId === prop.id ? 'check_circle' : 'delete'}
                                                                    </span>
                                                                    {deleteConfirmId === prop.id && <span className="text-xs font-bold">Confirmar?</span>}
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 bg-gray-50/30">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                            <span className="material-symbols-outlined text-3xl text-gray-400">search_off</span>
                                                        </div>
                                                        <p className="font-medium text-gray-900">Nenhum imóvel encontrado</p>
                                                        <p className="text-sm">Tente ajustar seus filtros de busca.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination (Visual) */}
                            <div className="bg-white px-4 py-3 border-t border-gray-100 flex items-center justify-between sm:px-6">
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Mostrando <span className="font-bold">1</span> a <span className="font-bold">{filteredProperties.length}</span> de <span className="font-bold">{properties.length}</span> resultados
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                                            </button>
                                            <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                                                1
                                            </button>
                                            <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        </div >
                    </div >
                );
            default:
                return (
                    <div className="p-4 md:p-8 animate-fade-in pb-24 md:pb-8">
                        {/* Stats Cards - Grid optimized for mobile */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                            <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-green-50 text-primary rounded-xl">
                                        <span className="material-symbols-outlined">villa</span>
                                    </div>
                                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">trending_up</span> 2.5%
                                    </span>
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{properties.length}</div>
                                <div className="text-sm font-medium text-gray-500">Imóveis Totais</div>
                            </div>

                            <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                        <span className="material-symbols-outlined">check_circle</span>
                                    </div>
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{properties.filter(p => !p.tags.includes('Pausado' as any)).length}</div>
                                <div className="text-sm font-medium text-gray-500">Imóveis Ativos</div>
                            </div>

                            <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                        <span className="material-symbols-outlined">payments</span>
                                    </div>
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                                    {formatCurrency(properties.filter(p => !p.tags.includes('Pausado' as any)).reduce((acc, curr) => acc + (Number(curr.price) || 0), 0) * 10)}
                                </div>
                                <div className="text-sm font-medium text-gray-500">Potencial Mensal (Est. 10 diárias)</div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center py-12">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                                <span className="material-symbols-outlined text-3xl">verified</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Painel Simplificado</h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                O sistema agora opera no modo <span className="font-bold text-primary">Contato Direto</span>.
                                Todos os leads são direcionados automaticamente para o WhatsApp do proprietário de cada imóvel.
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans animate-fade-in overflow-hidden relative">
            {/* Mobile Sidebar Overlay with Blur */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={toggleSidebar}
            ></div>

            {/* Sidebar - Responsive */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-[280px] md:relative md:w-72 h-full bg-primary text-white flex flex-col transition-transform duration-300 ease-out shadow-2xl md:shadow-none md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="p-6 md:p-8 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-1">
                            <img src={LOGO_BASE64} alt="Logo" className="w-12 h-12 object-contain" />
                        </div>
                        <div>
                            <span className="font-serif font-bold text-xl tracking-wide block">Painel</span>
                            <span className="text-[10px] uppercase tracking-widest opacity-60 font-sans">Concierge</span>
                        </div>
                    </div>
                    <button onClick={toggleSidebar} className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                    <div
                        onClick={() => { setActiveTab('DASHBOARD'); setIsSidebarOpen(false); setIsCreatingProperty(false); }}
                        className={`px-4 py-4 md:py-3.5 rounded-xl cursor-pointer flex items-center gap-3 text-sm font-bold transition-all ${activeTab === 'DASHBOARD'
                            ? 'bg-white text-primary shadow-lg translate-x-1'
                            : 'hover:bg-white/10 opacity-80 hover:opacity-100 hover:translate-x-1'
                            }`}
                    >
                        <span className="material-symbols-outlined text-xl">dashboard</span>
                        Visão Geral
                    </div>

                    <div
                        onClick={() => { setActiveTab('PROPERTIES'); setIsSidebarOpen(false); }}
                        className={`px-4 py-4 md:py-3.5 rounded-xl cursor-pointer flex items-center gap-3 text-sm font-bold transition-all ${activeTab === 'PROPERTIES'
                            ? 'bg-white text-primary shadow-lg translate-x-1'
                            : 'hover:bg-white/10 opacity-80 hover:opacity-100 hover:translate-x-1'
                            }`}
                    >
                        <span className="material-symbols-outlined text-xl">holiday_village</span>
                        Propriedades
                    </div>

                    <div className="my-4 border-t border-white/10 mx-4"></div>

                    <div
                        onClick={() => onNavigate('HOME')}
                        className="px-4 py-4 md:py-3.5 hover:bg-white/10 rounded-xl cursor-pointer flex items-center gap-3 text-sm font-medium opacity-70 hover:opacity-100 hover:translate-x-1 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl">public</span>
                        Ver Site
                    </div>

                    <div
                        onClick={() => { setActiveTab('SETTINGS'); setIsSidebarOpen(false); setIsCreatingProperty(false); }}
                        className={`px-4 py-4 md:py-3.5 hover:bg-white/10 rounded-xl cursor-pointer flex items-center gap-3 text-sm font-medium transition-all ${activeTab === 'SETTINGS'
                            ? 'bg-white text-primary shadow-lg translate-x-1 opacity-100 font-bold'
                            : 'opacity-70 hover:opacity-100 hover:translate-x-1'
                            }`}
                    >
                        <span className="material-symbols-outlined text-xl">settings</span> Configurações
                    </div>
                </nav>

                <div className="p-4 md:p-6 bg-black/20 m-4 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <img src={profileAvatar} alt="Admin" className="w-10 h-10 rounded-full border-2 border-white/30 shadow-sm object-cover" />
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold truncate">{profileName}</span>
                            <span className="text-xs opacity-60">Online Agora</span>
                        </div>
                        <button
                            onClick={async () => {
                                await signOut();
                                onNavigate('HOME');
                            }}
                            className="ml-auto p-2 md:p-1.5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
                            title="Sair"
                        >
                            <span className="material-symbols-outlined text-xl md:text-lg">logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-y-auto w-full">
                {/* Header - Sticky */}
                <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 md:px-8 md:py-5 flex justify-between items-center z-30 shadow-sm md:shadow-none">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleSidebar}
                            className="md:hidden p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
                        >
                            <span className="material-symbols-outlined text-2xl">menu</span>
                        </button>
                        <div>
                            <h1 className="text-lg md:text-2xl font-bold text-gray-900 font-serif leading-tight truncate max-w-[200px] md:max-w-none">
                                {activeTab === 'DASHBOARD' && 'Bem-vindo, Ricardo'}
                                {activeTab === 'LEADS' && 'CRM'}
                                {activeTab === 'PROPERTIES' && !isCreatingProperty && 'Imóveis'}
                                {activeTab === 'PROPERTIES' && isCreatingProperty && (editingProperty ? 'Editar Imóvel' : 'Novo Imóvel')}
                                {activeTab === 'SETTINGS' && 'Configurações'}
                            </h1>
                            <p className="hidden md:block text-gray-500 text-xs md:text-sm mt-0.5">
                                {activeTab === 'DASHBOARD' ? 'Aqui está o resumo do desempenho hoje.' : 'Gerencie os dados da plataforma.'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 md:gap-4">
                        <button className="relative p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-full transition-colors active:scale-95">
                            <span className="material-symbols-outlined text-2xl md:text-xl">notifications</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {renderContent()}
            </main>
        </div>
    );
};