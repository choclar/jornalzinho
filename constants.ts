
import { PostConfig, GridItem } from './types';

const createEmptyGridItem = (): GridItem => ({
  image: null,
  imageTransform: { x: 0, y: 0, scale: 1 },
  productName: 'Produto',
  productDetails: '', 
  price: 'R$ 0,00',
  originalPrice: '',
  borderStyle: 'none',
  hasShadow: false,
  nameFontSize: 32, 
  detailsFontSize: 16, 
  priceFontSize: 56, 
  originalPriceFontSize: 12 
});

export const DEFAULT_CONFIG: PostConfig = {
  size: 'jornalzinho',
  gridRows: 3,
  gridCols: 3,
  selectedGridIndex: 0,
  gridItems: Array(12).fill(null).map(() => createEmptyGridItem()),
  cta: 'PEÇA JÁ',
  ctaBgColor: '#B91C1C',
  ctaTextColor: '#FFFFFF',
  ctaFontSize: 36,
  ctaOpacity: 1,
  ctaBgImage: null,
  ctaBgTransform: { x: 0, y: 0, scale: 1 },
  
  footerAddress: 'CHOC-LAR DISTRIBUIDORA | Rua 24 de Maio, 815 - Centro, Indaiatuba - SP | Fone: (19) 3875-4667',
  footerDisclaimer: 'Ofertas válidas conforme período indicado neste encarte ou enquanto durarem os estoques. Imagens meramente ilustrativas. Reservamo-nos o direito de corrigir eventuais erros.',
  footerInfoColor: '#FFFFFF',

  brandName: 'CHOC-LAR',
  brandTransform: {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    font: 'serif'
  },
  brandOpacity: 1,
  brandColor: '#FFFFFF',
  prefixText: 'Promoção',
  taglineText: 'FESTIVAL DE OFERTAS',
  taglineTransform: {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    font: 'sans'
  },
  taglineColor: '#DC2626',
  taglineBgColor: '#FFD700',
  taglineOpacity: 1,

  discountBadgeColor: '#FFFFFF',
  discountBadgeBgColor: '#DC2626',
  discountBadgeOpacity: 1,
  discountBadgeScale: 1.0,

  logo: null,
  logoOpacity: 1,
  logoTransform: {
    x: 0,
    y: 0,
    scale: 0.3,
    rotation: 0,
  },
  layout: 'layout-1',
  backgroundImage: null,
  headerBackground: null,
  headerBackgroundTransform: {
    x: 0,
    y: 0,
    scale: 1
  },
  colors: {
    primary: '#3E2723',
    secondary: '#FFF8E1',
    accent: '#FF0000',
    background: '#FFFFFF',
    tagline: '#FFD700',
    brand: '#FFFFFF',
  }
};

export const calculatePostDimensions = (config: PostConfig) => {
  const width = 1080;
  const HEADER_HEIGHT = 400;
  const FOOTER_HEIGHT = 200; 
  const MIN_ROW_HEIGHT = 600; 
  const ROW_GAP = 20; 
  
  const calculatedHeight = HEADER_HEIGHT + (config.gridRows * MIN_ROW_HEIGHT) + ((config.gridRows - 1) * ROW_GAP) + FOOTER_HEIGHT;
  const height = Math.max(1920, calculatedHeight);

  return { width, height };
};
