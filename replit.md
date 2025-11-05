# Shopify Theme Preview Tool

## Overview
A Node.js/Express web application that allows you to preview and edit Shopify themes locally without needing a Shopify store. This tool provides a complete development environment for Shopify theme developers with mock data, live preview, file editing capabilities, and theme download functionality.

## Purpose
- Preview Shopify themes with realistic mock product data
- Edit theme files (Liquid templates, CSS, JavaScript) in a browser-based editor
- Upload custom Shopify theme ZIP files
- Download modified themes for Shopify deployment
- Test theme changes without requiring a Shopify account or store

## Current State
The application is configured and ready to run in the Replit environment. It includes:
- Express server running on port 5000
- Liquid templating engine for Shopify theme rendering
- Mock data for products, collections, and shop information
- Admin dashboard for theme management
- File editor for modifying theme files
- ZIP upload/download functionality

## Project Architecture

### Core Components
- **server.js**: Main Express application with routes and rendering logic
- **mock-data.js**: Sample Shopify store data (products, collections, settings)
- **assets/**: Theme assets (CSS, JavaScript, images, icons)
- **layout/**: Base Liquid templates (theme.liquid, password.liquid)
- **sections/**: Reusable page sections
- **snippets/**: Small reusable Liquid code blocks
- **templates/**: Page templates (product, collection, cart, etc.)
- **locales/**: Internationalization files for multiple languages
- **config/**: Theme configuration and settings
- **current-theme/**: Active theme directory (auto-generated from base files)

### Key Features
1. **Theme Upload**: Drag-and-drop or browse to upload Shopify theme ZIP files
2. **Live Preview**: View themes with realistic mock product data
3. **File Manager**: Browse and edit theme files with syntax highlighting
4. **Theme Download**: Export modified themes as ZIP files
5. **Shopify-Compatible**: Maintains proper Shopify theme structure

### Dependencies
- **express**: Web server framework
- **liquidjs**: Shopify Liquid templating engine
- **adm-zip**: ZIP file creation and extraction
- **express-fileupload**: File upload handling
- **multer**: Alternative file upload middleware

## Available Routes

### Admin Interface
- `/` - Redirects to admin dashboard
- `/admin` - Main admin dashboard
- `/admin/files` - File browser and editor
- `/admin/download` - Download theme as ZIP

### Preview Interface
- `/preview` - Homepage preview
- `/preview/info` - Information page with available routes
- `/preview/products/:handle` - Product page preview
- `/preview/collections/:handle` - Collection page preview
- `/preview/cart` - Shopping cart preview

## Recent Changes
- **2025-11-05**: Initial import to Replit environment
  - Configured for Replit deployment
  - Verified all dependencies installed
  - Server configured on port 5000 with host 0.0.0.0

## Development Notes
- Server binds to 0.0.0.0:5000 for Replit compatibility
- Cache control headers prevent caching for development
- Theme files are copied to `current-theme/` directory on first run
- All edits are made to files in `current-theme/` directory

## User Preferences
None recorded yet.
