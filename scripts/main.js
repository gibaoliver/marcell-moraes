document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    });

    // 1.5 Mobile Menu Toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
            mobileToggle.setAttribute('aria-expanded', !isExpanded);
            navLinks.classList.toggle('active');
            
            // Toggle icon
            const icon = mobileToggle.querySelector('i');
            if (!isExpanded) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.setAttribute('aria-expanded', 'false');
                navLinks.classList.remove('active');
                const icon = mobileToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }

    // 2. Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 3. Counter Animation on Scroll
    const counters = document.querySelectorAll('.metric-number');

    const animateCounters = () => {
        counters.forEach(counter => {
            const target = parseFloat(counter.getAttribute('data-target'));
            if (isNaN(target)) return;

            const prefix = counter.getAttribute('data-prefix') || '';
            const suffix = counter.getAttribute('data-suffix') || '';
            const duration = 1600; // ms
            let startTime = null;

            const step = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                // Ease out cubic
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(easeOut * target);

                counter.textContent = `${prefix}${current}${suffix}`;

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    counter.textContent = `${prefix}${target}${suffix}`;
                }
            };

            counter.textContent = `${prefix}0${suffix}`;
            requestAnimationFrame(step);
        });
    };

    // Use Intersection Observer to trigger counter animation
    const metricsSection = document.querySelector('.metrics-section');
    if (metricsSection) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2 // Trigger when 20% of the section is visible
        });

        observer.observe(metricsSection);
    }
});
