# Locator Finder v2.0

**Locator Finder** is a professional Chrome extension that helps you generate reliable element locators for test automation frameworks like Selenium, Playwright, Cypress, and WebDriverIO.

## ✨ What's New in v2.0

- 🖱️ **Drag-to-Move Panel**: Grab the header and move the panel anywhere on screen (no more position buttons!)
- 📋 **Activity Log**: See all your actions logged in real-time with timestamps
- 🎨 **Modern Design**: Beautiful Inter + JetBrains Mono fonts, refined colors, smooth animations
- 🆔 **Extension ID Visible**: Easily identify your extension instance
- 🧹 **Cleaner Code**: Completely rewritten for better maintainability and readability

## Features

- 🎯 **Inspect Mode**: Click on any element to see all available locators
- 📃 **List All**: Scan entire page and export all interactive elements
- 🎨 **9 Framework Support**: Generate code for Selenium (Java/Python/C#/JS), Playwright (JS/Python/Java), Cypress, and WebDriverIO
- ⭐ **Quality Scoring**: Each locator is rated (BEST/GOOD/OK/AVOID) based on reliability
- 📥 **Export**: Download locators as JSON or CSV
- 🌓 **Dark/Light Theme**: Toggle between themes
- 🖱️ **Draggable Panel**: Move the panel anywhere on screen

## Installation

### From Source

1. Clone this repository or download the ZIP
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `extension` folder
6. The extension icon will appear in your toolbar

### Usage

1. Click the extension icon or press `Alt+Shift+L` on any webpage
2. Choose your mode:
   - **Inspect**: Click on any element to see its locators
   - **List All**: Scan all interactive elements on the page
3. Select your framework from the dropdown
4. Copy individual locators or export all as JSON/CSV

## Supported Frameworks

| Framework | Languages | Status |
|-----------|-----------|--------|
| **Selenium** | Java, Python, C#, JavaScript | ✅ Supported |
| **Playwright** | JavaScript, TypeScript, Python, Java | ✅ Supported |
| **Cypress** | JavaScript | ✅ Supported |
| **WebDriverIO** | JavaScript | ✅ Supported |

## Locator Types Generated

The extension intelligently generates multiple locator strategies:

1. **data-testid** and test attributes (BEST - 100 score)
2. **ID** (95 score if unique)
3. **ARIA labels and roles** (88-90 score)
4. **Name attribute** (80 score if unique)
5. **Placeholder** (75 score)
6. **CSS selectors** (50-95 score based on specificity)
7. **XPath** (relative and absolute, 15-85 score)
8. **Text content** (50 score)
9. **Link text** (50 score)

Each locator includes:
- Quality rating (BEST/GOOD/OK/AVOID)
- Match count (how many elements match)
- Framework-specific code
- Explanation of why it's rated that way

## Advanced Features

### Enhanced Element Support
- ✅ Dropdowns (`<select>` elements)
- ✅ Date/time/color pickers
- ✅ Contenteditable elements (rich text editors)
- ✅ Complex ARIA widgets (combobox, listbox, dialog, etc.)
- ✅ Custom dropdown components

### Export Options
- **Copy All**: Copy all locators for selected element
- **JSON Export**: Download structured JSON with all elements and locators
- **CSV Export**: Download spreadsheet-compatible CSV

## Keyboard Shortcuts

- `Alt+Shift+L` - Toggle panel
- `Escape` - Stop inspect mode

## Privacy & Security

- ✅ **Zero data collection** - everything runs locally
- ✅ **No external servers** - no data leaves your browser
- ✅ **No registration required**
- ✅ **Open source** - audit the code yourself

## Development

### Project Structure

```
locator_finder/
├── extension/
│   ├── manifest.json      # Extension configuration
│   ├── background.js      # Service worker
│   ├── content.js         # Main logic (1082 lines)
│   ├── content.css        # Styles (798 lines)
│   └── icons/             # Extension icons
├── README.md              # This file
└── CHANGELOG.md           # Version history
```

### Tech Stack

- **Vanilla JavaScript** (ES6+)
- **CSS3** with CSS Variables
- **Chrome Extension Manifest V3**
- **Google Fonts**: Inter + JetBrains Mono

### Contributing

This is an open-source project. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

## License

MIT License - See LICENSE file for details

## Acknowledgments

Inspired by tools like Locator Labs, SelectorsHub, and ChroPath.

---

**Version**: 2.0.0  
**Last Updated**: February 11, 2026  
**Status**: Production Ready
