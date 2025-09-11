# 🗝️ TinyVault — Secure Password Manager Web-App & Browser Extension

[![Tech Stack](https://img.shields.io/badge/Tech-JavaScript%2C%20HTML%2C%20CSS-blue)](https://developer.mozilla.org/) 
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

TinyVault is a secure password manager that allows users to safely store and retrieve passwords for websites and applications.  
All encryption happens locally within your browser extension, ensuring that even if the database is compromised, attackers only get encrypted data.

---

## 🌟 Features

- **Master Password & Key Derivation**
  - Users set a master password (**never stored anywhere**).  
  - A cryptographic key is derived from the master password using **PBKDF2**.  
  - This key encrypts/decrypts all stored credentials.

- **Local AES Encryption**
  - Uses **AES-256-GCM** for encryption and integrity verification.  
  - All credentials are stored **encrypted** in **IndexedDB** within the browser.

- **Password Generator**
  - Generates secure, random passwords with options for **length, symbols, and numbers**.  
  - Uses **`crypto.getRandomValues()`** in JavaScript for true cryptographic randomness.

- **Security Features**
  - **Auto-lock** after inactivity.  
  - **Manual lock** button for immediate security.

- **Optional Feature**
  - Auto-fill in browser: detects login forms and can auto-fill usernames/passwords for stored sites. *(Not included in current version)*  

---

## 🛠 Installation & Setup {#installation-setup .unnumbered}

## 1. Clone the Repository {#clone-the-repository .unnumbered}

``` {.bash language="bash"}
git clone <repository_url>
```

## 2. Load Extension in Browser {#load-extension-in-browser .unnumbered}

**Chrome:**

1.  Navigate to `chrome://extensions/`

2.  Enable Developer Mode

3.  Click **Load unpacked** → select the project folder

**Firefox:**

1.  Navigate to `about:debugging#/runtime/this-firefox`

2.  Click **Load Temporary Add-on** → select `manifest.json`

## 3. First-Time Setup {#first-time-setup .unnumbered}

1.  Click the TinyVault icon in the browser toolbar

2.  Set your **Master Password**

3.  Start adding and managing credentials

# 🧩 Architecture {#architecture .unnumbered}

<figure>

<figcaption>TinyVault Browser Extension Architecture</figcaption>
</figure>

## Components {#components .unnumbered}

-   **popup.js / popup.html**: Handles the vault UI and user
    interactions

-   **sw.js**: Maintains vault state and handles encryption/decryption
    requests

-   **crypto.js**: Performs AES-256-GCM encryption/decryption and key
    derivation

-   **IndexedDB**: Local storage for encrypted credentials

-   **Password Generator**: Generates strong random passwords

# 💻 Tech Stack {#tech-stack .unnumbered}

## Frontend (Browser Extension UI) {#frontend-browser-extension-ui .unnumbered}

-   Popup UI: Unlock vault, search, and add credentials

-   Options Page: Settings like theme or sync options

-   Content Script (optional): Detects login forms for auto-fill

-   Background Script / Service Worker: Maintains vault state, handles
    encryption requests

## Storage {#storage .unnumbered}

-   Local: IndexedDB for storing encrypted credentials

## Security {#security .unnumbered}

-   AES-256-GCM encryption

-   Key derivation using PBKDF2 / Argon2 / scrypt

-   Auto-lock and manual lock features

# 🚀 Usage {#usage .unnumbered}

1.  Unlock the vault with your **Master Password**

2.  Add new credentials: Website, Username, Password

3.  Generate strong passwords using the built-in Password Generator

4.  Use the Lock button to secure the vault immediately

# 🔒 Security & Best Practices {#security-best-practices .unnumbered}

-   **Local Encryption Only**: All sensitive data is encrypted locally;
    nothing leaves your browser

-   **AES-256-GCM**: Ensures confidentiality and integrity of
    credentials

-   **Key Derivation**: Your master password generates a strong
    cryptographic key

-   **Auto-lock**: Automatically locks the vault after inactivity to
    prevent unauthorized access

# 📂 File Structure {#file-structure .unnumbered}

    TinyVault/
    ├── manifest.json        # Browser extension configuration
    ├── popup.html           # Vault UI
    ├── popup.js             # UI logic
    ├── styles.css           # Styling for UI
    ├── content.js           # Detects login forms (optional)
    ├── sw.js                # Service worker for vault state
    ├── crypto.js            # Encryption and key derivation
    ├── idb.js               # IndexedDB wrapper
    ├── icons/               # Extension icons (16, 48, 128px)
    └── screenshots/         # Demo screenshots
