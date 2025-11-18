// Mock Shopify data for theme preview

const mockData = {
  shop: {
    name: "Demo Store",
    description: "A beautiful e-commerce store",
    domain: "demo-store.myshopify.com",
    url: "http://localhost:5000",
    email: "contact@demo-store.com",
    currency: "USD",
    money_format: "${{amount}}",
    money_with_currency_format: "${{amount}} USD",
    checkout: {
      guest_login: true
    }
  },
  
  routes: {
    root_url: "/",
    account_url: "/account",
    account_login_url: "/account/login",
    account_logout_url: "/account/logout",
    account_register_url: "/account/register",
    account_addresses_url: "/account/addresses",
    collections_url: "/collections",
    all_products_collection_url: "/collections/all",
    cart_url: "/cart",
    cart_add_url: "/cart/add",
    cart_change_url: "/cart/change",
    cart_update_url: "/cart/update",
    search_url: "/search"
  },

  settings: {
    logo_width: 90,
    type_header_font: "quicksand_n4",
    heading_scale: 100,
    type_body_font: "nunito_n4",
    body_scale: 100,
    page_width: 1200,
    favicon: null,
    predictive_search_enabled: true,
    social_facebook_link: "",
    social_instagram_link: "",
    social_youtube_link: "",
    social_tiktok_link: "",
    social_twitter_link: "",
    social_pinterest_link: "",
    social_snapchat_link: "",
    social_tumblr_link: "",
    social_vimeo_link: ""
  },

  request: {
    locale: { iso_code: "en" },
    page_type: "index",
    path: "/"
  },

  linklists: {
    "main-menu": {
      links: [
        { title: "Home", url: "/", active: true },
        { title: "Shop All", url: "/collections/all", active: false },
        { title: "About", url: "/pages/about", active: false },
        { title: "Contact", url: "/pages/contact", active: false }
      ]
    }
  },

  products: [
    {
      id: 1001,
      title: "Wireless Bluetooth Speaker",
      handle: "wireless-bluetooth-speaker",
      description: "<p>High-quality portable speaker with amazing sound.</p>",
      content: "<p>High-quality portable speaker with amazing sound.</p>",
      vendor: "TechBrand",
      type: "Electronics",
      url: "/products/wireless-bluetooth-speaker",
      available: true,
      price: 7999,
      price_min: 7999,
      price_max: 7999,
      price_varies: false,
      compare_at_price: 9999,
      featured_image: {
        src: "https://via.placeholder.com/800x800/667eea/ffffff?text=Speaker",
        alt: "Wireless Bluetooth Speaker"
      },
      images: [
        { src: "https://via.placeholder.com/800x800/667eea/ffffff?text=Speaker", alt: "Speaker front" },
        { src: "https://via.placeholder.com/800x800/764ba2/ffffff?text=Speaker", alt: "Speaker side" }
      ],
      tags: ["electronics", "audio", "portable"],
      variants: [
        {
          id: 10011,
          title: "Black",
          price: 7999,
          compare_at_price: 9999,
          available: true,
          option1: "Black",
          sku: "SPK-BLK-001"
        }
      ]
    },
    {
      id: 1002,
      title: "Organic Cotton T-Shirt",
      handle: "organic-cotton-tshirt",
      description: "<p>Soft, comfortable, and eco-friendly t-shirt.</p>",
      content: "<p>Soft, comfortable, and eco-friendly t-shirt.</p>",
      vendor: "EcoWear",
      type: "Apparel",
      url: "/products/organic-cotton-tshirt",
      available: true,
      price: 2499,
      price_min: 2499,
      price_max: 2499,
      price_varies: false,
      featured_image: {
        src: "https://via.placeholder.com/800x800/48bb78/ffffff?text=T-Shirt",
        alt: "Organic Cotton T-Shirt"
      },
      images: [
        { src: "https://via.placeholder.com/800x800/48bb78/ffffff?text=T-Shirt", alt: "T-Shirt front" }
      ],
      tags: ["apparel", "organic", "cotton"],
      variants: [
        {
          id: 10021,
          title: "Small / White",
          price: 2499,
          available: true,
          option1: "Small",
          option2: "White",
          sku: "TSH-WHT-S"
        },
        {
          id: 10022,
          title: "Medium / White",
          price: 2499,
          available: true,
          option1: "Medium",
          option2: "White",
          sku: "TSH-WHT-M"
        }
      ]
    },
    {
      id: 1003,
      title: "Leather Wallet",
      handle: "leather-wallet",
      description: "<p>Handcrafted genuine leather wallet.</p>",
      content: "<p>Handcrafted genuine leather wallet.</p>",
      vendor: "Artisan Goods",
      type: "Accessories",
      url: "/products/leather-wallet",
      available: true,
      price: 4999,
      price_min: 4999,
      price_max: 4999,
      price_varies: false,
      featured_image: {
        src: "https://via.placeholder.com/800x800/8b5a3c/ffffff?text=Wallet",
        alt: "Leather Wallet"
      },
      images: [
        { src: "https://via.placeholder.com/800x800/8b5a3c/ffffff?text=Wallet", alt: "Wallet closed" }
      ],
      tags: ["accessories", "leather", "handmade"],
      variants: [
        {
          id: 10031,
          title: "Brown",
          price: 4999,
          available: true,
          option1: "Brown",
          sku: "WLT-BRN-001"
        }
      ]
    },
    {
      id: 1004,
      title: "Stainless Steel Water Bottle",
      handle: "stainless-steel-water-bottle",
      description: "<p>Keep your drinks cold for 24 hours or hot for 12 hours.</p>",
      content: "<p>Keep your drinks cold for 24 hours or hot for 12 hours.</p>",
      vendor: "HydroLife",
      type: "Drinkware",
      url: "/products/stainless-steel-water-bottle",
      available: true,
      price: 3499,
      price_min: 3499,
      price_max: 3499,
      price_varies: false,
      compare_at_price: 4999,
      featured_image: {
        src: "https://via.placeholder.com/800x800/3498db/ffffff?text=Bottle",
        alt: "Water Bottle"
      },
      images: [
        { src: "https://via.placeholder.com/800x800/3498db/ffffff?text=Bottle", alt: "Water bottle" }
      ],
      tags: ["drinkware", "eco-friendly", "insulated"],
      variants: [
        {
          id: 10041,
          title: "Blue / 500ml",
          price: 3499,
          compare_at_price: 4999,
          available: true,
          option1: "Blue",
          option2: "500ml",
          sku: "BTL-BLU-500"
        }
      ]
    }
  ],

  collections: {
    all: {
      id: 1,
      title: "All Products",
      handle: "all",
      description: "Browse all our products",
      url: "/collections/all",
      products: [] // Will be filled with all products
    }
  },

  cart: {
    item_count: 0,
    items: [],
    total_price: 0,
    currency: "USD",
    note: ""
  },

  customer: null, // Not logged in

  page_title: "Demo Store",

  localization: {
    available_countries: [
      { name: "United States", iso_code: "US" }
    ],
    available_languages: [
      { name: "English", iso_code: "en" }
    ],
    country: { name: "United States", iso_code: "US" },
    language: { name: "English", iso_code: "en" }
  },

  request_design_mode: false
};

// Add all products to 'all' collection
mockData.collections.all.products = mockData.products;

// Helper function to get product by handle
mockData.getProductByHandle = function(handle) {
  return this.products.find(p => p.handle === handle);
};

// Add selected_or_first_available_variant to each product
mockData.products.forEach(product => {
  product.selected_or_first_available_variant = product.variants[0];
});

module.exports = mockData;
