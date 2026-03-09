import React, { useState } from 'react';
import MainLogo from '../assets/Genstack.png';
import GenesisLogo from '../assets/genesis_logo.png';

const MorphingLogo = ({ className }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={`relative ${className}`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <img src={GenesisLogo} className={`absolute inset-0 w-full h-full object-contain transition-all duration-500 ${isHovered ? 'opacity-0 scale-90 rotate-12' : 'opacity-100 scale-100 rotate-0'}`} alt="Genesis" />
      <img src={MainLogo} className={`absolute inset-0 w-full h-full object-contain transition-all duration-500 ${isHovered ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-90 -rotate-12'}`} alt="GenStack" />
    </div>
  );
};

export default MorphingLogo;
