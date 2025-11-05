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
- November 5, 2025: Initial setup in Replit environment
  - Configured workflow to run server on port 5000
  - Updated .gitignore for Node.js best practices
  - Documented project structure and features

## User Preferences
None specified yet.

## Notes
- The `current-theme/` directory is auto-generated on first run
- All theme previews use mock data from `mock-data.js`
- The server supports Shopify Liquid syntax including custom tags and filters
