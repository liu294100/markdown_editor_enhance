Okay, here is the translated content in both English and Chinese, maintaining the original structure and formatting.

```markdown
# How to Install Nativefier and Package Web Pages into Desktop Applications / 如何安装 Nativefier 并打包网页成桌面应用

[English](#english) | [中文](#中文)

---

<a name="english"></a>

## English

### ✅ 1. Install Nativefier
Nativefier is a Node.js-based tool installed via npm.

#### 🌐 Prerequisites
Before installing Nativefier, ensure your system has the following installed:
- **Node.js** (which includes npm after installation)

Verify the installation:
```bash
node -v   # Should display the Node.js version
npm -v    # Should display the npm version
```

#### 🛠 Install Nativefier (Globally)
In your terminal (CMD/PowerShell on Windows, Terminal on macOS/Linux), run:
```bash
npm install -g nativefier
```
After installation, you can use the `nativefier` command directly in your terminal.

---

### 🌍 2. Package an Online Web Page
Packaging an online web page into a desktop app is straightforward.

#### 🔹 Basic Command Format
```bash
nativefier "https://example.com" --name "YourAppName"
```

#### ✅ Example
Package the markdownEdit online Markdown editor:
```bash
nativefier "https://apollo.abcworld.cloudns.org/markdown/" --name "Markdown Online Editor"
```
- **Purpose:** Packages `https://apollo.abcworld.cloudns.org/markdown/` into a desktop application.
- **Application Name:** `Markdown Online Editor`.
- **Output:** The packaged application will be saved in a subfolder within the current directory, e.g., `./Markdown Online Editor-win32-x64/`.

#### 🧱 Optional Enhancement Parameters
Here are some common parameters you can add to the command as needed:
| Parameter                  | Description                       |
|----------------------------|-----------------------------------|
| `--platform windows/mac/linux` | Specify the target platform (supports cross-platform packaging) |
| `--arch x64/arm64`         | Specify the architecture          |
| `--icon icon.png`          | Custom application icon           |
| `--inject your.css`        | Inject custom CSS styles          |
| `--disable-dev-tools`      | Disable developer tools           |
| `--single-instance`        | Restrict the app to a single running instance |
| `--tray`                   | Add system tray support           |

#### 📂 Packaging Result
- **Default Output Path:** A subfolder in the current working directory, e.g., `./Markdown Online Editor-win32-x64/`.
- **Contents:** Contains the executable file (like `.exe` or `.app`), which can be run by double-clicking.

---

### 📜 3. Package an Offline HTML File
If you want to package a local HTML file (e.g., for offline use), adjust the command slightly.

#### 🔹 Command Format
```bash
nativefier --name "YourAppName" "file:///path/to/your/absolute/yourfile.html"
```

#### ✅ Example
Suppose you have a local `index.html` file located at `C:/Projects/mywebsite/index.html`:
```bash
nativefier --name "My Offline App" "file://C:/Projects/mywebsite/index.html"
```
- **Purpose:** Packages the local `index.html` file into a desktop application.
- **Notes:**
  - The path must be an **absolute path**.
  - Use forward slashes `/` for Windows paths, and start with `file://`.
  - If the HTML file references local resources (like CSS, JS, images), ensure these resource paths are relative within the HTML and are located in the same directory structure relative to `index.html`.

#### 🧱 Enhancement Parameters
Similar to online packaging, you can use parameters like `--icon`, `--platform`, etc. For example:
```bash
nativefier --name "My Offline App" --icon "C:/Projects/mywebsite/icon.png" "file://C:/Projects/mywebsite/index.html"
```

---

### 🛠 4. Automation Scripts (Optional)
If you package frequently, you can use scripts to simplify the process.

#### Windows Example (`.bat` file)
Create a `pack.bat` file:
```bat
@echo off
set URL=https://apollo.abcworld.cloudns.org/markdown/
set NAME=Markdown Online Editor
set ICON=C:/path/to/icon.png
echo Packaging %NAME% from %URL%...
nativefier "%URL%" --name "%NAME%" --icon "%ICON%"
echo Done!
pause
```
- Save the file and double-click it to run the packaging command.

#### macOS/Linux Example (`.sh` file)
Create a `pack.sh` file:
```bash
#!/bin/bash
URL="https://apollo.abcworld.cloudns.org/markdown/"
NAME="Markdown Online Editor"
ICON="/path/to/icon.png"

echo "Packaging $NAME from $URL..."
nativefier "$URL" --name "$NAME" --icon "$ICON"
echo "Done!"
```
- Grant execution permission before running: `chmod +x pack.sh`, then execute with `./pack.sh`.

---

### 💡 Coming up
---------
---------
---------

---

<a name="中文"></a>

## 中文

### ✅ 一、安装 Nativefier
Nativefier 是一个基于 Node.js 的工具，通过 npm 安装即可使用。

#### 🌐 前提要求
在安装 Nativefier 之前，确保你的系统已安装以下软件：
- **Node.js**（安装后会自带 npm）

验证安装是否成功：
```bash
node -v   # 应显示 Node.js 版本
npm -v    # 应显示 npm 版本
```

#### 🛠 安装 Nativefier（全局安装）
在终端（Windows 的 CMD/PowerShell，macOS/Linux 的 Terminal）中运行：
```bash
npm install -g nativefier
```
安装完成后，你可以在终端直接使用 `nativefier` 命令。

---

### 🌍 二、打包在线网页
将在线网页打包成桌面应用的步骤很简单。

#### 🔹 基本命令格式
```bash
nativefier "https://example.com" --name "YourAppName"
```

#### ✅ 示例
打包 markdownEdit 在线 Markdown 编辑器：
```bash
nativefier "https://apollo.abcworld.cloudns.org/markdown/" --name "Markdown Online Editor"
```
- **作用**：将 `https://apollo.abcworld.cloudns.org/markdown/` 打包成桌面应用。
- **应用名称**：`Markdown Online Editor`。
- **输出**：打包好的程序会保存在当前目录下的子文件夹中，例如 `./Markdown Online Editor-win32-x64/`。

#### 🧱 可选增强参数
以下是一些常用的参数，可以根据需要添加到命令中：
| 参数                       | 说明                             |
|----------------------------|----------------------------------|
| `--platform windows/mac/linux` | 指定目标平台（支持跨平台打包）   |
| `--arch x64/arm64`         | 指定架构                         |
| `--icon icon.png`          | 自定义应用图标                   |
| `--inject your.css`        | 注入自定义 CSS 样式              |
| `--disable-dev-tools`      | 禁用开发者工具                   |
| `--single-instance`        | 限制应用只能运行单一实例         |
| `--tray`                   | 添加系统托盘支持                 |

#### 📂 打包结果
- **默认输出路径**：当前工作目录下的子文件夹，例如 `./Markdown Online Editor-win32-x64/`。
- **文件内容**：包含可执行文件（如 `.exe` 或 `.app`），直接双击即可运行。

---

### 📜 三、打包离线 HTML 文件
如果你想打包本地的 HTML 文件（例如离线网页），需要稍微调整命令。

#### 🔹 命令格式
```bash
nativefier --name "YourAppName" "file://绝对路径/到/yourfile.html"
```

#### ✅ 示例
假设你有一个本地的 `index.html` 文件位于 `C:/Projects/mywebsite/index.html`：
```bash
nativefier --name "My Offline App" "file://C:/Projects/mywebsite/index.html"
```
- **作用**：将本地的 `index.html` 文件打包成桌面应用。
- **注意**：
  - 路径必须是**绝对路径**。
  - Windows 路径建议使用正斜杠 `/`，并以 `file://` 开头。
  - 如果 HTML 文件引用了本地资源（如 CSS、JS、图片），确保这些资源路径在 HTML 中是相对路径，且与 `index.html` 在同一目录结构下，Nativefier打包时会尝试将它们包含进去。

#### 🧱 增强参数
与在线网页打包类似，可以使用 `--icon`、`--platform` 等参数。例如：
```bash
nativefier --name "My Offline App" --icon "C:/Projects/mywebsite/icon.png" "file://C:/Projects/mywebsite/index.html"
```

---

### 🛠 四、自动化脚本（可选）
如果你经常打包，可以用脚本简化操作。

#### Windows 示例（`.bat` 文件）
创建一个 `pack.bat` 文件：
```bat
@echo off
set URL=https://apollo.abcworld.cloudns.org/markdown/
set NAME=Markdown Online Editor
set ICON=C:/path/to/icon.png
echo 正在打包 %NAME% (来自 %URL%)...
nativefier "%URL%" --name "%NAME%" --icon "%ICON%"
echo 完成！
pause
```
- 保存后双击运行即可打包。

#### macOS/Linux 示例（`.sh` 文件）
创建一个 `pack.sh` 文件：
```bash
#!/bin/bash
URL="https://apollo.abcworld.cloudns.org/markdown/"
NAME="Markdown Online Editor"
ICON="/path/to/icon.png"

echo "正在打包 $NAME (来自 $URL)..."
nativefier "$URL" --name "$NAME" --icon "$ICON"
echo "完成！"

```
- 运行前赋予执行权限：`chmod +x pack.sh`，然后 `./pack.sh` 执行。

---

### 💡 Coming up
---------
---------
---------
```
