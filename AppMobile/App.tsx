import "./global.css";
import { useEffect, useState, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, FlatList, Image, Alert, TextInput } from 'react-native';
import { initDb } from './src/database/db';
import { getCurrentFlyer, saveCurrentFlyer } from './src/database/repository';
import { ProductForm } from './src/components/ProductForm';
import { FlyerPreview } from './src/components/FlyerPreview';
import { Flyer, Product, Theme } from './src/types';
import { Trash2, Share2 } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { THEMES } from './src/constants';

export default function App() {
  const [flyer, setFlyer] = useState<Flyer>({
    id: '1',
    themeId: 'oferta-do-dia',
    validUntil: '',
    storeName: '',
    storeAddress: '',
    products: [],
  });
  const [isDbReady, setIsDbReady] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    let mounted = true;

    const initApp = async () => {
      try {
        console.log('Starting SQLite Initialization...');
        initDb();
        console.log('Database initialized successfully');

        const saved = getCurrentFlyer();
        if (mounted && saved) {
          console.log('Loaded saved flyer from disk');
          setFlyer(saved);
        }
        if (mounted) setIsDbReady(true);
      } catch (e) {
        console.error('CRITICAL: Database initialization failed', e);
      }
    };

    initApp();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (isDbReady) {
      try {
        saveCurrentFlyer(flyer);
      } catch (e) {
        console.error('Failed to save flyer', e);
      }
    }
  }, [flyer, isDbReady]);

  const handleShare = async () => {
    if (!viewShotRef.current) return;

    try {
      const uri = await viewShotRef.current.capture?.();
      if (uri) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartilhar Encarte',
          UTI: 'public.png',
        });
      }
    } catch (e) {
      console.error('Failed to share flyer', e);
      Alert.alert('Erro', 'Não foi possível compartilhar o encarte.');
    }
  };

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

  const handleRemoveProduct = useCallback((id: string, productName: string) => {
    Alert.alert(
      'Remover Produto',
      `Deseja remover "${productName}" do encarte?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setFlyer((prev) => ({
              ...prev,
              products: prev.products.filter((p) => p.id !== id),
            }));
          }
        },
      ]
    );
  }, []);

  const renderProductItem = useCallback(({ item }: { item: Product }) => (
    <View className="flex-row items-center p-3 bg-white rounded-xl mb-3 border border-gray-100 shadow-sm overflow-hidden">
      <View className="w-12 h-12 bg-gray-50 rounded-lg justify-center items-center border border-gray-100 overflow-hidden mr-3">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="contain" />
        ) : (
          <Text className="text-gray-300 text-xs text-center">Sem img</Text>
        )}
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>{item.name}</Text>
        <Text className="text-xs text-gray-500">
          R$ {(item.newPrice !== null ? item.newPrice : item.oldPrice).toFixed(2).replace('.', ',')}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveProduct(item.id, item.name)}
        activeOpacity={0.6}
        className="p-4 -mr-2 justify-center items-center"
        style={{ minWidth: 50, minHeight: 50 }}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <View pointerEvents="none">
          <Trash2 color="#ef4444" size={22} />
        </View>
      </TouchableOpacity>
    </View>
  ), [handleRemoveProduct]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4 flex-row items-center justify-between z-10">
        <View className="flex-row items-center gap-2 mt-4">
          <View className="w-8 h-8 bg-red-600 rounded-lg items-center justify-center">
            <Text className="text-white font-black italic">E</Text>
          </View>
          <Text className="text-xl font-black tracking-tight text-gray-800">
            Encartes<Text className="text-red-600">Fácil</Text>
          </Text>
        </View>
        <View className="mt-4">
          <TouchableOpacity
            onPress={handleShare}
            className="p-2 bg-green-50 rounded-lg border border-green-200"
          >
            <Share2 color="#16a34a" size={22} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        className="flex-1 bg-gray-100"
        contentContainerStyle={{ padding: 16 }}
        data={flyer.products}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
        ListHeaderComponent={
          <View>
            <ProductForm onAdd={handleAddProduct} />

            {/* Theme Selector */}
            <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <Text className="font-bold text-gray-800 mb-4 text-lg">Tema do Encarte</Text>
              <View className="flex-row flex-wrap gap-2">
                {THEMES.map((theme: Theme) => (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => setFlyer({ ...flyer, themeId: theme.id })}
                    className={`p-3 rounded-xl border-2 flex-1 min-w-[45%] ${flyer.themeId === theme.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-100 bg-gray-50'
                      }`}
                  >
                    <View className={`w-full h-4 rounded-md mb-2 ${theme.headerClass}`} />
                    <Text className="text-xs font-bold text-gray-700 text-center">{theme.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View className="mt-4 gap-3">
                <View>
                  <Text className="text-xs font-medium text-gray-500 mb-1">Nome do Comércio</Text>
                  <TextInput
                    className="w-full px-3 h-12 bg-gray-50 border border-gray-200 rounded-lg text-base"
                    value={flyer.storeName}
                    onChangeText={(text) => setFlyer({ ...flyer, storeName: text })}
                    placeholder="Ex: Supermercado Bom Preço"
                  />
                </View>
                <View>
                  <Text className="text-xs font-medium text-gray-500 mb-1">Endereço</Text>
                  <TextInput
                    className="w-full px-3 h-12 bg-gray-50 border border-gray-200 rounded-lg text-base"
                    value={flyer.storeAddress}
                    onChangeText={(text) => setFlyer({ ...flyer, storeAddress: text })}
                    placeholder="Ex: Rua das Flores, 123 - Centro"
                  />
                </View>
                <View>
                  <Text className="text-xs font-medium text-gray-500 mb-1">Validade (Texto)</Text>
                  <TextInput
                    className="w-full px-3 h-12 bg-gray-50 border border-gray-200 rounded-lg text-base"
                    value={flyer.validUntil}
                    onChangeText={(text) => setFlyer({ ...flyer, validUntil: text })}
                    placeholder="Ex: Válido até 15/10"
                  />
                </View>
              </View>
            </View>

            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-bold text-gray-800">Produtos ({flyer.products.length})</Text>
              {flyer.products.length > 0 && (
                <TouchableOpacity onPress={() => setFlyer(p => ({ ...p, products: [] }))} className="px-2 py-1">
                  <Text className="text-red-500 text-sm font-medium">Limpar Tudo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListFooterComponent={
          <View className="mt-8 mb-12">
            <Text className="text-lg font-bold text-gray-800 mb-4 px-2">Pré-visualização</Text>
            <FlyerPreview ref={viewShotRef} flyer={flyer} />
          </View>
        }
      />

      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
