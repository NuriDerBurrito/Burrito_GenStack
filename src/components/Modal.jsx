import React, { useRef } from 'react';
import { Layers } from 'lucide-react';

const Modal = ({ isOpen, title, onClose, onSubmit, children, width = "w-96" }) => {
  const mouseDownRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      mouseDownRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    } else {
      mouseDownRef.current = null;
    }
  };

  const handleMouseUp = (e) => {
    if (mouseDownRef.current && e.target === e.currentTarget) {
      const dx = Math.abs(e.clientX - mouseDownRef.current.x);
      const dy = Math.abs(e.clientY - mouseDownRef.current.y);
      const dt = Date.now() - mouseDownRef.current.time;
      if (dx < 5 && dy < 5 && dt < 500) onClose();
    }
    mouseDownRef.current = null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200]" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
      <div
        className={`p-6 rounded-xl shadow-2xl ${width} animate-in fade-in zoom-in duration-200`}
        style={{ backgroundColor: '#0a0a0a', border: '1px solid var(--neon-blue)', boxShadow: '0 0 30px rgba(0,243,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--divider-color)' }}>
          <Layers style={{ color: 'var(--neon-blue)' }} size={20}/> {title}
        </h2>
        {children}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t" style={{ borderColor: 'var(--divider-color)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded text-gray-400 hover:text-white font-bold uppercase text-xs">Cancel</button>
          {onSubmit && (
            <button onClick={onSubmit} className="px-4 py-2 rounded text-black font-bold hover:bg-white transition uppercase text-xs" style={{ backgroundColor: 'var(--neon-blue)' }}>
              Confirm
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
