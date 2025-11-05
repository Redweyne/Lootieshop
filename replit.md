# Shopify Theme Preview Tool

## Overview
A complete web-based tool for uploading, previewing, editing, and downloading Shopify themes. This tool allows you to work on Shopify themes without needing a Shopify account, and ensures full compatibility when uploading back to Shopify.

## How to Use

### 1. Access the Admin Dashboard
Visit the root URL to access the admin dashboard at `/admin`

### 2. Upload a Shopify Theme
- Click the upload area or drag and drop a Shopify theme ZIP file
- The tool will automatically extract and load your theme
- Your theme is now ready to preview and edit

### 3. Preview Your Theme
- Click "Open Preview" to see your theme rendered with mock data
- Available preview pages:
  - Homepage (/)
  - Product pages
  - Collection pages
  - Cart page
  - And more

### 4. Edit Theme Files
- Use the File Manager to browse all theme files
- Click any file to open it in the editor
- Make changes and save
- Changes are immediately reflected in the preview

### 5. Download Modified Theme
- Click "Download ZIP" to export your theme
- Upload the downloaded ZIP directly to Shopify
- All modifications are preserved and Shopify-compatible

## Project Structure

### Server Components
- **server.js** - Main server with upload/download/preview functionality
- **mock-data.js** - Sample Shopify data for theme previewing
- **current-theme/** - Working directory for uploaded themes

### Theme Structure (Shopify Standard)
```
current-theme/
├── assets/          # CSS, JavaScript, images, fonts
├── config/          # Theme settings and configuration
│   ├── settings_schema.json
│   └── settings_data.json
├── layout/          # Master templates (theme.liquid required)
├── locales/         # Translation files
├── sections/        # Reusable page sections
├── snippets/        # Small reusable code blocks
└── templates/       # Page templates (index, product, etc.)
```

## Technology Stack
- **Node.js/Express** - Web server
- **LiquidJS** - Liquid template rendering engine
- **AdmZip** - ZIP file handling
- **Multer/Express-FileUpload** - File upload handling
- **Mock Shopify API** - Simulated Shopify data

## Features

### ✅ Complete Shopify Theme Support
- Full Liquid template rendering
- All Shopify-specific tags ({% style %}, {% schema %}, {% sections %}, {% form %}, etc.)
- All standard Shopify filters (money, asset_url, image_url, etc.)
- Section blocks with proper structure
- JSON templates (OS 2.0)

### ✅ Upload & Download
- Upload any Shopify theme ZIP file
- Automatic extraction and validation
- Download modified themes as ZIP
- Maintains Shopify-compatible structure

### ✅ Live Preview
- Real-time theme rendering
- Mock product and store data
- Multiple page types (home, product, collection, cart)
- Asset serving (CSS, JS, images)

### ✅ File Management
- Browse all theme files
- Code editor with syntax highlighting
- Save changes in real-time
- Organized file tree view

### ✅ Developer-Friendly
- No Shopify account needed for development
- Cache control for instant updates
- Error messages and debugging info
- Preserves original theme structure

## Routes

### Admin Routes
- `GET /admin` - Main dashboard
- `POST /admin/upload` - Upload theme ZIP
- `GET /admin/files` - File manager
- `POST /admin/save-file` - Save edited file
- `GET /admin/download` - Download theme ZIP

### Preview Routes
- `GET /preview` - Homepage preview
- `GET /preview/products/:handle` - Product pages
- `GET /preview/collections/:handle` - Collection pages
- `GET /preview/cart` - Cart page
- `GET /preview/info` - Information page

### Asset Routes
- `GET /theme-assets/*` - Theme static assets

## Shopify Compatibility

### Maintained Structure
The tool preserves the exact Shopify theme structure:
- All folders (assets, config, layout, sections, snippets, templates, locales)
- File naming conventions
- JSON template format
- Section schema format

### Supported Shopify Features
- ✅ Liquid template language
- ✅ Shopify-specific tags
- ✅ Custom filters
- ✅ Section rendering
- ✅ Block ordering
- ✅ Settings data
- ✅ Localization
- ✅ Asset pipeline

### Download & Upload to Shopify
1. Download your theme using "Download ZIP"
2. Go to Shopify Admin → Online Store → Themes
3. Click "Add theme" → "Upload ZIP file"
4. Upload your downloaded ZIP
5. Theme works exactly as developed

## Mock Data

The tool includes sample data for preview:
- **Products**: Bluetooth speaker, t-shirt, wallet, water bottle
- **Collections**: All products collection
- **Shop**: Demo store settings
- **Cart**: Empty cart (mockable)

Modify `mock-data.js` to add more products or customize preview data.

## Development Workflow

1. **Import existing theme**: Upload your current Shopify theme
2. **Preview**: See how it looks with sample data
3. **Edit**: Make changes to Liquid, CSS, JS files
4. **Test**: Refresh preview to see changes
5. **Download**: Export modified theme
6. **Deploy**: Upload to Shopify

## Configuration

### Replit Environment
- **Port**: 5000 (webview)
- **Host**: 0.0.0.0 (required for Replit proxy)
- **Cache**: Disabled for development
- **File Limits**: 100MB max upload size

### Deployment
- **Target**: Autoscale (stateless)
- **Command**: `node server.js`
- **Environment**: Production-ready

## Limitations

### Expected Behaviors
- Some Shopify JavaScript features require the actual platform
- Mock data is limited (customize in mock-data.js)
- Advanced Shopify apps/integrations won't work in preview
- Some dynamic features are simplified for preview

### Security
- Files must stay within theme directory
- ZIP validation checks for theme.liquid
- File size limits prevent abuse

## Recent Changes
- 2025-11-05: Created complete Shopify Theme Preview Tool
- 2025-11-05: Added upload/download functionality with ZIP handling
- 2025-11-05: Built file manager with code editor
- 2025-11-05: Implemented full Liquid rendering engine
- 2025-11-05: Added Shopify-compatible structure preservation
- 2025-11-05: Configured for Replit deployment

## User Preferences
- Clean, modern UI with purple gradient theme
- Drag-and-drop file upload
- Real-time file editing
- One-click download
- No technical jargon in interface

## Support

### Common Issues
**Theme won't preview**: Check that layout/theme.liquid exists
**Assets not loading**: Verify assets folder structure
**Upload fails**: Ensure file is a valid ZIP under 100MB
**Changes not visible**: Clear browser cache or hard refresh

### Getting Help
- Check error messages in preview
- View console logs for debugging
- Verify Shopify theme structure
- Test with a known-good Shopify theme first
