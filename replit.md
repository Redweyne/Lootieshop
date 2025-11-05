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
- **Preview Server**: A Node.js/Express server provides a helpful information page explaining what this Shopify theme is and how to use it
- **Port**: 5000 (webview)
- **Host**: 0.0.0.0
- **Assets**: Static CSS, JavaScript, and image files are served at `/assets/`

### How to View
1. Click the preview/webview tab in Replit
2. You'll see an informational page explaining this is a Shopify theme
3. Browse the static assets by clicking "Browse Static Assets"

### Deployment
- Configured for autoscale deployment (stateless)
- Runs on port 5000 with the preview server

## Recent Changes
- 2025-11-05: Project imported from GitHub, identified as Shopify theme
- 2025-11-05: Created preview server with informational landing page
- 2025-11-05: Configured workflow and deployment for Replit environment
