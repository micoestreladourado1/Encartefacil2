import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
    ACTIVATION_TOKEN: 'encartes_pro_activation_token',
    ACTIVATION_CODE: 'encartes_pro_activation_code',
    ACTIVATION_EMAIL: 'encartes_pro_activation_email',
};

// Update this with your actual Vercel deployment URL
const API_BASE_URL = 'https://encartes-pro.vercel.app/api';

export interface ActivationResponse {
    status: 'active' | 'inactive' | 'blocked' | 'error';
    message?: string;
    token?: string;
    deviceId?: string;
}

export const ActivationService = {
    /**
     * Captura o ANDROID_ID do dispositivo.
     */
    async getDeviceId(): Promise<string> {
        if (Platform.OS === 'android') {
            // @ts-ignore - expo-application property
            return (Application as any).androidId || 'unknown_android_id';
        }
        // Para iOS ou outros, poderíamos usar vendorId, mas o foco é Android APK
        return Application.getIosIdForVendorAsync().then(id => id || 'unknown_ios_id');
    },

    /**
     * Envia o código para ativação no servidor.
     */
    async activate(code: string, email: string): Promise<ActivationResponse> {
        try {
            const deviceId = await this.getDeviceId();

            const response = await fetch(`${API_BASE_URL}/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code,
                    device_id: deviceId,
                    email,
                }),
            });

            const data = await response.json();

            if (response.status === 200 && data.status === 'active' && data.token) {
                await this.saveActivationData(code, data.token, email);
                return { status: 'active', token: data.token };
            }

            return {
                status: data.status || 'error',
                message: data.message || 'Erro na ativação. Verifique seu código.'
            };
        } catch (error) {
            console.error('Activation Error:', error);
            return { status: 'error', message: 'Erro de conexão com o servidor.' };
        }
    },

    /**
     * Valida se o código/token atual ainda é válido no servidor.
     */
    async validateStatus(): Promise<ActivationResponse> {
        try {
            const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACTIVATION_TOKEN);
            const deviceId = await this.getDeviceId();

            if (!token) return { status: 'inactive' };

            const response = await fetch(`${API_BASE_URL}/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ device_id: deviceId }),
            });

            const data = await response.json();

            if (response.status === 200 && data.status === 'active') {
                return { status: 'active' };
            }

            // Se não estiver ativo, removemos os dados locais
            if (data.status === 'blocked' || data.status === 'inactive') {
                await this.clearActivationData();
            }

            return { status: data.status || 'inactive', message: data.message };
        } catch (error) {
            console.error('Validation Error:', error);
            // Em caso de erro de conexão, podemos permitir o uso offline temporário 
            // ou bloquear. O requisito diz "Sempre que o app abrir... desativar imediatamente".
            // Vamos assumir que precisa de internet.
            return { status: 'inactive', message: 'Conexão necessária para validar acesso.' };
        }
    },

    /**
     * Solicita a troca de dispositivo.
     */
    async requestDeviceChange(): Promise<ActivationResponse> {
        try {
            const code = await SecureStore.getItemAsync(STORAGE_KEYS.ACTIVATION_CODE);
            const email = await SecureStore.getItemAsync(STORAGE_KEYS.ACTIVATION_EMAIL);

            if (!code || !email) return { status: 'error', message: 'Dados de ativação não encontrados.' };

            const response = await fetch(`${API_BASE_URL}/request-change`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, email }),
            });

            const data = await response.json();
            return { status: data.status, message: data.message };
        } catch (error) {
            return { status: 'error', message: 'Erro ao solicitar troca de aparelho.' };
        }
    },

    async saveActivationData(code: string, token: string, email: string) {
        await SecureStore.setItemAsync(STORAGE_KEYS.ACTIVATION_TOKEN, token);
        await SecureStore.setItemAsync(STORAGE_KEYS.ACTIVATION_CODE, code);
        await SecureStore.setItemAsync(STORAGE_KEYS.ACTIVATION_EMAIL, email);
    },

    async clearActivationData() {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACTIVATION_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACTIVATION_CODE);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.ACTIVATION_EMAIL);
    },

    async getIsActivated(): Promise<boolean> {
        const token = await SecureStore.getItemAsync(STORAGE_KEYS.ACTIVATION_TOKEN);
        return !!token;
    }
};
