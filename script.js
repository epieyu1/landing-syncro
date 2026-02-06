/* ==========================================
   SYNCRO MOTOS - Landing Page Scripts
   ========================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Initialize Lucide icons
    lucide.createIcons();

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
    // TODO: Reemplazar con URL real de tu función o configurar rewrite
    const FUNCTION_URL = "https://us-central1-alua-2ecc9.cloudfunctions.net/createTrialAccount";
    const RECAPTCHA_SITE_KEY = "6Lf42l8sAAAAAHuYaukYy1Bn27uDMuIzAf3JKBQu";

    // Shared submission logic for both forms
    async function submitTrial(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : '';

        // Build formData using form elements (names kept consistent)
        const elems = form.elements;
        const formData = {
            companyName: elems['workshop'] ? elems['workshop'].value : 'No especificado',
            name: elems['name'] ? elems['name'].value : '',
            phone: elems['phone'] ? elems['phone'].value : '',
            email: elems['email'] ? elems['email'].value : '',
            city: elems['city'] ? elems['city'].value : 'No especificada'
        };

        if (submitBtn) {
            submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Creando cuenta...';
            submitBtn.disabled = true;
            lucide.createIcons();
        }

        try {
            // reCAPTCHA execution (same logic as before)
            const token = await new Promise((resolve, reject) => {
                let attempts = 0;
                const checkRecaptcha = () => {
                    if (typeof grecaptcha !== 'undefined' && grecaptcha.enterprise) {
                        grecaptcha.enterprise.ready(async () => {
                            try {
                                const res = await grecaptcha.enterprise.execute(RECAPTCHA_SITE_KEY, { action: 'submit' });
                                resolve(res);
                            } catch (err) {
                                reject(new Error(`reCAPTCHA execution failed: ${err.message}`));
                            }
                        });
                    } else if (attempts < 50) {
                        attempts++;
                        setTimeout(checkRecaptcha, 100);
                    } else {
                        reject(new Error('reCAPTCHA Enterprise library no pudo cargarse. Verifique AdBlockers o la conexión.'));
                    }
                };
                checkRecaptcha();
            });

            const payload = { ...formData, recaptchaToken: token };

            const response = await fetch(FUNCTION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            });

            const result = await response.json();

            if (!response.ok || (result && result.error)) {
                throw new Error(result && result.error ? result.error.message : 'Error en el servidor');
            }

            // Success handling: for desktop form, replace form area; for mobile form, replace modal content
            if (form.id === 'demo-form') {
                const formContainer = form.parentElement;
                formContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <i data-lucide="check-circle" style="width: 64px; height: 64px; color: #10b981; margin-bottom: 1rem;"></i>
                        <h3 style="color: #111827; font-size: 1.5rem; margin-bottom: 0.5rem;">¡Bienvenido a Syncro Motos!</h3>
                        <p style="color: #6b7280; margin-bottom: 1.5rem;">
                            Hemos enviado tus credenciales de acceso a <strong>${formData.email}</strong>.
                            <br>Revisa tu bandeja de entrada (y spam por si acaso).
                        </p>
                        <a href="#download" class="btn btn-primary">Descargar App</a>
                    </div>
                `;
                lucide.createIcons();
            } else {
                // mobile
                const modalContent = form.parentElement;
                modalContent.innerHTML = `
                    <div style="text-align: center; padding: 1.5rem;">
                        <i data-lucide="check-circle" style="width: 56px; height: 56px; color: #10b981; margin-bottom: 0.75rem;"></i>
                        <h3 style="color: #111827; font-size: 1.25rem; margin-bottom: 0.5rem;">¡Registro exitoso!</h3>
                        <p style="color: #6b7280; margin-bottom: 1rem;">Te enviamos la información a <strong>${formData.email}</strong>.</p>
                        <a href="#download" class="btn btn-primary">Descargar App</a>
                    </div>
                `;
                lucide.createIcons();
            }

        } catch (error) {
            console.error('Error submitting form:', error);

            const errorMsg = error.message && error.message.includes('already-exists')
                ? 'Este número ya está registrado.'
                : 'Error al crear cuenta. Intenta de nuevo.';

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
                lucide.createIcons();
            }
        });
    }

    if (modalClose && modalOverlay) {
        modalClose.addEventListener('click', function () {
            modalOverlay.classList.remove('open');
            modalOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        });

        modalOverlay.addEventListener('click', function (e) {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('open');
                modalOverlay.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        });

        // Close on Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
                modalOverlay.classList.remove('open');
                modalOverlay.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        });
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
                        const text = stat.textContent;
                        if (text.includes('K')) {
                            animateCounter(stat, 50, 'K+');
                        } else if (text.includes('%')) {
                            animateCounter(stat, 99.9, '%');
                        } else {
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
    // ADD CSS FOR SPIN ANIMATION
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
    `;
    document.head.appendChild(style);
});
