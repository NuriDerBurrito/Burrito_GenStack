# 🌯 Burrito GenStack 

**A powerful desktop model management tool for AI creators**
<p align="center">
<img width="300" height="300" alt="Burrito_lorafy_logo(plus)" src="https://github.com/user-attachments/assets/03510518-f8eb-4a28-8c5a-52f13f789881" />
  <img width="300" height="300" alt="Genstack" src="https://github.com/user-attachments/assets/6c8125d7-2201-49a5-b959-5260b3cc1384"/>
<p/>
Tired of memorization or dealing with organization issues?

Burrito GenStack is an Electron-based application designed to help AI artists, Stable Diffusion users, and model enthusiasts organize their ever-growing collection of models, LoRAs, and checkpoints and export them easily to jupyterlab.

![Version](https://img.shields.io/badge/version-1.2.1-purple)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)

---

![GitHub last commit](https://img.shields.io/github/last-commit/NuriDerBurrito/Burrito_GenStack)
## ✨ Features

### 📁 Smart Organization
- **Folder-based hierarchy** - Create custom classes and categories for your models
- **Drag & drop** - Easily reorganize items between folders
- **Recursive viewing** - See all items in a folder and its subfolders

### 🏷️ Custom Tagging System
- **Visual tag badges** - Colorful, icon-supported tags for quick identification
- **Tag filtering** - Filter your collection by multiple tags simultaneously
- **Tag management** - Create, edit, and customize tags with colors and icons
<img width="300" alt="4" src="https://github.com/user-attachments/assets/aa2bcefa-ae66-45fe-abe7-3229951f4d69" />

### 🔗 Civitai Integration
- **Auto-fetch previews** - Automatically download model preview images from Civitai
- **Batch scanning** - Scan all entries for missing images at once
- **One-click access** - Open model pages directly from the app

### 📋 Export & Productivity
- **Bulk selection** - Select multiple items for export
- **Export templates** - Customizable export format with variables
- **Smart paste** - Quickly add entries by pasting formatted text
- **One-click copy** - Export download links in your preferred format
- **Universal compatibility** - Works with any download manager or custom templates, make your own easily

### 🎨 Customization
- **Theme colors** - Customize the accent colors, backgrounds, and dividers
- **Grid zoom** - Adjust the grid density to your preference
- **Tag scaling** - Resize tag badges to your preference
<img width="300" alt="image" src="https://github.com/user-attachments/assets/ee2dcd07-5aad-43ef-9933-12e49bd862d9" />

### 💾 Data Management
- **Local database** - All data stored locally in JSON format
- **Import images** - Drag and drop or paste images directly
- **Thumbnail generation** - Create optimized thumbnails for faster loading
- **Tag filters & Sorting** - Can view models by certain tags or hide certain tags, and can also view models from newest or from oldest
  
---

## Screenshots
<img width="1365" height="767" alt="1" src="https://github.com/user-attachments/assets/d9208cf9-6d7f-4113-b8ff-780b57806278" />
<img width="1365" height="767" alt="2" src="https://github.com/user-attachments/assets/daf303f8-04a9-4935-9f82-ee4c908d2d51" />
<img width="1365" height="767" alt="3" src="https://github.com/user-attachments/assets/a466e7dc-32db-42ed-b9b0-63dea154bc1a" />
<img width="1365" alt="image" src="https://github.com/user-attachments/assets/8bbd04f9-3d04-4839-bed7-7b86d9479a49" />

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/NuriDerBurrito/Burrito_GenStack.git

# Navigate to directory
cd Burrito_GenStack

# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run make
```

---

## 📝 Usage

### Adding Entries
1. Click the **+ Add** button in the grid
2. Enter the model name, source URL, download link, notes, and select tags
3. Or use **Smart Paste** to auto-fill from formatted text:
   ```
   #Model Name
   #https://civitai.com/models/12345
   %download https://civitai.com/api/download/models/12345
   ```

### Fetching Previews
- Click the download cloud icon next to a Civitai URL
- Or use **Scan** in the top bar to fetch all missing previews

### Exporting
1. Select items using the checkbox on each card
2. Open the **Selected** drawer
3. Copy the formatted output to use in your download manager

---

## 🖥️ Platform Support

Burrito GenStack is available for:
- **Windows** - Built with Squirrel installer
- **macOS** - (npm install)
- **Linux** - Available as DEB and RPM packages

> **Note:** Building for each platform requires running the build process on that respective operating system.

---

## 🛠️ Built With

- **[Electron](https://www.electronjs.org/)** - Desktop application framework
- **[React](https://react.dev/)** - UI library
- **[Tailwind CSS](https://tailwindcss.com/)** - Styling
- **[Lucide Icons](https://lucide.dev/)** - Icon set

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **[gutris1/segsmaker](https://github.com/gutris1/segsmaker)** - Original inspiration for the export format. While Burrito GenStack was initially designed to work seamlessly with segsmaker, it now supports any download manager 
and includes custom template options.

- **[Duskfallcrew/Tester](https://github.com/Ktiseos-Nyx/)** - Helped by installing and testing the product before release, pointing out vulnerabilities and bugs related to model adding.

---

## 📬 Contact
<img width="69" height="69" alt="main_logo" src="https://github.com/user-attachments/assets/6971eb2f-66f0-4c09-b111-b80f86fc6528" />

- **Discord:** nuriderburrito
- **GitHub:** [NuriDerBurrito](https://github.com/NuriDerBurrito)
- **HuggingFace:** [NuriDerBurrito](https://huggingface.co/NuriDerBurrito)
- **Website:** [Genesis Iterations](https://nuriderburrito.github.io/Genesis-Website/index.html)
  
---
Feel free to add suggestions report issues!

*Made with 🌯 by NuriDerBurrito*

![GitHub stars](https://img.shields.io/github/stars/NuriDerBurrito/Burrito_GenStack?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/NuriDerBurrito/Burrito_GenStack?style=social)
