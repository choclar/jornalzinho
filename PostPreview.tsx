
import React, { forwardRef, useState } from 'react';
import { PostConfig, GridItem, TextTransform, BorderStyle } from '../types';
import { calculatePostDimensions } from '../constants';

interface PostPreviewProps {
  config: PostConfig;
  scale?: number;
  suggestedBackground?: string | null;
  onTransformChange?: (transform: { x: number; y: number; scale: number }) => void;
  onLogoTransformChange?: (transform: { x: number; y: number; scale: number; rotation: number }) => void;
  onGridTransformChange?: (index: number, transform: { x: number; y: number; scale: number }) => void;
  onHeaderTransformChange?: (transform: { x: number; y: number; scale: number }) => void;
  onTextTransformChange?: (type: 'brand' | 'tagline', transform: TextTransform) => void;
}

const PostPreview = forwardRef<HTMLDivElement, PostPreviewProps>(({ 
  config, 
  scale = 1, 
  suggestedBackground,
  onTransformChange, 
  onLogoTransformChange, 
  onGridTransformChange,
  onHeaderTransformChange,
  onTextTransformChange
}, ref) => {
  const { 
    layout, colors, cta, brandName, brandColor, brandOpacity = 1,
    taglineText, logo, logoTransform, logoOpacity = 1,
    gridItems, selectedGridIndex, backgroundImage, gridRows, gridCols, headerBackground,
    brandTransform, taglineTransform, headerBackgroundTransform,
    discountBadgeColor = '#FFFFFF',
    discountBadgeBgColor = '#DC2626',
    discountBadgeOpacity = 1,
    discountBadgeScale = 1.0,
    taglineColor, taglineBgColor, taglineOpacity,
    ctaBgColor, ctaTextColor, ctaFontSize, ctaBgImage, ctaOpacity, ctaBgTransform,
    footerAddress, footerDisclaimer, footerInfoColor
  } = config;
  
  const brandYellow = '#FFD700'; 
  const brandBlue = '#00BFFF';   
  const brandPink = '#FF69B4';   
  const brandRed = '#FF4500';
  const brandChoco = '#3E2723';
  
  const { accent: accentColor = colors.accent } = colors;
  const { width: POST_WIDTH, height: POST_HEIGHT } = calculatePostDimensions(config);
  const [dragTarget, setDragTarget] = useState<'logo' | 'brand' | 'tagline' | 'header' | 'ctaBg' | { type: 'grid', index: number } | null>(null);
  const activeBackground = suggestedBackground || backgroundImage;

  const handlePointerDown = (e: React.PointerEvent, target: 'logo' | 'brand' | 'tagline' | 'header' | 'ctaBg' | { type: 'grid', index: number }) => {
    e.preventDefault();
    e.stopPropagation();
    setDragTarget(target);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setDragTarget(null);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragTarget) return;
    const deltaX = e.movementX / scale;
    const deltaY = e.movementY / scale;

    if (dragTarget === 'logo' && onLogoTransformChange) {
        onLogoTransformChange({ ...logoTransform, x: logoTransform.x + deltaX, y: logoTransform.y + deltaY });
    } else if (dragTarget === 'brand' && onTextTransformChange) {
        onTextTransformChange('brand', { ...brandTransform, x: brandTransform.x + deltaX, y: brandTransform.y + deltaY });
    } else if (dragTarget === 'tagline' && onTextTransformChange) {
        onTextTransformChange('tagline', { ...taglineTransform, x: taglineTransform.x + deltaX, y: taglineTransform.y + deltaY });
    } else if (dragTarget === 'header' && onHeaderTransformChange && headerBackgroundTransform) {
        onHeaderTransformChange({ ...headerBackgroundTransform, x: headerBackgroundTransform.x + deltaX, y: headerBackgroundTransform.y + deltaY });
    } else if (dragTarget === 'ctaBg') {
        // Implement CTA Bg drag if needed
    } else if (typeof dragTarget === 'object' && dragTarget.type === 'grid' && onGridTransformChange) {
        const item = gridItems[dragTarget.index];
        onGridTransformChange(dragTarget.index, { ...item.imageTransform, x: item.imageTransform.x + deltaX, y: item.imageTransform.y + deltaY });
    }
  };

  const handleWheel = (e: React.WheelEvent, target: 'logo' | 'brand' | 'tagline' | 'header' | 'ctaBg' | { type: 'grid', index: number }) => {
    e.stopPropagation();
    const zoomSensitivity = 0.001;
    const zoomDelta = -e.deltaY * zoomSensitivity;

    if (target === 'logo' && onLogoTransformChange) {
        if (e.shiftKey) {
            const rotationDelta = e.deltaY > 0 ? 5 : -5;
            onLogoTransformChange({ ...logoTransform, rotation: (logoTransform.rotation || 0) + rotationDelta });
        } else {
            onLogoTransformChange({ ...logoTransform, scale: Math.min(Math.max(0.05, logoTransform.scale + zoomDelta), 2.0) });
        }
    } else if (target === 'brand' && onTextTransformChange) {
        if (e.shiftKey) {
             const rotationDelta = e.deltaY > 0 ? 5 : -5;
             onTextTransformChange('brand', { ...brandTransform, rotation: (brandTransform.rotation || 0) + rotationDelta });
        } else {
             onTextTransformChange('brand', { ...brandTransform, scale: Math.min(Math.max(0.1, brandTransform.scale + zoomDelta), 5) });
        }
    } else if (target === 'tagline' && onTextTransformChange) {
        if (e.shiftKey) {
             const rotationDelta = e.deltaY > 0 ? 5 : -5;
             onTextTransformChange('tagline', { ...taglineTransform, rotation: (taglineTransform.rotation || 0) + rotationDelta });
        } else {
             onTextTransformChange('tagline', { ...taglineTransform, scale: Math.min(Math.max(0.1, taglineTransform.scale + zoomDelta), 5) });
        }
    } else if (target === 'header' && onHeaderTransformChange && headerBackgroundTransform) {
        onHeaderTransformChange({ ...headerBackgroundTransform, scale: Math.min(Math.max(0.1, headerBackgroundTransform.scale + zoomDelta), 10) }); 
    } else if (typeof target === 'object' && target.type === 'grid' && onGridTransformChange) {
        const item = gridItems[target.index];
        onGridTransformChange(target.index, { ...item.imageTransform, scale: Math.min(Math.max(0.1, item.imageTransform.scale + zoomDelta), 5) });
    }
  };

  const renderDraggableText = (type: 'brand' | 'tagline', text: string, transform: TextTransform, baseClassName: string, style: React.CSSProperties = {}) => {
      if (!text) return null;
      const isDragging = dragTarget === type;
      let finalStyle = { ...style };
      if (type === 'tagline') {
          if (taglineColor) finalStyle.color = taglineColor;
          if (taglineBgColor) finalStyle.backgroundColor = taglineBgColor;
          if (taglineOpacity !== undefined) finalStyle.opacity = taglineOpacity;
      } else if (type === 'brand') {
          if (brandColor) finalStyle.color = brandColor;
          if (brandOpacity !== undefined) finalStyle.opacity = brandOpacity;
      }

      return (
          <div
            className={`cursor-move touch-none inline-block relative pointer-events-auto ${isDragging ? 'z-50' : 'z-30'}`}
            style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale}) rotate(${transform.rotation || 0}deg)`, transformOrigin: 'center center' }}
            onPointerDown={(e) => handlePointerDown(e, type)}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
            onWheel={(e) => handleWheel(e, type)}
          >
              <div className={`${baseClassName} ${isDragging ? 'ring-2 ring-blue-400 ring-offset-2 rounded' : ''} select-none`} style={finalStyle}>
                  {text}
              </div>
          </div>
      );
  };

  const renderDraggableLogo = () => {
    if (!logo) return null;
    const rotation = logoTransform.rotation || 0;
    const defaultTop = '12%'; 
    return (
        <div className="absolute z-[100] cursor-move group touch-none pointer-events-auto" style={{ left: '50%', top: defaultTop, transform: `translate(-50%, -50%) translate(${logoTransform.x}px, ${logoTransform.y}px) rotate(${rotation}deg)` }} onPointerDown={(e) => handlePointerDown(e, 'logo')} onPointerUp={handlePointerUp} onPointerMove={handlePointerMove} onWheel={(e) => handleWheel(e, 'logo')}>
            <div className={`relative ${dragTarget === 'logo' ? 'ring-2 ring-blue-400' : ''}`}>
                 <img src={logo} className="object-contain pointer-events-none drop-shadow-xl" style={{ height: '200px', transform: `scale(${logoTransform.scale})`, opacity: logoOpacity }} />
            </div>
        </div>
    );
  };

  const renderWithBorder = (children: React.ReactNode, style: BorderStyle, roundedClass = 'rounded-xl') => {
      if (!style || style === 'none') return <div className={`relative w-full h-full ${roundedClass} overflow-hidden`}>{children}</div>;
      let wrapperClass = `relative w-full h-full ${roundedClass}`;
      let innerClass = `w-full h-full ${roundedClass} overflow-hidden bg-white`;
      if (style === 'gradient-hot') wrapperClass += ` p-[4px] bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500`;
      else if (style === 'gradient-cool') wrapperClass += ` p-[4px] bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600`;
      else if (style === 'neon-blue') wrapperClass += ` border-[4px] border-cyan-400 shadow-[0_0_0_4px_#FFF]`;
      else if (style === 'neon-pink') wrapperClass += ` border-[4px] border-pink-500 shadow-[0_0_0_4px_#FFF]`;
      else if (style === 'gold-elegant') wrapperClass += ` border-[6px] border-yellow-400 border-dashed`;
      else if (style === 'dashed-red') wrapperClass += ` border-[4px] border-dashed border-red-500`;
      else if (style === 'double-black') wrapperClass += ` border-[6px] border-double border-gray-900`;
      return <div className={wrapperClass}><div className={innerClass}>{children}</div></div>;
  };

  const parsePrice = (priceStr: string) => {
    if (!priceStr) return 0;
    const cleanStr = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };

  const renderGridBlock = (item: GridItem, index: number) => {
      const isSelected = selectedGridIndex === index;
      const borderStyle = item.borderStyle || 'none';
      const hasDiscount = item.originalPrice && item.originalPrice.trim() !== '';
      const nameSize = item.nameFontSize || 32;
      const detailsSize = item.detailsFontSize || 16;
      const priceSize = item.priceFontSize || 56;
      const originalPriceSize = item.originalPriceFontSize || 12;
      const priceValue = item.price.replace('R$', '').trim();
      const [priceInteger, priceDecimal] = priceValue.split(',');
      const cleanOriginalPrice = item.originalPrice ? item.originalPrice.replace(/^(de|DE|De)\s*/i, '').trim() : '';
      
      let discountPercentage = 0;
      if (hasDiscount) {
          const original = parsePrice(cleanOriginalPrice);
          const current = parsePrice(item.price);
          if (original > 0 && current > 0 && original > current) {
              discountPercentage = Math.round(((original - current) / original) * 100);
          }
      }

      const CustomBadge = discountPercentage > 0 ? (
          <div className="absolute top-2 right-2 rounded-full flex flex-col items-center justify-center shadow-lg z-30" style={{ width: `${70 * discountBadgeScale}px`, height: `${70 * discountBadgeScale}px`, backgroundColor: discountBadgeBgColor, color: discountBadgeColor, opacity: discountBadgeOpacity, transform: 'rotate(10deg)' }}>
              <span className="font-black leading-none" style={{ fontSize: `${28 * discountBadgeScale}px` }}>-{discountPercentage}%</span>
              <span className="text-[10px] font-bold uppercase leading-none" style={{ fontSize: `${10 * discountBadgeScale}px` }}>OFF</span>
          </div>
      ) : null;

      const ImageComponent = (
        <div className="w-full h-full relative cursor-move touch-none" onPointerDown={(e) => handlePointerDown(e, { type: 'grid', index })} onPointerUp={handlePointerUp} onPointerMove={handlePointerMove} onWheel={(e) => handleWheel(e, { type: 'grid', index })}>
            {item.image ? (
                <>
                    <img src={item.image} className={`w-full h-full object-contain origin-center pointer-events-none ${item.hasShadow ? 'drop-shadow-[4px_12px_16px_rgba(0,0,0,0.25)]' : 'drop-shadow-sm'}`} style={{ transform: `translate(${item.imageTransform.x}px, ${item.imageTransform.y}px) scale(${item.imageTransform.scale})` }} />
                    {CustomBadge}
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 text-xs italic">Sem foto</div>
            )}
        </div>
      );

      const productNameClasses = "font-black leading-tight uppercase tracking-tight break-words whitespace-normal px-1 w-full text-center";
      const productDetailsClasses = "font-bold text-gray-500 uppercase leading-tight mt-1 block break-words whitespace-normal px-1 w-full text-center";

      if (layout === 'layout-1') {
        return (
            <div key={index} className={`relative flex flex-col bg-white rounded-xl overflow-visible shadow-lg transition-all ${isSelected ? 'scale-[1.02] z-20 ring-4 ring-blue-500' : ''}`} style={{ height: '100%' }}>
                {renderWithBorder((
                    <div className="flex flex-col h-full relative bg-white overflow-hidden rounded-xl">
                        <div className="flex-1 min-h-0 w-full overflow-hidden relative p-1">{ImageComponent}</div>
                        <div className="flex-shrink-0 flex flex-col justify-end relative z-10 p-1">
                            <div className="bg-white text-center mb-2">
                                <h4 className={productNameClasses} style={{ fontSize: `${nameSize}px` }}>{item.productName}</h4>
                                {item.productDetails && <span className={productDetailsClasses} style={{ fontSize: `${detailsSize}px` }}>{item.productDetails}</span>}
                            </div>
                            <div className="w-full py-2 px-1 flex flex-col items-center justify-center relative rounded-lg" style={{ backgroundColor: accentColor }}>
                                {hasDiscount && <div className="absolute top-0.5 left-2 bg-black/20 px-1.5 rounded text-white/90 line-through font-bold whitespace-nowrap origin-left" style={{ fontSize: `${originalPriceSize}px`, transform: `scale(${config.discountBadgeScale || 1})` }}>DE {cleanOriginalPrice}</div>}
                                <div className="flex items-baseline justify-center text-white leading-none mt-1"><span className="font-black mr-1 self-start" style={{ fontSize: `${Math.max(12, priceSize * 0.3)}px`, marginTop: '0.2em' }}>R$</span><span className="font-black tracking-tighter" style={{ fontSize: `${priceSize}px` }}>{priceValue}</span></div>
                            </div>
                        </div>
                    </div>
                ), borderStyle, 'rounded-xl')}
            </div>
        );
      }
      
      if (layout === 'layout-2') {
         return (
             <div key={index} className={`relative flex flex-col bg-white rounded-2xl overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,0.2)] transition-all ${isSelected ? 'scale-[1.02] z-20 ring-4 ring-blue-500' : ''}`} style={{ height: '100%' }}>
                 {renderWithBorder((
                     <div className="flex flex-col h-full relative bg-white">
                        <div className="bg-white p-2 text-center border-b-2 border-gray-100 z-10">
                            <h4 className={`text-blue-500 ${productNameClasses}`} style={{ fontSize: `${nameSize}px` }}>{item.productName}</h4>
                            {item.productDetails && <span className={`text-pink-500 ${productDetailsClasses}`} style={{ fontSize: `${detailsSize}px` }}>{item.productDetails}</span>}
                        </div>
                        <div className="flex-1 min-h-0 w-full overflow-hidden relative p-2">{ImageComponent}</div>
                        <div className="bg-yellow-400 p-1 flex flex-col items-center justify-end relative h-auto min-h-[60px]">
                            <div className="flex items-end justify-center w-full">
                                <div className="flex flex-col items-end mr-1 leading-none">{hasDiscount && <div className="text-red-800/80 line-through font-bold mb-0.5 whitespace-nowrap" style={{ fontSize: `${originalPriceSize}px` }}>DE {cleanOriginalPrice}</div>}<span className="font-bold text-red-600 text-sm mb-1">R$</span></div>
                                <span className="font-black text-red-600 tracking-tighter leading-none" style={{ fontSize: `${priceSize}px`, textShadow: '2px 2px 0 #FFF' }}>{priceValue}</span>
                            </div>
                        </div>
                     </div>
                 ), borderStyle, 'rounded-2xl')}
             </div>
         );
      }
      
      if (layout === 'layout-6') {
          return (
              <div key={index} className={`relative flex flex-col bg-white border-4 border-red-600 rounded-xl overflow-hidden shadow-xl transition-all ${isSelected ? 'scale-[1.02] z-20 ring-4 ring-blue-500' : ''}`} style={{ height: '100%' }}>
                  <div className="bg-red-600 text-white text-center py-1 origin-center" style={{ transform: `scaleY(${config.discountBadgeScale || 1})` }}><h4 className="font-black uppercase tracking-widest" style={{ fontSize: `${Math.max(10, 10 * (config.discountBadgeScale || 1))}px` }}>OFERTA</h4></div>
                  <div className="flex-1 p-1 relative min-h-0">{ImageComponent}</div>
                  <div className="bg-yellow-300 p-2 text-center border-t-4 border-red-600 flex flex-col items-center">
                      <h4 className={`text-red-600 leading-[1.1] mb-1 ${productNameClasses}`} style={{ fontSize: `${nameSize}px` }}>{item.productName}</h4>
                      {item.productDetails && <span className={`text-red-800 leading-tight mb-1 ${productDetailsClasses}`} style={{ fontSize: `${detailsSize}px` }}>{item.productDetails}</span>}
                      <div className="flex flex-col items-center justify-center">
                          {hasDiscount && <span className="font-black text-red-800 line-through opacity-80 mb-0.5" style={{ fontSize: `${originalPriceSize}px` }}>De {cleanOriginalPrice}</span>}
                          <div className="text-black font-black leading-none transform -skew-x-6"><span className="mr-1" style={{ fontSize: `${priceSize * 0.3}px` }}>R$</span><span style={{ fontSize: `${priceSize}px` }}>{priceValue}</span></div>
                      </div>
                  </div>
              </div>
          );
      }
      
      return (
          <div key={index} className={`relative flex flex-col bg-white rounded-xl overflow-hidden shadow-md border border-gray-100 transition-all ${isSelected ? 'scale-[1.02] z-20 ring-4 ring-blue-500' : ''}`} style={{ height: '100%' }}>
              <div className="flex-1 min-h-0 p-2">{ImageComponent}</div>
              <div className="p-3 text-center bg-gray-50/50">
                  <h4 className={productNameClasses} style={{ fontSize: `${nameSize}px`, color: colors.primary }}>{item.productName}</h4>
                  {item.productDetails && <span className={productDetailsClasses} style={{ fontSize: `${detailsSize}px` }}>{item.productDetails}</span>}
                  <div className="mt-2 flex flex-col items-center">
                      {hasDiscount && <span className="line-through text-red-400 font-bold" style={{ fontSize: `${originalPriceSize}px` }}>{item.originalPrice}</span>}
                      <div className="font-black flex items-center" style={{ color: colors.accent }}>
                          <span className="mr-1" style={{ fontSize: `${priceSize * 0.3}px` }}>R$</span>
                          <span style={{ fontSize: `${priceSize}px` }}>{priceValue}</span>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  const totalItemsToShow = gridRows * gridCols;
  const items = gridItems.slice(0, totalItemsToShow);
  const gridGap = totalItemsToShow > 9 ? 'gap-2' : 'gap-4';
  const gridPadding = totalItemsToShow > 9 ? 'py-2 px-4' : 'py-4 px-6';
  
  let bgStyle: React.CSSProperties = { backgroundColor: '#FFFFFF' };
  if (layout === 'layout-2') bgStyle = { backgroundColor: brandYellow };
  else if (layout === 'layout-3') bgStyle = { backgroundColor: brandPink };
  else if (layout === 'layout-4') bgStyle = { backgroundColor: brandBlue };
  else if (layout === 'layout-5') bgStyle = { backgroundColor: brandChoco };
  else if (layout === 'layout-6') bgStyle = { backgroundColor: '#FF4500' };

  const footerStyle: React.CSSProperties = {
      backgroundColor: ctaBgColor || '#B91C1C',
      opacity: ctaOpacity,
      position: 'relative',
      overflow: 'hidden'
  };

  return (
    <div id="post-preview-container" ref={ref} className="w-full relative flex flex-col" style={{ width: POST_WIDTH, height: POST_HEIGHT, minHeight: POST_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left', ...bgStyle }}>
            {activeBackground && <img src={activeBackground} className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-50 mix-blend-overlay" />}
            
            <div className="w-full h-[400px] relative z-20 flex items-center justify-center overflow-hidden shadow-2xl flex-shrink-0">
                {headerBackground && (
                    <div className="absolute inset-0 w-full h-full overflow-hidden cursor-move group pointer-events-auto" onPointerDown={(e) => handlePointerDown(e, 'header')} onPointerUp={handlePointerUp} onPointerMove={handlePointerMove} onWheel={(e) => handleWheel(e, 'header')}>
                        <img src={headerBackground} className="w-full h-full object-contain origin-center pointer-events-none" style={{ transform: `translate(${headerBackgroundTransform?.x || 0}px, ${headerBackgroundTransform?.y || 0}px) scale(${headerBackgroundTransform?.scale || 1})` }} />
                    </div>
                )}
                <div className="relative z-30 text-center p-4 w-full h-full flex flex-col items-center justify-center pointer-events-none">
                    {brandName && brandName.trim() !== '' && renderDraggableText('brand', brandName, brandTransform, "text-8xl font-black italic drop-shadow-xl pointer-events-none")}
                    {taglineText && taglineText.trim() !== '' && renderDraggableText('tagline', taglineText, taglineTransform, "mt-4 px-12 py-3 rounded-full shadow-lg pointer-events-none uppercase font-black text-4xl transform -skew-x-12")}
                </div>
            </div>

            <div className="w-full relative z-10 flex flex-col flex-1 min-h-0">
                <div className={`flex-1 grid ${gridGap} ${gridPadding}`} style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gridTemplateRows: `repeat(${gridRows}, 1fr)` }}>
                    {items.map((item, i) => renderGridBlock(item, i))}
                </div>
                
                <div className="h-auto min-h-[200px] mt-auto relative z-20 overflow-hidden flex flex-col justify-between flex-shrink-0" style={footerStyle}>
                    {ctaBgImage && (
                        <div className="absolute inset-0 w-full h-full pointer-events-none">
                            <img src={ctaBgImage} className="w-full h-full object-cover origin-center" style={{ transform: `scale(${ctaBgTransform?.scale || 1}) translate(${ctaBgTransform?.x || 0}px, ${ctaBgTransform?.y || 0}px)` }} />
                        </div>
                    )}
                    <div className="flex-1 relative z-10 w-full flex items-center justify-center p-2">
                        <h2 className="font-black uppercase text-center leading-none" style={{ color: ctaTextColor || '#FFFFFF', fontSize: `${ctaFontSize || 36}px`, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>{cta}</h2>
                    </div>
                    <div className="relative z-10 w-full px-4 pb-4 pt-1 text-center flex flex-col items-center justify-center gap-1" style={{ color: footerInfoColor || ctaTextColor || '#FFFFFF' }}>
                        {footerAddress && <p className="font-bold uppercase text-[12px] leading-tight opacity-90 whitespace-pre-line">{footerAddress}</p>}
                        {footerDisclaimer && <p className="text-[10px] leading-tight opacity-80 whitespace-pre-line max-w-[90%]">{footerDisclaimer}</p>}
                    </div>
                </div>
            </div>
            {renderDraggableLogo()}
    </div>
  );
});

PostPreview.displayName = 'PostPreview';
export default PostPreview;
