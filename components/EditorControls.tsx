
import React, { useRef, useState, useEffect } from 'react';
import { PostConfig, LayoutType, PostSize, GridItem, FontFamily, BorderStyle } from '../types';
import { DEFAULT_CONFIG } from '../constants';
import { Wand2, Upload, Layout, Type, Palette, Download, Image as ImageIcon, Undo2, Redo2, ZoomIn, Smartphone, Crop, Stamp, Sparkles, Grid3X3, Type as TypeIcon, ImagePlus, X, Check, Table, RotateCw, Move, Layers, Box, Leaf, Gem, Sun, Paintbrush, Trash2, ArrowUpRight, Scissors, Eraser, Candy, Store, Droplets, Waves, Eye, Rocket, Frame, FileText, ChevronDown, Save, Cloud, Images, Maximize, RotateCcw, PartyPopper, AlertCircle, RefreshCcw, Percent, Megaphone, Shadow, Info, MapPin, AlignLeft, ShieldCheck, Search } from 'lucide-react';
import ProjectManager from './ProjectManager';
import { generateCatchyTagline, generateDesignSystem, enhanceImage, removeBackgroundAI, generateHeaderBackground } from '../services/geminiService';
import AIBackgroundModal from './AIBackgroundModal';
import * as storage from '../utils/storage';

interface EditorControlsProps {
  config: PostConfig;
  onChange: (updates: Partial<PostConfig>) => void;
  onMagicFill: () => void;
  isGenerating: boolean;
  onDownloadImage: () => void;
  onDownloadPDF: () => void;
  isDownloading?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSuggestBackground: (img: string | null) => void;
  suggestedBackground: string | null;
  lastSaved?: Date | null;
  onSaveProject: () => void;
  onPreviewProposal: (proposalConfig: PostConfig) => void; 
}

const EditorControls: React.FC<EditorControlsProps> = ({ 
  config, onChange, onMagicFill, isGenerating, onDownloadImage, onDownloadPDF, isDownloading, onUndo, onRedo, canUndo, canRedo, onSuggestBackground, suggestedBackground, lastSaved, onSaveProject, onPreviewProposal
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const ctaBgInputRef = useRef<HTMLInputElement>(null);
  
  const [isGeneratingTagline, setIsGeneratingTagline] = useState(false);
  const [headerPrompt, setHeaderPrompt] = useState('');
  const [isGeneratingHeader, setIsGeneratingHeader] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [pendingHeaderImage, setPendingHeaderImage] = useState<string | null>(null);
  const [aiLayoutPrompt, setAiLayoutPrompt] = useState('');
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);
  
  // State for the new AI Background Modal
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);

  const handleItemUpdate = (updates: Partial<GridItem>) => {
    const newGridItems = [...config.gridItems];
    newGridItems[config.selectedGridIndex] = { ...newGridItems[config.selectedGridIndex], ...updates };
    onChange({ gridItems: newGridItems });
  };

  const updateBorderStyle = (style: BorderStyle) => {
      handleItemUpdate({ borderStyle: style });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { handleItemUpdate({ image: reader.result as string, imageTransform: { x: 0, y: 0, scale: 1 } }); setPreviewImage(null); };
      reader.readAsDataURL(file);
    }
  };

  const handleHeaderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setPendingHeaderImage(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const applyPendingHeader = (alsoToCta: boolean) => {
      if (!pendingHeaderImage) return;
      const updates: Partial<PostConfig> = { headerBackground: pendingHeaderImage, headerBackgroundTransform: { x: 0, y: 0, scale: 1 } };
      if (alsoToCta) { updates.ctaBgImage = pendingHeaderImage; updates.ctaOpacity = 1; updates.ctaBgTransform = { x: 0, y: 0, scale: 1 }; }
      onChange(updates);
      setPendingHeaderImage(null);
  };

  const downloadPendingImage = () => {
      if (!pendingHeaderImage) return;
      const link = document.createElement('a');
      link.href = pendingHeaderImage;
      link.download = `choclar-header-${Date.now()}.png`;
      link.click();
  };

  const handleCtaBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { onChange({ ctaBgImage: reader.result as string, ctaBgTransform: { x: 0, y: 0, scale: 1 } }); };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateHeader = async () => {
      setIsGeneratingHeader(true);
      try { const newHeader = await generateHeaderBackground(headerPrompt); setPendingHeaderImage(newHeader); } catch (e) { alert("Falha ao gerar fundo do cabeçalho."); } finally { setIsGeneratingHeader(false); }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { onChange({ logo: reader.result as string, logoOpacity: config.logoOpacity || 1, logoTransform: { ...config.logoTransform, scale: 0.3, x: 0, y: 0, rotation: 0 } }); };
      reader.readAsDataURL(file);
    }
  };

  const updateColor = (key: keyof PostConfig['colors'], value: string) => {
    const updates: any = { colors: { ...config.colors, [key]: value } };
    if (key === 'brand') updates.brandColor = value;
    if (key === 'primary') updates.taglineColor = value;
    if (key === 'secondary') updates.taglineBgColor = value;
    onChange(updates);
  };

  const handleMagicTagline = async () => {
    setIsGeneratingTagline(true);
    try { const newTagline = await generateCatchyTagline(config.brandName); onChange({ taglineText: newTagline }); } catch (e) { console.error(e); } finally { setIsGeneratingTagline(false); }
  };

  const handleGenerateDesignProposal = async () => {
      if (!aiLayoutPrompt.trim()) return;
      setIsGeneratingLayout(true);
      try {
          const design = await generateDesignSystem(aiLayoutPrompt);
          const proposalConfig: PostConfig = { ...config, layout: design.layout, colors: design.colors, taglineText: design.taglineText, taglineColor: design.colors.primary, taglineBgColor: design.colors.secondary, cta: design.cta };
          try {
              const headerBg = await generateHeaderBackground(design.headerPrompt);
              proposalConfig.headerBackground = headerBg;
              proposalConfig.headerBackgroundTransform = { x: 0, y: 0, scale: 1 }; 
              proposalConfig.backgroundImage = null; 
          } catch (bgError) { console.warn(bgError); }
          onPreviewProposal(proposalConfig);
          setAiLayoutPrompt('');
      } catch (error) { alert('Erro ao criar design. Tente simplificar o pedido.'); } finally { setIsGeneratingLayout(false); }
  };

  const handleResetConfig = () => {
      if (confirm("Tem certeza que deseja restaurar as configurações padrão? Seu trabalho atual será perdido se não estiver salvo.")) {
          onChange(DEFAULT_CONFIG);
      }
  };

  const handleCheckpoint = () => {
      storage.saveProjectToStorage(`RESTORE_POINT_${new Date().toLocaleTimeString()}`, config);
      alert("Checkpoint criado com sucesso! Use a Galeria Local para restaurar se necessário.");
  };
  
  const handleBgModalApply = (img: string) => {
      setPendingHeaderImage(img);
      setIsBgModalOpen(false);
  };

  const renderImageTools = () => {
    const item = config.gridItems[config.selectedGridIndex];
    if (isProcessingImage) return <div className="p-4 bg-gray-50 rounded-lg flex flex-col items-center justify-center space-y-2 border border-gray-200"><div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" /><span className="text-xs font-semibold text-gray-500">Processando com IA...</span></div>;
    if (previewImage) return <div className="space-y-2 animate-in fade-in slide-in-from-top-2"><div className="relative rounded-lg overflow-hidden border-2 border-indigo-500 shadow-md h-40 bg-gray-100"><img src={previewImage} className="w-full h-full object-contain" /><div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">PRÉVIA</div></div><div className="flex gap-2"><button onClick={() => { handleItemUpdate({ image: previewImage }); setPreviewImage(null); }} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm"><Check className="w-3 h-3" /> Aplicar</button><button onClick={() => setPreviewImage(null)} className="flex-1 py-2 bg-white hover:bg-gray-100 text-gray-600 border border-gray-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm"><X className="w-3 h-3" /> Descartar</button></div></div>;
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={async () => { setIsProcessingImage(true); try { const currentImg = config.gridItems[config.selectedGridIndex].image; if (currentImg) setPreviewImage(await enhanceImage(currentImg)); } finally { setIsProcessingImage(false); } }} className="py-2 px-1 bg-white border border-gray-200 hover:bg-indigo-50 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all"><Sparkles className="w-4 h-4 text-indigo-500" />Melhorar (HD)</button>
          <button onClick={async () => { setIsProcessingImage(true); try { const currentImg = config.gridItems[config.selectedGridIndex].image; if (currentImg) setPreviewImage(await removeBackgroundAI(currentImg)); } finally { setIsProcessingImage(false); } }} className="py-2 px-1 bg-white border border-gray-200 hover:bg-pink-50 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all"><Scissors className="w-4 h-4 text-pink-500" />Remover Fundo</button>
        </div>
        
        <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
            <label className="text-[10px] font-black text-indigo-700 uppercase mb-2 block flex items-center justify-between">
                <span>Zoom da Foto</span>
                <span className="bg-white px-1.5 rounded">{item.imageTransform.scale.toFixed(1)}x</span>
            </label>
            <div className="flex items-center gap-2">
                <Search className="w-3 h-3 text-indigo-400" />
                <input 
                    type="range" 
                    min="0.1" 
                    max="5" 
                    step="0.05" 
                    value={item.imageTransform.scale} 
                    onChange={(e) => handleItemUpdate({ imageTransform: { ...item.imageTransform, scale: parseFloat(e.target.value) } })} 
                    className="flex-1 accent-indigo-600 h-1.5 bg-white rounded-lg appearance-none cursor-pointer" 
                />
                <Maximize className="w-3 h-3 text-indigo-400" />
            </div>
        </div>

        <button onClick={() => handleItemUpdate({ hasShadow: !item.hasShadow })} className={`w-full py-2 bg-white border transition-all rounded-lg text-xs font-bold flex items-center justify-center gap-2 ${item.hasShadow ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-inner' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}><Layers className={`w-4 h-4 ${item.hasShadow ? 'text-indigo-600' : 'text-gray-400'}`} /> {item.hasShadow ? 'Sombra Ativa' : 'Sombra Sutil'}</button>
      </div>
    );
  };

  const renderBorderControls = () => {
      const currentBorder = config.gridItems[config.selectedGridIndex].borderStyle || 'none';
      const hasBorder = currentBorder !== 'none';
      return (
          <div className="pt-2 border-t border-gray-100 mt-2">
              <label className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1"><Frame className="w-3 h-3" /> Borda Decorativa</label>
              <div className="flex gap-2 mb-3"><button onClick={() => updateBorderStyle(hasBorder ? 'none' : 'gradient-hot')} className={`flex-1 py-1.5 rounded text-xs font-bold border transition-all ${hasBorder ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>{hasBorder ? 'ATIVADA' : 'DESATIVADA'}</button></div>
              {hasBorder && (<div className="grid grid-cols-3 gap-2">{[{ id: 'gradient-hot', label: 'Quente' }, { id: 'gradient-cool', label: 'Frio' }, { id: 'neon-blue', label: 'Neon Azul' }, { id: 'neon-pink', label: 'Neon Rosa' }, { id: 'gold-elegant', label: 'Ouro' }, { id: 'dashed-red', label: 'Tracejado' }].map((b) => (<button key={b.id} onClick={() => updateBorderStyle(b.id as BorderStyle)} className={`h-8 rounded border flex items-center justify-center text-[10px] ${currentBorder === b.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200'}`}>{b.label}</button>))}</div>)}
          </div>
      );
  };

  const renderBadgeControls = () => {
      return (
          <div className="p-3 bg-white rounded-xl border border-rose-100 space-y-3">
              <div className="flex items-center gap-2 mb-1"><Percent className="w-4 h-4 text-rose-500" /><label className="text-xs font-bold text-rose-900 uppercase">Selo de Desconto</label></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Cor Fundo</label><input type="color" value={config.discountBadgeBgColor || '#DC2626'} onChange={(e) => onChange({ discountBadgeBgColor: e.target.value })} className="w-full h-8 rounded border-none cursor-pointer" /></div><div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Cor Texto</label><input type="color" value={config.discountBadgeColor || '#FFFFFF'} onChange={(e) => onChange({ discountBadgeColor: e.target.value })} className="w-full h-8 rounded border-none cursor-pointer" /></div></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex justify-between"><span>Tamanho</span><span>{config.discountBadgeScale?.toFixed(1) || '1.0'}x</span></label><input type="range" min="0.5" max="2" step="0.1" value={config.discountBadgeScale || 1} onChange={(e) => onChange({ discountBadgeScale: parseFloat(e.target.value) })} className="w-full accent-rose-500 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer" /></div>
          </div>
      );
  };

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      <AIBackgroundModal isOpen={isBgModalOpen} onClose={() => setIsBgModalOpen(false)} onApply={handleBgModalApply} />
      
      {pendingHeaderImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                  <div className="bg-indigo-600 p-6 text-white text-center"><PartyPopper className="w-10 h-10 mx-auto mb-2" /><h3 className="text-xl font-black uppercase tracking-tight">Nova Imagem Pronta!</h3><p className="text-indigo-100 text-xs mt-1">O que deseja fazer com esta foto?</p></div>
                  <div className="p-4"><div className="aspect-[16/9] rounded-xl overflow-hidden border-2 border-gray-100 mb-4 shadow-inner"><img src={pendingHeaderImage} className="w-full h-full object-cover" /></div><div className="space-y-2"><button onClick={() => applyPendingHeader(true)} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"><Check className="w-5 h-5" /> Aplicar no Cabeçalho e CTA</button><button onClick={() => applyPendingHeader(false)} className="w-full py-3 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95">Apenas no Cabeçalho</button><div className="flex gap-2"><button onClick={downloadPendingImage} className="flex-1 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"><Download className="w-4 h-4" /> Salvar Foto</button><button onClick={() => setPendingHeaderImage(null)} className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"><Trash2 className="w-4 h-4" /> Descartar</button></div></div></div>
              </div>
          </div>
      )}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-3 shadow-sm z-10 sticky top-0">
        <div className="flex items-center justify-between">
             <h1 className="text-lg font-serif font-bold text-choco-900 flex items-center gap-3 leading-tight"><div className="flex items-center justify-center select-none" title="CHOC-LAR"><div className="flex items-center gap-0.5 drop-shadow-[1px_1px_0px_rgba(0,0,0,0.5)]"><span className="text-xl font-black text-green-500 tracking-tighter" style={{ WebkitTextStroke: '0.5px black' }}>C</span><span className="text-xl font-black text-blue-500 tracking-tighter" style={{ WebkitTextStroke: '0.5px black' }}>H</span><div className="w-4 h-4 rounded-full bg-red-500 border border-black relative mx-px"><div className="absolute inset-0 rounded-full border border-yellow-400 box-border"></div><div className="absolute inset-[3px] rounded-full border border-pink-400 box-border"></div></div><span className="text-xl font-black text-pink-500 tracking-tighter" style={{ WebkitTextStroke: '0.5px black' }}>C</span><span className="w-0.5"></span><span className="text-xl font-black text-green-500 tracking-tighter" style={{ WebkitTextStroke: '0.5px black' }}>L</span><span className="text-xl font-black text-blue-500 tracking-tighter" style={{ WebkitTextStroke: '0.5px black' }}>A</span><span className="text-xl font-black text-yellow-400 tracking-tighter" style={{ WebkitTextStroke: '0.5px black' }}>R</span></div></div><span className="flex flex-col"><span className="text-sm">Criador de Jornal</span><span className="text-base font-black text-choco-800 tracking-wide">CHOC-LAR</span></span></h1>
             <div className="flex items-center gap-2">{lastSaved && (<span className="text-[10px] text-gray-400 flex items-center gap-1 mr-2"><Cloud className="w-3 h-3" /> Auto-salvo {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>)}<button onClick={handleCheckpoint} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors" title="Criar Ponto de Backup"><ShieldCheck className="w-4 h-4" /></button><button onClick={onSaveProject} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Salvar Projeto"><Save className="w-4 h-4" /></button></div>
        </div>
        <div className="flex items-center gap-2 justify-between">
            <div className="flex gap-1"><button onClick={onUndo} disabled={!canUndo} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-30 border border-gray-200" title="Desfazer (Undo)"><Undo2 className="w-4 h-4" /></button><button onClick={onRedo} disabled={!canRedo} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-30 border border-gray-200" title="Refazer (Redo)"><Redo2 className="w-4 h-4" /></button><button onClick={handleResetConfig} className="p-2 rounded-md hover:bg-red-50 text-red-500 border border-red-200 ml-2" title="Restaurar Padrão"><RefreshCcw className="w-4 h-4" /></button></div>
            <div className="relative"><button onClick={() => setShowDownloadMenu(!showDownloadMenu)} disabled={isDownloading} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"><Download className="w-4 h-4" /> BAIXAR <ChevronDown className="w-3 h-3" /></button>{showDownloadMenu && (<><div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} /><div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"><button onClick={() => { onDownloadImage(); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-green-50 text-sm font-semibold text-gray-700 flex items-center gap-2 border-b border-gray-100"><ImageIcon className="w-4 h-4 text-green-600" /> Imagem (PNG) <span className="text-[10px] bg-green-100 text-green-800 px-1 rounded ml-auto">HD</span></button><button onClick={() => { onDownloadPDF(); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm font-semibold text-gray-700 flex items-center gap-2"><FileText className="w-4 h-4 text-red-600" /> Arquivo (PDF)</button></div></>)}</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 bg-slate-50/30">
        <ProjectManager currentConfig={config} onLoadConfig={(c) => onChange(c)} />
        
        <section className="space-y-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 shadow-sm">
            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2"><div className="p-1.5 bg-indigo-600 rounded-lg text-white"><Layout className="w-4 h-4" /></div>1. Estrutura do Jornal</h3>
            <div className="bg-white p-3 rounded-xl border border-indigo-200"><label className="text-xs font-black text-indigo-800 mb-2 block"><Sparkles className="w-3 h-3 inline mr-1 text-indigo-600" /> Designer Mágico IA</label><div className="flex flex-col gap-2"><input type="text" value={aiLayoutPrompt} onChange={(e) => setAiLayoutPrompt(e.target.value)} placeholder="Ex: Páscoa, Black Friday..." className="w-full text-xs p-2.5 border border-indigo-100 rounded-lg outline-none"/><button onClick={handleGenerateDesignProposal} disabled={isGeneratingLayout || !aiLayoutPrompt.trim()} className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-black shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all">{isGeneratingLayout ? 'Criando...' : '✨ Gerar Design com IA'}</button></div></div>
            <div className="grid grid-cols-3 gap-2">{['layout-1', 'layout-2', 'layout-3', 'layout-4', 'layout-5', 'layout-6'].map((layout) => (<button key={layout} onClick={() => onChange({ layout: layout as LayoutType })} className={`h-12 rounded-xl border-2 transition-all text-[10px] font-black uppercase ${config.layout === layout ? 'border-indigo-600 bg-indigo-100 text-indigo-900' : 'border-white bg-white hover:border-indigo-300'}`}>{layout.replace('layout-', 'Estilo ')}</button>))}</div>
            <div className="grid grid-cols-4 gap-2">{[{ r: 2, c: 2, label: '2x2' }, { r: 3, c: 2, label: '3x2' }, { r: 3, c: 3, label: '3x3' }, { r: 4, c: 3, label: '4x3' }].map(opt => (<button key={opt.label} onClick={() => onChange({ gridRows: opt.r, gridCols: opt.c, selectedGridIndex: Math.min(config.selectedGridIndex, (opt.r * opt.c) - 1) })} className={`py-2 rounded-lg text-[10px] font-black border transition-all ${config.gridRows === opt.r && config.gridCols === opt.c ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white border-white text-indigo-400 shadow-sm hover:border-indigo-200'}`}>{opt.label}</button>))}</div>
        </section>

        <section className="space-y-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 shadow-sm">
            <h3 className="text-sm font-black text-blue-900 uppercase tracking-wider flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 rounded-lg text-white"><Images className="w-4 h-4" /></div>
                2. Cabeçalho (Topo)
            </h3>
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-black text-blue-800 mb-1 block uppercase">Imagem de Fundo</label>
                    <div className="flex gap-2">
                        <button onClick={() => headerInputRef.current?.click()} className="flex-1 py-2.5 bg-white border border-blue-200 text-blue-700 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-50 shadow-sm">
                            <Upload className="w-3 h-3" /> Enviar Foto
                        </button>
                        <input ref={headerInputRef} type="file" className="hidden" accept="image/*" onChange={handleHeaderUpload} />
                        {config.headerBackground && <button onClick={() => onChange({ headerBackground: null })} className="px-3 border border-red-200 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                </div>
                <div className="relative flex py-1 items-center"><div className="flex-grow border-t border-blue-200"></div><span className="mx-2 text-blue-300 text-[10px] font-black">OU GERE COM IA</span><div className="flex-grow border-t border-blue-200"></div></div>
                <div className="bg-white p-3 rounded-xl border border-blue-200">
                    <label className="text-xs font-black text-blue-800 mb-1 block uppercase tracking-tighter">Gerar Fundo com IA</label>
                    <div className="flex gap-2 mb-2"><input type="text" value={headerPrompt} onChange={(e) => setHeaderPrompt(e.target.value)} placeholder="Tema (Ex: Natal, Páscoa)" className="flex-1 p-2 text-sm border border-blue-100 rounded-lg outline-none" /></div>
                    
                    {/* NEW AI BUTTON */}
                    <div className="flex gap-2">
                         <button onClick={handleGenerateHeader} disabled={isGeneratingHeader} className="flex-1 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-100 disabled:opacity-50 shadow-sm">
                            {isGeneratingHeader ? '...' : 'Rápido'}
                        </button>
                        <button 
                            onClick={() => setIsBgModalOpen(true)}
                            className="flex-[2] py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-black flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700 shadow-md transition-all active:scale-95"
                        >
                            <Palette className="w-4 h-4" /> Estúdio de Criação
                        </button>
                    </div>
                </div>
                {config.headerBackground && (
                    <div className="mt-2 space-y-2 p-2 bg-white rounded-xl border border-blue-100">
                        <label className="text-[10px] font-black text-blue-400 uppercase mb-1 flex justify-between"><span>Zoom do Fundo</span><span>{config.headerBackgroundTransform?.scale?.toFixed(1)}x</span></label>
                        <input type="range" min="0.5" max="10" step="0.1" value={config.headerBackgroundTransform?.scale || 1} onChange={(e) => onChange({ headerBackgroundTransform: { ...(config.headerBackgroundTransform || { x: 0, y: 0 }), scale: parseFloat(e.target.value) } })} className="w-full accent-blue-600 h-1.5 bg-blue-100 rounded-lg appearance-none cursor-pointer" />
                    </div>
                )}
            </div>
        </section>

        <section className="space-y-4 p-4 rounded-2xl bg-amber-50 border border-amber-100 shadow-sm">
            <h3 className="text-sm font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                <div className="p-1.5 bg-amber-600 rounded-lg text-white"><Stamp className="w-4 h-4" /></div>
                3. Sua Marca
            </h3>
            <div className="space-y-4">
                <div className="p-3 bg-white rounded-xl border border-amber-200 space-y-3">
                    <label className="text-xs font-black text-amber-800 block uppercase">Logotipo</label>
                    <div className="flex gap-2">
                        <button onClick={() => logoInputRef.current?.click()} className="flex-1 py-2.5 bg-white border border-amber-200 text-amber-700 rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-amber-50 shadow-sm">
                            <Upload className="w-3 h-3" /> Enviar Logo
                        </button>
                        <input ref={logoInputRef} type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                        {config.logo && <button onClick={() => onChange({ logo: null })} className="px-3 border border-red-200 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>}
                    </div>
                    {config.logo && (
                        <div className="grid grid-cols-3 gap-2 pt-2">
                            <div><label className="text-[10px] font-black text-amber-400 uppercase">Tam</label><input type="range" min="0.05" max="2" step="0.05" value={config.logoTransform.scale} onChange={(e) => onChange({ logoTransform: { ...config.logoTransform, scale: parseFloat(e.target.value) } })} className="w-full h-1 accent-amber-500" /></div>
                            <div><label className="text-[10px] font-black text-amber-400 uppercase">Opa</label><input type="range" min="0.1" max="1" step="0.1" value={config.logoOpacity || 1} onChange={(e) => onChange({ logoOpacity: parseFloat(e.target.value) })} className="w-full h-1 accent-amber-500" /></div>
                            <div><label className="text-[10px] font-black text-amber-400 uppercase">Girar</label><input type="range" min="-180" max="180" step="1" value={config.logoTransform.rotation || 0} onChange={(e) => onChange({ logoTransform: { ...config.logoTransform, rotation: parseInt(e.target.value) } })} className="w-full h-1 accent-amber-500" /></div>
                        </div>
                    )}
                </div>

                <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-3">
                    <label className="text-xs font-black text-amber-800 uppercase">Nome da Empresa</label>
                    <input type="text" value={config.brandName} onChange={(e) => onChange({ brandName: e.target.value })} className="w-full p-2.5 border border-amber-100 rounded-lg text-sm font-black uppercase outline-none mb-2" />
                    
                    <div className="grid grid-cols-2 gap-3 pb-2">
                        <div>
                            <label className="text-[10px] font-black text-amber-400 uppercase mb-1 block flex justify-between"><span>Tamanho</span> <span>{config.brandTransform.scale.toFixed(1)}x</span></label>
                            <input type="range" min="0.5" max="5" step="0.1" value={config.brandTransform.scale} onChange={(e) => onChange({ brandTransform: { ...config.brandTransform, scale: parseFloat(e.target.value) } })} className="w-full h-1.5 accent-amber-600 bg-amber-50 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-amber-400 uppercase mb-1 block flex justify-between"><span>Opacidade</span> <span>{Math.round((config.brandOpacity || 1) * 100)}%</span></label>
                            <input type="range" min="0.1" max="1" step="0.1" value={config.brandOpacity || 1} onChange={(e) => onChange({ brandOpacity: parseFloat(e.target.value) })} className="w-full h-1.5 accent-amber-600 bg-amber-50 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-amber-400 uppercase mb-1 block">Cor do Nome</label>
                            <input type="color" value={config.brandColor || '#FFFFFF'} onChange={(e) => onChange({ brandColor: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer border border-amber-100" />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-amber-400 uppercase mb-1 block">Girar</label>
                            <input type="range" min="-180" max="180" step="1" value={config.brandTransform.rotation || 0} onChange={(e) => onChange({ brandTransform: { ...config.brandTransform, rotation: parseInt(e.target.value) } })} className="w-full h-1 accent-amber-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-3">
                    <label className="text-xs font-black text-amber-800 flex justify-between uppercase"><span>Slogan / Título</span><button onClick={handleMagicTagline} className="text-amber-600 text-[10px] font-black flex items-center gap-1"><Wand2 className="w-3 h-3"/> Mágica</button></label>
                    <input type="text" value={config.taglineText} onChange={(e) => onChange({ taglineText: e.target.value })} className="w-full p-2.5 border border-amber-100 rounded-lg text-sm font-bold mb-2" />
                    
                    <div className="grid grid-cols-2 gap-3 pb-2">
                        <div>
                            <label className="text-[10px] font-black text-amber-400 uppercase mb-1 block flex justify-between"><span>Tamanho</span> <span>{config.taglineTransform.scale.toFixed(1)}x</span></label>
                            <input type="range" min="0.5" max="5" step="0.1" value={config.taglineTransform.scale} onChange={(e) => onChange({ taglineTransform: { ...config.taglineTransform, scale: parseFloat(e.target.value) } })} className="w-full h-1.5 accent-amber-600 bg-amber-50 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-amber-400 uppercase mb-1 block flex justify-between"><span>Opacidade</span> <span>{Math.round((config.taglineOpacity || 1) * 100)}%</span></label>
                            <input type="range" min="0.1" max="1" step="0.1" value={config.taglineOpacity || 1} onChange={(e) => onChange({ taglineOpacity: parseFloat(e.target.value) })} className="w-full h-1.5 accent-amber-600 bg-amber-50 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-black text-amber-400 uppercase mb-1 block">Cor do Texto</label>
                            <input type="color" value={config.taglineColor || '#DC2626'} onChange={(e) => onChange({ taglineColor: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer border border-amber-100" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-amber-400 uppercase mb-1 block">Cor de Fundo</label>
                            <input type="color" value={config.taglineBgColor || '#FFD700'} onChange={(e) => onChange({ taglineBgColor: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer border border-amber-100" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-3">
                    <label className="text-xs font-black text-amber-800 uppercase">Cores da Identidade Visual</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[{ key: 'accent', label: 'Destaques' }, { key: 'background', label: 'Fundo Geral' }].map(({ key, label }) => (
                            <div key={key} className="flex flex-col"><label className="text-[10px] font-bold text-amber-400 mb-1">{label}</label><input type="color" value={config.colors[key as keyof PostConfig['colors']]} onChange={(e) => updateColor(key as keyof PostConfig['colors'], e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border border-amber-100" /></div>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        <section className="space-y-4 p-4 rounded-2xl bg-slate-100 border border-slate-200 shadow-md">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-tighter"><div className="p-1.5 bg-slate-800 rounded-lg text-white"><Box className="w-4 h-4" /></div>Produto #{config.selectedGridIndex + 1}</h3>
                <div className="flex gap-1"><button onClick={() => onChange({ selectedGridIndex: Math.max(0, config.selectedGridIndex - 1) })} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"><RotateCcw className="w-4 h-4 text-slate-600" /></button><button onClick={() => onChange({ selectedGridIndex: Math.min(config.gridItems.length - 1, config.selectedGridIndex + 1) })} className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"><RotateCw className="w-4 h-4 text-slate-600" /></button></div>
            </div>
            <div className="space-y-4">
                <div className="flex gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Upload className="w-4 h-4" /> Adicionar Foto</button>
                    <button onClick={onMagicFill} disabled={isGenerating || !config.gridItems[config.selectedGridIndex].image} className="px-4 bg-indigo-600 text-white rounded-xl disabled:opacity-30 shadow-lg active:scale-95 transition-all" title="Preencher com IA"><Wand2 className="w-4 h-4" /></button>
                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
                {config.gridItems[config.selectedGridIndex].image && (<div className="bg-white p-3 rounded-xl border border-slate-200 shadow-inner space-y-3">{renderImageTools()}{renderBorderControls()}</div>)}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Nome do Produto</label>
                        <textarea rows={2} value={config.gridItems[config.selectedGridIndex].productName} onChange={(e) => handleItemUpdate({ productName: e.target.value })} className="w-full p-2.5 border border-slate-100 rounded-lg font-black text-slate-800 outline-none focus:border-slate-500 text-sm leading-tight" />
                        <div className="mt-2 flex items-center gap-3"><label className="text-[10px] font-black text-slate-400 uppercase flex-shrink-0">Letra</label><input type="range" min="10" max="80" step="1" value={config.gridItems[config.selectedGridIndex].nameFontSize || 32} onChange={(e) => handleItemUpdate({ nameFontSize: parseInt(e.target.value) })} className="flex-1 accent-slate-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer" /></div>
                    </div>
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase mb-1 block flex items-center gap-1"><AlignLeft className="w-3 h-3" /> Sabores / Detalhes</label>
                        <textarea rows={2} value={config.gridItems[config.selectedGridIndex].productDetails || ''} onChange={(e) => handleItemUpdate({ productDetails: e.target.value })} placeholder="Ex: Sabores diversos, 200g" className="w-full p-2.5 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:border-slate-500 leading-tight" />
                        <div className="mt-2 flex items-center gap-3"><label className="text-[10px] font-black text-slate-400 uppercase flex-shrink-0">Letra</label><input type="range" min="10" max="60" step="1" value={config.gridItems[config.selectedGridIndex].detailsFontSize || 16} onChange={(e) => handleItemUpdate({ detailsFontSize: parseInt(e.target.value) })} className="flex-1 accent-slate-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-rose-50 p-2 rounded-xl border border-rose-100">
                            <label className="text-[10px] font-black text-rose-600 mb-1 block">Preço "De"</label>
                            <input type="text" value={config.gridItems[config.selectedGridIndex].originalPrice || ''} onChange={(e) => handleItemUpdate({ originalPrice: e.target.value })} placeholder="R$ 0,00" className="w-full p-2 bg-white border border-rose-100 rounded-lg text-xs font-black text-rose-700 outline-none" />
                            <div className="mt-2 flex items-center gap-2">
                                <TypeIcon size={12} className="text-rose-400 flex-shrink-0"/>
                                <input type="range" min="8" max="40" step="1" value={config.gridItems[config.selectedGridIndex].originalPriceFontSize || 12} onChange={(e) => handleItemUpdate({ originalPriceFontSize: parseInt(e.target.value) })} className="flex-1 accent-rose-500 h-1 bg-rose-200 rounded-lg appearance-none cursor-pointer" />
                            </div>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                            <label className="text-[10px] font-black text-emerald-600 mb-1 block">Preço "Por"</label>
                            <input type="text" value={config.gridItems[config.selectedGridIndex].price} onChange={(e) => handleItemUpdate({ price: e.target.value })} className="w-full p-2 bg-white border border-emerald-100 rounded-lg text-xs font-black text-emerald-700 outline-none" />
                            <div className="mt-2 flex items-center gap-2">
                                <TypeIcon size={12} className="text-emerald-400 flex-shrink-0"/>
                                <input type="range" min="20" max="120" step="2" value={config.gridItems[config.selectedGridIndex].priceFontSize || 56} onChange={(e) => handleItemUpdate({ priceFontSize: parseInt(e.target.value) })} className="flex-1 accent-emerald-500 h-1 bg-emerald-200 rounded-lg appearance-none cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section className="space-y-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 shadow-sm"><h3 className="text-sm font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2"><div className="p-1.5 bg-emerald-600 rounded-lg text-white"><Megaphone className="w-4 h-4" /></div>4. Finalização (CTA)</h3><div className="space-y-4 bg-white p-3 rounded-xl border border-emerald-200 shadow-sm"><div><label className="text-xs font-black text-emerald-800 mb-1 block uppercase tracking-tighter">Frase de Chamada (Botão)</label><input type="text" value={config.cta} onChange={(e) => onChange({ cta: e.target.value })} className="w-full p-2.5 border border-emerald-50 rounded-lg text-sm font-black outline-none focus:border-emerald-500" /></div><div className="grid grid-cols-2 gap-2"><div><label className="text-[10px] font-bold text-emerald-400 uppercase mb-1 block">Fundo</label><input type="color" value={config.ctaBgColor || '#B91C1C'} onChange={(e) => onChange({ ctaBgColor: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer" /></div><div><label className="text-[10px] font-bold text-emerald-400 uppercase mb-1 block">Texto</label><input type="color" value={config.ctaTextColor || '#FFFFFF'} onChange={(e) => onChange({ ctaTextColor: e.target.value })} className="w-full h-8 rounded-lg cursor-pointer" /></div></div></div></section>
        <section className="space-y-4 p-4 rounded-2xl bg-rose-50 border border-rose-100 shadow-sm pb-8"><h3 className="text-sm font-black text-rose-900 uppercase tracking-wider flex items-center gap-2"><div className="p-1.5 bg-rose-600 rounded-lg text-white"><Percent className="w-4 h-4" /></div>5. Selos de Oferta</h3>{renderBadgeControls()}</section>
      </div>
    </div>
  );
};

export default EditorControls;
