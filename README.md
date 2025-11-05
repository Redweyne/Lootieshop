# Shopify Theme

This is a Shopify theme repository designed to run on Shopify's e-commerce platform.

## What is this?

This repository contains:
- Liquid template files (.liquid) - Shopify's templating language
- CSS and JavaScript assets for styling and interactivity
- Configuration files for theme settings
- Localization files for multiple languages

## Running This Theme

**Important:** This theme cannot run as a standalone application. It requires a Shopify store to function.

### Option 1: Use with Shopify CLI (Recommended)

1. **Install Shopify CLI** on your local machine:
   ```bash
   npm install -g @shopify/cli @shopify/theme
   ```

2. **Authenticate with Shopify**:
   ```bash
   shopify auth login
   ```

3. **Connect to your store**:
   ```bash
   shopify theme dev --store your-store-name.myshopify.com
   ```

4. **View your theme**: The CLI will provide a preview URL

### Option 2: Upload to Shopify Admin

1. Zip this entire directory
2. Go to your Shopify Admin → Online Store → Themes
3. Click "Add theme" → "Upload zip file"
4. Upload your zip file

### Creating a Development Store

If you don't have a Shopify store:
1. Sign up for a free Shopify Partner account at https://partners.shopify.com
2. Create a development store
3. Use the Shopify CLI to connect to your dev store

## Project Structure

- `assets/` - CSS, JavaScript, images, and icons
- `config/` - Theme settings and configuration
- `layout/` - Base templates (header, footer)
- `sections/` - Reusable page sections
- `snippets/` - Small reusable code blocks
- `templates/` - Page templates (product, collection, etc.)
- `locales/` - Translations for different languages

## Learn More

- [Shopify Theme Documentation](https://shopify.dev/docs/themes)
- [Liquid Template Language](https://shopify.dev/docs/api/liquid)
- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli)
