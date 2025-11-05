const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Serve static assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Create a simple index page explaining this is a Shopify theme
app.get('/', (req, res) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shopify Theme Preview</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 800px;
            width: 100%;
            padding: 40px;
        }
        
        h1 {
            color: #333;
            font-size: 2.5rem;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .shopify-logo {
            text-align: center;
            margin-bottom: 30px;
            font-size: 4rem;
        }
        
        .info-box {
            background: #f7f7f7;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .info-box h2 {
            color: #667eea;
            font-size: 1.3rem;
            margin-bottom: 10px;
        }
        
        .info-box p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 10px;
        }
        
        .steps {
            background: #fff;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 25px;
            margin: 20px 0;
        }
        
        .steps h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 1.2rem;
        }
        
        .steps ol {
            padding-left: 20px;
        }
        
        .steps li {
            color: #555;
            margin: 10px 0;
            line-height: 1.6;
        }
        
        .steps code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #d63384;
        }
        
        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .warning strong {
            color: #856404;
        }
        
        .assets-link {
            text-align: center;
            margin-top: 30px;
        }
        
        .btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: background 0.3s;
        }
        
        .btn:hover {
            background: #5568d3;
        }
        
        footer {
            text-align: center;
            margin-top: 30px;
            color: #999;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="shopify-logo">🛍️</div>
        <h1>Shopify Theme Repository</h1>
        
        <div class="info-box">
            <h2>What is this?</h2>
            <p>This is a Shopify theme that contains templates, styles, and scripts designed to run on Shopify's e-commerce platform.</p>
        </div>
        
        <div class="warning">
            <strong>⚠️ Important:</strong> This theme cannot function as a standalone website. It requires a Shopify store to work properly, as it uses Shopify's Liquid templating engine and relies on Shopify's backend for products, cart, checkout, and other e-commerce features.
        </div>
        
        <div class="steps">
            <h3>🚀 How to Use This Theme</h3>
            <ol>
                <li>
                    <strong>Get a Shopify Store:</strong><br>
                    Sign up for a free Shopify Partner account at <code>partners.shopify.com</code> and create a development store.
                </li>
                <li>
                    <strong>Install Shopify CLI:</strong><br>
                    Run: <code>npm install -g @shopify/cli @shopify/theme</code>
                </li>
                <li>
                    <strong>Authenticate:</strong><br>
                    Run: <code>shopify auth login</code>
                </li>
                <li>
                    <strong>Start Development:</strong><br>
                    Run: <code>shopify theme dev --store your-store.myshopify.com</code>
                </li>
            </ol>
        </div>
        
        <div class="steps">
            <h3>📁 Project Structure</h3>
            <ul style="list-style: none; padding-left: 0;">
                <li>📂 <strong>assets/</strong> - CSS, JavaScript, images, and icons</li>
                <li>📂 <strong>config/</strong> - Theme settings and configuration</li>
                <li>📂 <strong>layout/</strong> - Base layout templates</li>
                <li>📂 <strong>sections/</strong> - Reusable page sections</li>
                <li>📂 <strong>snippets/</strong> - Reusable code blocks</li>
                <li>📂 <strong>templates/</strong> - Page templates</li>
                <li>📂 <strong>locales/</strong> - Translation files</li>
            </ul>
        </div>
        
        <div class="assets-link">
            <a href="/assets/" class="btn">📦 Browse Static Assets</a>
        </div>
        
        <footer>
            <p>Need help? Visit <a href="https://shopify.dev/docs/themes" target="_blank" style="color: #667eea;">Shopify Theme Documentation</a></p>
        </footer>
    </div>
</body>
</html>
  `;
  
  res.send(htmlContent);
});

// List assets directory
app.get('/assets/', (req, res) => {
  fs.readdir(path.join(__dirname, 'assets'), (err, files) => {
    if (err) {
      return res.status(500).send('Error reading assets directory');
    }
    
    const fileList = files.map(file => {
      const ext = path.extname(file);
      let icon = '📄';
      if (['.css'].includes(ext)) icon = '🎨';
      if (['.js'].includes(ext)) icon = '⚙️';
      if (['.svg', '.png', '.jpg', '.gif'].includes(ext)) icon = '🖼️';
      
      return `<li><a href="/assets/${file}">${icon} ${file}</a></li>`;
    }).join('');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Assets Directory</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 40px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            margin: 0;
            color: #333;
        }
        .back-link {
            display: inline-block;
            margin-top: 10px;
            color: #667eea;
            text-decoration: none;
        }
        .file-list {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        ul {
            list-style: none;
            padding: 0;
        }
        li {
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        li:last-child {
            border-bottom: none;
        }
        a {
            color: #333;
            text-decoration: none;
        }
        a:hover {
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📦 Assets Directory</h1>
        <a href="/" class="back-link">← Back to Home</a>
    </div>
    <div class="file-list">
        <ul>${fileList}</ul>
    </div>
</body>
</html>
    `;
    
    res.send(html);
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Shopify theme preview server running on port ${PORT}`);
  console.log(`Visit http://0.0.0.0:${PORT} to view the information page`);
});
