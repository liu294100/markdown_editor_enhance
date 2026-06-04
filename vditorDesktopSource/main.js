const { app, BrowserWindow, Menu, dialog, ipcMain, shell, nativeTheme, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');

// --- State ---
let windows = [];
let currentFilePath = null;
let isContentModified = false;
let settingsPath;
let settings = {};

// --- Settings ---

function loadSettings() {
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  } catch {
    settings = {
      contentTheme: 'github',
      appTheme: 'light',
      mode: 'wysiwyg',
      autoSave: true,
      autoSaveInterval: 30000,
      typewriterMode: false,
      focusMode: false,
      alwaysOnTop: false,
      sidebarVisible: true,
      sidebarTab: 'outline',
      statusBarVisible: true,
      toolbarVisible: true,
      fontSize: 16,
      lineHeight: 1.6,
      editorWidth: 'normal',
      lastOpenFolder: null,
      recentFiles: [],
      recentFolders: [],
      windowBounds: { width: 1200, height: 800 },
      smartPunctuation: false,
      lineEnding: 'lf',
      saveImageLocal: false,
      spellCheck: false
    };
  }
  return settings;
}

function saveSettings() {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (e) { /* ignore */ }
}

// --- Window Management ---

function createWindow(filePath) {
  const bounds = settings.windowBounds || { width: 1200, height: 800 };
  const win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 700,
    minHeight: 500,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: settings.spellCheck
    },
    titleBarStyle: 'default',
    show: false,
    backgroundColor: settings.appTheme === 'dark' ? '#1e1e1e' : '#ffffff'
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Prevent navigation when files are dropped (Electron default behavior)
  win.webContents.on('will-navigate', (e, url) => {
    e.preventDefault();
    // If it's a file URL that looks like a markdown file, open it
    if (url.startsWith('file:///')) {
      let filePath = decodeURIComponent(url.replace('file:///', ''));
      // On Windows, paths start without slash
      if (process.platform === 'win32' && !filePath.match(/^[A-Z]:/i)) {
        filePath = '/' + filePath;
      }
      filePath = filePath.replace(/\//g, path.sep);
      if (/\.(md|markdown|mdown|mkd|txt)$/i.test(filePath) && fs.existsSync(filePath)) {
        openFileInWindow(win, filePath);
      }
    }
  });

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  win.once('ready-to-show', () => {
    win.show();
    win.webContents.send('init-settings', settings);
    if (filePath) openFileInWindow(win, filePath);
    updateTitle(win);
  });

  win.on('close', async (e) => {
    if (isContentModified && win === getMainWindow()) {
      e.preventDefault();
      const result = await dialog.showMessageBox(win, {
        type: 'question', buttons: ['保存', '不保存', '取消'], defaultId: 0,
        title: '保存文件', message: '当前文件已修改，是否保存？'
      });
      if (result.response === 0) { await saveFile(win); win.destroy(); }
      else if (result.response === 1) { win.destroy(); }
    }
  });

  win.on('closed', () => { windows = windows.filter(w => w !== win); });
  win.on('resize', () => {
    const [width, height] = win.getSize();
    settings.windowBounds = { width, height };
    saveSettings();
  });

  windows.push(win);
  return win;
}

function getMainWindow() { return windows[0] || null; }

function updateTitle(win) {
  if (!win) win = getMainWindow();
  if (!win) return;
  const fileName = currentFilePath ? path.basename(currentFilePath) : '未命名';
  const modified = isContentModified ? ' ●' : '';
  win.setTitle(`${fileName}${modified} - Vditor Desktop`);
}

// --- File Operations ---

async function newFile() {
  const win = getMainWindow();
  if (!win) return;
  if (isContentModified) {
    const r = await dialog.showMessageBox(win, { type: 'question', buttons: ['保存', '不保存', '取消'], defaultId: 0, message: '当前文件已修改，是否保存？' });
    if (r.response === 0) await saveFile(win);
    else if (r.response === 2) return;
  }
  currentFilePath = null;
  isContentModified = false;
  win.webContents.send('file-new');
  updateTitle(win);
}

function newWindow() { createWindow(); }

async function openFile(filePath) {
  const win = getMainWindow();
  if (!win) return;
  if (isContentModified) {
    const r = await dialog.showMessageBox(win, { type: 'question', buttons: ['保存', '不保存', '取消'], defaultId: 0, message: '当前文件已修改，是否保存？' });
    if (r.response === 0) await saveFile(win);
    else if (r.response === 2) return;
  }
  await openFileInWindow(win, filePath);
}

async function openFileInWindow(win, filePath) {
  let targetPath = filePath;
  if (!targetPath) {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd', 'txt'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    });
    if (result.canceled) return;
    targetPath = result.filePaths[0];
  }
  try {
    const content = fs.readFileSync(targetPath, 'utf-8');
    currentFilePath = targetPath;
    isContentModified = false;
    win.webContents.send('file-opened', { content, filePath: targetPath });
    updateTitle(win);
    addToRecentFiles(targetPath);
  } catch (err) {
    dialog.showErrorBox('打开文件失败', err.message);
  }
}

async function openFolder() {
  const win = getMainWindow();
  if (!win) return;
  const result = await dialog.showOpenDialog(win, { properties: ['openDirectory'] });
  if (result.canceled) return;
  const folderPath = result.filePaths[0];
  settings.lastOpenFolder = folderPath;
  addToRecentFolders(folderPath);
  saveSettings();
  win.webContents.send('folder-opened', folderPath);
}

async function saveFile(win) {
  if (!win) win = getMainWindow();
  if (!win) return false;
  if (!currentFilePath) return await saveFileAs(win);
  win.webContents.send('request-content');
  return new Promise((resolve) => {
    ipcMain.once('content-response', (event, content) => {
      try {
        fs.writeFileSync(currentFilePath, content, 'utf-8');
        isContentModified = false;
        updateTitle(win);
        resolve(true);
      } catch (err) { dialog.showErrorBox('保存失败', err.message); resolve(false); }
    });
  });
}

async function saveFileAs(win) {
  if (!win) win = getMainWindow();
  if (!win) return false;
  const result = await dialog.showSaveDialog(win, {
    defaultPath: currentFilePath || '未命名.md',
    filters: [{ name: 'Markdown', extensions: ['md'] }, { name: '所有文件', extensions: ['*'] }]
  });
  if (result.canceled) return false;
  currentFilePath = result.filePath;
  win.webContents.send('request-content');
  return new Promise((resolve) => {
    ipcMain.once('content-response', (event, content) => {
      try {
        fs.writeFileSync(currentFilePath, content, 'utf-8');
        isContentModified = false;
        updateTitle(win);
        addToRecentFiles(currentFilePath);
        resolve(true);
      } catch (err) { dialog.showErrorBox('保存失败', err.message); resolve(false); }
    });
  });
}

// --- Export ---

async function exportHTML(win) {
  if (!win) win = getMainWindow();
  const result = await dialog.showSaveDialog(win, {
    defaultPath: currentFilePath ? currentFilePath.replace(/\.md$/, '.html') : '导出.html',
    filters: [{ name: 'HTML', extensions: ['html'] }]
  });
  if (result.canceled) return;
  win.webContents.send('request-html');
  ipcMain.once('html-response', (event, html) => {
    try {
      const title = currentFilePath ? path.basename(currentFilePath, '.md') : '未命名';
      const fullHTML = generateExportHTML(title, html);
      fs.writeFileSync(result.filePath, fullHTML, 'utf-8');
      shell.showItemInFolder(result.filePath);
    } catch (err) { dialog.showErrorBox('导出 HTML 失败', err.message); }
  });
}

async function exportPDF(win) {
  if (!win) win = getMainWindow();
  const result = await dialog.showSaveDialog(win, {
    defaultPath: currentFilePath ? currentFilePath.replace(/\.md$/, '.pdf') : '导出.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (result.canceled) return;
  try {
    const pdfData = await win.webContents.printToPDF({
      marginsType: 0, printBackground: true, landscape: false, pageSize: 'A4', scaleFactor: 100
    });
    fs.writeFileSync(result.filePath, pdfData);
    shell.showItemInFolder(result.filePath);
  } catch (err) { dialog.showErrorBox('导出 PDF 失败', err.message); }
}

function generateExportHTML(title, bodyHTML) {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title}</title><style>:root{--bg:#fff;--text:#333;--code-bg:#f6f8fa;--border:#e8e8e8;--link:#0366d6}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;max-width:860px;margin:0 auto;padding:60px 40px;line-height:1.7;color:var(--text);background:var(--bg)}h1{font-size:2em;margin:1em 0 .5em;border-bottom:1px solid var(--border);padding-bottom:.3em}h2{font-size:1.5em;margin:1em 0 .4em;border-bottom:1px solid var(--border);padding-bottom:.2em}h3{font-size:1.25em;margin:.8em 0 .3em}p{margin:.6em 0}a{color:var(--link);text-decoration:none}code{background:var(--code-bg);padding:2px 6px;border-radius:3px;font-size:.9em}pre{background:var(--code-bg);padding:16px;border-radius:8px;overflow-x:auto}pre code{background:none;padding:0}blockquote{border-left:4px solid #dfe2e5;margin:.8em 0;padding:.5em 1em;color:#6a737d}table{border-collapse:collapse;width:100%;margin:1em 0}th,td{border:1px solid var(--border);padding:8px 14px}th{background:var(--code-bg)}img{max-width:100%}ul,ol{padding-left:2em}hr{border:none;border-top:2px solid var(--border);margin:2em 0}</style></head><body>${bodyHTML}</body></html>`;
}

// --- Recent files & folders ---

function addToRecentFiles(fp) {
  if (!settings.recentFiles) settings.recentFiles = [];
  settings.recentFiles = settings.recentFiles.filter(f => f !== fp);
  settings.recentFiles.unshift(fp);
  if (settings.recentFiles.length > 15) settings.recentFiles = settings.recentFiles.slice(0, 15);
  saveSettings();
  buildMenu();
}

function addToRecentFolders(fp) {
  if (!settings.recentFolders) settings.recentFolders = [];
  settings.recentFolders = settings.recentFolders.filter(f => f !== fp);
  settings.recentFolders.unshift(fp);
  if (settings.recentFolders.length > 5) settings.recentFolders = settings.recentFolders.slice(0, 5);
  saveSettings();
}

// --- File tree ---

function readFolderTree(folderPath, depth = 3) {
  if (depth <= 0) return [];
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    const result = [];
    const sorted = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const entry of sorted) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const fullPath = path.join(folderPath, entry.name);
      if (entry.isDirectory()) {
        result.push({ name: entry.name, path: fullPath, type: 'directory', children: readFolderTree(fullPath, depth - 1) });
      } else if (/\.(md|markdown|mdown|mkd|txt)$/i.test(entry.name)) {
        result.push({ name: entry.name, path: fullPath, type: 'file' });
      }
    }
    return result;
  } catch { return []; }
}

// --- Auto-save ---

let autoSaveTimer = null;
function startAutoSave() {
  stopAutoSave();
  if (settings.autoSave && settings.autoSaveInterval > 0) {
    autoSaveTimer = setInterval(() => {
      if (isContentModified && currentFilePath) {
        const win = getMainWindow();
        if (win) saveFile(win);
      }
    }, settings.autoSaveInterval);
  }
}
function stopAutoSave() { if (autoSaveTimer) { clearInterval(autoSaveTimer); autoSaveTimer = null; } }

// --- Image handling ---

function saveImageToLocal(imageData, originalName) {
  if (!currentFilePath) return imageData;
  const assetsDir = path.join(path.dirname(currentFilePath), 'assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
  const ext = path.extname(originalName) || '.png';
  const baseName = path.basename(originalName, ext);
  const fileName = `${baseName}-${Date.now()}${ext}`;
  const filePath = path.join(assetsDir, fileName);
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
  return `assets/${fileName}`;
}

// --- Menu Builder ---

function buildMenu() {
  const win = getMainWindow();
  const send = (channel, data) => { if (win) win.webContents.send(channel, data); };

  const recentFiles = settings.recentFiles || [];
  const recentMenuItems = recentFiles.length > 0
    ? [...recentFiles.map(f => ({ label: path.basename(f), sublabel: f, click: () => openFile(f) })),
       { type: 'separator' },
       { label: '清除最近打开', click: () => { settings.recentFiles = []; saveSettings(); buildMenu(); } }]
    : [{ label: '(空)', enabled: false }];

  const template = [
    // ========== 文件(F) ==========
    {
      label: '文件(F)',
      submenu: [
        { label: '新建', accelerator: 'CmdOrCtrl+N', click: newFile },
        { label: '新建窗口', accelerator: 'CmdOrCtrl+Shift+N', click: newWindow },
        { type: 'separator' },
        { label: '打开...', accelerator: 'CmdOrCtrl+O', click: () => openFile() },
        { label: '打开文件夹...', accelerator: 'CmdOrCtrl+Shift+O', click: openFolder },
        { label: '快速打开...', accelerator: 'CmdOrCtrl+P', click: () => send('quick-open', null) },
        { type: 'separator' },
        { label: '最近打开', submenu: recentMenuItems },
        { type: 'separator' },
        { label: '保存', accelerator: 'CmdOrCtrl+S', click: () => saveFile() },
        { label: '另存为...', accelerator: 'CmdOrCtrl+Shift+S', click: () => saveFileAs() },
        { type: 'separator' },
        { label: '导出', submenu: [
          { label: 'HTML...', click: () => exportHTML() },
          { label: 'PDF...', click: () => exportPDF() }
        ]},
        { type: 'separator' },
        { label: '偏好设置...', accelerator: 'CmdOrCtrl+,', click: () => send('open-settings', null) },
        { type: 'separator' },
        { label: '关闭窗口', accelerator: 'CmdOrCtrl+W', click: () => { if (win) win.close(); } },
        { label: '退出', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    // ========== 编辑(E) ==========
    {
      label: '编辑(E)',
      submenu: [
        { label: '撤消', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: '重做', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: '全选', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
        { type: 'separator' },
        { label: '拷贝图片', click: () => send('action', 'copy-image') },
        { label: '复制为纯文本', click: () => send('action', 'copy-plain-text') },
        { label: '复制为 Markdown', accelerator: 'CmdOrCtrl+Shift+C', click: () => send('action', 'copy-as-markdown') },
        { label: '复制为 HTML 代码', click: () => send('action', 'copy-as-html') },
        { label: '复制内容并简化格式', click: () => send('action', 'copy-simplified') },
        { type: 'separator' },
        { label: '拷贝到...', submenu: [
          { label: '微信公众号', click: () => send('action', 'copy-for-wechat') },
          { label: '飞书文档', click: () => send('action', 'copy-for-feishu') },
          { label: 'Notion', click: () => send('action', 'copy-for-notion') },
          { label: '语雀', click: () => send('action', 'copy-for-yuque') },
          { label: '知乎', click: () => send('action', 'copy-for-zhihu') }
        ]},
        { type: 'separator' },
        { label: '粘贴为纯文本', accelerator: 'CmdOrCtrl+Shift+V', click: () => send('action', 'paste-plain-text') },
        { label: '选择', submenu: [
          { label: '选择当前行', click: () => send('action', 'select-line') },
          { label: '选择当前段落', click: () => send('action', 'select-paragraph') }
        ]},
        { type: 'separator' },
        { label: '删除', click: () => send('action', 'delete') },
        { type: 'separator' },
        { label: '查找和替换', submenu: [
          { label: '查找...', accelerator: 'CmdOrCtrl+F', click: () => send('toggle-find', null) },
          { label: '替换...', accelerator: 'CmdOrCtrl+H', click: () => send('toggle-replace', null) },
          { label: '查找下一个', accelerator: 'F3', click: () => send('action', 'find-next') },
          { label: '查找上一个', accelerator: 'Shift+F3', click: () => send('action', 'find-prev') }
        ]},
        { type: 'separator' },
        { label: '表情与符号', click: () => send('action', 'emoji-picker') }
      ]
    },
    // ========== 段落(P) ==========
    {
      label: '段落(P)',
      submenu: [
        { label: '一级标题', accelerator: 'CmdOrCtrl+1', click: () => send('insert-format', 'heading1') },
        { label: '二级标题', accelerator: 'CmdOrCtrl+2', click: () => send('insert-format', 'heading2') },
        { label: '三级标题', accelerator: 'CmdOrCtrl+3', click: () => send('insert-format', 'heading3') },
        { label: '四级标题', accelerator: 'CmdOrCtrl+4', click: () => send('insert-format', 'heading4') },
        { label: '五级标题', accelerator: 'CmdOrCtrl+5', click: () => send('insert-format', 'heading5') },
        { label: '六级标题', accelerator: 'CmdOrCtrl+6', click: () => send('insert-format', 'heading6') },
        { type: 'separator' },
        { label: '段落', accelerator: 'CmdOrCtrl+0', click: () => send('insert-format', 'paragraph') },
        { type: 'separator' },
        { label: '提升标题级别', click: () => send('action', 'heading-up') },
        { label: '降低标题级别', click: () => send('action', 'heading-down') },
        { type: 'separator' },
        { label: '表格', submenu: [
          { label: '插入表格', click: () => send('insert-format', 'table') },
          { label: '在上方添加行', click: () => send('action', 'table-add-row-above') },
          { label: '在下方添加行', click: () => send('action', 'table-add-row-below') },
          { label: '在左侧添加列', click: () => send('action', 'table-add-col-left') },
          { label: '在右侧添加列', click: () => send('action', 'table-add-col-right') },
          { label: '删除当前行', click: () => send('action', 'table-delete-row') },
          { label: '删除当前列', click: () => send('action', 'table-delete-col') },
          { type: 'separator' },
          { label: '左对齐', click: () => send('action', 'table-align-left') },
          { label: '居中对齐', click: () => send('action', 'table-align-center') },
          { label: '右对齐', click: () => send('action', 'table-align-right') }
        ]},
        { label: '公式块', accelerator: 'CmdOrCtrl+Shift+M', click: () => send('insert-format', 'math-block') },
        { label: '代码块', accelerator: 'CmdOrCtrl+Shift+K', click: () => send('insert-format', 'code-block') },
        { label: '代码工具', submenu: [
          { label: '插入代码块', click: () => send('insert-format', 'code-block') },
          { label: '选择代码语言', click: () => send('action', 'code-select-lang') }
        ]},
        { label: '警告框', submenu: [
          { label: 'Note', click: () => send('insert-format', 'alert-note') },
          { label: 'Tip', click: () => send('insert-format', 'alert-tip') },
          { label: 'Important', click: () => send('insert-format', 'alert-important') },
          { label: 'Warning', click: () => send('insert-format', 'alert-warning') },
          { label: 'Caution', click: () => send('insert-format', 'alert-caution') }
        ]},
        { type: 'separator' },
        { label: '引用', accelerator: 'CmdOrCtrl+Shift+Q', click: () => send('insert-format', 'quote') },
        { type: 'separator' },
        { label: '有序列表', accelerator: 'CmdOrCtrl+Shift+[', click: () => send('insert-format', 'ordered-list') },
        { label: '无序列表', accelerator: 'CmdOrCtrl+Shift+]', click: () => send('insert-format', 'bullet-list') },
        { label: '任务列表', accelerator: 'CmdOrCtrl+Shift+X', click: () => send('insert-format', 'task-list') },
        { label: '任务状态', submenu: [
          { label: '标记完成', click: () => send('action', 'task-done') },
          { label: '标记未完成', click: () => send('action', 'task-undone') }
        ]},
        { label: '列表缩进', submenu: [
          { label: '增加缩进', accelerator: 'Tab', click: () => send('action', 'indent') },
          { label: '减少缩进', accelerator: 'Shift+Tab', click: () => send('action', 'outdent') }
        ]},
        { type: 'separator' },
        { label: '在上方插入段落', click: () => send('action', 'insert-paragraph-above') },
        { label: '在下方插入段落', click: () => send('action', 'insert-paragraph-below') },
        { type: 'separator' },
        { label: '链接引用', click: () => send('insert-format', 'link-reference') },
        { label: '脚注', click: () => send('insert-format', 'footnote') },
        { type: 'separator' },
        { label: '水平分割线', click: () => send('insert-format', 'horizontal-rule') },
        { label: '内容目录', click: () => send('insert-format', 'toc') },
        { label: 'YAML Front Matter', click: () => send('insert-format', 'yaml-front-matter') },
        { type: 'separator' },
        { label: '图表', submenu: [
          { label: 'Mermaid 流程图', click: () => send('insert-format', 'mermaid-flowchart') },
          { label: 'Mermaid 时序图', click: () => send('insert-format', 'mermaid-sequence') },
          { label: 'Mermaid 甘特图', click: () => send('insert-format', 'mermaid-gantt') },
          { label: 'Mermaid 类图', click: () => send('insert-format', 'mermaid-class') },
          { label: 'Mermaid 状态图', click: () => send('insert-format', 'mermaid-state') },
          { label: 'Mermaid 饼图', click: () => send('insert-format', 'mermaid-pie') },
          { label: 'Mermaid 用户旅程', click: () => send('insert-format', 'mermaid-journey') },
          { type: 'separator' },
          { label: '脑图 (mindmap)', click: () => send('insert-format', 'mindmap') },
          { label: 'ECharts 图表', click: () => send('insert-format', 'echarts') },
          { label: 'Graphviz (dot)', click: () => send('insert-format', 'graphviz') },
          { label: '五线谱 (abc)', click: () => send('insert-format', 'abc-notation') }
        ]}
      ]
    },
    // ========== 格式(O) ==========
    {
      label: '格式(O)',
      submenu: [
        { label: '加粗', accelerator: 'CmdOrCtrl+B', click: () => send('insert-format', 'bold') },
        { label: '斜体', accelerator: 'CmdOrCtrl+I', click: () => send('insert-format', 'italic') },
        { label: '下划线', accelerator: 'CmdOrCtrl+U', click: () => send('insert-format', 'underline') },
        { label: '代码', accelerator: 'CmdOrCtrl+Shift+`', click: () => send('insert-format', 'inline-code') },
        { type: 'separator' },
        { label: '删除线', accelerator: 'Alt+Shift+5', click: () => send('insert-format', 'strikethrough') },
        { label: '注释', click: () => send('insert-format', 'comment') },
        { type: 'separator' },
        { label: '超链接', accelerator: 'CmdOrCtrl+K', click: () => send('insert-format', 'link') },
        { label: '链接操作', submenu: [
          { label: '打开链接', click: () => send('action', 'open-link') },
          { label: '复制链接地址', click: () => send('action', 'copy-link') },
          { label: '移除超链接', click: () => send('action', 'remove-link') }
        ]},
        { label: '图像', submenu: [
          { label: '插入图片...', click: () => send('insert-format', 'image') },
          { label: '从剪贴板粘贴图片', click: () => send('action', 'paste-image') },
          { label: '插入本地图片...', click: () => send('action', 'insert-local-image') }
        ]},
        { type: 'separator' },
        { label: '高亮', click: () => send('insert-format', 'highlight') },
        { label: '上标', click: () => send('insert-format', 'superscript') },
        { label: '下标', click: () => send('insert-format', 'subscript') },
        { type: 'separator' },
        { label: '清除样式', accelerator: 'CmdOrCtrl+\\', click: () => send('insert-format', 'clear-format') }
      ]
    },
    // ========== 视图(V) ==========
    {
      label: '视图(V)',
      submenu: [
        { label: '显示 / 隐藏侧边栏', accelerator: 'CmdOrCtrl+Shift+L', click: () => { settings.sidebarVisible = !settings.sidebarVisible; saveSettings(); send('toggle-sidebar', settings.sidebarVisible); buildMenu(); } },
        { label: '大纲', accelerator: 'CmdOrCtrl+Shift+1', click: () => send('sidebar-tab', 'outline') },
        { label: '文档列表', accelerator: 'CmdOrCtrl+Shift+2', click: () => send('sidebar-tab', 'documents') },
        { label: '文件树', accelerator: 'CmdOrCtrl+Shift+3', click: () => send('sidebar-tab', 'file-tree') },
        { label: '搜索', accelerator: 'CmdOrCtrl+Shift+F', click: () => send('sidebar-tab', 'search') },
        { type: 'separator' },
        { label: '源代码模式', accelerator: 'CmdOrCtrl+/', click: () => send('toggle-source-mode', null) },
        { type: 'separator' },
        { label: '专注模式', accelerator: 'F8', type: 'checkbox', checked: settings.focusMode, click: (item) => { settings.focusMode = item.checked; saveSettings(); send('toggle-focus', item.checked); } },
        { label: '打字机模式', accelerator: 'F9', type: 'checkbox', checked: settings.typewriterMode, click: (item) => { settings.typewriterMode = item.checked; saveSettings(); send('toggle-typewriter', item.checked); } },
        { type: 'separator' },
        { label: '显示状态栏', type: 'checkbox', checked: settings.statusBarVisible !== false, click: (item) => { settings.statusBarVisible = item.checked; saveSettings(); send('toggle-statusbar', item.checked); } },
        { label: '字数统计窗口', click: () => send('action', 'word-count-dialog') },
        { type: 'separator' },
        { label: '切换全屏', accelerator: 'F11', click: () => { if (win) win.setFullScreen(!win.isFullScreen()); } },
        { label: '保持窗口在最前端', type: 'checkbox', checked: settings.alwaysOnTop, click: (item) => { settings.alwaysOnTop = item.checked; saveSettings(); if (win) win.setAlwaysOnTop(item.checked); } },
        { type: 'separator' },
        { label: '实际大小', accelerator: 'CmdOrCtrl+Shift+9', click: () => { if (win) win.webContents.setZoomFactor(1); } },
        { label: '放大', accelerator: 'CmdOrCtrl+Shift+=', role: 'zoomIn' },
        { label: '缩小', accelerator: 'CmdOrCtrl+Shift+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: '应用内窗口切换', accelerator: 'CmdOrCtrl+Tab', click: () => { /* cycle windows */ } },
        { type: 'separator' },
        { label: '开发者工具', accelerator: 'Shift+F12', click: () => { if (win) win.webContents.toggleDevTools(); } }
      ]
    },
    // ========== 帮助(H) ==========
    {
      label: '帮助(H)',
      submenu: [
        { label: 'Markdown 语法参考', click: () => shell.openExternal('https://b3log.org/vditor/demo/index.html') },
        { label: '快捷键参考', click: () => send('action', 'show-shortcuts') },
        { type: 'separator' },
        { label: '检查更新...', click: () => send('action', 'check-update') },
        { label: '更新日志', click: () => shell.openExternal('https://github.com/Vanessa219/vditor/blob/master/CHANGELOG.md') },
        { type: 'separator' },
        { label: '关于 Vditor Desktop', click: showAbout }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function sendToWindow(channel, data) {
  const win = getMainWindow();
  if (win) win.webContents.send(channel, data);
}

function showAbout() {
  const win = getMainWindow();
  dialog.showMessageBox(win, {
    type: 'info', title: '关于 Vditor Desktop',
    message: 'Vditor Desktop v1.0.0',
    detail: '一个基于 Vditor 的类 Typora Markdown 桌面编辑器\n\n● 所见即所得 / 即时渲染 / 分屏预览 / 源码模式\n● 文件树侧边栏 & 大纲导航 & 搜索\n● 导出 HTML / PDF\n● 多主题 (Github / Newsprint / Night / Pixyll / Whitey)\n● 专注模式 & 打字机模式\n● 智能标点 & 表格操作 & 数学公式\n\n基于 Electron + Vditor\nMIT License'
  });
}

// --- IPC Handlers ---

ipcMain.on('content-modified', (event, modified) => { isContentModified = modified; updateTitle(); });
ipcMain.on('open-external-link', (event, url) => { shell.openExternal(url); });
ipcMain.on('write-clipboard-html', (event, { html, text }) => {
  clipboard.write({ html: html, text: text || '' });
});
ipcMain.on('open-file-from-tree', (event, filePath) => { openFile(filePath); });
ipcMain.on('drop-file', (event, filePath) => { openFile(filePath); });
ipcMain.on('request-folder-tree', (event, folderPath) => {
  const tree = readFolderTree(folderPath);
  event.reply('folder-tree-data', { folderPath, tree });
});
ipcMain.on('save-image-local', (event, { imageData, fileName }) => {
  const relativePath = saveImageToLocal(imageData, fileName);
  event.reply('image-saved', relativePath);
});
ipcMain.handle('get-settings', () => settings);
ipcMain.handle('update-settings', (event, newSettings) => {
  Object.assign(settings, newSettings); saveSettings(); startAutoSave(); return settings;
});
ipcMain.handle('read-folder', (event, folderPath) => readFolderTree(folderPath));
ipcMain.on('show-file-in-folder', (event, filePath) => { shell.showItemInFolder(filePath); });
ipcMain.on('open-insert-image-dialog', async (event) => {
  const win = getMainWindow();
  if (!win) return;
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'] }]
  });
  if (!result.canceled && result.filePaths[0]) {
    event.reply('local-image-selected', result.filePaths[0]);
  }
});

// --- System theme ---
nativeTheme.on('updated', () => {
  if (settings.appTheme === 'system') {
    sendToWindow('switch-theme', nativeTheme.shouldUseDarkColors ? 'dark' : 'classic');
  }
});

// --- App Lifecycle ---

app.whenReady().then(() => {
  loadSettings();
  createWindow();
  buildMenu();
  startAutoSave();
  const filePath = process.argv.find(arg => /\.(md|markdown|mdown|mkd|txt)$/i.test(arg));
  if (filePath && fs.existsSync(filePath)) setTimeout(() => openFile(path.resolve(filePath)), 500);
  if (settings.alwaysOnTop) { const win = getMainWindow(); if (win) win.setAlwaysOnTop(true); }
});

app.on('window-all-closed', () => { stopAutoSave(); if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (windows.length === 0) createWindow(); });
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  const win = getMainWindow();
  if (win) openFileInWindow(win, filePath); else createWindow(filePath);
});

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) { app.quit(); }
else {
  app.on('second-instance', (event, argv) => {
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      const fp = argv.find(arg => /\.(md|markdown|mdown|mkd|txt)$/i.test(arg));
      if (fp && fs.existsSync(fp)) openFileInWindow(win, path.resolve(fp));
    }
  });
}
