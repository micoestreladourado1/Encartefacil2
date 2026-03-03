export interface Product {
    id: string;
    name: string;
    oldPrice: number;
    newPrice: number | null;
    imageUrl: string;
    isAdult: boolean;
}

export interface Theme {
    id: string;
    name: string;
    title: string;
    bgClass: string;
    headerClass: string;
    textClass: string;
    accentClass: string;
    bannerUrl?: any;
}

export interface Flyer {
    id: string;
    themeId: string;
    validUntil: string;
    storeName: string;
    storeAddress: string;
    products: Product[];
}
