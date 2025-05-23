// Lotion Service Worker - Offline Reading Support
const CACHE_NAME = 'lotion-offline-v1';
const API_CACHE_NAME = 'lotion-api-v1';

// Cache static assets and pages
const STATIC_ASSETS = [
  '/',
  '/app',
  '/login'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🧴 Lotion Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Caching static assets');
      // Don't try to cache these now, they might not exist
      return Promise.resolve();
    })
  );
  
  // Take control immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Lotion Service Worker activated');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - intercept and cache requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  console.log('🔍 Service Worker intercepted request:', {
    url: event.request.url,
    hostname: url.hostname,
    pathname: url.pathname,
    method: event.request.method
  });
  
  // Handle Notion API requests (cache for offline reading)
  // Check for notion.so domain (could be www.notion.so or just notion.so)
  if (url.hostname.includes('notion.so') && url.pathname.startsWith('/api/')) {
    console.log('📡 Handling API request:', event.request.url);
    event.respondWith(handleApiRequest(event.request));
  }
  // Handle static assets from notion.so
  else if (url.hostname.includes('notion.so')) {
    console.log('🗃️ Handling static request:', event.request.url);
    event.respondWith(handleStaticRequest(event.request));
  }
  // Handle requests to notion-static.com (CDN)
  else if (url.hostname.includes('notion-static.com')) {
    console.log('🖼️ Handling CDN request:', event.request.url);
    event.respondWith(handleStaticRequest(event.request));
  }
  // Let other requests pass through
  else {
    console.log('➡️ Passing through request:', event.request.url);
    return;
  }
});

// Handle API requests with cache-first strategy for reading
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  // For GET requests (reading data), try cache first
  if (request.method === 'GET') {
    try {
      // Try to get from cache first
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log('📖 Serving API from cache:', request.url);
        
        // Try to update cache in background if online
        if (navigator.onLine) {
          fetch(request).then(response => {
            if (response.ok) {
              console.log('🔄 Updating cached API response:', request.url);
              cache.put(request, response.clone());
            }
          }).catch(() => {
            // Ignore network errors
          });
        }
        
        return cachedResponse;
      }
      
      // Not in cache, try network
      const response = await fetch(request);
      if (response.ok) {
        console.log('🌐 Caching new API response:', request.url);
        cache.put(request, response.clone());
      }
      return response;
      
    } catch (error) {
      console.log('🔌 Network error for API request, trying cache:', request.url);
      // Network error, try cache
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log('✅ Serving API from cache (offline):', request.url);
        return cachedResponse;
      }
      
      // No cache, return offline page
      console.log('❌ No cache available for API request:', request.url);
      return new Response(
        JSON.stringify({
          error: 'offline',
          message: 'This content is not available offline'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  // For POST/PUT requests (writing data), always try network first
  else {
    console.log('✏️ Write request, trying network first:', request.url);
    try {
      return await fetch(request);
    } catch (error) {
      console.log('❌ Write request failed (offline):', request.url);
      return new Response(
        JSON.stringify({
          error: 'offline',
          message: 'Cannot save changes while offline'
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('📄 Serving static from cache:', request.url);
      return cachedResponse;
    }
    
    // Try network
    const response = await fetch(request);
    if (response.ok) {
      // Cache successful responses (but only cache certain file types)
      const url = new URL(request.url);
      const shouldCache = 
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.woff') ||
        url.pathname.endsWith('.woff2') ||
        request.destination === 'document';
      
      if (shouldCache) {
        console.log('💾 Caching static asset:', request.url);
        cache.put(request, response.clone());
      }
    }
    return response;
    
  } catch (error) {
    console.log('🔌 Network error for static request, trying cache:', request.url);
    // Network error, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('✅ Serving static from cache (offline):', request.url);
      return cachedResponse;
    }
    
    console.log('❌ No cache available for static request:', request.url);
    // No cache available
    throw error;
  }
}

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then(size => {
      event.ports[0].postMessage({ cacheSize: size });
    });
  }
});

// Get cache size for debugging
async function getCacheSize() {
  const apiCache = await caches.open(API_CACHE_NAME);
  const staticCache = await caches.open(CACHE_NAME);
  
  const apiKeys = await apiCache.keys();
  const staticKeys = await staticCache.keys();
  
  console.log('📊 Cache status:', {
    apiCacheCount: apiKeys.length,
    staticCacheCount: staticKeys.length,
    totalCount: apiKeys.length + staticKeys.length
  });
  
  return {
    apiCacheCount: apiKeys.length,
    staticCacheCount: staticKeys.length,
    totalCount: apiKeys.length + staticKeys.length
  };
} 