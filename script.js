/* ==========================================================================
   Worker TSA — Script partagé
   Page connexion / création de compte
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.dauth-form');
  const heading = document.getElementById('authHeading');
  const subheading = document.getElementById('authSubheading');
  const switchText = document.getElementById('switchText');
  const switchBtn = document.getElementById('switchBtn');

  let currentAuthMode = 'login';

  function activate(mode) {
    currentAuthMode = mode;
    tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.tab === mode));
    forms.forEach(form => form.classList.toggle('is-active', form.dataset.form === mode));

    if (heading && subheading && switchText && switchBtn) {
      const lang = wtsaGetLang();
      const otherMode = mode === 'login' ? 'signup' : 'login';
      heading.textContent = translations['auth' + capitalize(mode) + 'Heading'][lang];
      subheading.textContent = translations['auth' + capitalize(mode) + 'Subheading'][lang];
      switchText.textContent = translations['switchText' + capitalize(mode)][lang];
      switchBtn.textContent = translations['switchBtn' + capitalize(mode)][lang];
      switchBtn.dataset.switchTo = otherMode;
    }
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Permet à i18n.js de redemander l'affichage des textes dynamiques
  // (heading/subheading/switch) quand la langue change.
  window.wtsaRefreshAuthCopy = function (lang) {
    if (heading) activate(currentAuthMode);
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activate(tab.dataset.tab));
  });

  // Synchronise les textes dynamiques avec la langue déjà choisie par l'utilisateur.
  if (typeof wtsaGetLang === 'function') {
    activate('login');
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-switch-to]');
    if (trigger) {
      activate(trigger.dataset.switchTo);
    }
  });

  function showError(field, message) {
    field.classList.add('has-error');
    const errorEl = field.querySelector('.field-error');
    if (errorEl) errorEl.textContent = message;
  }

  function clearError(field) {
    field.classList.remove('has-error');
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  // Domaines : on enregistre toujours le nom FRANÇAIS (valeur fixe), quelle que soit
  // la langue affichée, pour que prestataires et clients se retrouvent.
  function wtsaDomainFromCard(card) {
    const nameEl = card.querySelector('.service-name');
    const key = nameEl.getAttribute('data-i18n');
    return (key && translations[key] && translations[key].fr) || nameEl.textContent.trim();
  }
  function wtsaDomainEntry(domain) {
    return Object.values(translations).find(t => t.fr === domain || t.en === domain) || null;
  }
  function wtsaDomainVariants(domain) {
    const entry = wtsaDomainEntry(domain);
    return entry ? Array.from(new Set([entry.fr, entry.en])) : [domain];
  }
  function wtsaDomainLabel(domain) {
    const entry = wtsaDomainEntry(domain);
    const lang = typeof wtsaGetLang === 'function' ? wtsaGetLang() : 'fr';
    return entry ? entry[lang] : domain;
  }

  // Silhouettes Homme / Femme (widgets intégrés, pas de photo personnelle).
  function wtsaGenderAvatar(gender) {
    if (gender === 'femme') {
      return '<svg viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path opacity=".55" d="M19 27c0-10 5-18 13-18s13 8 13 18v15c0 2-2 3-4 2l-2-1V33H25v11l-2 1c-2 1-4 0-4-2z"/><circle cx="32" cy="24" r="9.5"/><path d="M11 58c0-12 9-19 21-19s21 7 21 19z"/></svg>';
    }
    return '<svg viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="32" cy="23" r="10"/><path d="M11 58c0-12 9-19 21-19s21 7 21 19z"/></svg>';
  }

  function translateFirebaseError(err) {
    const code = err && err.code;
    switch (code) {
      case 'auth/email-already-in-use': return 'Cette adresse e-mail est déjà utilisée.';
      case 'auth/invalid-email': return 'Adresse e-mail invalide.';
      case 'auth/weak-password': return 'Mot de passe trop faible (6 caractères minimum).';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential': return 'E-mail ou mot de passe incorrect.';
      case 'auth/too-many-requests': return 'Trop de tentatives. Réessayez dans quelques minutes.';
      default: return 'Une erreur est survenue. Réessayez.';
    }
  }

  // --- Mot de passe oublié : envoie une requête par e-mail à l'admin ---
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (event) => {
      event.preventDefault();
      const emailInput = document.getElementById('loginEmail');
      const userEmail = emailInput && emailInput.value.trim() ? emailInput.value.trim() : 'non renseigné';
      const subject = encodeURIComponent('Mot de passe oublié — Worker TSA');
      const body = encodeURIComponent(`Bonjour,\n\nJ'ai oublié ou perdu mon mot de passe Worker TSA.\nMon adresse e-mail de compte : ${userEmail}\n\nMerci de m'aider à le réinitialiser.`);
      window.location.href = `mailto:workertsa001@protonmail.com?subject=${subject}&body=${body}`;
    });
  }

  // --- Formulaire de connexion ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      let valid = true;

      const emailField = document.getElementById('loginEmailField');
      const emailInput = document.getElementById('loginEmail');
      clearError(emailField);
      if (!isValidEmail(emailInput.value.trim())) {
        showError(emailField, 'Entrez une adresse e-mail valide.');
        valid = false;
      }

      const passwordField = document.getElementById('loginPasswordField');
      const passwordInput = document.getElementById('loginPassword');
      clearError(passwordField);
      if (passwordInput.value.length < 6) {
        showError(passwordField, 'Le mot de passe doit contenir au moins 6 caractères.');
        valid = false;
      }

      if (!valid) return;

      if (!window.wtsaFirebase) {
        showError(passwordField, 'Service momentanément indisponible. Réessayez.');
        return;
      }

      const submitBtn = loginForm.querySelector('.btn-pill-primary');
      if (submitBtn) submitBtn.disabled = true;

      const { auth, signInWithEmailAndPassword, db, doc, getDoc } = window.wtsaFirebase;

      try {
        const credential = await signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);

        if (credential.user.email === window.WTSA_ADMIN_EMAIL) {
          window.location.href = 'console-admin.html';
          return;
        }

        const userSnap = await getDoc(doc(db, 'users', credential.user.uid));
        if (userSnap.exists() && userSnap.data().role) {
          localStorage.setItem('wtsaRole', userSnap.data().role);
          window.location.href = 'services.html';
        } else {
          window.location.href = 'choix-profil.html';
        }
      } catch (err) {
        showError(passwordField, translateFirebaseError(err));
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // --- Formulaire de création de compte ---
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      let valid = true;

      const nameField = document.getElementById('signupNameField');
      const nameInput = document.getElementById('signupName');
      clearError(nameField);
      if (nameInput.value.trim().length < 2) {
        showError(nameField, 'Entrez votre nom complet.');
        valid = false;
      }

      const emailField = document.getElementById('signupEmailField');
      const emailInput = document.getElementById('signupEmail');
      clearError(emailField);
      if (!isValidEmail(emailInput.value.trim())) {
        showError(emailField, 'Entrez une adresse e-mail valide.');
        valid = false;
      }

      const passwordField = document.getElementById('signupPasswordField');
      const passwordInput = document.getElementById('signupPassword');
      clearError(passwordField);
      if (passwordInput.value.length < 6) {
        showError(passwordField, 'Le mot de passe doit contenir au moins 6 caractères.');
        valid = false;
      }

      const confirmField = document.getElementById('signupConfirmField');
      const confirmInput = document.getElementById('signupConfirm');
      clearError(confirmField);
      if (confirmInput.value !== passwordInput.value || confirmInput.value === '') {
        showError(confirmField, 'Les mots de passe ne correspondent pas.');
        valid = false;
      }

      const termsInput = document.getElementById('signupTerms');
      if (!termsInput.checked) {
        valid = false;
        termsInput.focus();
      }

      if (!valid) return;

      if (!window.wtsaFirebase) {
        showError(emailField, 'Service momentanément indisponible. Réessayez.');
        return;
      }

      const submitBtn = signupForm.querySelector('.btn-pill-primary');
      if (submitBtn) submitBtn.disabled = true;

      const { auth, createUserWithEmailAndPassword, updateProfile, db, doc, setDoc } = window.wtsaFirebase;

      try {
        const credential = await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
        await updateProfile(credential.user, { displayName: nameInput.value.trim() });
        await setDoc(doc(db, 'users', credential.user.uid), {
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          createdAt: new Date().toISOString()
        });
        window.location.href = 'choix-profil.html';
      } catch (err) {
        showError(emailField, translateFirebaseError(err));
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // --- Page choix de profil (client / prestataire) ---
  const roleOptions = document.getElementById('roleOptions');
  const roleContinue = document.getElementById('roleContinue');

  if (roleOptions && roleContinue) {
    let selectedRole = null;

    // Le rôle (client ou prestataire) est définitif : si l'utilisateur en a déjà
    // un, il est renvoyé directement vers l'application, même en revenant en arrière.
    function redirectIfRoleLocked() {
      if (!window.wtsaFirebase) return;
      const { auth, db, doc, getDoc, onAuthStateChanged } = window.wtsaFirebase;
      onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists() && snap.data().role) {
            localStorage.setItem('wtsaRole', snap.data().role);
            window.location.replace('services.html');
          }
        } catch (err) {
          console.error('Erreur lors de la vérification du rôle :', err);
        }
      });
    }
    redirectIfRoleLocked();
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) window.location.reload();
    });

    roleOptions.querySelectorAll('.role-card').forEach(card => {
      card.addEventListener('click', () => {
        roleOptions.querySelectorAll('.role-card').forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        selectedRole = card.dataset.role;
        roleContinue.disabled = false;
      });
    });

    roleContinue.addEventListener('click', async () => {
      if (!selectedRole) return;
      roleContinue.disabled = true;

      let finalRole = selectedRole;

      if (window.wtsaFirebase && window.wtsaFirebase.auth.currentUser) {
        const { db, doc, getDoc, setDoc, auth } = window.wtsaFirebase;
        try {
          const ref = doc(db, 'users', auth.currentUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists() && snap.data().role) {
            // Rôle déjà choisi : on ne le change jamais.
            finalRole = snap.data().role;
          } else {
            await setDoc(ref, { role: selectedRole }, { merge: true });
          }
        } catch (err) {
          console.error('Erreur lors de l\'enregistrement du rôle :', err);
        }
      }

      localStorage.setItem('wtsaRole', finalRole);
      // Client : accès direct à l'application, sans profil à remplir.
      // Prestataire : choix du domaine, puis profil.
      window.location.replace('services.html');
    });
  }

  // --- Affichage / masquage du mot de passe (icône œil) ---
  document.querySelectorAll('.pill-eye').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      target.type = target.type === 'password' ? 'text' : 'password';
    });
  });

  // --- Page liste des services (mode client = navigation libre, mode prestataire = sélection unique) ---
  const servicesGrid = document.querySelector('.services-grid');
  if (servicesGrid) {
    const userRole = localStorage.getItem('wtsaRole');
    const isProviderMode = userRole === 'prestataire';
    const continueWrap = document.getElementById('servicesContinueWrap');
    const continueBtn = document.getElementById('servicesContinue');

    // Filtre de recherche en direct (insensible aux accents et à la casse).
    const servicesSearchInput = document.querySelector('.services-search input');
    if (servicesSearchInput) {
      const normalize = (str) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      servicesSearchInput.addEventListener('input', () => {
        const term = normalize(servicesSearchInput.value);
        servicesGrid.querySelectorAll('.service-card').forEach(card => {
          const name = normalize(card.querySelector('.service-name').textContent);
          card.style.display = name.includes(term) ? '' : 'none';
        });
      });
    }

    if (isProviderMode) {
      const headingEl = document.querySelector('[data-i18n="servicesHeadline"]');
      const subtextEl = document.querySelector('[data-i18n="servicesSubtext"]');
      if (headingEl) headingEl.setAttribute('data-i18n', 'servicesHeadlineProvider');
      if (subtextEl) subtextEl.setAttribute('data-i18n', 'servicesSubtextProvider');
      if (typeof wtsaApplyLang === 'function') wtsaApplyLang(wtsaGetLang());
      if (continueWrap) continueWrap.classList.add('is-visible');

      let selectedDomain = null;

      servicesGrid.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', () => {
          servicesGrid.querySelectorAll('.service-card').forEach(c => c.classList.remove('is-selected'));
          card.classList.add('is-selected');
          selectedDomain = wtsaDomainFromCard(card);
          if (continueBtn) continueBtn.disabled = false;
        });
      });

      if (continueBtn) {
        continueBtn.addEventListener('click', async () => {
          if (!selectedDomain) return;
          localStorage.setItem('wtsaDomain', selectedDomain);

          if (window.wtsaFirebase && window.wtsaFirebase.auth.currentUser) {
            const { db, doc, setDoc, auth } = window.wtsaFirebase;
            try {
              await setDoc(doc(db, 'users', auth.currentUser.uid), { domain: selectedDomain }, { merge: true });
            } catch (err) {
              console.error('Erreur lors de l\'enregistrement du domaine :', err);
            }
          }

          window.location.href = 'profil-prestataire.html';
        });
      }
    } else {
      // Mode client : cliquer sur une catégorie ouvre la liste des prestataires de ce domaine.
      servicesGrid.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', () => {
          const domain = wtsaDomainFromCard(card);
          localStorage.setItem('wtsaBrowseDomain', domain);
          window.location.href = 'liste-prestataires.html';
        });
      });
    }
  }

  // --- Barre d'options (profil / favoris / support) sur la page des services ---
  // Visible pour tous les utilisateurs connectés, clients comme prestataires.
  const wtsaDock = document.getElementById('wtsaDock');
  if (wtsaDock) {

    function escapeWtsaHtml(str) {
      return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
    }

    function formatWtsaDate(d) {
      const lang = typeof wtsaGetLang === 'function' ? wtsaGetLang() : 'fr';
      return d.toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function wtsaT(key) {
      const lang = typeof wtsaGetLang === 'function' ? wtsaGetLang() : 'fr';
      return (translations[key] && translations[key][lang]) || '';
    }

    const overlay = document.getElementById('wtsaWidgetOverlay');
    const widgets = {
      profile: document.getElementById('wtsaProfileWidget'),
      favorites: document.getElementById('wtsaFavoritesWidget'),
      support: document.getElementById('wtsaSupportWidget')
    };

    function closeAllWidgets() {
      Object.values(widgets).forEach(w => {
        if (!w) return;
        w.classList.remove('is-open');
        w.setAttribute('aria-hidden', 'true');
      });
      if (overlay) overlay.classList.remove('is-open');
      wtsaDock.querySelectorAll('.wtsa-dock-btn').forEach(b => b.classList.remove('is-active'));
    }

    function openWidget(name) {
      closeAllWidgets();
      const widget = widgets[name];
      if (!widget) return;
      widget.classList.add('is-open');
      widget.setAttribute('aria-hidden', 'false');
      if (overlay) overlay.classList.add('is-open');
      const btn = wtsaDock.querySelector(`[data-widget="${name}"]`);
      if (btn) btn.classList.add('is-active');
      if (name === 'profile') renderProfileWidget();
    }

    wtsaDock.querySelectorAll('.wtsa-dock-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.widget;
        const widget = widgets[name];
        if (widget && widget.classList.contains('is-open')) {
          closeAllWidgets();
        } else {
          openWidget(name);
        }
      });
    });

    document.querySelectorAll('[data-close-widget]').forEach(btn => {
      btn.addEventListener('click', closeAllWidgets);
    });
    if (overlay) overlay.addEventListener('click', closeAllWidgets);

    // --- Widget Support : ouvre un e-mail pré-rempli vers l'équipe Worker TSA ---
    const wtsaSupportSend = document.getElementById('wtsaSupportSend');
    if (wtsaSupportSend) {
      wtsaSupportSend.addEventListener('click', () => {
        const messageInput = document.getElementById('wtsaSupportMessage');
        const message = messageInput ? messageInput.value.trim() : '';
        const subject = encodeURIComponent('Message support — Worker TSA');
        const body = encodeURIComponent(
          message
            ? `Bonjour,\n\n${message}`
            : "Bonjour,\n\nJ'ai besoin d'aide concernant Worker TSA."
        );
        window.location.href = `mailto:workertsa001@protonmail.com?subject=${subject}&body=${body}`;
      });
    }

    // --- Widget Favoris : chaque utilisateur (client ou prestataire) peut
    //     ajouter/retirer une catégorie de service à ses favoris. ---
    let wtsaFavorites = [];
    try {
      wtsaFavorites = JSON.parse(localStorage.getItem('wtsaFavorites') || '[]');
    } catch (err) {
      wtsaFavorites = [];
    }

    function renderFavoritesList() {
      const listEl = document.getElementById('wtsaFavList');
      const emptyEl = document.getElementById('wtsaFavEmpty');
      if (!listEl || !emptyEl) return;
      listEl.innerHTML = '';
      if (!wtsaFavorites.length) {
        emptyEl.style.display = '';
        return;
      }
      emptyEl.style.display = 'none';
      wtsaFavorites.forEach(name => {
        const li = document.createElement('li');
        li.className = 'wtsa-fav-item';
        li.innerHTML = `
          <span class="wtsa-fav-name">${escapeWtsaHtml(name)}</span>
          <button type="button" class="wtsa-fav-remove" aria-label="Retirer">&times;</button>
        `;
        li.querySelector('.wtsa-fav-name').addEventListener('click', () => {
          closeAllWidgets();
          const card = Array.from(document.querySelectorAll('.service-card')).find(c => {
            const nameEl = c.querySelector('.service-name');
            return nameEl && nameEl.textContent.trim() === name;
          });
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('wtsa-fav-highlight');
            setTimeout(() => card.classList.remove('wtsa-fav-highlight'), 1600);
          }
        });
        li.querySelector('.wtsa-fav-remove').addEventListener('click', () => toggleWtsaFavorite(name));
        listEl.appendChild(li);
      });
    }

    function saveWtsaFavorites() {
      localStorage.setItem('wtsaFavorites', JSON.stringify(wtsaFavorites));
      if (window.wtsaFirebase && window.wtsaFirebase.auth.currentUser) {
        const { db, doc, setDoc, auth } = window.wtsaFirebase;
        setDoc(doc(db, 'users', auth.currentUser.uid), { favorites: wtsaFavorites }, { merge: true })
          .catch(err => console.error('Erreur lors de l\'enregistrement des favoris :', err));
      }
    }

    function toggleWtsaFavorite(name) {
      const idx = wtsaFavorites.indexOf(name);
      if (idx === -1) {
        wtsaFavorites.push(name);
      } else {
        wtsaFavorites.splice(idx, 1);
      }
      document.querySelectorAll('.service-card').forEach(card => {
        const nameEl = card.querySelector('.service-name');
        if (nameEl && nameEl.textContent.trim() === name) {
          card.classList.toggle('is-favorite', wtsaFavorites.includes(name));
        }
      });
      renderFavoritesList();
      saveWtsaFavorites();
    }

    // Ajoute une étoile "favori" sur chaque carte de service, sans gêner
    // le clic principal de la carte (sélection de domaine / navigation).
    document.querySelectorAll('.service-card').forEach(card => {
      const favBtn = document.createElement('button');
      favBtn.type = 'button';
      favBtn.className = 'service-fav-btn';
      favBtn.setAttribute('aria-label', 'Favori');
      favBtn.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.6l-5.9 3 1.3-6.6-4.9-4.6 6.6-.8L12 2.5z" fill="none" stroke="#B8ABAF" stroke-width="1.6" stroke-linejoin="round"/></svg>';
      favBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        const name = card.querySelector('.service-name').textContent.trim();
        toggleWtsaFavorite(name);
      });
      card.appendChild(favBtn);

      const name = card.querySelector('.service-name').textContent.trim();
      if (wtsaFavorites.includes(name)) card.classList.add('is-favorite');
    });

    renderFavoritesList();

    // Récupère les favoris déjà enregistrés côté serveur pour un utilisateur connecté.
    if (window.wtsaFirebase && window.wtsaFirebase.auth.currentUser) {
      const { db, doc, getDoc, auth } = window.wtsaFirebase;
      getDoc(doc(db, 'users', auth.currentUser.uid)).then(snap => {
        if (snap.exists() && Array.isArray(snap.data().favorites)) {
          wtsaFavorites = snap.data().favorites;
          localStorage.setItem('wtsaFavorites', JSON.stringify(wtsaFavorites));
          document.querySelectorAll('.service-card').forEach(card => {
            const name = card.querySelector('.service-name').textContent.trim();
            card.classList.toggle('is-favorite', wtsaFavorites.includes(name));
          });
          renderFavoritesList();
        }
      }).catch(err => console.error('Erreur lors du chargement des favoris :', err));
    }

    // --- Widget Profil ---
    //  Client : consulte son e-mail (mot de passe masqué) et peut supprimer son compte.
    //  Prestataire : idem + modification de ses coordonnées (une fois tous les 3 jours).
    async function renderProfileWidget() {
      const body = document.getElementById('wtsaProfileBody');
      if (!body) return;
      body.innerHTML = '<p class="wtsa-widget-empty">…</p>';

      if (!window.wtsaFirebase || !window.wtsaFirebase.auth.currentUser) {
        body.innerHTML = `<p class="wtsa-widget-empty">${escapeWtsaHtml(wtsaT('profileWidgetLoggedOut'))}</p>`;
        return;
      }

      const { db, doc, getDoc, setDoc, auth } = window.wtsaFirebase;
      let data = {};
      try {
        const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (snap.exists()) data = snap.data();
      } catch (err) {
        console.error('Erreur lors du chargement du profil :', err);
      }

      const isProvider = data.role === 'prestataire';
      const lastEdit = data.lastProfileEditAt ? new Date(data.lastProfileEditAt) : null;
      const nextEditDate = lastEdit ? new Date(lastEdit.getTime() + 3 * 24 * 60 * 60 * 1000) : null;
      const locked = !!(nextEditDate && nextEditDate > new Date());

      const fields = [];
      if (isProvider) {
        fields.push(
          { id: 'wtsaPwFirstName', key: 'firstName', label: wtsaT('labelFirstName'), value: data.firstName || '' },
          { id: 'wtsaPwLastName', key: 'lastName', label: wtsaT('labelLastName'), value: data.lastName || '' },
          { id: 'wtsaPwPhone', key: 'phone', label: wtsaT('labelPhone'), value: data.phone || '' },
          { id: 'wtsaPwWhatsapp', key: 'whatsapp', label: wtsaT('providerWhatsapp'), value: data.whatsapp || '' },
          { id: 'wtsaPwDescription', key: 'description', label: wtsaT('providerDescriptionLabel'), value: data.description || '', textarea: true },
          { id: 'wtsaPwAnnouncement', key: 'announcement', label: wtsaT('providerAnnouncementLabel'), value: data.announcement || '', textarea: true }
        );
      }

      let html = '';

      // Compte : e-mail + mot de passe masqué (Firebase ne permet jamais de relire le mot de passe)
      html += '<div class="wtsa-account-box">';
      html += `<span class="wtsa-field-label">${escapeWtsaHtml(wtsaT('accountEmailLabel'))}</span>`;
      html += `<div class="wtsa-account-value">${escapeWtsaHtml(auth.currentUser.email || '')}</div>`;
      html += `<span class="wtsa-field-label">${escapeWtsaHtml(wtsaT('accountPasswordLabel'))}</span>`;
      html += '<div class="wtsa-account-value">••••••••</div>';
      html += `<p class="wtsa-widget-hint">${escapeWtsaHtml(wtsaT('accountPasswordNote'))}</p>`;
      html += '</div>';

      // Prestataire : coordonnées modifiables
      if (isProvider) {
        if (locked) {
          html += `<p class="wtsa-widget-locked">${escapeWtsaHtml(wtsaT('profileWidgetNextEdit'))} ${formatWtsaDate(nextEditDate)}.</p>`;
        }
        fields.forEach(f => {
          html += `<label class="wtsa-field-label" for="${f.id}">${escapeWtsaHtml(f.label)}</label>`;
          html += f.textarea
            ? `<textarea id="${f.id}" class="wtsa-widget-textarea" rows="3"${locked ? ' disabled' : ''}>${escapeWtsaHtml(f.value)}</textarea>`
            : `<input type="text" id="${f.id}" class="wtsa-widget-input" value="${escapeWtsaHtml(f.value)}"${locked ? ' disabled' : ''}>`;
        });
        html += `<button type="button" class="btn-pill-primary wtsa-widget-submit" id="wtsaProfileSave"${locked ? ' disabled' : ''}>${escapeWtsaHtml(wtsaT('profileWidgetSave'))}</button>`;
        html += `<p class="wtsa-widget-note" id="wtsaProfileNote"></p>`;
      }

      // Suppression définitive du compte (client comme prestataire)
      html += '<div class="wtsa-danger-zone">';
      html += `<button type="button" class="wtsa-danger-btn" id="wtsaDeleteAccount">${escapeWtsaHtml(wtsaT('deleteAccountBtn'))}</button>`;
      html += '<div id="wtsaDeleteConfirm" hidden>';
      html += `<p class="wtsa-widget-hint">${escapeWtsaHtml(wtsaT('deleteAccountWarn'))}</p>`;
      html += `<input type="password" id="wtsaDeletePw" class="wtsa-widget-input" autocomplete="current-password" placeholder="${escapeWtsaHtml(wtsaT('deleteAccountPwPlaceholder'))}">`;
      html += `<button type="button" class="wtsa-danger-btn is-solid" id="wtsaDeleteConfirmBtn">${escapeWtsaHtml(wtsaT('deleteAccountConfirmBtn'))}</button>`;
      html += `<button type="button" class="wtsa-danger-btn" id="wtsaDeleteCancel">${escapeWtsaHtml(wtsaT('deleteAccountCancel'))}</button>`;
      html += '</div>';
      html += '<p class="wtsa-danger-note" id="wtsaDeleteNote"></p>';
      html += '</div>';
      body.innerHTML = html;

      // Enregistrement des coordonnées (prestataire)
      const saveBtn = document.getElementById('wtsaProfileSave');
      if (saveBtn && !locked) {
        saveBtn.addEventListener('click', async () => {
          const updates = {};
          fields.forEach(f => {
            const el = document.getElementById(f.id);
            if (el) updates[f.key] = el.value.trim();
          });
          updates.lastProfileEditAt = new Date().toISOString();

          const note = document.getElementById('wtsaProfileNote');
          saveBtn.disabled = true;
          try {
            await setDoc(doc(db, 'users', auth.currentUser.uid), updates, { merge: true });
            if (note) {
              note.textContent = wtsaT('profileWidgetSaved');
              note.classList.add('is-success');
            }
            setTimeout(closeAllWidgets, 1100);
          } catch (err) {
            console.error('Erreur lors de l\'enregistrement du profil :', err);
            if (note) note.textContent = wtsaT('profileWidgetError');
            saveBtn.disabled = false;
          }
        });
      }

      // Suppression définitive du compte
      const deleteBtn = document.getElementById('wtsaDeleteAccount');
      const deleteBox = document.getElementById('wtsaDeleteConfirm');
      const deletePw = document.getElementById('wtsaDeletePw');
      const deleteNote = document.getElementById('wtsaDeleteNote');
      const deleteConfirmBtn = document.getElementById('wtsaDeleteConfirmBtn');
      const deleteCancelBtn = document.getElementById('wtsaDeleteCancel');

      deleteBtn.addEventListener('click', () => {
        deleteBtn.hidden = true;
        deleteBox.hidden = false;
        deleteNote.textContent = '';
        deletePw.focus();
      });

      deleteCancelBtn.addEventListener('click', () => {
        deleteBox.hidden = true;
        deleteBtn.hidden = false;
        deletePw.value = '';
        deleteNote.textContent = '';
      });

      deleteConfirmBtn.addEventListener('click', async () => {
        const password = deletePw.value;
        if (!password) {
          deleteNote.textContent = wtsaT('deleteAccountNeedPw');
          return;
        }
        deleteConfirmBtn.disabled = true;
        deleteNote.textContent = '';

        const { deleteDoc, EmailAuthProvider, reauthenticateWithCredential, deleteUser } = window.wtsaFirebase;
        const user = auth.currentUser;

        try {
          // 1) Vérifie le mot de passe (obligatoire avant toute suppression de compte)
          await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
        } catch (err) {
          deleteNote.textContent = wtsaT('deleteAccountWrongPw');
          deleteConfirmBtn.disabled = false;
          return;
        }

        try {
          // 2) Supprime le profil : les compteurs de la console (clients / prestataires)
          //    baissent automatiquement de 1, car ils comptent les comptes existants.
          await deleteDoc(doc(db, 'users', user.uid));
          // 3) Supprime le compte de connexion
          await deleteUser(user);
          ['wtsaRole', 'wtsaDomain', 'wtsaBrowseDomain', 'wtsaFavorites'].forEach(k => localStorage.removeItem(k));
          window.location.replace('connexion.html');
        } catch (err) {
          console.error('Erreur lors de la suppression du compte :', err);
          deleteNote.textContent = wtsaT('deleteAccountError');
          deleteConfirmBtn.disabled = false;
        }
      });
    }
  }

  // --- Page profil prestataire (genre + coordonnées ; pas de photo personnelle) ---
  const providerProfileForm = document.getElementById('providerProfileForm');
  if (providerProfileForm) {

    // Widget Genre : Homme / Femme
    let selectedGender = null;
    const genderError = document.getElementById('genderError');
    const genderCards = providerProfileForm.querySelectorAll('.gender-card');

    function setGender(gender) {
      selectedGender = gender;
      genderCards.forEach(card => {
        const on = card.dataset.gender === gender;
        card.classList.toggle('is-selected', on);
        card.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (genderError) genderError.textContent = '';
    }
    genderCards.forEach(card => card.addEventListener('click', () => setGender(card.dataset.gender)));

    // Pré-remplissage (utile quand le prestataire modifie son profil)
    if (window.wtsaFirebase) {
      const { auth, db, doc, getDoc, onAuthStateChanged } = window.wtsaFirebase;
      onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        let data = {};
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) data = snap.data();
        } catch (err) {
          console.error('Erreur de lecture du profil :', err);
        }
        const strip = (v) => String(v || '').replace(/^\+228/, '');
        const fill = (id, value) => {
          const el = document.getElementById(id);
          if (el && !el.value) el.value = value || '';
        };
        fill('providerFirstName', data.firstName);
        fill('providerLastName', data.lastName);
        fill('providerPhone', strip(data.phone));
        fill('providerWhatsapp', strip(data.whatsapp));
        fill('providerEmail', data.contactEmail || user.email);
        fill('providerDescription', data.description);
        fill('providerAnnouncement', data.announcement);
        if (data.gender && !selectedGender) setGender(data.gender);
      });
    }

    // Boutons d'action cliquables : appeler / ouvrir WhatsApp
    const callActionBtn = document.getElementById('callActionBtn');
    if (callActionBtn) {
      callActionBtn.addEventListener('click', () => {
        const digits = document.getElementById('providerPhone').value.replace(/\D/g, '');
        if (digits) window.location.href = 'tel:+228' + digits;
      });
    }

    const whatsappActionBtn = document.getElementById('whatsappActionBtn');
    if (whatsappActionBtn) {
      whatsappActionBtn.addEventListener('click', () => {
        const digits = document.getElementById('providerWhatsapp').value.replace(/\D/g, '');
        if (digits) window.open('https://wa.me/228' + digits, '_blank');
      });
    }

    // Validation et enregistrement
    providerProfileForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      let valid = true;

      if (!selectedGender) {
        if (genderError) genderError.textContent = (translations.genderRequired ? translations.genderRequired[typeof wtsaGetLang === 'function' ? wtsaGetLang() : 'fr'] : 'Choisissez Homme ou Femme.');
        valid = false;
      }

      const checks = [
        ['providerFirstNameField', 'providerFirstName', v => v.trim().length >= 2, 'Entrez votre prénom.'],
        ['providerLastNameField', 'providerLastName', v => v.trim().length >= 2, 'Entrez votre nom.'],
        ['providerPhoneField', 'providerPhone', v => v.replace(/\D/g, '').length === 8, 'Entrez un numéro à 8 chiffres.'],
        ['providerWhatsappField', 'providerWhatsapp', v => v.replace(/\D/g, '').length === 8, 'Entrez un numéro à 8 chiffres.'],
        ['providerEmailField', 'providerEmail', v => isValidEmail(v.trim()), 'Entrez une adresse e-mail valide.']
      ];

      const values = {};
      checks.forEach(([fieldId, inputId, test, message]) => {
        const field = document.getElementById(fieldId);
        const input = document.getElementById(inputId);
        clearError(field);
        values[inputId] = input.value.trim();
        if (!test(input.value)) {
          showError(field, message);
          valid = false;
        }
      });

      if (!valid) return;

      const description = document.getElementById('providerDescription').value.trim();
      const announcement = document.getElementById('providerAnnouncement').value.trim();
      let alreadyPublished = false;

      if (window.wtsaFirebase && window.wtsaFirebase.auth.currentUser) {
        const { db, doc, setDoc, getDoc, auth } = window.wtsaFirebase;
        try {
          const existing = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (existing.exists() && existing.data().profileStatus === 'published') {
            alreadyPublished = true;
          }
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            gender: selectedGender,
            firstName: values.providerFirstName,
            lastName: values.providerLastName,
            phone: '+228' + values.providerPhone.replace(/\D/g, ''),
            whatsapp: '+228' + values.providerWhatsapp.replace(/\D/g, ''),
            contactEmail: values.providerEmail,
            description: description,
            announcement: announcement,
            lastProfileEditAt: new Date().toISOString()
          }, { merge: true });
        } catch (err) {
          console.error('Erreur lors de l\'enregistrement du profil prestataire :', err);
        }
      }

      window.location.replace(alreadyPublished ? 'mon-profil.html' : 'abonnement.html');
    });
  }

  // --- Page abonnement ---
  const subPlans = document.getElementById('subPlans');
  const subContinue = document.getElementById('subContinue');
  const paymentOptions = document.getElementById('paymentOptions');
  if (subPlans && subContinue) {
    let selectedPlan = null;
    let selectedPayment = null;

    function refreshContinueState() {
      subContinue.disabled = !(selectedPlan && selectedPayment);
    }

    subPlans.querySelectorAll('.sub-plan').forEach(plan => {
      plan.addEventListener('click', () => {
        subPlans.querySelectorAll('.sub-plan').forEach(p => p.classList.remove('is-selected'));
        plan.classList.add('is-selected');
        selectedPlan = { id: plan.dataset.plan, amount: plan.dataset.amount };
        refreshContinueState();
      });
    });

    if (paymentOptions) {
      paymentOptions.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', () => {
          paymentOptions.querySelectorAll('.payment-option').forEach(o => o.classList.remove('is-selected'));
          option.classList.add('is-selected');
          selectedPayment = option.dataset.method;
          refreshContinueState();
        });
      });
    }

    subContinue.addEventListener('click', async () => {
      if (!selectedPlan || !selectedPayment) return;

      const startDate = new Date();
      const durationDays = { monthly: 30, quarterly: 90, yearly: 365 }[selectedPlan.id] || 30;
      const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

      if (window.wtsaFirebase && window.wtsaFirebase.auth.currentUser) {
        const { db, doc, setDoc, auth } = window.wtsaFirebase;
        try {
          const { getDoc } = window.wtsaFirebase;
          const existing = await getDoc(doc(db, 'users', auth.currentUser.uid));
          const alreadyPublished = existing.exists() && existing.data().profileStatus === 'published';
          const subUpdate = {
            subscriptionPlan: selectedPlan.id,
            subscriptionAmount: selectedPlan.amount,
            subscriptionPaymentMethod: selectedPayment,
            subscriptionStatus: 'awaiting_proof',
            subscriptionStartDate: startDate.toISOString(),
            subscriptionEndDate: endDate.toISOString()
          };
          // Un profil déjà publié le reste (sinon il disparaît de la liste des clients).
          if (!alreadyPublished) subUpdate.profileStatus = 'awaiting_proof';
          await setDoc(doc(db, 'users', auth.currentUser.uid), subUpdate, { merge: true });
        } catch (err) {
          console.error('Erreur lors de l\'enregistrement de l\'abonnement :', err);
        }
      }

      // Déclenche la syntaxe USSD (Tmoney ou Flooz) via le composeur téléphonique,
      // sans jamais afficher le code brut dans l'interface du site.
      // Les syntaxes sont stockées dans Firestore (settings/paymentUssd) et modifiables
      // depuis la console admin, sans avoir à toucher au code.
      if (window.wtsaFirebase) {
        try {
          const { db, doc, getDoc } = window.wtsaFirebase;
          const settingsSnap = await getDoc(doc(db, 'settings', 'paymentUssd'));
          const settings = settingsSnap.exists() ? settingsSnap.data() : {};
          const template = selectedPayment === 'flooz'
            ? (settings.floozTemplate || '*155*2*2*122080*122080*{montant}#')
            : (settings.tmoneyTemplate || '');

          if (template) {
            const ussdCode = template.replace('{montant}', selectedPlan.amount);
            window.location.href = 'tel:' + ussdCode;
            setTimeout(() => { window.location.href = 'mon-profil.html'; }, 600);
            return;
          }
        } catch (err) {
          console.error('Erreur lors de la récupération de la syntaxe USSD :', err);
        }
      }

      window.location.href = 'mon-profil.html';
    });
  }

  // --- Page "Mon profil" ---
  const mpStates = document.querySelectorAll('.mp-state');
  if (mpStates.length && window.wtsaFirebase) {
    const { auth, db, doc, getDoc, setDoc, onAuthStateChanged } = window.wtsaFirebase;

    function showMpState(id) {
      mpStates.forEach(el => el.classList.toggle('is-active', el.id === id));
    }

    function formatDate(d) {
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    async function renderProfile(uid) {
      let data = {};
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) data = snap.data();
      } catch (err) {
        console.error('Erreur de lecture du profil :', err);
      }

      if (data.profileStatus === 'published') {
        showMpState('statePublished');

        document.getElementById('pvName').textContent = [data.firstName, data.lastName].filter(Boolean).join(' ') || '—';
        document.getElementById('pvDomain').textContent = data.domain ? wtsaDomainLabel(data.domain) : '—';
        document.getElementById('pvEmail').textContent = data.contactEmail || data.email || '—';
        const pvAvatar = document.getElementById('pvAvatar');
        if (pvAvatar) pvAvatar.innerHTML = wtsaGenderAvatar(data.gender);
        document.getElementById('pvPhone').textContent = data.phone || '—';
        document.getElementById('pvWhatsapp').textContent = data.whatsapp || '—';
        document.getElementById('pvDescription').textContent = data.description || '—';
        document.getElementById('pvAnnouncement').textContent = data.announcement || '—';

        const countdownValue = document.getElementById('countdownValue');
        const countdownDates = document.getElementById('countdownDates');
        if (data.subscriptionEndDate) {
          const end = new Date(data.subscriptionEndDate);
          const start = data.subscriptionStartDate ? new Date(data.subscriptionStartDate) : null;
          const daysLeft = Math.ceil((end - new Date()) / (24 * 60 * 60 * 1000));
          countdownValue.textContent = daysLeft > 0 ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}` : 'Abonnement expiré';
          countdownDates.textContent = start ? `Du ${formatDate(start)} au ${formatDate(end)}` : `Jusqu'au ${formatDate(end)}`;
        }

        const editBtn = document.getElementById('editProfileBtn');
        const editNote = document.getElementById('editProfileNote');
        const lastEdit = data.lastProfileEditAt ? new Date(data.lastProfileEditAt) : null;
        const nextEditDate = lastEdit ? new Date(lastEdit.getTime() + 3 * 24 * 60 * 60 * 1000) : null;

        if (nextEditDate && nextEditDate > new Date()) {
          editBtn.disabled = true;
          editNote.textContent = `Prochaine modification possible le ${formatDate(nextEditDate)}.`;
        } else {
          editBtn.disabled = false;
          editNote.textContent = '';
          editBtn.addEventListener('click', () => {
            window.location.href = 'profil-prestataire.html';
          });
        }

      } else if (data.profileStatus === 'awaiting_proof' && !data.proofSentAt) {
        showMpState('stateProof');
      } else {
        showMpState('statePending');
      }
    }

    const sendProofBtn = document.getElementById('sendProofBtn');
    if (sendProofBtn) {
      sendProofBtn.addEventListener('click', async () => {
        const subject = encodeURIComponent("Preuve de transaction d'abonnement !!");
        const body = encodeURIComponent('Bonjour,\n\nVeuillez trouver ci-joint la capture d\'écran de ma transaction d\'abonnement Worker TSA.\n\n(Pensez à joindre votre capture d\'écran avant l\'envoi.)');
        window.location.href = `mailto:trillionsoftware@protonmail.com?subject=${subject}&body=${body}`;

        if (auth.currentUser) {
          try {
            await setDoc(doc(db, 'users', auth.currentUser.uid), {
              proofSentAt: new Date().toISOString(),
              profileStatus: 'pending_review'
            }, { merge: true });
          } catch (err) {
            console.error('Erreur lors de l\'enregistrement de l\'envoi de la preuve :', err);
          }
        }

        showMpState('statePending');
      });
    }

    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = 'connexion.html';
        return;
      }
      renderProfile(user.uid);
    });
  }

  // --- Console admin ---
  const caShell = document.querySelector('.ca-shell');
  if (caShell && window.wtsaFirebase) {
    const { auth, db, doc, setDoc, getDoc, collection, query, where, getDocs, onAuthStateChanged } = window.wtsaFirebase;

    const caBackBtn = document.getElementById('caBackBtn');
    if (caBackBtn) {
      caBackBtn.addEventListener('click', () => {
        localStorage.setItem('wtsaRole', 'client');
        window.location.href = 'services.html';
      });
    }

    // Réinitialisation : vide UNIQUEMENT la liste des abonnements.
    // Aucun compte n'est supprimé et les cadres Prestataires / Clients ne sont pas touchés.
    const resetConsoleBtn = document.getElementById('resetConsoleBtn');
    if (resetConsoleBtn) {
      resetConsoleBtn.addEventListener('click', async () => {
        const note = document.getElementById('resetConsoleNote');
        const confirmed = window.confirm('Vider la liste des abonnements ? Les comptes et les compteurs Clients / Prestataires ne seront pas modifiés.');
        if (!confirmed) return;

        resetConsoleBtn.disabled = true;
        note.textContent = 'Réinitialisation en cours...';

        try {
          const { deleteField } = window.wtsaFirebase;
          const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'prestataire')));
          for (const docSnap of snap.docs) {
            const d = docSnap.data();
            const hasSub = d.subscriptionPlan || d.subscriptionAmount || d.subscriptionPaymentMethod ||
              d.subscriptionStatus || d.subscriptionStartDate || d.subscriptionEndDate;
            if (!hasSub) continue;
            await setDoc(doc(db, 'users', docSnap.id), {
              subscriptionPlan: deleteField(),
              subscriptionAmount: deleteField(),
              subscriptionPaymentMethod: deleteField(),
              subscriptionStatus: deleteField(),
              subscriptionStartDate: deleteField(),
              subscriptionEndDate: deleteField()
            }, { merge: true });
          }
          note.textContent = 'Liste des abonnements réinitialisée.';
          loadSubscriptions();
        } catch (err) {
          console.error('Erreur lors de la réinitialisation :', err);
          note.textContent = 'Erreur lors de la réinitialisation.';
        } finally {
          resetConsoleBtn.disabled = false;
        }
      });
    }

    async function loadProviderCount() {
      const countEl = document.getElementById('providerCount');
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'prestataire')));
        countEl.textContent = snap.size;
      } catch (err) {
        console.error('Erreur lors du comptage des prestataires :', err);
        countEl.textContent = '—';
      }
    }

    async function loadClientCount() {
      const countEl = document.getElementById('clientCount');
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'client')));
        countEl.textContent = snap.size;
      } catch (err) {
        console.error('Erreur lors du comptage des clients :', err);
        countEl.textContent = '—';
      }
    }

    async function loadPendingList() {
      const listEl = document.getElementById('pendingList');
      const emptyEl = document.getElementById('pendingEmpty');
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('profileStatus', '==', 'pending_review')));
        if (snap.empty) {
          emptyEl.textContent = 'Aucune demande en attente pour le moment.';
          return;
        }
        emptyEl.remove();
        snap.forEach(docSnap => {
          const data = docSnap.data();
          const card = document.createElement('div');
          card.className = 'ca-pending-card';
          card.innerHTML = `
            <p class="ca-pending-name">${[data.firstName, data.lastName].filter(Boolean).join(' ') || 'Sans nom'}</p>
            <p class="ca-pending-detail">Domaine : ${data.domain || '—'}</p>
            <p class="ca-pending-detail">Lieu : ${[data.city, data.region].filter(Boolean).join(', ') || '—'}</p>
            <p class="ca-pending-detail">Téléphone : ${data.phone || '—'}</p>
            <p class="ca-pending-detail">E-mail : ${data.email || '—'}</p>
            <button type="button" class="ca-pending-approve">Approuver et publier</button>
          `;
          card.querySelector('.ca-pending-approve').addEventListener('click', async (event) => {
            event.target.disabled = true;
            event.target.textContent = 'Publication...';
            try {
              await setDoc(doc(db, 'users', docSnap.id), { profileStatus: 'published' }, { merge: true });
              card.remove();
              if (!listEl.querySelector('.ca-pending-card')) {
                listEl.innerHTML = '<p class="ca-empty">Aucune demande en attente pour le moment.</p>';
              }
            } catch (err) {
              console.error('Erreur lors de la publication :', err);
              event.target.disabled = false;
              event.target.textContent = 'Approuver et publier';
            }
          });
          listEl.appendChild(card);
        });
      } catch (err) {
        console.error('Erreur lors du chargement des demandes :', err);
        emptyEl.textContent = 'Erreur lors du chargement.';
      }
    }

    function formatCaDate(d) {
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    async function loadSubscriptions() {
      const listEl = document.getElementById('subsList');
      if (!listEl) return;
      listEl.innerHTML = '<p class="ca-empty" id="subsEmpty">Chargement...</p>';
      const emptyEl = document.getElementById('subsEmpty');
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'prestataire')));
        const subDocs = snap.docs.filter(d => {
          const x = d.data();
          return x.subscriptionPlan || x.subscriptionStatus || x.subscriptionEndDate;
        });
        if (!subDocs.length) {
          emptyEl.textContent = 'Aucun abonnement pour le moment.';
          return;
        }
        emptyEl.remove();
        subDocs.forEach(docSnap => {
          const data = docSnap.data();
          const card = document.createElement('div');
          card.className = 'ca-pending-card';
          let countdownText = 'Aucun abonnement enregistré.';
          if (data.subscriptionEndDate) {
            const end = new Date(data.subscriptionEndDate);
            const daysLeft = Math.ceil((end - new Date()) / (24 * 60 * 60 * 1000));
            countdownText = daysLeft > 0
              ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''} (jusqu'au ${formatCaDate(end)})`
              : `Abonnement expiré depuis le ${formatCaDate(end)}`;
          }
          card.innerHTML = `
            <p class="ca-pending-name">${[data.firstName, data.lastName].filter(Boolean).join(' ') || 'Sans nom'}</p>
            <p class="ca-pending-detail">Domaine : ${data.domain || '—'}</p>
            <p class="ca-pending-detail">Statut abonnement : ${data.subscriptionStatus || '—'}</p>
            <p class="ca-pending-detail">Compte à rebours : ${countdownText}</p>
          `;
          listEl.appendChild(card);
        });
      } catch (err) {
        console.error('Erreur lors du chargement des abonnements :', err);
        emptyEl.textContent = 'Erreur lors du chargement.';
      }
    }

    async function loadUssdSettings() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'paymentUssd'));
        if (snap.exists()) {
          const data = snap.data();
          document.getElementById('tmoneyUssd').value = data.tmoneyTemplate || '';
          document.getElementById('floozUssd').value = data.floozTemplate || '*155*2*2*122080*122080*{montant}#';
        } else {
          document.getElementById('floozUssd').value = '*155*2*2*122080*122080*{montant}#';
        }
      } catch (err) {
        console.error('Erreur lors du chargement des syntaxes USSD :', err);
      }
    }

    const ussdForm = document.getElementById('ussdForm');
    if (ussdForm) {
      ussdForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const note = document.getElementById('ussdSaveNote');
        try {
          await setDoc(doc(db, 'settings', 'paymentUssd'), {
            tmoneyTemplate: document.getElementById('tmoneyUssd').value.trim(),
            floozTemplate: document.getElementById('floozUssd').value.trim()
          }, { merge: true });
          note.textContent = 'Syntaxes enregistrées.';
          setTimeout(() => { note.textContent = ''; }, 3000);
        } catch (err) {
          console.error('Erreur lors de l\'enregistrement des syntaxes USSD :', err);
          note.textContent = 'Erreur lors de l\'enregistrement.';
        }
      });
    }

    onAuthStateChanged(auth, (user) => {
      if (!user || user.email !== window.WTSA_ADMIN_EMAIL) {
        window.location.href = 'connexion.html';
        return;
      }
      loadProviderCount();
      loadClientCount();
      loadPendingList();
      loadSubscriptions();
      loadUssdSettings();
    });
  }

  // --- Page liste des prestataires par domaine (vue client) ---
  const lpList = document.getElementById('lpList');
  if (lpList && window.wtsaFirebase) {
    const { db, collection, query, where, getDocs } = window.wtsaFirebase;
    const domain = localStorage.getItem('wtsaBrowseDomain') || '';
    const titleEl = document.getElementById('lpDomainTitle');
    if (titleEl && domain) titleEl.textContent = wtsaDomainLabel(domain);

    (async () => {
      const emptyEl = document.getElementById('lpEmpty');
      try {
        const snap = await getDocs(query(
          collection(db, 'users'),
          where('role', '==', 'prestataire'),
          where('profileStatus', '==', 'published'),
          where('domain', 'in', wtsaDomainVariants(domain))
        ));

        if (snap.empty) {
          emptyEl.textContent = 'Aucun prestataire disponible dans ce domaine pour le moment.';
          return;
        }

        emptyEl.remove();
        snap.forEach(docSnap => {
          const data = docSnap.data();
          const card = document.createElement('div');
          card.className = 'lp-card';
          card.innerHTML = `
            <div class="lp-card-cover"><img src="cover.jpg" alt="" onerror="this.remove()"></div>
            <div class="lp-card-avatar">${wtsaGenderAvatar(data.gender)}</div>
            <p class="lp-card-name">${[data.firstName, data.lastName].filter(Boolean).join(' ') || 'Prestataire'}</p>
            <p class="lp-card-location">${[data.city, data.region].filter(Boolean).join(', ') || ''}</p>
            ${data.announcement ? `<p class="lp-card-announcement">${data.announcement}</p>` : ''}
            <div class="lp-card-actions">
              <button type="button" class="lp-card-action lp-action-call" data-phone="${data.phone || ''}">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2C10.5 20 4 13.5 4 6a2 2 0 0 1 1-2z" fill="#fff"/></svg>
                Appeler
              </button>
              <button type="button" class="lp-card-action lp-action-whatsapp" data-whatsapp="${data.whatsapp || ''}">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" fill="#fff"/></svg>
                WhatsApp
              </button>
            </div>
          `;
          card.querySelector('.lp-action-call').addEventListener('click', (e) => {
            const phone = e.currentTarget.dataset.phone;
            if (phone) window.location.href = 'tel:' + phone;
          });
          card.querySelector('.lp-action-whatsapp').addEventListener('click', (e) => {
            const wa = e.currentTarget.dataset.whatsapp;
            if (wa) window.open('https://wa.me/' + wa.replace(/\D/g, ''), '_blank');
          });
          lpList.appendChild(card);
        });
      } catch (err) {
        console.error('Erreur lors du chargement des prestataires :', err);
        emptyEl.textContent = 'Erreur lors du chargement. Réessayez.';
      }
    })();
  }
});
