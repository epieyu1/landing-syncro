/* ==========================================
   SYNCRO MOTOS - Landing Page Scripts
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Initialize Lucide icons
    lucide.createIcons();

    // Keep public installer buttons aligned with the distribution release.
    // Fallback hrefs in index.html stay valid if GitHub API is unavailable.
    const syncroReleaseApiUrl = 'https://api.github.com/repos/epieyu1/Syncro-Distribucion/releases/latest';

    const findReleaseAsset = (assets, pattern) => (
        assets.find(asset => pattern.test(asset.name) && !asset.name.endsWith('.blockmap'))
    );

    const updateDownloadCard = ({ platform, asset, release, label }) => {
        const card = document.querySelector(`[data-download-platform="${platform}"]`);
        if (!card) return;

        if (!asset) {
            if (platform === 'mac-intel') card.hidden = true;
            return;
        }

        card.href = asset.browser_download_url;
        card.hidden = false;

        const versionLabel = card.querySelector('[data-download-version]');
        if (versionLabel) {
            const version = release.tag_name || `v${release.name || ''}`.trim();
            versionLabel.textContent = `${version} - ${label}`;
        }
    };

    const syncDownloadLinks = async () => {
        try {
            const response = await fetch(syncroReleaseApiUrl, {
                headers: { Accept: 'application/vnd.github+json' }
            });
            if (!response.ok) return;

            const release = await response.json();
            const assets = Array.isArray(release.assets) ? release.assets : [];

            updateDownloadCard({
                platform: 'windows',
                release,
                label: 'Instalador NSIS',
                asset: findReleaseAsset(assets, /^Syncro\.Motos\.Setup\.\d+\.\d+\.\d+\.exe$/)
            });

            updateDownloadCard({
                platform: 'mac-arm64',
                release,
                label: 'ARM64 .dmg',
                asset: findReleaseAsset(assets, /^Syncro\.Motos-\d+\.\d+\.\d+-arm64\.dmg$/)
            });

            updateDownloadCard({
                platform: 'mac-intel',
                release,
                label: 'x64 .dmg',
                asset: findReleaseAsset(assets, /^Syncro\.Motos-\d+\.\d+\.\d+-x64\.dmg$/)
            });
        } catch (_) {
            // Static fallback links remain available.
        }
    };

    syncDownloadLinks();

    // ==========================================
    // HEADER SCROLL BEHAVIOR
    // ==========================================
    const header = document.getElementById('header');

    window.addEventListener('scroll', function () {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // ==========================================
    // MOBILE MENU TOGGLE
    // ==========================================
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');

    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function () {
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function () {
                navMenu.classList.remove('active');
            });
        });
    }

    // ==========================================
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // ==========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // If this is the mobile trial CTA, let its handler decide (it opens a modal on mobile)
            if (this.classList && this.classList.contains('trial-cta')) return;
            e.preventDefault();
            const targetId = this.getAttribute('href');

            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerHeight = header.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==========================================
    // SCROLL ANIMATIONS (Intersection Observer)
    // ==========================================
    const animateElements = document.querySelectorAll('.animate-on-scroll');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver(function (entries, observer) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add staggered delay
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);

                // Stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animateElements.forEach(element => {
        observer.observe(element);
    });

    // ==========================================
    // FAQ ACCORDION
    // ==========================================
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', function () {
            // Close other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // ==========================================
    // CONTACT FORM HANDLER (TRIAL REGISTRATION) - unified for desktop and mobile modal
    // ==========================================
    const demoForm = document.getElementById('demo-form');
    const demoFormMobile = document.getElementById('demo-form-mobile');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const trialCta = document.getElementById('trial-cta');

    // Supabase Configuration
    const SUPABASE_URL = "https://vmlxfbqezgjivesxahfe.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_XSLOhed3DZXxWo87HjQu3w_uvmpiDUO";
    
    // Initialize Supabase Client
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Shared submission logic for both forms
    async function submitTrial(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : '';

        // Build formData using form elements (names kept consistent)
        const elems = form.elements;
        const formData = {
            nombre: elems['name'] ? elems['name'].value : '',
            cliente: elems['phone'] ? elems['phone'].value : '',
            correo: elems['email'] ? elems['email'].value : ''
        };

        if (submitBtn) {
            submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Enviando solicitud...';
            submitBtn.disabled = true;
            lucide.createIcons();
        }

        try {
            // Insert data into Supabase table 'TABLA DE USUARIOS DEMO'
            const { error } = await supabaseClient
                .from('TABLA DE USUARIOS DEMO')
                .insert([formData]);

            if (error) throw error;

            // Success handling: unified premium look
            const successHTML = `
                <div class="success-message-container">
                    <div class="success-icon-wrapper">
                        <i data-lucide="check-circle"></i>
                    </div>
                    <h3 class="success-title">¡Solicitud enviada!</h3>
                    <p class="success-text">
                        Gracias por tu interés en <strong>Syncro Motos</strong>. 
                        <br>Un asesor se pondrá en contacto contigo a través de WhatsApp o correo electrónico para coordinar tu prueba gratuita de 15 días.
                    </p>
                    <div class="success-actions">
                        <a href="#pricing" class="btn btn-primary success-cta" role="button">Ver Planes</a>
                    </div>
                </div>
            `;

            if (form.id === 'demo-form') {
                form.parentElement.innerHTML = successHTML;
            } else {
                // mobile
                form.parentElement.innerHTML = successHTML;
            }
            lucide.createIcons();

        } catch (error) {
            console.error('Error submitting form:', error);

            let errorMsg = 'Error al enviar la solicitud. Intenta de nuevo.';
            if (error.message && error.message.includes('unique')) {
                errorMsg = 'Este WhatsApp o correo ya está registrado.';
            }

            if (submitBtn) {
                submitBtn.innerHTML = `<i data-lucide="alert-circle"></i> ${errorMsg}`;
                submitBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
                lucide.createIcons();

                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    submitBtn.disabled = false;
                    lucide.createIcons();
                }, 4000);
            }
        }
    }

    // Attach submit listeners
    if (demoForm) {
        demoForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitTrial(demoForm);
        });
    }

    if (demoFormMobile) {
        demoFormMobile.addEventListener('submit', function (e) {
            e.preventDefault();
            submitTrial(demoFormMobile);
        });
    }

    // Modal open/close behavior for mobile CTA
    if (trialCta && modalOverlay) {
        trialCta.addEventListener('click', function (e) {
            // Only intercept on small screens; on desktop keep default anchor behavior
            if (window.innerWidth <= 768) {
                e.preventDefault();
                modalOverlay.classList.add('open');
                modalOverlay.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                // focus first input in mobile form
                const first = demoFormMobile && demoFormMobile.querySelector('input[name="name"]');
                if (first) first.focus();
                // Removed redundant lucide.createIcons() to fix lag
            }
        });
    }

    if (modalClose && modalOverlay) {
        modalClose.addEventListener('click', function () {
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
            modalOverlay.classList.remove('open');
            modalOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        });

        modalOverlay.addEventListener('click', function (e) {
            if (e.target === modalOverlay) {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                modalOverlay.classList.remove('open');
                modalOverlay.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        });

        // Close on Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
                if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                modalOverlay.classList.remove('open');
                modalOverlay.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        });
    }

    // Close modal with animation when clicking the success CTA, then navigate to the anchor
    document.addEventListener('click', function (e) {
        const successBtn = e.target.closest && e.target.closest('.success-cta');
        if (!successBtn) return;

        const href = successBtn.getAttribute('href');
        // If it's an internal anchor like #pricing, and the modal is open, animate close first
        if (href && href.startsWith('#') && modalOverlay && modalOverlay.classList.contains('open')) {
            e.preventDefault();

            // Close modal (this will trigger CSS transition)
            if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
            modalOverlay.classList.remove('open');
            modalOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';

            // After transition ends (or fallback timeout) perform the scroll
            let handled = false;
            const onTransitionEnd = (ev) => {
                if (ev.target !== modalOverlay) return;
                if (handled) return;
                handled = true;
                modalOverlay.removeEventListener('transitionend', onTransitionEnd);
                navigateToAnchor(href);
            };

            modalOverlay.addEventListener('transitionend', onTransitionEnd);

            // Fallback in case transitionend doesn't fire
            setTimeout(() => {
                if (handled) return;
                handled = true;
                modalOverlay.removeEventListener('transitionend', onTransitionEnd);
                navigateToAnchor(href);
            }, 350);
        }
        // otherwise let the anchor behave normally
    });

    // Helper: programmatic smooth scroll to an in-page anchor accounting for header height
    function navigateToAnchor(hash) {
        const targetElement = document.querySelector(hash);
        if (!targetElement) {
            // fallback: set location hash
            location.hash = hash;
            return;
        }
        const headerHeight = header ? header.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }

    // ==========================================
    // COUNTER ANIMATION FOR STATS
    // ==========================================
    function animateCounter(element, target, suffix = '') {
        const duration = 2000;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                clearInterval(timer);
                current = target;
            }
            element.textContent = Math.floor(current).toLocaleString() + suffix;
        }, 16);
    }

    // Animate stats when visible
    const statsSection = document.querySelector('.hero-stats');

    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const stats = entry.target.querySelectorAll('.stat-number');

                    stats.forEach(stat => {
                        const text = stat.textContent.trim();
                        // Only animate if it's not an icon container
                        if (stat.querySelector('i')) return;

                        if (text.includes('%')) {
                            animateCounter(stat, 99, '%');
                        } else if (text.includes('K')) {
                            animateCounter(stat, 50, 'K+');
                        } else if (text !== '') {
                            animateCounter(stat, 500, '+');
                        }
                    });

                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statsObserver.observe(statsSection);
    }

    // ==========================================
    // ADD CSS FOR SUCCESS MESSAGE AND SPINNER
    // ==========================================
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-spin {
            animation: spin 1s linear infinite;
        }

        /* Success Message Styles */
        .success-message-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 3rem 2rem;
            background: rgba(15, 23, 42, 0.9); /* Dark slate background */
            backdrop-filter: blur(12px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #f8fafc;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: fadeInScale 0.4s ease-out;
            max-width: 500px;
            margin: 0 auto;
        }

        @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }

        .success-icon-wrapper {
            background: rgba(16, 185, 129, 0.2);
            padding: 1rem;
            border-radius: 50%;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .success-icon-wrapper i {
            width: 48px;
            height: 48px;
            color: #10b981;
        }

        .success-title {
            font-size: 1.75rem;
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .success-text {
            color: #94a3b8;
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 2rem;
        }

        .success-text strong {
            color: #fff;
        }

        .success-actions {
            width: 100%;
            display: flex;
            justify-content: center;
        }

        /* Adjust modal for success state */
        .modal.success-state {
            background: transparent;
            box-shadow: none;
            padding: 0;
            border: none;
        }
    `;
    document.head.appendChild(style);
});
