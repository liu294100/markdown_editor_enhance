window.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM Loaded. Initializing editor...");

    // --- Global Elements ---
    const editorElement = document.getElementById('editor');
    const previewElement = document.getElementById('preview');
    const editorPane = document.getElementById('editor-pane');
    const tocModal = document.getElementById('toc-modal');
    const tocListContainer = document.getElementById('toc-list-container');
    const tocCloseButton = tocModal?.querySelector('.modal-close-button');
    const tocButton = document.getElementById('btn-toc');
    const headerElement = document.querySelector('.main-header'); // Get header for height calculation

    if (!editorElement || !previewElement || !editorPane) {
        console.error("Essential editor elements not found!");
        return; // Stop execution if critical elements are missing
    }

    // --- Initialize Mermaid ---
    try {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            // securityLevel: 'loose' // Uncomment if complex diagrams fail
        });
    } catch (e) {
        console.error("Mermaid initialization failed:", e);
    }


    // --- Initialize markdown-it ---
    const md = window.markdownit({
        html: true,
        breaks: true,
        linkify: true,
        typographer: true,
        highlight: function (str, lang) {
            // Mermaid specific handling
            if (lang === 'mermaid') {
                try {
                    // No need to parse here, just wrap for Mermaid library
                    // Ensure content is escaped if it might contain HTML chars misinterpreted by browser
                     const escapedStr = md.utils.escapeHtml(str);
                    return `<div class="mermaid">${escapedStr}</div>`;
                } catch (e) {
                     console.error("Error processing Mermaid block for wrapper:", e)
                     return `<pre class="mermaid-error">Error preparing Mermaid block: ${e.message}</pre>`;
                }
            }

            // Standard highlighting
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return '<pre class="hljs"><code>' +
                           hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                           '</code></pre>';
                } catch (e) {
                    console.error(`Highlight.js error for lang ${lang}:`, e);
                }
            }

            // Fallback for unrecognised languages or errors
            return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
        }
    });


    // --- Initialize CodeMirror ---
    let editor;
    try {
        editor = CodeMirror.fromTextArea(editorElement, {
            mode: 'markdown',
            theme: 'material-darker',
            lineNumbers: true,
            lineWrapping: true,
            autofocus: true,
            // Add keymaps if needed, e.g., for Tab indentation
            extraKeys: {
                 "Tab": function(cm) {
                      cm.replaceSelection("  ", "end"); // Example: Insert 2 spaces for Tab
                 }
                 // Add Ctrl+B, Ctrl+I etc. if desired, mapping to button clicks
                 // "Ctrl-B": () => document.getElementById('btn-bold')?.click(),
                 // "Ctrl-I": () => document.getElementById('btn-italic')?.click(),
                 // "Ctrl-L": () => document.getElementById('btn-link')?.click(),
             }
        });
    } catch(e) {
        console.error("CodeMirror initialization failed:", e);
        editorPane.innerHTML = "<p style='color:red; padding: 15px;'>Error initializing code editor. Check console.</p>";
        return; // Stop if editor fails
    }


    // --- Dynamic Height Adjustment ---
    function adjustEditorHeight() {
        const headerHeight = headerElement ? headerElement.offsetHeight : 84; // Use measured or fallback
        const newHeight = `calc(100vh - ${headerHeight}px)`;
        const container = document.querySelector('.editor-container');
        if (container) {
            container.style.height = newHeight;
        }
        // Refresh codemirror layout if necessary after potential resize
        if (editor) editor.refresh();
    }
    // Adjust height initially and on window resize
    adjustEditorHeight();
    window.addEventListener('resize', adjustEditorHeight);


    // --- Initial Content ---
    const initialContent = `# 高级 Markdown 编辑器

欢迎使用!

## 特性

*   实时预览 (GitHub 风格)
*   **格式化工具栏**
*   数学公式 (KaTeX): $E=mc^2$ 和 $$ \\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2} $$
*   图表绘制 (Mermaid):
    \`\`\`mermaid
    graph LR
        A[编辑区] --> B(实时渲染);
        B --> C{预览区};
        C -- TOC --> D[目录];
        C -- 导出 --> E(MD/HTML);
        C -- 导出 --> F(PNG/PDF);
    \`\`\`
*   代码高亮:
    \`\`\`javascript
    function hello(who = 'world') {
      console.log(\`Hello, \${who}!\`);
    }
    hello();
    \`\`\`
*   目录生成
*   布局切换
*   导出功能

---
`;
    if (editor) editor.setValue(initialContent);

    // --- Render Preview Logic ---
    let mermaidRenderPending = false;
    let renderTimeout;

    function renderPreview() {
        if (!editor || !previewElement) return; // Guard against missing elements

        const markdownText = editor.getValue();

        // 1. Render Markdown to HTML
        let html = "";
        try {
             html = md.render(markdownText);
        } catch (e) {
            console.error("Markdown-it rendering error:", e);
            previewElement.innerHTML = `<p style="color:red;">Error rendering Markdown. Check console.</p>`;
            return;
        }


        // 2. Post-process for KaTeX
        try {
            // Block Mode $$...$$
             html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, expression) => {
                 try {
                     const cleanExpression = expression.trim();
                     if (!cleanExpression) return match;
                     return katex.renderToString(cleanExpression, { displayMode: true, throwOnError: true, output: "html" });
                 } catch (e) {
                     console.warn("KaTeX Block Error:", e.message, "Input:", expression);
                     return `<div class="katex-error" title="${md.utils.escapeHtml(e.toString())}">[KaTeX Block Error]<br>${md.utils.escapeHtml(e.message)}</div>`;
                 }
             });

             // Inline Mode $...$ (Refined Regex)
             html = html.replace(/(?<!\\|\$)\$((?:\\.|[^\$\\])+)\$(?!\$)/g, (match, expression) => {
                try {
                    const cleanExpression = expression.trim();
                    if (!cleanExpression) return match;
                    const finalExpression = cleanExpression.replace(/\\\$/g, '$');
                    return katex.renderToString(finalExpression, { displayMode: false, throwOnError: true, output: "html" });
                } catch (e) {
                    console.warn("KaTeX Inline Error:", e.message, "Input:", expression);
                    return `<span class="katex-error" title="${md.utils.escapeHtml(e.toString())}">[KaTeX Inline Error]</span>`;
                }
            });
        } catch(e) {
            console.error("KaTeX Global Error during processing:", e);
        }


        // 3. Update preview pane's HTML
        previewElement.innerHTML = html;


        // 4. Trigger Mermaid rendering (Async + Flag)
        const mermaidBlocks = previewElement.querySelectorAll('div.mermaid');
        if (mermaidBlocks.length > 0 && !mermaidRenderPending) {
            mermaidRenderPending = true;
            // Use requestAnimationFrame for potentially smoother rendering start
            requestAnimationFrame(async () => {
                try {
                     console.log(`Rendering ${mermaidBlocks.length} Mermaid diagram(s)...`);
                     // It's crucial Mermaid is initialized before run is called
                     await mermaid.run({ nodes: mermaidBlocks });
                     console.log("Mermaid rendering finished.");
                } catch (e) {
                    console.error("Mermaid Rendering Error:", e);
                    // Add error message to the specific block that failed
                    mermaidBlocks.forEach(div => {
                        // Check if the div *still* doesn't have an SVG after the run attempt
                        if (!div.querySelector('svg') && !div.querySelector('.mermaid-error-msg')) {
                            div.innerHTML = `<pre class="mermaid-error-msg" style="color: red; border: 1px solid red; padding: 10px; font-size: 12px; text-align: left;">Mermaid Error:\n${e.message || e}\n--- Code ---\n${div.textContent || '[Could not retrieve code]'}</pre>`;
                        }
                    });
                } finally {
                    mermaidRenderPending = false;
                }
            });
        }
    }

    // --- Debounce Editor Changes ---
    if (editor) {
        editor.on('change', () => {
            clearTimeout(renderTimeout);
            renderTimeout = setTimeout(renderPreview, 250); // Render 250ms after last change
        });
    }

    // --- Initial Render ---
    renderPreview();
    console.log("Initial render triggered.");

    // --- Dropdown Menu Logic ---
    function closeAllDropdowns(exceptMenu = null) {
        document.querySelectorAll('.dropdown-menu.show').forEach(openMenu => {
            if (openMenu !== exceptMenu) {
                openMenu.classList.remove('show');
            }
        });
    }

    document.querySelectorAll('.dropdown-container').forEach(container => {
        const button = container.querySelector('button'); // Targets the button directly inside
        const menu = container.querySelector('.dropdown-menu');

        if (button && menu) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const isCurrentlyShown = menu.classList.contains('show');
                closeAllDropdowns(); // Close others first
                if (!isCurrentlyShown) {
                    menu.classList.add('show'); // Then show current if it wasn't already
                }
            });
        }
    });

    window.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-container')) {
            closeAllDropdowns();
        }
    });

    // --- CodeMirror Helper Functions ---
    function insertText(text) {
        if (!editor) return;
        editor.replaceSelection(text);
        editor.focus();
    }

    function wrapSelection(before, after = before) {
        if (!editor) return;
        const selection = editor.getSelection();
        if (selection) {
            editor.replaceSelection(before + selection + after);
        } else {
            const cursor = editor.getCursor();
            editor.replaceSelection(before + after);
            editor.setCursor(cursor.line, cursor.ch + before.length);
        }
        editor.focus();
    }

    // --- Toolbar Button Actions ---
    document.getElementById('btn-bold')?.addEventListener('click', () => wrapSelection('**'));
    document.getElementById('btn-italic')?.addEventListener('click', () => wrapSelection('*'));
    document.getElementById('btn-strikethrough')?.addEventListener('click', () => wrapSelection('~~'));
    document.getElementById('btn-quote')?.addEventListener('click', () => {
        if (!editor) return;
        const cursor = editor.getCursor();
        const lineContent = editor.getLine(cursor.line);
        // Check if line already starts with '> ' to avoid adding multiple times easily
        if (/^\s*>\s*/.test(lineContent)) {
            // Optionally, implement toggling off the quote here
            editor.replaceRange(lineContent.replace(/^\s*>\s*/, ''), { line: cursor.line, ch: 0 }, { line: cursor.line, ch: lineContent.length });
        } else {
            editor.replaceRange('> ' + lineContent, { line: cursor.line, ch: 0 }, { line: cursor.line, ch: lineContent.length });
            editor.setCursor(cursor.line, cursor.ch + 2);
        }
        editor.focus();
    });
    document.getElementById('btn-code')?.addEventListener('click', () => wrapSelection('`'));
    document.getElementById('btn-code-block')?.addEventListener('click', () => wrapSelection('\n```\n', '\n```\n'));
    document.getElementById('btn-ul')?.addEventListener('click', () => insertText('- '));
    document.getElementById('btn-ol')?.addEventListener('click', () => insertText('1. '));
    document.getElementById('btn-link')?.addEventListener('click', () => {
        if (!editor) return;
        const selection = editor.getSelection();
        wrapSelection('[', `](${selection || 'url'})`);
        // TODO: Select the 'url' part for easy editing
    });
    document.getElementById('btn-table')?.addEventListener('click', () => {
        insertText(
            '\n| Header 1 | Header 2 |\n' +
            '| :------- | :------- |\n' + // Added alignment syntax
            '| Cell 1   | Cell 2   |\n' +
            '| Cell 3   | Cell 4   |\n'
        );
    });

    // Formula Insertion
    document.getElementById('insert-inline-formula')?.addEventListener('click', (e) => { e.preventDefault(); wrapSelection('$', '$'); closeAllDropdowns(); });
    document.getElementById('insert-block-formula')?.addEventListener('click', (e) => { e.preventDefault(); wrapSelection('\n$$\n', '\n$$\n'); closeAllDropdowns(); });

    // Mermaid Insertion
    document.querySelectorAll('.mermaid-menu a')?.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const type = e.target.dataset.mermaidType;
            let template = '';
            // Simplified templates - users will need to edit extensively
            switch (type) {
                case 'graph': template = 'graph TD;\n    A-->B;'; break;
                case 'sequenceDiagram': template = 'sequenceDiagram\n    participant User\n    participant System\n    User->>System: Request'; break;
                case 'classDiagram': template = 'classDiagram\n    class BankAccount{\n      +String owner\n      +Float balance\n      +deposit(amount)\n    }'; break;
                case 'stateDiagram': template = 'stateDiagram-v2\n    [*] --> Idle\n    Idle --> Processing : event\n    Processing --> Idle : done'; break;
                case 'erDiagram': template = 'erDiagram\n    CUSTOMER ||--o{ ORDER : places\n    ORDER ||--|{ LINE-ITEM : contains'; break;
                case 'journey': template = 'journey\n    title My amazing journey\n    section Tasks\n      Go home: 5: Me'; break;
                case 'gantt': template = 'gantt\n    dateFormat  YYYY-MM-DD\n    title Project Timeline\n    section Phase 1\n    Task 1: 2024-01-01, 7d'; break;
                case 'pie': template = 'pie title Device Usage\n    "Desktop": 45\n    "Mobile": 35\n    "Tablet": 20'; break;
                case 'mindmap': template = 'mindmap\n  root((My Project))\n    ::icon(fa fa-book)\n    Research\n      ::icon(fa fa-search)\n      Phase 1\n      Phase 2\n    Development\n      ::icon(fa fa-code)\n      Backend\n      Frontend'; break;
                case 'timeline': template = 'timeline\n    title Project Milestones\n    2024-01-15 : Kickoff\n    2024-03-01 : Alpha Release\n    2024-05-01 : Beta Release'; break;
                default: template = type + '\n  ...'; // Basic fallback
            }
            insertText(`\n\`\`\`mermaid\n${template}\n\`\`\`\n`);
            closeAllDropdowns();
        });
    });

    // --- Layout Toggles ---
    const btnToggleLayout = document.getElementById('btn-toggle-layout');
    const btnPreviewOnly = document.getElementById('btn-preview-only');
    let isPreviewOnly = false; // Start with split view

    function applyLayout() {
        if (isPreviewOnly) {
            editorPane?.classList.add('hidden');
            previewElement?.classList.add('full-width');
            btnToggleLayout.innerHTML = '<i class="fas fa-edit"></i>';
            btnToggleLayout.title = "显示编辑器";
        } else {
            editorPane?.classList.remove('hidden');
            previewElement?.classList.remove('full-width');
            btnToggleLayout.innerHTML = '<i class="fas fa-columns"></i>';
            btnToggleLayout.title = "切换布局";
        }
        // Crucially, refresh CodeMirror AFTER the pane is potentially resized/shown
        if (editor) {
             setTimeout(() => editor.refresh(), 10); // Short delay ensures layout settled
        }
        // Also adjust overall container height in case layout change affects it (unlikely here)
         // adjustEditorHeight();
    }

    btnPreviewOnly?.addEventListener('click', () => {
        isPreviewOnly = true;
        applyLayout();
    });

    btnToggleLayout?.addEventListener('click', () => {
        // This button now toggles between split and preview-only
        isPreviewOnly = !isPreviewOnly;
        applyLayout();
    });

    // --- Export Logic ---
    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { // Cleanup after download starts
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    function exportHtml() {
        if (!previewElement) return;
        console.log("Exporting HTML...");
        const previewContent = previewElement.innerHTML;
        // Embed necessary styles directly for better portability
        const embeddedStyles = Array.from(document.styleSheets)
            .filter(sheet => sheet.href === null || sheet.href.includes('style.css') || sheet.href.includes('katex') || sheet.href.includes('highlight')) // Include local and key CDN styles
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n');
                } catch (e) {
                    // Ignore CORS errors for external stylesheets if necessary, or fetch them if possible
                    console.warn("Could not read rules from stylesheet:", sheet.href, e);
                    return '';
                }
            })
            .join('\n');

        const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>${document.getElementById('doc-title')?.value || 'Exported Document'}</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        /* Embed crucial styles directly */
        ${embeddedStyles}
        /* Ensure base markdown body style is present */
        .markdown-body { line-height: 1.7; color: #24292e; }
        /* Add any missing essential styles here if needed */
    </style>
    <!-- Include Mermaid JS if diagrams should be interactive in the export -->
    <!-- <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"><\/script> -->
    <!-- <script>mermaid.initialize({startOnLoad: true});<\/script> -->
</head>
<body class="markdown-body">
    ${previewContent}
</body>
</html>`;
        downloadFile( (document.getElementById('doc-title')?.value || 'document') + '.html', fullHtml, 'text/html;charset=utf-8');
    }

    function exportPng() {
        if (!previewElement) return;
        console.log("Exporting PNG...");
        // Ensure the element's scroll dimensions are used if content overflows
        const options = {
             useCORS: true,
             logging: false, // Disable excessive logging in production
             scale: window.devicePixelRatio * 1.5, // Adjust scale for quality vs size
             backgroundColor: '#ffffff',
             width: previewElement.scrollWidth,
             height: previewElement.scrollHeight,
             windowWidth: previewElement.scrollWidth,
             windowHeight: previewElement.scrollHeight
        };
        html2canvas(previewElement, options).then(canvas => {
             const dataUrl = canvas.toDataURL('image/png');
              // Create a temporary link to download
             const link = document.createElement('a');
             link.download = (document.getElementById('doc-title')?.value || 'document') + '.png';
             link.href = dataUrl;
             link.click(); // Trigger download
             link.remove(); // Clean up link
         }).catch(err => {
             console.error("Export PNG failed:", err);
             alert(`导出 PNG 失败: ${err.message}\n请检查浏览器控制台获取详细信息。`);
         });
    }

    function exportPdf() {
        if (!previewElement) return;
        alert("注意：客户端 PDF 导出是实验性的，复杂或过长的内容可能导致问题或不准确分页。推荐使用浏览器的“打印 -> 另存为 PDF”功能。");
        console.log("Exporting PDF...");
        const { jsPDF } = window.jspdf;
        const options = {
             useCORS: true,
             logging: false,
             scale: window.devicePixelRatio * 1.5, // Higher scale for PDF
             backgroundColor: '#ffffff',
             width: previewElement.scrollWidth,
             height: previewElement.scrollHeight,
             windowWidth: previewElement.scrollWidth,
             windowHeight: previewElement.scrollHeight
        };

        html2canvas(previewElement, options).then(canvas => {
            const imgData = canvas.toDataURL('image/jpeg', 0.85); // JPEG for smaller size
            const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 30; // Points
            const usableWidth = pdfWidth - 2 * margin;
            const usableHeight = pdfHeight - 2 * margin;

            const imgWidth = canvas.width / (window.devicePixelRatio * 1.5); // Convert canvas px back to logical px
            const imgHeight = canvas.height / (window.devicePixelRatio * 1.5);
            const aspectRatio = imgWidth / imgHeight;

            let finalImgWidth = usableWidth;
            let finalImgHeight = finalImgWidth / aspectRatio;

            // Simple single-page handling (shrink to fit if too large)
            if (finalImgHeight > usableHeight) {
                finalImgHeight = usableHeight;
                finalImgWidth = finalImgHeight * aspectRatio;
                 console.warn("Content taller than PDF page, shrinking to fit. Pagination not fully implemented.");
            }

            let xPos = margin + (usableWidth - finalImgWidth) / 2; // Center horizontally
            let yPos = margin;

             // Rudimentary pagination attempt (image splitting) - often imperfect
            if (imgHeight * (usableWidth / imgWidth) > usableHeight) { // Check if scaled height exceeds usable page height
                console.log("Attempting basic pagination by splitting image...");
                 let currentY = 0;
                 const pageHeightInCanvasPx = (usableHeight / usableWidth) * canvas.width; // Approximate canvas pixels per PDF page height

                 while (currentY < canvas.height) {
                    let sliceHeight = Math.min(pageHeightInCanvasPx, canvas.height - currentY);
                    let pageCanvas = document.createElement('canvas');
                    pageCanvas.width = canvas.width;
                    pageCanvas.height = sliceHeight;
                    let pageCtx = pageCanvas.getContext('2d');

                    pageCtx.drawImage(canvas, 0, currentY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
                    let pageImgData = pageCanvas.toDataURL('image/jpeg', 0.85);

                    let pageFinalImgWidth = usableWidth;
                    let pageFinalImgHeight = (sliceHeight/canvas.width) * pageFinalImgWidth;

                     pdf.addImage(pageImgData, 'JPEG', margin, margin, pageFinalImgWidth, pageFinalImgHeight);
                     currentY += sliceHeight;

                     if (currentY < canvas.height) {
                         pdf.addPage();
                     }
                      pageCanvas = null; // Clean up
                 }

            } else {
                 // Add image to the first page if it fits
                 pdf.addImage(imgData, 'JPEG', xPos, yPos, finalImgWidth, finalImgHeight);
            }


            pdf.save( (document.getElementById('doc-title')?.value || 'document') + '.pdf');
        }).catch(err => {
             console.error("Export PDF failed:", err);
             alert(`导出 PDF 失败: ${err.message}\n请检查控制台。`);
        });
    }

    // Connect export dropdown items to functions
    document.getElementById('export-md-menu')?.addEventListener('click', (e) => {
         e.preventDefault();
         if (!editor) return;
         triggerDownload('md', editor.getValue(), 'text/markdown;charset=utf-8');
         closeAllDropdowns();
     });
    document.getElementById('export-html-menu')?.addEventListener('click', (e) => { e.preventDefault(); exportHtml(); closeAllDropdowns(); });
    document.getElementById('export-png-menu')?.addEventListener('click', (e) => { e.preventDefault(); exportPng(); closeAllDropdowns(); });
    document.getElementById('export-pdf-menu')?.addEventListener('click', (e) => { e.preventDefault(); exportPdf(); closeAllDropdowns(); });

     // Helper for direct download trigger (used for MD)
    function triggerDownload(type, content, mime) {
          downloadFile((document.getElementById('doc-title')?.value || 'document') + '.' + type, content, mime);
    }


    // --- TOC Logic ---
    function generateAndShowToc() {
        if (!tocModal || !tocListContainer || !previewElement) return;
        console.log("Generating TOC...");
        const headings = previewElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
        tocListContainer.innerHTML = ''; // Clear previous

        if (headings.length === 0) {
            tocListContainer.innerHTML = '<p><i>文档中未找到标题。</i></p>';
            tocModal.style.display = 'block';
            return;
        }

        const tocList = document.createElement('ul');
        const idCounters = {}; // To handle duplicate auto-generated IDs

        headings.forEach((heading) => {
            const level = parseInt(heading.tagName.substring(1), 10);
            const text = heading.textContent.trim();
            if (!text) return; // Skip empty headings

            let id = heading.id;
            if (!id) {
                id = 'heading-' + text.toLowerCase()
                                     .replace(/[\s#?&/\\.,:;*<>"'|()\[\]{}]/g, '-') // Replace spaces and many symbols with dash
                                     .replace(/-+/g, '-') // Collapse multiple dashes
                                     .replace(/^-+|-+$/g, ''); // Trim leading/trailing dashes
                if (!id) id = 'heading-auto'; // Fallback if text was only symbols

                // Ensure uniqueness if auto-generating
                if (idCounters[id] !== undefined) {
                    idCounters[id]++;
                    id = `${id}-${idCounters[id]}`;
                } else {
                    idCounters[id] = 0;
                }
                heading.id = id; // Assign the generated ID back to the element
            }

            const listItem = document.createElement('li');
            listItem.classList.add(`toc-level-${level}`);

            const link = document.createElement('a');
            link.href = `#${id}`;
            link.textContent = text;

            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetElement = document.getElementById(id);
                if (targetElement) {
                    // Scroll the preview pane, not the window
                    previewElement.scrollTo({
                        top: targetElement.offsetTop - 15, // Offset from top of preview pane
                        behavior: 'smooth'
                    });
                }
                tocModal.style.display = 'none'; // Close modal
            });

            listItem.appendChild(link);
            tocList.appendChild(listItem);
        });

        tocListContainer.appendChild(tocList);
        tocModal.style.display = 'block';
    }

    // TOC Button Listener
    tocButton?.addEventListener('click', generateAndShowToc);

    // Modal Close Listeners
    tocCloseButton?.addEventListener('click', () => { tocModal.style.display = 'none'; });
    window.addEventListener('click', (event) => {
        if (event.target === tocModal) { tocModal.style.display = 'none'; }
    });
     window.addEventListener('keydown', (event) => { // Close modal on Escape key
        if (event.key === 'Escape' && tocModal && tocModal.style.display === 'block') {
             tocModal.style.display = 'none';
        }
     });


    // --- Other Buttons ---
    document.getElementById('btn-help')?.addEventListener('click', () => alert('帮助功能尚未实现。\n可参考 Markdown 语法或 Mermaid/KaTeX 文档。'));
    document.getElementById('btn-fullscreen')?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                 alert(`全屏失败: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                 document.exitFullscreen();
            }
        }
    });

    console.log("Editor initialization complete.");

}); // End DOMContentLoaded