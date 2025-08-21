# AI-Readable Website Chrome Extension

Transform any website into a clean, AI-readable format based on the translation logic from Parallel.ai.

## Features

- **One-Click Translation**: Toggle AI Mode to instantly transform any website
- **Clean Markdown Format**: Converts websites to structured, machine-readable format
- **Dark Theme UI**: Matches the aesthetic of the reference design
- **Responsive Design**: Works on all screen sizes
- **Persistent State**: Remembers your AI Mode preference

## Installation

1. Download or clone this extension folder
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your toolbar

## Usage

1. Visit any website (e.g., www.baseten.com)
2. Click the "AI-Readable Website" extension icon
3. Toggle "AI Mode" to ON
4. The website will transform into machine-readable format
5. Toggle back to OFF to return to the original website

## How It Works

The extension implements the translation logic from `translation_logic.md`:

### Phase 1: Content Discovery
- Identifies DOM structure and content areas
- Classifies elements (brand, navigation, headlines, etc.)

### Phase 2: Content Extraction
- Extracts navigation and brand information
- Processes content hierarchy (H1-H6 headings)
- Converts tables to markdown format
- Processes links with proper formatting

### Phase 3: Content Formatting
- Cleans and normalizes text
- Converts to markdown syntax
- Prioritizes content by importance
- Applies consistent formatting rules

### Phase 4: Visual Presentation
- Dark theme with monospace font
- Clean, distraction-free layout
- Proper spacing and typography
- Responsive design for all devices

## File Structure

```
ai-readable-website-extension/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── content.js             # Main translation logic
├── content.css            # AI mode styling
├── icons/                 # Extension icons
└── README.md              # This file
```

## Translation Logic

The extension follows these key principles:

1. **Semantic Preservation**: Maintains all meaning and relationships
2. **Markdown Standard**: Uses standard markdown syntax throughout
3. **Direct Extraction**: No semantic labeling or categorization
4. **Content-First**: Prioritizes content over presentation
5. **Machine-Readable**: Optimized for AI consumption
6. **Complete Data**: Preserves all information including metadata

## Supported Elements

- **Navigation**: Brand name, menu links, CTAs
- **Headings**: H1-H6 with proper markdown hierarchy
- **Content**: Paragraphs, lists, and text blocks
- **Tables**: Converted to markdown table format
- **Links**: Internal and external with proper formatting
- **Footer**: Contact info and additional links

## Browser Compatibility

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## Privacy

This extension:
- Only processes content on the current tab when activated
- Does not send data to external servers
- Stores only the AI Mode toggle state locally
- Does not track user behavior

## Contributing

To contribute to this extension:

1. Fork the repository
2. Make your changes
3. Test thoroughly on various websites
4. Submit a pull request

## License

This extension is based on the translation logic from Parallel.ai and is provided as-is for educational and development purposes.
