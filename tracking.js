/**
 * Star Signal Meta Pixel / CAPI Tracking Integration
 * 
 * This script connects to the EarnHive tracking bridge to:
 * 1. Fire Meta Pixel events (PageView, Lead, Purchase)
 * 2. Send Conversions API (CAPI) server-side events for attribution
 * 3. Handle affiliate tracking (ref parameter)
 * 
 * Bridge endpoint: https://app.earnhive.com/api/go?ref=[affiliate_id]
 * 
 * Usage:
 * - Add <script src="tracking.js"></script> to index.html
 * - Call StarSignalTracking.trackEvent(eventName, data) from checkout/thank-you pages
 */

const StarSignalTracking = (function() {
    const BRIDGE_DOMAIN = 'https://app.earnhive.com';
    const BRIDGE_ENDPOINT = '/api/go';
    const PRODUCT_ID = 'starsignal';
    
    /**
     * Get or generate a session ID
     */
    function getSessionId() {
        let sessionId = sessionStorage.getItem('star_signal_session_id');
        if (!sessionId) {
            sessionId = 'ss_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('star_signal_session_id', sessionId);
        }
        return sessionId;
    }
    
    /**
     * Get affiliate ref from URL or default
     */
    function getAffiliateRef() {
        const params = new URLSearchParams(window.location.search);
        return params.get('ref') || 'direct';
    }
    
    /**
     * Initialize Meta Pixel if PIXEL_ID is available from bridge
     */
    function initializeMetaPixel(pixelId) {
        if (!pixelId || pixelId === 'undefined') return;
        
        // Load Meta Pixel SDK
        window.fbq = window.fbq || function() {
            (window.fbq.q = window.fbq.q || []).push(arguments);
        };
        window.fbq.l = +new Date();
        
        // Create pixel script
        const pixelScript = document.createElement('script');
        pixelScript.async = true;
        pixelScript.src = 'https://connect.facebook.net/en_US/fbevents.js';
        document.head.appendChild(pixelScript);
        
        // Initialize pixel
        window.fbq('init', pixelId);
        
        // Track PageView
        window.fbq('track', 'PageView', {
            content_name: 'Star Signal Cosmic Blueprint',
            product_id: PRODUCT_ID,
        });
        
        console.log('Meta Pixel initialized:', pixelId);
    }
    
    /**
     * Send event to bridge for pixel firing and CAPI
     */
    function sendToBridge(eventData) {
        const payload = {
            product: PRODUCT_ID,
            event: eventData.event,
            email: eventData.email || null,
            firstName: eventData.firstName || null,
            value: eventData.value || null,
            currency: 'USD',
            sessionId: getSessionId(),
            affiliate: getAffiliateRef(),
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            ...eventData
        };
        
        // Send via fetch (async, non-blocking)
        fetch(`${BRIDGE_DOMAIN}/api/track`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        }).catch(err => {
            console.warn('Bridge tracking failed (non-critical):', err);
            // Silently fail - don't interrupt user experience
        });
        
        console.log('Tracking event sent:', eventData.event, payload);
    }
    
    /**
     * Fetch affiliate pixel ID and CAPI token from bridge
     */
    async function fetchPixelCredentials() {
        try {
            const ref = getAffiliateRef();
            const response = await fetch(`${BRIDGE_DOMAIN}${BRIDGE_ENDPOINT}?ref=${ref}&action=get_credentials`);
            
            if (!response.ok) {
                console.warn('Failed to fetch pixel credentials');
                return null;
            }
            
            const data = await response.json();
            return {
                pixelId: data.pixel_id,
                capiToken: data.capi_token,
                affiliateName: data.affiliate_name,
            };
        } catch (err) {
            console.warn('Error fetching pixel credentials:', err);
            return null;
        }
    }
    
    /**
     * Public API: Track a generic event
     */
    function trackEvent(eventName, data = {}) {
        const eventData = {
            event: eventName,
            ...data,
        };
        
        // Send to bridge
        sendToBridge(eventData);
        
        // Also fire Meta Pixel if available
        if (window.fbq) {
            window.fbq('track', eventName, {
                content_name: data.contentName || eventName,
                product_id: PRODUCT_ID,
                ...data,
            });
        }
    }
    
    /**
     * Track Quiz Completion
     */
    function trackQuizComplete(answers) {
        trackEvent('Lead', {
            contentName: 'Star Signal Quiz Completed',
            email: answers.email,
            firstName: answers.firstName,
            customData: {
                lifeArea: answers.q6,
                relationshipStatus: answers.q7,
                birthMonth: answers.q3 ? answers.q3.split('/')[0] : null,
            },
        });
    }
    
    /**
     * Track Purchase/Checkout
     */
    function trackPurchase(purchaseData) {
        trackEvent('Purchase', {
            value: purchaseData.amount || 19,
            currency: 'USD',
            email: purchaseData.email,
            firstName: purchaseData.firstName,
            contentName: 'Cosmic Blueprint',
            contentType: 'product',
            customData: {
                orderId: purchaseData.orderId,
                productId: PRODUCT_ID,
            },
        });
    }
    
    /**
     * Track Page View (called automatically on init)
     */
    function trackPageView(pageName) {
        trackEvent('PageView', {
            contentName: pageName || 'Star Signal Landing',
        });
    }
    
    /**
     * Initialize on page load
     */
    function initialize() {
        // Fetch credentials and set up pixel
        fetchPixelCredentials().then(creds => {
            if (creds && creds.pixelId) {
                initializeMetaPixel(creds.pixelId);
            }
        });
        
        // Track initial page view
        trackPageView(document.title);
        
        // Expose to global scope for inline calls
        window.StarSignalTracking = {
            trackEvent,
            trackQuizComplete,
            trackPurchase,
            trackPageView,
        };
    }
    
    // Auto-initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    return {
        trackEvent,
        trackQuizComplete,
        trackPurchase,
        trackPageView,
        getSessionId,
        getAffiliateRef,
    };
})();

/**
 * Helper: Parse quiz answers from URL and track
 */
function trackQuizSubmission() {
    const params = new URLSearchParams(window.location.search);
    StarSignalTracking.trackQuizComplete({
        email: params.get('q9'),
        firstName: params.get('q9')?.split('@')[0],
        q6: params.get('q6'),
        q7: params.get('q7'),
        q3: params.get('q3'),
    });
}

/**
 * Helper: Track checkout completion
 */
function trackCheckoutComplete(email, firstName, amount = 19) {
    StarSignalTracking.trackPurchase({
        email,
        firstName,
        amount,
        orderId: 'ss_' + Date.now(),
    });
}
