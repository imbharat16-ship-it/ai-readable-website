# AI-Readable Website Chrome Extension

Transform any website into a clean, AI-readable format with intelligent table deduplication and enhanced readability.

## ✨ **New Features (v2.0)**

- **🎯 Smart Table Deduplication**: Marker-based system eliminates duplicate tables
- **📏 Enhanced Spacing**: Professional typography with consistent section separation
- **🏗️ Structured Sections**: Clear navigation, content, and footer organization
- **📱 Responsive Design**: Optimized spacing for all device sizes
- **🔍 Debug Logging**: Comprehensive console output for troubleshooting

## 🚀 **Key Improvements**

### **Table Deduplication System**
- **No More Duplicates**: Each table appears exactly once in its logical position
- **Smart Positioning**: Tables are placed where they belong in the content flow
- **Multiple Formats Supported**: Pre-formatted, HTML, chart, and custom table structures
- **Priority-Based Selection**: Chooses the best available format for each table

### **Enhanced Readability**
- **Professional Typography**: Increased font sizes, line heights, and letter spacing
- **Consistent Spacing**: Hierarchical spacing system for headings and content
- **Better Layout**: Increased content width (600px) with improved padding
- **Section Organization**: Clear visual separation between navigation, content, and footer

## 🎯 **How It Works**

### **Phase 1: Content Discovery with Markers**
- Identifies DOM structure and content areas
- Places markers where tables should appear
- Classifies elements (brand, navigation, headlines, etc.)

### **Phase 2: Table Extraction**
- Extracts all tables using multiple strategies
- Pre-formatted markdown (highest priority)
- Standard HTML tables
- Chart/visualization structures
- Custom div structures

### **Phase 3: Smart Table Replacement**
- Replaces markers with appropriate table content
- Matches tables to markers based on element, heading, and priority
- Ensures each table appears only once in the optimal format

### **Phase 4: Enhanced Presentation**
- Professional dark theme with improved typography
- Consistent spacing and section separation
- Responsive design for all devices
- Clean, distraction-free layout

## 📁 **File Structure**

```
ai-readable-website-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── content.js             # Main translation logic with marker system
├── content.css            # Enhanced AI mode styling
├── test-page.html         # Test page for debugging
└── README.md              # This file
```

## 🛠️ **Installation**

1. Download or clone this extension folder
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your toolbar

## 📖 **Usage**

1. Visit any website (e.g., www.baseten.com)
2. Click the "AI-Readable Website" extension icon
3. Toggle "AI Mode" to ON
4. The website will transform into machine-readable format
5. Toggle back to OFF to return to the original website

## 🔧 **Debugging & Testing**

### **Console Logging**
The extension provides comprehensive console output:
- Table marker placement and replacement
- Content extraction progress
- Table deduplication results
- Performance metrics

### **Test Page**
Use `test-page.html` to verify:
- Table deduplication functionality
- Spacing and typography improvements
- Section organization

## 🎨 **Design Features**

### **Typography**
- **Font**: Roboto Mono for optimal readability
- **Sizes**: 11px base, 1.3em major headings, 1.1em minor headings
- **Spacing**: 1.8 line height with 0.025em letter spacing

### **Layout**
- **Content Width**: 600px maximum for comfortable reading
- **Padding**: 60px vertical, 40px horizontal (responsive)
- **Borders**: 3px left border with 50px left padding

### **Responsive Design**
- **Desktop**: Full spacing and typography
- **Tablet**: Balanced spacing with 500px content width
- **Mobile**: Optimized spacing with 400px content width

## 🔍 **Supported Elements**

- **Navigation**: Brand name, menu links, CTAs
- **Headings**: H1-H6 with proper markdown hierarchy and spacing
- **Content**: Paragraphs, lists, and text blocks with improved margins
- **Tables**: Multiple formats with intelligent deduplication
- **Links**: Internal and external with proper formatting
- **Footer**: Contact info and additional links

## 🌐 **Browser Compatibility**

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## 🔒 **Privacy**

This extension:
- Only processes content on the current tab when activated
- Does not send data to external servers
- Stores only the AI Mode toggle state locally
- Does not track user behavior

## 🐛 **Troubleshooting**

### **Tables Still Appearing Twice?**
1. Check the console for debug logs
2. Verify table markers are being placed and replaced
3. Ensure the extension is updated to the latest version

### **Spacing Issues?**
1. Check if CSS is properly loaded
2. Verify responsive breakpoints are working
3. Test on different screen sizes

### **Performance Issues?**
1. Check console for extraction timing
2. Verify table count in logs
3. Test on simpler websites first

## 🤝 **Contributing**

To contribute to this extension:

1. Fork the repository
2. Make your changes
3. Test thoroughly on various websites
4. Submit a pull request

## 📝 **Changelog**

### **v2.0 - Major Update**
- ✅ Implemented marker-based table deduplication
- ✅ Enhanced typography and spacing
- ✅ Added structured section organization
- ✅ Improved responsive design
- ✅ Added comprehensive debug logging

### **v1.0 - Initial Release**
- ✅ Basic website transformation
- ✅ Table extraction and formatting
- ✅ Dark theme UI
- ✅ Popup interface

## 📄 **License**

This extension is based on the translation logic from Parallel.ai and is provided as-is for educational and development purposes.

## 🆘 **Support**

For issues or questions:
1. Check the console logs for debugging information
2. Test with the provided test page
3. Review the troubleshooting section above
4. Open an issue in the repository

---

**Transform any website into clean, readable content with intelligent table handling and professional typography! 🚀**
