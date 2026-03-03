import { getDb } from './db';
import { Flyer } from '../types';

export const saveCurrentFlyer = (flyer: Flyer) => {
    try {
        const db = getDb();
        const dataString = JSON.stringify(flyer);

        // Usamos ID 1 fixo para o encarte atual para facilitar o persistence simples
        db.runSync(
            'INSERT OR REPLACE INTO flyers (id, title, createdAt, data) VALUES (?, ?, ?, ?)',
            1,
            flyer.themeId,
            new Date().toISOString(),
            dataString
        );
    } catch (error) {
        console.error('CRITICAL: Error saving flyer to SQLite', error);
        // Não lançamos o erro aqui para não travar a UI (fail silent com log)
    }
};

export const getCurrentFlyer = (): Flyer | null => {
    try {
        const db = getDb();
        const row = db.getFirstSync<{ data: string }>('SELECT data FROM flyers WHERE id = 1');
        if (row && row.data) {
            try {
                const parsed = JSON.parse(row.data) as Flyer;
                // Migrate old saves that don't have these fields
                parsed.storeName = parsed.storeName ?? '';
                parsed.storeAddress = parsed.storeAddress ?? '';
                parsed.validUntil = parsed.validUntil ?? '';
                return parsed;
            } catch (e) {
                console.error('Failed to parse flyer data JSON', e);
                return null;
            }
        }
    } catch (error) {
        console.error('CRITICAL: Error reading flyer from SQLite', error);
    }
    return null;
};
