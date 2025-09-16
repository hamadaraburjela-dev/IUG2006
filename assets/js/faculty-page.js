document.addEventListener('DOMContentLoaded', function() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const backButtons = document.querySelectorAll('.back-btn');
    const navGrid = document.querySelector('.nav-grid');
    // Accept id variants: 'transition-sound', 'transitionSound', or 'turning'
    const transitionSound = document.getElementById('transition-sound') || document.getElementById('transitionSound') || document.getElementById('turning');

    // Function to play sound effects
    function playSound(audioElement) {
        if (audioElement) {
            audioElement.currentTime = 0;
            audioElement.play().catch(e => console.log("Sound play error:", e));
        }
    }

    // Function to show a specific content section
    function showSection(targetId) {
        playSound(transitionSound);
        if (navGrid) {
            navGrid.style.display = 'none';
        }
        contentSections.forEach(sec => sec.style.display = 'none');
        
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
    }

    // Function to return to the main navigation grid
    function showNav() {
        playSound(transitionSound);
        contentSections.forEach(sec => sec.style.display = 'none');
        if (navGrid) {
            navGrid.style.display = 'grid';
        }
    }

    // Add click listeners to navigation items
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            if (targetId) {
                showSection(targetId);
            }
        });
    });

    // Add click listeners to back buttons
    backButtons.forEach(button => {
        button.addEventListener('click', showNav);
    });
});