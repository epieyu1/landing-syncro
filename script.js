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
    // CONTACT FORM HANDLER (TRIAL REGISTRATION)
    // ==========================================
    const demoForm = document.getElementById('demo-form');
    // TODO: Reemplazar con URL real de tu función o configurar rewrite
    const FUNCTION_URL = "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/createTrialAccount";
    const RECAPTCHA_SITE_KEY = "SITE_KEY_HERE"; // TODO: Reemplazar

    if (demoForm) {
        demoForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = demoForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            // Get form data
            const formData = {
                companyName: demoForm.workshop.value, // Mapped to companyName
                name: demoForm.name.value,            // Contact Name (keep for reference or future use)
                phone: demoForm.phone.value,
                email: demoForm.email.value,
                city: demoForm.city.value || 'No especificada'
            };

            // Show loading state
            submitBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Creando cuenta...';
            submitBtn.disabled = true;
            lucide.createIcons();

            try {
                // 1. Execute reCAPTCHA
                const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' });

                // 2. Prepare Payload
                const payload = {
                    ...formData,
                    recaptchaToken: token
                };

                // 3. Call Cloud Function
                const response = await fetch(FUNCTION_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: payload }) // Callable format expects { data: ... }
                });

                const result = await response.json();

                if (!response.ok || (result.error)) {
                    throw new Error(result.error ? result.error.message : 'Error en el servidor');
                }

                // Success
                submitBtn.innerHTML = '<i data-lucide="check"></i> ¡Cuenta Creada!';
                submitBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                lucide.createIcons();

                // Show Success Modal or Message
                // For MVP: Simple Alert + Redirect or UI change
                const formContainer = demoForm.parentElement;
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

            } catch (error) {
                console.error('Error submitting form:', error);

                // Show error
                const errorMsg = error.message.includes('already-exists')
                    ? 'Este número ya está registrado.'
                    : 'Error al crear cuenta. Intenta de nuevo.';

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
