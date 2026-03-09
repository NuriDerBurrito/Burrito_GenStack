import React from 'react';
import * as LucideIcons from 'lucide-react';

export const CivitaiIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2V7h2v10z"/>
  </svg>
);

export const HuggingFaceIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12h.01M15 12h.01M10 16c.5 1 2 1 2.5 0M2 12l5-5 5 5 5-5 5 5M2 12v5a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5v-5" />
  </svg>
);

export const WebIcon = ({ className }) => <LucideIcons.Globe className={className} />;

export const DynamicIcon = ({ name, size = 16, className }) => {
  const Icon = LucideIcons[name] || LucideIcons.HelpCircle;
  return <Icon size={size} className={className} />;
};
