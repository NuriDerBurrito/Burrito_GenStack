import React, { useState, useEffect, useRef, memo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { clsx } from 'clsx';
import {
  Eye, Settings2, ScanEye, Image, CheckSquare, Tag, ZoomIn, Settings,
  Minus, Square, X, Plus, Archive, ChevronDown, MousePointer2,
  DownloadCloud, ExternalLink, LayoutList, Trash2, MoreHorizontal
} from 'lucide-react';

import {
  Modal, IconPicker, TagBadge, Carousel, FolderTreeItem, GridItem,
  MorphingLogo, CivitaiIcon, HuggingFaceIcon
} from './components';

import { VIEW_MODES, DEFAULT_TEMPLATES, DEFAULT_DB, SORT_MODES, SORT_LABELS } from './constants';
import { detectSource, generateExportText, getViewModeLabel, filterItems, applyThemeColors, parseSmartPaste, getSmartPastePlaceholder, sortItems, isNewestFirst } from './utils/helpers';

import MainLogo from './assets/Genstack.png';
import GenesisLogo from './assets/genesis_logo.png';
import GithubLogo from './assets/github.png';
import HuggingfaceLogo from './assets/huggingface.png';
import GutsLogo from './assets/guts.png';
import DiscordLogo from './assets/discord.png';
import KofiLogo from './assets/ko-fi.png';
import PaypalLogo from './assets/paypal.png';
import DuskLogo from './assets/dusk.jpeg';

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState('Init');
  const [db, setDb] = useState(DEFAULT_DB);

  const [selectedFolderId, setSelectedFolderId] = useState('root');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [showExportDrawer, setShowExportDrawer] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [modal, setModal] = useState({ type: null });
  const [iconPickerTarget, setIconPickerTarget] = useState(null);

  const [folderInput, setFolderInput] = useState({});
  const [tagInput, setTagInput] = useState({});
  const [settingsInput, setSettingsInput] = useState({});
  const [entryInput, setEntryInput] = useState({});

  const [zoomLevel, setZoomLevel] = useState(4);
  const [dragItemTarget, setDragItemTarget] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const [viewMode, setViewMode] = useState(VIEW_MODES.ALL);
  const [sortMode, setSortMode] = useState(SORT_MODES.OLDEST_FIRST);
  const [tagFilters, setTagFilters] = useState({ highlighted: [], excluded: [] });
  const [showViewSettings, setShowViewSettings] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  const viewSettingsRef = useRef(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    applyThemeColors(db.settings.colors);
  }, [db.settings.colors]);

  useEffect(() => {
    window.api.loadDB().then(data => {
      const safeData = {
        folders: Array.isArray(data?.folders) ? data.folders : [],
        items: Array.isArray(data?.items) ? data.items : [],
        tags: Array.isArray(data?.tags) ? data.tags : [],
        settings: { ...DEFAULT_DB.settings, ...data?.settings }
      };
      if (!safeData.folders.find(f => f.id === 'root')) {
        safeData.folders.push({ id: 'root', name: 'Unsorted', icon: 'Archive', parentId: null });
      }
      setDb(safeData);
      setZoomLevel(safeData.settings.zoom);
      setViewMode(safeData.settings.defaultViewMode || VIEW_MODES.ALL);
      setSortMode(safeData.settings.defaultSortMode || SORT_MODES.OLDEST_FIRST);
      setLoaded(true);
      setStatus('Ready');
      setTimeout(() => setSplashVisible(false), 500);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (isFirstRun.current) { isFirstRun.current = false; return; }
    setStatus('Unsaved Changes*');
    window.api.sendUnsavedState(true);
  }, [db, zoomLevel]);

  useEffect(() => {
    const handleKeyDown = async (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setStatus('Saving...');
        const success = await window.api.saveDB({
          ...db,
          settings: { ...db.settings, zoom: zoomLevel, defaultViewMode: viewMode }
        });
        setStatus(success ? 'Saved' : 'Save Failed!');
        if (success) window.api.sendUnsavedState(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [db, zoomLevel, viewMode]);

  useEffect(() => {
    const handlePromptUnsaved = () => setPendingClose(true);
    window.api.onPromptUnsaved(handlePromptUnsaved);
    return () => window.api.removeListener('prompt-unsaved', handlePromptUnsaved);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (showViewSettings && viewSettingsRef.current && !viewSettingsRef.current.contains(e.target)) {
        setShowViewSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showViewSettings]);

  const handleDrop = (type, dragId, targetId, position) => {
    if (type === 'folder') {
      if (dragId === targetId) return;
      setDb(prev => {
        const folders = [...prev.folders];
        const dragIndex = folders.findIndex(f => f.id === dragId);
        const dragItem = folders[dragIndex];
        const targetItem = folders.find(f => f.id === targetId);
        folders.splice(dragIndex, 1);
        if (position === 'inside') {
          dragItem.parentId = targetId;
          folders.push(dragItem);
        } else {
          dragItem.parentId = targetItem.parentId;
          const idx = folders.findIndex(f => f.id === targetId);
          folders.splice(position === 'before' ? idx : idx + 1, 0, dragItem);
        }
        return { ...prev, folders };
      });
    } else if (type === 'item') {
      setDb(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === dragId ? { ...i, folderId: targetId } : i)
      }));
    }
  };

  const handleItemSortDrop = (dragId, targetId, position) => {
    if (dragId === targetId) return;
    setDb(prev => {
      const items = [...prev.items];
      const dragIdx = items.findIndex(i => i.id === dragId);
      const item = items[dragIdx];
      items.splice(dragIdx, 1);
      const targetIdx = items.findIndex(i => i.id === targetId);
      let insertAt = targetIdx;
      if (dragIdx < targetIdx) insertAt--;
      if (position === 'after') insertAt++;
      items.splice(insertAt, 0, item);
      return { ...prev, items };
    });
    setDragItemTarget(null);
  };

  const updateItem = (id, field, val) => {
    setDb(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, [field]: val } : i)
    }));
  };

  const addImageToItem = (id, url) => {
    setDb(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, images: [...(i.images || []), url], image: url } : i)
    }));
  };

  const toggleSelect = (id) => {
    setDb(prev => ({
      ...prev,
      items: prev.items.map(i => i.id === id ? { ...i, selected: !i.selected } : i)
    }));
  };

  const fetchCivitaiImages = async (itemId, url) => {
    setStatus('Fetching Civitai...');
    const result = await window.api.fetchCivitai(url, db.settings.apiKey);
    if (result.success && result.images?.length > 0) {
      setDb(prev => ({
        ...prev,
        items: prev.items.map(i => i.id === itemId ? {
          ...i, images: [...(i.images || []), ...result.images], image: result.images[0]
        } : i)
      }));
      setStatus('Fetched successfully!');
    } else {
      setStatus(`Fetch Failed: ${result.error || 'Unknown'}`);
    }
    setTimeout(() => setStatus('Ready'), 3000);
  };

  const scanMissingImages = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setStatus('Starting Scan...');
    const missing = db.items.filter(i =>
      (!i.images || i.images.length === 0) && i.civitaiUrl?.includes('civitai.com')
    );
    if (missing.length === 0) {
      setStatus('No missing images found.');
      setIsScanning(false);
      return;
    }
    for (let i = 0; i < missing.length; i++) {
      setStatus(`Scanning ${i + 1}/${missing.length}: ${missing[i].name}`);
      const result = await window.api.fetchCivitai(missing[i].civitaiUrl, db.settings.apiKey);
      if (result.success && result.images?.length > 0) {
        setDb(prev => ({
          ...prev,
          items: prev.items.map(it => it.id === missing[i].id ? {
            ...it, images: result.images, image: result.images[0]
          } : it)
        }));
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    setStatus('Scan Complete');
    setIsScanning(false);
  };

  const handleIconSelect = (iconName) => {
    if (modal.type === 'FOLDER' || modal.type === 'RENAME') {
      setFolderInput(prev => ({ ...prev, icon: iconName }));
    } else if (modal.type === 'TAG' || modal.type === 'EDIT_TAG') {
      setTagInput(prev => ({ ...prev, icon: iconName }));
    } else if (iconPickerTarget?.type === 'folder-direct') {
      setDb(prev => ({
        ...prev,
        folders: prev.folders.map(f => f.id === iconPickerTarget.id ? { ...f, icon: iconName } : f)
      }));
    } else if (iconPickerTarget?.type === 'tag-direct') {
      setDb(prev => ({
        ...prev,
        tags: prev.tags.map(t => t.id === iconPickerTarget.id ? { ...t, icon: iconName } : t)
      }));
    }
    setIconPickerTarget(null);
  };

  const toggleTagFilter = (tagId, type) => {
    setTagFilters(prev => {
      const list = prev[type];
      if (list.includes(tagId)) {
        return { ...prev, [type]: list.filter(id => id !== tagId) };
      }
      const otherType = type === 'highlighted' ? 'excluded' : 'highlighted';
      return {
        ...prev,
        [type]: [...list, tagId],
        [otherType]: prev[otherType].filter(id => id !== tagId)
      };
    });
  };

  const currentItems = sortItems(filterItems(selectedFolderId, db.folders, db.items, ''), sortMode);
  const selectedItem = db.items.find(i => i.id === selectedItemId);
  const checkedItems = db.items.filter(i => i.selected);
  const sourceInView = selectedItem ? detectSource(selectedItem.civitaiUrl) : 'none';

  return (
    <>
      {splashVisible && (
        <div className={clsx(
          "fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center transition-opacity duration-500",
          loaded && "opacity-0 pointer-events-none"
        )}>
          <div className="splash-logo-animate text-neon-blue flex flex-col items-center gap-4">
            <img src={MainLogo} className="w-24 h-24 object-contain splash-logo-animate" alt="Logo" />
            <h1 className="text-2xl font-bold tracking-[0.3em] uppercase text-white">BURRITO GENSTACK</h1>
          </div>
        </div>
      )}

      <div
        className="flex h-screen text-gray-200 font-sans overflow-hidden transition-colors duration-500"
        style={{ background: `radial-gradient(circle at 50% 30%, ${db.settings.colors?.bg || '#1a1a1a'}, #050505)` }}
        onPaste={async (e) => {
          if (!selectedItemId || ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
          for (const item of e.clipboardData.items) {
            if (item.type.includes("image")) {
              const file = item.getAsFile();
              const buffer = await file.arrayBuffer();
              const savedPath = await window.api.saveImportedImage(buffer);
              if (savedPath) addImageToItem(selectedItemId, savedPath);
            }
          }
        }}
      >
        <div className="absolute top-0 w-full h-10 bg-black/60 backdrop-blur z-50 flex items-center justify-between px-4 border-b border-neon-divider drag-region">
          <div className="flex items-center gap-3">
            <img src={MainLogo} className="h-6 w-6 object-contain" alt="Logo" />
            <h1 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple italic">BURRITO GENSTACK</h1>
            <span className="text-xs text-gray-600 border-l border-neon-divider pl-3 no-drag-region font-mono status-marquee">
              <span className="status-marquee-inner">{status}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 no-drag-region">
            <div className="relative flex items-center" ref={viewSettingsRef}>
              <button
                onClick={() => {
                  const modes = [VIEW_MODES.ALL, VIEW_MODES.SELECTED, VIEW_MODES.NON_SELECTED];
                  setViewMode(modes[(modes.indexOf(viewMode) + 1) % modes.length]);
                }}
                className={clsx(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase transition border",
                  viewMode === VIEW_MODES.ALL ? "text-gray-400 border-gray-700" :
                  viewMode === VIEW_MODES.SELECTED ? "text-neon-purple border-neon-purple" :
                  "text-yellow-400 border-yellow-400"
                )}
              >
                <Eye size={14} />
                {getViewModeLabel(viewMode)}
              </button>
              <button
                onClick={() => setShowViewSettings(!showViewSettings)}
                className="ml-1 p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition"
              >
                <Settings2 size={12} />
              </button>

              {showViewSettings && (
                <div className="absolute top-full left-0 mt-1 bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 w-64 z-[100] shadow-xl">
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Set as Default View</p>
                  <div className="space-y-1">
                    {[VIEW_MODES.ALL, VIEW_MODES.SELECTED, VIEW_MODES.NON_SELECTED].map(mode => (
                      <button
                        key={mode}
                        onClick={() => {
                          setDb(prev => ({ ...prev, settings: { ...prev.settings, defaultViewMode: mode } }));
                          setStatus(`Default view set to ${mode}`);
                        }}
                        className={clsx(
                          "w-full text-left px-2 py-1 text-xs rounded transition",
                          db.settings.defaultViewMode === mode ? "bg-neon-blue text-black" : "hover:bg-gray-800"
                        )}
                      >
                        {mode === VIEW_MODES.ALL ? 'View All' : mode === VIEW_MODES.SELECTED ? 'Selected Only' : 'Non-Selected Only'}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Sort By</p>
                    <div className="space-y-1">
                      {Object.values(SORT_MODES).map(mode => (
                        <button
                          key={mode}
                          onClick={() => {
                            setSortMode(mode);
                            setDb(prev => ({ ...prev, settings: { ...prev.settings, defaultSortMode: mode } }));
                          }}
                          className={clsx(
                            "w-full text-left px-2 py-1 text-xs rounded transition",
                            sortMode === mode ? "bg-neon-purple text-black" : "hover:bg-gray-800"
                          )}
                        >
                          {SORT_LABELS[mode]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Tag Filters</p>
                    <p className="text-[9px] text-gray-600 mb-2">Click to highlight, Shift+Click to exclude</p>
                    <div className="flex flex-wrap gap-1">
                      {db.tags.map(t => (
                        <button
                          key={t.id}
                          onClick={(e) => toggleTagFilter(t.id, e.shiftKey ? 'excluded' : 'highlighted')}
                          className={clsx(
                            "w-6 h-6 rounded flex items-center justify-center transition border",
                            tagFilters.highlighted.includes(t.id) ? "border-neon-blue bg-neon-blue/20" :
                            tagFilters.excluded.includes(t.id) ? "border-red-500 bg-red-500/20 line-through" :
                            "border-gray-700 opacity-50 hover:opacity-100"
                          )}
                          title={t.label}
                        >
                          <TagBadge tag={t} scale={0.8} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-gray-800"/>

            <button
              onClick={scanMissingImages}
              disabled={isScanning}
              className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase transition border",
                isScanning ? "text-neon-purple border-neon-purple animate-pulse" : "text-gray-400 border-transparent hover:text-white"
              )}
            >
              <ScanEye size={14} />
              {isScanning ? "Scanning..." : "Scan"}
            </button>

            <button
              onClick={async () => {
                setStatus("Generating Thumbnails...");
                const result = await window.api.generateThumbnails();
                setStatus(`Done! Generated ${result.count}, regenerated ${result.regenerated || 0} thumbnails.`);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase text-gray-400 border border-transparent hover:text-white"
            >
              <Image size={14} /> Gen Thumbs
            </button>

            <button
              onClick={() => setShowExportDrawer(!showExportDrawer)}
              className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase transition",
                showExportDrawer ? "bg-neon-purple text-black" : "text-gray-400 hover:text-white border border-gray-800"
              )}
            >
              <CheckSquare size={14}/> {checkedItems.length} Selected
            </button>

            <div className="h-4 w-px bg-gray-800"/>

            <div className="flex items-center gap-2" title="Tag Size">
              <Tag size={12} className="text-gray-500"/>
              <input
                type="range" min="0.5" max="2" step="0.1"
                value={db.settings.tagScale || 1}
                onChange={(e) => setDb(prev => ({ ...prev, settings: { ...prev.settings, tagScale: parseFloat(e.target.value) } }))}
                className="w-12 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-neon-purple"
              />
            </div>

            <div className="flex items-center gap-2" title="Grid Size">
              <ZoomIn size={12} className="text-gray-500"/>
              <input
                type="range" min="2" max="8" step="1"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                className="w-16 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-neon-blue"
              />
            </div>

            <button onClick={() => {
              setSettingsInput({
                ...db.settings.colors,
                apiKey: db.settings.apiKey || '',
                settingsTab: 'user',
                customTemplate: db.settings.customTemplate || DEFAULT_TEMPLATES[0].template
              });
              setModal({ type: 'SETTINGS' });
            }}>
              <Settings size={18} className="text-gray-400 hover:text-white"/>
            </button>

            <div className="h-4 w-px bg-gray-800 mx-2"/>
            <div className="flex items-center gap-2">
              <button onClick={() => window.api.windowControl('minimize')} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"><Minus size={16}/></button>
              <button onClick={() => window.api.windowControl('maximize')} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"><Square size={14}/></button>
              <button onClick={() => window.api.windowControl('close')} className="p-1 hover:bg-red-500 rounded text-gray-400 hover:text-white"><X size={16}/></button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 mt-10">
          <div className="w-64 bg-black/40 backdrop-blur-md border-r border-neon-divider flex flex-col">
            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
              <div
                onClick={() => setSelectedFolderId('root')}
                onDrop={e => { e.preventDefault(); handleDrop('item', e.dataTransfer.getData('itemId'), 'root'); }}
                onDragOver={e => e.preventDefault()}
                className={clsx(
                  "px-4 py-2 flex items-center gap-2 cursor-pointer",
                  selectedFolderId === 'root' ? "text-neon-blue" : "text-gray-400 hover:text-white"
                )}
              >
                <Archive size={16}/> Unsorted
              </div>
              {db.folders.filter(f => f.parentId === 'root' || !f.parentId).map(f => (
                <FolderTreeItem
                  key={f.id}
                  folder={f}
                  allFolders={db.folders}
                  selectedId={selectedFolderId}
                  onSelect={setSelectedFolderId}
                  onToggleCollapse={(id) => setDb(prev => ({
                    ...prev,
                    folders: prev.folders.map(x => x.id === id ? { ...x, collapsed: !x.collapsed } : x)
                  }))}
                  onDrop={handleDrop}
                  onContextMenu={(e, folder) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, type: 'folder', data: folder });
                  }}
                />
              ))}
            </div>
            <div className="p-3 border-t border-neon-divider">
              <button
                onClick={() => { setFolderInput({}); setModal({ type: 'FOLDER' }); }}
                className="w-full py-2 bg-gray-900/50 border border-gray-700 hover:border-neon-blue rounded flex items-center justify-center gap-2 text-xs uppercase font-bold text-gray-300 hover:text-neon-blue transition"
              >
                <Plus size={14}/> New Class
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col relative overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${zoomLevel}, minmax(0, 1fr))`, gap: '1rem' }}>
                {isNewestFirst(sortMode) && (
                  <div
                    onClick={() => { setEntryInput({}); setModal({ type: 'ENTRY' }); }}
                    className="aspect-[2/3] rounded border border-gray-800 border-dashed hover:border-neon-blue hover:text-neon-blue text-gray-600 flex flex-col items-center justify-center cursor-pointer transition bg-gray-900/30"
                  >
                    <Plus size={32}/>
                    <span className="text-[10px] font-bold mt-2 uppercase">Add</span>
                  </div>
                )}
                {currentItems.slice(0, visibleCount).map(item => (
                  <GridItem
                    key={item.id}
                    item={item}
                    selectedItemId={selectedItemId}
                    setSelectedItemId={setSelectedItemId}
                    toggleSelect={toggleSelect}
                    db={db}
                    dragItemTarget={dragItemTarget}
                    setDragItemTarget={setDragItemTarget}
                    handleItemSortDrop={handleItemSortDrop}
                    setCarouselIndex={setCarouselIndex}
                    viewMode={viewMode}
                    tagFilters={tagFilters}
                  />
                ))}
                {currentItems.length > visibleCount && (
                  <>
                    <div
                      onClick={() => setVisibleCount(prev => prev + 50)}
                      className="aspect-[2/3] rounded border border-gray-700 hover:border-neon-blue text-gray-400 flex flex-col items-center justify-center cursor-pointer transition bg-gray-900/30"
                    >
                      <ChevronDown size={24}/>
                      <span className="text-[10px] font-bold mt-1 text-center px-2">View More<br/>({currentItems.length - visibleCount} left)</span>
                    </div>
                    <div
                      onClick={() => setVisibleCount(currentItems.length)}
                      className="aspect-[2/3] rounded border border-gray-700 hover:border-neon-purple text-gray-400 flex flex-col items-center justify-center cursor-pointer transition bg-gray-900/30"
                    >
                      <LayoutList size={24}/>
                      <span className="text-[10px] font-bold mt-1 text-center px-2">View All<br/>({currentItems.length} total)</span>
                    </div>
                  </>
                )}
                {!isNewestFirst(sortMode) && (
                  <div
                    onClick={() => { setEntryInput({}); setModal({ type: 'ENTRY' }); }}
                    className="aspect-[2/3] rounded border border-gray-800 border-dashed hover:border-neon-blue hover:text-neon-blue text-gray-600 flex flex-col items-center justify-center cursor-pointer transition bg-gray-900/30"
                  >
                    <Plus size={32}/>
                    <span className="text-[10px] font-bold mt-2 uppercase">Add</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showExportDrawer && (
            <div className="w-96 bg-[#080808] border-l border-neon-purple flex flex-col z-30 shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="p-4 bg-neon-purple/10 border-b border-neon-divider flex justify-between items-center">
                <h3 className="font-bold text-neon-purple flex items-center gap-2"><Image size={16}/> Selected ({checkedItems.length})</h3>
                <button onClick={() => setShowExportDrawer(false)}><X size={16}/></button>
              </div>
              <textarea
                className="flex-1 bg-black p-4 font-mono text-xs text-gray-300 outline-none resize-none"
                readOnly
                value={checkedItems.map(item => generateExportText(item, db.settings.customTemplate || DEFAULT_TEMPLATES[0].template)).join('\n\n')}
              />
              <div className="p-4 border-t border-gray-800">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(checkedItems.map(item => generateExportText(item, db.settings.customTemplate || DEFAULT_TEMPLATES[0].template)).join('\n\n'));
                    setStatus("Copied to Clipboard");
                  }}
                  className="w-full py-3 bg-neon-purple text-black font-bold uppercase rounded hover:bg-white transition flex items-center justify-center gap-2"
                >
                  <Image size={14}/> Copy All
                </button>
              </div>
            </div>
          )}

          {selectedItem && !showExportDrawer && (
            <div className="w-80 bg-black/60 backdrop-blur-md border-l border-neon-divider flex flex-col z-20">
              <div
                className="aspect-square bg-black/20 relative border-b border-gray-800 group overflow-hidden"
                onDragOver={e => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    const buffer = await file.arrayBuffer();
                    const savedPath = await window.api.saveImportedImage(buffer);
                    if (savedPath) addImageToItem(selectedItemId, savedPath);
                  }
                }}
              >
                {selectedItem.images?.length > 0 ? (
                  <Carousel images={selectedItem.images} index={carouselIndex} onChange={setCarouselIndex} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                    <Image size={32}/>
                    <p className="text-xs">Drag/Paste Image</p>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition z-50">
                  <button
                    onClick={() => setModal({ type: 'MANAGE_IMAGES' })}
                    className="p-1.5 bg-black/80 border border-gray-600 hover:border-white text-white rounded"
                  >
                    <LayoutList size={14}/>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Name</label>
                  <input
                    className="w-full bg-black/30 border border-gray-700 rounded p-2 text-sm text-white focus:border-neon-blue outline-none"
                    value={selectedItem.name}
                    onChange={e => updateItem(selectedItemId, 'name', e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 flex justify-between items-center">
                    <span>Source Link</span>
                    {sourceInView === 'civitai' && <CivitaiIcon className="w-3 h-3 text-blue-400" />}
                    {sourceInView === 'huggingface' && <HuggingFaceIcon className="w-3 h-3 text-yellow-400" />}
                  </label>
                  <div className="flex gap-1">
                    <input
                      className="flex-1 bg-black/30 border border-gray-700 rounded p-2 text-xs text-neon-text font-mono outline-none"
                      value={selectedItem.civitaiUrl || ''}
                      onChange={e => updateItem(selectedItemId, 'civitaiUrl', e.target.value)}
                    />
                    <button
                      onClick={() => fetchCivitaiImages(selectedItemId, selectedItem.civitaiUrl)}
                      className={clsx(
                        "p-2 rounded border transition",
                        sourceInView === 'civitai' ? "text-neon-blue border-neon-blue/50 hover:bg-neon-blue hover:text-black" : "text-gray-600 border-gray-800 cursor-not-allowed"
                      )}
                      disabled={sourceInView !== 'civitai'}
                    >
                      <DownloadCloud size={14}/>
                    </button>
                    <button
                      onClick={() => window.api.openExternal(selectedItem.civitaiUrl)}
                      className="p-2 bg-gray-900 border border-gray-800 rounded text-gray-400 hover:text-white hover:border-white transition"
                    >
                      <ExternalLink size={14}/>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Download Link</label>
                  <input
                    className="w-full bg-black/30 border border-gray-700 rounded p-2 text-xs text-gray-400 font-mono outline-none"
                    value={selectedItem.dlLink || ''}
                    onChange={e => updateItem(selectedItemId, 'dlLink', e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Tags</label>
                    <button onClick={() => setModal({ type: 'TAGS' })} className="text-[10px] text-neon-blue hover:underline">Edit Tags</button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[30px] p-2 bg-black/30 border border-gray-800 rounded">
                    {db.tags.map(t => (
                      <button
                        key={t.id}
                        onClick={() => {
                          const current = selectedItem.tags || [];
                          updateItem(selectedItemId, 'tags', current.includes(t.id) ? current.filter(id => id !== t.id) : [...current, t.id]);
                        }}
                        className={clsx(
                          "w-6 h-6 flex items-center justify-center transition",
                          (selectedItem.tags || []).includes(t.id) ? "scale-110 opacity-100" : "opacity-30 grayscale"
                        )}
                      >
                        <TagBadge tag={t} scale={1.2}/>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Notes</label>
                  <textarea
                    className="flex-1 bg-black/30 border border-gray-800 rounded p-2 text-xs text-gray-300 focus:border-neon-blue outline-none resize-none min-h-[100px]"
                    value={selectedItem.notes || ''}
                    onChange={e => updateItem(selectedItemId, 'notes', e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-800">
                <button
                  onClick={() => {
                    if (confirm("Delete?")) {
                      setDb(prev => ({ ...prev, items: prev.items.filter(i => i.id !== selectedItemId) }));
                      setSelectedItemId(null);
                    }
                  }}
                  className="w-full py-2 bg-red-900/10 text-red-600 border border-red-900/30 hover:bg-red-900/20 hover:text-red-400 font-bold uppercase text-xs rounded"
                >
                  Delete Entry
                </button>
              </div>
            </div>
          )}

          {!selectedItem && !showExportDrawer && (
            <div className="w-80 bg-black/60 backdrop-blur-md border-l border-neon-divider flex items-center justify-center text-gray-600 flex-col gap-2">
              <MousePointer2 size={32}/>
              <span className="text-xs">Select an item</span>
            </div>
          )}
        </div>

        {iconPickerTarget && <IconPicker onClose={() => setIconPickerTarget(null)} onSelect={handleIconSelect}/>}

        {contextMenu && (
          <div
            className="fixed rounded shadow-2xl z-[400] flex flex-col py-1 w-32 animate-in fade-in duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x, backgroundColor: '#0a0a0a', border: '1px solid var(--neon-blue)' }}
            onMouseLeave={() => setContextMenu(null)}
          >
            {contextMenu.type === 'tag' ? (
              <>
                <button
                  className="px-3 py-2 text-left text-xs hover:bg-cyan-400 hover:text-black"
                  onClick={() => {
                    setTagInput({ tagName: contextMenu.data.label, id: contextMenu.data.id, tagColor: contextMenu.data.color });
                    setModal({ type: 'EDIT_TAG' });
                    setContextMenu(null);
                  }}
                >
                  Edit Tag
                </button>
                <button
                  className="px-3 py-2 text-left text-xs text-red-500 hover:bg-red-900/20"
                  onClick={() => {
                    setDb(prev => ({ ...prev, tags: prev.tags.filter(t => t.id !== contextMenu.data.id) }));
                    setContextMenu(null);
                  }}
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  className="px-3 py-2 text-left text-xs hover:bg-cyan-400 hover:text-black"
                  onClick={() => {
                    setFolderInput({ name: contextMenu.data.name, id: contextMenu.data.id, icon: contextMenu.data.icon });
                    setModal({ type: 'RENAME' });
                    setContextMenu(null);
                  }}
                >
                  Edit Class
                </button>
                <button
                  className="px-3 py-2 text-left text-xs hover:bg-cyan-400 hover:text-black"
                  onClick={() => {
                    setIconPickerTarget({ type: 'folder-direct', id: contextMenu.data.id });
                    setContextMenu(null);
                  }}
                >
                  Change Icon
                </button>
                <div className="h-px bg-gray-800 my-1"/>
                <button
                  className="px-3 py-2 text-left text-xs text-red-500 hover:bg-red-900/20"
                  onClick={() => {
                    if (confirm("Delete class?")) {
                      setDb(prev => ({
                        ...prev,
                        folders: prev.folders.filter(f => f.id !== contextMenu.data.id),
                        items: prev.items.map(i => i.folderId === contextMenu.data.id ? { ...i, folderId: 'root' } : i)
                      }));
                      setSelectedFolderId('root');
                    }
                    setContextMenu(null);
                  }}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        <Modal
          isOpen={pendingClose}
          title="Unsaved Changes"
          onClose={() => setPendingClose(false)}
          width="w-80"
        >
          <p className="text-gray-400 text-sm mb-4">You have unsaved changes. What would you like to do?</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={async () => {
                const success = await window.api.saveDB({
                  ...db,
                  settings: { ...db.settings, zoom: zoomLevel, defaultViewMode: viewMode }
                });
                if (success) {
                  window.api.sendUnsavedState(false);
                  window.api.forceClose();
                }
              }}
              className="w-full py-2 rounded text-black font-bold hover:bg-white transition text-xs uppercase"
              style={{ backgroundColor: 'var(--neon-blue)' }}
            >
              Save & Exit
            </button>
            <button
              onClick={() => window.api.forceClose()}
              className="w-full py-2 rounded bg-red-900/50 text-red-400 border border-red-900 hover:bg-red-900/70 font-bold text-xs uppercase"
            >
              Exit Without Saving
            </button>
            <button
              onClick={() => setPendingClose(false)}
              className="w-full py-2 rounded text-gray-400 hover:text-white font-bold text-xs uppercase"
            >
              Cancel
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={modal.type === 'FOLDER' || modal.type === 'RENAME'}
          title={modal.type === 'FOLDER' ? "New Class" : "Edit Class"}
          onClose={() => setModal({ type: null })}
          onSubmit={() => {
            if (!folderInput.name) return;
            if (modal.type === 'FOLDER') {
              setDb(prev => ({
                ...prev,
                folders: [...prev.folders, {
                  id: uuidv4(),
                  name: folderInput.name,
                  icon: folderInput.icon || 'Folder',
                  parentId: selectedFolderId === 'root' ? 'root' : selectedFolderId
                }]
              }));
            } else {
              setDb(prev => ({
                ...prev,
                folders: prev.folders.map(f => f.id === folderInput.id ? { ...f, name: folderInput.name, icon: folderInput.icon || f.icon } : f)
              }));
            }
            setModal({ type: null });
            setFolderInput({});
          }}
        >
          <div className="space-y-4">
            <input
              className="w-full bg-black border border-gray-700 p-2 text-white rounded outline-none focus:border-neon-blue"
              autoFocus
              placeholder="Name"
              value={folderInput.name || ''}
              onChange={e => setFolderInput({ ...folderInput, name: e.target.value })}
            />
            <button
              onClick={() => setIconPickerTarget({ type: 'modal' })}
              className="flex items-center gap-2 text-xs text-neon-blue border border-neon-blue/30 px-3 py-2 rounded hover:bg-neon-blue hover:text-black transition"
            >
              <Image size={14}/> {folderInput.icon || "Choose Icon"}
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={modal.type === 'SETTINGS'}
          title="Settings"
          onClose={() => setModal({ type: null })}
          onSubmit={() => {
            setDb(prev => ({
              ...prev,
              settings: {
                ...prev.settings,
                apiKey: settingsInput.apiKey,
                colors: {
                  primary: settingsInput.primary,
                  secondary: settingsInput.secondary,
                  text: settingsInput.text,
                  divider: settingsInput.divider,
                  bg: settingsInput.bg
                },
                customTemplate: settingsInput.customTemplate
              }
            }));
            setModal({ type: null });
          }}
          width="w-[500px]"
        >
          <div className="space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar p-1">
            <div className="flex gap-2 mb-4 border-b border-gray-800 pb-2">
              {['user', 'download', 'credits'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setSettingsInput({ ...settingsInput, settingsTab: tab })}
                  className={clsx(
                    "px-3 py-1 text-xs font-bold uppercase rounded transition",
                    settingsInput.settingsTab === tab ?
                      (tab === 'credits' ? "bg-neon-purple text-black" : "bg-neon-blue text-black") :
                      "text-gray-400 hover:text-white"
                  )}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {settingsInput.settingsTab === 'user' && (
              <>
                <div className="pt-4">
                  <label className="text-[10px] uppercase font-bold text-white mb-2 block">Theme Colors</label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'primary', label: 'Main' },
                      { key: 'secondary', label: 'Select' },
                      { key: 'text', label: 'Link Text' },
                      { key: 'divider', label: 'Dividers' }
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-[9px] text-gray-500 block">{label}</label>
                        <input
                          type="color"
                          className="w-full h-8 bg-black border border-gray-700 rounded cursor-pointer"
                          value={settingsInput[key] || '#00f3ff'}
                          onChange={e => setSettingsInput({ ...settingsInput, [key]: e.target.value })}
                        />
                      </div>
                    ))}
                    <div className="col-span-2 border-t border-gray-800 pt-2">
                      <label className="text-[9px] block font-bold text-white">Background Hue</label>
                      <input
                        type="color"
                        className="w-full h-8 bg-black border border-gray-700 rounded cursor-pointer"
                        value={settingsInput.bg || '#050505'}
                        onChange={e => setSettingsInput({ ...settingsInput, bg: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <button
                  className="text-yellow-500 text-xs hover:underline mb-2"
                  onClick={async () => {
                    if (confirm("Delete full-size images? Only thumbnails will remain.")) {
                      setStatus("Deleting originals...");
                      const res = await window.api.deleteOriginals();
                      setStatus(`Deleted ${res.count} originals.`);
                    }
                  }}
                >
                  Delete Full-size Images (Save Space)
                </button>

                <div className="p-4 bg-gray-900/50 rounded text-xs text-gray-400 mt-4">
                  Database Location:<br/>
                  <code className="text-neon-blue">AppData\Roaming\Burrito GenStack\burrito_db.json</code>
                </div>

                <button
                  className="text-red-500 text-xs hover:underline"
                  onClick={() => {
                    if (confirm("NUKE DATABASE?")) {
                      setDb({ folders: [{ id: 'root', name: 'Unsorted', icon: 'Archive' }], items: [], tags: [], settings: {} });
                    }
                  }}
                >
                  Clear Database
                </button>
              </>
            )}

            {settingsInput.settingsTab === 'download' && (
              <>
                <div className="pt-4">
                  <label className="text-[10px] uppercase font-bold text-white mb-2 block">Civitai API Key</label>
                  <input
                    className="w-full bg-black border border-gray-700 rounded p-2 text-xs text-white focus:border-neon-blue outline-none"
                    placeholder="Paste key here..."
                    type="password"
                    value={settingsInput.apiKey || ''}
                    onChange={e => setSettingsInput({ ...settingsInput, apiKey: e.target.value })}
                  />
                  <p className="text-[9px] text-gray-600 mt-1">Used to fetch model previews automatically.</p>
                </div>

                <div className="pt-4 border-t border-gray-800 mt-4">
                  <label className="text-[10px] uppercase font-bold text-white mb-2 block">Export Template</label>
                  <p className="text-[9px] text-gray-500 mb-2">Variables: {`{name}`}, {`{source_link}`}, {`{download_link}`}</p>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {DEFAULT_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setSettingsInput({ ...settingsInput, customTemplate: t.template })}
                        className={clsx(
                          "px-2 py-1 text-[9px] rounded border transition",
                          settingsInput.customTemplate === t.template ? "bg-neon-blue text-black border-neon-blue" : "border-gray-700 hover:border-neon-blue"
                        )}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="w-full h-32 bg-black border border-gray-700 rounded p-2 text-xs text-gray-300 font-mono outline-none focus:border-neon-blue resize-none"
                    placeholder={'#{name}\n#{source_link}\n%download {download_link}'}
                    value={settingsInput.customTemplate || ''}
                    onChange={e => setSettingsInput({ ...settingsInput, customTemplate: e.target.value })}
                  />

                  <div className="mt-2 p-2 bg-gray-900/50 rounded border border-gray-800">
                    <p className="text-[9px] text-gray-500 mb-1">Preview:</p>
                    <pre className="text-[9px] text-gray-400 font-mono whitespace-pre-wrap">
                      {(settingsInput.customTemplate || '#{name}')
                        .replace(/{name}/g, 'Example Model')
                        .replace(/{source_link}/g, 'https://civitai.com/models/12345')
                        .replace(/{download_link}/g, 'https://civitai.com/api/download/models/12345')}
                    </pre>
                  </div>
                </div>
              </>
            )}

            {settingsInput.settingsTab === 'credits' && (
              <div className="space-y-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <MorphingLogo className="w-16 h-16" />
                  <h2 className="text-lg font-bold text-white">Burrito GenStack 1.2.1</h2>
                  <p className="text-[10px] text-gray-500">Developed by NuriDerBurrito</p>
                  <p className="text-[9px] text-gray-600">Copyrights reserved for Genesis Iterations</p>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-800">
                  <div
                    className="flex flex-col items-center gap-1 p-2 rounded bg-gray-900/50 hover:bg-gray-800 transition cursor-pointer"
                    onClick={() => window.api.openExternal('https://nuriderburrito.github.io/Genesis-Website/index.html')}
                  >
                    <img src={GenesisLogo} className="w-6 h-6" alt="Genesis"/>
                    <span className="text-[11px] text-gray-300">Genesis Iterations</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 p-2 rounded bg-gray-900/50 border border-gray-700">
                    <img src={DiscordLogo} className="w-6 h-6" alt="Discord"/>
                    <span className="text-[11px] text-gray-300">nuriderburrito</span>
                  </div>
                  <div
                    className="flex flex-col items-center gap-1 p-2 rounded bg-gray-900/50 hover:bg-gray-800 transition cursor-pointer"
                    onClick={() => window.api.openExternal('https://github.com/NuriDerBurrito/Burrito_GenStack')}
                  >
                    <img src={GithubLogo} className="w-6 h-6" alt="GitHub"/>
                    <span className="text-[11px] text-gray-300">GitHub Repo</span>
                  </div>
                  <div
                    className="flex flex-col items-center gap-1 p-2 rounded bg-gray-900/50 hover:bg-gray-800 transition cursor-pointer"
                    onClick={() => window.api.openExternal('https://huggingface.co/NuriDerBurrito')}
                  >
                    <img src={HuggingfaceLogo} className="w-6 h-6" alt="HuggingFace"/>
                    <span className="text-[11px] text-gray-300">HuggingFace</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <p className="text-[11px] text-gray-500 mb-2">Support</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className="flex items-center justify-center gap-2 p-2 rounded bg-gray-900/50 hover:bg-gray-800 transition cursor-pointer"
                      onClick={() => window.api.openExternal('https://ko-fi.com/genesisiterations')}
                    >
                      <img src={KofiLogo} className="w-6 h-6" alt="Ko-fi"/>
                      <span className="text-[11px] text-gray-300">Ko-fi</span>
                    </div>
                    <div
                      className="flex items-center justify-center gap-2 p-2 rounded bg-gray-900/50 hover:bg-gray-800 transition cursor-pointer"
                      onClick={() => window.api.openExternal('https://paypal.me/genesisiterations')}
                    >
                      <img src={PaypalLogo} className="w-6 h-6" alt="PayPal"/>
                      <span className="text-[11px] text-gray-300">PayPal</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800 text-center">
                  <p className="text-[11px] text-gray-500 mb-2">Special Thanks</p>
                  <div className="flex items-center justify-center gap-3">
                    <div
                      className="flex items-center justify-center gap-2 p-2 rounded bg-gray-900/50 cursor-pointer hover:bg-gray-800 transition"
                      onClick={() => window.api.openExternal('https://github.com/gutris1/segsmaker')}
                    >
                      <img src={GutsLogo} className="w-6 h-6 rounded-full object-cover" alt="gutris1"/>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white">gutris1</p>
                        <p className="text-[10px] text-gray-500">Inspiration & Segsmaker</p>
                      </div>
                    </div>
                    <div
                      className="flex items-center justify-center gap-2 p-2 rounded bg-gray-900/50 cursor-pointer hover:bg-gray-800 transition"
                      onClick={() => window.api.openExternal('https://github.com/Ktiseos-Nyx/')}
                    >
                      <img src={DuskLogo} className="w-6 h-6 rounded-full object-cover" alt="Duskfallcrew"/>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white">Duskfallcrew</p>
                        <p className="text-[10px] text-gray-500">Beta Tester</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>

        <Modal
          isOpen={modal.type === 'TAGS'}
          title="Tag Manager"
          onClose={() => setModal({ type: null })}
        >
          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
            {db.tags.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-gray-900 p-2 rounded border border-gray-800">
                <div className="flex items-center gap-2">
                  <TagBadge tag={t} scale={1.2}/>
                  <span className="text-xs font-bold text-gray-300">{t.label}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setContextMenu({ x: e.clientX, y: e.clientY, type: 'tag', data: t });
                  }}
                  className="p-1 hover:text-white text-gray-500"
                >
                  <MoreHorizontal size={16}/>
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-4 flex gap-2">
            <input
              className="flex-1 bg-black border border-gray-700 p-2 text-xs text-white rounded"
              placeholder="New Tag Name"
              value={tagInput.tagName || ''}
              onChange={e => setTagInput({ ...tagInput, tagName: e.target.value })}
            />
            <button
              className="bg-neon-blue text-black font-bold px-3 rounded"
              onClick={() => {
                if (!tagInput.tagName) return;
                setDb(prev => ({
                  ...prev,
                  tags: [...prev.tags, { id: uuidv4(), label: tagInput.tagName, color: '#00f3ff' }]
                }));
                setTagInput({ ...tagInput, tagName: '' });
              }}
            >
              <Plus size={14}/>
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={modal.type === 'EDIT_TAG'}
          title="Edit Tag"
          onClose={() => setModal({ type: null })}
          onSubmit={() => {
            setDb(prev => ({
              ...prev,
              tags: prev.tags.map(t => t.id === tagInput.id ? { ...t, label: tagInput.tagName, color: tagInput.tagColor, icon: tagInput.icon } : t)
            }));
            setModal({ type: null });
          }}
        >
          <div className="space-y-4">
            <input
              className="w-full bg-black border border-gray-700 p-2 text-white rounded outline-none"
              value={tagInput.tagName || ''}
              onChange={e => setTagInput({ ...tagInput, tagName: e.target.value })}
            />
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Color</label>
              <input
                type="color"
                className="bg-transparent h-8 w-10 border border-gray-700 rounded"
                value={tagInput.tagColor || '#00f3ff'}
                onChange={e => setTagInput({ ...tagInput, tagColor: e.target.value })}
              />
            </div>
            <button
              onClick={() => setIconPickerTarget({ type: 'tag' })}
              className="w-full py-2 border border-gray-700 text-gray-300 rounded hover:border-neon-blue hover:text-white text-xs"
            >
              Change Icon
            </button>
          </div>
        </Modal>

        <Modal
          isOpen={modal.type === 'MANAGE_IMAGES'}
          title="Manage Images"
          onClose={() => setModal({ type: null })}
        >
          <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto custom-scrollbar">
            {selectedItem?.images?.map((img, i) => (
              <div key={i} className="relative aspect-square border border-gray-800 rounded overflow-hidden group">
                <img src={img} className="w-full h-full object-cover"/>
                <button
                  className="absolute top-1 right-1 bg-black/80 text-red-500 p-1 rounded opacity-0 group-hover:opacity-100"
                  onClick={() => setDb(prev => ({
                    ...prev,
                    items: prev.items.map(it => it.id === selectedItemId ? { ...it, images: it.images.filter((_, idx) => idx !== i) } : it)
                  }))}
                >
                  <Trash2 size={12}/>
                </button>
              </div>
            ))}
          </div>
        </Modal>

        <Modal
          isOpen={modal.type === 'ENTRY'}
          title="New Entry"
          onClose={() => setModal({ type: null })}
          onSubmit={() => {
            if (!entryInput.name) return;
            setDb(prev => ({
              ...prev,
              items: [...prev.items, {
                id: uuidv4(),
                name: entryInput.name,
                civitaiUrl: entryInput.civitaiUrl || '',
                dlLink: entryInput.dlLink || '',
                notes: entryInput.notes || '',
                tags: entryInput.tags || [],
                folderId: selectedFolderId === 'root' ? 'root' : selectedFolderId,
                images: [],
                selected: false
              }]
            }));
            setModal({ type: null });
            setEntryInput({});
          }}
        >
          <div className="space-y-3">
            <div className="p-2 bg-gray-900/50 rounded border border-gray-800">
              <label className="text-[9px] uppercase font-bold text-neon-blue mb-1 block">Smart Paste</label>
              <textarea
                className="w-full h-16 bg-black border border-gray-700 p-2 text-xs text-gray-400 font-mono rounded outline-none focus:border-neon-blue resize-none"
                placeholder={getSmartPastePlaceholder(db.settings.customTemplate || DEFAULT_TEMPLATES[0].template)}
                value={entryInput.smartPaste || ''}
                onChange={e => {
                  const text = e.target.value;
                  const template = db.settings.customTemplate || DEFAULT_TEMPLATES[0].template;
                  const parsed = parseSmartPaste(text, template, entryInput);
                  setEntryInput(prev => ({ ...prev, smartPaste: text, ...parsed }));
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Name</label>
                <input
                  className="w-full bg-black border border-gray-700 p-2 text-xs text-white rounded outline-none focus:border-neon-blue"
                  placeholder="Model name"
                  value={entryInput.name || ''}
                  onChange={e => setEntryInput({ ...entryInput, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Source URL</label>
                <input
                  className="w-full bg-black border border-gray-700 p-2 text-xs text-white rounded outline-none focus:border-neon-blue"
                  placeholder="https://civitai.com/..."
                  value={entryInput.civitaiUrl || ''}
                  onChange={e => setEntryInput({ ...entryInput, civitaiUrl: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Download Link</label>
              <input
                className="w-full bg-black border border-gray-700 p-2 text-xs text-gray-400 rounded outline-none focus:border-neon-blue font-mono"
                placeholder="https://..."
                value={entryInput.dlLink || ''}
                onChange={e => setEntryInput({ ...entryInput, dlLink: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Tags</label>
              <div className="flex flex-wrap gap-1 p-2 bg-black/30 border border-gray-800 rounded min-h-[32px]">
                {db.tags.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      const current = entryInput.tags || [];
                      setEntryInput({
                        ...entryInput,
                        tags: current.includes(t.id) ? current.filter(id => id !== t.id) : [...current, t.id]
                      });
                    }}
                    className={clsx(
                      "transition",
                      (entryInput.tags || []).includes(t.id) ? "scale-110 opacity-100" : "opacity-40 hover:opacity-70"
                    )}
                  >
                    <TagBadge tag={t} scale={1} />
                  </button>
                ))}
                {db.tags.length === 0 && (
                  <span className="text-[10px] text-gray-600">No tags created yet</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-gray-500 block mb-1">Notes</label>
              <textarea
                className="w-full bg-black border border-gray-700 p-2 text-xs text-gray-400 rounded outline-none focus:border-neon-blue resize-none"
                placeholder="Optional notes..."
                rows={2}
                value={entryInput.notes || ''}
                onChange={e => setEntryInput({ ...entryInput, notes: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
