// // // content.js

// // console.log("TinyVault content script loaded");

// // // Try to detect login form
// // const usernameField = document.querySelector("input[type='text'], input[type='email']");
// // const passwordField = document.querySelector("input[type='password']");

// // if (usernameField && passwordField) {
// //   console.log("Login form detected!");

// //   // Example auto-fill (hardcoded for now, later fetch from vault)
// //   chrome.storage.local.get(["autofillData"], (result) => {
// //     if (result.autofillData) {
// //       const { username, password } = result.autofillData;
// //       if (usernameField) usernameField.value = username;
// //       if (passwordField) passwordField.value = password;
// //       console.log("Auto-filled from TinyVault!");
// //     }
// //   });
// // }
// console.log("TinyVault content script loaded");

// // Message listener
// chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
//   if (msg && msg.action === 'fillCredentials' && msg.data) {
//     try {
//       const { username, password } = msg.data;
//       // Try known IDs first, then generic types
// const userEl = document.querySelector("#handle")           // Codeforces
//              || document.querySelector("#username")        // other common sites
//              || document.querySelector("input[type='text']")
//              || document.querySelector("input[type='email']");

// const passEl = document.querySelector("#password")        // common ID
//              || document.querySelector("input[type='password']");

// if (userEl) {
//   userEl.focus();
//   userEl.value = username;
//   ['input','change'].forEach(ev => userEl.dispatchEvent(new Event(ev, { bubbles: true })));
// }

// if (passEl) {
//   passEl.focus();
//   passEl.value = password;
//   ['input','change'].forEach(ev => passEl.dispatchEvent(new Event(ev, { bubbles: true })));
// }

      
//       // // Detect login fields
//       // const userEl = document.querySelector("input[type='text'], input[type='email']") || document.querySelector("#handle");
//       // const passEl = document.querySelector("input[type='password']");

//       // if (userEl) userEl.focus(), (userEl.value = username);
//       // if (passEl) passEl.focus(), (passEl.value = password);

//       // Dispatch input/change events so site detects change
//       const dispatchInput = el => {
//         if (!el) return;
//         el.dispatchEvent(new Event('input', { bubbles: true }));
//         el.dispatchEvent(new Event('change', { bubbles: true }));
//       };
//       dispatchInput(userEl);
//       dispatchInput(passEl);

//       console.log("Auto-filled from TinyVault!");
//       sendResponse({ status: "success" });
//     } catch (err) {
//       console.error("TinyVault autofill error:", err);
//       sendResponse({ status: "error", message: err.message });
//     }
//     return true; // indicate async response possible
//   }
// });
// content.js - TinyVault robust autofill

// content.js - TinyVault robust autofill
(function () {
  const origin = location.origin;
  const DEBUG = false;

  function log(...args) {
    if (DEBUG) console.debug('[TinyVault]', ...args);
  }

  // ------------------ Find username/password fields ------------------
  function findFields() {
    const pwAll = Array.from(document.querySelectorAll('input[type="password" i]'))
      .filter(isVisible)
      .filter(el => !el.disabled && !el.readOnly);

    if (pwAll.length === 0) return null;

    // Prefer password field inside a form with a submit button
    let pw = pwAll.find(cand => {
      const form = cand.closest('form');
      return form && form.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
    }) || pwAll[0];

    const scope = pw.closest('form') || document;
    const inputs = Array.from(scope.querySelectorAll('input'));

    let user = null;
    const userHints = ['user', 'email', 'login', 'id', 'mail', 'account', 'phone'];

    for (const el of inputs) {
      if (el === pw) continue;
      const t = (el.type || 'text').toLowerCase();
      const nm = (el.name || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      const pl = (el.placeholder || '').toLowerCase();
      const ac = (el.autocomplete || '').toLowerCase();

      if (['text', 'email', 'username'].includes(t)) user = user || el;
      if (['username', 'email'].includes(ac)) user = user || el;
      if (userHints.some(h => nm.includes(h) || id.includes(h) || pl.includes(h))) user = user || el;
    }

    log('findFields ->', { pw, user, scope });
    return { form: scope === document ? null : scope, user, pw };
  }

  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    const hidden = window.getComputedStyle(el).display === 'none' || window.getComputedStyle(el).visibility === 'hidden';
    return rect.width > 0 && rect.height > 0 && !hidden;
  }

  function setValue(el, value) {
    if (!el) return;
    const native = Object.getOwnPropertyDescriptor(el.__proto__, 'value');
    native?.set?.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ------------------ Track manual edits ------------------
  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t && t.tagName === 'INPUT') {
      t.dataset.tinyvaultEdited = '1';
    }
  }, true);

  // ------------------ Apply credential ------------------
  function applyCred(cred) {
    const fields = findFields();
    if (!fields || !fields.pw) return;
    const { user, pw } = fields;

    if (user && cred.username) {
      setValue(user, cred.username);
      user.dataset.tinyvaultApplied = '1';
    }

    setValue(pw, cred.password || '');
    pw.dataset.tinyvaultApplied = '1';
  }

  // ------------------ Fetch credentials from background ------------------
  async function fetchCreds() {
    try {
      return await chrome.runtime.sendMessage({ type: 'GET_CREDENTIALS_FOR_ORIGIN', origin });
    } catch {
      return null;
    }
  }

  // ------------------ Autofill logic ------------------
  async function maybeAutofill(showPicker = true) {
    const fields = findFields();
    if (!fields || !fields.pw) return;

    if ((fields.user && fields.user.dataset.tinyvaultEdited === '1') ||
        (fields.pw && fields.pw.dataset.tinyvaultEdited === '1')) {
      log('skip autofill due to user edits');
      return;
    }

    if (fields.pw.dataset.tinyvaultApplied === '1' && fields.pw.value) {
      log('skip autofill; already applied');
      return;
    }

    const resp = await fetchCreds();
    if (!resp || !resp.ok) return;

    const creds = resp.creds || [];
    if (creds.length === 0) return;

    if (creds.length === 1) {
      log('autofill single cred');
      applyCred(creds[0]);
    } else if (showPicker) {
      log('show picker with multiple creds');
      renderPicker(creds, fields.pw);
    }
  }

  // ------------------ Minimal credential picker ------------------
  function renderPicker(creds, target) {
    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.zIndex = '2147483647';
    const rect = target.getBoundingClientRect();
    host.style.left = Math.max(8, rect.left + window.scrollX) + 'px';
    host.style.top = (rect.bottom + window.scrollY + 6) + 'px';
    document.documentElement.appendChild(host);

    const root = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      .box { font: 12px ui-sans-serif, system-ui; color: #0a0a0a; background: #fff; border: 1px solid #e5e5e5; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
      @media (prefers-color-scheme: dark){ .box { color:#e5e5e5; background:#0a0a0a; border-color:#222; } }
      .row { display:flex; align-items:center; gap:6px; padding:6px 8px; cursor:pointer; }
      .row:hover { background: rgba(0,0,0,0.05); }
      @media (prefers-color-scheme: dark){ .row:hover { background: rgba(255,255,255,0.06); } }
      .small { opacity: 0.7; }
    `;

    const box = document.createElement('div');
    box.className = 'box';

    creds.slice(0, 6).forEach(c => {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<span>${escapeHtml(c.username || '(no username)')}</span> <span class="small">${escapeHtml((c.origins||[])[0]||'')}</span>`;
      row.addEventListener('click', () => {
        applyCred(c);
        cleanup();
      });
      box.appendChild(row);
    });

    root.append(style, box);

    function cleanup() {
      host.remove();
      document.removeEventListener('click', onDoc, true);
    }

    function onDoc(e) {
      if (!host.contains(e.target)) cleanup();
    }

    setTimeout(() => document.addEventListener('click', onDoc, true));
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', '\'':'&#39;' }[ch]));
  }

  // ------------------ Save hook ------------------
  function ensureSaveHook() {
    const lf = findFields();
    if (!lf || !lf.form) return;
    const { form, user, pw } = lf;
    if (!form.__tinyvault_hooked) {
      form.__tinyvault_hooked = true;
      form.addEventListener('submit', async () => {
        try {
          const username = user ? user.value : '';
          const password = pw ? pw.value : '';
          if (!password) return;
          const host = (() => { try { return new URL(location.href).host; } catch (_) { return location.host || origin; } })();
          const ok = window.confirm(`Save password for ${host}?`);
          if (!ok) return;
          const id = crypto.randomUUID();
          const credential = { id, origins: [origin], origin, username, password, notes: '' };
          await chrome.runtime.sendMessage({ type: 'SAVE_CREDENTIAL', credential });
        } catch (_) {}
      }, { capture: true });
    }
  }

  // ------------------ Triggers ------------------
  document.addEventListener('DOMContentLoaded', () => { maybeAutofill(true); ensureSaveHook(); });
  window.addEventListener('focus', () => { maybeAutofill(false); }, true);
  document.addEventListener('focusin', (e) => { if (e.target?.matches('input[type="password"]')) maybeAutofill(false); });

  const observer = new MutationObserver(() => { maybeAutofill(false); ensureSaveHook(); });
  observer.observe(document.documentElement, { subtree: true, childList: true });

  // initial
  maybeAutofill(true);
  ensureSaveHook();

  // ------------------ Message listener ------------------
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === 'APPLY_CREDENTIAL' && msg.cred) {
      applyCred(msg.cred);
      sendResponse({ ok: true });
    } else if (msg?.type === 'GET_CREDENTIALS_FOR_ORIGIN') {
      // optional: background may call content script
      sendResponse({ ok: true });
    }
    return true; // important for async responses
  });
})();
