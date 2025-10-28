// Docsie loader module for Blazor WASM
let docsieScriptElement = null;
let docsieStyleElement = null;

export function initializeDocsie(deploymentId, jwtToken) {
    // Clean up any existing instances first
    cleanupDocsie();

    // Add CSS
    docsieStyleElement = document.createElement('link');
    docsieStyleElement.rel = 'stylesheet';
    docsieStyleElement.media = 'all';
    docsieStyleElement.href = 'https://lib.docsie.io/current/styles/docsie.css';
    document.head.appendChild(docsieStyleElement);

    // Build data-docsie configuration
    let config = `docsie_pk_key:${deploymentId}`;
    if (jwtToken) {
        config += `,authorizationToken:${jwtToken}`;
    }

    // Add Docsie script
    docsieScriptElement = document.createElement('script');
    docsieScriptElement.async = true;
    docsieScriptElement.type = 'text/javascript';
    docsieScriptElement.src = 'https://lib.docsie.io/current/service.js';
    docsieScriptElement.setAttribute('data-docsie', config);

    // Wait for script to load and initialize
    return new Promise((resolve, reject) => {
        docsieScriptElement.onload = () => {
            console.log('Docsie script loaded successfully');
            resolve();
        };
        docsieScriptElement.onerror = () => {
            console.error('Failed to load Docsie script');
            reject(new Error('Failed to load Docsie script'));
        };
        document.body.appendChild(docsieScriptElement);
    });
}

export function cleanupDocsie() {
    // Remove Docsie script
    if (docsieScriptElement && docsieScriptElement.parentNode) {
        docsieScriptElement.parentNode.removeChild(docsieScriptElement);
        docsieScriptElement = null;
    }

    // Remove Docsie styles
    if (docsieStyleElement && docsieStyleElement.parentNode) {
        docsieStyleElement.parentNode.removeChild(docsieStyleElement);
        docsieStyleElement = null;
    }

    // Clear the container
    const container = document.getElementById('docsie-container');
    if (container) {
        container.innerHTML = '';
    }

    // Clean up global Docsie object if it exists
    if (window.Docsie) {
        try {
            // Attempt to cleanup Docsie instance
            if (window.Docsie.cleanup && typeof window.Docsie.cleanup === 'function') {
                window.Docsie.cleanup();
            }
        } catch (e) {
            console.warn('Error during Docsie cleanup:', e);
        }
    }
}
