/* ============================================================
   BACKGROUND SERVICE WORKER
   When user clicks the extension icon or presses Alt+Shift+L,
   inject the content script into the page. The content script
   creates the in-page panel that stays visible.
   ============================================================ */

// Click extension icon → inject content script
chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;
    await injectAndToggle(tab.id);
});

// Keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'toggle-inspect') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) await injectAndToggle(tab.id);
    }
});

async function injectAndToggle(tabId) {
    try {
        // Try to send toggle message first (if already injected)
        await chrome.tabs.sendMessage(tabId, { action: 'toggle-panel' });
    } catch {
        // Not injected yet → inject both CSS and JS
        await chrome.scripting.insertCSS({
            target: { tabId },
            files: ['content.css'],
        });
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js'],
        });
    }
}
