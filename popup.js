document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('aiModeToggle');
    const statusText = document.getElementById('statusText');
    const statusDot = document.querySelector('.status-dot');

    // Initialize with AI mode off (don't save state globally)
    toggle.checked = false;
    updateStatus(false);

    // Handle toggle change
    toggle.addEventListener('change', function() {
        const isEnabled = toggle.checked;
        
        // Update UI
        updateStatus(isEnabled);
        
        // Send message to content script
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'toggleAIMode',
                enabled: isEnabled
            });
        });
    });

    function updateStatus(enabled) {
        if (enabled) {
            statusText.textContent = 'AI Mode: On';
            statusDot.classList.add('active');
        } else {
            statusText.textContent = 'AI Mode: Off';
            statusDot.classList.remove('active');
        }
    }
});
