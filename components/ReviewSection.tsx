import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { ConfirmModal } from './ConfirmModal';

interface Review {
    id: string;
    author_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

interface ReviewSectionProps {
    propertyId: string;
    propertyName: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ propertyId, propertyName }) => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [authorName, setAuthorName] = useState('');
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Notification State
    const { showToast } = useToast();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

    const fetchReviews = async () => {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('property_id', propertyId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (err) {
            console.error('Error loading reviews:', err);
        } finally {
            setLoading(false);
        }
    };

    const updatePropertyMetadata = async () => {
        const { data: allReviews, error: fetchError } = await supabase
            .from('reviews')
            .select('rating')
            .eq('property_id', propertyId);

        if (!fetchError && allReviews) {
            const count = allReviews.length;
            const avgRating = count > 0
                ? allReviews.reduce((acc, r) => acc + r.rating, 0) / count
                : 5.0; // Default if no reviews

            await supabase
                .from('properties')
                .update({
                    rating: Number(avgRating.toFixed(1)),
                    reviews_count: count
                })
                .eq('id', propertyId);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [propertyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authorName || !comment) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('reviews')
                .insert([{
                    property_id: propertyId,
                    author_name: authorName,
                    rating,
                    comment
                }]);

            if (error) throw error;

            await updatePropertyMetadata();

            // Reset form and reload
            setAuthorName('');
            setComment('');
            setRating(5);
            setShowForm(false);
            fetchReviews();
            showToast('Avaliação enviada com sucesso!', 'success');
        } catch (err: any) {
            showToast('Erro ao enviar avaliação: ' + err.message, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        setReviewToDelete(reviewId);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!reviewToDelete) return;

        try {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', reviewToDelete);

            if (error) throw error;

            await updatePropertyMetadata();
            fetchReviews();
            showToast('Avaliação excluída com sucesso!', 'success');
        } catch (err: any) {
            showToast('Erro ao excluir avaliação: ' + err.message, 'error');
        } finally {
            setIsDeleteModalOpen(false);
            setReviewToDelete(null);
        }
    };

    return (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm animate-fade-in" id="reviews">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Avaliações dos Hóspedes</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="flex items-center text-yellow-500 font-bold">
                            <span className="material-symbols-outlined text-xl icon-filled mr-1">star</span>
                            {reviews.length > 0
                                ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                                : 'Novo'}
                        </span>
                        <span>•</span>
                        <span>{reviews.length} comentários</span>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                >
                    {showForm ? 'Cancelar' : 'Avaliar Estadia'}
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100 animate-slide-down">
                    <h3 className="font-bold text-gray-900 mb-4">Compartilhe sua experiência</h3>

                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Sua Nota</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`text-2xl transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-500 material-symbols-outlined icon-filled' : 'text-gray-300 material-symbols-outlined'}`}
                                >
                                    star
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Seu Nome</label>
                        <input
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                            placeholder="Ex: Maria Silva"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Comentário</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary resize-none"
                            rows={3}
                            placeholder="Conte como foi sua estadia..."
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Enviando...' : 'Publicar Avaliação'}
                    </button>
                </form>
            )}

            {/* List */}
            <div className="space-y-6">
                {loading ? (
                    <p className="text-gray-500 text-center py-8">Carregando avaliações...</p>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">rate_review</span>
                        <p className="text-gray-500 font-medium">Seja o primeiro a avaliar este imóvel!</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-lg">
                                        {review.author_name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-900">{review.author_name}</h4>
                                            {user && (
                                                <button
                                                    onClick={() => handleDeleteReview(review.id)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                                    title="Excluir Avaliação"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <div className="flex text-yellow-500 text-sm">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <span key={i} className={`material-symbols-outlined text-lg ${i < review.rating ? 'icon-filled' : 'text-gray-200'}`}>
                                            star
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <p className="text-gray-600 leading-relaxed ml-13 pl-13">{review.comment}</p>
                        </div>
                    ))
                )}
            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                title="Excluir Avaliação"
                message="Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita."
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteModalOpen(false)}
                confirmLabel="Excluir"
                isDanger={true}
            />
        </div>
    );
};
