import React from 'react';
import { DynamicIcon } from './CustomIcons';

const TagBadge = ({ tag, scale = 1 }) => (
  <div
    className="rounded-full flex items-center justify-center text-black font-bold shadow-lg border border-white/20 group-hover:scale-110 transition"
    style={{ background: tag.color, width: `${20 * scale}px`, height: `${20 * scale}px` }}
    title={tag.label}
  >
    {tag.icon ? <DynamicIcon name={tag.icon} size={10 * scale} /> : <span style={{fontSize: `${9 * scale}px`}}>{tag.label[0]}</span>}
  </div>
);

export default TagBadge;
