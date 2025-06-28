document.addEventListener('DOMContentLoaded', () => {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('sidebar-close-btn');

    // Also sync username and buttons between header and sidebar
    function syncUserSettings() {
        document.getElementById('username-display-sidebar').textContent = document.getElementById('username-display').textContent;

        ['show-stats-btn', 'change-username-btn', 'clear-stats-btn'].forEach(id => {
            const headerBtn = document.getElementById(id);
            const sidebarBtn = document.getElementById(id + '-sidebar');
            if (headerBtn && sidebarBtn) {
                sidebarBtn.onclick = headerBtn.onclick.bind(headerBtn);
            }
        });

        // Same for exam controls buttons - link event listeners
        ['start-exam-mode', 'pause-timer-btn', 'stop-timer-btn', 'show-exam-stats-btn'].forEach(id => {
            const headerBtn = document.getElementById(id);
            const sidebarBtn = document.getElementById(id + '-sidebar');
            if (headerBtn && sidebarBtn) {
                sidebarBtn.onclick = headerBtn.onclick.bind(headerBtn);
            }
        });
    }

    syncUserSettings();

    hamburgerBtn.addEventListener('click', () => {
        sidebar.classList.add('show');
        sidebar.setAttribute('aria-hidden', 'false');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden'; // prevent background scroll
    });

    closeBtn.addEventListener('click', () => {
        sidebar.classList.remove('show');
        sidebar.setAttribute('aria-hidden', 'true');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    });

    // Optional: close sidebar if clicking outside sidebar content
    sidebar.addEventListener('click', e => {
        if (e.target === sidebar) {
            closeBtn.click();
        }
    });
});
  