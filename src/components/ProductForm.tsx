import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, Modal, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { Product } from '../types';
import { Search, X, Check, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface ProductFormProps {
    onAdd: (product: Omit<Product, 'id'>) => void;
    editingProduct: Product | null;
    onUpdate: (product: Product) => void;
    onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ onAdd, editingProduct, onUpdate, onCancel }) => {
    const [name, setName] = useState('');
    const [oldPrice, setOldPrice] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isAdult, setIsAdult] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<string[]>([]);

    React.useEffect(() => {
        if (editingProduct) {
            setName(editingProduct.name);
            setOldPrice(editingProduct.oldPrice.toString().replace('.', ','));
            setNewPrice(editingProduct.newPrice ? editingProduct.newPrice.toString().replace('.', ',') : '');
            setImageUrl(editingProduct.imageUrl);
            setIsAdult(editingProduct.isAdult);
        } else {
            setName('');
            setOldPrice('');
            setNewPrice('');
            setImageUrl('');
            setIsAdult(false);
        }
    }, [editingProduct]);

    const handleSearch = async () => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            Alert.alert('Busca de Imagem', 'Por favor, digite o nome do produto primeiro.');
            return;
        }

        setIsSearching(true);
        setIsSearchModalOpen(true);
        setSearchResults([]);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000);

            // Use an old mobile User-Agent to force Google to return a simple, scrapable HTML page (Table-based)
            const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.3 (KHTML, like Gecko) Version/8.0 Mobile/12A4345d Safari/600.1.4';

            // Search for the product name with 'imagens' prefix for better precision
            const response = await fetch(
                `https://www.google.com/search?q=${encodeURIComponent('imagens ' + trimmedName)}&tbm=isch`,
                {
                    headers: { 'User-Agent': mobileUA },
                    signal: controller.signal
                }
            );
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`Google returned ${response.status}`);

            const html = await response.text();
            const urls: string[] = [];

            // Pattern 1: Basic <img> tags from the simple mobile version
            const imgRegex = /<img[^>]+src="([^">]+)"/g;
            let match;
            while ((match = imgRegex.exec(html)) !== null && urls.length < 20) {
                const url = match[1];
                // Ignore small icons or google UI elements
                if (url.startsWith('http') && !url.includes('google.com/favicon') && !url.includes('menu_icon')) {
                    if (!urls.includes(url)) urls.push(url);
                }
            }

            // Pattern 2: Fallback for modern strings if Google ignores the UA (gstatic thumbnails)
            if (urls.length < 5) {
                const thumbRegex = /"(https?:\/\/encrypted-tbn[0-9]\.gstatic\.com\/images\?q=[^"]+)"/g;
                let tMatch;
                while ((tMatch = thumbRegex.exec(html)) !== null && urls.length < 30) {
                    const url = tMatch[1];
                    if (!urls.includes(url)) urls.push(url);
                }
            }

            setSearchResults(urls);

            if (urls.length === 0) {
                Alert.alert(
                    'Sem Resultados',
                    'Não encontramos imagens no Google para este produto. Tente simplificar o nome.',
                );
            }
        } catch (error: any) {
            console.warn('Google search failed:', error?.message);
            Alert.alert('Erro na Busca', 'Não conseguimos conectar à busca do Google agora.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleCamera = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão Negada', 'Precisamos de acesso à câmera para tirar a foto do produto.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImageUrl(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Erro', 'Não foi possível abrir a câmera.');
        }
    };

    const selectImage = (url: string) => {
        setImageUrl(url);
        setIsSearchModalOpen(false);
    };

    const handleSubmit = () => {
        if (editingProduct) {
            onUpdate({
                ...editingProduct,
                name,
                oldPrice: parseFloat(oldPrice.replace(',', '.')) || 0,
                newPrice: newPrice ? parseFloat(newPrice.replace(',', '.')) : null,
                imageUrl,
                isAdult,
            });
            Alert.alert('Sucesso', 'Produto atualizado!');
        } else {
            onAdd({
                name,
                oldPrice: parseFloat(oldPrice.replace(',', '.')) || 0,
                newPrice: newPrice ? parseFloat(newPrice.replace(',', '.')) : null,
                imageUrl,
                isAdult,
            });
            setName('');
            setOldPrice('');
            setNewPrice('');
            setImageUrl('');
            setIsAdult(false);
            Alert.alert('Sucesso', 'Produto adicionado ao encarte!');
        }
    };

    return (
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center gap-2">
                    <Text className="font-bold text-gray-800 text-lg">
                        {editingProduct ? 'Editar Produto' : 'Adicionar Produto'}
                    </Text>
                    {editingProduct && (
                        <TouchableOpacity onPress={onCancel} className="bg-gray-100 px-2 py-1 rounded-md">
                            <Text className="text-gray-500 text-[10px] font-bold">CANCELAR</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <View className="bg-blue-50 px-2 py-1 rounded-md">
                    <Text className="text-blue-600 text-[10px] font-bold">BUSCA INTELIGENTE</Text>
                </View>
            </View>

            <View className="gap-4">
                <View>
                    <Text className="text-xs font-medium text-gray-500 mb-1">Nome do Produto *</Text>
                    <View className="flex-row gap-2">
                        <TextInput
                            className="flex-1 px-3 h-12 bg-gray-50 border border-gray-200 rounded-lg text-base"
                            value={name}
                            onChangeText={setName}
                            placeholder="Ex: Arroz Sepé 5kg"
                            placeholderTextColor="#9ca3af"
                        />
                        <TouchableOpacity
                            onPress={handleSearch}
                            activeOpacity={0.7}
                            className={`px-4 h-12 rounded-lg justify-center items-center shadow-sm bg-blue-600`}
                            style={{ opacity: name.trim() ? 1 : 0.6 }}
                            disabled={isSearching}
                        >
                            {isSearching ? <ActivityIndicator color="white" size="small" /> : <Search color="white" size={20} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleCamera}
                            activeOpacity={0.7}
                            className="px-4 h-12 rounded-lg justify-center items-center shadow-sm bg-blue-600"
                        >
                            <Camera color="white" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="flex-row gap-4">
                    <View className="flex-1">
                        <Text className="text-xs font-medium text-gray-500 mb-1">Preço Atual (R$) *</Text>
                        <TextInput
                            keyboardType="numeric"
                            className="w-full px-3 h-12 bg-gray-50 border border-gray-200 rounded-lg text-base"
                            value={oldPrice}
                            onChangeText={setOldPrice}
                            placeholder="0,00"
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-xs font-medium text-gray-500 mb-1">Preço Oferta (R$)</Text>
                        <TextInput
                            keyboardType="numeric"
                            className="w-full px-3 h-12 bg-gray-50 border border-gray-200 rounded-lg text-base"
                            value={newPrice}
                            onChangeText={setNewPrice}
                            placeholder="0,00"
                        />
                    </View>
                </View>

                <View>
                    <Text className="text-xs font-medium text-gray-500 mb-1">URL da Imagem</Text>
                    <TextInput
                        className="w-full px-3 h-12 bg-gray-50 border border-gray-200 rounded-lg text-base"
                        value={imageUrl}
                        onChangeText={setImageUrl}
                        placeholder="Pesquise ou cole a URL"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>

                {imageUrl ? (
                    <View className="flex-row items-center gap-3 p-2 bg-blue-50/30 rounded-xl border border-blue-100">
                        <View className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white">
                            <Image source={{ uri: imageUrl }} className="w-full h-full" resizeMode="contain" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-[10px] text-blue-600 font-bold mb-1">IMAGEM SELECIONADA</Text>
                            <TouchableOpacity onPress={() => setImageUrl('')} className="bg-red-50 self-start px-3 py-1 rounded-full border border-red-100">
                                <Text className="text-red-500 text-[10px] font-bold">Remover</Text>
                            </TouchableOpacity>
                        </View>
                        <View className="bg-green-500 rounded-full p-1">
                            <Check color="white" size={14} />
                        </View>
                    </View>
                ) : null}

                <View className="flex-row items-center justify-between py-2 border-t border-gray-50">
                    <Text className="text-sm font-medium text-gray-700">Produto p/ +18 anos</Text>
                    <Switch value={isAdult} onValueChange={setIsAdult} trackColor={{ true: '#ef4444' }} />
                </View>

                <TouchableOpacity
                    className={`w-full h-14 rounded-xl shadow-md flex items-center justify-center mt-2 ${editingProduct ? 'bg-blue-600 active:bg-blue-700' : 'bg-red-600 active:bg-red-700'}`}
                    activeOpacity={0.8}
                    onPress={handleSubmit}
                >
                    <Text className="text-white font-black text-lg uppercase tracking-tight">
                        {editingProduct ? 'Atualizar Produto' : 'Salvar no Encarte'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search Modal */}
            <Modal
                visible={isSearchModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsSearchModalOpen(false)}
            >
                <View className="flex-1 bg-black/60 justify-end">
                    <View className="bg-white rounded-t-[35px] p-6 h-[75%] shadow-2xl">
                        <View className="w-12 h-1 bg-gray-200 rounded-full self-center mb-6" />
                        <View className="flex-row justify-between items-center mb-6">
                            <View className="flex-1">
                                <Text className="text-2xl font-black text-gray-800 tracking-tighter">Google Graphics</Text>
                                <Text className="text-sm text-gray-500 font-medium" numberOfLines={1}>Produto: "{name}"</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsSearchModalOpen(false)} className="p-2 bg-gray-100 rounded-full ml-4">
                                <X color="#374151" size={24} />
                            </TouchableOpacity>
                        </View>

                        {isSearching ? (
                            <View className="flex-1 justify-center items-center">
                                <ActivityIndicator size="large" color="#2563eb" />
                                <Text className="mt-6 text-gray-500 font-bold text-base">Buscando na rede...</Text>
                                <Text className="mt-2 text-gray-400 text-xs italic">Isso pode levar alguns segundos</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={searchResults}
                                keyExtractor={(item, index) => index.toString()}
                                numColumns={2}
                                columnWrapperStyle={{ justifyContent: 'space-between' }}
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => selectImage(item)}
                                        className="w-[48%] aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden border border-gray-100 shadow-sm relative"
                                    >
                                        <Image source={{ uri: item }} className="w-full h-full" resizeMode="cover" />
                                        <View className="absolute bottom-2 right-2 p-1.5 bg-blue-600/90 rounded-lg shadow-sm">
                                            <Check color="white" size={12} />
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <View className="flex-1 justify-center items-center mt-20">
                                        <View className="bg-gray-50 p-6 rounded-full mb-4">
                                            <Search color="#9ca3af" size={40} />
                                        </View>
                                        <Text className="text-gray-500 font-bold text-lg text-center">Nenhuma imagem encontrada</Text>
                                        <Text className="text-gray-400 text-center mt-2 px-6">Tente simplificar o nome do produto para uma busca mais ampla.</Text>
                                    </View>
                                }
                            />
                        )}

                        <View className="mt-4 pt-4 border-t border-gray-100">
                            <Text className="text-[10px] text-gray-400 text-center italic leading-tight">
                                Resultados via Google Graphics.{"\n"}
                                As imagens podem ter direitos autorais. Use com responsabilidade.
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
