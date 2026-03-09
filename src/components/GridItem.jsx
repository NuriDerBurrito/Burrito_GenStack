import React, { memo } from 'react';
import { clsx } from 'clsx';
import { Image, CheckSquare } from 'lucide-react';
import TagBadge from './TagBadge';
import { getThumbUrl, isItemVisible } from '../utils/helpers';

const GridItem = memo(({ item, selectedItemId, setSelectedItemId, toggleSelect, db, dragItemTarget, setDragItemTarget, handleItemSortDrop, setCarouselIndex, viewMode, tagFilters }) => {
  const isSelected = selectedItemId === item.id;
  if (!isItemVisible(item, viewMode, tagFilters)) return null;

  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData('itemId', item.id)}
      onDragOver={e => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const newPos = e.clientX < (rect.x + rect.width / 2) ? 'before' : 'after';
        if (dragItemTarget?.id !== item.id || dragItemTarget?.pos !== newPos) {
          setDragItemTarget({ id: item.id, pos: newPos });
        }
      }}
      onDragLeave={() => setDragItemTarget(null)}
      onDrop={e => { e.preventDefault(); handleItemSortDrop(e.dataTransfer.getData('itemId'), item.id, dragItemTarget?.pos); }}
      onClick={() => { setSelectedItemId(item.id); setCarouselIndex(0); }}
      className={clsx(
        "group relative aspect-[2/3] rounded bg-[#0f0f0f]/80 backdrop-blur-sm overflow-hidden cursor-pointer transition-all hover:scale-[1.02] border border-gray-800",
        item.selected ? "border-neon-purple shadow-neon-purple" : isSelected ? "border-neon-blue shadow-neon-blue" : "hover:border-gray-600",
        dragItemTarget?.id === item.id && dragItemTarget.pos === 'before' && "border-l-4 border-l-white",
        dragItemTarget?.id === item.id && dragItemTarget.pos === 'after' && "border-r-4 border-r-white"
      )}
    >
      {item.images?.length > 0 ? (
        <img src={getThumbUrl(item.images[0]) || item.images[0]} onError={(e) => { e.target.src = item.images[0]; }} loading="lazy" draggable="false" className="w-full h-full object-cover pointer-events-none" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-700"><Image size={32}/></div>
      )}

      <div className="absolute top-2 left-2 z-10" onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}>
        <div className={clsx("w-5 h-5 rounded border flex items-center justify-center bg-black/50", item.selected ? "border-neon-purple bg-neon-purple text-white" : "border-gray-500 hover:border-white")}>
          {item.selected && <CheckSquare size={12}/>}
        </div>
      </div>

      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
        {item.tags?.map(tid => { const tag = db.tags.find(t => t.id === tid); return tag ? <TagBadge key={tid} tag={tag} scale={db.settings.tagScale || 1}/> : null; })}
      </div>

      {dragItemTarget?.id === item.id && (
        <div className={clsx("absolute inset-y-0 w-1 bg-white z-50", dragItemTarget.pos === 'before' ? "left-0" : "right-0")} />
      )}

      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black to-transparent pt-8">
        <p className="text-white font-bold text-xs truncate shadow-black drop-shadow-md pr-4">{item.name}</p>
      </div>
    </div>
  );
});

GridItem.displayName = 'GridItem';
export default GridItem;
