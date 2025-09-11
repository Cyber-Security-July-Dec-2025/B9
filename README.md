# Password Manager Web-App with Browser Extension

## Description
A secure password manager that allows users to safely store and retrieve passwords for websites and applications.  
All encryption happens locally within the browser extension, ensuring that even if the database is leaked, attackers only get encrypted data.  

---

## Features

### Master Password & Key Derivation
- Users set a **master password** (never stored anywhere).
- A key is derived from the master password using **PBKDF2, Argon2, or scrypt**.
- This key is used to **encrypt/decrypt all stored credentials**.

### Local AES Encryption
- Uses **AES-256-GCM** for encryption, which also provides **data integrity checking**.
- Credentials are stored encrypted in **IndexedDB** on the user’s browser.

### Auto-Fill in Browser (Optional)
- The browser extension can detect login forms and **auto-fill usernames/passwords** for stored sites.  
- (*This feature is optional and may not be implemented yet.*)

### Password Generator
- Generates **secure, random passwords** with options for length, symbols, and numbers.
- Uses `crypto.getRandomValues()` in JavaScript for cryptographic randomness.

### Security Features
- **Auto-lock** after inactivity.
- **Manual lock** button for immediate security.

---

## Tech Stack & File Structure

### Files in the Extension
- `manifest.json` — Browser extension configuration and permissions.
- `popup.html` / `popup.js` — UI for unlocking vault, searching, adding credentials.
- `styles.css` — Styling for the popup and options pages.
- `content.js` — Detects login forms and injects autofill logic.
- `background.js` / `sw.js` — Maintains vault state, handles encryption/decryption requests.
- `crypto.js` — Handles all encryption, decryption, and key derivation logic.
- `idb.js` — Wrapper for **IndexedDB** operations.

---

## Installation

1. Clone the repository:
git clone <repository_url>
Open your browser and navigate to Extensions:

Chrome: chrome://extensions/

Firefox: about:debugging#/runtime/this-firefox

Enable Developer Mode.

Click Load unpacked and select the project folder.

The extension should now appear in your browser toolbar.

## Usage
Click the extension icon to open the Popup UI.

Set your master password (first-time setup).

Add new credentials by specifying:

Website/Service Name

Username

Password (or generate a secure password using the generator)

Unlock the vault using your master password to view or copy credentials.

Use the manual lock button to secure your vault at any time.

## Security Considerations
Master password never leaves the client; it is never stored or transmitted.

Credentials are encrypted locally before storage.

Uses AES-256-GCM for encryption to ensure confidentiality and integrity.

Auto-lock ensures the vault is secured after inactivity.


