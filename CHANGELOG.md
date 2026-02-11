# Changelog

All notable changes to Locator Finder will be documented in this file.

## [2.0.0] - 2026-02-11

### 🎉 Major Changes

#### Drag-to-Move Panel
- **Removed arrow position buttons** (◀ ▼ ▶)
- **Entire header is now a drag handle** - grab and move the panel anywhere on screen
- Visual feedback during drag with glowing border
- Panel stays within viewport bounds automatically
- Subtle "⠿ drag" hint in header

#### Modern Typography & Design
- **Inter font** for UI text (professional, clean)
- **JetBrains Mono** for code blocks (excellent readability)
- Refined color palette with slate-based dark theme
- Rich gradient header: purple → violet → fuchsia
- Improved micro-animations (hover scale, smooth transitions)
- Better visual hierarchy with refined spacing

#### Activity Log
- **New visible activity log panel** at bottom of extension
- Logs all actions: inspect, select, copy, scan, export, theme changes
- Color-coded entries (info, warn, error)
- Timestamps on each entry
- Clear button to flush old entries
- Auto-prunes to max 50 entries

#### Extension ID Visibility
- Extension ID now displayed in empty state
- Also logged on startup in Activity Log
- Helps with debugging and support

### 🔧 Code Quality Improvements

#### Cleaner Architecture
- Replaced repetitive `switch/case` blocks with **lookup maps**
- Consolidated framework code generation into clean objects
- Used `$()` shorthand for `getElementById` references
- Organized code into 14 clearly numbered sections
- All utility functions grouped together
- Event bindings consolidated at bottom

#### Better Maintainability
- Consistent naming conventions
- Clear section headers with box-drawing characters
- Improved comments and documentation
- Reduced code duplication
- More readable control flow

### 🗑️ Cleanup
- Removed build tool files from icons folder
- Cleaned up duplicate documentation
- Kept essential .md files for reference

### 🐛 Bug Fixes
- Improved drag boundary detection
- Better handling of edge cases in locator generation
- More robust clipboard fallback

---

## [1.2.0] - Previous Version

### Features
- Inspect single element mode
- List All page elements with bulk export
- Panel positioning (Left / Right / Bottom)
- Enhanced support for dropdowns, date pickers, complex widgets
- 9 framework support (Selenium, Playwright, Cypress, WebDriverIO)
- Quality scoring for every locator
- JSON/CSV export
- Dark/Light theme toggle

### Supported Frameworks
1. Selenium (Java)
2. Selenium (Python)
3. Selenium (C#)
4. Selenium (JavaScript)
5. Playwright (JS/TS)
6. Playwright (Python)
7. Playwright (Java)
8. Cypress
9. WebDriverIO

### Locator Types
- data-testid and test attributes
- ID
- Name
- ARIA labels and roles
- Placeholder
- CSS selectors (class and attribute-based)
- XPath (relative and absolute)
- Text content
- Link text
