# Password Manager Web-App with Browser Extension

## Description
A secure password manager that allows users to safely store and retrieve passwords for websites and applications.  
All encryption happens locally within the browser extension, ensuring that even if the database is leaked, attackers only get encrypted data.  

---

## Features

### Master Password & Key Derivation
- Users set a **master password** (never stored anywhere).
- A key is derived from the master password.
- This key is used to **encrypt/decrypt all stored credentials**.

### Local AES Encryption
- Uses **AES-256-GCM** for encryption, which also provides **data integrity checking**.
- Credentials are stored encrypted in **IndexedDB** on the user’s browser.

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
-  `sw.js` — Maintains vault state, handles encryption/decryption requests.
- `crypto.js` — Handles all encryption, decryption, and key derivation logic.
- `idb.js` — Wrapper for **IndexedDB** operations.

### GLIMPSE 
<img width="523" height="318" alt="Screenshot 2025-09-11 134309" src="https://github.com/user-attachments/assets/0b5524da-8918-41ba-ad7e-963a792f6417" />


<img width="607" height="279" alt="Screenshot 2025-09-11 134321" src="https://github.com/user-attachments/assets/325d9467-ba8e-49b6-bea5-cdad25ae9d92" />


<img width="566" height="809" alt="Screenshot 2025-09-11 134338" src="https://github.com/user-attachments/assets/1fb82417-0f97-435b-8dd8-bf0d89ab988c" />
