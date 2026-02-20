
import React, { useState } from 'react';
import { X, Wand2, Check, RefreshCw, Loader2, Image as ImageIcon } from 'lucide-react';
import { generateAIBackground } from '../services/geminiService';

interface AIBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (image: string) => void;
}

const STYLES = [
  { id: 'Gold', label: 'Dourado / Luxo', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  { id: 'Nature', label: 'Natureza / Fresco', color: 'bg-green-100 border-green-300 text-green-800' },
  { id: 'Food', label: 'Comida / Apetite', color: 'bg-orange-100 border-orange-300 text-orange-800' },
  { id: '3D', label: '3D Moderno', color: 'bg-blue-100 border-blue-300 text-blue-800' },
  { id: 'Abstract', label: 'Abstrato', color: 'bg-purple-100 border-purple-300 text-purple-800' },
  { id: 'Texture', label: 'Texturas', color: 'bg-gray-100 border-gray-300 text-gray-800' },
];

const AIBackgroundModal: React.FC<AIBackgroundModalProps> = ({ isOpen, onClose, onApply }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Food');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
        // Fallback prompt if empty
        setPrompt("Fundo para ofertas");
    }
    setIsGenerating(true);
    setGeneratedImage(null);
    try {
      const finalPrompt = prompt.trim() || "Fundo para ofertas";
      const image = await generateAIBackground(finalPrompt, selectedStyle, '16:9');
      setGeneratedImage(image);
    } catch (error) {
      alert("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Wand2 className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-xl font-black uppercase tracking-tight leading-none">Gerador de Fundo IA</h3>
                <p className="text-indigo-100 text-xs font-medium opacity-80">Crie fundos exclusivos para o CHOC-LAR</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
            {/* Sidebar Controls */}
            <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-200 p-6 flex flex-col gap-6 overflow-y-auto">
                <div>
                    <label className="text-xs font-black text-gray-500 uppercase mb-2 block">1. Descreva o Tema</label>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: Páscoa com chocolates, Ofertas de Verão, Natal Mágico..."
                        className="w-full p-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all min-h-[80px] resize-none"
                    />
                </div>

                <div>
                    <label className="text-xs font-black text-gray-500 uppercase mb-2 block">2. Escolha o Estilo</label>
                    <div className="grid grid-cols-1 gap-2">
                        {STYLES.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => setSelectedStyle(style.id)}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left group ${
                                    selectedStyle === style.id 
                                    ? 'border-indigo-500 bg-white shadow-md scale-[1.02]' 
                                    : 'border-transparent bg-white hover:bg-gray-100 text-gray-600'
                                }`}
                            >
                                <div className={`w-3 h-3 rounded-full ${style.color} ring-2 ring-white shadow-sm`} />
                                <span className={`text-xs font-bold ${selectedStyle === style.id ? 'text-indigo-900' : 'text-gray-500'}`}>
                                    {style.label}
                                </span>
                                {selectedStyle === style.id && <Check className="w-4 h-4 text-indigo-500 ml-auto" />}
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="mt-auto w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                    {isGenerating ? 'Criando...' : 'Gerar Fundo'}
                </button>
            </div>

            {/* Preview Area */}
            <div className="w-full md:w-2/3 bg-gray-100/50 p-6 flex flex-col items-center justify-center relative">
                {generatedImage ? (
                    <div className="w-full flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white relative group">
                            <img src={generatedImage} alt="Generated Background" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all" />
                        </div>
                        <div className="flex gap-3 w-full max-w-md">
                            <button 
                                onClick={() => onApply(generatedImage)}
                                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-sm uppercase shadow-lg shadow-green-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" /> Usar Fundo
                            </button>
                            <button 
                                onClick={handleGenerate}
                                className="px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold transition-all flex items-center justify-center"
                                title="Tentar Novamente"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 flex flex-col items-center gap-4 max-w-xs">
                        {isGenerating ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
                                <p className="text-sm font-bold text-indigo-400 animate-pulse">A IA está pintando seu fundo...</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                                    <ImageIcon className="w-10 h-10 opacity-50" />
                                </div>
                                <h4 className="text-lg font-black text-gray-300 uppercase">Área de Visualização</h4>
                                <p className="text-xs font-medium opacity-60">Selecione um tema e estilo ao lado e clique em GERAR para ver a mágica acontecer.</p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default AIBackgroundModal;
