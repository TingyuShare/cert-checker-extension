# Certificate Expiry Checker

## Description

This is a browser extension that automatically checks the expiration date of a website's SSL certificate. It provides a quick visual indicator in the browser toolbar and detailed information in a popup.

The primary goal is to alert users about websites with certificates that are expiring soon (within 30 days) or have already expired.

## Features

- **Automatic Certificate Check**: Automatically fetches certificate information when a page is loaded.
- **Toolbar Icon Indicator**: Displays a red "!" badge on the extension icon if a site's certificate is expiring within 30 days.
- **On-Demand Information**: Click the extension icon to open a popup with detailed certificate information, including:
  - Domain Name
  - Validity Period (From and To dates)
  - Days Remaining Until Expiry
- **Daily Caching**: Caches certificate information for each domain for a day to minimize redundant API calls and improve performance.
- **Retry Mechanism**: Automatically retries failed network requests up to 3 times to handle temporary connectivity issues.
- **Click-to-Fetch**: If certificate data is not available when the popup is opened, it will automatically trigger a fetch to get the latest information.

## How to Use

1.  Navigate to any website using `http` or `https`.
2.  The extension will automatically check the SSL certificate in the background.
3.  If the certificate is expiring within 30 days, a "!" badge will appear on the extension's icon.
4.  Click the icon at any time to view the detailed certificate status for the current tab.

## How to Install

1.  Download or clone this repository to your local machine.
2.  Open your browser's extension management page (e.g., `chrome://extensions` for Chrome, `about:debugging` for Firefox).
3.  Enable "Developer mode".
4.  Click on "Load Unpacked" (or the equivalent for your browser) and select the `cert-checker-extension` directory.
5.  The extension should now be installed and active.
