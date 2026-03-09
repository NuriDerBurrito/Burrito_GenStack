import React, { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Carousel = ({ images, index, onChange }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => onChange((index + 1) % images.length), 7000);
    return () => clearInterval(timer);
  }, [index, images.length, onChange]);

  useEffect(() => {
    if (images.length <= 1) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') onChange((index + 1) % images.length);
      if (e.key === 'ArrowLeft') onChange((index - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [index, images.length, onChange]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-black group" ref={containerRef}>
      <div className="w-full h-full flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${index * 100}%)` }}>
        {images.map((src, i) => (
          <div key={i} className="min-w-full h-full flex items-center justify-center relative">
            <img src={src} className="max-w-full max-h-full object-contain pointer-events-none select-none" onError={(e) => { e.target.style.display = 'none'; }} />
            <img src={src} className="absolute inset-0 w-full h-full object-cover blur-md opacity-20 -z-10" />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onChange((index - 1 + images.length) % images.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-neon-blue hover:text-black transition opacity-0 group-hover:opacity-100 z-20">
            <ChevronLeft size={20}/>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onChange((index + 1) % images.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-neon-blue hover:text-black transition opacity-0 group-hover:opacity-100 z-20">
            <ChevronRight size={20}/>
          </button>
        </>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 z-20 pointer-events-none">
          {images.map((_, idx) => (
            <div key={idx} className={clsx("w-1.5 h-1.5 rounded-full shadow-md transition-all duration-300", idx === index ? "bg-neon-blue w-4" : "bg-white/40")} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
