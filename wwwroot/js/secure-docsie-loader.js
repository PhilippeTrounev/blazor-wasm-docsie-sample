// Secure Docsie loader with JWT authentication for Blazor WASM
let secureDocsieScriptElement = null;
let secureDocsieStyleElement = null;

export function initializeSecureDocsie(deploymentId, jwtToken, redirectUrl) {
    // Clean up any existing instances first
    cleanupSecureDocsie();

    console.log('🔐 Initializing Secure Docsie...');
    console.log('📋 Deployment ID:', deploymentId);
    console.log('🎫 JWT Token:', jwtToken ? jwtToken.substring(0, 50) + '...' : 'NONE');
    console.log('🔄 Redirect URL:', redirectUrl);

    // Add JWT token to URL if provided and not already present
    if (jwtToken && jwtToken.length > 0) {
        const currentUrl = new URL(window.location.href);

        // Only add token if not already in URL
        if (!currentUrl.searchParams.has('token')) {
            currentUrl.searchParams.set('token', jwtToken);
            // Update URL without page reload
            window.history.replaceState({}, '', currentUrl.toString());
            console.log('✅ Added JWT token to URL');
        } else {
            console.log('ℹ️  Token already in URL');
        }
    }

    // Add CSS
    secureDocsieStyleElement = document.createElement('link');
    secureDocsieStyleElement.rel = 'stylesheet';
    secureDocsieStyleElement.media = 'all';
    secureDocsieStyleElement.href = 'https://lib.docsie.io/current/styles/docsie.css';
    document.head.appendChild(secureDocsieStyleElement);

    // Build data-docsie configuration
    // Docsie will:
    // 1. Read JWT token from URL parameter (?token=...)
    // 2. Validate it with app.docsie.io using master key
    // 3. If invalid/missing, redirect to authorizationFallbackURL
    let config = `docsie_pk_key:${deploymentId}`;

    // Set fallback URL from config (or use default if not provided)
    // When Docsie can't authenticate, it will redirect here
    const fallbackUrl = redirectUrl || 'http://localhost:5145/api/auth/login';
    const currentPageUrl = window.location.href.split('?')[0]; // Base URL without query params
    const fullFallbackUrl = `${fallbackUrl}?redirect=${encodeURIComponent(currentPageUrl)}`;

    // Add fallback URL - note: the value itself should NOT be URL-encoded in the config string
    config += `,authorizationFallbackURL:${fullFallbackUrl}`;

    console.log('🔄 Fallback URL:', fullFallbackUrl);
    console.log('📝 Full Docsie Config:', config);

    // Add Docsie script
    secureDocsieScriptElement = document.createElement('script');
    secureDocsieScriptElement.async = true;
    secureDocsieScriptElement.type = 'text/javascript';
    secureDocsieScriptElement.src = 'https://lib.docsie.io/current/service.js';
    secureDocsieScriptElement.setAttribute('data-docsie', config);

    // Override container to use secure-docsie-container
    const container = document.getElementById('secure-docsie-container');
    if (container) {
        container.setAttribute('data-ddsroot', '');
    }

    // Wait for script to load and initialize
    return new Promise((resolve, reject) => {
        secureDocsieScriptElement.onload = () => {
            console.log('✅ Secure Docsie script loaded successfully');
            console.log('⚙️  Configuration:', config);
            resolve();
        };
        secureDocsieScriptElement.onerror = () => {
            console.error('❌ Failed to load secure Docsie script');
            reject(new Error('Failed to load secure Docsie script'));
        };
        document.body.appendChild(secureDocsieScriptElement);
    });
}

export function cleanupSecureDocsie() {
    // Remove Docsie script
    if (secureDocsieScriptElement && secureDocsieScriptElement.parentNode) {
        secureDocsieScriptElement.parentNode.removeChild(secureDocsieScriptElement);
        secureDocsieScriptElement = null;
    }

    // Remove Docsie styles
    if (secureDocsieStyleElement && secureDocsieStyleElement.parentNode) {
        secureDocsieStyleElement.parentNode.removeChild(secureDocsieStyleElement);
        secureDocsieStyleElement = null;
    }

    // Clear the container
    const container = document.getElementById('secure-docsie-container');
    if (container) {
        container.innerHTML = '';
    }

    // Clean up global Docsie object if it exists
    if (window.Docsie) {
        try {
            if (window.Docsie.cleanup && typeof window.Docsie.cleanup === 'function') {
                window.Docsie.cleanup();
            }
        } catch (e) {
            console.warn('Error during secure Docsie cleanup:', e);
        }
    }
}
