// background.js

// Function to get certificate info (placeholder)
async function getCertificateInfo(tabId, url) {
  console.log(`Fetching certificate info for tab ${tabId} and URL: ${url}`);
  try {
    // filter out host
    const host = new URL(url).hostname;
    console.log(`Host: ${host}`);
    
    // await fetch https://ssl-checker.io/api/v1/check/ with host
    const response = await fetch(`https://ssl-checker.io/api/v1/check/${host}`);
    const data = await response.json();
    console.log(data);
    // if no status key or status is not ok, return null
    if (!data.status || data.status !== "ok") {
      return null;
    }
    // if data.status is ok 
    if (data.status === "ok") {
      const valid_till  = data.result.valid_till;
      const valid_from = data.result.valid_from;
      const days_left = data.result.valid_days_to_expire;
      console.log(`Certificate for ${host} expires on: ${valid_till}, in ${days_left} days.`);
    return {
      "host": host,
      "valid_till": valid_till,
      "valid_from": valid_from,
      "days_left": days_left
    };
  }

  } catch (error) {
    console.error(`Error fetching certificate info for ${url}:`, error);
    return null;
  }
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
        // Notify content script to change search bar color
        browser.tabs.sendMessage(tabId, { action: "highlightSearchBox", days: certInfo.days_left }).catch(e => console.log("Error sending message to content script: ", e));
        // Optionally, update browser action icon or badge
        browser.browserAction.setBadgeText({ text: "!", tabId: tabId });
        browser.browserAction.setBadgeBackgroundColor({ color: "red", tabId: tabId });
      } else {
        browser.tabs.sendMessage(tabId, { action: "removeHighlight" }).catch(e => console.log("Error sending message to content script: ", e));
        browser.browserAction.setBadgeText({ text: "", tabId: tabId });
      }
    }
  }
}

// Update icon and check expiry when a tab is activated
async function handleTabActivated(activeInfo) {
  const tabId = activeInfo.tabId;
  try {
    const tab = await browser.tabs.get(tabId);
    if (tab.url && (tab.url.startsWith('http:') || tab.url.startsWith('https:'))) {
      console.log(`Tab ${tabId} activated: ${tab.url}`);
      const certInfo = await getCertificateInfo(tabId, tab.url);
      if (certInfo) {
        await browser.storage.local.set({ [`cert-${tabId}`]: certInfo });
         if (certInfo.days_left <= 30) {
           browser.tabs.sendMessage(tabId, { action: "highlightSearchBox", days: certInfo.days_left }).catch(e => console.log("Error sending message to content script: ", e));
           browser.browserAction.setBadgeText({ text: "!", tabId: tabId });
           browser.browserAction.setBadgeBackgroundColor({ color: "red", tabId: tabId });
         } else {
           browser.tabs.sendMessage(tabId, { action: "removeHighlight" }).catch(e => console.log("Error sending message to content script: ", e));
           browser.browserAction.setBadgeText({ text: "", tabId: tabId });
         }
      }
    }
  } catch (error) {
    console.error(`Error getting tab info for tab ${tabId}:`, error);
  }
}

// Listen for tab updates
browser.tabs.onUpdated.addListener(handleTabUpdate);

// Listen for tab activation
browser.tabs.onActivated.addListener(handleTabActivated);

// Clean up storage when a tab is removed
browser.tabs.onRemoved.addListener((tabId) => {
  browser.storage.local.remove(`cert-${tabId}`);
  console.log(`Cleaned up storage for removed tab ${tabId}`);
});

console.log("Certificate Expiry Checker background script loaded.");