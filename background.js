// background.js

// Function to get certificate info
async function getCertificateInfo(tabId, url) {
  console.log(`Fetching certificate info for tab ${tabId} and URL: ${url}`);
  const host = new URL(url).hostname;
  const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
  const cacheKey = `cert-cache-${host}-${today}`;

  // Check cache first
  const cachedData = await browser.storage.local.get(cacheKey);
  if (cachedData[cacheKey]) {
    console.log(`Using cached certificate info for ${host}`);
    return cachedData[cacheKey];
  }

  // Retry mechanism
  let attempts = 0;
  const maxAttempts = 3;
  const retryDelay = 1000; // 1 second

  while (attempts < maxAttempts) {
    try {
      console.log(`Fetching fresh certificate info for ${host} (Attempt ${attempts + 1})`);
      const response = await fetch(`https://ssl-checker.io/api/v1/check/${host}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.status === "ok") {
        const certInfo = {
          "host": host,
          "valid_till": data.result.valid_till,
          "valid_from": data.result.valid_from,
          "days_left": data.result.valid_days_to_expire
        };
        // Store in cache
        await browser.storage.local.set({ [cacheKey]: certInfo });
        console.log(`Certificate for ${host} expires on: ${certInfo.valid_till}, in ${certInfo.days_left} days.`);
        return certInfo;
      } else {
        // If API returns an error, don't retry
        console.error(`API error for ${host}:`, data);
        return null;
      }
    } catch (error) {
      attempts++;
      console.error(`Error fetching certificate info for ${url} (Attempt ${attempts}):`, error);
      if (attempts >= maxAttempts) {
        console.error(`Failed to fetch certificate info for ${url} after ${maxAttempts} attempts.`);
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  return null;
}

// Update icon and check expiry when a tab is updated
async function handleTabUpdate(tabId, changeInfo, tab) {
  // Ensure the tab is fully loaded and has a valid URL
  if (changeInfo.status === 'complete' && tab.url && (tab.url.startsWith('http:') || tab.url.startsWith('https:'))) {
    console.log(`Tab ${tabId} updated: ${tab.url}`);
    const certInfo = await getCertificateInfo(tabId, tab.url);
    if (certInfo) {
      await browser.storage.local.set({ [`cert-${tabId}`]: certInfo });
      if (certInfo.days_left <= 30) {
        // Optionally, update browser action icon or badge
        browser.browserAction.setBadgeText({ text: "!", tabId: tabId });
        browser.browserAction.setBadgeBackgroundColor({ color: "red", tabId: tabId });
      } else {
        browser.browserAction.setBadgeText({ text: "", tabId: tabId });
      }
    }
  }
}

// Listen for tab updates
browser.tabs.onUpdated.addListener(handleTabUpdate);

// Listen for messages from the popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCertInfo") {
    getCertificateInfo(request.tab.id, request.tab.url)
      .then(response => {
        sendResponse(response);
      })
      .catch(error => {
        console.error("Error in getCertificateInfo from message listener:", error);
        sendResponse(null);
      });
    return true; // Indicates that the response is sent asynchronously
  }
});


// Clean up storage when a tab is removed
browser.tabs.onRemoved.addListener((tabId) => {
  browser.storage.local.remove(`cert-${tabId}`);
  console.log(`Cleaned up storage for removed tab ${tabId}`);
});

console.log("Certificate Expiry Checker background script loaded.");