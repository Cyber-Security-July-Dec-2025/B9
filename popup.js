// const passwordInput = document.getElementById("passwordInput");
// const togglePasswordBtn = document.getElementById("togglePasswordBtn");
// let inactivityTimer;
// const AUTO_LOCK_TIME = 5*60 * 1000; // 5 minutes

// function getVaultDataFromIndexedDB() {
//   return new Promise((resolve, reject) => {
//     const request = indexedDB.open("TinyVaultDB", 1);

//     request.onerror = (event) => {
//       console.error("❌ IndexedDB error:", event);
//       reject(event);
//     };

//     request.onsuccess = (event) => {
//       const db = event.target.result;
//       const transaction = db.transaction("vault", "readonly");
//       const store = transaction.objectStore("vault");
//       const getAllRequest = store.getAll();

//       getAllRequest.onsuccess = () => {
//         resolve(getAllRequest.result || []);
//       };

//       getAllRequest.onerror = (event) => {
//         reject(event);
//       };
//     };
//   });
// }

// function resetInactivityTimer() {
//   clearTimeout(inactivityTimer);
//   inactivityTimer = setTimeout(lockVault, AUTO_LOCK_TIME);
// }

// function lockVault() {
//   alert("Vault auto-locked due to inactivity.");

//   // Completely reload popup → resets everything
//   location.reload();
// }

// // Attach listeners for activity
// ["click", "keypress", "mousemove"].forEach(evt => {
//   document.addEventListener(evt, resetInactivityTimer);
// });

// // Start timer once vault is unlocked
// function unlockVault() {
//   document.getElementById("unlockSection").style.display = "none";
//   document.getElementById("vaultSection").style.display = "block";
//   resetInactivityTimer();
// }


// togglePasswordBtn.addEventListener("click", () => {
//   if (passwordInput.type === "password") {
//     passwordInput.type = "text";
//     togglePasswordBtn.textContent = "🙈"; // change icon when visible
//   } else {
//     passwordInput.type = "password";
//     togglePasswordBtn.textContent = "👁️"; // back to eye icon
//   }
// });
// document.getElementById("manualLockBtn").addEventListener("click", () => {
//   lockVault(); // use the same function you already have
// });
// // popup.js
// document.addEventListener("DOMContentLoaded", async () => {
//   try {
//     let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//     if (!tab) {
//       console.error("❌ No active tab found (maybe missing permissions?)");
//       return;
//     }

//     if (!tab.url) {
//       console.error("❌ Active tab has no URL (chrome://, extensions, or blank tab)");
//       return;
//     }

//     let url = new URL(tab.url);
//     let domain = url.hostname;

//     console.log("🔎 Current site domain:", domain);
//     // document.getElementById("currentSite").innerText = "Current site: " + domain;
//   } catch (e) {
//     console.error("⚠️ Error detecting site:", e);
//   }
// });
// // Ensure this helper exists in scope: decryptText(encryptedObj, key)
// // and encryptionKey is set after unlocking.

// document.getElementById("autoFillBtn").addEventListener("click", async () => {
//   // Ensure vault unlocked and encryption key available
//   if (!encryptionKey) {
//     alert("Unlock the vault first (enter master password).");
//     return;
//   }

//   chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
//     if (!tabs || tabs.length === 0) {
//       alert("No active tab found.");
//       return;
//     }
//     const tab = tabs[0];

//     let currentHost = "";
//     try {
//       const url = new URL(tab.url);
//       currentHost = url.hostname.toLowerCase().replace(/^www\./, "");
//       console.log("🔍 Current tab URL:", tab.url);
//       console.log("🌐 Current hostname:", currentHost);
//     } catch (e) {
//       console.error("❌ Invalid URL:", tab.url, e);
//       alert("This page doesn't support autofill (invalid URL).");
//       return;
//     }

//     try {
//       const vaultData = await getVaultDataFromIndexedDB();
//       console.log("📂 Retrieved vaultData from IndexedDB:", vaultData);

//       const entry = vaultData.find(e => {
//         const normalizedSite = (e.site || "").toLowerCase()
//           .replace(/^https?:\/\//, "")
//           .replace(/^www\./, "");
//         console.log("➡️ Checking stored site:", normalizedSite, "against", currentHost);
//         return normalizedSite.includes(currentHost) || currentHost.includes(normalizedSite);
//       });

//       if (!entry) {
//         alert(`No saved credentials for ${currentHost}`);
//         return;
//       }

//       // Decrypt stored password (entry.encrypted expected)
//       if (!entry.encrypted) {
//         alert("Stored entry missing encrypted password.");
//         return;
//       }

//       let passwordPlain;
//       try {
//         passwordPlain = await decryptText(entry.encrypted, encryptionKey);
//       } catch (err) {
//         console.error("❌ Error decrypting stored password:", err);
//         alert("Failed to decrypt saved password. Did you unlock with the correct master password?");
//         return;
//       }

//       const payload = {
//         action: "fillCredentials",
//         data: { username: entry.username || "", password: passwordPlain }
//       };

//       // Helper to try sending message and handle missing receiver
//       const trySend = (resolve, reject, attemptInject = true) => {
//         chrome.tabs.sendMessage(tab.id, payload, async (response) => {
//           if (chrome.runtime.lastError) {
//             console.warn("sendMessage error:", chrome.runtime.lastError.message);

//             // If content script not present, try injecting it (MV3)
//             if (attemptInject && chrome.scripting) {
//               console.log("Attempting to inject content script and retry...");
//               try {
//                 await new Promise((res, rej) => {
//                   chrome.scripting.executeScript({
//                     target: { tabId: tab.id },
//                     files: ['content.js']
//                   }, () => {
//                     if (chrome.runtime.lastError) {
//                       console.error("Injection failed:", chrome.runtime.lastError.message);
//                       rej(chrome.runtime.lastError);
//                     } else res();
//                   });
//                 });
//                 // Retry once after injection
//                 trySend(resolve, reject, false);
//                 return;
//               } catch (injErr) {
//                 console.error("❌ Injection attempt failed:", injErr);
//                 alert("Could not inject content script into the page.");
//                 reject(injErr);
//                 return;
//               }
//             } else {
//               alert("Could not communicate with page (content script missing).");
//               reject(new Error(chrome.runtime.lastError.message));
//               return;
//             }
//           } else {
//             // Message delivered; check response
//             console.log("📩 Response from content.js:", response);
//             if (response && response.status === "success") {
//               alert(`Credentials for ${entry.site} auto-filled!`);
//               resolve(response);
//             } else {
//               alert("Could not fill credentials on this page.");
//               resolve(response);
//             }
//           }
//         });
//       };

//       await new Promise((resolve, reject) => trySend(resolve, reject, true));

//     } catch (err) {
//       console.error("❌ Failed to fetch vaultData or autofill:", err);
//       alert("Autofill failed. See console for details.");
//     }
//   });
// });


// // popup.js
// // document.getElementById("autoFillBtn").addEventListener("click", async () => {
// //   chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
// //     let currentHost = "";

// //     try {
// //       const url = new URL(tabs[0].url);
// //       currentHost = url.hostname.toLowerCase().replace(/^www\./, "");
// //       console.log("🔍 Current tab URL:", tabs[0].url);
// //       console.log("🌐 Current hostname:", currentHost);
// //     } catch (e) {
// //       console.error("❌ Invalid URL:", tabs[0].url, e);
// //       alert("This page doesn't support autofill (invalid URL).");
// //       return;
// //     }

// //     // ✅ Fetch vaultData from IndexedDB
// //     try {
// //       const vaultData = await getVaultDataFromIndexedDB();
// //       console.log("📂 Retrieved vaultData from IndexedDB:", vaultData);

// //       const entry = vaultData.find(e => {
// //         const normalizedSite = e.site.toLowerCase()
// //           .replace(/^https?:\/\//, "")
// //           .replace(/^www\./, "");
// //         console.log("➡️ Checking stored site:", normalizedSite, "against", currentHost);
// //         return normalizedSite.includes(currentHost) || currentHost.includes(normalizedSite);
// //       });

// //       if (entry) {
// //         console.log("✅ Match found:", entry);
// //         chrome.tabs.sendMessage(tabs[0].id, {
// //           action: "fillCredentials",
// //           data: { username: entry.username, password: entry.password }
// //         }, (response) => {
// //           console.log("📩 Response from content.js:", response);
// //           if (response?.status === "success") {
// //             alert(`Credentials for ${entry.site} auto-filled!`);
// //           } else {
// //             alert("Could not fill credentials on this page.");
// //           }
// //         });
// //       } else {
// //         console.warn("⚠️ No saved credentials found for:", currentHost);
// //         alert(`No saved credentials for ${currentHost}`);
// //       }

// //     } catch (err) {
// //       console.error("❌ Failed to fetch vaultData from IndexedDB:", err);
// //     }
// //   });
// // });




// let vaultData = [];
// let encryptionKey = null;

// document.addEventListener("DOMContentLoaded", init);

// async function init() {
//   const vaultStatus = document.getElementById("vaultStatus");
//   const passwordInput = document.getElementById("masterPasswordInput");
//   const unlockBtn = document.getElementById("unlockBtn");
//   const vaultSection = document.getElementById("vaultSection");
//   const generateBtn = document.getElementById("generatePasswordBtn");
//   const newPasswordInput = document.getElementById("passwordInput");

//   generateBtn.addEventListener("click", () => {
//     newPasswordInput.value = generatePassword(16, true, true, true);
//   });
//   const stored = await chrome.storage.local.get(["masterHash", "vault"]);
//   const hasMaster = !!stored.masterHash;

//   if (!hasMaster) {
//     vaultStatus.textContent = "Set a new Master Password:";
//     unlockBtn.textContent = "Set Password";
//   } else {
//     vaultStatus.textContent = "Enter Master Password to Unlock:";
//     unlockBtn.textContent = "Unlock Vault";
//   }

//   unlockBtn.addEventListener("click", async () => {
//     const password = passwordInput.value.trim();
//     if (!password) {
//       alert("Enter a password!");
//       return;
//     }


//     if (!hasMaster) {
//       // First-time setup
//       const hash = await hashMasterPassword(password);
//       await chrome.storage.local.set({ masterHash: hash, vault: [] });
//       alert("✅ Master password set! Use this password to unlock next time.");
//       location.reload();
//     } 
//     else {
//       // Unlock attempt
      
//       const hash = await hashMasterPassword(password);
//       if (hash === stored.masterHash) {
//         encryptionKey = await deriveKeyPBKDF2(password, getOrCreateSalt());
//         // vaultData = stored.vault || [];
//         vaultData = await loadVault();
//         vaultStatus.textContent = "Vault Unlocked ✅";
//         unlockBtn.disabled = true;
//         passwordInput.disabled = true;
//         showVaultUI();
//       } else {
//         alert("❌ Wrong password!");
//       }
//     }
//   });
// }


// function generatePassword(length = 16, useUpper = true, useNumbers = true, useSymbols = true) {
//   const lower = 'abcdefghijklmnopqrstuvwxyz';
//   const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
//   const numbers = '0123456789';
//   const symbols = '!@#$%^&*()_+[]{}|;:,.<>?';

//   let chars = lower;
//   if (useUpper) chars += upper;
//   if (useNumbers) chars += numbers;
//   if (useSymbols) chars += symbols;

//   const array = new Uint32Array(length);
//   window.crypto.getRandomValues(array);
//   return Array.from(array, x => chars[x % chars.length]).join('');
// }

// async function showVaultUI() {
//   vaultData = await loadVault();
//   const vaultSection = document.getElementById("vaultSection");
//   const saveBtn = document.getElementById("savePasswordBtn");
//   const list = document.getElementById("passwordList");

//   vaultSection.style.display = "block";
//   await renderVault(list, encryptionKey);

//   saveBtn.addEventListener("click", async () => {
//     const site = document.getElementById("siteInput").value.trim();
//     const username = document.getElementById("usernameInput").value.trim();
//     const password = document.getElementById("passwordInput").value.trim();

//     if (!site || !password) {
//       alert("Site and password required!");
//       return;
//     }

//     if (!encryptionKey) {
//   encryptionKey = await deriveKeyPBKDF2(password, getOrCreateSalt());
// }
// const encrypted = await encryptText(encryptionKey, password);

//     const newEntry = { site, username, encrypted };

//     vaultData.push(newEntry);
//     //await chrome.storage.local.set({ vault: vaultData });

//     await saveVault(vaultData);
//     await renderVault(list, encryptionKey);

//     // clear fields
//     document.getElementById("siteInput").value = "";
//     document.getElementById("usernameInput").value = "";
//     document.getElementById("passwordInput").value = "";
//   });
// }
// async function renderVault(list,key) {
//   list.innerHTML = "";
//   if (vaultData.length === 0) {
//     list.innerHTML = "<li>No saved credentials yet.</li>";
//     return;
//   }

//   for (const entry of vaultData) {
//     let password = "";
//     try {
//       // Decrypt the stored password using the derived encryptionKey
//       password = await decryptText( entry.encrypted,key);
//     } catch (err) {
//       password = "(error decrypting)";
//     }

//     const li = document.createElement("li");
//     li.textContent = `Site: ${entry.site} | User: ${entry.username || "(none)"} | Password: ${password}`;
//     list.appendChild(li);
//   }
// }

// // function renderVault(list) {
// //   list.innerHTML = "";
// //   if (vaultData.length === 0) {
// //     list.innerHTML = "<li>No saved credentials yet.</li>";
// //     return;
// //   }

// //   vaultData.forEach((entry, idx) => {
// //     const li = document.createElement("li");
// //     li.textContent = `Site: ${entry.site} | User: ${entry.username || "(none)"}`;
// //     list.appendChild(li);
// //   });
// // }

// // --- Helpers ---
// async function hashMasterPassword(password) {
//   const msgUint8 = new TextEncoder().encode(password);
//   const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
//   return Array.from(new Uint8Array(hashBuffer))
//     .map((b) => b.toString(16).padStart(2, "0"))
//     .join("");
// }

// function getOrCreateSalt() {
//   let saltB64 = localStorage.getItem("tiny_salt");
//   if (!saltB64) {
//     const saltArr = crypto.getRandomValues(new Uint8Array(16));
//     saltB64 = btoa(String.fromCharCode(...saltArr));
//     localStorage.setItem("tiny_salt", saltB64);
//   }
//   return Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0)).buffer;
// }
// popup.js - TinyVault
const passwordInput = document.getElementById("passwordInput");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");
let inactivityTimer;
const AUTO_LOCK_TIME = 5 * 60 * 1000; // 5 minutes

// ---------------- IndexedDB helper ----------------
function getVaultDataFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("TinyVaultDB", 1);

    request.onerror = (event) => reject(event);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction("vault", "readonly");
      const store = transaction.objectStore("vault");
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = (event) => reject(event);
    };
  });
}

// ---------------- Auto-lock ----------------
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(lockVault, AUTO_LOCK_TIME);
}

function lockVault() {
  alert("Vault auto-locked due to inactivity.");
  location.reload();
}

["click", "keypress", "mousemove"].forEach(evt => {
  document.addEventListener(evt, resetInactivityTimer);
});

// ---------------- Unlock vault ----------------
function unlockVault() {
  document.getElementById("unlockSection").style.display = "none";
  document.getElementById("vaultSection").style.display = "block";
  resetInactivityTimer();
}

// ---------------- Toggle password visibility ----------------
togglePasswordBtn.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePasswordBtn.textContent = "🙈";
  } else {
    passwordInput.type = "password";
    togglePasswordBtn.textContent = "👁️";
  }
});

document.getElementById("manualLockBtn").addEventListener("click", lockVault);

// ---------------- Autofill handler ----------------
document.getElementById("autoFillBtn").addEventListener("click", async () => {
  if (!encryptionKey) {
    alert("Unlock the vault first (enter master password).");
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return alert("No active tab found.");

  const url = new URL(tab.url);
  const currentHost = url.hostname.toLowerCase().replace(/^www\./, "");

  try {
    const vaultData = await getVaultDataFromIndexedDB();
    const entry = vaultData.find(e => {
      const normalizedSite = (e.site || "").toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "");
      return normalizedSite.includes(currentHost) || currentHost.includes(normalizedSite);
    });

    if (!entry) return alert(`No saved credentials for ${currentHost}`);

    // Decrypt password
    const passwordPlain = await decryptText(entry.encrypted, encryptionKey);

    const payload = {
      type: "APPLY_CREDENTIAL",
      cred: { username: entry.username || "", password: passwordPlain }
    };

    // Send message to content script
    const trySend = async (attemptInject = true) => {
      chrome.tabs.sendMessage(tab.id, payload, async (response) => {
        if (chrome.runtime.lastError) {
          if (attemptInject && chrome.scripting) {
            // Inject content.js if not present
            await new Promise((res, rej) => {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
              }, () => {
                if (chrome.runtime.lastError) rej(chrome.runtime.lastError);
                else res();
              });
            });
            // Retry after injection
            trySend(false);
          } else {
            alert("Could not communicate with page (content script missing).");
          }
        } else {
          alert(`Credentials for ${entry.site} auto-filled!`);
        }
      });
    };

    trySend();

  } catch (err) {
    console.error("Autofill failed:", err);
    alert("Autofill failed. See console for details.");
  }
});

// ---------------- Vault initialization ----------------
let vaultData = [];
let encryptionKey = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  const vaultStatus = document.getElementById("vaultStatus");
  const passwordInput = document.getElementById("masterPasswordInput");
  const unlockBtn = document.getElementById("unlockBtn");
  const generateBtn = document.getElementById("generatePasswordBtn");
  const newPasswordInput = document.getElementById("passwordInput");

  generateBtn.addEventListener("click", () => {
    newPasswordInput.value = generatePassword(16, true, true, true);
  });

  const stored = await chrome.storage.local.get(["masterHash", "vault"]);
  const hasMaster = !!stored.masterHash;

  vaultStatus.textContent = hasMaster
    ? "Enter Master Password to Unlock:"
    : "Set a new Master Password:";

  unlockBtn.textContent = hasMaster ? "Unlock Vault" : "Set Password";

  unlockBtn.addEventListener("click", async () => {
    const password = passwordInput.value.trim();
    if (!password) return alert("Enter a password!");

    if (!hasMaster) {
      const hash = await hashMasterPassword(password);
      await chrome.storage.local.set({ masterHash: hash, vault: [] });
      alert("✅ Master password set!");
      location.reload();
    } else {
      const hash = await hashMasterPassword(password);
      if (hash === stored.masterHash) {
        encryptionKey = await deriveKeyPBKDF2(password, getOrCreateSalt());
        vaultData = await loadVault();
        vaultStatus.textContent = "Vault Unlocked ✅";
        unlockBtn.disabled = true;
        passwordInput.disabled = true;
        showVaultUI();
      } else alert("❌ Wrong password!");
    }
  });
}

// ---------------- Vault rendering ----------------
async function showVaultUI() {
  vaultData = await loadVault();
  const vaultSection = document.getElementById("vaultSection");
  const saveBtn = document.getElementById("savePasswordBtn");
  const list = document.getElementById("passwordList");

  vaultSection.style.display = "block";
  await renderVault(list, encryptionKey);

  saveBtn.addEventListener("click", async () => {
    const site = document.getElementById("siteInput").value.trim();
    const username = document.getElementById("usernameInput").value.trim();
    const password = document.getElementById("passwordInput").value.trim();

    if (!site || !password) return alert("Site and password required!");
    const encrypted = await encryptText(encryptionKey, password);
    const newEntry = { site, username, encrypted };

    vaultData.push(newEntry);
    await saveVault(vaultData);
    await renderVault(list, encryptionKey);

    document.getElementById("siteInput").value = "";
    document.getElementById("usernameInput").value = "";
    document.getElementById("passwordInput").value = "";
  });
}

async function renderVault(list, key) {
  list.innerHTML = "";
  if (vaultData.length === 0) return list.innerHTML = "<li>No saved credentials yet.</li>";

  for (const entry of vaultData) {
    let password = "";
    try {
      password = await decryptText(entry.encrypted, key);
    } catch {
      password = "(error decrypting)";
    }
    const li = document.createElement("li");
    li.textContent = `Site: ${entry.site} | User: ${entry.username || "(none)"} | Password: ${password}`;
    list.appendChild(li);
  }
}
function generatePassword(length = 16, useUpper = true, useNumbers = true, useSymbols = true) {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+[]{}|;:,.<>?';

  let chars = lower;
  if (useUpper) chars += upper;
  if (useNumbers) chars += numbers;
  if (useSymbols) chars += symbols;

  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, x => chars[x % chars.length]).join('');
}

// ---------------- Utilities ----------------
async function hashMasterPassword(password) {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getOrCreateSalt() {
  let saltB64 = localStorage.getItem("tiny_salt");
  if (!saltB64) {
    const saltArr = crypto.getRandomValues(new Uint8Array(16));
    saltB64 = btoa(String.fromCharCode(...saltArr));
    localStorage.setItem("tiny_salt", saltB64);
  }
  return Uint8Array.from(atob(saltB64), c => c.charCodeAt(0)).buffer;
}
