/**
 * Astro-Synthesis Main JavaScript
 * AI 통합 역학 플랫폼 - 메인 스크립트
 */

// ===== DOM Ready =====
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initTabs();
    initFormValidation();
    initChartInteractions();
});

// ===== Scroll Fade Animation =====
function initScrollAnimations() {
    const scrollElements = document.querySelectorAll('.scroll-fade');

    if (scrollElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    scrollElements.forEach(el => observer.observe(el));
}

// ===== Tab Navigation =====
function initTabs() {
    const tabNavs = document.querySelectorAll('.tab-nav');

    tabNavs.forEach(nav => {
        const tabs = nav.querySelectorAll('.tab-item');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                // Add active to clicked tab
                tab.classList.add('active');

                // Handle content switching if data-target exists
                const targetId = tab.dataset.target;
                if (targetId) {
                    const contents = nav.parentElement.querySelectorAll('.tab-content');
                    contents.forEach(content => {
                        content.style.display = content.id === targetId ? 'block' : 'none';
                    });
                }
            });
        });
    });
}

// ===== Form Validation =====
function initFormValidation() {
    const forms = document.querySelectorAll('form[data-validate]');

    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const isValid = validateForm(form);
            if (isValid) {
                handleFormSubmit(form);
            }
        });
    });
}

function validateForm(form) {
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            showFieldError(field, '필수 입력 항목입니다.');
        } else {
            clearFieldError(field);
        }
    });

    return isValid;
}

function showFieldError(field, message) {
    field.classList.add('error');
    let errorEl = field.parentElement.querySelector('.error-message');
    if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'error-message';
        errorEl.style.cssText = 'color: var(--status-bad); font-size: 12px; margin-top: 4px;';
        field.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = message;
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorEl = field.parentElement.querySelector('.error-message');
    if (errorEl) errorEl.remove();
}

// ===== Form Submit Handler =====
function handleFormSubmit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Dispatch custom event for handling in specific modules
    const event = new CustomEvent('astro-form-submit', {
        detail: { form, data }
    });
    document.dispatchEvent(event);
}

// ===== Chart Interactions =====
function initChartInteractions() {
    // Hover effects for chart elements
    const chartElements = document.querySelectorAll('.chart-interactive');

    chartElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            const tooltip = el.dataset.tooltip;
            if (tooltip) {
                showTooltip(el, tooltip);
            }
        });

        el.addEventListener('mouseleave', () => {
            hideTooltip();
        });
    });
}

// ===== Tooltip System =====
let tooltipEl = null;

function showTooltip(target, content) {
    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.className = 'tooltip';
        tooltipEl.style.cssText = `
            position: fixed;
            background: var(--apple-dark-gray);
            color: var(--apple-white);
            padding: 8px 12px;
            border-radius: var(--border-radius-sm);
            font-size: 14px;
            z-index: 9999;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        document.body.appendChild(tooltipEl);
    }

    tooltipEl.textContent = content;

    const rect = target.getBoundingClientRect();
    tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
    tooltipEl.style.top = `${rect.top - 10}px`;
    tooltipEl.style.transform = 'translate(-50%, -100%)';
    tooltipEl.style.opacity = '1';
}

function hideTooltip() {
    if (tooltipEl) {
        tooltipEl.style.opacity = '0';
    }
}

// ===== Loading State =====
function showLoading(container) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-spinner"></div>';
    container.style.position = 'relative';
    container.appendChild(overlay);
    return overlay;
}

function hideLoading(overlay) {
    if (overlay && overlay.parentElement) {
        overlay.remove();
    }
}

// ===== Utility Functions =====

// Format date for display
function formatDate(date) {
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

// Format time for display
function formatTime(date) {
    return new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Animate number counting
function animateNumber(element, target, duration = 1000) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.floor(progress * target);

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = target;
        }
    }

    requestAnimationFrame(update);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== Export for modules =====
window.AstroSynthesis = {
    showLoading,
    hideLoading,
    showTooltip,
    hideTooltip,
    formatDate,
    formatTime,
    animateNumber,
    debounce
};
