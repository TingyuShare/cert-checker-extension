// popup.js

function displayCertInfo(infoDiv, certInfo) {
  if (certInfo) {
    const { host, valid_from, valid_till, days_left } = certInfo;
    let tableHtml = `<table style='width:100%;border-collapse:collapse;'>
      <tr><td style='font-weight:bold;padding:2px 6px;'>Domain</td><td style='padding:2px 6px;'>${host}</td></tr>
      <tr><td style='font-weight:bold;padding:2px 6px;'>Validity From</td><td style='padding:2px 6px;'>${valid_from}</td></tr>
      <tr><td style='font-weight:bold;padding:2px 6px;'>Validity Till</td><td style='padding:2px 6px;'>${valid_till}</td></tr>
      <tr><td style='font-weight:bold;padding:2px 6px;'>Days Left</td><td style='padding:2px 6px;'>${days_left}</td></tr>
    </table>`;
    let statusText = "";
    let statusColor = "";
    if (days_left <= 0) {
      statusText = "Status: Expired";
      statusColor = "red";
    } else if (days_left <= 30) {
      statusText = "Status: Expiring Soon!";
      statusColor = "orange";
    } else {
      statusText = "Status: OK";
      statusColor = "green";
    }
    infoDiv.innerHTML = tableHtml + `<div style='margin-top:8px;font-weight:bold;color:${statusColor};'>${statusText}</div>`;
  } else {
    infoDiv.textContent = 'Could not retrieve certificate information.';
    infoDiv.classList.add('error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const infoDiv = document.getElementById('info');
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      const currentTab = tabs[0];
      const tabId = currentTab.id;

      if (!currentTab.url || (!currentTab.url.startsWith('http:') && !currentTab.url.startsWith('https:'))) {
        infoDiv.textContent = 'Cannot retrieve certificate info for this type of page (e.g., about:blank, file://).';
        return;
      }

      // First, try to get data from local storage
      const data = await browser.storage.local.get(`cert-${tabId}`);
      let certInfo = data[`cert-${tabId}`];

      if (certInfo) {
        displayCertInfo(infoDiv, certInfo);
      } else {
        // If not in storage, request it from the background script
        infoDiv.textContent = 'Fetching certificate info...';
        certInfo = await browser.runtime.sendMessage({
          action: "getCertInfo",
          tab: currentTab
        });
        
        // Store the newly fetched info
        if (certInfo) {
          await browser.storage.local.set({ [`cert-${tabId}`]: certInfo });
        }
        
        displayCertInfo(infoDiv, certInfo);
      }
    } else {
      infoDiv.textContent = 'No active tab found.';
    }
  } catch (error) {
    console.error('Error displaying certificate info:', error);
    infoDiv.textContent = 'Error retrieving certificate information. See console for details.';
    infoDiv.classList.add('error');
  }
});
