import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import { auth } from "./firebase.js";

const provider = new GoogleAuthProvider();

/* ===========================================================
   NEW GEN — MAIN APPLICATION
   =========================================================== */
(() => {
  "use strict";

  const app = {
    currentPage: "home",
    pages: ["home", "personagem", "ficha", "loja", "creditos"],
    sectionOrder: ["home", "personagem", "ficha", "loja", "creditos"],
    auth: {
      user: null
    },
    state: {
      currentSlot: 0,
      currentCharacter: null
    },
    runtimeUser: null
  };

  const DOM = {
    landing: document.getElementById("landing"),
    appShell: document.getElementById("app"),
    sidebar: document.getElementById("sidebar"),
    mainNav: document.getElementById("mainNav"),
    content: document.querySelector(".content"),
    needle: document.getElementById("compassNeedle"),
    drawerToggle: document.getElementById("drawerToggle"),
    drawerOverlay: document.getElementById("drawerOverlay"),
    enterBtn: document.getElementById("enterWikiBtn"),
    pagesContainer: document.getElementById("pages-container"),
    loginBtn: document.getElementById("loginBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
    accountLabel: document.getElementById("accountLabel"),
    loginModal: document.getElementById("loginModal"),
    authUser: document.getElementById("authUser"),
    authEmail: document.getElementById("authEmail"),
    createAccountBtn: document.getElementById("createAccountBtn"),
    doLoginBtn: document.getElementById("doLoginBtn"),
    googleLoginBtn: document.getElementById("googleLoginBtn"),
    closeLoginModal: document.getElementById("closeLoginModal"),
    toastContainer: document.getElementById("toastContainer")
  };

  function angleFor(sectionId) {
    const i = app.sectionOrder.indexOf(sectionId);
    if (i < 0) return 0;
    return (360 / app.sectionOrder.length) * i;
  }

  function showPage(pageId) {
    if (!app.pages.includes(pageId)) return;
    app.currentPage = pageId;

    document.querySelectorAll(".section").forEach(s => {
      s.classList.toggle("active", s.id === pageId);
    });

    DOM.mainNav.querySelectorAll("a[data-section]").forEach(link => {
      link.classList.toggle("nav-active", link.getAttribute("data-section") === pageId);
    });

    if (DOM.needle) DOM.needle.style.transform = `rotate(${angleFor(pageId)}deg)`;

    closeDrawer();

    if (DOM.content) DOM.content.scrollTo({ top: 0, behavior: "smooth" });
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (pageId === "ficha") renderFichaPage();
  }

  function openDrawer() {
    DOM.sidebar.classList.add("is-open");
    DOM.drawerOverlay.classList.add("is-open");
    DOM.drawerToggle.setAttribute("aria-expanded", "true");
  }

  function closeDrawer() {
    DOM.sidebar.classList.remove("is-open");
    DOM.drawerOverlay.classList.remove("is-open");
    DOM.drawerToggle.setAttribute("aria-expanded", "false");
  }

  function toggleDrawer() {
    DOM.sidebar.classList.contains("is-open") ? closeDrawer() : openDrawer();
  }

  function enterWiki() {
    DOM.landing.classList.add("is-hidden");
    DOM.appShell.classList.add("is-visible");

    setTimeout(() => {
      DOM.landing.style.display = "none";
    }, 700);

    setTimeout(() => {
      showPage("home");
    }, 150);
  }

  function showToast(message, timeout = 2600) {
    if (!DOM.toastContainer) return;
    const el = document.createElement("div");
    el.style.background = "linear-gradient(90deg, rgba(155,107,240,.12), rgba(82,217,201,.06))";
    el.style.border = "1px solid rgba(155,107,240,.12)";
    el.style.color = "var(--ivory)";
    el.style.padding = "10px 14px";
    el.style.borderRadius = "10px";
    el.style.fontFamily = "var(--font-body)";
    el.style.fontSize = "13px";
    el.style.pointerEvents = "auto";
    el.textContent = message;
    DOM.toastContainer.appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity .25s";
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 300);
    }, timeout);
  }

  async function fetchText(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`Failed to load ${path}`);
    return await res.text();
  }

  async function loadPages() {
    const pageFiles = {
      personagem: "pages/personagem.html",
      ficha: "pages/ficha.html",
      loja: "pages/loja.html",
      creditos: "pages/creditos.html"
    };

    for (const [pageId, fileName] of Object.entries(pageFiles)) {
      try {
        const html = await fetchText(fileName);
        DOM.pagesContainer.insertAdjacentHTML("beforeend", html);
      } catch (error) {
        console.error(`Error loading ${fileName}:`, error);
        DOM.pagesContainer.insertAdjacentHTML(
          "beforeend",
          `<section id="${pageId}" class="section" data-page="${pageId}">
            <div class="empty-state">
              <h4>Página não disponível</h4>
              <p>Houve um erro ao carregar esta página.</p>
            </div>
          </section>`
        );
      }
    }

    try {
      const atributosHTML = await fetchText("pages/atributos.html");
      const parser = new DOMParser();
      const doc = parser.parseFromString(atributosHTML, "text/html");
      const atributosSection = doc.querySelector("#atributos");
      const personagemSection = document.querySelector("#personagem");

      if (atributosSection && personagemSection) {
        const tabsNav = personagemSection.querySelector(".tabs-nav");
        if (tabsNav && !tabsNav.querySelector('[data-tab="atributos"]')) {
          const btn = document.createElement("button");
          btn.className = "tab-btn";
          btn.setAttribute("data-tab", "atributos");
          btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/></svg><span>Atributos</span>`;
          tabsNav.insertBefore(btn, tabsNav.firstChild);
        }

        const tabContent = document.createElement("div");
        tabContent.className = "tab-content";
        tabContent.setAttribute("data-tab", "atributos");
        tabContent.innerHTML = atributosSection.innerHTML;
        const firstTabContent = personagemSection.querySelector(".tab-content");
        if (firstTabContent) personagemSection.insertBefore(tabContent, firstTabContent);
      }
    } catch (err) {
      console.error("Failed to integrate atributos:", err);
    }

    try {
      const sistemasHTML = await fetchText("pages/sistemas.html");
      const parser2 = new DOMParser();
      const doc2 = parser2.parseFromString(sistemasHTML, "text/html");
      const hakiContent = doc2.querySelector('.tab-content[data-tab="haki"]');
      const akumaContent = doc2.querySelector('.tab-content[data-tab="akuma"]');
      const personagemSection = document.querySelector("#personagem");

      if (personagemSection) {
        const tabsNav = personagemSection.querySelector(".tabs-nav");
        if (tabsNav) {
          if (!tabsNav.querySelector('[data-tab="haki"]')) {
            const btn = document.createElement("button");
            btn.className = "tab-btn";
            btn.setAttribute("data-tab", "haki");
            btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg><span>Haki</span>`;
            tabsNav.appendChild(btn);
          }
          if (!tabsNav.querySelector('[data-tab="akuma"]')) {
            const btn = document.createElement("button");
            btn.className = "tab-btn";
            btn.setAttribute("data-tab", "akuma");
            btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 3c4 2 7 6 7 10a7 7 0 01-14 0c0-4 3-8 7-10z"/></svg><span>Akuma no Mi</span>`;
            tabsNav.appendChild(btn);
          }
        }

        if (hakiContent) {
          const clone = hakiContent.cloneNode(true);
          clone.classList.add("tab-content");
          clone.setAttribute("data-tab", "haki");
          personagemSection.appendChild(clone);
        }

        if (akumaContent) {
          const clone2 = akumaContent.cloneNode(true);
          clone2.classList.add("tab-content");
          clone2.setAttribute("data-tab", "akuma");
          personagemSection.appendChild(clone2);
        }
      }
    } catch (err) {
      console.error("Failed to integrate sistemas:", err);
    }
  }

  function setupNavigation() {
    DOM.mainNav.addEventListener("click", e => {
      const link = e.target.closest("a[data-section]");
      if (link) showPage(link.getAttribute("data-section"));
    });

    document.addEventListener("click", e => {
      const goto = e.target.closest("[data-goto]");
      if (goto) showPage(goto.getAttribute("data-goto"));
    });
  }

  function setupDrawer() {
    DOM.drawerToggle?.addEventListener("click", toggleDrawer);
    DOM.drawerOverlay?.addEventListener("click", closeDrawer);

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closeDrawer();
    });
  }

  function setupTabs() {
    document.addEventListener("click", e => {
      const tabBtn = e.target.closest(".tab-btn");
      if (!tabBtn) return;

      const tabName = tabBtn.getAttribute("data-tab");
      const tabsNav = tabBtn.closest(".tabs-nav");
      const tabsContainer = tabsNav?.closest(".section");
      if (!tabsContainer) return;

      tabsNav.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
      });

      tabsContainer.querySelectorAll(".tab-content").forEach(content => {
        content.classList.toggle("active", content.getAttribute("data-tab") === tabName);
      });
    });
  }

  function openLoginModal() {
    if (!DOM.loginModal) return;
    DOM.loginModal.style.display = "flex";
    setTimeout(() => DOM.authUser?.focus(), 120);
  }

  function closeLoginModal() {
    if (!DOM.loginModal) return;
    DOM.loginModal.style.display = "none";
  }

  function loadUserData() {
    if (!app.auth.user) return;

    const key = `newgen_user_${app.auth.user.uid || app.auth.user.username}`;
    const raw = localStorage.getItem(key);

    if (raw) {
      const user = JSON.parse(raw);
      user.characters = user.characters || [];
      while (user.characters.length < 5) user.characters.push(null);
      app.runtimeUser = user;
      return;
    }

    app.runtimeUser = {
      username: app.auth.user.displayName || app.auth.user.username || "Jogador",
      email: app.auth.user.email || "",
      uid: app.auth.user.uid || "",
      photoURL: app.auth.user.photoURL || "",
      createdAt: new Date().toISOString(),
      characters: [null, null, null, null, null]
    };

    localStorage.setItem(key, JSON.stringify(app.runtimeUser));
  }

  function updateAccountUI() {
    if (app.auth.user) {
      DOM.accountLabel.textContent = app.auth.user.displayName || app.auth.user.username || "Jogador";
      DOM.loginBtn.style.display = "none";
      DOM.logoutBtn.style.display = "inline-block";
    } else {
      DOM.accountLabel.textContent = "Convidado";
      DOM.loginBtn.style.display = "inline-block";
      DOM.logoutBtn.style.display = "none";
    }
  }

  async function createAccount(username, email = "") {
    if (!username) return showToast("Digite um nome de usuário.");
    const key = `newgen_user_${username}`;

    if (localStorage.getItem(key)) {
      showToast("Usuário já existe. Faça login.");
      return;
    }

    const user = { username, email, createdAt: new Date().toISOString(), characters: [] };
    localStorage.setItem(key, JSON.stringify(user));
    showToast(`Conta criada: ${username}`);
    closeLoginModal();
    app.auth.user = { ...user, uid: username, displayName: username, photoURL: "" };
    loadUserData();
    updateAccountUI();
    await sendToSheets("saveUser", user).catch(err => console.error(err));
  }

  function doLogin(username) {
    if (!username) return showToast("Digite um nome de usuário.");
    const key = `newgen_user_${username}`;
    const raw = localStorage.getItem(key);

    if (!raw) {
      showToast("Conta não encontrada. Crie uma conta primeiro.");
      return;
    }

    const user = JSON.parse(raw);
    app.auth.user = {
      uid: user.uid || username,
      displayName: user.username,
      email: user.email || "",
      photoURL: user.photoURL || ""
    };

    showToast(`Bem-vindo, ${user.username}`);
    closeLoginModal();
    loadUserData();
    updateAccountUI();
  }

  async function loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      app.auth.user = {
        uid: user.uid,
        displayName: user.displayName || "Jogador",
        email: user.email || "",
        photoURL: user.photoURL || ""
      };

      loadUserData();
      updateAccountUI();
      closeLoginModal();
      showToast("Login realizado com sucesso.");

      await sendToSheets("saveUser", {
        username: user.displayName || "Jogador",
        email: user.email || "",
        uid: user.uid,
        photoURL: user.photoURL || "",
        createdAt: new Date().toISOString(),
        characters: []
      }).catch(err => console.error(err));
    } catch (error) {
      console.error(error);
      showToast("Não foi possível entrar com Google.");
    }
  }

  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
    app.auth.user = null;
    app.runtimeUser = null;
    app.state.currentCharacter = null;
    app.state.currentSlot = 0;
    updateAccountUI();
    showToast("Desconectado.");
    if (app.currentPage === "ficha") renderFichaPage();
  }

  function saveUserDataToLocal() {
    if (!app.auth.user || !app.runtimeUser) return;
    const key = `newgen_user_${app.auth.user.uid || app.auth.user.username}`;
    localStorage.setItem(key, JSON.stringify(app.runtimeUser));
    showToast("Ficha salva localmente.");
  }

  function getCurrentCharacter() {
    if (!app.auth.user) return null;
    const slot = app.state.currentSlot || 0;
    app.runtimeUser.characters = app.runtimeUser.characters || [null, null, null, null, null];
    let char = app.runtimeUser.characters[slot];

    if (!char) {
      char = {
        id: `char-${Date.now()}`,
        name: `Personagem ${slot + 1}`,
        image: "",
        race: null,
        classe: null,
        linhagem: null,
        estilo: null,
        haki: null,
        akuma: null,
        atributos: { Vitalidade: 0, Força: 0, Velocidade: 0, Resistência: 0 },
        locked: { race: false, linhagem: false },
        createdAt: new Date().toISOString()
      };
      app.runtimeUser.characters[slot] = char;
      saveUserDataToLocal();
    }

    return char;
  }

  function selectOption(type, value) {
    if (!app.auth.user) {
      showToast("Faça login para criar e salvar seu personagem.");
      return;
    }

    const char = getCurrentCharacter();
    if (!char) return;

    if ((type === "race" || type === "linhagem") && char.locked[type]) {
      showToast(`${type === "race" ? "Raça" : "Linhagem"} já definida e permanente para este personagem.`);
      return;
    }

    const map = {
      racas: "race",
      classes: "classe",
      estilos: "estilo",
      treinamento: "treinamento",
      linhagem: "linhagem",
      raça: "race",
      raça_pt: "race"
    };

    const key = map[type] || type;

    if (key === "race" || key === "linhagem") {
      char.locked[key] = true;
    }

    if (!char.id) char.id = `char-${Date.now()}`;

    saveUserDataToLocal();
    showToast(`${humanizeKey(key)} selecionado: ${value} ✓`);

    if (app.currentPage === "ficha") renderFichaPage();
  }

  function humanizeKey(k) {
    const names = {
      race: "Raça",
      classe: "Classe",
      estilo: "Estilo",
      linhagem: "Linhagem",
      haki: "Haki",
      akuma: "Akuma no Mi"
    };
    return names[k] || k;
  }

  function renderFichaPage() {
    const fichaRoot = document.getElementById("ficha-root");
    if (!fichaRoot) return;
    fichaRoot.innerHTML = "";

    if (!app.auth.user) {
      fichaRoot.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24"><path d="M12 3c4 2 7 6 7 10a7 7 0 01-14 0c0-4 3-8 7-10z"/></svg>
          <h4>Faça login para criar e salvar sua ficha</h4>
          <p>Você pode visualizar as informações, mas precisa entrar para criar e gerenciar personagens.</p>
        </div>
      `;
      return;
    }

    loadUserData();

    const slotsWrap = document.createElement("div");
    slotsWrap.style.display = "grid";
    slotsWrap.style.gridTemplateColumns = "repeat(auto-fit,minmax(220px,1fr))";
    slotsWrap.style.gap = "12px";

    for (let i = 0; i < 5; i++) {
      const slot = app.runtimeUser.characters[i] || null;
      const card = document.createElement("div");
      card.className = "attr-card";
      const isActive = app.state.currentSlot === i;
      card.style.border = isActive ? "2px solid var(--violet)" : "";

      let inner = "";
      if (!slot) {
        inner = `<h3>Vago — Personagem ${i + 1}</h3>
                 <p>Slot disponível. Clique em Editar para começar.</p>
                 <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">
                   <button data-slot="${i}" class="btn-edit">Criar</button>
                 </div>`;
      } else {
        inner = `<h3>${slot.name}</h3>
                 <p style="color:var(--lavender);font-size:13px;margin-top:6px;">ID: ${slot.id}</p>
                 <p style="margin-top:8px;color:var(--lavender);font-size:13px;">Raça: ${slot.race || "-"}</p>
                 <p style="margin-top:2px;color:var(--lavender);font-size:13px;">Classe: ${slot.classe || "-"}</p>
                 <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">
                   <button data-slot="${i}" class="btn-edit">Editar</button>
                   <button data-slot="${i}" class="btn-copy">Copiar ficha</button>
                   <button data-slot="${i}" class="btn-delete">Excluir</button>
                 </div>`;
      }

      card.innerHTML = inner;
      slotsWrap.appendChild(card);
    }

    fichaRoot.appendChild(slotsWrap);

    fichaRoot.querySelectorAll(".btn-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const slotIndex = parseInt(btn.getAttribute("data-slot"), 10);
        app.state.currentSlot = slotIndex;
        if (!app.runtimeUser.characters[slotIndex]) {
          app.runtimeUser.characters[slotIndex] = null;
          saveUserDataToLocal();
        }
        showPage("personagem");
        showToast("Abra a aba Personagem e escolha as opções para montar sua ficha.");
      });
    });

    fichaRoot.querySelectorAll(".btn-copy").forEach(btn => {
      btn.addEventListener("click", async () => {
        const slotIndex = parseInt(btn.getAttribute("data-slot"), 10);
        const char = app.runtimeUser.characters[slotIndex];
        if (!char) return showToast("Slot vazio.");
        const text = mountFichaText(char);
        try {
          await navigator.clipboard.writeText(text);
          showToast("Ficha copiada para área de transferência.");
        } catch (err) {
          console.error("Clipboard failed", err);
          showToast("Não foi possível copiar automaticamente. Selecione e copie manualmente.");
        }
      });
    });

    fichaRoot.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const slotIndex = parseInt(btn.getAttribute("data-slot"), 10);
        if (!confirm("Excluir este personagem? Esta ação é irreversível.")) return;
        app.runtimeUser.characters[slotIndex] = null;
        saveUserDataToLocal();
        renderFichaPage();
      });
    });
  }

  function mountFichaText(char) {
    return [
      `Nome: ${char.name || ""}`,
      `ID: ${char.id || ""}`,
      `Raça: ${char.race || ""}`,
      `Classe: ${char.classe || ""}`,
      `Linhagem: ${char.linhagem || ""}`,
      `Estilo: ${char.estilo || ""}`,
      `Haki: ${char.haki || ""}`,
      `Akuma no Mi: ${char.akuma || ""}`,
      `Atributos:`,
      `  Vitalidade: ${char.atributos?.Vitalidade || 0}`,
      `  Força: ${char.atributos?.Força || 0}`,
      `  Velocidade: ${char.atributos?.Velocidade || 0}`,
      `  Resistência: ${char.atributos?.Resistência || 0}`
    ].join("\n");
  }

  function setupCharacterInteractions() {
    document.addEventListener("click", e => {
      const card = e.target.closest(".race-card, .attr-card, .home-card, .haki-card");
      if (!card) return;

      const tab = card.closest(".tab-content")?.getAttribute("data-tab") || null;
      const section = card.closest(".section")?.id || null;
      if (section !== "personagem") return;

      let selectType = null;
      if (tab === "racas" || card.closest(".race-grid")) selectType = "race";
      if (tab === "classes") selectType = "classe";
      if (tab === "estilos") selectType = "estilo";
      if (tab === "treinamento") selectType = "treinamento";
      if (tab === "haki") selectType = "haki";
      if (tab === "akuma") selectType = "akuma";

      if (!selectType) return;

      const h3 = card.querySelector("h3");
      const value = h3 ? h3.textContent.trim() : (card.getAttribute("data-value") || card.textContent.trim().slice(0, 40));

      const isPremium = !!card.querySelector(".premium-list");
      if (isPremium && !app.auth.user) {
        showToast("Faça login para conhecer os produtos premium.");
        return;
      }

      if ((selectType === "race" || selectType === "linhagem") && app.auth.user) {
        const char = getCurrentCharacter();
        if (char && char.locked && char.locked[selectType]) {
          showToast(`${selectType === "race" ? "Raça" : "Linhagem"} é permanente e não pode ser alterada.`);
          return;
        }
      }

      selectOption(selectType, value);
    });
  }

  async function sendToSheets(action, payload) {
    const endpoint = "https://script.google.com/macros/s/AKfycbxB8s3iCeaH2wmk4dgh7dDjYuMvHGwKTjSziDiJ6-vaJT42Z6A-cGsw4RvDKXDgi3PW/exec";
    const resposta = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain"
      },
      body: JSON.stringify({
        action,
        usuario: payload
      })
    });
    return await resposta.json();
  }

  function setupAuth() {
    document.getElementById("loginBtn")?.addEventListener("click", openLoginModal);
    document.getElementById("closeLoginModal")?.addEventListener("click", closeLoginModal);
    document.getElementById("createAccountBtn")?.addEventListener("click", () => {
      createAccount(DOM.authUser.value?.trim(), DOM.authEmail.value?.trim());
    });
    document.getElementById("doLoginBtn")?.addEventListener("click", () => {
      doLogin(DOM.authUser.value?.trim());
    });
    document.getElementById("googleLoginBtn")?.addEventListener("click", loginWithGoogle);
    document.getElementById("logoutBtn")?.addEventListener("click", logout);

    onAuthStateChanged(auth, user => {
      if (user) {
        app.auth.user = {
          uid: user.uid,
          displayName: user.displayName || "Jogador",
          email: user.email || "",
          photoURL: user.photoURL || ""
        };
        loadUserData();
      } else {
        app.auth.user = null;
        app.runtimeUser = null;
        app.state.currentCharacter = null;
        app.state.currentSlot = 0;
      }

      updateAccountUI();
      if (app.currentPage === "ficha") renderFichaPage();
    });
  }

  async function init() {
    try {
      await loadPages();
      setupNavigation();
      setupDrawer();
      setupTabs();
      setupCharacterInteractions();
      setupAuth();

      DOM.enterBtn?.addEventListener("click", enterWiki);

      updateAccountUI();

      if (!document.getElementById("ficha-root")) {
        const fichaSection = document.querySelector("#ficha");
        if (fichaSection) {
          const root = document.createElement("div");
          root.id = "ficha-root";
          fichaSection.appendChild(root);
        }
      }
    } catch (error) {
      console.error("Failed to initialize app:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();