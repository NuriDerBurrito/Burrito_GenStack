import { VIEW_MODES, SORT_MODES } from '../constants';

export const getThumbUrl = (url) => url?.replace(/\.(png|jpg|jpeg|webp)$/i, '_thumb.jpg') || null;

export const detectSource = (url) => {
  if (!url) return 'none';
  if (url.includes('civitai.com')) return 'civitai';
  if (url.includes('huggingface.co')) return 'huggingface';
  return 'web';
};

export const generateExportText = (item, template) => template
  .replace(/{name}/g, item.name)
  .replace(/{source_link}/g, item.civitaiUrl || '')
  .replace(/{download_link}/g, item.dlLink || '');

export const getViewModeLabel = (mode) => {
  const labels = { [VIEW_MODES.ALL]: 'View All', [VIEW_MODES.SELECTED]: 'Selected', [VIEW_MODES.NON_SELECTED]: 'Non-Selected' };
  return labels[mode] || 'View All';
};

export const createSafeDb = (data, defaultSettings) => {
  const safeData = {
    folders: Array.isArray(data?.folders) ? data.folders : [],
    items: Array.isArray(data?.items) ? data.items : [],
    tags: Array.isArray(data?.tags) ? data.tags : [],
    settings: { ...defaultSettings, ...data?.settings }
  };
  if (!safeData.folders.find(f => f.id === 'root')) {
    safeData.folders.push({ id: 'root', name: 'Unsorted', icon: 'Archive', parentId: null });
  }
  return safeData;
};

export const getDescendantItems = (folderId, folders, items) => {
  let result = items.filter(item => item.folderId === folderId);
  const findRecursive = (parentId) => {
    folders.forEach(folder => {
      if (folder.parentId === parentId) {
        result = result.concat(items.filter(item => item.folderId === folder.id));
        findRecursive(folder.id);
      }
    });
  };
  findRecursive(folderId);
  return result;
};

export const filterItems = (folderId, folders, items, searchTerm) => {
  if (folderId === 'root') return items;
  let filtered = getDescendantItems(folderId, folders, items);
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(item => item.name.toLowerCase().includes(term) || item.url?.toLowerCase().includes(term));
  }
  return filtered;
};

export const isItemVisible = (item, viewMode, tagFilters) => {
  if (viewMode === VIEW_MODES.SELECTED && !item.selected) return false;
  if (viewMode === VIEW_MODES.NON_SELECTED && item.selected) return false;
  const { highlighted = [], excluded = [] } = tagFilters;
  if (item.tags?.some(t => excluded.includes(t))) return false;
  if (highlighted.length > 0) return item.tags?.some(t => highlighted.includes(t));
  return true;
};

export const applyThemeColors = (colors = {}) => {
  const root = document.documentElement;
  root.style.setProperty('--neon-blue', colors.primary || '#00f3ff');
  root.style.setProperty('--neon-purple', colors.secondary || '#bc13fe');
  root.style.setProperty('--text-main', colors.text || '#00f3ff');
  root.style.setProperty('--divider-color', colors.divider || '#1f2937');
};

export const parseSmartPaste = (text, template, current = {}) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let name = current.name || '';
  let civitaiUrl = current.civitaiUrl || '';
  let dlLink = current.dlLink || '';

  const templateLines = template.split('\n').map(l => l.trim());

  const isUrl = (str) => str && (str.startsWith('http://') || str.startsWith('https://'));

  lines.forEach((line, idx) => {
    const templateLine = templateLines[idx] || '';

    if (templateLine.includes('{name}') || templateLine.includes('#{name}')) {
      if (line.startsWith('#')) {
        const content = line.substring(1).trim();
        if (isUrl(content)) {
          if (!civitaiUrl) civitaiUrl = content;
        } else if (!name) {
          name = content;
        }
      } else if (!isUrl(line)) {
        name = line;
      }
    }

    if (templateLine.includes('{source_link}') || templateLine.includes('#{source_link}')) {
      if (line.startsWith('#')) {
        const content = line.substring(1).trim();
        if (isUrl(content)) civitaiUrl = content;
      } else if (isUrl(line)) {
        civitaiUrl = line;
      }
    }

    if (templateLine.includes('{download_link}')) {
      if (line.startsWith('%download')) {
        dlLink = line.replace('%download', '').trim();
      } else if (line.startsWith('!curl')) {
        const match = line.match(/(?:^|\s)(https?:\/\/\S+)/);
        if (match) dlLink = match[1];
      } else if (isUrl(line)) {
        dlLink = line;
      }
    }
  });

  if (!name || !civitaiUrl || !dlLink) {
    lines.forEach(line => {
      if (line.startsWith('#')) {
        const content = line.substring(1).trim();
        if (isUrl(content)) {
          if (!civitaiUrl) civitaiUrl = content;
        } else if (!name) {
          name = content;
        }
      } else if (line.startsWith('%download')) {
        if (!dlLink) dlLink = line.replace('%download', '').trim();
      } else if (line.startsWith('!curl')) {
        if (!dlLink) {
          const match = line.match(/(?:^|\s)(https?:\/\/\S+)/);
          if (match) dlLink = match[1];
        }
      } else if (isUrl(line)) {
        if (!dlLink) dlLink = line;
        else if (!civitaiUrl) civitaiUrl = line;
      }
    });
  }

  return { name, civitaiUrl, dlLink };
};

export const getSmartPastePlaceholder = (template) => {
  const lines = template.split('\n');
  return lines.map(line => {
    if (line.includes('{name}') && line.includes('#')) return '#ModelName';
    if (line.includes('{name}')) return 'ModelName';
    if (line.includes('{source_link}') && line.includes('#')) return '#https://civitai.com/models/...';
    if (line.includes('{source_link}')) return 'https://civitai.com/models/...';
    if (line.includes('{download_link}') && line.includes('%download')) return '%download https://...';
    if (line.includes('{download_link}') && line.includes('!curl')) return '!curl -L -o model.safetensors https://...';
    if (line.includes('{download_link}')) return 'https://...';
    return line;
  }).join('\n');
};

export const sortItems = (items, sortMode) => {
  const sorted = [...items];

  switch (sortMode) {
    case SORT_MODES.NEWEST_FIRST:
      return sorted.reverse();
    case SORT_MODES.NAME_ASC:
      return sorted.sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
    case SORT_MODES.NAME_DESC:
      return sorted.sort((a, b) => (b.name || '').toLowerCase().localeCompare((a.name || '').toLowerCase()));
    case SORT_MODES.OLDEST_FIRST:
    default:
      return sorted;
  }
};

export const isNewestFirst = (sortMode) => sortMode === SORT_MODES.NEWEST_FIRST;
