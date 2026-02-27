import React from 'react';
import { Flyer, Product, Theme } from '../types';
import { THEMES } from '../constants';

interface FlyerPreviewProps {
  flyer: Flyer;
}

export const FlyerPreview: React.FC<FlyerPreviewProps> = ({ flyer }) => {
  const theme = THEMES.find((t) => t.id === flyer.themeId) || THEMES[0];
  const hasAdultProducts = flyer.products.some(p => p.isAdult);

  return (
    <div
      id="flyer-preview"
      className={`w-full max-w-[400px] mx-auto bg-white min-h-[700px] flex flex-col font-sans relative overflow-hidden shadow-2xl rounded-xl mb-8`}
    >
      {/* Header */}
      <div className={`w-full p-6 ${theme.headerClass} rounded-b-[40px] shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        <div className="bg-red-600 px-3 py-1 rounded-full mb-2 border border-white/20">
          <span className="text-white text-[10px] font-bold uppercase tracking-widest leading-none">Destaque da Semana</span>
        </div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white drop-shadow-md leading-none">
          {theme.title}
        </h1>
        <p className="text-sm font-medium mt-3 text-white opacity-90 leading-tight">Preços que cabem no seu bolso!</p>
      </div>

      {/* Content */}
      <div className={`flex-1 p-5 ${theme.bgClass}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-lg font-bold flex items-center gap-2 ${theme.textClass}`}>
            <span className="text-red-500 text-2xl">🔥</span> Ofertas Imperdíveis
          </h2>
          {flyer.validUntil && (
            <div className="bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
              <span className="text-blue-800 text-[10px] font-bold">Válido até {flyer.validUntil}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {flyer.products.map((product) => {
            const hasPromotion = product.newPrice !== null && product.newPrice < product.oldPrice;
            const discount = hasPromotion
              ? Math.round(((product.oldPrice - product.newPrice!) / product.oldPrice) * 100)
              : 0;

            return (
              <div key={product.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col relative group">
                {discount > 0 && (
                  <div className="absolute -top-2 -right-2 bg-red-500 px-2 py-1 rounded-full shadow-sm z-10 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">-{discount}%</span>
                  </div>
                )}
                {product.isAdult && (
                  <div className="absolute top-2 left-2 bg-red-600 w-6 h-6 flex items-center justify-center rounded-full shadow-sm z-10 border-2 border-white">
                    <span className="text-white text-[10px] font-black">+18</span>
                  </div>
                )}
                <div className="aspect-square rounded-xl bg-gray-50 mb-3 overflow-hidden flex items-center justify-center p-2 relative">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" crossOrigin="anonymous" />
                  ) : (
                    <div className="text-gray-300 text-4xl">📸</div>
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-800 leading-tight mb-1 line-clamp-2">{product.name}</h3>
                  <div className="mt-auto pt-2">
                    {hasPromotion && (
                      <div className="text-xs text-gray-400 line-through">
                        De: R$ {product.oldPrice.toFixed(2).replace('.', ',')}
                      </div>
                    )}
                    <div className="text-xl font-black text-red-600 leading-none">
                      R$ {(hasPromotion ? product.newPrice! : product.oldPrice).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className={`p-4 text-center ${theme.bgClass} border-t border-gray-100/50 mt-auto`}>
        {flyer.storeName && (
          <div className="text-sm font-black text-gray-800 uppercase tracking-tight mb-0.5">
            {flyer.storeName}
          </div>
        )}
        {flyer.storeAddress && (
          <div className="text-[10px] font-bold text-gray-600 mb-2 flex items-center justify-center gap-1">
            <span>📍</span> {flyer.storeAddress}
          </div>
        )}
        <span className="text-[9px] font-medium opacity-50 block text-center leading-tight">
          Imagens meramente ilustrativas.{hasAdultProducts ? ' Beba com moderação.' : ''}
        </span>
      </div>
    </div>
  );
};
