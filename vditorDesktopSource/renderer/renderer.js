// ============================================================
// Vditor Desktop - Renderer Process
// A Typora-like Markdown editor powered by Vditor
// ============================================================

let vditor = null;
let currentMode = 'wysiwyg'; // wysiwyg | ir | sv
let currentContentTheme = 'github';
let currentAppTheme = 'classic';
let toolbarVisible = true;
let sidebarVisible = true;
let statusBarVisible = true;
let focusMode = false;
let typewriterMode = false;
let currentFolderPath = null;
let sourceMode = false;
let currentContent = ''; // Keeps content in sync between modes

const modeNames = { wysiwyg: '所见即所得', ir: '即时渲染', sv: '分屏预览', source: '源代码' };

// ============================================================
// Editor Initialization
// ============================================================

function initEditor(content, preserveSource) {
  if (content !== undefined) {
    currentContent = content;
  }

  // If entering source mode, don't init vditor
  if (sourceMode) {
    showSourceEditor();
    return;
  }

  hideSourceEditor();
  const editorEl = document.getElementById('vditor');
  editorEl.classList.remove('hidden');

  if (vditor) {
    vditor.destroy();
    vditor = null;
  }

  vditor = new Vditor('vditor', {
    mode: currentMode,
    theme: currentAppTheme === 'dark' ? 'dark' : 'classic',
    icon: 'material',
    cache: { enable: false },
    toolbar: toolbarVisible ? [
      'headings', 'bold', 'italic', 'strike', '|',
      'line', 'quote', 'list', 'ordered-list', 'check', '|',
      'code', 'inline-code', 'table', 'link', 'upload', '|',
      'undo', 'redo', '|',
      'outline', 'fullscreen', 'edit-mode',
      { name: 'more', toolbar: ['both', 'export', 'preview'] }
    ] : [],
    toolbarConfig: { pin: true },
    preview: {
      theme: { current: currentContentTheme, path: '../node_modules/vditor/dist/css/content-theme' },
      markdown: {
        toc: true,
        footnotes: true,
        mark: true,
        autoSpace: true,
        fixTermTypo: false,
        chinesePunct: false,
        paragraphBeginningSpace: false
      },
      math: {
        engine: 'KaTeX',
        inlineDigit: true
      },
      hljs: {
        lineNumber: true,
        style: currentAppTheme === 'dark' ? 'native' : 'github',
        defaultLang: ''
      },
      render: {
        media: { enable: true },
        list: { isOpen: true }
      }
    },
    outline: { enable: false, position: 'right' },
    counter: { enable: false },
    typewriterMode: typewriterMode,
    placeholder: '开始写作...',
    value: currentContent,
    after: () => {
      updateStatusBar();
      generateOutline();
    },
    input: (value) => {
      currentContent = value;
      window.electronAPI.contentModified(true);
      updateStatusBar();
      debounceGenerateOutline();
    },
    upload: {
      handler: (files) => {
        for (const file of files) {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (vditor) vditor.insertValue(`![${file.name}](${e.target.result})`);
            };
            reader.readAsDataURL(file);
          }
        }
        return null;
      }
    }
  });
}

// ============================================================
// Source Code Mode - Seamless toggle
// ============================================================

function showSourceEditor() {
  document.getElementById('vditor').classList.add('hidden');
  const sourceEl = document.getElementById('source-editor');
  sourceEl.classList.remove('hidden');
  sourceEl.value = currentContent;
  sourceEl.focus();
  updateStatusBar();
  generateOutline();
}

function hideSourceEditor() {
  document.getElementById('source-editor').classList.add('hidden');
  document.getElementById('vditor').classList.remove('hidden');
}

function toggleSourceMode() {
  if (sourceMode) {
    // Exit source mode: sync content back
    currentContent = document.getElementById('source-editor').value;
    sourceMode = false;
    initEditor(currentContent);
  } else {
    // Enter source mode: sync content from vditor
    if (vditor) currentContent = vditor.getValue();
    sourceMode = true;
    showSourceEditor();
  }
  updateStatusBar();
}

// Source editor input tracking
document.getElementById('source-editor').addEventListener('input', (e) => {
  currentContent = e.target.value;
  window.electronAPI.contentModified(true);
  updateStatusBar();
  debounceGenerateOutline();
});

// Source editor tab support
document.getElementById('source-editor').addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const el = e.target;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    el.value = el.value.substring(0, start) + '    ' + el.value.substring(end);
    el.selectionStart = el.selectionEnd = start + 4;
    currentContent = el.value;
    window.electronAPI.contentModified(true);
  }
});

// ============================================================
// Get current content (any mode)
// ============================================================

function getCurrentContent() {
  if (sourceMode) return document.getElementById('source-editor').value;
  if (vditor) return vditor.getValue();
  return currentContent;
}

// ============================================================
// Status Bar
// ============================================================

function updateStatusBar() {
  const content = getCurrentContent();
  const chars = content.length;
  const cjk = (content.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const totalWords = words + cjk;
  const lines = content.split('\n').length;
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim()).length;
  const readTime = Math.max(1, Math.ceil(totalWords / 275));

  document.getElementById('status-mode').textContent = modeNames[sourceMode ? 'source' : currentMode];
  document.getElementById('status-chars').textContent = `${chars} 字符`;
  document.getElementById('status-words').textContent = `${totalWords} 词`;
  document.getElementById('status-lines').textContent = `${lines} 行`;
  document.getElementById('status-paragraphs').textContent = `${paragraphs} 段`;
  document.getElementById('status-read-time').textContent = `阅读 ~${readTime} 分钟`;
}

// ============================================================
// Outline
// ============================================================

let outlineTimer = null;
function debounceGenerateOutline() {
  if (outlineTimer) clearTimeout(outlineTimer);
  outlineTimer = setTimeout(generateOutline, 400);
}

function generateOutline() {
  const el = document.getElementById('outline-content');
  if (!el) return;
  const content = getCurrentContent();
  const headings = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^(#{1,6})\s+(.+)/);
    if (m) headings.push({ level: m[1].length, text: m[2].replace(/[#*`\[\]]/g, '').trim() });
  }
  if (headings.length === 0) {
    el.innerHTML = '<div class="outline-empty">暂无标题</div>';
    return;
  }
  el.innerHTML = headings.map(h => {
    const indent = (h.level - 1) * 14;
    return `<div class="outline-item outline-h${h.level}" style="padding-left:${indent}px" data-text="${escapeAttr(h.text)}">${escapeHtml(h.text)}</div>`;
  }).join('');

  el.querySelectorAll('.outline-item').forEach(item => {
    item.addEventListener('click', () => {
      const text = item.dataset.text;
      if (!sourceMode && vditor) {
        const area = document.querySelector('.vditor-wysiwyg, .vditor-ir, .vditor-sv');
        if (area) {
          for (const heading of area.querySelectorAll('h1,h2,h3,h4,h5,h6')) {
            if (heading.textContent.trim().includes(text)) {
              heading.scrollIntoView({ behavior: 'smooth', block: 'center' });
              break;
            }
          }
        }
      } else if (sourceMode) {
        // Scroll source editor to heading line
        const lines = currentContent.split('\n');
        let pos = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(text)) {
            const el = document.getElementById('source-editor');
            el.selectionStart = el.selectionEnd = pos;
            el.focus();
            el.scrollTop = i * 20;
            break;
          }
          pos += lines[i].length + 1;
        }
      }
    });
  });
}

// ============================================================
// Sidebar
// ============================================================

function switchSidebarTab(tab) {
  document.querySelectorAll('.sidebar-tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.sidebar-tab-btn').forEach(el => el.classList.remove('active'));
  const tabContent = document.getElementById(`tab-${tab}`);
  if (tabContent) tabContent.classList.remove('hidden');
  const tabBtn = document.querySelector(`.sidebar-tab-btn[data-tab="${tab}"]`);
  if (tabBtn) tabBtn.classList.add('active');
  if (tab === 'file-tree' && currentFolderPath) window.electronAPI.requestFolderTree(currentFolderPath);
  if (tab === 'outline') generateOutline();
}

function renderFileTree(tree, container) {
  container.innerHTML = '';
  if (!tree || tree.length === 0) {
    container.innerHTML = '<div class="file-tree-empty">没有 Markdown 文件</div>';
    return;
  }
  const ul = createTreeList(tree);
  container.appendChild(ul);
}

function createTreeList(items) {
  const ul = document.createElement('ul');
  ul.className = 'tree-list';
  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'tree-item';
    if (item.type === 'directory') {
      li.innerHTML = `<div class="tree-node tree-folder"><span class="tree-arrow">▶</span><span class="tree-name">${escapeHtml(item.name)}</span></div>`;
      if (item.children && item.children.length > 0) {
        li.appendChild(createTreeList(item.children));
      }
      li.querySelector('.tree-node').addEventListener('click', () => li.classList.toggle('collapsed'));
    } else {
      li.innerHTML = `<div class="tree-node tree-file"><span class="tree-icon">📄</span><span class="tree-name">${escapeHtml(item.name)}</span></div>`;
      li.querySelector('.tree-node').addEventListener('click', () => window.electronAPI.openFileFromTree(item.path));
      li.querySelector('.tree-node').addEventListener('contextmenu', (e) => { e.preventDefault(); window.electronAPI.showFileInFolder(item.path); });
    }
    ul.appendChild(li);
  }
  return ul;
}

// Search
function performSearch(query) {
  const resultsEl = document.getElementById('search-results');
  if (!query.trim()) { resultsEl.innerHTML = '<div class="search-empty">输入关键词搜索</div>'; return; }
  const content = getCurrentContent();
  const lines = content.split('\n');
  const matches = [];
  const lq = query.toLowerCase();
  lines.forEach((line, i) => { if (line.toLowerCase().includes(lq)) matches.push({ line: i + 1, text: line.trim().substring(0, 100) }); });
  if (matches.length === 0) { resultsEl.innerHTML = '<div class="search-empty">未找到</div>'; return; }
  resultsEl.innerHTML = matches.map(m => `<div class="search-result-item" data-line="${m.line}"><span class="search-line-num">${m.line}</span>${escapeHtml(m.text)}</div>`).join('');
  resultsEl.querySelectorAll('.search-result-item').forEach(el => {
    el.addEventListener('click', () => {
      const lineNum = parseInt(el.dataset.line);
      if (sourceMode) {
        const editor = document.getElementById('source-editor');
        const lines = editor.value.split('\n');
        let pos = 0;
        for (let i = 0; i < lineNum - 1 && i < lines.length; i++) pos += lines[i].length + 1;
        editor.selectionStart = editor.selectionEnd = pos;
        editor.focus();
        editor.scrollTop = (lineNum - 1) * 20;
      }
    });
  });
}

// ============================================================
// Find & Replace
// ============================================================

let findMatches = [];
let findIndex = -1;

function showFindBar(withReplace) {
  document.getElementById('find-bar').classList.remove('hidden');
  document.getElementById('replace-row').classList.toggle('hidden', !withReplace);
  document.getElementById('find-input').focus();
  document.getElementById('find-input').select();
}

function hideFindBar() {
  document.getElementById('find-bar').classList.add('hidden');
  findMatches = []; findIndex = -1;
  document.getElementById('find-count').textContent = '0/0';
}

function doFind() {
  const q = document.getElementById('find-input').value;
  if (!q) { document.getElementById('find-count').textContent = '0/0'; findMatches = []; return; }
  const content = getCurrentContent();
  findMatches = []; let idx = 0;
  const lc = content.toLowerCase(), lq = q.toLowerCase();
  while ((idx = lc.indexOf(lq, idx)) !== -1) { findMatches.push(idx); idx += lq.length; }
  findIndex = findMatches.length > 0 ? 0 : -1;
  updateFindCount();
}

function findNext() { if (findMatches.length === 0) return; findIndex = (findIndex + 1) % findMatches.length; updateFindCount(); }
function findPrev() { if (findMatches.length === 0) return; findIndex = (findIndex - 1 + findMatches.length) % findMatches.length; updateFindCount(); }
function updateFindCount() { document.getElementById('find-count').textContent = findMatches.length > 0 ? `${findIndex + 1}/${findMatches.length}` : '0/0'; }

function doReplace() {
  const fv = document.getElementById('find-input').value;
  const rv = document.getElementById('replace-input').value;
  if (!fv || findMatches.length === 0 || findIndex < 0) return;
  let content = getCurrentContent();
  const idx = findMatches[findIndex];
  content = content.substring(0, idx) + rv + content.substring(idx + fv.length);
  setContent(content);
  doFind();
}

function doReplaceAll() {
  const fv = document.getElementById('find-input').value;
  const rv = document.getElementById('replace-input').value;
  if (!fv) return;
  let content = getCurrentContent().split(fv).join(rv);
  setContent(content);
  doFind();
}

function setContent(content) {
  currentContent = content;
  if (sourceMode) document.getElementById('source-editor').value = content;
  else if (vditor) vditor.setValue(content);
  window.electronAPI.contentModified(true);
}

document.getElementById('find-input').addEventListener('input', doFind);
document.getElementById('btn-find-next').addEventListener('click', findNext);
document.getElementById('btn-find-prev').addEventListener('click', findPrev);
document.getElementById('btn-find-close').addEventListener('click', hideFindBar);
document.getElementById('btn-replace').addEventListener('click', doReplace);
document.getElementById('btn-replace-all').addEventListener('click', doReplaceAll);
document.getElementById('find-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.shiftKey ? findPrev() : findNext(); e.preventDefault(); }
  if (e.key === 'Escape') hideFindBar();
});

// ============================================================
// Format / Insert
// ============================================================

function insertFormat(format) {
  const insertions = {
    'heading1': '\n# ', 'heading2': '\n## ', 'heading3': '\n### ',
    'heading4': '\n#### ', 'heading5': '\n##### ', 'heading6': '\n###### ',
    'paragraph': '\n\n',
    'bold': '**粗体**', 'italic': '*斜体*', 'underline': '<u>下划线</u>',
    'strikethrough': '~~删除线~~', 'inline-code': '`代码`', 'inline-math': '$E=mc^2$',
    'highlight': '==高亮==', 'superscript': '^上标^', 'subscript': '~下标~',
    'comment': '<!-- 注释 -->', 'link': '[链接](https://)', 'image': '![图片]()',
    'quote': '\n> 引用\n', 'code-block': '\n```\n\n```\n',
    'math-block': '\n$$\n\n$$\n',
    'table': '\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n',
    'ordered-list': '\n1. \n2. \n3. \n', 'bullet-list': '\n- \n- \n- \n',
    'task-list': '\n- [ ] 待办\n- [ ] 待办\n- [x] 已完成\n',
    'horizontal-rule': '\n---\n', 'toc': '\n[TOC]\n',
    'footnote': '[^1]\n\n[^1]: 脚注内容',
    'link-reference': '[文本][ref]\n\n[ref]: https://',
    'yaml-front-matter': '---\ntitle: \ndate: \ntags: []\n---\n\n',
    'alert-note': '\n> [!NOTE]\n> \n', 'alert-tip': '\n> [!TIP]\n> \n',
    'alert-important': '\n> [!IMPORTANT]\n> \n', 'alert-warning': '\n> [!WARNING]\n> \n',
    'alert-caution': '\n> [!CAUTION]\n> \n',
    'mermaid-flowchart': '\n```mermaid\ngraph TD\n    A[开始] --> B{判断}\n    B -->|Yes| C[结果1]\n    B -->|No| D[结果2]\n```\n',
    'mermaid-sequence': '\n```mermaid\nsequenceDiagram\n    Alice->>John: Hello\n    John-->>Alice: Hi!\n```\n',
    'mermaid-gantt': '\n```mermaid\ngantt\n    title 项目计划\n    dateFormat YYYY-MM-DD\n    section 阶段A\n    任务1 :a1, 2024-01-01, 7d\n    任务2 :after a1, 5d\n```\n',
    'mermaid-class': '\n```mermaid\nclassDiagram\n    class Animal {\n        +String name\n        +int age\n        +makeSound()\n    }\n    class Dog {\n        +fetch()\n    }\n    Animal <|-- Dog\n```\n',
    'mermaid-state': '\n```mermaid\nstateDiagram-v2\n    [*] --> 待处理\n    待处理 --> 处理中: 开始\n    处理中 --> 已完成: 完成\n    处理中 --> 已取消: 取消\n    已完成 --> [*]\n    已取消 --> [*]\n```\n',
    'mermaid-pie': '\n```mermaid\npie title 数据占比\n    "类别A" : 40\n    "类别B" : 30\n    "类别C" : 20\n    "其他" : 10\n```\n',
    'mermaid-journey': '\n```mermaid\njourney\n    title 用户旅程\n    section 注册\n      打开网站: 5: 用户\n      填写信息: 3: 用户\n      验证邮箱: 2: 用户, 系统\n    section 使用\n      登录: 5: 用户\n      浏览功能: 4: 用户\n```\n',
    'mindmap': '\n```mindmap\n- 中心主题\n  - 分支1\n    - 子主题\n  - 分支2\n```\n',
    'echarts': '\n```echarts\n{\n  "xAxis": {"type": "category", "data": ["A","B","C"]},\n  "yAxis": {"type": "value"},\n  "series": [{"data": [120, 200, 150], "type": "bar"}]\n}\n```\n',
    'graphviz': '\n```graphviz\ndigraph G {\n    A -> B;\n    B -> C;\n    C -> A;\n}\n```\n',
    'abc-notation': '\n```abc\nX:1\nT:Example\nM:4/4\nL:1/4\nK:C\nCDEF|GABc|\n```\n'
  };

  const text = insertions[format];
  if (!text) return;

  if (sourceMode) {
    const el = document.getElementById('source-editor');
    const start = el.selectionStart;
    el.value = el.value.substring(0, start) + text + el.value.substring(el.selectionEnd);
    el.selectionStart = el.selectionEnd = start + text.length;
    currentContent = el.value;
    el.focus();
  } else if (vditor) {
    vditor.insertValue(text);
    currentContent = vditor.getValue();
  }
  window.electronAPI.contentModified(true);
  updateStatusBar();
  debounceGenerateOutline();
}

// ============================================================
// Actions
// ============================================================

function handleAction(action) {
  switch (action) {
    case 'copy-as-markdown': navigator.clipboard.writeText(getCurrentContent()); break;
    case 'copy-as-html': if (vditor) navigator.clipboard.writeText(vditor.getHTML()); break;
    case 'copy-plain-text': navigator.clipboard.writeText(getCurrentContent().replace(/[#*`~\[\]()>|\-_=+]/g, '')); break;
    case 'copy-simplified': {
      const c = getCurrentContent();
      const simplified = c.replace(/^#{1,6}\s+/gm, '').replace(/[*_~`]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      navigator.clipboard.writeText(simplified);
      break;
    }
    // === Copy for platforms ===
    case 'copy-for-wechat': {
      // WeChat MP: HTML with inline styles
      if (vditor) {
        const html = wrapForWechat(vditor.getHTML());
        const text = getCurrentContent();
        window.electronAPI.writeClipboardHTML(html, text);
      }
      break;
    }
    case 'copy-for-feishu': {
      // Feishu: For mermaid/code blocks, keep as code; for rest, use HTML
      const content = getCurrentContent();
      const mermaidBlocks = content.match(/```mermaid[\s\S]*?```/g);
      if (mermaidBlocks && mermaidBlocks.length > 0) {
        // Feishu supports pasting markdown with code blocks as "text drawing"
        // Copy the raw markdown so Feishu can interpret mermaid blocks
        navigator.clipboard.writeText(content);
      } else if (vditor) {
        const html = vditor.getHTML();
        window.electronAPI.writeClipboardHTML(html, content);
      }
      break;
    }
    case 'copy-for-notion': {
      // Notion: paste markdown directly, Notion parses it
      navigator.clipboard.writeText(getCurrentContent());
      break;
    }
    case 'copy-for-yuque': {
      // Yuque: HTML rich text
      if (vditor) {
        const html = vditor.getHTML();
        const text = getCurrentContent();
        window.electronAPI.writeClipboardHTML(html, text);
      }
      break;
    }
    case 'copy-for-zhihu': {
      // Zhihu: HTML rich text
      if (vditor) {
        const html = vditor.getHTML();
        const text = getCurrentContent();
        window.electronAPI.writeClipboardHTML(html, text);
      }
      break;
    }
    case 'paste-plain-text':
      navigator.clipboard.readText().then(text => {
        if (sourceMode) { const el = document.getElementById('source-editor'); const s = el.selectionStart; el.value = el.value.substring(0, s) + text + el.value.substring(el.selectionEnd); currentContent = el.value; }
        else if (vditor) vditor.insertValue(text);
        window.electronAPI.contentModified(true);
      });
      break;
    case 'heading-up': case 'heading-down':
      let c = getCurrentContent();
      if (action === 'heading-up') c = c.replace(/^(#{1,5}) /m, (_, h) => '#' + h + ' ');
      else c = c.replace(/^(#{2,6}) /m, (_, h) => h.substring(1) + ' ');
      setContent(c); break;
    case 'insert-paragraph-above': case 'insert-paragraph-below':
      if (sourceMode) { const el = document.getElementById('source-editor'); const s = el.selectionStart; el.value = el.value.substring(0, s) + '\n\n' + el.value.substring(s); currentContent = el.value; }
      else if (vditor) vditor.insertValue('\n\n');
      window.electronAPI.contentModified(true); break;
    case 'find-next': findNext(); break;
    case 'find-prev': findPrev(); break;
    case 'word-count-dialog': showWordCountDialog(); break;
    case 'show-shortcuts': showShortcutsDialog(); break;
    case 'insert-local-image': window.electronAPI.openInsertImageDialog(); break;
    case 'paste-image':
      navigator.clipboard.read().then(items => {
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              item.getType(type).then(blob => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  if (vditor) vditor.insertValue(`![粘贴图片](${e.target.result})`);
                };
                reader.readAsDataURL(blob);
              });
            }
          }
        }
      }).catch(() => {}); break;
    case 'emoji-picker': if (vditor) vditor.insertValue('😀'); break;
    default: break;
  }
}

// Helper: Copy HTML as rich text (fallback using selection)
function copyAsRichText(html) {
  // Primary method: use Electron clipboard via IPC
  window.electronAPI.writeClipboardHTML(html, '');
}

// Helper: Wrap HTML with inline styles for WeChat MP
function wrapForWechat(html) {
  // WeChat doesn't support external CSS, add basic inline styles
  return html
    .replace(/<h1/g, '<h1 style="font-size:24px;font-weight:bold;margin:20px 0 10px;border-bottom:1px solid #eee;padding-bottom:8px"')
    .replace(/<h2/g, '<h2 style="font-size:20px;font-weight:bold;margin:18px 0 8px;border-bottom:1px solid #eee;padding-bottom:6px"')
    .replace(/<h3/g, '<h3 style="font-size:18px;font-weight:bold;margin:16px 0 6px"')
    .replace(/<p>/g, '<p style="margin:8px 0;line-height:1.8;font-size:15px">')
    .replace(/<code>/g, '<code style="background:#f5f5f5;padding:2px 6px;border-radius:3px;font-size:13px;color:#c7254e">')
    .replace(/<pre>/g, '<pre style="background:#f5f5f5;padding:16px;border-radius:4px;overflow-x:auto;font-size:13px;line-height:1.5">')
    .replace(/<blockquote>/g, '<blockquote style="border-left:4px solid #ddd;padding:8px 16px;margin:10px 0;color:#666;background:#f9f9f9">')
    .replace(/<table>/g, '<table style="border-collapse:collapse;width:100%;margin:10px 0">')
    .replace(/<th/g, '<th style="border:1px solid #ddd;padding:8px 12px;background:#f5f5f5;font-weight:bold"')
    .replace(/<td/g, '<td style="border:1px solid #ddd;padding:8px 12px"')
    .replace(/<img/g, '<img style="max-width:100%;border-radius:4px"')
    .replace(/<a /g, '<a style="color:#576b95;text-decoration:none" ');
}

// ============================================================
// Dialogs
// ============================================================

function showWordCountDialog() {
  const content = getCurrentContent();
  const chars = content.length;
  const charsNoSpace = content.replace(/\s/g, '').length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const cjk = (content.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const lines = content.split('\n').length;
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim()).length;
  const readTime = Math.max(1, Math.ceil((words + cjk) / 275));
  document.getElementById('wc-chars').textContent = chars;
  document.getElementById('wc-chars-nospace').textContent = charsNoSpace;
  document.getElementById('wc-words').textContent = words;
  document.getElementById('wc-cjk').textContent = cjk;
  document.getElementById('wc-lines').textContent = lines;
  document.getElementById('wc-paragraphs').textContent = paragraphs;
  document.getElementById('wc-read-time').textContent = `${readTime} 分钟`;
  document.getElementById('word-count-overlay').classList.remove('hidden');
}

function showShortcutsDialog() {
  document.getElementById('shortcuts-overlay').classList.remove('hidden');
}

// ============================================================
// IPC Handlers
// ============================================================

window.electronAPI.onInitSettings((s) => {
  currentMode = s.mode || 'wysiwyg';
  currentContentTheme = s.contentTheme || 'github';
  currentAppTheme = s.appTheme || 'light';
  sidebarVisible = s.sidebarVisible !== false;
  statusBarVisible = s.statusBarVisible !== false;
  focusMode = s.focusMode || false;
  typewriterMode = s.typewriterMode || false;
  document.body.className = `theme-${currentAppTheme === 'dark' ? 'dark' : 'classic'}`;
  document.getElementById('sidebar').classList.toggle('hidden', !sidebarVisible);
  document.getElementById('status-bar').classList.toggle('hidden', !statusBarVisible);
  if (focusMode) document.body.classList.add('focus-mode');
  if (s.lastOpenFolder) { currentFolderPath = s.lastOpenFolder; window.electronAPI.requestFolderTree(s.lastOpenFolder); }
});

window.electronAPI.onFileNew(() => {
  sourceMode = false; currentContent = ''; initEditor('');
});

window.electronAPI.onFileOpened((data) => {
  currentContent = data.content;
  if (sourceMode) {
    document.getElementById('source-editor').value = currentContent;
    updateStatusBar(); generateOutline();
  } else {
    initEditor(currentContent);
  }
});

window.electronAPI.onRequestContent(() => { window.electronAPI.sendContent(getCurrentContent()); });
window.electronAPI.onRequestHTML(() => { window.electronAPI.sendHTML(vditor ? vditor.getHTML() : ''); });

window.electronAPI.onSwitchMode((mode) => {
  if (mode === 'source') {
    if (!sourceMode) toggleSourceMode();
  } else {
    if (sourceMode) {
      currentContent = document.getElementById('source-editor').value;
      sourceMode = false;
      hideSourceEditor();
    }
    currentMode = mode;
    initEditor(currentContent);
  }
  updateStatusBar();
});

// Toggle source mode: Ctrl+/ toggles between source and previous mode
window.electronAPI.onToggleSourceMode(() => {
  toggleSourceMode();
});

window.electronAPI.onSwitchTheme((theme) => {
  currentAppTheme = theme;
  document.body.className = `theme-${theme === 'dark' ? 'dark' : 'classic'}`;
  if (focusMode) document.body.classList.add('focus-mode');
  if (!sourceMode) initEditor(currentContent);
});

window.electronAPI.onSwitchContentTheme((theme) => {
  currentContentTheme = theme;
  if (!sourceMode) initEditor(currentContent);
});

window.electronAPI.onToggleToolbar((v) => { toolbarVisible = v; document.body.classList.toggle('hide-toolbar', !v); });
window.electronAPI.onToggleSidebar((v) => { sidebarVisible = v; document.getElementById('sidebar').classList.toggle('hidden', !v); });
window.electronAPI.onToggleStatusbar((v) => { statusBarVisible = v; document.getElementById('status-bar').classList.toggle('hidden', !v); });
window.electronAPI.onToggleFocus((v) => { focusMode = v; document.body.classList.toggle('focus-mode', v); });
window.electronAPI.onToggleTypewriter((v) => { typewriterMode = v; if (!sourceMode) initEditor(currentContent); });
window.electronAPI.onSidebarTab((tab) => { if (!sidebarVisible) { sidebarVisible = true; document.getElementById('sidebar').classList.remove('hidden'); } switchSidebarTab(tab); });
window.electronAPI.onToggleFind(() => showFindBar(false));
window.electronAPI.onToggleReplace(() => showFindBar(true));
window.electronAPI.onInsertFormat((f) => insertFormat(f));
window.electronAPI.onAction((a) => handleAction(a));
window.electronAPI.onFolderOpened((p) => { currentFolderPath = p; window.electronAPI.requestFolderTree(p); switchSidebarTab('file-tree'); });
window.electronAPI.onFolderTreeData((data) => { renderFileTree(data.tree, document.getElementById('file-tree-content')); });
window.electronAPI.onLocalImageSelected((p) => {
  const imgPath = p.replace(/\\/g, '/');
  if (sourceMode) { const el = document.getElementById('source-editor'); const s = el.selectionStart; el.value = el.value.substring(0, s) + `![](${imgPath})` + el.value.substring(el.selectionEnd); currentContent = el.value; }
  else if (vditor) vditor.insertValue(`![](${imgPath})`);
  window.electronAPI.contentModified(true);
});

// ============================================================
// UI Event Listeners
// ============================================================

document.querySelectorAll('.sidebar-tab-btn').forEach(btn => { btn.addEventListener('click', () => switchSidebarTab(btn.dataset.tab)); });
document.getElementById('sidebar-search-input')?.addEventListener('input', (e) => performSearch(e.target.value));
document.getElementById('btn-refresh-tree')?.addEventListener('click', () => { if (currentFolderPath) window.electronAPI.requestFolderTree(currentFolderPath); });

// Close dialogs
document.querySelectorAll('.dialog-close').forEach(btn => { btn.addEventListener('click', () => btn.closest('.dialog-overlay').classList.add('hidden')); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { hideFindBar(); document.querySelectorAll('.dialog-overlay').forEach(el => el.classList.add('hidden')); } });

// Settings dialog
window.electronAPI.onOpenSettings(async () => {
  const s = await window.electronAPI.getSettings();
  document.getElementById('setting-font-size').value = s.fontSize || 16;
  document.getElementById('setting-line-height').value = s.lineHeight || 1.6;
  document.getElementById('setting-auto-save').checked = s.autoSave !== false;
  document.getElementById('setting-auto-save-interval').value = (s.autoSaveInterval || 30000) / 1000;
  document.getElementById('setting-default-mode').value = s.mode || 'wysiwyg';
  document.getElementById('setting-editor-width').value = s.editorWidth || 'normal';
  document.getElementById('setting-save-image-local').checked = s.saveImageLocal || false;
  document.getElementById('settings-overlay').classList.remove('hidden');
});

document.getElementById('btn-settings-save')?.addEventListener('click', async () => {
  await window.electronAPI.updateSettings({
    fontSize: parseInt(document.getElementById('setting-font-size').value),
    lineHeight: parseFloat(document.getElementById('setting-line-height').value),
    autoSave: document.getElementById('setting-auto-save').checked,
    autoSaveInterval: parseInt(document.getElementById('setting-auto-save-interval').value) * 1000,
    mode: document.getElementById('setting-default-mode').value,
    editorWidth: document.getElementById('setting-editor-width').value,
    saveImageLocal: document.getElementById('setting-save-image-local').checked
  });
  document.getElementById('settings-overlay').classList.add('hidden');
  document.documentElement.style.setProperty('--editor-font-size', document.getElementById('setting-font-size').value + 'px');
  document.documentElement.style.setProperty('--editor-line-height', document.getElementById('setting-line-height').value);
});
document.getElementById('btn-settings-close')?.addEventListener('click', () => document.getElementById('settings-overlay').classList.add('hidden'));
document.getElementById('btn-settings-cancel')?.addEventListener('click', () => document.getElementById('settings-overlay').classList.add('hidden'));

// Drag & Drop
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  document.body.classList.add('drag-over');
}, true);

document.addEventListener('dragleave', (e) => {
  const rect = document.documentElement.getBoundingClientRect();
  if (e.clientX <= rect.left || e.clientX >= rect.right || e.clientY <= rect.top || e.clientY >= rect.bottom) {
    document.body.classList.remove('drag-over');
  }
}, true);

document.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  document.body.classList.remove('drag-over');

  const files = e.dataTransfer.files;
  if (files && files.length > 0) {
    const file = files[0];
    // Use Electron's webUtils API to get the real file path
    let filePath = '';
    try {
      filePath = window.electronAPI.getPathForFile(file);
    } catch (err) {
      // Fallback: try file.path (older Electron)
      filePath = file.path || '';
    }

    if (filePath && /\.(md|markdown|mdown|mkd|txt)$/i.test(filePath)) {
      window.electronAPI.dropFile(filePath);
      return;
    }

    // Image drop
    if (filePath && file.type && file.type.startsWith('image/')) {
      const imgPath = filePath.replace(/\\/g, '/');
      if (sourceMode) {
        const el = document.getElementById('source-editor');
        const s = el.selectionStart;
        el.value = el.value.substring(0, s) + `![${file.name}](file:///${imgPath})` + el.value.substring(el.selectionEnd);
        currentContent = el.value;
      } else if (vditor) {
        vditor.insertValue(`![${file.name}](file:///${imgPath})`);
      }
      window.electronAPI.contentModified(true);
    }
  }
}, true);

// ============================================================
// Utilities
// ============================================================

function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function escapeAttr(s) { return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

// ============================================================
// Init
// ============================================================

initEditor('');
switchSidebarTab('outline');
