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
        const userSnap = await getDoc(doc(db, 'users', credential.user.uid));
        if (userSnap.exists() && userSnap.data().role) {
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

      localStorage.setItem('wtsaRole', selectedRole);

      if (window.wtsaFirebase && window.wtsaFirebase.auth.currentUser) {
        const { db, doc, setDoc, auth } = window.wtsaFirebase;
        try {
          await setDoc(doc(db, 'users', auth.currentUser.uid), { role: selectedRole }, { merge: true });
        } catch (err) {
          console.error('Erreur lors de l\'enregistrement du rôle :', err);
        }
      }

      if (selectedRole === 'client') {
        window.location.href = 'profil-client.html';
      } else {
        window.location.href = 'services.html';
      }
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
          selectedDomain = card.querySelector('.service-name').textContent.trim();
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
    }
  }

  // --- Page profil client (photo, prénom, nom, téléphone) ---
  const avatarCircle = document.getElementById('avatarCircle');
  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatarPreview');
  const avatarPlaceholder = document.querySelector('.avatar-placeholder');
  const clientProfileForm = document.getElementById('clientProfileForm');

  if (avatarCircle && avatarInput) {
    avatarCircle.addEventListener('click', () => avatarInput.click());

    avatarInput.addEventListener('change', () => {
      const file = avatarInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarPreview.src = e.target.result;
        avatarPreview.hidden = false;
        if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }

  if (clientProfileForm) {
    clientProfileForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      let valid = true;

      const firstNameField = document.getElementById('firstNameField');
      const firstNameInput = document.getElementById('firstName');
      clearError(firstNameField);
      if (firstNameInput.value.trim().length < 2) {
        showError(firstNameField, 'Entrez votre prénom.');
        valid = false;
      }

      const lastNameField = document.getElementById('lastNameField');
      const lastNameInput = document.getElementById('lastName');
      clearError(lastNameField);
      if (lastNameInput.value.trim().length < 2) {
        showError(lastNameField, 'Entrez votre nom.');
        valid = false;
      }

      const phoneField = document.getElementById('phoneField');
      const phoneInput = document.getElementById('phone');
      clearError(phoneField);
      const phoneDigits = phoneInput.value.replace(/\D/g, '');
      if (phoneDigits.length !== 8) {
        showError(phoneField, 'Entrez un numéro à 8 chiffres.');
        valid = false;
      }

      if (!valid) return;

      if (window.wtsaFirebase && window.wtsaFirebase.auth.currentUser) {
        const { db, doc, setDoc, auth } = window.wtsaFirebase;
        try {
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput.value.trim(),
            phone: '+228' + phoneDigits
            // La photo de profil n'est pas encore envoyée : Firebase Storage
            // n'est pas configuré. Pour l'instant, seul l'aperçu local fonctionne.
          }, { merge: true });
        } catch (err) {
          showError(phoneField, 'Une erreur est survenue lors de l\'enregistrement. Réessayez.');
          return;
        }
      }

      window.location.href = 'services.html';
    });
  }

  // --- Page profil prestataire ---
  const providerProfileForm = document.getElementById('providerProfileForm');
  if (providerProfileForm) {

    // Photos du domaine (portfolio, 3 emplacements)
    const portfolioInput = document.getElementById('portfolioInput');
    let activePortfolioSlot = null;

    document.querySelectorAll('.portfolio-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        activePortfolioSlot = slot;
        portfolioInput.click();
      });
    });

    if (portfolioInput) {
      portfolioInput.addEventListener('change', () => {
        const file = portfolioInput.files[0];
        if (!file || !activePortfolioSlot) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = activePortfolioSlot.querySelector('img');
          img.src = e.target.result;
          img.hidden = false;
          activePortfolioSlot.classList.add('has-image');
        };
        reader.readAsDataURL(file);
        portfolioInput.value = '';
      });
    }

    // Tabs justificatif : pièce d'identité / document d'entreprise
    document.querySelectorAll('[data-doctab]').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-doctab]').forEach(t => t.classList.toggle('is-active', t === tab));
        document.querySelectorAll('.doc-panel').forEach(panel => {
          panel.classList.toggle('is-active', panel.dataset.docpanel === tab.dataset.doctab);
        });
      });
    });

    // Emplacements de documents (recto/verso ou document d'entreprise)
    const docInput = document.getElementById('docInput');
    let activeDocSlot = null;

    document.querySelectorAll('.doc-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        activeDocSlot = slot;
        docInput.click();
      });
    });

    if (docInput) {
      docInput.addEventListener('change', () => {
        const file = docInput.files[0];
        if (!file || !activeDocSlot) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = activeDocSlot.querySelector('img');
          img.src = e.target.result;
          img.hidden = false;
          activeDocSlot.classList.add('has-image');
        };
        reader.readAsDataURL(file);
        docInput.value = '';
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

      const checks = [
        ['providerFirstNameField', 'providerFirstName', v => v.trim().length >= 2, 'Entrez votre prénom.'],
        ['providerLastNameField', 'providerLastName', v => v.trim().length >= 2, 'Entrez votre nom.'],
        ['providerRegionField', 'providerRegion', v => v.trim().length >= 2, 'Entrez votre région.'],
        ['providerCityField', 'providerCity', v => v.trim().length >= 2, 'Entrez votre ville.'],
        ['providerPhoneField', 'providerPhone', v => v.replace(/\D/g, '').length === 8, 'Entrez un numéro à 8 chiffres.'],
        ['providerWhatsappField', 'providerWhatsapp', v => v.replace(/\D/g, '').length === 8, 'Entrez un numéro à 8 chiffres.']
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

      const announcement = document.getElementById('providerAnnouncement').value.trim();

      if (window.wtsaFirebase && window.wtsaFirebase.auth.currentUser) {
        const { db, doc, setDoc, auth } = window.wtsaFirebase;
        try {
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            firstName: values.providerFirstName,
            lastName: values.providerLastName,
            region: values.providerRegion,
            city: values.providerCity,
            phone: '+228' + values.providerPhone.replace(/\D/g, ''),
            whatsapp: '+228' + values.providerWhatsapp.replace(/\D/g, ''),
            announcement: announcement
            // Photos (profil, portfolio, pièce d'identité/document) : aperçu local
            // uniquement pour l'instant, Firebase Storage n'est pas encore configuré.
          }, { merge: true });
        } catch (err) {
          console.error('Erreur lors de l\'enregistrement du profil prestataire :', err);
        }
      }

      window.location.href = 'abonnement.html';
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

      if (window.wtsaFirebase && window.wtsaFirebase.auth.currentUser) {
        const { db, doc, setDoc, auth } = window.wtsaFirebase;
        try {
          await setDoc(doc(db, 'users', auth.currentUser.uid), {
            subscriptionPlan: selectedPlan.id,
            subscriptionAmount: selectedPlan.amount,
            subscriptionPaymentMethod: selectedPayment,
            subscriptionStatus: 'pending_payment'
            // Le paiement réel (envoi de la demande de paiement Tmoney/Flooz) sera branché
            // une fois l'intégration technique de ces opérateurs confirmée.
          }, { merge: true });
        } catch (err) {
          console.error('Erreur lors de l\'enregistrement de l\'abonnement :', err);
        }
      }

      alert('Une demande de paiement va être envoyée sur votre numéro. (Intégration Tmoney/Flooz à finaliser.)');
    });
  }
});
