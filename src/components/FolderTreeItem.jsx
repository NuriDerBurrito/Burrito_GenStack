import React, { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronRight, ChevronDown, MoreVertical } from 'lucide-react';
import { DynamicIcon } from './CustomIcons';

const FolderTreeItem = ({ folder, allFolders, selectedId, onSelect, onToggleCollapse, onDrop, onContextMenu }) => {
  const childFolders = allFolders.filter(f => f.parentId === folder.id);
  const isSelected = selectedId === folder.id;
  const [dragState, setDragState] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    if (relY < rect.height * 0.25) setDragState('before');
    else if (relY > rect.height * 0.75) setDragState('after');
    else setDragState('inside');
  };

  const handleDrop = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setDragState(null);
    const itemId = e.dataTransfer.getData("itemId");
    const dragFolderId = e.dataTransfer.getData("folderId");
    if (itemId) onDrop('item', itemId, folder.id);
    else if (dragFolderId) onDrop('folder', dragFolderId, folder.id, dragState);
  };

  return (
    <div className="pl-3 relative">
      <div
        draggable
        onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData("folderId", folder.id); }}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragState(null)}
        onDrop={handleDrop}
        onClick={(e) => { e.stopPropagation(); onSelect(folder.id); }}
        className={clsx(
          "group flex items-center justify-between p-1.5 rounded cursor-pointer transition-all mb-0.5 select-none border border-transparent",
          isSelected ? "bg-neon-blue/10 text-neon-blue border-neon-blue/30" : "hover:bg-white/5 text-gray-400",
          dragState === 'before' && "border-t-2 border-t-neon-blue",
          dragState === 'after' && "border-b-2 border-b-neon-blue",
          dragState === 'inside' && "bg-neon-blue text-black border-neon-blue font-bold"
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div onClick={(e) => { e.stopPropagation(); onToggleCollapse(folder.id); }} className="hover:text-white cursor-pointer w-4 text-center">
            {childFolders.length > 0 && (folder.collapsed ? <ChevronRight size={12}/> : <ChevronDown size={12}/>)}
          </div>
          <DynamicIcon name={folder.icon || 'Folder'} size={16} />
          <span className="truncate text-sm font-medium">{folder.name}</span>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onContextMenu(e, folder); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-white transition">
          <MoreVertical size={14}/>
        </button>
      </div>
      {!folder.collapsed && childFolders.map(child => (
        <FolderTreeItem key={child.id} folder={child} allFolders={allFolders} selectedId={selectedId} onSelect={onSelect} onToggleCollapse={onToggleCollapse} onDrop={onDrop} onContextMenu={onContextMenu} />
      ))}
    </div>
  );
};

export default FolderTreeItem;
