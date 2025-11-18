const express = require('express');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const AdmZip = require('adm-zip');
const { Liquid } = require('liquidjs');
const mockData = require('./mock-data');

const app = express();
const PORT = 5000;
const THEME_DIR = path.join(__dirname, 'current-theme');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  abortOnLimit: true
}));

// Cache control - prevent caching for development
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Initialize theme directory
function ensureThemeDirectory() {
  if (!fs.existsSync(THEME_DIR)) {
    // Copy current theme as default
    fs.mkdirSync(THEME_DIR, { recursive: true });
    const folders = ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];
    folders.forEach(folder => {
      const src = path.join(__dirname, folder);
      const dest = path.join(THEME_DIR, folder);
      if (fs.existsSync(src)) {
        copyFolderSync(src, dest);
      }
    });
    // Copy mock-data.js
    if (fs.existsSync(path.join(__dirname, 'mock-data.js'))) {
      fs.copyFileSync(path.join(__dirname, 'mock-data.js'), path.join(THEME_DIR, 'mock-data.js'));
    }
  }
}

function copyFolderSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

ensureThemeDirectory();

// Initialize Liquid engine with current theme
function getLiquidEngine() {
  return new Liquid({
    root: [
      path.join(THEME_DIR, 'layout'),
      path.join(THEME_DIR, 'sections'),
      path.join(THEME_DIR, 'snippets'),
      path.join(THEME_DIR, 'templates')
    ],
    extname: '.liquid',
    cache: false,
    strictFilters: false,
    strictVariables: false,
    lenientIf: true,
    ownPropertyOnly: false
  });
}

// Register Shopify-specific tags
function registerShopifyTags(engine) {
  engine.registerTag('style', {
    parse: function(tagToken, remainTokens) {
      this.tokens = [];
      const stream = this.liquid.parser.parseStream(remainTokens);
      stream
        .on('tag:endstyle', () => stream.stop())
        .on('template', tpl => this.tokens.push(tpl))
        .on('end', () => {
          throw new Error('tag "endstyle" not found');
        });
      stream.start();
    },
    * render(ctx, emitter) {
      emitter.write('<style>');
      yield this.liquid.renderer.renderTemplates(this.tokens, ctx, emitter);
      emitter.write('</style>');
    }
  });

  engine.registerTag('schema', {
    parse: function(tagToken, remainTokens) {
      this.tokens = [];
      const stream = this.liquid.parser.parseStream(remainTokens);
      stream
        .on('tag:endschema', () => stream.stop())
        .on('template', tpl => this.tokens.push(tpl))
        .on('end', () => {
          throw new Error('tag "endschema" not found');
        });
      stream.start();
    },
    render: function() {
      return '';
    }
  });

  engine.registerTag('javascript', {
    parse: function(tagToken, remainTokens) {
      this.tokens = [];
      const stream = this.liquid.parser.parseStream(remainTokens);
      stream
        .on('tag:endjavascript', () => stream.stop())
        .on('template', tpl => this.tokens.push(tpl))
        .on('end', () => {
          throw new Error('tag "endjavascript" not found');
        });
      stream.start();
    },
    * render(ctx, emitter) {
      emitter.write('<script>');
      yield this.liquid.renderer.renderTemplates(this.tokens, ctx, emitter);
      emitter.write('</script>');
    }
  });

  engine.registerTag('sections', {
    parse: function(tagToken) {
      this.group = tagToken.args.trim().replace(/['"]/g, '');
    },
    * render(ctx, emitter) {
      const groupFile = `${this.group}.json`;
      const groupPath = path.join(THEME_DIR, 'sections', groupFile);
      
      if (fs.existsSync(groupPath)) {
        try {
          const groupData = JSON.parse(fs.readFileSync(groupPath, 'utf8'));
          
          // Respect Shopify's section order array
          const sectionOrder = groupData.order || Object.keys(groupData.sections || {});
          
          for (const sectionKey of sectionOrder) {
            const sectionConfig = groupData.sections?.[sectionKey];
            if (sectionConfig && sectionConfig.type) {
              const sectionFile = `${sectionConfig.type}.liquid`;
              const blocks = [];
              const blockOrder = sectionConfig.block_order || Object.keys(sectionConfig.blocks || {});
              
              const tempContext = ctx.getAll();
              
              if (sectionConfig.blocks) {
                for (const blockId of blockOrder) {
                  const blockConfig = sectionConfig.blocks[blockId];
                  if (blockConfig) {
                    blocks.push({
                      id: blockId,
                      type: blockConfig.type,
                      settings: blockConfig.settings || {},
                      shopify_attributes: ''
                    });
                  }
                }
              }
              
              // Add .first and .last properties to blocks array for Liquid compatibility
              if (blocks.length > 0) {
                blocks.first = blocks[0];
                blocks.last = blocks[blocks.length - 1];
              }
              
              const sectionData = {
                ...tempContext,
                section: {
                  id: sectionKey,
                  settings: sectionConfig.settings || {},
                  blocks: blocks,
                  shopify_attributes: ''
                }
              };
              
              try {
                const templates = yield this.liquid.parseFile(sectionFile);
                // Create a new context with the section data
                const newCtx = new ctx.constructor(sectionData, ctx.opts, ctx.sync);
                yield this.liquid.renderer.renderTemplates(templates, newCtx, emitter);
              } catch (err) {
                console.error(`Error rendering section ${sectionFile}:`, err.message);
                console.error(`Error stack:`, err.stack);
                console.error(`Section config:`, JSON.stringify(sectionConfig, null, 2));
              }
            }
          }
        } catch (err) {
          console.error(`Error loading section group ${groupFile}:`, err.message);
        }
      }
    }
  });

  engine.registerTag('form', {
    parse: function(tagToken, remainTokens) {
      this.formType = tagToken.args.split(',')[0].trim().replace(/['"]/g, '');
      this.tokens = [];
      const stream = this.liquid.parser.parseStream(remainTokens);
      stream
        .on('tag:endform', () => stream.stop())
        .on('template', tpl => this.tokens.push(tpl))
        .on('end', () => {
          throw new Error('tag "endform" not found');
        });
      stream.start();
    },
    * render(ctx, emitter) {
      emitter.write(`<form class="shopify-${this.formType}-form" method="post">`);
      yield this.liquid.renderer.renderTemplates(this.tokens, ctx, emitter);
      emitter.write('</form>');
    }
  });

  engine.registerTag('paginate', {
    parse: function(tagToken, remainTokens) {
      this.tokens = [];
      const stream = this.liquid.parser.parseStream(remainTokens);
      stream
        .on('tag:endpaginate', () => stream.stop())
        .on('template', tpl => this.tokens.push(tpl))
        .on('end', () => {
          throw new Error('tag "endpaginate" not found');
        });
      stream.start();
    },
    * render(ctx, emitter) {
      const paginate = {
        current_page: 1,
        pages: 1,
        items: 12,
        page_size: 12,
        previous: null,
        next: null
      };
      ctx.environments.paginate = paginate;
      yield this.liquid.renderer.renderTemplates(this.tokens, ctx, emitter);
    }
  });

  // Register custom Liquid filters
  engine.registerFilter('asset_url', (input) => `/theme-assets/${input}`);
  engine.registerFilter('stylesheet_tag', (input, options) => {
    if (!input) return '';
    const href = typeof input === 'string' && !input.startsWith('http') && !input.startsWith('/theme-assets/') 
      ? `/theme-assets/${input}` 
      : input;
    const preload = options && options.preload ? ' rel="preload" as="style"' : '';
    return `<link rel="stylesheet" href="${href}"${preload}>`;
  });
  engine.registerFilter('script_tag', (input) => {
    return `<script src="${input}" defer="defer"></script>`;
  });
  engine.registerFilter('font_url', (input) => {
    if (!input) return '';
    if (typeof input === 'object' && input.family) {
      return '';
    }
    return '';
  });
  engine.registerFilter('img_url', (input, size) => {
    if (typeof input === 'string') {
      return input;
    }
    if (input && input.src) {
      return input.src;
    }
    return input;
  });
  engine.registerFilter('image_url', (input, options) => {
    const placeholders = [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f',
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d',
      'https://images.unsplash.com/photo-1560343090-f0409e92791a',
      'https://images.unsplash.com/photo-1523381210434-271e8be1f52b',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c'
    ];
    
    let placeholderIndex = 0;
    if (typeof input === 'string' && input.length > 0) {
      placeholderIndex = input.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % placeholders.length;
    }
    let placeholder = placeholders[placeholderIndex];
    
    let url = null;
    if (typeof input === 'string') {
      if (input.startsWith('shopify://')) {
        url = placeholder;
      } else if (input.startsWith('http://') || input.startsWith('https://')) {
        url = input;
      } else {
        url = input;
      }
    } else if (input && input.src) {
      if (typeof input.src === 'string' && (input.src.startsWith('http://') || input.src.startsWith('https://'))) {
        url = input.src;
      } else {
        url = placeholder;
      }
    } else {
      url = placeholder;
    }
    
    if (url && options && typeof options === 'object') {
      const width = options.width;
      const height = options.height;
      if (url.includes('unsplash.com') && (width || height)) {
        const params = new URLSearchParams();
        if (width) params.append('w', width);
        if (height) params.append('h', height);
        params.append('fit', 'crop');
        url = url.split('?')[0] + '?' + params.toString();
      }
    }
    
    return url;
  });
  engine.registerFilter('image_tag', (input, options) => {
    const placeholder = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop';
    const src = input || placeholder;
    const width = options && options.width ? `width="${options.width}"` : '';
    const height = options && options.height ? `height="${options.height}"` : '';
    const className = options && options.class ? `class="${options.class}"` : '';
    const alt = options && options.alt ? options.alt : 'Image';
    return `<img src="${src}" alt="${alt}" ${width} ${height} ${className} loading="lazy">`;
  });
  engine.registerFilter('placeholder_svg_tag', (input, className) => {
    return `<svg class="${className || ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 525 525"><path fill="#999" d="M324.5 212.7H203.7l120.8-120.8 37.5-37.5c-11.4-6.4-24.2-10.8-37.5-13.1L204.7 161.2 84.9 41.3 64 62.2l120.8 120.8L64 303.8l19.2 19.2L204 202.2 324.8 323l19.2-19.2L223.2 183l120.8-120.8c-6.4-11.4-13.9-21.6-21.5-30.2L202.7 152.8l120.8 120.8c-.1.1-.1.1 0 0z"/></svg>`;
  });
  engine.registerFilter('money', (cents) => {
    if (typeof cents === 'number') {
      return `$${(cents / 100).toFixed(2)}`;
    }
    return cents;
  });
  engine.registerFilter('money_with_currency', (cents) => {
    if (typeof cents === 'number') {
      return `$${(cents / 100).toFixed(2)} USD`;
    }
    return cents;
  });
  engine.registerFilter('default', (input, defaultValue) => {
    return input || defaultValue;
  });
  engine.registerFilter('escape', (input) => {
    if (typeof input === 'string') {
      return input.replace(/[&<>"']/g, (char) => {
        const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return entities[char];
      });
    }
    return input;
  });
  engine.registerFilter('strip_html', (input) => {
    if (typeof input === 'string') {
      return input.replace(/<[^>]*>/g, '');
    }
    return input;
  });
  engine.registerFilter('truncate', (input, length = 50) => {
    if (typeof input === 'string' && input.length > length) {
      return input.substring(0, length) + '...';
    }
    return input;
  });
  engine.registerFilter('url_encode', (input) => {
    return encodeURIComponent(input);
  });
  engine.registerFilter('font_face', (input, options) => {
    return '';
  });
  engine.registerFilter('font_modify', (input, property, value) => {
    return input || `font-family: sans-serif`;
  });
  engine.registerFilter('color_brightness', (color) => {
    return 128;
  });
  engine.registerFilter('color_lighten', (color, amount) => {
    return color;
  });
  engine.registerFilter('color_darken', (color, amount) => {
    return color;
  });
  engine.registerFilter('join', (array, separator = ', ') => {
    if (Array.isArray(array)) {
      return array.join(separator);
    }
    return array;
  });
  engine.registerFilter('first', (array) => {
    if (Array.isArray(array) && array.length > 0) {
      return array[0];
    }
    return array;
  });
  engine.registerFilter('last', (array) => {
    if (Array.isArray(array) && array.length > 0) {
      return array[array.length - 1];
    }
    return array;
  });
  engine.registerFilter('size', (input) => {
    if (Array.isArray(input)) return input.length;
    if (typeof input === 'string') return input.length;
    if (typeof input === 'object') return Object.keys(input).length;
    return 0;
  });
  engine.registerFilter('append', (input, string) => {
    return String(input || '') + String(string || '');
  });
  engine.registerFilter('prepend', (input, string) => {
    return String(string || '') + String(input || '');
  });
  engine.registerFilter('replace', (input, find, replace) => {
    if (typeof input === 'string') {
      return input.split(find).join(replace);
    }
    return input;
  });
  engine.registerFilter('split', (input, separator) => {
    if (typeof input === 'string') {
      return input.split(separator);
    }
    return [input];
  });
  engine.registerFilter('t', (input) => {
    // Simple translation filter - returns the key as-is for now
    // In a real implementation, this would look up translations from locale files
    const translations = {
      'accessibility.skip_to_text': 'Skip to content',
      'accessibility.refresh_page': 'Refresh page',
      'accessibility.link_messages.new_window': 'Opens in a new window',
      'products.product.add_to_cart': 'Add to cart',
      'products.product.sold_out': 'Sold out',
      'products.product.unavailable': 'Unavailable',
      'sections.cart.cart_error': 'Cart error',
      'sections.quick_order_list.items_added.other': '[quantity] items added',
      'sections.quick_order_list.items_added.one': '[quantity] item added',
      'general.share.success_message': 'Link copied to clipboard'
    };
    return translations[input] || input.split('.').pop();
  });
  engine.registerFilter('inline_asset_content', (input) => {
    // Load and return the content of an asset file (like SVG icons)
    try {
      const assetPath = path.join(THEME_DIR, 'assets', input);
      if (fs.existsSync(assetPath)) {
        return fs.readFileSync(assetPath, 'utf8');
      }
    } catch (err) {
      console.error(`Error loading inline asset ${input}:`, err.message);
    }
    return '';
  });

  return engine;
}

// Serve static theme assets
app.use('/theme-assets', express.static(path.join(THEME_DIR, 'assets')));

// Load theme settings from settings_data.json
function loadThemeSettings() {
  const settingsPath = path.join(THEME_DIR, 'config', 'settings_data.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settingsData = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      return settingsData.current || {};
    } catch (err) {
      console.error('Error loading theme settings:', err.message);
    }
  }
  return {};
}

// Create font objects that mimic Shopify's font object structure
function createFontObject(fontName) {
  const fontParts = (fontName || 'sans-serif').split('_');
  const family = fontParts[0].replace(/-/g, ' ');
  return {
    family: family,
    fallback_families: 'sans-serif',
    style: 'normal',
    weight: 400,
    system: true,
    'system?': true
  };
}

// Create default color schemes for theme preview
function createColorSchemes() {
  const createColor = (r, g, b) => {
    const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    return {
      red: r,
      green: g,
      blue: b,
      rgb: `${r}, ${g}, ${b}`,
      hex: hex,
      toString: () => hex
    };
  };

  const scheme1Bg = createColor(255, 255, 255);
  const scheme2Bg = createColor(243, 243, 243);
  
  return [
    {
      id: 'scheme-1',
      settings: {
        background: scheme1Bg,
        background_gradient: '',
        text: createColor(18, 18, 18),
        shadow: createColor(18, 18, 18),
        button: createColor(18, 18, 18),
        button_label: createColor(255, 255, 255),
        secondary_button_label: createColor(18, 18, 18)
      }
    },
    {
      id: 'scheme-2',
      settings: {
        background: scheme2Bg,
        background_gradient: '',
        text: createColor(18, 18, 18),
        shadow: createColor(18, 18, 18),
        button: createColor(18, 18, 18),
        button_label: createColor(255, 255, 255),
        secondary_button_label: createColor(18, 18, 18)
      }
    }
  ];
}

// Helper to process settings and re-render Liquid strings
async function processSettingsWithLiquid(settings, context, engine) {
  const processed = {};
  for (const [key, value] of Object.entries(settings)) {
    if (typeof value === 'string' && (value.includes('{{') || value.includes('{%'))) {
      try {
        processed[key] = await engine.parseAndRender(value, context);
      } catch (err) {
        processed[key] = value;
      }
    } else {
      processed[key] = value;
    }
  }
  return processed;
}

// Helper to render a page with theme layout
async function renderPage(template, data = {}) {
  try {
    const engine = registerShopifyTags(getLiquidEngine());
    
    // Load theme settings from settings_data.json
    const themeSettings = loadThemeSettings();
    
    // Create font objects for the theme
    const type_body_font = createFontObject(themeSettings.type_body_font);
    const type_header_font = createFontObject(themeSettings.type_header_font);
    
    // Merge theme settings with mock settings and add color schemes
    const mergedSettings = {
      ...mockData.settings,
      ...themeSettings,
      type_body_font,
      type_header_font,
      color_schemes: createColorSchemes()
    };
    
    const fullData = {
      ...mockData,
      settings: mergedSettings,
      ...data,
      content_for_header: '',
      canonical_url: mockData.shop.url + (data.request?.path || '/')
    };

    const themeLayoutPath = path.join(THEME_DIR, 'layout', 'theme.liquid');
    if (!fs.existsSync(themeLayoutPath)) {
      throw new Error('theme.liquid not found in layout folder');
    }
    
    const themeLayout = fs.readFileSync(themeLayoutPath, 'utf8');
    
    let pageContent = '';
    const templatePath = path.join(THEME_DIR, 'templates', template);
    
    if (template && fs.existsSync(templatePath)) {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      
      if (template.endsWith('.json')) {
        const templateData = JSON.parse(templateContent);
        pageContent = '';
        
        // Respect Shopify's section order array
        const sectionOrder = templateData.order || Object.keys(templateData.sections || {});
        
        for (const sectionKey of sectionOrder) {
          const sectionConfig = templateData.sections?.[sectionKey];
          if (sectionConfig && sectionConfig.type) {
            const sectionFile = `${sectionConfig.type}.liquid`;
            const sectionPath = path.join(THEME_DIR, 'sections', sectionFile);
            
            if (fs.existsSync(sectionPath)) {
              try {
                const blocks = [];
                const blockOrder = sectionConfig.block_order || Object.keys(sectionConfig.blocks || {});
                
                if (sectionConfig.blocks) {
                  for (const blockId of blockOrder) {
                    const blockConfig = sectionConfig.blocks[blockId];
                    if (blockConfig) {
                      const processedBlockSettings = await processSettingsWithLiquid(
                        blockConfig.settings || {},
                        fullData,
                        engine
                      );
                      blocks.push({
                        id: blockId,
                        type: blockConfig.type,
                        settings: processedBlockSettings,
                        shopify_attributes: ''
                      });
                    }
                  }
                }
                
                // Add .first and .last properties to blocks array for Liquid compatibility
                if (blocks.length > 0) {
                  blocks.first = blocks[0];
                  blocks.last = blocks[blocks.length - 1];
                }
                
                // Handle product references in section settings
                let sectionSettings = { ...(sectionConfig.settings || {}) };
                if (sectionSettings.product && typeof sectionSettings.product === 'string') {
                  // Try to find the product by handle
                  const product = fullData.products.find(p => p.handle === sectionSettings.product);
                  // If not found, use the first product as fallback
                  sectionSettings.product = product || fullData.products[0];
                }
                if (sectionSettings.collection && typeof sectionSettings.collection === 'string') {
                  sectionSettings.collection = fullData.collections[sectionSettings.collection] || fullData.collections.all;
                }
                
                const sectionData = {
                  ...fullData,
                  section: {
                    id: sectionKey,
                    settings: sectionSettings,
                    blocks: blocks,
                    shopify_attributes: ''
                  }
                };
                
                // Process Liquid in settings
                sectionData.section.settings = await processSettingsWithLiquid(sectionSettings, sectionData, engine);
                
                const rendered = await engine.renderFile(sectionFile, sectionData);
                pageContent += rendered;
              } catch (err) {
                console.error(`Error rendering section ${sectionFile}:`, err.message);
                pageContent += `<!-- Error rendering section: ${sectionFile} -->`;
              }
            }
          }
        }
      } else {
        pageContent = await engine.parseAndRender(templateContent, fullData);
      }
    }
    
    fullData.content_for_layout = pageContent;
    const html = await engine.parseAndRender(themeLayout, fullData);
    return html;
  } catch (error) {
    console.error('Render error:', error);
    throw error;
  }
}

// ===== ADMIN/MANAGEMENT INTERFACE =====

// Admin dashboard
app.get('/admin', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shopify Theme Preview Tool</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .card {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        .card h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 20px;
        }
        .card p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: transform 0.2s, box-shadow 0.2s;
            border: none;
            cursor: pointer;
            font-size: 14px;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        }
        .btn-secondary {
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
        }
        .btn-secondary:hover {
            background: #f8f9ff;
        }
        .upload-area {
            border: 3px dashed #667eea;
            border-radius: 15px;
            padding: 40px;
            text-align: center;
            background: #f8f9ff;
            margin-bottom: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .upload-area:hover {
            border-color: #764ba2;
            background: #f0f2ff;
        }
        .upload-area.dragover {
            background: #e8ebff;
            border-color: #764ba2;
        }
        #fileInput {
            display: none;
        }
        .file-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
        .status {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            display: none;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
        }
        .features {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        .features h3 {
            color: #333;
            margin-bottom: 20px;
        }
        .features ul {
            list-style: none;
        }
        .features li {
            padding: 10px 0;
            color: #666;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .features li:before {
            content: "✓";
            color: #667eea;
            font-weight: bold;
            font-size: 18px;
        }
        .progress {
            width: 100%;
            height: 6px;
            background: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            margin-top: 15px;
            display: none;
        }
        .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            width: 0%;
            transition: width 0.3s;
        }
        .action-buttons {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>
                <span style="font-size: 40px;">🎨</span>
                Shopify Theme Preview Tool
            </h1>
            <p class="subtitle">Upload, preview, edit, and download Shopify themes with ease</p>
        </div>

        <div class="status" id="status"></div>

        <div class="grid">
            <div class="card">
                <h2>📦 Upload Theme</h2>
                <p>Upload a Shopify theme ZIP file to preview and edit it</p>
                <div class="upload-area" id="uploadArea">
                    <div class="file-icon">📁</div>
                    <h3 style="color: #667eea; margin-bottom: 10px;">Drop your theme ZIP here</h3>
                    <p style="color: #999; margin-bottom: 15px;">or click to browse</p>
                    <input type="file" id="fileInput" accept=".zip" />
                </div>
                <div class="progress" id="progress">
                    <div class="progress-bar" id="progressBar"></div>
                </div>
            </div>

            <div class="card">
                <h2>👁️ Preview Theme</h2>
                <p>View your theme exactly as it would appear in Shopify</p>
                <div class="action-buttons">
                    <a href="/preview" class="btn" target="_blank">Open Preview</a>
                    <a href="/preview/info" class="btn btn-secondary" target="_blank">View Info</a>
                </div>
            </div>

            <div class="card">
                <h2>📝 Edit Files</h2>
                <p>Browse and edit theme files with syntax highlighting</p>
                <a href="/admin/files" class="btn">File Manager</a>
            </div>

            <div class="card">
                <h2>⬇️ Download Theme</h2>
                <p>Download your modified theme as a ZIP file for Shopify</p>
                <a href="/admin/download" class="btn">Download ZIP</a>
            </div>
        </div>

        <div class="features">
            <h3>✨ Features</h3>
            <ul>
                <li>Upload any Shopify theme ZIP file</li>
                <li>Live preview with mock product data</li>
                <li>Edit all theme files (Liquid, CSS, JS)</li>
                <li>Preserve Shopify-compatible structure</li>
                <li>Download modified theme for direct Shopify upload</li>
                <li>No Shopify account required for development</li>
            </ul>
        </div>
    </div>

    <script>
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const status = document.getElementById('status');
        const progress = document.getElementById('progress');
        const progressBar = document.getElementById('progressBar');

        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFile(e.target.files[0]);
            }
        });

        function showStatus(message, isError = false) {
            status.textContent = message;
            status.className = 'status ' + (isError ? 'error' : '');
            status.style.display = 'block';
            setTimeout(() => {
                status.style.display = 'none';
            }, 5000);
        }

        function handleFile(file) {
            if (!file.name.endsWith('.zip')) {
                showStatus('Please upload a ZIP file', true);
                return;
            }

            const formData = new FormData();
            formData.append('theme', file);

            progress.style.display = 'block';
            progressBar.style.width = '0%';

            fetch('/admin/upload', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                progressBar.style.width = '100%';
                setTimeout(() => {
                    progress.style.display = 'none';
                    if (data.success) {
                        showStatus('✓ Theme uploaded successfully! You can now preview it.');
                    } else {
                        showStatus('Error: ' + (data.error || 'Upload failed'), true);
                    }
                }, 500);
            })
            .catch(error => {
                progress.style.display = 'none';
                showStatus('Upload failed: ' + error.message, true);
            });
        }
    </script>
</body>
</html>
  `);
});

// Upload endpoint
app.post('/admin/upload', (req, res) => {
  try {
    if (!req.files || !req.files.theme) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const themeFile = req.files.theme;
    
    if (!themeFile.name.endsWith('.zip')) {
      return res.status(400).json({ success: false, error: 'File must be a ZIP archive' });
    }

    // Clear current theme directory
    if (fs.existsSync(THEME_DIR)) {
      fs.rmSync(THEME_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(THEME_DIR, { recursive: true });

    // Extract ZIP
    const zip = new AdmZip(themeFile.data);
    zip.extractAllTo(THEME_DIR, true);

    // Check if extraction created a nested folder (some zips do this)
    const entries = fs.readdirSync(THEME_DIR);
    if (entries.length === 1 && fs.statSync(path.join(THEME_DIR, entries[0])).isDirectory()) {
      // Move contents up one level
      const nestedDir = path.join(THEME_DIR, entries[0]);
      const tempDir = path.join(__dirname, 'temp-extract');
      fs.renameSync(nestedDir, tempDir);
      fs.rmSync(THEME_DIR, { recursive: true, force: true });
      fs.renameSync(tempDir, THEME_DIR);
    }

    // Verify required structure
    const layoutDir = path.join(THEME_DIR, 'layout');
    const themeLiquid = path.join(layoutDir, 'theme.liquid');
    
    if (!fs.existsSync(themeLiquid)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Shopify theme: missing layout/theme.liquid' 
      });
    }

    res.json({ success: true, message: 'Theme uploaded successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// File manager with live preview
app.get('/admin/files', (req, res) => {
  const filePath = req.query.file || '';
  const fullPath = path.join(THEME_DIR, filePath);
  
  let content = '';
  let isFile = false;
  let fileList = [];

  if (filePath && fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    content = fs.readFileSync(fullPath, 'utf8');
    isFile = true;
  } else {
    // List files
    function getFileTree(dir, prefix = '') {
      const items = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const relativePath = path.join(prefix, entry.name);
        if (entry.isDirectory()) {
          items.push({ name: entry.name, path: relativePath, isDir: true });
          items.push(...getFileTree(path.join(dir, entry.name), relativePath));
        } else {
          items.push({ name: entry.name, path: relativePath, isDir: false });
        }
      }
      
      return items;
    }
    
    fileList = getFileTree(THEME_DIR);
  }

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Editor - Shopify Theme Tool</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/dracula.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            height: 100vh;
            background: #f5f5f5;
            overflow: hidden;
        }
        .sidebar {
            width: 250px;
            background: #2c3e50;
            color: white;
            overflow-y: auto;
            padding: 15px;
            display: flex;
            flex-direction: column;
        }
        .sidebar h2 {
            margin-bottom: 15px;
            font-size: 16px;
            padding-bottom: 10px;
            border-bottom: 1px solid #34495e;
        }
        .file-tree {
            list-style: none;
            flex: 1;
            overflow-y: auto;
        }
        .file-tree li {
            padding: 6px 8px;
            cursor: pointer;
            border-radius: 4px;
            margin: 1px 0;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
        }
        .file-tree li:hover {
            background: #34495e;
        }
        .file-tree li.active {
            background: #667eea;
        }
        .folder { font-weight: bold; }
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .toolbar {
            background: #667eea;
            color: white;
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .toolbar h1 {
            font-size: 16px;
            font-weight: 600;
        }
        .toolbar-buttons {
            display: flex;
            gap: 10px;
        }
        .btn {
            background: white;
            color: #667eea;
            padding: 6px 14px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 600;
            text-decoration: none;
            display: inline-block;
            font-size: 13px;
            transition: all 0.2s;
        }
        .btn:hover {
            background: #f0f0f0;
            transform: translateY(-1px);
        }
        .btn-success {
            background: #10b981;
            color: white;
        }
        .btn-success:hover {
            background: #059669;
        }
        .split-view {
            flex: 1;
            display: flex;
            overflow: hidden;
        }
        .editor-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #1e1e1e;
            border-right: 1px solid #ddd;
        }
        .preview-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #fff;
        }
        .panel-header {
            background: #f8f9fa;
            padding: 10px 15px;
            border-bottom: 1px solid #dee2e6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .panel-header h3 {
            font-size: 14px;
            font-weight: 600;
            color: #495057;
        }
        .preview-controls {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .preview-controls select {
            padding: 4px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 12px;
        }
        #editor {
            flex: 1;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
            font-size: 13px;
            padding: 15px;
            border: none;
            background: #1e1e1e;
            color: #d4d4d4;
            resize: none;
            outline: none;
            line-height: 1.6;
        }
        .CodeMirror {
            height: 100%;
            font-size: 13px;
            line-height: 1.6;
        }
        #preview-frame {
            flex: 1;
            border: none;
            background: white;
        }
        .no-file {
            text-align: center;
            padding: 100px 20px;
            color: #999;
        }
        .no-file h2 {
            margin-bottom: 10px;
            color: #666;
        }
        .status {
            background: #d4edda;
            color: #155724;
            padding: 8px 20px;
            display: none;
            font-size: 13px;
            border-bottom: 1px solid #c3e6cb;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border-bottom: 1px solid #f5c6cb;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #999;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <h2>📁 Theme Files</h2>
        <ul class="file-tree">
            ${fileList.map(item => `
                <li class="${item.isDir ? 'folder' : 'file'} ${item.path === filePath ? 'active' : ''}" 
                    data-path="${item.path}"
                    data-isdir="${item.isDir}">
                    <span>${item.isDir ? '📁' : '📄'}</span>
                    <span>${item.name}</span>
                </li>
            `).join('')}
        </ul>
    </div>
    <div class="main-content">
        <div class="toolbar">
            <h1>${isFile ? '✏️ ' + filePath : '📝 Live Editor'}</h1>
            <div class="toolbar-buttons">
                ${isFile ? '<button class="btn btn-success" onclick="saveFile()">💾 Save & Refresh</button>' : ''}
                <a href="/admin" class="btn">← Dashboard</a>
            </div>
        </div>
        <div class="status" id="status"></div>
        ${isFile ? `
        <div class="split-view">
            <div class="editor-panel">
                <div class="panel-header">
                    <h3>📝 Editor</h3>
                    <div style="font-size: 11px; color: #6c757d;">Press Ctrl+S to save</div>
                </div>
                <textarea id="editor">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
            </div>
            <div class="preview-panel">
                <div class="panel-header">
                    <h3>👁️ Live Preview</h3>
                    <div class="preview-controls">
                        <select id="page-selector" onchange="changePage()">
                            <option value="/preview">Homepage</option>
                            <option value="/preview/products/wireless-bluetooth-speaker">Product: Speaker</option>
                            <option value="/preview/products/organic-cotton-tshirt">Product: T-Shirt</option>
                            <option value="/preview/products/stainless-steel-water-bottle">Product: Water Bottle</option>
                            <option value="/preview/collections/all">Collection: All</option>
                            <option value="/preview/cart">Cart Page</option>
                        </select>
                        <button class="btn" onclick="refreshPreview()" style="padding: 4px 10px; font-size: 12px;">🔄 Refresh</button>
                    </div>
                </div>
                <iframe id="preview-frame" src="/preview"></iframe>
            </div>
        </div>
        ` : `
        <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
            <div class="no-file">
                <h2>Welcome to Live Editor</h2>
                <p>Select a file from the sidebar to edit it with live preview</p>
                <p style="margin-top: 20px; color: #999; font-size: 14px;">Changes will be visible in real-time in the preview panel</p>
            </div>
        </div>
        `}
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/htmlmixed/htmlmixed.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/xml/xml.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/javascript/javascript.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/css/css.min.js"></script>
    <script>
        let editor;
        
        // Initialize CodeMirror if we have a file open
        ${isFile ? `
        const textarea = document.getElementById('editor');
        editor = CodeMirror.fromTextArea(textarea, {
            mode: 'htmlmixed',
            theme: 'dracula',
            lineNumbers: true,
            lineWrapping: true,
            indentUnit: 2,
            tabSize: 2,
            indentWithTabs: false,
            autofocus: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            extraKeys: {
                'Ctrl-S': function(cm) {
                    saveFile();
                },
                'Cmd-S': function(cm) {
                    saveFile();
                }
            }
        });
        ` : ''}
        
        // File tree click handler
        document.querySelectorAll('.file-tree li').forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                const isDir = item.dataset.isdir === 'true';
                if (!isDir) {
                    window.location.href = '/admin/files?file=' + encodeURIComponent(path);
                }
            });
        });

        function saveFile() {
            const filePath = '${filePath}';
            const content = editor ? editor.getValue() : document.getElementById('editor').value;
            
            fetch('/admin/save-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: filePath, content: content })
            })
            .then(res => res.json())
            .then(data => {
                const status = document.getElementById('status');
                if (data.success) {
                    status.textContent = '✓ File saved successfully! Preview refreshing...';
                    status.className = 'status';
                    status.style.display = 'block';
                    
                    // Refresh the preview iframe
                    setTimeout(() => {
                        refreshPreview();
                        status.textContent = '✓ File saved and preview refreshed!';
                        setTimeout(() => status.style.display = 'none', 2000);
                    }, 300);
                } else {
                    status.textContent = '✗ Error: ' + data.error;
                    status.className = 'status error';
                    status.style.display = 'block';
                    setTimeout(() => status.style.display = 'none', 4000);
                }
            })
            .catch(err => {
                const status = document.getElementById('status');
                status.textContent = '✗ Save failed: ' + err.message;
                status.className = 'status error';
                status.style.display = 'block';
                setTimeout(() => status.style.display = 'none', 4000);
            });
        }

        function refreshPreview() {
            const iframe = document.getElementById('preview-frame');
            if (iframe) {
                // Force reload by setting src again
                const currentSrc = iframe.src;
                iframe.src = 'about:blank';
                setTimeout(() => {
                    iframe.src = currentSrc;
                }, 50);
            }
        }

        function changePage() {
            const selector = document.getElementById('page-selector');
            const iframe = document.getElementById('preview-frame');
            if (iframe && selector) {
                iframe.src = selector.value;
            }
        }
    </script>
</body>
</html>
  `);
});

// Save file endpoint
app.post('/admin/save-file', (req, res) => {
  try {
    const { file, content } = req.body;
    const fullPath = path.join(THEME_DIR, file);
    
    // Security: ensure file is within theme directory
    if (!fullPath.startsWith(THEME_DIR)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download theme as ZIP
app.get('/admin/download', (req, res) => {
  try {
    const zip = new AdmZip();
    
    function addFolderToZip(folderPath, zipPath = '') {
      const entries = fs.readdirSync(folderPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name);
        const zipFilePath = path.join(zipPath, entry.name);
        
        if (entry.isDirectory()) {
          addFolderToZip(fullPath, zipFilePath);
        } else {
          zip.addLocalFile(fullPath, zipPath);
        }
      }
    }
    
    addFolderToZip(THEME_DIR);
    
    const zipBuffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=shopify-theme.zip');
    res.send(zipBuffer);
  } catch (error) {
    res.status(500).send('Error creating ZIP: ' + error.message);
  }
});

// ===== THEME PREVIEW ROUTES =====

// Preview homepage
app.get('/preview', async (req, res) => {
  try {
    const html = await renderPage('index.json', {
      request: { ...mockData.request, page_type: 'index', path: '/preview' }
    });
    res.send(html);
  } catch (error) {
    res.status(500).send(`
      <h1>Rendering Error</h1>
      <p>There was an error rendering the homepage.</p>
      <pre>${error.message}</pre>
      <p><a href="/preview/info">View Information Page</a> | <a href="/admin">Back to Admin</a></p>
    `);
  }
});

// Preview product page
app.get('/preview/products/:handle', async (req, res) => {
  try {
    const product = mockData.getProductByHandle(req.params.handle);
    if (!product) {
      return res.status(404).send('<h1>Product Not Found</h1><p><a href="/preview">Back</a></p>');
    }

    const html = await renderPage('product.json', {
      product,
      request: { ...mockData.request, page_type: 'product', path: req.path }
    });
    res.send(html);
  } catch (error) {
    res.status(500).send(`
      <h1>Rendering Error</h1>
      <pre>${error.message}</pre>
      <p><a href="/preview/info">View Information Page</a></p>
    `);
  }
});

// Preview collection page
app.get('/preview/collections/:handle', async (req, res) => {
  try {
    const collection = mockData.collections[req.params.handle];
    if (!collection) {
      return res.status(404).send('<h1>Collection Not Found</h1><p><a href="/preview">Back</a></p>');
    }

    const html = await renderPage('collection.json', {
      collection,
      request: { ...mockData.request, page_type: 'collection', path: req.path }
    });
    res.send(html);
  } catch (error) {
    res.status(500).send(`
      <h1>Rendering Error</h1>
      <pre>${error.message}</pre>
      <p><a href="/preview/info">View Information Page</a></p>
    `);
  }
});

// Preview cart page
app.get('/preview/cart', async (req, res) => {
  try {
    const html = await renderPage('cart.json', {
      request: { ...mockData.request, page_type: 'cart', path: '/preview/cart' }
    });
    res.send(html);
  } catch (error) {
    res.status(500).send(`
      <h1>Rendering Error</h1>
      <pre>${error.message}</pre>
      <p><a href="/preview/info">View Information Page</a></p>
    `);
  }
});

// Preview info page
app.get('/preview/info', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shopify Theme Preview - Info</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; margin-top: 0; }
        h2 { color: #667eea; margin-top: 30px; }
        .success { background: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; margin: 20px 0; }
        .info { background: #d1ecf1; padding: 15px; border-radius: 5px; border-left: 4px solid #17a2b8; margin: 20px 0; }
        ul { line-height: 1.8; }
        a { color: #667eea; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 5px; margin: 10px 5px; text-decoration: none; }
        .btn:hover { background: #5568d3; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Shopify Theme Preview</h1>
        
        <div class="success">
            <strong>✓ Success!</strong> Your Shopify theme is now rendering with mock data!
        </div>
        
        <div class="info">
            <strong>ℹ️ Preview Mode:</strong> This server renders your Shopify theme with sample products and data.
        </div>

        <h2>📱 Available Preview Pages</h2>
        <ul>
            <li><a href="/preview">Homepage</a> - Main landing page with featured products</li>
            <li><a href="/preview/collections/all">All Products Collection</a> - Browse all products</li>
            <li><a href="/preview/products/wireless-bluetooth-speaker">Product: Bluetooth Speaker</a></li>
            <li><a href="/preview/products/organic-cotton-tshirt">Product: Organic T-Shirt</a></li>
            <li><a href="/preview/products/leather-wallet">Product: Leather Wallet</a></li>
            <li><a href="/preview/products/stainless-steel-water-bottle">Product: Water Bottle</a></li>
            <li><a href="/preview/cart">Shopping Cart</a></li>
        </ul>

        <h2>🛠️ What You Can Do</h2>
        <ul>
            <li>Upload any Shopify theme ZIP file</li>
            <li>Preview the theme with mock product data</li>
            <li>Edit theme files (Liquid, CSS, JS)</li>
            <li>Download modified theme for Shopify upload</li>
            <li>Test theme changes in real-time</li>
        </ul>

        <div style="margin-top: 30px; text-align: center;">
            <a href="/preview" class="btn">View Homepage</a>
            <a href="/admin" class="btn">Back to Admin</a>
        </div>
    </div>
</body>
</html>
  `);
});

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <h1>Page Not Found</h1>
    <p>The page "${req.path}" doesn't exist.</p>
    <p><a href="/admin">Go to Admin Dashboard</a> | <a href="/preview">View Preview</a></p>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎨 Shopify Theme Preview Tool`);
  console.log(`📍 Running on http://0.0.0.0:${PORT}`);
  console.log(`\n✨ Admin Dashboard: http://0.0.0.0:${PORT}/admin`);
  console.log(`👁️  Theme Preview: http://0.0.0.0:${PORT}/preview\n`);
});
