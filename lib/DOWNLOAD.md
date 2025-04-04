# 第三方库文件下载说明

请手动下载以下文件到相应目录：

## CSS文件 (放入 lib/css/)

1. Font Awesome:
   - 从 https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css 下载到 lib/css/all.min.css
   - 从 https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/ 下载所有字体文件到 lib/fonts/

2. CodeMirror:
   - 从 https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/codemirror.min.css 下载到 lib/css/codemirror.min.css
   - 从 https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/theme/material-darker.min.css 下载到 lib/css/material-darker.min.css

3. KaTeX:
   - 从 https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css 下载到 lib/css/katex.min.css

4. highlight.js:
   - 从 https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css 下载到 lib/css/github.min.css

## JavaScript文件 (放入 lib/js/)

1. CodeMirror:
   - 从 https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/codemirror.min.js 下载到 lib/js/codemirror.min.js
   - 从 https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/mode/markdown/markdown.min.js 下载到 lib/js/markdown.min.js

2. markdown-it:
   - 从 https://cdn.jsdelivr.net/npm/markdown-it@14.0.0/dist/markdown-it.min.js 下载到 lib/js/markdown-it.min.js

3. KaTeX:
   - 从 https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js 下载到 lib/js/katex.min.js

4. mermaid:
   - 从 https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js 下载到 lib/js/mermaid.min.js

5. highlight.js:
   - 从 https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js 下载到 lib/js/highlight.min.js

6. html2canvas:
   - 从 https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js 下载到 lib/js/html2canvas.min.js

7. jsPDF:
   - 从 https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js 下载到 lib/js/jspdf.umd.min.js

## 下载完成后

下载完所有文件后，请更新HTML文件中的引用路径，将CDN链接替换为对应的本地路径。