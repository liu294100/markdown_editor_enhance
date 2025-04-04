import os
import requests
from urllib.parse import urlparse

# 文件下载列表
files_to_download = [
    # CSS 文件
    {
        "url": "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
        "path": "lib/css/all.min.css"
    },
    {
        "url": "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/codemirror.min.css",
        "path": "lib/css/codemirror.min.css"
    },
    {
        "url": "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/theme/material-darker.min.css",
        "path": "lib/css/material-darker.min.css"
    },
    {
        "url": "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css",
        "path": "lib/css/katex.min.css"
    },
    {
        "url": "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css",
        "path": "lib/css/github.min.css"
    },
    
    # JavaScript 文件
    {
        "url": "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/codemirror.min.js",
        "path": "lib/js/codemirror.min.js"
    },
    {
        "url": "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/mode/markdown/markdown.min.js",
        "path": "lib/js/markdown.min.js"
    },
    {
        "url": "https://cdn.jsdelivr.net/npm/markdown-it@14.0.0/dist/markdown-it.min.js",
        "path": "lib/js/markdown-it.min.js"
    },
    {
        "url": "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js",
        "path": "lib/js/katex.min.js"
    },
    {
        "url": "https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js",
        "path": "lib/js/mermaid.min.js"
    },
    {
        "url": "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js",
        "path": "lib/js/highlight.min.js"
    },
    {
        "url": "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js",
        "path": "lib/js/html2canvas.min.js"
    },
    {
        "url": "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
        "path": "lib/js/jspdf.umd.min.js"
    }
]

# Font Awesome 字体文件列表
font_awesome_fonts = [
    "fa-brands-400.ttf",
    "fa-brands-400.woff2",
    "fa-regular-400.ttf",
    "fa-regular-400.woff2",
    "fa-solid-900.ttf",
    "fa-solid-900.woff2",
    "fa-v4compatibility.ttf",
    "fa-v4compatibility.woff2"
]

def download_file(url, filepath):
    """下载单个文件"""
    try:
        # 创建目录
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # 发送请求
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        # 写入文件
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        print(f"成功下载: {filepath}")
    except Exception as e:
        print(f"下载失败 {url}: {str(e)}")

def main():
    # 下载 CSS 和 JS 文件
    for file in files_to_download:
        download_file(file["url"], file["path"])
    
    # 下载 Font Awesome 字体文件
    font_base_url = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/"
    for font_file in font_awesome_fonts:
        font_url = font_base_url + font_file
        font_path = f"lib/fonts/{font_file}"
        download_file(font_url, font_path)

    print("\n下载完成！请手动更新HTML文件中的引用路径，将CDN链接替换为本地路径：")
    print("- CSS 文件使用: lib/css/...")
    print("- JS 文件使用: lib/js/...")
    print("- 字体文件使用: lib/fonts/...")

if __name__ == "__main__":
    main()