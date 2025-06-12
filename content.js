// content.js
console.log("Certificate Expiry Checker content script loaded.");

function findSearchBoxes() {
  // Common selectors for search input fields
  const selectors = [
    'input[type="search"]',
    'input[name*="search"]',
    'input[name*="query"]',
    'input[name*="q"]',
    'input[id*="search"]',
    'input[id*="query"]',
    'input[id*="q"]',
    'input[class*="search"]',
    'input[aria-label*="search"]',
    'textarea[name*="search"]',
    'textarea[name*="query"]',
    'textarea[name*="q"]'
  ];
  let searchBoxes = [];
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => searchBoxes.push(el));
  });
  // Deduplicate in case multiple selectors match the same element
  return [...new Set(searchBoxes)];
}

function highlightSearchBox(days) {
  const searchBoxes = findSearchBoxes();
  if (searchBoxes.length > 0) {
    searchBoxes.forEach(searchBox => {
      searchBox.style.border = '2px solid red';
      searchBox.style.setProperty('border', '2px solid red', 'important'); // Try to override other styles
      console.log(`Search box highlighted. Certificate expires in ${days} days.`);
    });
  } else {
    console.log("No search box found to highlight.");
  }
}

function removeHighlight() {
  const searchBoxes = findSearchBoxes();
  if (searchBoxes.length > 0) {
    searchBoxes.forEach(searchBox => {
      searchBox.style.border = ''; // Reset to default
      console.log("Search box highlight removed.");
    });
  }
}

// Listen for messages from the background script
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);
  if (request.action === "highlightSearchBox") {
    highlightSearchBox(request.days);
    sendResponse({ status: "Search box highlighted" });
  } else if (request.action === "removeHighlight") {
    removeHighlight();
    sendResponse({ status: "Search box highlight removed" });
  }
  return true; // Indicates that the response will be sent asynchronously or keeps the message channel open
});