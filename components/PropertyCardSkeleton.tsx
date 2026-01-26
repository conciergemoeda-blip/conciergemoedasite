import React from 'react';

interface PropertyCardSkeletonProps {
    count?: number;
}

export const PropertyCardSkeleton: React.FC<PropertyCardSkeletonProps> = ({ count = 6 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="animate-fade-in"
                    style={{
                        animationDelay: `${index * 75}ms`,
                        animationFillMode: 'backwards'
                    }}
                >
                    <div className="flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100">
                        {/* Image Skeleton */}
                        <div className="aspect-[4/3] skeleton bg-gray-200" />

                        {/* Content Skeleton */}
                        <div className="p-5 space-y-4">
                            {/* Title & Rating */}
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 space-y-2">
                                    <div className="skeleton skeleton-title w-3/4 h-5" />
                                    <div className="skeleton w-1/2 h-4" />
                                </div>
                                <div className="skeleton w-12 h-6 rounded-lg" />
                            </div>

                            {/* Amenities */}
                            <div className="flex gap-4 pt-3 border-t border-gray-100">
                                <div className="skeleton w-12 h-4" />
                                <div className="skeleton w-12 h-4" />
                                <div className="skeleton w-12 h-4" />
                            </div>

                            {/* Price */}
                            <div className="flex justify-between items-end pt-3 border-t border-gray-50">
                                <div className="space-y-2">
                                    <div className="skeleton w-20 h-3" />
                                    <div className="skeleton w-24 h-6" />
                                </div>
                                <div className="skeleton w-24 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};
