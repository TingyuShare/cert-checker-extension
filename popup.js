// popup.js
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

      const data = await browser.storage.local.get(`cert-${tabId}`);
      const certInfo = data[`cert-${tabId}`];

      if (certInfo) {
        const validTill = certInfo.valid_till;
        const validFrom = certInfo.valid_from;
        const daysLeft = certInfo.days_left;
        const host = certInfo.host;
        let tableHtml = `<table style='width:100%;border-collapse:collapse;'>
          <tr><td style='font-weight:bold;padding:2px 6px;'>Domain</td><td style='padding:2px 6px;'>${host}</td></tr>
          <tr><td style='font-weight:bold;padding:2px 6px;'>Validity From</td><td style='padding:2px 6px;'>${validFrom}</td></tr>
          <tr><td style='font-weight:bold;padding:2px 6px;'>Validity Till</td><td style='padding:2px 6px;'>${validTill}</td></tr>
          <tr><td style='font-weight:bold;padding:2px 6px;'>Days Left</td><td style='padding:2px 6px;'>${daysLeft}</td></tr>
        </table>`;
        let statusText = "";
        let statusColor = "";
        if (daysLeft <= 0) {
          statusText = "Status: Expired";
          statusColor = "red";
        } else if (daysLeft <= 30) {
          statusText = "Status: Expiring Soon!";
          statusColor = "orange";
        } else {
          statusText = "Status: OK";
          statusColor = "green";
        }
        infoDiv.innerHTML = tableHtml + `<div style='margin-top:8px;font-weight:bold;color:${statusColor};'>${statusText}</div>`;
      } else {
        // If no info in storage, try to fetch it (e.g., if popup opened before background script processed)
        // This might be redundant if background script is quick, but good for robustness
        if (currentTab.url && (currentTab.url.startsWith('http:') || currentTab.url.startsWith('https:'))) {
            infoDiv.textContent = 'Certificate information is being processed. Please try again shortly or reload the page.';
            // Optionally, trigger background script to fetch if not already doing so
            // browser.runtime.sendMessage({ action: "getCertInfoForPopup", tabId: tabId, url: currentTab.url });
        } else {
            infoDiv.textContent = 'No certificate information available for this tab.';
        }
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