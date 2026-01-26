import React from 'react';

export const PropertySkeleton = () => (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
        {/* Image Placeholder */}
        <div className="aspect-[4/3] bg-gray-200 relative">
            <div className="absolute top-3 left-3 flex gap-2">
                <div className="h-6 w-16 bg-white/50 rounded-full"></div>
            </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 gap-4">
            {/* Title & Location */}
            <div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>

            {/* Icons */}
            <div className="flex gap-4 pt-3 border-t border-gray-100">
                <div className="h-4 w-12 bg-gray-200 rounded"></div>
                <div className="h-4 w-12 bg-gray-200 rounded"></div>
                <div className="h-4 w-12 bg-gray-200 rounded"></div>
            </div>

            {/* Price & Button */}
            <div className="mt-2 pt-3 border-t border-gray-50 flex justify-between items-end">
                <div className="h-8 w-24 bg-gray-200 rounded"></div>
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
            </div>
        </div>
    </div>
);
