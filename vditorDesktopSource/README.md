```

```

Vditor Desktop

一个基于 [Vditor](https://github.com/Vanessa219/vditor) 的类 Typora Markdown 桌面编辑器。

## 功能特性

- **所见即所得 (WYSIWYG)** - 类似 Typora 的编辑体验
- **即时渲染 (IR)** - 类似 Typora 的实时渲染模式
- **分屏预览 (SV)** - 左侧源码，右侧预览
- **文件操作** - 新建、打开、保存、另存为
- **导出 HTML** - 将 Markdown 导出为独立 HTML 文件
- **主题切换** - 明亮/暗黑主题
- **最近文件** - 快速访问最近打开的文件
- **文件关联** - 双击 .md 文件直接打开
- **拖放支持** - 拖放 Markdown 文件到窗口打开
- **图片粘贴** - 支持粘贴/拖放图片（base64 嵌入）
- **字数统计** - 底部状态栏显示字数和行数
- **键盘快捷键** - 完整的快捷键支持

## 安装与运行

### 开发模式

```bash
# 安装依赖
npm install

# 启动应用
npm start
```

### 打包构建

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

## 快捷键

| 快捷键       | 功能       |
| ------------ | ---------- |
| Ctrl+N       | 新建文件   |
| Ctrl+O       | 打开文件   |
| Ctrl+S       | 保存文件   |
| Ctrl+Shift+S | 另存为     |
| Ctrl+/       | 切换工具栏 |
| F11          | 切换全屏   |
| Ctrl+=       | 放大       |
| Ctrl+-       | 缩小       |

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **Vditor** - 浏览器端 Markdown 编辑器
- **electron-builder** - 应用打包工具

## 许可证

MIT
