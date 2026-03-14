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
        console.log('Search triggered for:', name);
        const trimmedName = name.trim();
        if (!trimmedName) {
            Alert.alert('Busca de Imagem', 'Por favor, digite o nome do produto primeiro.');
            return;
        }

        setIsSearching(true);
        setIsSearchModalOpen(true);
        setSearchResults([]);

        // --- Curated fallback database (Brazilian supermarket products) ---
        const CURATED: Record<string, string[]> = {
            arroz: [
                'https://assets.instabuy.app.br/ib.item.image.medium/m-38dbe6cfa08d4f058bf9b9138e04a9b1.png',
                'https://tdc01z.vteximg.com.br/arquivos/ids/159303-1000-1000/16832-arroz-sepe-bianco-t-01-5kg.png',
                'https://www.arrozsepe.com.br/arquivos/produtos/parboilizado/sepe-parboilizado-5kg.png',
            ],
            feijao: [
                'https://static.carone.com.br/produtos/feijao-preto-tipiti-1kg_1130_1.png',
                'https://images.tcdn.com.br/img/img_prod/1105484/feijao_preto_tipo_1_camil_1kg_3985_1_a3cc8e9d8cf24da8d6e8bc56a2f5cd10.png',
            ],
            leite: [
                'https://static.carone.com.br/produtos/leite-uht-int-damare-1l_25301_1.png',
                'https://images.tcdn.com.br/img/img_prod/876625/leite_longa_vida_integral_leitbom_1l_1_d91f3a2c9b954cb1ab20cf17e8aa5ce5.png',
            ],
            oleo: [
                'https://static.carone.com.br/produtos/oleo-de-soja-vila-velha-900ml_22240_1.png',
                'https://images.tcdn.com.br/img/img_prod/859574/oleo_de_soja_soya_900ml_6050_1_2a4da46e1ebf75c29d3e30c6b22b4d3e.png',
            ],
            acucar: [
                'https://images.tcdn.com.br/img/img_prod/1056791/acucar_cristal_uniao_1kg_6042_1_2f79debc61cc5820f0779ee4dfa75e0e.png',
                'https://images.tcdn.com.br/img/img_prod/873021/acucar_refinado_da_barra_refinado_1kg_6043_1_f547e20d7a60ff78c5c13bb4af3a3b24.png',
            ],
            cafe: [
                'https://images.tcdn.com.br/img/img_prod/992551/cafe_torrado_e_moido_tradicional_pele_vermelha_500g_3051_1_38779a5d4de44e32bfedd3f85e6fb785.png',
                'https://images.tcdn.com.br/img/img_prod/972832/cafe_torrado_e_moido_forte_tradicional_pilao_500g_3050_1_4b04e7e3e49b96e8bcf1d7a59e13d9da.png',
            ],
            macarrao: [
                'https://images.tcdn.com.br/img/img_prod/856721/macarrao_espaguete_n_8_adria_500g_4101_1_cd17a84e2b16de9b5fde8c92be624b0f.png',
            ],
            farinha: [
                'https://images.tcdn.com.br/img/img_prod/856750/farinha_de_trigo_especial_finna_1kg_2001_1_d1c95df95cb3699dab21e0bc50476e48.png',
            ],
            manteiga: [
                'https://images.tcdn.com.br/img/img_prod/856800/manteiga_com_sal_itambe_200g_6201_1_28f6df01e46e36c1be4d2ddfe13fbbae.png',
            ],
            margarina: [
                'https://images.tcdn.com.br/img/img_prod/856808/margarina_com_sal_qualy_250g_6211_1_9ce62fb72eecf44e67ca1e21c2fd1e3e.png',
            ],
            sal: [
                'https://images.tcdn.com.br/img/img_prod/856823/sal_refinado_iodado_cisne_1kg_6301_1_36394c8e5c10c5b5cac20289d2d89f89.png',
            ],
            vinagre: [
                'https://images.tcdn.com.br/img/img_prod/856841/vinagre_de_alcool_branco_castelo_750ml_6401_1_df1fad0c36a1eb02a47bfea95a7ae765.png',
            ],
            molho: [
                'https://images.tcdn.com.br/img/img_prod/856853/molho_de_tomate_tradicional_heinz_340g_5201_1_4a69d1f5e35b9ce1d6e72ef6faa51f0d.png',
            ],
            sabao: [
                'https://images.tcdn.com.br/img/img_prod/856900/sabao_em_po_omo_multiacao_1kg_7101_1_5f36d52e18d33bc1f33f95dff0d48c65.png',
            ],
            detergente: [
                'https://images.tcdn.com.br/img/img_prod/856910/detergente_liquido_neutro_ype_500ml_7201_1_3e96d88e1ea6e64e5d38be2ef61a3a9e.png',
            ],
            frango: [
                'https://images.tcdn.com.br/img/img_prod/856700/frango_inteiro_congelado_perdigao_2kg_1401_1_5b0ee3b6ab28e0c4c8fd0e2c67eba6e0.png',
            ],
            carne: [
                'https://images.tcdn.com.br/img/img_prod/856710/carne_bovina_patinho_moido_resfriado_500g_1501_1_33bfcd3af8e4ab24c5e42e5e05dc9d0a.png',
            ],
            queijo: [
                'https://images.tcdn.com.br/img/img_prod/856720/queijo_mussarela_fatiado_sadia_200g_3101_1_38eacfc98cb0b2e61e7d21f3d5acb3cd.png',
            ],
            iogurte: [
                'https://images.tcdn.com.br/img/img_prod/856730/iogurte_integral_natural_nestle_170g_3201_1_4e1ceba12f0a3cc4ee78a7e27efef49e.png',
            ],
            biscoito: [
                'https://images.tcdn.com.br/img/img_prod/856740/biscoito_recheado_oreo_original_96g_4201_1_adb3f13e9a7ddcb7adba72f0d895d37f.png',
            ],
        };

        const lower = trimmedName.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove acentos

        const urls: string[] = [];

        // Step 1: Try DuckDuckGo image search (free, no key required)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            // Step 1a: Get the vqd token required by DDG
            const initUrl = `https://duckduckgo.com/?q=${encodeURIComponent(trimmedName + ' produto png')}&iax=images&ia=images`;
            const initRes = await fetch(initUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                signal: controller.signal,
            });
            const initHtml = await initRes.text();
            clearTimeout(timeoutId);

            const vqdMatch = /vqd=([^&"']+)/.exec(initHtml) || /vqd%3D([^&"'%]+)/.exec(initHtml);
            const vqd = vqdMatch ? decodeURIComponent(vqdMatch[1]) : null;

            if (vqd) {
                // Step 1b: Fetch image results using the token
                const imgController = new AbortController();
                const imgTimeout = setTimeout(() => imgController.abort(), 8000);
                const imgRes = await fetch(
                    `https://duckduckgo.com/i.js?q=${encodeURIComponent(trimmedName + ' produto png fundo transparente')}&vqd=${encodeURIComponent(vqd)}&f=,,,,,&p=1`,
                    {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                            'Referer': 'https://duckduckgo.com/',
                        },
                        signal: imgController.signal,
                    }
                );
                clearTimeout(imgTimeout);

                const json = await imgRes.json();
                if (json?.results?.length) {
                    for (const item of json.results) {
                        if (item.image && urls.length < 12) {
                            urls.push(item.image);
                        }
                    }
                }
            }
        } catch (fetchErr: any) {
            console.warn('DuckDuckGo search failed:', fetchErr?.message);
        }

        // Step 2: Curated database fallback if DDG returned nothing
        if (urls.length === 0) {
            for (const key of Object.keys(CURATED)) {
                if (lower.includes(key)) {
                    urls.push(...CURATED[key]);
                    break;
                }
            }
        }

        setSearchResults(urls);

        if (urls.length === 0) {
            Alert.alert(
                'Sem Resultados',
                'Não encontramos imagens para este produto. Tente simplificar o nome ou cole uma URL manualmente.',
            );
        }

        setIsSearching(false);
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
