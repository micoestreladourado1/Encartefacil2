import { Theme } from './types';

export const THEMES: Theme[] = [
  {
    id: 'oferta-do-dia',
    name: 'Oferta do Dia',
    title: 'OFERTA DO DIA',
    bgClass: 'bg-red-50',
    headerClass: 'bg-red-600 text-white',
    textClass: 'text-red-900',
    accentClass: 'bg-yellow-400 text-red-900',
  },
  {
    id: 'fim-de-semana',
    name: 'Fim de Semana',
    title: 'ESPECIAL FIM DE SEMANA',
    bgClass: 'bg-green-50',
    headerClass: 'bg-green-600 text-white',
    textClass: 'text-green-900',
    accentClass: 'bg-yellow-400 text-green-900',
  },
  {
    id: 'quarta-carne',
    name: 'Quarta da Carne',
    title: 'QUARTA DA CARNE',
    bgClass: 'bg-stone-100',
    headerClass: 'bg-red-800 text-white',
    textClass: 'text-stone-900',
    accentClass: 'bg-red-600 text-white',
  },
  {
    id: 'sextou',
    name: 'Sextou de Ofertas',
    title: 'SEXTOU DE OFERTAS',
    bgClass: 'bg-purple-50',
    headerClass: 'bg-purple-600 text-white',
    textClass: 'text-purple-900',
    accentClass: 'bg-yellow-400 text-purple-900',
  },
];
