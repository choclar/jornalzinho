
export type LayoutType = 'layout-1' | 'layout-2' | 'layout-3' | 'layout-4' | 'layout-5' | 'layout-6';

export type PostSize = 'jornalzinho';

export type FontFamily = 'sans' | 'serif' | 'cursive';

export type BorderStyle = 'none' | 'gradient-hot' | 'gradient-cool' | 'neon-blue' | 'neon-pink' | 'gold-elegant' | 'dashed-red' | 'double-black';

export interface GridItem {
  image: string | null;
  imageTransform: {
    x: number;
    y: number;
    scale: number;
  };
  productName: string;
  productDetails?: string; 
  price: string;
  originalPrice?: string; 
  borderStyle?: BorderStyle;
  hasShadow?: boolean;
  nameFontSize?: number;
  detailsFontSize?: number;
  priceFontSize?: number;
  originalPriceFontSize?: number; 
}

export interface TextTransform {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  font: FontFamily;
}

export interface PostConfig {
  size: PostSize;
  gridRows: number;
  gridCols: number;
  selectedGridIndex: number; 
  gridItems: GridItem[];
  cta: string;
  ctaBgColor?: string;
  ctaTextColor?: string;
  ctaFontSize?: number;
  ctaBgImage?: string | null; 
  ctaOpacity?: number; 
  ctaBgTransform?: {
    x: number;
    y: number;
    scale: number;
  };
  
  footerAddress: string;
  footerDisclaimer: string;
  footerInfoColor?: string; 

  brandName: string;
  brandTransform: TextTransform;
  brandOpacity?: number;
  brandColor?: string;
  prefixText: string;
  taglineText: string;
  taglineTransform: TextTransform;
  
  taglineColor?: string;
  taglineBgColor?: string; 
  taglineOpacity?: number;

  discountBadgeColor?: string;
  discountBadgeBgColor?: string;
  discountBadgeOpacity?: number;
  discountBadgeScale?: number; 

  logo: string | null;
  logoOpacity?: number;
  logoTransform: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  layout: LayoutType;
  backgroundImage: string | null; 
  headerBackground: string | null; 
  headerBackgroundTransform: {
    x: number;
    y: number;
    scale: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    tagline: string;
    brand: string;
  };
}

export interface GeneratedContent {
  productName: string;
  price: string;
  cta: string;
  brandName: string;
  shortDescription?: string;
}

export interface SavedProject {
  id: string;
  name: string;
  lastModified: number;
  config: PostConfig;
}
