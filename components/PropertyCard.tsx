import React from 'react';
import { Property } from '../types';

interface PropertyCardProps {
  property: Property;
  onClick: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick }) => {
  const [isFavorite, setIsFavorite] = React.useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <div
      onClick={() => onClick(property.id)}
      className="group cursor-pointer flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary/20 card-hover"
      style={{
        boxShadow: 'var(--shadow-soft)',
        transition: 'all var(--transition-slow)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
      }}
    >
      {/* Image Container with Overlay */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-200">
        <img
          src={property.imageUrl || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=80'}
          alt={property.title}
          loading="lazy"
          width="600"
          height="450"
          className="w-full h-full object-cover transform group-hover:scale-110 transition-all duration-700 ease-out"
        />

        {/* Gradient Overlay (subtle) */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Badges with Glassmorphism */}
        <div className="absolute top-3 left-3 flex gap-2">
          {property.tags.map((tag, index) => (
            <span
              key={tag}
              className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide glass-light shadow-sm animate-fade-in ${tag === 'Superhost' ? 'text-primary border border-primary/20' :
                tag === 'Novo' ? 'bg-secondary/90 text-white border border-secondary animate-pulse' :
                  'bg-green-50/90 text-green-800 border border-green-200'
                }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {tag === 'Superhost' && <span className="material-symbols-outlined text-xs mr-1 icon-filled">verified</span>}
              {tag === 'Novo' && <span className="material-symbols-outlined text-xs mr-1 icon-filled">new_releases</span>}
              {tag}
            </span>
          ))}
        </div>

        {/* Favorite Button with Heart Animation */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 p-2 rounded-full glass-light hover:glass-primary text-gray-700 hover:text-primary transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95 shadow-md"
          style={{ transition: 'all var(--transition-base)' }}
        >
          <span className={`material-symbols-outlined text-xl transition-all duration-300 ${isFavorite ? 'icon-filled text-red-500 scale-125' : ''}`}>
            {isFavorite ? 'favorite' : 'favorite_border'}
          </span>
        </button>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title & Rating */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 pr-2">
            <h3 className="font-serif font-bold text-lg text-gray-900 leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-1 capitalize">
              {property.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1 capitalize">
              <span className="material-symbols-outlined text-base text-gray-400">location_on</span>
              <span className="line-clamp-1">{property.location}</span>
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm font-bold text-gray-900 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100 flex-shrink-0">
            <span className="material-symbols-outlined text-yellow-500 text-base icon-filled">star</span>
            {property.rating}
          </div>
        </div>

        {/* Amenities Icons */}
        <div className="flex items-center gap-3 mt-3 text-gray-500 text-[11px] font-bold uppercase tracking-tighter border-t border-gray-100 pt-3">
          <span className="flex items-center gap-1 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-base">group</span>
            <span>{property.guests} Hóspedes</span>
          </span>
          <span className="flex items-center gap-1 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-base">bed</span>
            <span>{property.bedrooms} Quartos</span>
          </span>
          <span className="flex items-center gap-1 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-base">shower</span>
            <span>{property.baths} {property.baths === 1 ? 'Banheiro' : 'Banh.'}</span>
          </span>
        </div>

        {/* Extra Pricing Info Badge */}
        {(property.weekend_price || property.cleaning_fee) ? (
          <div className="mt-2 flex gap-2">
            {property.weekend_price && property.weekend_price > 0 && (
              <span className="text-[9px] bg-primary/5 text-primary-dark px-2 py-0.5 rounded-md font-bold uppercase">FDS R$ {property.weekend_price}</span>
            )}
            {property.cleaning_fee && property.cleaning_fee > 0 && (
              <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-bold uppercase">Limpeza R$ {property.cleaning_fee}</span>
            )}
          </div>
        ) : null}

        {/* Price & CTA */}
        <div className="mt-auto pt-4 flex justify-between items-end gap-1">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">A partir de</span>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-2xl text-primary gradient-text-primary">R$ {property.price}</span>
              <span className="text-[10px] text-gray-500 font-bold">/ diária</span>
            </div>
          </div>
          <button
            className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1 hover:gap-2 transition-all duration-300 hover:text-primary group/btn bg-gray-50 px-3 py-2 rounded-xl border border-transparent hover:border-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              onClick(property.id);
            }}
          >
            <span>Ver</span>
            <span className="material-symbols-outlined text-base group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};