import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ShieldCheck, Mail, KeyRound, Smartphone, Trash2 } from 'lucide-react-native';
import { ActivationService } from '../services/activationService';

interface ActivationScreenProps {
    onActivated: () => void;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({ onActivated }) => {
    const [code, setCode] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [requestingChange, setRequestingChange] = useState(false);

    const handleActivate = async () => {
        if (!code.trim()) {
            Alert.alert('Erro', 'Por favor, insira o código de ativação.');
            return;
        }
        if (!email.trim() || !email.includes('@')) {
            Alert.alert('Erro', 'Por favor, insira um e-mail válido.');
            return;
        }

        setLoading(true);
        const result = await ActivationService.activate(code.trim(), email.trim());
        setLoading(false);

        if (result.status === 'active') {
            onActivated();
        } else {
            Alert.alert('Acesso Negado', result.message || 'Código inválido ou já utilizado.');
        }
    };

    const handleRequestChange = async () => {
        Alert.alert(
            'Trocar de Aparelho',
            'Deseja solicitar a liberação deste código para um novo aparelho? Nossa equipe irá analisar seu pedido.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Solicitar',
                    onPress: async () => {
                        setRequestingChange(true);
                        const result = await ActivationService.requestDeviceChange();
                        setRequestingChange(false);
                        Alert.alert('Solicitação Enviada', result.message || 'Sua solicitação foi enviada com sucesso.');
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
                    <View className="flex-1 justify-center py-10">
                        {/* Header / Logo */}
                        <View className="items-center mb-10">
                            <View className="w-20 h-20 bg-red-600 rounded-3xl items-center justify-center shadow-lg mb-4">
                                <Text className="text-white text-5xl font-black italic">E</Text>
                            </View>
                            <Text className="text-3xl font-black tracking-tight text-gray-800">
                                Encartes<Text className="text-red-600">Pro</Text>
                            </Text>
                            <Text className="text-gray-500 mt-2 text-center font-medium">
                                Ative sua licença para começar a criar
                            </Text>
                        </View>

                        {/* Form */}
                        <View className="bg-gray-50 p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <View className="mb-5">
                                <Text className="text-gray-700 font-bold mb-2 ml-1">E-mail da compra</Text>
                                <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 h-14">
                                    <Mail color="#9ca3af" size={20} className="mr-3" />
                                    <TextInput
                                        className="flex-1 text-gray-800 text-base"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View className="mb-6">
                                <Text className="text-gray-700 font-bold mb-2 ml-1">Código de acesso</Text>
                                <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 h-14">
                                    <KeyRound color="#9ca3af" size={20} className="mr-3" />
                                    <TextInput
                                        className="flex-1 text-gray-800 text-base font-mono"
                                        placeholder="XXXX-XXXX-XXXX"
                                        value={code}
                                        onChangeText={setCode}
                                        autoCapitalize="characters"
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={handleActivate}
                                disabled={loading}
                                className={`h-16 rounded-2xl items-center justify-center shadow-md ${loading ? 'bg-gray-400' : 'bg-red-600'}`}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <View className="flex-row items-center">
                                        <ShieldCheck color="white" size={24} className="mr-2" />
                                        <Text className="text-white text-lg font-bold">Ativar aplicativo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Footer Actions */}
                        <View className="mt-8 items-center">
                            <TouchableOpacity
                                onPress={handleRequestChange}
                                disabled={requestingChange}
                                className="py-2 px-4"
                            >
                                <Text className="text-red-600 font-bold text-base underline">
                                    Trocar de aparelho
                                </Text>
                            </TouchableOpacity>

                            <View className="mt-10 items-center opacity-50">
                                <View className="flex-row items-center bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                                    <Smartphone color="#6b7280" size={14} className="mr-2" />
                                    <Text className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                                        Arquivo oficial: encartespro.apk
                                    </Text>
                                </View>
                                <Text className="text-gray-400 text-[10px] mt-2">
                                    Venda exclusiva via Kiwify • Direitos Reservados
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};
