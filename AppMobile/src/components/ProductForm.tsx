import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, Modal, FlatList, Image, ActivityIndicator, Alert } from 'react-native';
import { Product } from '../types';
import { Search, X, Check } from 'lucide-react-native';

interface ProductFormProps {
    onAdd: (product: Omit<Product, 'id'>) => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ onAdd }) => {
    const [name, setName] = useState('');
    const [oldPrice, setOldPrice] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isAdult, setIsAdult] = useState(false);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<string[]>([]);

    const handleSearch = async () => {
        console.log('Search triggered for:', name);
        const trimmedName = name.trim();
        if (!trimmedName) {
            Alert.alert('Busca de Imagem', 'Por favor, digite o nome do produto primeiro.');
            return;
        }

        setIsSearching(true);
        setIsSearchModalOpen(true);
        setSearchResults([]);

        try {
            const query = encodeURIComponent(`${trimmedName} produto fundo transparente png`);
            // We use different parameters to try and get a simplified HTML or JSON response
            const searchUrl = `https://www.google.com.br/search?q=${query}&tbm=isch&udm=2`;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Mobile Safari/537.36'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`Google returned ${response.status}`);

            const html = await response.text();
            const urls: string[] = [];

            // Pattern 1: Modern AF_initDataCallback JSON structure
            const jsonRegex = /\["(https?:\/\/[^"]+\.(png|jpg|jpeg|webp))",\d+,\d+\]/g;
            let jMatch;
            while ((jMatch = jsonRegex.exec(html)) !== null && urls.length < 15) {
                const url = jMatch[1];
                if (!url.includes('gstatic') && !url.includes('google') && !urls.includes(url)) {
                    urls.push(url);
                }
            }

            // Pattern 2: Classic imgurl redirect
            if (urls.length < 5) {
                const regex = /imgurl=(https?:\/\/[^&"]+)/g;
                let match;
                while ((match = regex.exec(html)) !== null && urls.length < 15) {
                    const url = decodeURIComponent(match[1]);
                    if (url.startsWith('http') && !urls.includes(url)) {
                        urls.push(url);
                    }
                }
            }

            // Pattern 3: Data URI / Thumbnails (often more reliable)
            if (urls.length < 3) {
                const thumbRegex = /"(https?:\/\/[^"]+(gstatic|googleusercontent)[^"]+)"/g;
                let tMatch;
                while ((tMatch = thumbRegex.exec(html)) !== null && urls.length < 20) {
                    const url = tMatch[1];
                    if (!urls.includes(url)) urls.push(url);
                }
            }

            // Fallbacks for common products
            if (urls.length === 0) {
                const lower = trimmedName.toLowerCase();
                if (lower.includes('arroz')) urls.push('https://static.carone.com.br/produtos/arroz-tp1-sepe-5kg-bco_25501_1.png');
                if (lower.includes('feijão')) urls.push('https://static.carone.com.br/produtos/feijao-preto-tipiti-1kg_1130_1.png');
                if (lower.includes('oleo') || lower.includes('óleo')) urls.push('https://static.carone.com.br/produtos/oleo-de-soja-vila-velha-900ml_22240_1.png');
                if (lower.includes('leite')) urls.push('https://static.carone.com.br/produtos/leite-uht-int-damare-1l_25301_1.png');
            }

            setSearchResults(urls);
        } catch (error: any) {
            console.error('Search failed:', error);
            const msg = error.name === 'AbortError' ? 'Tempo limite esgotado. Verifique sua conexão.' : 'Não conseguimos conectar à busca agora.';
            Alert.alert('Erro na Busca', msg);
        } finally {
            setIsSearching(false);
        }
    };

    const selectImage = (url: string) => {
        setImageUrl(url);
        setIsSearchModalOpen(false);
    };

    const handleSubmit = () => {
        if (!name || !oldPrice) {
            Alert.alert('Erro', 'Nome e Preço Atual são obrigatórios.');
            return;
        }
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
    };

    return (
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="font-bold text-gray-800 text-lg">Adicionar Produto</Text>
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
                    className="w-full h-14 bg-red-600 rounded-xl shadow-md flex items-center justify-center mt-2 active:bg-red-700"
                    activeOpacity={0.8}
                    onPress={handleSubmit}
                >
                    <Text className="text-white font-black text-lg uppercase tracking-tight">Salvar no Encarte</Text>
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
                                <Text className="text-2xl font-black text-gray-800 tracking-tighter">Resultados Google</Text>
                                <Text className="text-sm text-gray-500 font-medium" numberOfLines={1}>Fundo transparente: "{name}"</Text>
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
                                Nota: Esta busca experimental simula resultados do Google Images.{"\n"}
                                As imagens podem ter direitos autorais. Use com responsabilidade.
                            </Text>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};
