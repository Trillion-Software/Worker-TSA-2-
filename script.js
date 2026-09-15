/* ==========================================================================
   Worker TSA — Script partagé
   Page connexion / création de compte
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.auth-form');
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

  // --- Formulaire de connexion ---
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
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

      if (valid) {
        // À connecter à Firebase Authentication.
        console.log('Connexion prête à être envoyée :', { email: emailInput.value.trim() });
      }
    });
  }

  // --- Formulaire de création de compte ---
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', (event) => {
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

      if (valid) {
        // À connecter à Firebase Authentication + Firestore (création du profil).
        console.log('Compte prêt à être créé :', {
          name: nameInput.value.trim(),
          email: emailInput.value.trim()
        });
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

    roleContinue.addEventListener('click', () => {
      if (!selectedRole) return;
      // À connecter : enregistrer le rôle choisi dans Firestore (profil utilisateur).
      console.log('Profil choisi :', selectedRole);
      if (selectedRole === 'client') {
        window.location.href = 'profil-client.html';
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
    clientProfileForm.addEventListener('submit', (event) => {
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
      if (phoneInput.value.trim().length < 8) {
        showError(phoneField, 'Entrez un numéro de téléphone valide.');
        valid = false;
      }

      if (valid) {
        // À connecter à Firestore : enregistrer le profil (nom, prénom, téléphone, photo)
        // et l'associer au compte créé sur la page précédente.
        console.log('Profil client prêt à être enregistré :', {
          firstName: firstNameInput.value.trim(),
          lastName: lastNameInput.value.trim(),
          phone: phoneInput.value.trim(),
          hasPhoto: !!avatarInput.files[0]
        });
        window.location.href = 'services.html';
      }
    });
  }
});
