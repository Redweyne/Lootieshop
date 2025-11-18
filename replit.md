# Shopify Theme Preview Tool

## Overview
A Node.js/Express application that allows developers to preview and edit Shopify themes locally with mock data. The tool provides an admin interface for theme management and a preview interface to see how the theme renders.

## Purpose
- Preview Shopify themes without needing a live Shopify store
- Edit theme files (Liquid templates, CSS, JavaScript) in real-time
- Upload theme ZIP files for testing
- Download modified themes for deployment to Shopify

## Current State
- Fully functional Shopify theme preview server
- Running on Express with LiquidJS templating engine
- Includes mock product data for realistic previews
- Admin dashboard for theme file management

## Project Architecture

### Tech Stack
- **Backend**: Node.js + Express
- **Templating**: LiquidJS (Shopify Liquid compatible)
- **File Processing**: adm-zip, multer, express-fileupload

### Directory Structure
```
├── server.js           # Main Express server (entry point)
├── mock-data.js        # Mock Shopify data (products, collections, etc.)
├── package.json        # Node.js dependencies
├── assets/            # Original theme assets
├── config/            # Original theme config
├── layout/            # Original theme layouts
├── sections/          # Original theme sections
├── snippets/          # Original theme snippets
├── templates/         # Original theme templates
├── locales/           # Original theme translations
└── current-theme/     # Active theme directory (created on first run)
```

### Key Features
1. **Admin Dashboard** (`/admin`)
   - Upload theme ZIP files
   - Browse and edit theme files
   - Download modified themes
   - Theme management interface

2. **Preview Interface** (`/preview`)
   - Homepage preview
   - Product pages
   - Collection pages
   - Shopping cart

3. **Theme File Editor** (`/admin/files`)
   - Live file editing
   - Syntax highlighting ready
   - Save changes instantly

### Server Configuration
- **Port**: 5000 (required for Replit webview)
- **Host**: 0.0.0.0 (allows external access)
- **Cache Control**: Disabled for development

## Recent Changes
- November 18, 2025: **Major Enhancement - Live Preview Editor**
  - **Split-screen editor** with live preview iframe
  - **CodeMirror integration** with syntax highlighting for Liquid/HTML
  - **Auto-refresh** preview when files are saved
  - **Page navigation** dropdown to switch between pages in preview
  - **Keyboard shortcuts** (Ctrl+S/Cmd+S to save)
  - **Professional dark theme** editor (Dracula theme)
  - Improved UX with status notifications and visual feedback

- November 18, 2025: **Critical Rendering Fixes**
  - **Fixed section rendering** by creating proper LiquidJS Context objects instead of passing plain data
  - **Beautiful gradient placeholders** - Replaced gray SVG with 5 gradient colors (purple, blue, peach, mint green, coral pink)
  - **Enhanced error logging** with stack traces and section config for better debugging
  - Header, footer, announcement bars now render correctly
  - All templates verified working: homepage, product pages, collection pages, cart
  - Zero console errors - fully functional theme preview

- November 5, 2025: Initial setup and critical bug fixes
  - Configured workflow to run server on port 5000
  - Updated .gitignore for Node.js best practices
  - **Fixed critical rendering issues:**
    - Fixed `{% style %}` and `{% javascript %}` tags to use generator syntax (was showing "[object Generator]")
    - Fixed `{% form %}` and `{% paginate %}` tags to properly render content
    - Fixed `{% sections %}` tag for proper section group rendering
    - Added Liquid re-rendering for settings strings containing variables
    - Fixed font preload tags by adding `system?` property support
  - Theme now renders with full CSS styling and proper layout
  - Deployment configured for autoscale mode

## User Preferences
None specified yet.

## Notes
- The `current-theme/` directory is auto-generated on first run
- All theme previews use mock data from `mock-data.js`
- The server supports Shopify Liquid syntax including custom tags and filters
