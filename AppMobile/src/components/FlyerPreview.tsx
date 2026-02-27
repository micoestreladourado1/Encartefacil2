import React, { forwardRef } from 'react';
import { View, Text, Image } from 'react-native';
import ViewShot from 'react-native-view-shot';
import { Flyer, Product } from '../types';
import { THEMES } from '../constants';

interface FlyerPreviewProps {
    flyer: Flyer;
}

export const FlyerPreview = forwardRef<ViewShot, FlyerPreviewProps>(({ flyer }, ref) => {
    const theme = THEMES.find((t) => t.id === flyer.themeId) || THEMES[0];

    return (
        <ViewShot ref={ref} options={{ format: 'png', quality: 0.9 }}>
            <View className="w-full bg-white flex-1 relative overflow-hidden shadow-sm rounded-xl mb-8">
                {/* Header */}
                {theme.bannerUrl ? (
                    <View className="w-full h-48 overflow-hidden">
                        <Image
                            source={theme.bannerUrl}
                            className="w-full h-full"
                            resizeMode="stretch"
                        />
                    </View>
                ) : (
                    <View className={`w-full p-6 ${theme.headerClass} rounded-b-[40px] shadow-lg items-center justify-center relative overflow-hidden`}>
                        <View className="bg-red-600 px-3 py-1 rounded-full mb-2 border border-white/20">
                            <Text className="text-white text-[10px] font-bold uppercase tracking-widest">Destaque da Semana</Text>
                        </View>
                        <Text className="text-4xl font-black uppercase italic tracking-tighter text-white text-center">
                            {theme.title}
                        </Text>
                        <Text className="text-sm font-medium mt-3 text-white opacity-90 text-center">Preços que cabem no seu bolso!</Text>
                    </View>
                )}

                {/* Content */}
                <View className={`flex-1 p-5 ${theme.bgClass}`}>
                    {!theme.bannerUrl && (
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-row items-center gap-2">
                                <Text className="text-red-500 text-2xl">🔥</Text>
                                <Text className={`text-lg font-bold ${theme.textClass}`}>Ofertas Imperdíveis</Text>
                            </View>
                            {flyer.validUntil ? (
                                <View className="bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                    <Text className="text-blue-800 text-[10px] font-bold">Válido até {flyer.validUntil}</Text>
                                </View>
                            ) : null}
                        </View>
                    )}

                    {theme.bannerUrl && flyer.validUntil && (
                        <View className="flex-row justify-end mb-4">
                            <View className="bg-blue-50 px-2 py-1 rounded-md border border-blue-100 shadow-sm">
                                <Text className="text-blue-800 text-[10px] font-bold">Válido até {flyer.validUntil}</Text>
                            </View>
                        </View>
                    )}

                    <View className="flex-row flex-wrap justify-between">
                        {flyer.products.map((product: Product) => {
                            const hasPromotion = product.newPrice !== null && product.newPrice < product.oldPrice;
                            const discount = hasPromotion
                                ? Math.round(((product.oldPrice - product.newPrice!) / product.oldPrice) * 100)
                                : 0;

                            return (
                                <View key={product.id} className="w-[48%] bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex-col relative mb-4">
                                    {discount > 0 && (
                                        <View className="absolute -top-2 -right-2 bg-red-500 px-2 py-1 rounded-full shadow-sm z-10 items-center">
                                            <Text className="text-white text-xs font-bold">-{discount}%</Text>
                                        </View>
                                    )}
                                    {product.isAdult && (
                                        <View className="absolute top-2 left-2 bg-red-600 w-6 h-6 items-center justify-center rounded-full shadow-sm z-10 border-2 border-white">
                                            <Text className="text-white text-[10px] font-black">+18</Text>
                                        </View>
                                    )}
                                    <View className="aspect-square rounded-xl bg-gray-50 mb-3 overflow-hidden items-center justify-center p-2">
                                        {product.imageUrl ? (
                                            <Image source={{ uri: product.imageUrl }} className="w-full h-full" resizeMode="contain" />
                                        ) : (
                                            <Text className="text-gray-300 text-4xl">📸</Text>
                                        )}
                                    </View>
                                    <View className="flex-1 flex-col">
                                        <Text className="text-sm font-semibold text-gray-800 mb-1 leading-tight" numberOfLines={2}>{product.name}</Text>
                                        <View className="mt-auto pt-2">
                                            {hasPromotion && (
                                                <Text className="text-xs text-gray-400 line-through">
                                                    De: R$ {product.oldPrice.toFixed(2).replace('.', ',')}
                                                </Text>
                                            )}
                                            <Text className="text-xl font-black text-red-600 leading-none">
                                                R$ {(hasPromotion ? product.newPrice! : product.oldPrice).toFixed(2).replace('.', ',')}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Footer */}
                <View className={`p-4 items-center border-t border-black/10 ${theme.bgClass}`}>
                    {(flyer.storeName || flyer.storeAddress) ? (
                        <View className="items-center mb-2">
                            {flyer.storeName ? (
                                <Text className="text-base font-black text-gray-800 text-center uppercase tracking-wide">
                                    {flyer.storeName}
                                </Text>
                            ) : null}
                            {flyer.storeAddress ? (
                                <Text className="text-xs font-medium text-gray-600 text-center mt-0.5">
                                    📍 {flyer.storeAddress}
                                </Text>
                            ) : null}
                        </View>
                    ) : null}
                    <Text className="text-[10px] font-medium opacity-50 text-center">
                        Imagens meramente ilustrativas. Beba com moderação.
                    </Text>
                </View>
            </View>
        </ViewShot>
    );
});

FlyerPreview.displayName = 'FlyerPreview';
