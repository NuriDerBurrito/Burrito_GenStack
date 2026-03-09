import React, { useState } from 'react';
import { VALID_ICONS } from '../constants';
import { DynamicIcon } from './CustomIcons';

const IconPicker = ({ onSelect, onClose }) => {
  const [filter, setFilter] = useState('');
  const filtered = VALID_ICONS.filter(i => i.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-10" onClick={onClose}>
      <div
        className="w-[600px] h-[500px] flex flex-col rounded-xl"
        style={{ backgroundColor: '#0a0a0a', border: '1px solid var(--neon-blue)', boxShadow: '0 0 50px rgba(0,243,255,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--divider-color)', backgroundColor: 'rgba(17,24,39,0.5)' }}>
          <h3 className="font-bold uppercase tracking-wider" style={{ color: 'var(--neon-blue)' }}>Select Icon</h3>
          <input
            autoFocus
            placeholder="Search..."
            className="bg-black rounded px-2 py-1 text-sm text-white outline-none"
            style={{ border: '1px solid var(--divider-color)' }}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-6 gap-2 custom-scrollbar">
          {filtered.map(iconName => (
            <button
              key={iconName}
              onClick={() => onSelect(iconName)}
              className="aspect-square flex flex-col items-center justify-center gap-1 rounded border border-gray-800 hover:bg-cyan-400 hover:text-black hover:border-cyan-400 transition group"
            >
              <DynamicIcon name={iconName} size={20} />
              <span className="text-[9px] text-gray-500 group-hover:text-black truncate w-full text-center px-1">{iconName}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IconPicker;
