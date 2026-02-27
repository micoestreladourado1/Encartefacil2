/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Flyer, Product, Theme } from './types';
import { THEMES } from './constants';
import { FlyerPreview } from './components/FlyerPreview';
import { ProductForm } from './components/ProductForm';
import { exportAsImage } from './utils/exportImage';
import { Download, Share2, Trash2, Settings, LayoutTemplate } from 'lucide-react';

export default function App() {
  const [flyer, setFlyer] = useState<Flyer>(() => {
    const saved = localStorage.getItem('encartes-facil-flyer');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return {
      id: '1',
      themeId: 'oferta-do-dia',
      validUntil: '',
      storeName: '',
      storeAddress: '',
      products: [],
    };
  });

  useEffect(() => {
    localStorage.setItem('encartes-facil-flyer', JSON.stringify(flyer));
  }, [flyer]);

  const handleAddProduct = (newProduct: Omit<Product, 'id'>) => {
    const product: Product = {
      ...newProduct,
      id: Math.random().toString(36).substr(2, 9),
    };
    setFlyer((prev) => ({
      ...prev,
      products: [...prev.products, product],
    }));
  };

  const handleRemoveProduct = (id: string) => {
    setFlyer((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  };

  const handleShare = async () => {
    alert('No navegador, você pode usar o botão "Exportar Imagem" para salvar o encarte e compartilhar!');
  };

  const handleExport = () => {
    exportAsImage('flyer-preview', 'png', `encarte-${new Date().getTime()}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans selection:bg-red-200">
      {/* Header - Mobile Style */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[500px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black italic">
              E
            </div>
            <h1 className="text-xl font-black tracking-tight text-gray-800">
              Encartes<span className="text-red-600">Fácil</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors border border-green-200"
              title="Compartilhar"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[500px] mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">

          {/* 1. Add Product Form - Same as mobile */}
          <ProductForm onAdd={handleAddProduct} />

          {/* 2. Theme Selector - Same as mobile */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4 text-lg">Tema do Encarte</h2>

            <div className="flex flex-wrap gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setFlyer({ ...flyer, themeId: theme.id })}
                  className={`p-3 rounded-xl border-2 flex-1 min-w-[45%] text-left transition-all ${flyer.themeId === theme.id
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                    }`}
                >
                  <div className={`w-full h-4 rounded-md mb-2 ${theme.headerClass}`}></div>
                  <div className="text-xs font-bold text-gray-700 text-center">{theme.name}</div>
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nome do Comércio</label>
                <input
                  type="text"
                  value={flyer.storeName}
                  onChange={(e) => setFlyer({ ...flyer, storeName: e.target.value })}
                  className="w-full px-3 h-12 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-base"
                  placeholder="Ex: Mercado Central"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Endereço</label>
                <input
                  type="text"
                  value={flyer.storeAddress}
                  onChange={(e) => setFlyer({ ...flyer, storeAddress: e.target.value })}
                  className="w-full px-3 h-12 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-base"
                  placeholder="Ex: Rua das Oliveiras, 45"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Validade (Texto)</label>
                <input
                  type="text"
                  value={flyer.validUntil}
                  onChange={(e) => setFlyer({ ...flyer, validUntil: e.target.value })}
                  className="w-full px-3 h-12 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-base"
                  placeholder="Ex: Válido até 15/10"
                />
              </div>
            </div>
          </section>

          {/* 3. Products List - Same as mobile */}
          <section className="space-y-3">
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-lg font-bold text-gray-800">
                Produtos ({flyer.products.length})
              </h2>
              {flyer.products.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja limpar o encarte?')) {
                      setFlyer(p => ({ ...p, products: [] }));
                    }
                  }}
                  className="px-2 py-1 text-red-500 text-sm font-medium hover:bg-red-50 rounded-lg transition-colors"
                >
                  Limpar Tudo
                </button>
              )}
            </div>

            {flyer.products.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-gray-300 text-center text-gray-400 text-sm">
                Nenhum produto adicionado ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {flyer.products.map((product) => (
                  <div key={product.id} className="flex items-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 overflow-hidden mr-3 shrink-0">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-gray-300 text-[10px] text-center">Sem img</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 truncate">{product.name}</h4>
                      <div className="text-xs text-gray-500">
                        R$ {(product.newPrice !== null ? product.newPrice : product.oldPrice).toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveProduct(product.id)}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remover produto"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 4. Preview Area - Same as mobile */}
          <section className="mt-4 mb-16">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-bold text-gray-800">Pré-visualização</h2>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Imagem</span>
              </button>
            </div>
            <div className="w-full flex justify-center">
              <FlyerPreview flyer={flyer} />
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
