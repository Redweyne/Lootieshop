# Shopify Theme - Dawn (or Custom Theme)

## Overview
This is a Shopify theme repository containing Liquid templates, CSS, and JavaScript files used to build an e-commerce storefront on Shopify's platform.

## Project Structure
- **assets/** - Static assets (CSS, JavaScript, images, icons)
- **config/** - Theme configuration and settings
- **layout/** - Core layout templates (theme.liquid, password.liquid)
- **locales/** - Translation files for internationalization
- **sections/** - Reusable theme sections (header, footer, product, etc.)
- **snippets/** - Reusable code snippets
- **templates/** - Page templates (product, collection, blog, etc.)

## Technology Stack
- **Liquid** - Shopify's templating language
- **Vanilla JavaScript** - Custom elements and interactivity
- **CSS** - Modern CSS with CSS variables, Grid, and Flexbox
- **Shopify Platform** - E-commerce backend

## Important Notes
**This is a Shopify theme and cannot run standalone in Replit.** Shopify themes require:
1. A Shopify store (development or production)
2. Shopify CLI for local development
3. Authentication with Shopify

## Setup Instructions

### Prerequisites
1. A Shopify Partner account (free at partners.shopify.com)
2. A development store or production Shopify store
3. Shopify CLI installed

### To Use This Theme with Shopify CLI

This theme is designed to work with the Shopify platform and requires the Shopify CLI to run locally. Unfortunately, it cannot be previewed as a standalone website in Replit without connecting to a Shopify store.

If you want to develop this theme:
1. Install Shopify CLI locally on your machine
2. Authenticate with your Shopify store
3. Use `shopify theme dev` to run a local development server
4. Push changes using `shopify theme push`

### Alternative: Static Preview (Limited)
A basic static preview server could be created to view individual templates and assets, but it won't have Shopify's dynamic features like products, cart, checkout, etc.

## Replit Setup

### Current Configuration
- **Preview Server**: A Node.js/Express server that renders the Shopify theme with mock data
- **Port**: 5000 (webview)
- **Host**: 0.0.0.0
- **Liquid Engine**: LiquidJS with custom Shopify tags and filters
- **Mock Data**: Sample products, collections, and store settings in `mock-data.js`

### How It Works
The preview server:
1. Parses Liquid templates using LiquidJS engine
2. Injects mock Shopify data (products, collections, shop settings)
3. Renders sections with their blocks and settings
4. Serves all static assets (CSS, JS, images)
5. Displays the theme layout exactly as it would appear in Shopify

### Available Pages
- **/** - Homepage with featured products and sections
- **/collections/all** - Product collection page
- **/products/[handle]** - Individual product pages
- **/cart** - Shopping cart page
- **/info** - Information page with links and instructions

### Features
✅ Liquid template rendering  
✅ Shopify-specific tags (style, schema, sections, form, paginate)  
✅ Shopify filters (money, asset_url, image_url, etc.)  
✅ Section blocks with proper structure  
✅ Mock product and store data  
✅ CSS and JavaScript loading  
✅ Real-time preview

### Customization
- **Edit theme**: Modify files in `sections/`, `snippets/`, `layout/`, `templates/`
- **Change styling**: Edit CSS files in `assets/`
- **Modify mock data**: Update `mock-data.js` to test different products/scenarios
- **View changes**: Refresh the preview to see updates

### Limitations
- Some advanced Shopify features may not render perfectly (this is a preview, not full Shopify)
- Shopify-specific JavaScript features require the actual Shopify platform
- Dynamic features (cart, checkout) are mocked for preview only
- Some snippets may show rendering artifacts

### Deployment to Shopify
When ready to deploy:
1. Use Shopify CLI: `shopify theme dev`
2. Or upload the theme files directly in Shopify Admin
3. All your design changes will carry over

### Deployment on Replit
- Configured for autoscale deployment (stateless)
- Runs the preview server for demonstration purposes

## Recent Changes
- 2025-11-05: Project imported from GitHub and successfully set up in Replit environment
- 2025-11-05: Dependencies installed (Express, LiquidJS)
- 2025-11-05: Preview Server workflow configured and running on port 5000
- 2025-11-05: Deployment configuration set up for autoscale
- 2025-11-05: Theme preview server fully operational with mock Shopify data
