export const VALID_ICONS = [
  'Folder', 'FolderOpen', 'Archive', 'Star', 'Zap', 'Heart', 'Skull', 'Ghost', 'Flame',
  'Droplets', 'Snowflake', 'Wind', 'Sun', 'Moon', 'Cloud', 'Umbrella', 'Music', 'Video',
  'Image', 'Gamepad', 'Sword', 'Shield', 'Crown', 'Gem', 'Gift', 'Package', 'Box',
  'Layers', 'Layout', 'Grid', 'List', 'Tag', 'Bookmark', 'Flag', 'MapPin', 'Globe',
  'Cpu', 'Database', 'HardDrive', 'Smartphone', 'Terminal', 'Code', 'PenTool', 'Brush',
  'Palette', 'Scissors', 'Anchor', 'Coffee', 'Pizza', 'Cat', 'Dog', 'Eye', 'Feather'
];

export const DEFAULT_TEMPLATES = [
  { id: 'guts', name: "Gutris1's Format", template: '#{name}\n#{source_link}\n%download {download_link}' },
  { id: 'simple', name: 'Simple List', template: '{name}\n{download_link}' },
  { id: 'curl', name: 'Curl Command', template: '# {name}\n!curl -L -o model.safetensors {download_link}' }
];

export const VIEW_MODES = {
  ALL: 'all',
  SELECTED: 'selected',
  NON_SELECTED: 'non_selected',
};

export const SORT_MODES = {
  OLDEST_FIRST: 'oldest',
  NEWEST_FIRST: 'newest',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
};

export const SORT_LABELS = {
  [SORT_MODES.OLDEST_FIRST]: 'Oldest First',
  [SORT_MODES.NEWEST_FIRST]: 'Newest First',
  [SORT_MODES.NAME_ASC]: 'Name (A-Z)',
  [SORT_MODES.NAME_DESC]: 'Name (Z-A)',
};

export const DEFAULT_DB = {
  folders: [],
  items: [],
  tags: [],
  settings: {
    zoom: 4,
    apiKey: '',
    tagScale: 1,
    colors: {},
    defaultViewMode: VIEW_MODES.ALL,
    defaultSortMode: SORT_MODES.OLDEST_FIRST,
    templates: DEFAULT_TEMPLATES,
    customTemplate: DEFAULT_TEMPLATES[0].template
  }
};
