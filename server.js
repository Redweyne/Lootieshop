const express = require('express');
const path = require('path');
const fs = require('fs');
const { Liquid } = require('liquidjs');
const mockData = require('./mock-data');

const app = express();
const PORT = 5000;

// Initialize Liquid engine
const engine = new Liquid({
  root: [
    path.join(__dirname, 'layout'),
    path.join(__dirname, 'sections'),
    path.join(__dirname, 'snippets'),
    path.join(__dirname, 'templates')
  ],
  extname: '.liquid',
  cache: false,
  strictFilters: false,
  strictVariables: false
});

// Register Shopify-specific tags
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
  render: async function(ctx) {
    const html = await this.liquid.renderer.renderTemplates(this.tokens, ctx);
    return `<style>${html}</style>`;
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
    return ''; // Schema is for the Shopify admin, not rendered on frontend
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
  render: async function(ctx) {
    const html = await this.liquid.renderer.renderTemplates(this.tokens, ctx);
    return `<script>${html}</script>`;
  }
});

engine.registerTag('sections', {
  parse: function(tagToken) {
    this.group = tagToken.args.trim().replace(/['"]/g, '');
  },
  render: async function(ctx) {
    // Render section group (header-group, footer-group)
    const groupFile = `${this.group}.json`;
    const groupPath = path.join(__dirname, 'sections', groupFile);
    
    if (fs.existsSync(groupPath)) {
      try {
        const groupData = JSON.parse(fs.readFileSync(groupPath, 'utf8'));
        let html = '';
        
        for (const [sectionKey, sectionConfig] of Object.entries(groupData.sections || {})) {
          if (sectionConfig.type) {
            const sectionFile = `${sectionConfig.type}.liquid`;
            const sectionData = {
              ...ctx.getAll(),
              section: {
                id: sectionKey,
                settings: sectionConfig.settings || {}
              }
            };
            
            try {
              const rendered = await this.liquid.renderFile(sectionFile, sectionData);
              html += rendered;
            } catch (err) {
              console.error(`Error rendering section ${sectionFile}:`, err.message);
            }
          }
        }
        
        return html;
      } catch (err) {
        console.error(`Error loading section group ${groupFile}:`, err.message);
        return '';
      }
    }
    
    return '';
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
  render: async function(ctx) {
    const content = await this.liquid.renderer.renderTemplates(this.tokens, ctx);
    return `<form class="shopify-${this.formType}-form" method="post">${content}</form>`;
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
  render: async function(ctx) {
    // Simple pagination mock - just render the content
    const paginate = {
      current_page: 1,
      pages: 1,
      items: 12,
      page_size: 12,
      previous: null,
      next: null
    };
    ctx.environments.paginate = paginate;
    const html = await this.liquid.renderer.renderTemplates(this.tokens, ctx);
    return html;
  }
});

// Register custom Liquid filters
engine.registerFilter('asset_url', (input) => `/assets/${input}`);
engine.registerFilter('img_url', (input, size) => input);
engine.registerFilter('image_url', (input, size) => input);
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
  // Mock font face generation - return empty string as fonts are loaded via CSS
  return '';
});
engine.registerFilter('font_modify', (input, property, value) => {
  // Mock font modification - just return the input
  return input || `font-family: sans-serif`;
});
engine.registerFilter('color_brightness', (color) => {
  // Mock color brightness calculation
  return 128; // Mid brightness
});
engine.registerFilter('color_lighten', (color, amount) => {
  // Mock color lightening
  return color;
});
engine.registerFilter('color_darken', (color, amount) => {
  // Mock color darkening
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

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Helper to render a page with theme layout
async function renderPage(template, data = {}) {
  try {
    // Merge mock data with page-specific data
    const fullData = {
      ...mockData,
      ...data,
      content_for_header: '', // Shopify injects scripts here
      canonical_url: mockData.shop.url + (data.request?.path || '/')
    };

    // Read the theme layout
    const themeLayout = fs.readFileSync(path.join(__dirname, 'layout', 'theme.liquid'), 'utf8');
    
    // Render the page template
    let pageContent = '';
    if (template && fs.existsSync(path.join(__dirname, 'templates', template))) {
      const templateContent = fs.readFileSync(path.join(__dirname, 'templates', template), 'utf8');
      
      // Check if it's a JSON template (section-based)
      if (template.endsWith('.json')) {
        const templateData = JSON.parse(templateContent);
        pageContent = '';
        
        // Render each section
        for (const [sectionKey, sectionConfig] of Object.entries(templateData.sections || {})) {
          if (sectionConfig.type) {
            const sectionFile = `${sectionConfig.type}.liquid`;
            const sectionPath = path.join(__dirname, 'sections', sectionFile);
            
            if (fs.existsSync(sectionPath)) {
              try {
                const sectionData = {
                  ...fullData,
                  section: {
                    id: sectionKey,
                    settings: sectionConfig.settings || {}
                  }
                };
                
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
        // Render liquid template
        pageContent = await engine.parseAndRender(templateContent, fullData);
      }
    }
    
    // Insert page content into layout
    fullData.content_for_layout = pageContent;
    
    // Render the full theme
    const html = await engine.parseAndRender(themeLayout, fullData);
    return html;
  } catch (error) {
    console.error('Render error:', error);
    throw error;
  }
}

// Homepage
app.get('/', async (req, res) => {
  try {
    const html = await renderPage('index.json', {
      request: { ...mockData.request, page_type: 'index', path: '/' }
    });
    res.send(html);
  } catch (error) {
    res.status(500).send(`
      <h1>Rendering Error</h1>
      <p>There was an error rendering the homepage.</p>
      <pre>${error.message}</pre>
      <p><a href="/info">View Information Page</a></p>
    `);
  }
});

// Product page
app.get('/products/:handle', async (req, res) => {
  try {
    const product = mockData.getProductByHandle(req.params.handle);
    if (!product) {
      return res.status(404).send('<h1>Product Not Found</h1>');
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
      <p><a href="/info">View Information Page</a></p>
    `);
  }
});

// Collection page
app.get('/collections/:handle', async (req, res) => {
  try {
    const collection = mockData.collections[req.params.handle];
    if (!collection) {
      return res.status(404).send('<h1>Collection Not Found</h1>');
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
      <p><a href="/info">View Information Page</a></p>
    `);
  }
});

// Cart page
app.get('/cart', async (req, res) => {
  try {
    const html = await renderPage('cart.json', {
      request: { ...mockData.request, page_type: 'cart', path: '/cart' }
    });
    res.send(html);
  } catch (error) {
    res.status(500).send(`
      <h1>Rendering Error</h1>
      <pre>${error.message}</pre>
      <p><a href="/info">View Information Page</a></p>
    `);
  }
});

// Info page (fallback)
app.get('/info', (req, res) => {
  const htmlContent = `
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
            <strong>ℹ️ Preview Mode:</strong> This server renders your Shopify theme with sample products and data so you can see and modify the design before deploying to Shopify.
        </div>

        <h2>📱 Available Pages</h2>
        <ul>
            <li><a href="/">Homepage</a> - Main landing page with featured products</li>
            <li><a href="/collections/all">All Products Collection</a> - Browse all products</li>
            <li><a href="/products/wireless-bluetooth-speaker">Product: Bluetooth Speaker</a></li>
            <li><a href="/products/organic-cotton-tshirt">Product: Organic T-Shirt</a></li>
            <li><a href="/products/leather-wallet">Product: Leather Wallet</a></li>
            <li><a href="/products/stainless-steel-water-bottle">Product: Water Bottle</a></li>
            <li><a href="/cart">Shopping Cart</a></li>
        </ul>

        <h2>🛠️ What You Can Do</h2>
        <ul>
            <li>Preview your theme's design and layout</li>
            <li>Edit CSS files in <code>/assets</code> to change styling</li>
            <li>Modify Liquid templates in <code>/sections</code> and <code>/templates</code></li>
            <li>Update mock data in <code>mock-data.js</code> to test different scenarios</li>
            <li>See changes in real-time as you develop</li>
        </ul>

        <h2>📝 Next Steps</h2>
        <ul>
            <li>Customize your theme using the files in this project</li>
            <li>When ready, connect to Shopify using Shopify CLI</li>
            <li>Push your theme to your Shopify store</li>
        </ul>

        <div style="margin-top: 30px; text-align: center;">
            <a href="/" class="btn">View Homepage</a>
            <a href="/collections/all" class="btn">Browse Products</a>
        </div>
    </div>
</body>
</html>
  `;
  
  res.send(htmlContent);
});

// Catch-all for missing pages
app.use((req, res) => {
  res.status(404).send(`
    <h1>Page Not Found</h1>
    <p>The page "${req.path}" doesn't exist in this preview.</p>
    <p><a href="/info">View Available Pages</a> | <a href="/">Go to Homepage</a></p>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎨 Shopify Theme Preview Server`);
  console.log(`📍 Running on http://0.0.0.0:${PORT}`);
  console.log(`\n✨ Your theme is now rendering with mock data!`);
  console.log(`📄 Visit /info for available pages and options\n`);
});
