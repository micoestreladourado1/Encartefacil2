// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Linking } from 'react-native';
import { ShieldAlert, MessageCircle, RefreshCw } from 'lucide-react-native';

interface BlockedScreenProps {
    message?: string;
    onRetry: () => void;
}

export const BlockedScreen: React.FC<BlockedScreenProps> = ({ message, onRetry }) => {
    const handleSupport = () => {
        // Substituir pelo link real de suporte ou WhatsApp
        Linking.openURL('https://wa.me/550000000000?text=Preciso%20de%20ajuda%20com%20meu%20acesso%20no%20EncartesPro');
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-1 justify-center items-center px-8">
                <View className="w-24 h-24 bg-red-100 rounded-full items-center justify-center mb-8">
                    <ShieldAlert color="#ef4444" size={56} />
                </View>

                <Text className="text-2xl font-black text-gray-800 text-center mb-4">
                    Acesso Bloqueado
                </Text>

                <View className="bg-red-50 p-6 rounded-3xl border border-red-100 mb-8 w-full">
                    <Text className="text-red-700 text-center text-lg font-bold">
                        {message || "Acesso inválido ou já utilizado em outro dispositivo. Entre em contato com o suporte."}
                    </Text>
                </View>

                <Text className="text-gray-500 text-center mb-10 text-base leading-relaxed">
                    Se você acredita que isso é um erro ou precisa transferir sua licença para este aparelho, use as opções abaixo.
                </Text>

                <View className="w-full gap-4">
                    <TouchableOpacity
                        onPress={onRetry}
                        className="flex-row items-center justify-center h-16 bg-gray-100 rounded-2xl border border-gray-200"
                        activeOpacity={0.7}
                    >
                        <RefreshCw color="#374151" size={20} className="mr-2" />
                        <Text className="text-gray-700 font-bold text-lg">Tentar novamente</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleSupport}
                        className="flex-row items-center justify-center h-16 bg-green-500 rounded-2xl shadow-md"
                        activeOpacity={0.8}
                    >
                        <MessageCircle color="white" size={24} className="mr-2" />
                        <Text className="text-white font-bold text-lg">Falar com Suporte</Text>
                    </TouchableOpacity>
                </View>

                <View className="mt-16 items-center opacity-40">
                    <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest text-center">
                        Verificação de Segurança Ativa{"\n"}
                        ID do Dispositivo Vinculado
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};
