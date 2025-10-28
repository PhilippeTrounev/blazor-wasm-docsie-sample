// Secure Docsie loader with JWT authentication for Blazor WASM
let secureDocsieScriptElement = null;
let secureDocsieStyleElement = null;

export function initializeSecureDocsie(deploymentId, jwtToken, fallbackUrl) {
    // Clean up any existing instances first
    cleanupSecureDocsie();

    // Add CSS
    secureDocsieStyleElement = document.createElement('link');
    secureDocsieStyleElement.rel = 'stylesheet';
    secureDocsieStyleElement.media = 'all';
    secureDocsieStyleElement.href = 'https://lib.docsie.io/current/styles/docsie.css';
    document.head.appendChild(secureDocsieStyleElement);

    // Build data-docsie configuration
    let config = `docsie_pk_key:${deploymentId}`;

    if (jwtToken && jwtToken.length > 0) {
        // Use JWT token authentication
        config += `,authorizationToken:${jwtToken}`;
    }

    if (fallbackUrl && fallbackUrl.length > 0) {
        // Add redirect parameter to fallback URL so user returns after login
        const currentUrl = window.location.href;
        const separator = fallbackUrl.includes('?') ? '&' : '?';
        const fullFallbackUrl = `${fallbackUrl}${separator}redirect=${encodeURIComponent(currentUrl)}`;

        // Set fallback URL for authentication redirect
        config += `,authorizationFallbackURL:${fullFallbackUrl}`;

        console.log('Fallback URL with redirect:', fullFallbackUrl);
    }

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
            console.log('Secure Docsie script loaded successfully');
            console.log('Configuration:', config);
            resolve();
        };
        secureDocsieScriptElement.onerror = () => {
            console.error('Failed to load secure Docsie script');
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
