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
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


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

    // Analytics State
    const [timeFilter, setTimeFilter] = useState<'ALL_TIME' | 'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH'>('ALL_TIME');
    const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
    const analyticsData = useAnalyticsData(timeFilter, selectedPropertyId);
    
    // PDF Export State
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

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
            // Remove non-numeric characters
            let cleanWhatsapp = inputWhatsapp.replace(/\D/g, '');

            // Add 55 only if it seems to be missing (length 10 or 11 - standard BR format)
            // If the user typed 55 explicitly (length 12 or 13), we keep it as is.
            if (cleanWhatsapp.length === 10 || cleanWhatsapp.length === 11) {
                cleanWhatsapp = `55${cleanWhatsapp}`;
            }

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

    const handleExportPDF = async () => {
        if (!reportRef.current) return;
        setIsExportingPDF(true);
        
        try {
            // 1. Capture the HTML element using html2canvas
            const canvas = await html2canvas(reportRef.current, {
                scale: 1.5, // Reduced slightly from 2 to avoid memory bloat
                useCORS: true, // Attempt to load external images (like avatars/property thumbnails)
                logging: false, // Clean up console
                backgroundColor: '#f9fafb' // match bg-gray-50
            });

            // 2. Compute dimensions for an A4 page
            // Use JPEG compression instead of PNG to shrink file sizes from 11MB to ~500KB
            // This prevents browsers from overriding the file name to a raw Hash string due to size.
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // 3. Add the image to the PDF spanning the full computed width
            pdf.addImage(imgData, 'JPEG', 0, 10, pdfWidth, pdfHeight);

            // 4. Save the file explicitly forcing the browser to understand it's a PDF
            const pdfBlob = pdf.output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `Relatorio_Concierge_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            
            // Clean up memory
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);

            triggerToast('Relatório exportado com sucesso!', 'success');
        } catch (err) {
            console.error(err);
            triggerToast('Ocorreu um erro ao exportar o PDF.', 'error');
        } finally {
            setIsExportingPDF(false);
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
                                                <img className="h-full w-full object-cover" src={prop.imageUrl} alt={prop.title} />
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
                                                                <img className="h-full w-full object-cover" src={prop.imageUrl} alt={prop.title} />
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
                        {/* Header & Filter */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-gray-900 font-serif">Desempenho Geral</h2>
                                <p className="text-sm text-gray-500 mt-1">Visão dos acessos ao site e propriedades.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                <button
                                    onClick={handleExportPDF}
                                    disabled={isExportingPDF || analyticsData.loading}
                                    className="bg-white border border-gray-200 text-gray-700 px-4 py-2 text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                    title="Exportar Relatório em PDF"
                                >
                                    {isExportingPDF ? (
                                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <span className="material-symbols-outlined text-[18px]">download</span>
                                    )}
                                    <span className="hidden sm:inline">
                                        {isExportingPDF ? 'Gerando...' : 'Exportar PDF'}
                                    </span>
                                </button>
                                <div className="bg-white border border-gray-200 rounded-xl p-1 flex shadow-sm w-full md:w-auto overflow-x-auto no-scrollbar">
                                    {(
                                        [
                                            { value: 'TODAY', label: 'Hoje' },
                                            { value: 'LAST_7_DAYS', label: '7 Dias' },
                                            { value: 'THIS_MONTH', label: 'Este Mês' },
                                            { value: 'ALL_TIME', label: 'Tudo' }
                                        ] as const
                                    ).map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setTimeFilter(option.value)}
                                            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all whitespace-nowrap flex-1 md:flex-none ${timeFilter === option.value
                                                ? 'bg-primary text-white shadow-md'
                                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {analyticsData.loading ? (
                            <div className="flex justify-center items-center py-20">
                                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <div ref={reportRef} className="pb-4">
                                {/* Conditional Banner / Stats Cards */}
                                {selectedPropertyId ? (() => {
                                    const selectedProperty = properties.find(p => p.id === selectedPropertyId);
                                    if (!selectedProperty) return null;

                                    return (
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8 relative group">
                                            <div className="absolute top-0 left-0 w-2 h-full bg-primary z-10"></div>
                                            <div className="flex flex-col md:flex-row">
                                                {/* Image */}
                                                <div className="w-full md:w-[30%] h-48 md:h-auto relative">
                                                    <img src={selectedProperty.imageUrl} alt={selectedProperty.title} className="w-full h-full object-cover" />
                                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-900 shadow-sm flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-xs text-yellow-500">star</span>
                                                        {selectedProperty.rating} ({selectedProperty.reviews})
                                                    </div>
                                                </div>
                                                
                                                {/* Info Details */}
                                                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                                                                    selectedProperty.tags.includes('Pausado' as any) ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-700'
                                                                }`}>
                                                                    {selectedProperty.tags.includes('Pausado' as any) ? 'Pausado' : 'Online'}
                                                                </span>
                                                                <span className="text-gray-400 text-sm flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                                    {selectedProperty.location}
                                                                </span>
                                                            </div>
                                                            <h3 className="text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors">{selectedProperty.title}</h3>
                                                            {selectedProperty.ownerPhone && (
                                                                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                                                                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.208 5.077 4.494.708.307 1.261.49 1.694.627.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                                                    Contato: {selectedProperty.ownerPhone}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xl md:text-2xl font-bold text-gray-900 border-b border-gray-100 pb-2 mb-2">
                                                                <span className="text-sm text-gray-500 font-normal">A partir de</span> <br className="hidden sm:block"/>
                                                                R$ {selectedProperty.price} <span className="text-sm font-normal text-gray-500">/noite</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-sm text-gray-500 justify-end mt-2 font-medium">
                                                                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100"><span className="material-symbols-outlined text-[18px]">group</span> {selectedProperty.guests}</div>
                                                                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100"><span className="material-symbols-outlined text-[18px]">king_bed</span> {selectedProperty.bedrooms}</div>
                                                                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100"><span className="material-symbols-outlined text-[18px]">shower</span> {selectedProperty.baths}</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Analytics Recap for the selected item */}
                                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between mt-auto">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-primary">
                                                                <span className="material-symbols-outlined text-2xl">visibility</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-0.5">Visitas neste Período</p>
                                                                <p className="text-xl font-bold text-gray-900">{analyticsData.totalPropertyViews}</p>
                                                            </div>
                                                        </div>
                                                        <div className="hidden sm:flex items-center gap-3">
                                                             <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-blue-500">
                                                                <span className="material-symbols-outlined text-2xl">touch_app</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-0.5">Conversão (WhatsApp)</p>
                                                                <p className="text-xl font-bold text-gray-900 flex items-center gap-1">
                                                                    {analyticsData.totalPropertyViews > 0 ? '15.0%' : '0.0%'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
                                        <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="flex justify-between items-start mb-4 relative">
                                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                                    <span className="material-symbols-outlined">visibility</span>
                                                </div>
                                                <span className="text-green-600 bg-green-50 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">trending_up</span> +12%
                                                </span>
                                            </div>
                                            <div className="text-3xl font-bold text-gray-900 mb-1 relative">{analyticsData.totalPageViews}</div>
                                            <div className="text-sm font-medium text-gray-500 relative">Visualizações de Páginas</div>
                                        </div>

                                        <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="flex justify-between items-start mb-4 relative">
                                                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                                                    <span className="material-symbols-outlined">holiday_village</span>
                                                </div>
                                                <span className="text-green-600 bg-green-50 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">trending_up</span> +24%
                                                </span>
                                            </div>
                                            <div className="text-3xl font-bold text-gray-900 mb-1 relative">{analyticsData.totalPropertyViews}</div>
                                            <div className="text-sm font-medium text-gray-500 relative">Visualizações de Imóveis</div>
                                        </div>

                                        <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                            <div className="flex justify-between items-start mb-4 relative">
                                                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                                                    <span className="material-symbols-outlined">real_estate_agent</span>
                                                </div>
                                                <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs">trending_flat</span> 0%
                                                </span>
                                            </div>
                                            <div className="text-3xl font-bold text-gray-900 mb-1 relative">{properties.filter(p => !p.tags.includes('Pausado' as any)).length}</div>
                                            <div className="text-sm font-medium text-gray-500 relative">Propriedades Ativas no Momento</div>
                                        </div>
                                    </div>
                                )}

                                {/* Main Content Layout: Chart (Left) + Ranking (Right) */}
                                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                                    {/* Left Column: Analytics Over Time Chart */}
                                    <div className="xl:col-span-8 flex flex-col gap-6">
                                        {analyticsData.chartData.length > 0 ? (
                                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 flex-1 min-h-[400px]">
                                                <div className="flex justify-between items-center mb-6">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-primary text-xl">monitoring</span>
                                                            {selectedPropertyId ? 'Desempenho do Imóvel Selecionado' : 'Desempenho no Período'}
                                                        </h3>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {selectedPropertyId ? 'Visualizações focadas neste imóvel específico' : 'Comparativo de tráfego (Páginas vs Imóveis Individuais)'}
                                                        </p>
                                                    </div>
                                                    {selectedPropertyId && (
                                                        <button 
                                                            onClick={() => setSelectedPropertyId(null)}
                                                            className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                                            Limpar Filtro
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="h-[300px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={analyticsData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                            <defs>
                                                                <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                                </linearGradient>
                                                                <linearGradient id="colorPropViews" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                                                            <Tooltip
                                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}
                                                            />
                                                            <Area type="monotone" name="Imóveis Específicos" dataKey="propertyViews" stroke="#10b981" fillOpacity={1} fill="url(#colorPropViews)" strokeWidth={3} />
                                                            {!selectedPropertyId && (
                                                                <Area type="monotone" name="Visão Geral do Site" dataKey="pageViews" stroke="#3b82f6" fillOpacity={1} fill="url(#colorPageViews)" strokeWidth={3} />
                                                            )}
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm p-12 text-center flex-1 flex flex-col items-center justify-center min-h-[400px]">
                                                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">trending_down</span>
                                                <p className="font-medium text-gray-500">Sem dados suficientes para gerar o gráfico.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column: Top Properties */}
                                    <div className="xl:col-span-4">
                                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full max-h-[600px]">
                                            <div className="px-5 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-primary text-xl">local_fire_department</span>
                                                        Top Imóveis
                                                    </h3>
                                                    <p className="text-[10px] text-gray-500 mt-0.5">Ranking por volume de acessos</p>
                                                </div>
                                            </div>
                                            
                                            <div className="overflow-y-auto custom-scrollbar flex-1 relative">
                                                {analyticsData.topProperties.length > 0 ? (
                                                    <div className="divide-y divide-gray-50">
                                                        {analyticsData.topProperties.map((item, index) => (
                                                            <div 
                                                                key={item.property.id} 
                                                                onClick={() => setSelectedPropertyId(item.property.id)}
                                                                className={`p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-3 group cursor-pointer ${selectedPropertyId === item.property.id ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                                                            >
                                                                <div className="flex items-center gap-3 w-full max-w-[calc(100%-60px)]">
                                                                    <div className={`text-sm font-bold w-5 text-center flex-shrink-0 ${index < 3 ? 'text-primary' : 'text-gray-300'}`}>
                                                                        {index + 1}º
                                                                    </div>
                                                                    <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200 shadow-sm group-hover:scale-105 transition-transform">
                                                                        <img className="h-full w-full object-cover" src={item.property.imageUrl} alt={item.property.title} />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-primary transition-colors">{item.property.title}</div>
                                                                        <div className="text-[10px] text-gray-400 truncate w-full">{item.property.location}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end flex-shrink-0">
                                                                    <div className={`flex items-center gap-1 font-bold ${item.views > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                                                                        {item.views}
                                                                        <span className="material-symbols-outlined text-[14px] opacity-70">visibility</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-12 text-center text-gray-400 absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="material-symbols-outlined text-3xl mb-2 opacity-50">query_stats</span>
                                                        <p className="text-sm">Nenhum imóvel listado.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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