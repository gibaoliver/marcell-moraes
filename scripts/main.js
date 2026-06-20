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
    const speed = 200; // The lower the slower

    const animateCounters = () => {
        counters.forEach(counter => {
            const updateCount = () => {
                const target = +counter.getAttribute('data-target');
                const count = +counter.innerText.replace(/[^0-9]/g, ''); // Extract only numbers

                // Lower inc to slow and higher to fast
                const inc = target / speed;

                // Check if target is reached
                if (count < target) {
                    // Add inc to count and output in counter
                    let currentCount = Math.ceil(count + inc);
                    
                    // Formatting the output back with '+' and 'Mil' if necessary
                    if(target >= 1000) {
                         counter.innerText = `+${Math.floor(currentCount / 1000)} Mil`;
                    } else {
                         counter.innerText = `${currentCount}+`;
                    }
                    
                    // Call function every ms
                    setTimeout(updateCount, 15);
                } else {
                    if(target >= 1000) {
                        counter.innerText = `+${Math.floor(target / 1000)} Mil`;
                    } else {
                        counter.innerText = `${target}+`;
                    }
                }
            };
            updateCount();
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
            threshold: 0.5 // Trigger when 50% of the section is visible
        });

        observer.observe(metricsSection);
    }
});
