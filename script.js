document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // 1. THEME TOGGLE (DARK / LIGHT MODE)
  // ==========================================================================
  const themeToggleBtn = document.getElementById('theme-toggle');
  const body = document.body;

  // Check stored theme or default to dark mode
  const currentTheme = localStorage.getItem('theme') || 'dark';

  if (currentTheme === 'light') {
    body.classList.remove('dark-mode');
  } else {
    body.classList.add('dark-mode');
  }

  themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark-mode');

    // Save to localStorage
    if (body.classList.contains('dark-mode')) {
      localStorage.setItem('theme', 'dark');
      showToast('Mode Gelap diaktifkan', 'success');
    } else {
      localStorage.setItem('theme', 'light');
      showToast('Mode Terang diaktifkan', 'success');
    }
  });


  // ==========================================================================
  // 2. MOBILE MENU DRAWER
  // ==========================================================================
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  function toggleMobileMenu() {
    const isOpen = mobileNavDrawer.classList.contains('open');
    if (isOpen) {
      mobileNavDrawer.classList.remove('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      body.style.overflow = ''; // restore scrolling
    } else {
      mobileNavDrawer.classList.add('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'true');
      body.style.overflow = 'hidden'; // lock scrolling
    }
  }

  mobileMenuBtn.addEventListener('click', toggleMobileMenu);

  // Close drawer when link is clicked
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileNavDrawer.classList.remove('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      body.style.overflow = '';
    });
  });

  // Close drawer on resize to desktop view
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && mobileNavDrawer.classList.contains('open')) {
      mobileNavDrawer.classList.remove('open');
      mobileMenuBtn.setAttribute('aria-expanded', 'false');
      body.style.overflow = '';
    }
  });


  // ==========================================================================
  // 3. SCROLL REVEAL ANIMATIONS (INTERSECTION OBSERVER)
  // ==========================================================================
  const revealElements = document.querySelectorAll('.scroll-reveal');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        // Unobserve once revealed to keep layout performant
        observer.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));


  // ==========================================================================
  // 4. ACTIVE NAV LINK HIGHLIGHTING (SCROLLSPY WITH CLICK OVERRIDE)
  // ==========================================================================
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const allNavLinks = document.querySelectorAll('.nav-link, .mobile-link');
  const getHeaderHeight = () => window.innerWidth <= 480 ? 50 : 80;
  let isScrollingFromClick = false;
  let clickTimeout;

  // Active class helper
  function highlightLink(id) {
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${id}`) {
        link.classList.add('active');
      }
    });
  }

  function clearHighlights() {
    navLinks.forEach(link => link.classList.remove('active'));
  }

  // Calculate and update active section
  function updateActiveNav() {
    if (isScrollingFromClick) return;

    const scrollPosition = window.scrollY + getHeaderHeight() + 120; // Trigger slightly before hitting the header
    const scrollBottom = window.innerHeight + window.scrollY;
    const pageBottom = document.documentElement.scrollHeight;

    // 1. Safeguard: if scrolled to the very bottom, force highlight "contact"
    if (scrollBottom >= pageBottom - 50) {
      highlightLink('contact');
      return;
    }

    // 2. Safeguard: if at the very top (Hero section), clear all highlights
    if (window.scrollY < 150) {
      clearHighlights();
      return;
    }

    // 3. Regular Scrollspy calculation
    let currentActiveSectionId = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        currentActiveSectionId = sectionId;
      }
    });

    if (currentActiveSectionId && currentActiveSectionId !== 'hero') {
      highlightLink(currentActiveSectionId);
    } else if (currentActiveSectionId === 'hero') {
      clearHighlights();
    }
  }

  // Handle manual click highlights & smooth scrolling offsets
  allNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');

      if (targetId && targetId.startsWith('#')) {
        e.preventDefault();
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
          // Lock scrollspy updates
          isScrollingFromClick = true;
          clearTimeout(clickTimeout);

          const cleanId = targetId.substring(1);

          // Apply highlight immediately
          if (cleanId === 'hero') {
            clearHighlights();
          } else {
            highlightLink(cleanId);
          }

          // Close mobile menu drawer if open
          if (mobileNavDrawer && mobileNavDrawer.classList.contains('open')) {
            mobileNavDrawer.classList.remove('open');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            body.style.overflow = '';
          }

          // Programmatic smooth scroll to target offset (excluding header height)
          const targetOffset = targetSection.offsetTop - getHeaderHeight();
          window.scrollTo({
            top: targetOffset,
            behavior: 'smooth'
          });

          // Release scrollspy lock after scroll finishes (1000ms)
          clickTimeout = setTimeout(() => {
            isScrollingFromClick = false;
            updateActiveNav(); // Sync check
          }, 1000);
        }
      }
    });
  });

  // Attach throttle-optimized scroll listener
  let scrollThrottle;
  window.addEventListener('scroll', () => {
    if (!scrollThrottle) {
      window.requestAnimationFrame(() => {
        updateActiveNav();
        scrollThrottle = false;
      });
      scrollThrottle = true;
    }
  });

  // Run on load to set initial state
  updateActiveNav();


  // ==========================================================================
  // 5. TIMELINE TABS (WORK VS ORGANIZATION)
  // ==========================================================================
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active from all buttons and panels
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      // Add active to current
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      const activePanel = document.getElementById(targetId);
      activePanel.classList.add('active');

      // Trigger scroll reveals or bar animations inside the new active tab
      const panelReveals = activePanel.querySelectorAll('.scroll-reveal');
      panelReveals.forEach(el => el.classList.add('revealed'));
    });
  });


  // ==========================================================================
  // 6. COPY TO CLIPBOARD
  // ==========================================================================
  const copyEmailBtn = document.getElementById('btn-copy-email');
  const copyTooltip = document.getElementById('copy-tooltip');

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent triggering click event on parent elements if any
      const email = 'yashakbarraihan@gmail.com';

      navigator.clipboard.writeText(email).then(() => {
        // Success feedback in tooltip
        copyTooltip.textContent = 'Tersalin!';
        showToast('Alamat email berhasil disalin!', 'success');

        // Revert tooltip after 2s
        setTimeout(() => {
          copyTooltip.textContent = 'Salin';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('Gagal menyalin email.', 'error');
      });
    });
  }


  // ==========================================================================
  // 7. SCROLL TO TOP BUTTON
  // ==========================================================================
  const scrollTopBtn = document.getElementById('scroll-top');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      scrollTopBtn.style.opacity = '1';
      scrollTopBtn.style.pointerEvents = 'all';
      scrollTopBtn.style.transform = 'translateY(0)';
    } else {
      scrollTopBtn.style.opacity = '0';
      scrollTopBtn.style.pointerEvents = 'none';
      scrollTopBtn.style.transform = 'translateY(10px)';
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });


  // ==========================================================================
  // 8. CONTACT FORM VALIDATION & SUBMISSION
  // ==========================================================================
  const contactForm = document.getElementById('contact-form');
  const formName = document.getElementById('form-name');
  const formEmail = document.getElementById('form-email');
  const formSubject = document.getElementById('form-subject');
  const formMessage = document.getElementById('form-message');
  const submitBtn = document.getElementById('btn-submit');

  // Regex validation for Email
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate single input field
  function validateField(input, errorElement, validationFn, defaultErrorText) {
    let isValid = true;

    if (input.value.trim() === '') {
      errorElement.textContent = defaultErrorText;
      errorElement.style.display = 'block';
      input.classList.add('invalid');
      isValid = false;
    } else if (validationFn && !validationFn(input.value.trim())) {
      errorElement.style.display = 'block';
      input.classList.add('invalid');
      isValid = false;
    } else {
      errorElement.style.display = 'none';
      input.classList.remove('invalid');
    }

    return isValid;
  }

  // Real-time validation on input/blur
  formName.addEventListener('input', () => validateField(formName, document.getElementById('error-name'), null, 'Nama wajib diisi.'));
  formSubject.addEventListener('input', () => validateField(formSubject, document.getElementById('error-subject'), null, 'Subjek wajib diisi.'));
  formMessage.addEventListener('input', () => validateField(formMessage, document.getElementById('error-message'), null, 'Pesan tidak boleh kosong.'));

  formEmail.addEventListener('input', () => {
    validateField(
      formEmail,
      document.getElementById('error-email'),
      isValidEmail,
      formEmail.value.trim() === '' ? 'Alamat email wajib diisi.' : 'Masukkan email yang valid.'
    );
  });

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Perform validation on all fields
    const isNameValid = validateField(formName, document.getElementById('error-name'), null, 'Nama wajib diisi.');
    const isEmailValid = validateField(
      formEmail,
      document.getElementById('error-email'),
      isValidEmail,
      formEmail.value.trim() === '' ? 'Alamat email wajib diisi.' : 'Masukkan email yang valid.'
    );
    const isSubjectValid = validateField(formSubject, document.getElementById('error-subject'), null, 'Subjek wajib diisi.');
    const isMessageValid = validateField(formMessage, document.getElementById('error-message'), null, 'Pesan tidak boleh kosong.');

    // If any field is invalid, cancel submit
    if (!isNameValid || !isEmailValid || !isSubjectValid || !isMessageValid) {
      showToast('Harap perbaiki kesalahan pada formulir.', 'error');

      // Focus on first invalid field
      const firstInvalid = contactForm.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();

      return;
    }

    // Simulate submission process
    const originalBtnText = submitBtn.querySelector('span').textContent;
    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Mengirim...';

    // Add simple rotating spinner
    const originalSvg = submitBtn.querySelector('svg').outerHTML;
    submitBtn.querySelector('svg').outerHTML = `
      <svg class="send-icon spinner" style="animation: spin 1s linear infinite;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="2" x2="12" y2="6"></line>
        <line x1="12" y1="18" x2="12" y2="22"></line>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
        <line x1="2" y1="12" x2="6" y2="12"></line>
        <line x1="18" y1="12" x2="22" y2="12"></line>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
        <line x1="16.24" y1="5.64" x2="19.07" y2="2.81"></line>
      </svg>
    `;

    // Kirim data ke Formsubmit via AJAX
    fetch("https://formsubmit.co/ajax/rytkizx@gmail.com", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        Nama: formName.value,
        Email: formEmail.value,
        Subjek: formSubject.value,
        Pesan: formMessage.value
      })
    })
      .then(response => response.json())
      .then(data => {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = originalBtnText;

        // We search by class because we replaced the innerHTML
        const spinnerSvg = submitBtn.querySelector('.spinner');
        if (spinnerSvg) {
          spinnerSvg.outerHTML = originalSvg;
        }

        if (data.success === "true" || data.success === true) {
          // Show success toast
          showToast('Pesan Anda berhasil terkirim! Terima kasih.', 'success');

          // Reset form fields
          contactForm.reset();

          // Clean up any remaining invalid styles
          const fields = [formName, formEmail, formSubject, formMessage];
          fields.forEach(field => field.classList.remove('invalid'));
        } else {
          showToast('Terjadi kesalahan dari server. Silakan coba lagi.', 'error');
        }
      })
      .catch(error => {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = originalBtnText;

        const spinnerSvg = submitBtn.querySelector('.spinner');
        if (spinnerSvg) {
          spinnerSvg.outerHTML = originalSvg;
        }

        showToast('Gagal mengirim pesan. Periksa koneksi internet Anda.', 'error');
        console.error(error);
      });
  });


  // ==========================================================================
  // 9. TOAST NOTIFICATION SYSTEM
  // ==========================================================================
  function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icon selection
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `
        <svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      `;
    } else {
      iconSvg = `
        <svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      `;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span>${message}</span>
    `;

    // Append to container
    toastContainer.appendChild(toast);

    // Trigger slide-in animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      toast.classList.remove('show');

      // Remove from DOM after transition finishes (400ms transition time)
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 4000);
  }

  // Inject CSS keyframes for custom form loading spinner
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
});
