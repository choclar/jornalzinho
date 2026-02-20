
import React, { useState, useRef, useEffect } from 'react';
import { PostConfig, TextTransform } from './types';
import { DEFAULT_CONFIG, calculatePostDimensions } from './constants';
import PostPreview from './components/PostPreview';
import EditorControls from './components/EditorControls';
import { generatePostContent, enhanceImage } from './services/geminiService';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useHistory } from './hooks/useHistory';
import { ZoomIn, ZoomOut, Monitor, ScanSearch, Loader2, Check, X, Save, Sparkles } from 'lucide-react';
import * as storage from './utils/storage';

const App: React.FC = () => {
  const { state: config, set: setConfig, undo, redo, canUndo, canRedo } = useHistory<PostConfig>(DEFAULT_CONFIG);
  
  // AI Preview State
  const [aiPreviewConfig, setAiPreviewConfig] = useState<PostConfig | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Viewport State (Zoom & Pan)
  const [viewState, setViewState] = useState({ scale: 0.4, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [suggestedBackground, setSuggestedBackground] = useState<string | null>(null);
  
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const isInitialLoad = useRef(true);

  // Determina qual configuração mostrar
  const activeConfig = aiPreviewConfig || config;

  // --- AUTO LOAD DRAFT ---
  useEffect(() => {
    const draft = storage.getDraft();
    if (draft) {
        setConfig(draft.config);
        setLastSaved(new Date(draft.timestamp));
    }
    isInitialLoad.current = false;
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (isInitialLoad.current || aiPreviewConfig) return;

    const timer = setTimeout(() => {
        storage.saveDraft(config);
        setLastSaved(new Date());
    }, 2000);

    return () => clearTimeout(timer);
  }, [config, aiPreviewConfig]);

  // Calculate "Fit to Screen"
  const fitToScreen = () => {
    if (containerRef.current) {
      const { width, height: viewHeight } = containerRef.current.getBoundingClientRect();
      const { width: postWidth, height: postHeight } = calculatePostDimensions(activeConfig);
      const padding = 60; 
      
      const scaleX = (width - padding) / postWidth;
      const scaleY = (viewHeight - padding) / postHeight;
      const newScale = Math.min(scaleX, scaleY, 0.9);

      setViewState({
          scale: newScale,
          x: 0,
          y: 0
      });
    }
  };

  useEffect(() => {
    setTimeout(fitToScreen, 100);
  }, [activeConfig.size, activeConfig.gridRows]);

  const handleWheel = (e: React.WheelEvent) => {
    if ((e.target as HTMLElement).closest('.custom-scrollbar')) return;
    if (e.ctrlKey || e.metaKey || !e.shiftKey) { 
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(Math.max(0.1, viewState.scale + delta), 4);
        setViewState(prev => ({ ...prev, scale: newScale }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('pan-target')) {
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
        const deltaX = e.clientX - lastMousePos.current.x;
        const deltaY = e.clientY - lastMousePos.current.y;
        setViewState(prev => ({ ...prev, x: prev.x + deltaX, y: prev.y + deltaY }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleConfigChange = (updates: Partial<PostConfig>) => {
    if (aiPreviewConfig) return;
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleTransformChange = (transform: { x: number; y: number; scale: number }) => {
    if (aiPreviewConfig) return;
    setConfig((prev) => ({ ...prev, imageTransform: transform }));
  };

  const handleLogoTransformChange = (transform: { x: number; y: number; scale: number; rotation: number }) => {
    if (aiPreviewConfig) return;
    setConfig((prev) => ({ ...prev, logoTransform: transform }));
  };

  const handleGridTransformChange = (index: number, transform: { x: number; y: number; scale: number }) => {
    if (aiPreviewConfig) return;
    setConfig((prev) => {
      const newGridItems = [...prev.gridItems];
      newGridItems[index] = { ...newGridItems[index], imageTransform: transform };
      return { ...prev, gridItems: newGridItems };
    });
  };

  const handleHeaderTransformChange = (transform: { x: number; y: number; scale: number }) => {
      if (aiPreviewConfig) return;
      setConfig((prev) => ({ ...prev, headerBackgroundTransform: transform }));
  };

  const handleTextTransformChange = (type: 'brand' | 'tagline', transform: TextTransform) => {
    if (aiPreviewConfig) return;
    setConfig((prev) => ({
        ...prev,
        [type === 'brand' ? 'brandTransform' : 'taglineTransform']: transform
    }));
  };

  const handleMagicFill = async () => {
    if (aiPreviewConfig) return;
    const currentItem = config.gridItems[config.selectedGridIndex];
    if (!currentItem.image) return;
    
    setIsGenerating(true);
    try {
      const [generatedContent, enhancedImageBase64] = await Promise.all([
        generatePostContent(currentItem.image),
        enhanceImage(currentItem.image)
      ]);

      setConfig((prev) => {
        const newGridItems = [...prev.gridItems];
        newGridItems[prev.selectedGridIndex] = {
        ...newGridItems[prev.selectedGridIndex],
        image: enhancedImageBase64,
        productName: generatedContent.productName,
        price: generatedContent.price,
        imageTransform: { x: 0, y: 0, scale: 1 }
        };
        return { ...prev, gridItems: newGridItems };
      });
    } catch (error) {
      console.error("Magic Fill Error:", error);
      alert("Houve um problema ao processar a mágica.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewProposal = (proposalConfig: PostConfig) => {
      setAiPreviewConfig(proposalConfig);
  };

  const handleApplyProposal = () => {
      if (aiPreviewConfig) {
          setConfig(aiPreviewConfig);
          setAiPreviewConfig(null);
      }
  };

  const handleDiscardProposal = () => setAiPreviewConfig(null);

  const handleSaveProposal = () => {
      if (!aiPreviewConfig) return;
      const name = prompt("Nome para salvar este design sugerido:", `Design IA ${new Date().toLocaleTimeString()}`);
      if (name) {
          storage.saveProjectToStorage(name, aiPreviewConfig);
          alert("Design salvo!");
      }
  };

  const handleDownloadImage = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const node = document.getElementById('post-preview-container');
      if (!node) return;
      
      const { width: calcWidth, height: calcHeight } = calculatePostDimensions(activeConfig);
      
      // Use the actual height of the element to avoid cropping
      const width = calcWidth;
      const height = Math.max(calcHeight, node.scrollHeight, node.offsetHeight);
      
      // FORÇAR LARGURA E ALTURA PARA EVITAR CORTES NO RODA PÉ
      const dataUrl = await htmlToImage.toPng(node as HTMLElement, { 
          width, 
          height, 
          pixelRatio: 2, 
          style: { 
              transform: 'scale(1)', 
              transformOrigin: 'top left',
              width: `${width}px`,
              height: `${height}px`
          } 
      });
      
      const link = document.createElement('a');
      link.download = `jornal-choclar-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      alert('Falha ao baixar imagem completa. Verifique se há fotos pesadas demais.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
        const node = document.getElementById('post-preview-container');
        if (!node) return;
        
        const { width: calcWidth, height: calcHeight } = calculatePostDimensions(activeConfig);
        const width = calcWidth;
        const height = Math.max(calcHeight, node.scrollHeight, node.offsetHeight);
        
        // FORÇAR LARGURA E ALTURA PARA O PDF
        const dataUrl = await htmlToImage.toPng(node as HTMLElement, { 
            width, 
            height, 
            pixelRatio: 1.5,
            style: { 
                transform: 'scale(1)', 
                transformOrigin: 'top left',
                width: `${width}px`,
                height: `${height}px`
            } 
        });
        
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [width, height] });
        pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
        pdf.save(`jornal-choclar-${Date.now()}.pdf`);
    } catch (error) {
        alert('Falha ao gerar PDF completo.');
    } finally {
        setIsDownloading(false);
    }
  };

  const handleManualSave = () => {
      const name = prompt("Nome do Projeto:", `Jornal ${new Date().toLocaleDateString()}`);
      if (name) {
          storage.saveProjectToStorage(name, config);
          alert("Projeto salvo com sucesso!");
      }
  };

  const displayPercentage = Math.round(viewState.scale * 100);
  const { width: currentWidth, height: currentHeight } = calculatePostDimensions(activeConfig);

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <div className={`w-[400px] h-full flex-shrink-0 z-30 shadow-2xl bg-white border-r border-gray-200 ${aiPreviewConfig ? 'opacity-50 pointer-events-none grayscale' : ''} transition-all duration-300`}>
        <EditorControls 
          config={config} 
          onChange={handleConfigChange}
          onMagicFill={handleMagicFill}
          isGenerating={isGenerating}
          onDownloadImage={handleDownloadImage}
          onDownloadPDF={handleDownloadPDF}
          isDownloading={isDownloading}
          onUndo={undo} 
          onRedo={redo} 
          canUndo={canUndo} 
          canRedo={canRedo}
          onSuggestBackground={setSuggestedBackground}
          suggestedBackground={suggestedBackground}
          lastSaved={lastSaved}
          onSaveProject={handleManualSave}
          onPreviewProposal={handlePreviewProposal}
        />
      </div>

      <div 
         ref={containerRef}
         className={`flex-1 h-full bg-gray-200/90 relative overflow-hidden flex items-center justify-center pan-target ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
         onWheel={handleWheel}
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseUp}
      >
         <div 
            style={{ 
                transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`,
                transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                willChange: 'transform'
            }}
            className={`shadow-2xl ring-1 ring-black/5 transition-all duration-300 ${aiPreviewConfig ? 'ring-4 ring-indigo-500 shadow-indigo-200' : ''}`}
         >
            <div style={{ width: currentWidth, minHeight: currentHeight }} className="bg-white relative">
                {aiPreviewConfig && (
                    <div className="absolute -top-12 left-0 right-0 flex justify-center">
                        <div className="bg-indigo-600 text-white px-4 py-1 rounded-t-lg font-bold text-sm flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Sugestão IA
                        </div>
                    </div>
                )}
                <PostPreview 
                    ref={previewRef} 
                    config={activeConfig} 
                    scale={1}
                    suggestedBackground={suggestedBackground}
                    onTransformChange={handleTransformChange}
                    onLogoTransformChange={handleLogoTransformChange}
                    onGridTransformChange={handleGridTransformChange}
                    onHeaderTransformChange={handleHeaderTransformChange}
                    onTextTransformChange={handleTextTransformChange}
                />
            </div>
         </div>

         {aiPreviewConfig && (
             <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50">
                 <div className="bg-white/95 backdrop-blur-md border-2 border-indigo-100 rounded-2xl shadow-2xl p-2 flex items-center gap-2">
                     <button onClick={handleApplyProposal} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2">
                         <Check className="w-5 h-5" /> Aplicar
                     </button>
                     <button onClick={handleDiscardProposal} className="bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2">
                         <X className="w-4 h-4" /> Cancelar
                     </button>
                 </div>
             </div>
         )}

         {isDownloading && (
             <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white text-center">
                 <Loader2 className="w-12 h-12 animate-spin mb-4" />
                 <p className="text-xl font-bold">Gerando arquivo em Alta Qualidade...</p>
                 <p className="text-sm opacity-70 mt-2">Isso pode levar alguns segundos dependendo do número de fotos.</p>
             </div>
         )}

         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-900/90 backdrop-blur-md px-2 py-1.5 rounded-2xl shadow-xl z-40 text-white select-none">
            <button onClick={() => setViewState(p => ({ ...p, scale: Math.max(0.1, p.scale - 0.1) }))} className="p-2 hover:bg-white/10 rounded-xl"><ZoomOut className="w-4 h-4" /></button>
            <span className="text-xs font-bold w-12 text-center tabular-nums">{displayPercentage}%</span>
            <button onClick={() => setViewState(p => ({ ...p, scale: Math.min(4, p.scale + 0.1) }))} className="p-2 hover:bg-white/10 rounded-xl"><ZoomIn className="w-4 h-4" /></button>
            <div className="w-px h-5 bg-white/20 mx-1"></div>
            <button onClick={() => setViewState(p => ({ ...p, scale: 1 }))} className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-white/10">100%</button>
            <button onClick={fitToScreen} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white">Fit</button>
         </div>
      </div>
    </div>
  );
};

export default App;
