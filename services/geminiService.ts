
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedContent, PostConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generatePostContent = async (base64Image: string): Promise<GeneratedContent> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg', 
            },
          },
          {
            text: `Analyze this product image (likely food/confectionery). 
            Generate a JSON response in PORTUGUESE with:
            - productName: A catchy, appetizing name.
            - price: A realistic price (e.g. R$ 15,90).
            - cta: A short, punchy call to action (e.g. "Peça Agora").
            - brandName: Keep it as "CHOC-LAR" or similar.
            
            Keep it short and sales-oriented.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productName: { type: Type.STRING },
            price: { type: Type.STRING },
            cta: { type: Type.STRING },
            brandName: { type: Type.STRING },
          },
          required: ["productName", "price", "cta", "brandName"],
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as GeneratedContent;
  } catch (error) {
    console.error("Gemini API Error (Text):", error);
    throw error;
  }
};

export const enhanceImage = async (base64Image: string): Promise<string> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: 'Enhance the quality of this product photo. Improve the lighting, sharpness, and color saturation to make it look professional and appetizing. Do not crop the product. Output high resolution.',
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image returned from Gemini");
  } catch (error) {
    console.error("Gemini API Error (Image):", error);
    throw error;
  }
};

export const removeBackgroundAI = async (base64Image: string): Promise<string> => {
  try {
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: 'Isolate the main product in this image. Remove the background and replace it with a SOLID PURE WHITE background (#FFFFFF). Ensure the edges of the product are sharp and clean. Do not change the product itself.',
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image returned from Gemini");
  } catch (error) {
    console.error("Gemini API Error (Bg Removal):", error);
    throw error;
  }
};

export const generateCatchyTagline = async (brandName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Sugira um título curto e impactante para um jornalzinho de ofertas de uma distribuidora chamada "${brandName}". 
      O título deve ser voltado para vendas e promoções (ex: "SUPER OFERTAS", "OFERTAS IMPERDÍVEIS", "FESTIVAL DE PREÇOS BAIXOS"). 
      Retorne APENAS o texto do título, sem aspas, em letras MAIÚSCULAS e em Português.`,
    });
    return response.text?.trim() || "OFERTAS DO DIA";
  } catch (error) {
    console.error("Error generating tagline:", error);
    return "OFERTAS ESPECIAIS";
  }
};

interface DesignSystemResponse {
  layout: 'layout-1' | 'layout-2' | 'layout-3' | 'layout-4' | 'layout-5' | 'layout-6';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    tagline: string;
    brand: string;
  };
  taglineText: string;
  cta: string;
  backgroundPrompt: string;
  headerPrompt: string; // New field for Jornal Headers
}

export const generateDesignSystem = async (userPrompt: string): Promise<DesignSystemResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the Art Director for 'CHOC-LAR', a confectionery/sweets distributor.
      The user wants a design based on: "${userPrompt}".

      1. Select the best layout based on the mood:
         - layout-1: Clean, minimalist (Good for simple offers).
         - layout-2: Pop art, Vibrant Blue/Yellow (Standard CHOC-LAR Identity).
         - layout-3: Cute, Pink/Pastel (Good for candies, kids, soft themes).
         - layout-4: Retail, Strong Blue (Good for aggressive sales).
         - layout-5: Premium, Chocolate tones (Good for Easter, luxury chocolate).
         - layout-6: High Energy, Red/Yellow (Good for Black Friday, urgency).
      
      2. Generate a color palette. 
         IMPORTANT: 'primary' should usually be a strong brand color (Blue #00BFFF, Pink #FF69B4, or Choco #3E2723).
      
      3. Create a short Portuguese tagline (e.g., "PÁSCOA MÁGICA", "OFERTAS DE NATAL").
      4. Create a short Portuguese CTA (e.g., "APROVEITE", "CONFIRA").
      
      5. Create TWO image prompts (in English):
         - backgroundPrompt: For Feed/Stories backgrounds (abstract, pattern).
         - headerPrompt: Specifically for a "Jornalzinho" (Flyer) Header. It should be landscape (banner style), dynamic, containing elements of the theme (e.g. Easter Eggs, Christmas decorations, Chocolate splashes), but leaving the CENTER area relatively clean for text.

      Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            layout: { type: Type.STRING, enum: ['layout-1', 'layout-2', 'layout-3', 'layout-4', 'layout-5', 'layout-6'] },
            colors: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING },
                secondary: { type: Type.STRING },
                accent: { type: Type.STRING },
                background: { type: Type.STRING },
                tagline: { type: Type.STRING },
                brand: { type: Type.STRING },
              },
              required: ["primary", "secondary", "accent", "background", "tagline", "brand"]
            },
            taglineText: { type: Type.STRING },
            cta: { type: Type.STRING },
            backgroundPrompt: { type: Type.STRING },
            headerPrompt: { type: Type.STRING }
          },
          required: ["layout", "colors", "taglineText", "cta", "backgroundPrompt", "headerPrompt"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as DesignSystemResponse;
  } catch (error) {
    console.error("Gemini Design System Error:", error);
    throw error;
  }
};

export const generateAIBackground = async (prompt: string, style: string, aspectRatio: "9:16" | "4:5" | "1:1" | "16:9" = "16:9"): Promise<string> => {
  try {
    // Advanced prompt engineering based on MARKETING goals for confectionary/distributors
    let stylePrompt = "";
    
    // Normalize style to lowercase for switch
    const cleanStyle = style.toLowerCase();

    switch (cleanStyle) {
        // --- NEW REQUESTED STYLES ---
        case 'gold':
            stylePrompt = "Luxury gold foil texture, golden dust, premium metallic finish, elegant and sophisticated bokeh. Perfect for premium offers.";
            break;
        case 'nature':
            stylePrompt = "Fresh natural vibes, green leaves, botanical patterns, soft wood textures, organic, sunlight dappled, farm-fresh feel.";
            break;
        case '3d':
            stylePrompt = "Abstract 3D geometric shapes, soft pastel 3D render, modern depth, floating spheres or cubes, clean minimalist lighting.";
            break;
        case 'abstract':
            stylePrompt = "Modern abstract art, fluid gradients, colorful waves, liquid motion, vibrant and artistic background.";
            break;
        case 'texture':
            stylePrompt = "High quality tactile texture, paper grain, concrete, fabric, or canvas. Subtle, minimalist, focusing on material details.";
            break;
        case 'food':
            stylePrompt = "Appetizing food background, flying ingredients (flour, cocoa powder, sugar), chocolate splashes, fresh fruits, macro photography of delicious elements.";
            break;

        // --- LEGACY STYLES (Keep for compatibility) ---
        case 'candy_world':
            stylePrompt = "Fun and vibrant 'Candy World' theme. Colorful pastel background with flying confetti, marshmallows, or jelly beans in the periphery (bokeh). Pop-art style.";
            break;
        case 'choc_luxury':
            stylePrompt = "Premium chocolate marketing background. Rich, silky melted chocolate waves or cocoa powder textures. Dark brown and gold color palette.";
            break;
        case 'retail_bokeh':
            stylePrompt = "Blurred supermarket aisle or shelves filled with colorful products (heavy bokeh/defocus). Bright, clean, white retail lighting.";
            break;
        case 'splash_fresh':
            stylePrompt = "Energetic freshness. High-speed photography of a liquid splash (milk, fruit juice, or soda) or exploding ingredients.";
            break;
        case 'studio_soft':
            stylePrompt = "Clean professional studio photography background. Soft abstract curves, gentle gradients in warm beige, cream, or light yellow.";
            break;
        case 'auto':
        default:
            stylePrompt = "Professional advertising background for food/confectionery, high quality, appealing, clean copy space.";
    }

    const fullPrompt = `Create a professional advertising background image for a flyer header.
    Theme/Subject: ${prompt}.
    Art Direction Style: ${stylePrompt}.
    Technical Specs: 8k resolution, photorealistic, commercial food photography lighting.
    Composition Rule: The Center area MUST be relatively empty, soft focus, or negative space to allow for text overlay. The busy elements should be on the edges.
    Constraints: NO text in the image, NO watermarks, NO distorted human faces.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: fullPrompt },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio, 
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Background generation failed");
  } catch (error) {
    console.error("Gemini Background API Error:", error);
    throw error;
  }
};

export const generateHeaderBackground = async (theme?: string): Promise<string> => {
    // This function is now a wrapper around the more generic generateAIBackground
    // but keeps the specific 'retail header' logic if no specific style is passed.
    return generateAIBackground(theme || 'Vibrant, retail, promotional, sale events', 'auto', '16:9');
};
