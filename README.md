# Static Markdown Editor / 静态 Markdown 编辑器

[English](#english) | [中文](#中文)

---

<a name="english"></a>

## English

A simple, static web-based Markdown editor built with HTML, CSS, and JavaScript, leveraging various libraries loaded via CDN. It aims to replicate some core functionalities and the look-and-feel of sites like `https://apollo.abcworld.cloudns.org/markdown/`.

**[➡️ Add a Screenshot Here!]**
(Replace this line with an actual screenshot of your editor, e.g., `![Editor Screenshot](![image](https://github.com/user-attachments/assets/d45c38b1-4282-4960-9d12-351b4088fc7c)
)`)

### ✨ Features

*   **Real-time Preview:** See your rendered Markdown instantly as you type.
*   **Syntax Highlighting:** Markdown syntax highlighting in the editor pane (using CodeMirror 5).
*   **GitHub Flavored Markdown:** Renders Markdown similar to GitHub (using `markdown-it`).
*   **KaTeX Support:** Render mathematical formulas and equations ($inline$ and $$block$$).
*   **Mermaid Support:** Create diagrams (flowcharts, sequence diagrams, etc.) using Mermaid syntax (```mermaid``` blocks).
*   **Code Block Highlighting:** Syntax highlighting for various languages in code blocks within the preview pane (using `highlight.js`).
*   **Export Options:**
    *   Export to Markdown (`.md`) file.
    *   Export to HTML (`.html`) file (includes basic styling).
    *   Export preview area to PNG Image (`.png`) (using `html2canvas`).
    *   Export preview area to PDF (`.pdf`) (experimental, using `html2canvas` + `jsPDF`).

### 🛠 Tech Stack

*   **HTML5**
*   **CSS3**
*   **JavaScript (ES6+)**
*   **[CodeMirror 5](https://codemirror.net/5/)**: For the editor pane and Markdown syntax highlighting.
*   **[markdown-it](https://github.com/markdown-it/markdown-it)**: Markdown parser with plugins.
*   **[KaTeX](https://katex.org/)**: Fast math typesetting library.
*   **[Mermaid](https://mermaid.js.org/)**: Diagramming and charting tool.
*   **[highlight.js](https://highlightjs.org/)**: Syntax highlighting for code blocks in the preview.
*   **[html2canvas](https://html2canvas.hertzen.com/)**: For rendering the preview pane to a canvas (used for PNG/PDF export).
*   **[jsPDF](https://github.com/parallax/jsPDF)**: For generating PDF files from the canvas.
*   _(All libraries loaded via CDN)_

### 🚀 Getting Started

As this is a purely static project, no build process or server is required.

1.  **Clone or Download:**
    *   Clone the repository: `git clone <your-repo-url>`
    *   OR Download the project files (`index.html`, `style.css`, `script.js`) as a ZIP.
2.  **Open:**
    *   Navigate to the project folder.
    *   Double-click the `index.html` file to open it in your web browser (Chrome, Firefox, Edge, etc.).

That's it! You can start writing Markdown.

### ⚠️ Known Issues & Limitations

*   **Export Quality (PNG/PDF):** Client-side rendering to image/PDF using `html2canvas` can have limitations. Complex layouts, specific CSS features, external resources, or very long documents might not render perfectly or might cause errors. PDF pagination is very basic (image splitting) and not content-aware. Using the browser's built-in "Print to PDF" function might yield better results for PDF creation.
*   **Mermaid in Exported HTML:** The exported HTML file won't render Mermaid diagrams unless you manually include the Mermaid library and its initialization script within the exported file.
*   **Performance:** Very large documents might experience slight delays during real-time preview rendering.
*   **Static Nature:** No server-side features like saving files directly to a server or user accounts.

### 🤝 Contributing (Optional)

Contributions are welcome! If you have suggestions or find bugs, please open an issue or submit a pull request.

*(Add specific contribution guidelines if you have them)*

### 📄 License (Optional)

This project is licensed under the [MIT License](LICENSE.md).
*(Choose a license and add a LICENSE.md file if desired)*

---

<a name="中文"></a>

## 中文

一个简单的、基于 HTML、CSS 和 JavaScript 构建的静态网页 Markdown 编辑器，通过 CDN 加载所需库。它旨在复刻类似 `markdown-editor.org` 网站的部分核心功能和外观。

**[➡️ 在此添加截图！]**
（将此行替换为你的编辑器的实际截图，例如：`![编辑器截图]([screenshot.png](https://github.com/user-attachments/assets/d45c38b1-4282-4960-9d12-351b4088fc7c))`）

### ✨ 功能特性

*   **实时预览:** 在你输入时即时看到渲染后的 Markdown 效果。
*   **语法高亮:** 编辑器窗格内支持 Markdown 语法高亮 (使用 CodeMirror 5)。
*   **GitHub 风格 Markdown:** 渲染效果类似 GitHub 的 Markdown (使用 `markdown-it`)。
*   **KaTeX 支持:** 渲染数学公式和方程式 ($行内$ 和 $$块级$$)。
*   **Mermaid 支持:** 使用 Mermaid 语法创建图表（流程图、序列图等）(```mermaid``` 代码块)。
*   **代码块高亮:** 预览窗格中支持多种语言的代码块语法高亮 (使用 `highlight.js`)。
*   **导出选项:**
    *   导出为 Markdown (`.md`) 文件。
    *   导出为 HTML (`.html`) 文件 (包含基础样式)。
    *   将预览区域导出为 PNG 图片 (`.png`) (使用 `html2canvas`)。
    *   将预览区域导出为 PDF (`.pdf`) (实验性功能, 使用 `html2canvas` + `jsPDF`)。

### 🛠 技术栈

*   **HTML5**
*   **CSS3**
*   **JavaScript (ES6+)**
*   **[CodeMirror 5](https://codemirror.net/5/)**: 用于编辑器窗格及 Markdown 语法高亮。
*   **[markdown-it](https://github.com/markdown-it/markdown-it)**: 带插件的 Markdown 解析器。
*   **[KaTeX](https://katex.org/)**: 快速的数学公式排版库。
*   **[Mermaid](https://mermaid.js.org/)**: 图表绘制工具。
*   **[highlight.js](https://highlightjs.org/)**: 用于预览中代码块的语法高亮。
*   **[html2canvas](https://html2canvas.hertzen.com/)**: 用于将预览窗格渲染到 canvas 画布（用于 PNG/PDF 导出）。
*   **[jsPDF](https://github.com/parallax/jsPDF)**: 用于从 canvas 生成 PDF 文件。
*   _(所有库均通过 CDN 加载)_

### 🚀 如何使用

这是一个纯静态项目，不需要构建过程或服务器。

1.  **克隆或下载:**
    *   克隆仓库: `git clone <你的仓库URL>`
    *   或者 下载项目文件 (`index.html`, `style.css`, `script.js`) 的 ZIP 压缩包。
2.  **打开:**
    *   进入项目文件夹。
    *   双击 `index.html` 文件，用你的网页浏览器（如 Chrome, Firefox, Edge 等）打开它。

就这样！你可以开始编写 Markdown 了。

### ⚠️ 已知问题与限制

*   **导出质量 (PNG/PDF):** 使用 `html2canvas` 在客户端渲染为图片/PDF 可能存在限制。复杂的布局、特定的 CSS 特性、外部资源或非常长的文档可能无法完美渲染或导致错误。PDF 分页功能非常基础（基于图像分割），无法感知内容。使用浏览器自带的“打印到 PDF”功能可能会获得更好的 PDF 创建效果。
*   **导出 HTML 中的 Mermaid 图表:** 导出的 HTML 文件本身无法渲染 Mermaid 图表，除非你手动在该文件中也包含 Mermaid 库及其初始化脚本。
*   **性能:** 非常大的文档在实时预览渲染时可能会有轻微延迟。
*   **静态特性:** 没有服务器端功能，如直接保存文件到服务器或用户账户系统。

### 🤝 贡献 (可选)

欢迎贡献！如果你有任何建议或发现 Bug，请提交 Issue 或 Pull Request。

*(如果你有具体的贡献指南，请在此添加)*

### 📄 许可证 (可选)

本项目基于 [MIT 许可证](LICENSE.md) 发布。
*(建议选择一个许可证，并添加相应的 LICENSE.md 文件)*
