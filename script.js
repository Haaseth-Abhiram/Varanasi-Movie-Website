// ====================================
// CONFIGURATION
// ====================================
const RELEASE_DATE = new Date('2027-04-07T00:00:00+05:30'); // IST timezone
const YOUTUBE_TRAILER_ID = 'jDGETw3YAHc'; // YouTube video ID
const BACKGROUND_VIDEO_START_TIME = 150; // 2:30 in seconds

// ====================================
// HERO VIDEO & AUDIO BACKGROUND
// ====================================
let isUnmuted = false;
let hasStartedAudio = false;
let heroVideoEnded = false;

function pauseHeroMedia() {
    const heroAudio = document.getElementById('hero-audio-player');
    if (heroAudio && !heroAudio.paused) {
        heroAudio.pause();
    }
}

function resumeHeroMedia() {
    // Never resume hero audio if trailer modal is active or experience video is playing unmuted
    const modal = document.getElementById('trailer-modal');
    if (modal && modal.classList.contains('active')) return;

    const scopeVideo = document.getElementById('scope-video-player');
    if (scopeVideo && !scopeVideo.paused && !scopeVideo.muted) return;

    const videoPlayer = document.getElementById('hero-video-player');
    const heroAudio = document.getElementById('hero-audio-player');

    // Only resume video if it hasn't ended and user is near top
    if (!heroVideoEnded && videoPlayer && videoPlayer.paused && window.pageYOffset < 600) {
        videoPlayer.play().catch(() => {});
    }

    // Audio continues playing its single playthrough throughout the site until it ends naturally
    if (isUnmuted && heroAudio && heroAudio.paused && !heroAudio.ended) {
        heroAudio.play().catch(() => {});
    }
}

function pauseScopeVideo() {
    const scopeVideo = document.getElementById('scope-video-player');
    const playOverlay = document.getElementById('scope-center-play');
    const playIcon = document.getElementById('scope-play-icon');
    if (scopeVideo && !scopeVideo.paused) {
        scopeVideo.pause();
        if (playOverlay) playOverlay.classList.remove('hidden');
        if (playIcon) playIcon.textContent = '▶';
    }
}

function showBackgroundImage() {
    heroVideoEnded = true;
    const videoContainer = document.getElementById('hero-video-container');
    const bgImage = document.getElementById('hero-bg-image');
    const videoPlayer = document.getElementById('hero-video-player');
    
    if (videoPlayer && !videoPlayer.paused) {
        videoPlayer.pause();
    }
    
    if (videoContainer && bgImage) {
        videoContainer.classList.remove('playing');
        bgImage.classList.remove('hidden');
    }
    
    const hint = document.getElementById('unmute-hint');
    if (hint) {
        hint.classList.add('hidden');
        setTimeout(() => hint.remove(), 500);
    }
}

function startHeroAudioOnce(audioPlayer, videoPlayer) {
    if (hasStartedAudio) return;
    hasStartedAudio = true;
    isUnmuted = true;

    const modal = document.getElementById('trailer-modal');
    if (modal && modal.classList.contains('active')) return;

    const scopeVideo = document.getElementById('scope-video-player');
    if (scopeVideo && !scopeVideo.paused && !scopeVideo.muted) return;

    if (audioPlayer && !heroVideoEnded) {
        audioPlayer.loop = false; // Plays once
        // Sync audio position to video playback if video is actively playing
        if (videoPlayer && !videoPlayer.paused && videoPlayer.currentTime > 0) {
            audioPlayer.currentTime = videoPlayer.currentTime;
        }
        audioPlayer.volume = 0.6;
        audioPlayer.play().catch(err => {
            console.log('Audio playback notice:', err);
        });
    }

    // Dismiss hint
    const hint = document.getElementById('unmute-hint');
    if (hint) {
        hint.classList.add('hidden');
        setTimeout(() => hint.remove(), 500);
    }
}

function initHeroVideo() {
    const videoContainer = document.getElementById('hero-video-container');
    const bgImage = document.getElementById('hero-bg-image');
    const videoPlayer = document.getElementById('hero-video-player');
    const audioPlayer = document.getElementById('hero-audio-player');
    
    if (!videoPlayer || !videoContainer || !bgImage) return;
    
    // Play ONCE (do not loop)
    videoPlayer.loop = false;
    if (audioPlayer) {
        audioPlayer.loop = false;
        audioPlayer.addEventListener('ended', () => {
            console.log('Hero audio completed single playthrough.');
        });
    }

    videoContainer.classList.add('playing');
    bgImage.classList.add('hidden');

    // Hero background video is strictly visual (always muted, plays once)
    videoPlayer.muted = true;
    const playPromise = videoPlayer.play();
    if (playPromise !== undefined) {
        playPromise.catch((err) => {
            console.log('Video autoplay deferred:', err);
        });
    }

    // When the video ends, smoothly transition to the photo (image 1.jpg)
    videoPlayer.addEventListener('ended', () => {
        showBackgroundImage();
    });

    videoPlayer.addEventListener('timeupdate', () => {
        if (!heroVideoEnded && videoPlayer.duration && videoPlayer.currentTime >= videoPlayer.duration - 0.3) {
            showBackgroundImage();
        }
    });

    // Add scroll triggers to start audio on scroll
    setupScrollAudioTrigger(audioPlayer, videoPlayer);
    
    // Show unmute hint indicating scroll to play
    showUnmuteHint(() => {
        startHeroAudioOnce(audioPlayer, videoPlayer);
    });
}

function setupScrollAudioTrigger(audioPlayer, videoPlayer) {
    const trigger = () => {
        if (!hasStartedAudio && !heroVideoEnded) {
            startHeroAudioOnce(audioPlayer, videoPlayer);
        }
    };

    // Primary trigger: Play when user scrolls
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 5) {
            trigger();
        }
    }, { passive: true });

    // Wheel and touch triggers
    window.addEventListener('wheel', trigger, { passive: true, once: true });
    window.addEventListener('touchmove', trigger, { passive: true, once: true });

    // Click trigger fallback
    document.addEventListener('click', (e) => {
        if (e && e.target) {
            if (e.target.closest('#trailer-modal') ||
                e.target.closest('#trailer-btn') ||
                e.target.closest('.nav-watch-btn') ||
                e.target.closest('#scope-screen-container') ||
                e.target.closest('.scope-controls-bar') ||
                e.target.closest('.formats-selector') ||
                e.target.closest('#scope-center-play')) {
                return;
            }
        }
        trigger();
    });
}

function showUnmuteHint(onHintClick) {
    if (document.getElementById('unmute-hint')) return;
    
    const hint = document.createElement('div');
    hint.id = 'unmute-hint';
    hint.className = 'unmute-hint';
    hint.innerHTML = '<span class="unmute-icon">🔊</span> Scroll to play sound';
    if (onHintClick) {
        hint.addEventListener('click', onHintClick);
    }
    document.body.appendChild(hint);
    
    setTimeout(() => hint.classList.add('visible'), 500);
}


// ====================================
// COUNTDOWN TIMER WITH SMOOTH ANIMATIONS
// ====================================
let previousValues = { days: null, hours: null, minutes: null, seconds: null };

function animateValue(element, newValue) {
    if (!element) return;
    
    const currentValue = element.textContent;
    if (currentValue !== newValue) {
        element.style.transform = 'translateY(-10px)';
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.textContent = newValue;
            element.style.transform = 'translateY(10px)';
            
            requestAnimationFrame(() => {
                element.style.transform = 'translateY(0)';
                element.style.opacity = '1';
            });
        }, 150);
    }
}

function updateCountdown() {
    const now = new Date();
    const timeRemaining = RELEASE_DATE - now;

    // Check if release date has passed
    if (timeRemaining <= 0) {
        showNowPlaying();
        return;
    }

    // Calculate time units
    const days = String(Math.floor(timeRemaining / (1000 * 60 * 60 * 24))).padStart(3, '0');
    const hours = String(Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
    const minutes = String(Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    const seconds = String(Math.floor((timeRemaining % (1000 * 60)) / 1000)).padStart(2, '0');

    // Animate only changed values
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (previousValues.days !== days) animateValue(daysEl, days);
    if (previousValues.hours !== hours) animateValue(hoursEl, hours);
    if (previousValues.minutes !== minutes) animateValue(minutesEl, minutes);
    if (previousValues.seconds !== seconds) animateValue(secondsEl, seconds);

    previousValues = { days, hours, minutes, seconds };
}

// ====================================
// NOW PLAYING STATE
// ====================================
function showNowPlaying() {
    const countdownContainer = document.getElementById('countdown-container');
    const nowPlaying = document.getElementById('now-playing');
    const heroActions = document.querySelector('.hero-actions');
    
    if (countdownContainer && nowPlaying && heroActions) {
        countdownContainer.style.display = 'none';
        heroActions.style.display = 'none';
        nowPlaying.style.display = 'block';
    }
}

// ====================================
// TRAILER MODAL
// ====================================
function initTrailerModal() {
    const trailerBtn = document.getElementById('trailer-btn');
    const navWatchBtn = document.querySelector('.nav-watch-btn');
    const modal = document.getElementById('trailer-modal');
    const closeBtn = document.getElementById('close-modal');
    const modalOverlay = modal ? modal.querySelector('.modal-overlay') : null;
    const modalVideo = document.getElementById('trailer-video-player');

    if (!modal) return;

    if (modalVideo) {
        modalVideo.addEventListener('error', () => {
            const cur = modalVideo.currentSrc || modalVideo.src || '';
            if (cur.includes('github.com') || cur.includes('release-assets')) {
                console.warn('Trailer 4K remote failed, trying local 4K');
                modalVideo.src = 'assets/experience-4k.mp4';
                modalVideo.load();
                modalVideo.play().catch(() => {});
            } else if (!cur.includes('experience-1080p.mp4')) {
                console.warn('Trailer video failed, falling back to 1080p:', cur);
                modalVideo.src = 'assets/experience-1080p.mp4';
                modalVideo.load();
                modalVideo.play().catch(() => {});
            }
        });
    }

    // Open modal function
    function openModal(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Pause hero background audio and experience video immediately
        pauseHeroMedia();
        pauseScopeVideo();

        // Remove unmute hint
        const hint = document.getElementById('unmute-hint');
        if (hint) {
            hint.classList.add('hidden');
            setTimeout(() => hint.remove(), 500);
        }

        if (modalVideo) {
            modalVideo.currentTime = 0;
            const playPromise = modalVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    modalVideo.muted = true;
                    modalVideo.play().catch(err => console.log('Modal playback:', err));
                });
            }
        }
    }

    // Close modal function
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';

        if (modalVideo) {
            modalVideo.pause();
        }

        // Resume hero if scrolled up near hero
        if (window.pageYOffset < 600) {
            resumeHeroMedia();
        }
    }

    // Event listeners
    if (trailerBtn) trailerBtn.addEventListener('click', openModal);
    if (navWatchBtn) navWatchBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// ====================================
// REMINDER FUNCTIONALITY
// ====================================
function initReminder() {
    const reminderBtn = document.getElementById('reminder-btn');
    
    reminderBtn.addEventListener('click', () => {
        // Create calendar event data
        const title = 'VARANASI - Movie Release';
        const details = 'VARANASI releases in theaters worldwide!';
        const location = 'Theaters Worldwide';
        const startDate = '20270407T000000';
        const endDate = '20270407T235959';
        
        // Generate Google Calendar URL
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&dates=${startDate}/${endDate}`;
        
        // Open in new window
        window.open(googleCalendarUrl, '_blank');
    });
}

// ====================================
// SMOOTH SCROLL
// ====================================
function initSmoothScroll() {
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
}

// ====================================
// SCROLL ANIMATIONS
// ====================================
function initScrollAnimations() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        return;
    }

    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe story cards
    const storyCards = document.querySelectorAll('.story-card');
    storyCards.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px)';
        el.style.transition = `opacity 0.8s ease-out ${index * 0.15}s, transform 0.8s ease-out ${index * 0.15}s`;
        observer.observe(el);
    });
    
    // Observe crew items with staggered animation
    const crewItems = document.querySelectorAll('.crew-item');
    crewItems.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease-out ${(index % 4) * 0.1}s, transform 0.6s ease-out ${(index % 4) * 0.1}s`;
        observer.observe(el);
    });
    
    // Observe section headings
    const headings = document.querySelectorAll('.section-heading, .crew-category');
    headings.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
    
    // Fade scroll indicator on scroll
    window.addEventListener('scroll', () => {
        const scrollIndicator = document.querySelector('.scroll-indicator');
        if (scrollIndicator) {
            const opacity = Math.max(0, 1 - window.pageYOffset / 500);
            scrollIndicator.style.opacity = opacity;
        }
    });
}

// ====================================
// PARALLAX EFFECT FOR HERO
// ====================================
function initParallax() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    
    const heroBackground = document.querySelector('.hero-background');
    const heroContent = document.querySelector('.hero-content');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroHeight = window.innerHeight;
        
        if (scrolled < heroHeight) {
            if (heroBackground) {
                heroBackground.style.transform = `translateY(${scrolled * 0.4}px)`;
            }
            if (heroContent) {
                heroContent.style.opacity = 1 - (scrolled / heroHeight) * 1.2;
            }
        }
    });
}

// ====================================
// LOADING SCREEN WITH PARTICLES
// ====================================
function initLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const particleContainer = document.getElementById('particles');
    
    if (!loadingScreen) return;
    
    document.body.classList.add('loading');
    
    // Create floating particles
    if (particleContainer) {
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 3 + 's';
            particle.style.animationDuration = (2 + Math.random() * 2) + 's';
            particleContainer.appendChild(particle);
        }
    }
    
    // Use requestAnimationFrame for smoother transition
    requestAnimationFrame(() => {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
            document.body.classList.remove('loading');
            document.body.style.overflow = ''; // Ensure overflow is reset
            
            setTimeout(() => {
                if (loadingScreen && loadingScreen.parentNode) {
                    loadingScreen.remove();
                }
            }, 600);
        }, 2000);
    });
}

// ====================================
// CURSOR GLOW EFFECT
// ====================================
function initCursorGlow() {
    const cursorGlow = document.getElementById('cursor-glow');
    if (!cursorGlow) return;
    
    // Check if device supports hover
    if (window.matchMedia('(hover: none)').matches) return;
    
    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorGlow.classList.add('active');
    });
    
    document.addEventListener('mouseleave', () => {
        cursorGlow.classList.remove('active');
    });
    
    // Smooth follow animation
    function animateGlow() {
        glowX += (mouseX - glowX) * 0.1;
        glowY += (mouseY - glowY) * 0.1;
        
        cursorGlow.style.left = glowX + 'px';
        cursorGlow.style.top = glowY + 'px';
        
        requestAnimationFrame(animateGlow);
    }
    animateGlow();
}

// ====================================
// SCROLL PROGRESS BAR
// ====================================
function initScrollProgress() {
    const progressBar = document.querySelector('.scroll-progress-bar');
    
    window.addEventListener('scroll', () => {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.pageYOffset / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });
}

// ====================================
// BACK TO TOP BUTTON
// ====================================
function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ====================================
// MOBILE NOTICE
// ====================================
function initMobileNotice() {
    const notice = document.getElementById('mobile-notice');
    const closeBtn = notice?.querySelector('.mobile-notice-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notice.style.display = 'none';
            // Adjust nav position
            const nav = document.querySelector('.nav');
            if (nav) nav.style.top = '0';
        });
    }
}

// ====================================
// KEYBOARD SHORTCUTS
// ====================================
function initKeyboardShortcuts() {
    const modal = document.getElementById('trailer-modal');
    
    document.addEventListener('keydown', (e) => {
        // Space or Enter to open trailer (when not in modal)
        if ((e.key === ' ' || e.key === 'Enter') && !modal.classList.contains('active')) {
            const trailerBtn = document.getElementById('trailer-btn');
            if (trailerBtn && !trailerBtn.hasAttribute('disabled')) {
                e.preventDefault();
                trailerBtn.click();
            }
        }
    });
}

// ====================================
// CINEMA SCOPES & FORMATS VIEWER
// ====================================
function initCinemaScopes() {
    const screenContainer = document.getElementById('scope-screen-container');
    const videoEl = document.getElementById('scope-video-player');
    const badgeEl = document.getElementById('scope-format-badge');
    const descText = document.getElementById('scope-desc-text');
    const playOverlay = document.getElementById('scope-center-play');
    const playBtn = document.getElementById('scope-play-btn');
    const playIcon = document.getElementById('scope-play-icon');
    const muteBtn = document.getElementById('scope-mute-btn');
    const volumeIcon = document.getElementById('scope-volume-icon');
    const currentTimeEl = document.getElementById('scope-current-time');
    const durationEl = document.getElementById('scope-duration');
    const seekRail = document.getElementById('scope-seek-bar');
    const seekProgress = document.getElementById('scope-seek-progress');
    const fullscreenBtn = document.getElementById('scope-fullscreen-btn');
    const formatButtons = document.querySelectorAll('.format-btn');

    if (!screenContainer || !videoEl) return;

    const FORMATS = {
        "1.43": {
            ratio: 1.43,
            badge: "1.43:1 • IMAX",
            desc: "Babu in 1.43:1 ratio — tallest IMAX ratio. The complete frame. Rajamouli shot Varanasi taller than any Indian film before it — so the ghats reach the sky and the river swallows the earth. This is the image as he intended it. Nothing cropped. Nothing lost."
        },
        "1.90": {
            ratio: 1.90,
            badge: "1.90:1 • IMAX DIGITAL",
            desc: "The IMAX digital experience — wider than the eye expects, still taller than convention allows. The scale of this Magnus Opus fills the screen from edge to edge. Most of the world will see Varanasi this way."
        },
        "2.20": {
            ratio: 2.20,
            badge: "2.20:1 • 70MM",
            desc: "The format of Lawrence of Arabia. Of Spartacus. Rajamouli always said Indian cinema deserved that legacy. In 70mm, Varanasi earns its place among the epics of cinema history."
        },
        "1.85": {
            ratio: 1.85,
            badge: "1.85:1 • FLAT",
            desc: "The standard widescreen ratio — familiar, intimate by comparison. Even constrained to this frame, Varanasi refuses to feel small. Some films are simply too large for any box."
        },
        "2.39": {
            ratio: 2.39,
            badge: "2.39:1 • SCOPE",
            desc: "Ultra-wide anamorphic. The horizon stretches until Varanasi feels like the entire world — and somehow, still not wide enough to contain it."
        }
    };

    let currentFormatId = "1.43";

    function updateDimensions() {
        const format = FORMATS[currentFormatId] || FORMATS["1.43"];
        const ratio = format.ratio;

        const availableH = Math.max(340, window.innerHeight - 180);
        const maxW = Math.min(window.innerWidth * 0.95, 1360, 1.43 * availableH);
        const targetW = Math.round(maxW);
        const targetH = Math.round(targetW / ratio);

        screenContainer.style.width = `${targetW}px`;
        screenContainer.style.height = `${targetH}px`;
    }

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Format selector buttons
    formatButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = btn.getAttribute('data-id');
            if (!id || !FORMATS[id]) return;

            formatButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentFormatId = id;
            const data = FORMATS[id];

            updateDimensions();

            // Trigger visual pulse animation
            screenContainer.classList.add('ratio-switching');
            setTimeout(() => screenContainer.classList.remove('ratio-switching'), 500);

            if (badgeEl) badgeEl.textContent = data.badge;

            if (descText) {
                descText.style.opacity = '0';
                setTimeout(() => {
                    descText.textContent = data.desc;
                    descText.style.opacity = '1';
                }, 180);
            }
        });
    });

    // Multi-Resolution Video Setup (Pristine 4K Master via CDN + Local High-Definition Assets)
    const MASTER_4K_URL = "https://github.com/Haaseth-Abhiram/Varanasi-Movie-Website/releases/download/v1.0.0/experience-4k.mp4";
    const RESOLUTION_SOURCES = {
        2160: MASTER_4K_URL,
        1080: "assets/experience-1080p.mp4",
        720: "assets/experience-720p.mp4",
        480: "assets/experience-480p.mp4"
    };

    let activeResolution = 2160;
    let currentLoadedSrc = MASTER_4K_URL;
    const qualityToast = document.getElementById('scope-quality-toast');
    let toastTimer = null;

    function showQualityToast(text) {
        if (!qualityToast) return;
        qualityToast.textContent = text;
        qualityToast.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            qualityToast.classList.remove('show');
        }, 1600);
    }

    function startVideoPlayback() {
        videoEl.muted = true;
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                if (playOverlay) playOverlay.classList.add('hidden');
                if (playIcon) playIcon.textContent = '❚❚';
            }).catch(() => {
                if (playOverlay) playOverlay.classList.remove('hidden');
                if (playIcon) playIcon.textContent = '▶';
            });
        }
    }

    // Resilient multi-tier fallback:
    // 1. If GitHub Release 4K has network issue -> fall back to local 4K (assets/experience-4k.mp4)
    // 2. If local 4K has issue -> fall back to 1080p Full HD (assets/experience-1080p.mp4)
    videoEl.addEventListener('error', () => {
        const cur = videoEl.currentSrc || videoEl.src || '';
        console.warn('Cinema scope video error on source:', cur);
        if (cur.includes('github.com') || cur.includes('release-assets')) {
            console.log('Falling back to local 4K source');
            currentLoadedSrc = "assets/experience-4k.mp4";
            videoEl.src = "assets/experience-4k.mp4";
            videoEl.load();
            startVideoPlayback();
        } else if (!cur.includes('experience-1080p.mp4')) {
            console.log('Falling back to 1080p Full HD source');
            currentLoadedSrc = RESOLUTION_SOURCES[1080];
            videoEl.src = RESOLUTION_SOURCES[1080];
            videoEl.load();
            startVideoPlayback();
            if (resLabel) resLabel.textContent = '1080p';
        }
    });

    // Set initial pristine 4K video source immediately
    videoEl.src = RESOLUTION_SOURCES[2160];
    videoEl.load();
    startVideoPlayback();

    // Playback Controls
    function togglePlay(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        if (videoEl.paused) {
            pauseHeroMedia();
            videoEl.muted = false;
            const p = videoEl.play();
            if (p !== undefined) {
                p.then(() => {
                    if (playOverlay) playOverlay.classList.add('hidden');
                    if (playIcon) playIcon.textContent = '❚❚';
                    if (volumeIcon) volumeIcon.textContent = '🔊';
                }).catch(() => {
                    videoEl.muted = true;
                    videoEl.play();
                    if (playOverlay) playOverlay.classList.add('hidden');
                    if (playIcon) playIcon.textContent = '❚❚';
                });
            }
        } else {
            videoEl.pause();
            if (playOverlay) playOverlay.classList.remove('hidden');
            if (playIcon) playIcon.textContent = '▶';
        }
    }

    if (playOverlay) playOverlay.addEventListener('click', togglePlay);
    if (playBtn) playBtn.addEventListener('click', togglePlay);

    videoEl.addEventListener('play', () => {
        if (!videoEl.muted) {
            pauseHeroMedia();
        }
        if (playOverlay) playOverlay.classList.add('hidden');
        if (playIcon) playIcon.textContent = '❚❚';
    });

    videoEl.addEventListener('pause', () => {
        if (playOverlay) playOverlay.classList.remove('hidden');
        if (playIcon) playIcon.textContent = '▶';
        resumeHeroMedia();
    });

    videoEl.addEventListener('ended', () => {
        if (playOverlay) playOverlay.classList.remove('hidden');
        if (playIcon) playIcon.textContent = '▶';
        resumeHeroMedia();
    });

    // Auto coordination on scroll
    window.addEventListener('scroll', () => {
        // If the cinema scope video is playing with sound, keep hero audio paused
        if (videoEl && !videoEl.paused && !videoEl.muted) {
            pauseHeroMedia();
        }
        // When scrolled back near top, pause experience video if it was running
        if (window.pageYOffset < 350) {
            if (videoEl && !videoEl.paused) {
                videoEl.pause();
                if (playOverlay) playOverlay.classList.remove('hidden');
                if (playIcon) playIcon.textContent = '▶';
            }
        }
    }, { passive: true });

    // Mute / Unmute
    if (muteBtn) {
        muteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            videoEl.muted = !videoEl.muted;
            if (volumeIcon) {
                volumeIcon.textContent = videoEl.muted ? '🔇' : '🔊';
            }
        });
    }

    // Time & Progress formatting
    function formatTime(sec) {
        if (isNaN(sec) || !isFinite(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    videoEl.addEventListener('timeupdate', () => {
        if (currentTimeEl) currentTimeEl.textContent = formatTime(videoEl.currentTime);
        if (durationEl && videoEl.duration) durationEl.textContent = formatTime(videoEl.duration);
        if (seekProgress && videoEl.duration) {
            const pct = (videoEl.currentTime / videoEl.duration) * 100;
            seekProgress.style.width = `${pct}%`;
        }
    });

    videoEl.addEventListener('loadedmetadata', () => {
        if (durationEl) durationEl.textContent = formatTime(videoEl.duration);
    });

    // Seek bar scrubbing
    if (seekRail) {
        seekRail.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!videoEl.duration) return;
            const rect = seekRail.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const pct = Math.max(0, Math.min(1, clickX / rect.width));
            videoEl.currentTime = pct * videoEl.duration;
        });
    }

    // Quality & Resolution Settings
    const settingsWrapper = document.getElementById('scope-settings-wrapper');
    const settingsBtn = document.getElementById('scope-settings-btn');
    const resLabel = document.getElementById('scope-res-label');
    const qualityOptions = document.querySelectorAll('.scope-quality-option');

    if (settingsBtn && settingsWrapper) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsWrapper.classList.toggle('open');
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (settingsWrapper && !settingsWrapper.contains(e.target)) {
                settingsWrapper.classList.remove('open');
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && settingsWrapper.classList.contains('open')) {
                settingsWrapper.classList.remove('open');
            }
        });
    }

    function switchQuality(q) {
        activeResolution = q;

        // 1. Update UI checkmarks
        qualityOptions.forEach(opt => {
            const optQ = parseInt(opt.getAttribute('data-quality'), 10);
            if (optQ === q) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });

        // 2. Update resolution badge & toast feedback
        let badgeText = '4K';
        let toastText = '4K UHD • 3840×2160';
        if (q === 2160) {
            badgeText = '4K';
            toastText = '4K UHD • 3840×2160';
        } else if (q === 1080) {
            badgeText = '1080p';
            toastText = 'Full HD • 1920×1080';
        } else if (q === 720) {
            badgeText = '720p';
            toastText = 'HD • 1280×720';
        } else if (q === 480) {
            badgeText = '480p';
            toastText = 'SD • 854×480';
        } else {
            badgeText = 'Auto';
            toastText = 'Auto Quality (Adaptive)';
        }
        if (resLabel) resLabel.textContent = badgeText;
        showQualityToast(toastText);

        // 3. Native high-definition source switching with seamless timestamp preservation
        let targetSrc = RESOLUTION_SOURCES[q];
        if (q === -1 || !targetSrc) {
            targetSrc = (window.innerWidth >= 1920 || window.devicePixelRatio >= 1.5)
                ? RESOLUTION_SOURCES[2160]
                : RESOLUTION_SOURCES[1080];
        }

        if (targetSrc) {
            const curTime = videoEl.currentTime || 0;
            const wasPlaying = !videoEl.paused;
            const isMuted = videoEl.muted;

            if (currentLoadedSrc !== targetSrc) {
                currentLoadedSrc = targetSrc;
                videoEl.src = targetSrc;
                videoEl.currentTime = curTime;
                videoEl.muted = isMuted;

                videoEl.addEventListener('loadedmetadata', function onMeta() {
                    videoEl.currentTime = curTime;
                    videoEl.removeEventListener('loadedmetadata', onMeta);
                }, { once: true });

                if (wasPlaying) {
                    const playPromise = videoEl.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(e => console.log('Resume error:', e));
                    }
                }
            }
        }
    }

    qualityOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const q = parseInt(opt.getAttribute('data-quality'), 10);
            switchQuality(q);
            if (settingsWrapper) {
                settingsWrapper.classList.remove('open');
            }
        });
    });

    // Fullscreen toggle
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!document.fullscreenElement) {
                if (screenContainer.requestFullscreen) {
                    screenContainer.requestFullscreen();
                } else if (videoEl.webkitEnterFullscreen) {
                    videoEl.webkitEnterFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        });
    }
}

// ====================================
// INITIALIZE ON DOM LOAD
// ====================================
function initApp() {
    // Loading screen
    initLoadingScreen();
    
    // Start countdown
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // Initialize features
    initHeroVideo();
    initCinemaScopes();
    initTrailerModal();
    initReminder();
    initSmoothScroll();
    initScrollAnimations();
    initScrollProgress();
    initBackToTop();
    initKeyboardShortcuts();
    initCursorGlow();
    initParallax();
    initMobileNotice();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
