(function () {
    'use strict';

    // Config - set by embed script
    const ENDPOINT = window.MIKA_ENDPOINT || '';
    const DEBUG = window.MIKA_DEBUG || false;

    // State
    let visitorId = null;
    let sessionId = null;
    let leadId = null;
    let cookieId = null;
    let sessionStart = Date.now();
    let maxScroll = 0;
    let lastActivity = Date.now();

    // ============================================
    // UTILS
    // ============================================

    function log(...args) {
        if (DEBUG) console.log('[Mika]', ...args);
    }

    function generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    }

    function setCookie(name, value, days = 365) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
    }

    function getUtmParams() {
        const params = new URLSearchParams(window.location.search);
        const utm = {
            source: params.get('utm_source'),
            medium: params.get('utm_medium'),
            campaign: params.get('utm_campaign'),
            term: params.get('utm_term'),
            content: params.get('utm_content'),
        };
        // Only return if at least one param exists
        return Object.values(utm).some(v => v) ? utm : undefined;
    }

    function getDevice() {
        const ua = navigator.userAgent;
        let type = 'desktop';
        if (/Mobile|Android|iPhone|iPad/.test(ua)) {
            type = /iPad|Tablet/.test(ua) ? 'tablet' : 'mobile';
        }

        let browser = 'unknown';
        if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Edg')) browser = 'Edge';
        else if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Safari')) browser = 'Safari';

        let os = 'unknown';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';

        return {
            type,
            browser,
            os,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
        };
    }

    function getScrollDepth() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        return docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 100;
    }

    function getPageContext() {
        // Check for landing page ID in meta tag or data attribute
        const lpMeta = document.querySelector('meta[name="mika-landing-page"]');
        const lpData = document.body.dataset.mikaLandingPage;

        const campMeta = document.querySelector('meta[name="mika-campaign"]');
        const campData = document.body.dataset.mikaCampaign;

        return {
            landingPageId: lpMeta?.content || lpData || undefined,
            campaignId: campMeta?.content || campData || undefined,
        };
    }

    // ============================================
    // API CALLS
    // ============================================

    async function track(type, data = {}) {
        if (!ENDPOINT) {
            log('No endpoint configured');
            return null;
        }

        const context = getPageContext();

        const payload = {
            type,
            cookieId,
            visitorId,
            sessionId,
            leadId,
            pageUrl: window.location.href,
            referrer: document.referrer || undefined,
            utm: getUtmParams(),
            device: getDevice(),
            landingPageId: context.landingPageId,
            campaignId: context.campaignId,
            ...data,
        };

        log('Track:', type, payload);

        try {
            const res = await fetch(`${ENDPOINT}/api/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true,
            });

            const result = await res.json();

            // Store IDs from server response
            if (result.visitorId) visitorId = result.visitorId;
            if (result.sessionId) sessionId = result.sessionId;

            return result;
        } catch (err) {
            log('Track error:', err);
            return null;
        }
    }

    async function captureLeadApi(email, data = {}) {
        if (!ENDPOINT) {
            log('No endpoint configured');
            return null;
        }

        const context = getPageContext();
        const utm = getUtmParams();

        const payload = {
            email,
            visitorId,
            cookieId,
            landingPageId: data.landingPageId || context.landingPageId,
            campaignId: data.campaignId || context.campaignId,
            utm,
            ...data,
        };

        log('Capture lead:', payload);

        try {
            const res = await fetch(`${ENDPOINT}/api/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (result.success && result.leadId) {
                leadId = result.leadId;
                setCookie('mika_lead', leadId);
                log('Lead captured:', leadId, result.isNew ? '(new)' : '(existing)');
            }

            return result;
        } catch (err) {
            log('Lead capture error:', err);
            return null;
        }
    }

    // ============================================
    // EVENT HANDLERS
    // ============================================

    function onScroll() {
        const depth = getScrollDepth();
        if (depth > maxScroll) {
            maxScroll = depth;
        }
        lastActivity = Date.now();
    }

    function onClick(e) {
        const target = e.target.closest('a, button, [data-track]');
        if (!target) return;

        const trackData = target.dataset.track;
        const elementId = target.id || target.className || target.tagName;

        track('click', {
            elementClicked: elementId,
            metadata: {
                text: target.innerText?.slice(0, 100),
                href: target.href,
                trackData,
            },
        });

        lastActivity = Date.now();
    }

    function onVisibilityChange() {
        if (document.hidden) {
            track('session_end', {
                timeOnPage: Math.round((Date.now() - sessionStart) / 1000),
                scrollDepth: maxScroll,
            });
        }
    }

    function onBeforeUnload() {
        track('page_view', {
            name: 'page_exit',
            timeOnPage: Math.round((Date.now() - sessionStart) / 1000),
            scrollDepth: maxScroll,
        });
    }

    // ============================================
    // FORM TRACKING
    // ============================================

    function extractFormData(form) {
        const data = {};
        const formData = new FormData(form);

        for (const [key, value] of formData.entries()) {
            const lowerKey = key.toLowerCase();
            // Only capture non-sensitive fields
            if (lowerKey.includes('password') || lowerKey.includes('card') || lowerKey.includes('cvv')) {
                continue;
            }
            data[key] = value;
        }

        return data;
    }

    function findEmailField(form) {
        // Try to find email input
        const emailInput = form.querySelector('input[type="email"], input[name*="email"], input[name*="Email"]');
        return emailInput?.value?.trim();
    }

    function trackForms() {
        document.querySelectorAll('form').forEach(form => {
            if (form.dataset.mikaTracked) return;
            form.dataset.mikaTracked = 'true';

            let formStarted = false;
            const formId = form.id || form.dataset.mikaForm || 'unknown';

            // Form focus (start)
            form.addEventListener('focusin', () => {
                if (!formStarted) {
                    formStarted = true;
                    track('form_start', {
                        metadata: { formId },
                    });
                }
            });

            // Form submit
            form.addEventListener('submit', async (e) => {
                const email = findEmailField(form);
                const formData = extractFormData(form);

                // Track form submission
                track('form_submit', {
                    metadata: { formId, hasEmail: !!email },
                });

                // Auto-capture lead if email found
                if (email) {
                    const capturedVia = form.dataset.mikaCapturedVia || formId;
                    const name = formData.name || formData.nome || formData.firstName || formData.first_name;
                    const phone = formData.phone || formData.telefone || formData.tel;

                    await captureLeadApi(email, {
                        name,
                        phone,
                        capturedVia,
                        customFields: formData,
                    });
                }
            });
        });
    }

    // ============================================
    // INIT
    // ============================================

    async function init() {
        log('Initializing...');

        // Get or create cookie ID
        cookieId = getCookie('mika_id');
        if (!cookieId) {
            cookieId = generateId();
            setCookie('mika_id', cookieId);
        }
        log('Cookie ID:', cookieId);

        // Check for existing lead
        const existingLead = getCookie('mika_lead');
        if (existingLead) {
            leadId = existingLead;
            log('Existing lead:', leadId);
        }

        // Start session
        const sessionResult = await track('session_start');
        log('Session started:', sessionResult);

        // Track page view
        await track('page_view', {
            metadata: {
                title: document.title,
                path: window.location.pathname,
            },
        });

        // Attach listeners
        window.addEventListener('scroll', onScroll, { passive: true });
        document.addEventListener('click', onClick);
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('beforeunload', onBeforeUnload);

        // Track forms
        trackForms();

        // Observe for dynamically added forms
        const observer = new MutationObserver(trackForms);
        observer.observe(document.body, { childList: true, subtree: true });

        log('Ready');
    }

    // ============================================
    // PUBLIC API
    // ============================================

    window.mika = {
        // Track custom event
        track,

        // Identify/capture lead
        identify: async (email, data = {}) => {
            if (!email) {
                log('identify() requires email');
                return null;
            }
            return captureLeadApi(email, data);
        },

        // Get current IDs
        getVisitorId: () => visitorId,
        getSessionId: () => sessionId,
        getLeadId: () => leadId,

        // Manual form capture (for custom forms)
        captureForm: async (formElement) => {
            const email = findEmailField(formElement);
            if (!email) {
                log('No email found in form');
                return null;
            }

            const formData = extractFormData(formElement);
            const formId = formElement.id || formElement.dataset.mikaForm || 'manual';

            return captureLeadApi(email, {
                name: formData.name || formData.nome,
                phone: formData.phone || formData.telefone,
                capturedVia: formElement.dataset.mikaCapturedVia || formId,
                customFields: formData,
            });
        },
    };

    // Auto-init on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();