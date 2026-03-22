import "./global.css";
import { useEffect, useState, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { initDb } from './src/database/db';
import { getCurrentFlyer, saveCurrentFlyer } from './src/database/repository';
import { ProductForm } from './src/components/ProductForm';
import { FlyerPreview } from './src/components/FlyerPreview';
import { Flyer, Product, Theme } from './src/types';
import { Trash2, Share2, Edit2, ShieldCheck } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { THEMES } from './src/constants';
import { ActivationService } from './src/services/activationService';
import { ActivationScreen } from './src/components/ActivationScreen';
import { BlockedScreen } from './src/components/BlockedScreen';

type ActivationState = 'checking' | 'active' | 'inactive' | 'blocked';

export default function App() {
  const [activationState, setActivationState] = useState<ActivationState>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [flyer, setFlyer] = useState<Flyer>({
    id: '1',
    themeId: 'oferta-do-dia',
    validUntil: '',
    storeName: '',
    storeAddress: '',
    products: [],
  });
  const [isDbReady, setIsDbReady] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const flatListRef = useRef<FlatList>(null);

  // --- Lógica de Ativação ---
  const checkInitialActivation = async () => {
    setActivationState('checking');
    try {
      // 1. Verifica se já tem token local
      const isActivatedLocally = await ActivationService.getIsActivated();

      if (!isActivatedLocally) {
        setActivationState('inactive');
        return;
      }

      // 2. Valida com o servidor
      const result = await ActivationService.validateStatus();

      if (result.status === 'active') {
        setActivationState('active');
      } else if (result.status === 'blocked') {
        setActivationState('blocked');
        setErrorMessage(result.message || '');
      } else {
        setActivationState('inactive');
      }
    } catch (error) {
      console.error('Validation auto-check failed', error);
      // Fallback: se falhar conexão, mas tiver token, podemos deixar entrar?
      // O requisito diz: "Se estiver inválido ou bloqueado: desativar app imediatamente"
      // Vamos assumir que sem internet ou sem validação, volta para ativação.
      setActivationState('inactive');
    }
  };

  useEffect(() => {
    checkInitialActivation();
  }, []);

  // --- Inicialização do App ---
  useEffect(() => {
    if (activationState !== 'active') return;

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
  }, [activationState]);

  useEffect(() => {
    if (isDbReady && activationState === 'active') {
      try {
        saveCurrentFlyer(flyer);
      } catch (e) {
        console.error('Failed to save flyer', e);
      }
    }
  }, [flyer, isDbReady, activationState]);

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

  const handleUpdateProduct = (updatedProduct: Product) => {
    setFlyer((prev) => ({
      ...prev,
      products: prev.products.map((p) => p.id === updatedProduct.id ? updatedProduct : p),
    }));
    setEditingProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
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
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={() => handleEditProduct(item)}
          activeOpacity={0.6}
          className="p-3 justify-center items-center"
        >
          <Edit2 color="#2563eb" size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleRemoveProduct(item.id, item.name)}
          activeOpacity={0.6}
          className="p-3 justify-center items-center"
        >
          <Trash2 color="#ef4444" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  ), [handleRemoveProduct]);

  // --- Renderização Condicional ---
  if (activationState === 'checking') {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#dc2626" />
        <Text className="mt-4 text-gray-500 font-bold uppercase tracking-widest text-xs">
          Verificando Licença...
        </Text>
      </View>
    );
  }

  if (activationState === 'blocked') {
    return <BlockedScreen message={errorMessage} onRetry={checkInitialActivation} />;
  }

  if (activationState === 'inactive') {
    return <ActivationScreen onActivated={() => setActivationState('active')} />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-4 flex-row items-center justify-between z-10">
          <View className="flex-row items-center gap-2 mt-4">
            <View className="w-8 h-8 bg-red-600 rounded-lg items-center justify-center">
              <Text className="text-white font-black italic">E</Text>
            </View>
            <Text className="text-xl font-black tracking-tight text-gray-800">
              Encartes<Text className="text-red-600">Pro</Text>
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
          ref={flatListRef}
          className="flex-1 bg-gray-100"
          contentContainerStyle={{ padding: 16 }}
          data={flyer.products}
          keyExtractor={(item) => item.id}
          extraData={flyer}
          renderItem={renderProductItem}
          ListHeaderComponent={
            <View>
              <ProductForm
                onAdd={handleAddProduct}
                editingProduct={editingProduct}
                onUpdate={handleUpdateProduct}
                onCancel={handleCancelEdit}
              />

              {/* Theme Selector */}
              <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <Text className="font-bold text-gray-800 mb-4 text-lg">Tema do Encarte</Text>
                <View className="flex-row flex-wrap gap-2">
                  {THEMES.map((theme: Theme) => (
                    <TouchableOpacity
                      key={theme.id}
                      onPress={() => setFlyer(prev => ({ ...prev, themeId: theme.id }))}
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
                      onChangeText={(text) => setFlyer(prev => ({ ...prev, storeName: text }))}
                      placeholder="Ex: Supermercado Bom Preço"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-medium text-gray-500 mb-1">Endereço</Text>
                    <TextInput
                      className="w-full px-3 h-12 bg-gray-50 border border-gray-200 rounded-lg text-base"
                      value={flyer.storeAddress}
                      onChangeText={(text) => setFlyer(prev => ({ ...prev, storeAddress: text }))}
                      placeholder="Ex: Rua das Flores, 123 - Centro"
                    />
                  </View>
                  <View>
                    <Text className="text-xs font-medium text-gray-500 mb-1">Validade (Texto)</Text>
                    <TextInput
                      className="w-full px-3 h-12 bg-gray-50 border border-gray-200 rounded-lg text-base"
                      value={flyer.validUntil}
                      onChangeText={(text) => setFlyer(prev => ({ ...prev, validUntil: text }))}
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
              <FlyerPreview
                key={`preview-${flyer.products.length}-${flyer.themeId}`}
                ref={viewShotRef}
                flyer={flyer}
              />
            </View>
          }
        />

        <View className="bg-gray-50 py-2 border-t border-gray-100 flex-row justify-center items-center opacity-40">
          <ShieldCheck color="#6b7280" size={12} className="mr-1" />
          <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-widest text-center">
            Arquivo oficial: encartespro.apk • Licenciado
          </Text>
        </View>

        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
