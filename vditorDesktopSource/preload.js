const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File
  onFileNew: (cb) => ipcRenderer.on('file-new', cb),
  onFileOpened: (cb) => ipcRenderer.on('file-opened', (e, data) => cb(data)),
  onRequestContent: (cb) => ipcRenderer.on('request-content', cb),
  onRequestHTML: (cb) => ipcRenderer.on('request-html', cb),
  sendContent: (content) => ipcRenderer.send('content-response', content),
  sendHTML: (html) => ipcRenderer.send('html-response', html),
  contentModified: (modified) => ipcRenderer.send('content-modified', modified),

  // Clipboard - write rich HTML for platform paste
  writeClipboardHTML: (html, text) => ipcRenderer.send('write-clipboard-html', { html, text }),

  // Drag-drop: get file path from File object
  getPathForFile: (file) => webUtils.getPathForFile(file),

  // Folder / File tree
  onFolderOpened: (cb) => ipcRenderer.on('folder-opened', (e, p) => cb(p)),
  requestFolderTree: (fp) => ipcRenderer.send('request-folder-tree', fp),
  onFolderTreeData: (cb) => ipcRenderer.on('folder-tree-data', (e, d) => cb(d)),
  openFileFromTree: (fp) => ipcRenderer.send('open-file-from-tree', fp),
  dropFile: (fp) => ipcRenderer.send('drop-file', fp),
  showFileInFolder: (fp) => ipcRenderer.send('show-file-in-folder', fp),
  readFolder: (fp) => ipcRenderer.invoke('read-folder', fp),

  // Mode / Theme / View
  onSwitchMode: (cb) => ipcRenderer.on('switch-mode', (e, m) => cb(m)),
  onToggleSourceMode: (cb) => ipcRenderer.on('toggle-source-mode', cb),
  onSwitchTheme: (cb) => ipcRenderer.on('switch-theme', (e, t) => cb(t)),
  onSwitchContentTheme: (cb) => ipcRenderer.on('switch-content-theme', (e, t) => cb(t)),
  onToggleToolbar: (cb) => ipcRenderer.on('toggle-toolbar', (e, v) => cb(v)),
  onToggleSidebar: (cb) => ipcRenderer.on('toggle-sidebar', (e, v) => cb(v)),
  onToggleOutline: (cb) => ipcRenderer.on('toggle-outline', (e, v) => cb(v)),
  onToggleTypewriter: (cb) => ipcRenderer.on('toggle-typewriter', (e, v) => cb(v)),
  onToggleFocus: (cb) => ipcRenderer.on('toggle-focus', (e, v) => cb(v)),
  onToggleStatusbar: (cb) => ipcRenderer.on('toggle-statusbar', (e, v) => cb(v)),
  onSetEditorWidth: (cb) => ipcRenderer.on('set-editor-width', (e, w) => cb(w)),
  onSidebarTab: (cb) => ipcRenderer.on('sidebar-tab', (e, t) => cb(t)),

  // Find & Replace
  onToggleFind: (cb) => ipcRenderer.on('toggle-find', cb),
  onToggleReplace: (cb) => ipcRenderer.on('toggle-replace', cb),

  // Format / Insert
  onInsertFormat: (cb) => ipcRenderer.on('insert-format', (e, f) => cb(f)),
  onAction: (cb) => ipcRenderer.on('action', (e, a) => cb(a)),

  // Quick open
  onQuickOpen: (cb) => ipcRenderer.on('quick-open', cb),

  // Settings
  onInitSettings: (cb) => ipcRenderer.on('init-settings', (e, s) => cb(s)),
  onOpenSettings: (cb) => ipcRenderer.on('open-settings', cb),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (s) => ipcRenderer.invoke('update-settings', s),
  onSetOption: (cb) => ipcRenderer.on('set-option', (e, o) => cb(o)),
  onSetSmartPunctuation: (cb) => ipcRenderer.on('set-smart-punctuation', (e, v) => cb(v)),

  // Image
  saveImageLocal: (data) => ipcRenderer.send('save-image-local', data),
  onImageSaved: (cb) => ipcRenderer.on('image-saved', (e, p) => cb(p)),
  openInsertImageDialog: () => ipcRenderer.send('open-insert-image-dialog'),
  onLocalImageSelected: (cb) => ipcRenderer.on('local-image-selected', (e, p) => cb(p)),

  // External
  openExternal: (url) => ipcRenderer.send('open-external-link', url)
});
