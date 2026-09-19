/* ==========================================================================
   Worker TSA — Système de traduction FR / EN
   Partagé sur toutes les pages. La langue choisie est mémorisée
   (localStorage) et réappliquée automatiquement sur chaque page suivante.
   ========================================================================== */

const WTSA_LANG_KEY = 'workerTsaLang';

const translations = {
  // --- Marque / panneau gauche (page connexion) ---
  brandHeadline: { fr: 'Trouvez le bon prestataire, en toute confiance', en: 'Find the right provider, with confidence' },
  brandText: { fr: "Worker TSA met en relation clients et prestataires de services pour des missions simples comme pour les projets plus complexes.", en: 'Worker TSA connects clients and service providers, for simple tasks and bigger projects alike.' },
  point1: { fr: 'Profils de prestataires vérifiés', en: 'Verified provider profiles' },
  point2: { fr: 'Mise en contact directe, sans intermédiaire caché', en: 'Direct contact, no hidden middleman' },
  point3: { fr: 'Avis authentiques laissés par les clients', en: 'Genuine reviews from real clients' },
  brandFooter: { fr: '© 2026 Worker TSA. Tous droits réservés.', en: '© 2026 Worker TSA. All rights reserved.' },

  // --- Onglets connexion / création de compte ---
  tabLogin: { fr: 'Connexion', en: 'Log in' },
  tabSignup: { fr: 'Créer un compte', en: 'Sign up' },

  authLoginHeading: { fr: 'Connexion', en: 'Log in' },
  authLoginSubheading: { fr: 'Connectez-vous à votre compte pour continuer', en: 'Log in to your account to continue' },
  authSignupHeading: { fr: 'Créer votre compte', en: 'Create your account' },
  authSignupSubheading: { fr: 'Rejoignez Worker TSA pour trouver un prestataire ou proposer vos services.', en: 'Join Worker TSA to find a provider or offer your services.' },

  switchTextLogin: { fr: "Vous n'avez pas de compte ?", en: "Don't have an account?" },
  switchBtnLogin: { fr: 'Créer un compte', en: 'Sign up' },
  switchTextSignup: { fr: 'Déjà un compte ?', en: 'Already have an account?' },
  switchBtnSignup: { fr: 'Se connecter', en: 'Log in' },
  rememberMe: { fr: 'Se souvenir de moi', en: 'Remember me' },
  orDivider: { fr: 'OU', en: 'OR' },
  continueOtherEmail: { fr: 'Continuer avec un autre compte e-mail', en: 'Continue with another email' },

  labelEmail: { fr: 'Adresse e-mail', en: 'Email address' },
  labelPassword: { fr: 'Mot de passe', en: 'Password' },
  labelConfirm: { fr: 'Confirmer le mot de passe', en: 'Confirm password' },
  labelName: { fr: 'Nom complet', en: 'Full name' },
  forgotPassword: { fr: 'Mot de passe oublié ?', en: 'Forgot password?' },
  termsText: { fr: "J'accepte les conditions d'utilisation et la politique de confidentialité de Worker TSA.", en: "I agree to Worker TSA's terms of use and privacy policy." },
  btnLogin: { fr: 'Se connecter', en: 'Log in' },
  btnSignup: { fr: 'Créer mon compte', en: 'Create my account' },

  placeholderEmail: { fr: 'vous@exemple.com', en: 'you@example.com' },
  placeholderName: { fr: 'Prénom et nom', en: 'First and last name' },
  placeholderPasswordMin: { fr: '6 caractères minimum', en: 'Minimum 6 characters' },

  // --- Page choix de profil ---
  roleHeadline: { fr: 'Que voulez-vous faire sur Worker TSA ?', en: 'What would you like to do on Worker TSA?' },
  roleSubtext: { fr: 'Vous pourrez changer de profil plus tard dans les paramètres de votre compte.', en: 'You can change your profile later in your account settings.' },
  roleClientTitle: { fr: 'Je suis client', en: "I'm a client" },
  roleClientDesc: { fr: 'Je recherche un prestataire de confiance pour un service.', en: "I'm looking for a trusted provider for a service." },
  roleProviderTitle: { fr: 'Je suis prestataire', en: "I'm a service provider" },
  roleProviderDesc: { fr: 'Je propose mes services et je trouve de nouveaux clients.', en: 'I offer my services and find new clients.' },
  btnContinue: { fr: 'Continuer', en: 'Continue' },

  // --- Page profil client ---
  profileHeadline: { fr: 'Complétez votre profil', en: 'Complete your profile' },
  profileSubtext: { fr: 'Ces informations sont utilisées par les prestataires pour vous identifier et vous contacter.', en: 'Providers use this information to identify and contact you.' },
  profilePhotoHint: { fr: 'Ajouter une photo de profil', en: 'Add a profile photo' },
  labelFirstName: { fr: 'Prénom', en: 'First name' },
  labelLastName: { fr: 'Nom', en: 'Last name' },
  labelPhone: { fr: 'Numéro de téléphone', en: 'Phone number' },
  placeholderFirstName: { fr: 'Votre prénom', en: 'Your first name' },
  placeholderLastName: { fr: 'Votre nom', en: 'Your last name' },
  placeholderPhone: { fr: '+225 07 00 00 00 00', en: '+225 07 00 00 00 00' },
  btnValidateProfile: { fr: 'Valider mon profil', en: 'Save my profile' },

  // --- Page liste des services ---
  servicesHeadline: { fr: 'Quel service recherchez-vous ?', en: 'Which service are you looking for?' },
  servicesSubtext: { fr: 'Choisissez une catégorie pour voir les prestataires disponibles près de vous.', en: 'Choose a category to see available providers near you.' },
  servicesHeadlineProvider: { fr: 'Quel est votre domaine d\'activité ?', en: 'What is your field of activity?' },
  servicesSubtextProvider: { fr: 'Choisissez le domaine qui correspond le mieux à vos services.', en: 'Choose the domain that best matches your services.' },
  servicesSearchPlaceholder: { fr: 'Rechercher un service...', en: 'Search for a service...' },

  // --- Page profil prestataire ---
  providerHeadline: { fr: 'Complétez votre profil professionnel', en: 'Complete your professional profile' },
  providerSubtext: { fr: 'Ces informations sont visibles par les clients qui cherchent vos services.', en: 'This information is visible to clients looking for your services.' },
  providerPhotoLabel: { fr: 'Photo de profil', en: 'Profile photo' },
  providerPortfolioLabel: { fr: 'Photos de votre domaine (3)', en: 'Photos of your field (3)' },
  providerPortfolioHint: { fr: 'Montrez des exemples de vos réalisations.', en: 'Show examples of your work.' },
  providerFirstName: { fr: 'Prénom', en: 'First name' },
  providerLastName: { fr: 'Nom', en: 'Last name' },
  providerRegion: { fr: 'Région', en: 'Region' },
  providerCity: { fr: 'Ville', en: 'City' },
  providerPhone: { fr: 'Numéro de téléphone', en: 'Phone number' },
  providerWhatsapp: { fr: 'Numéro WhatsApp', en: 'WhatsApp number' },
  providerDocTitle: { fr: 'Justificatif', en: 'Verification document' },
  providerDocTabId: { fr: "Pièce d'identité", en: 'ID document' },
  providerDocTabBiz: { fr: "Document d'entreprise", en: 'Business document' },
  providerDocFront: { fr: 'Recto', en: 'Front' },
  providerDocBack: { fr: 'Verso', en: 'Back' },
  providerDocBizHint: { fr: "Registre de commerce, agrément ou tout document prouvant l'existence de votre entreprise.", en: 'Business registration or any document proving your business exists.' },
  providerDescriptionLabel: { fr: 'Description', en: 'Description' },
  providerDescriptionPlaceholder: { fr: 'Présentez votre activité, votre expérience, vos services...', en: 'Present your activity, experience, services...' },
  providerAnnouncementLabel: { fr: 'Annonce', en: 'Announcement' },
  providerAnnouncementPlaceholder: { fr: 'Une information ponctuelle à mettre en avant...', en: 'A one-off update you want to highlight...' },
  btnSaveContinue: { fr: 'Enregistrer et continuer', en: 'Save and continue' },

  // --- Page abonnement ---
  subHeadline: { fr: 'Choisissez votre abonnement', en: 'Choose your subscription' },
  subSubtext: { fr: "Un abonnement actif est nécessaire pour apparaître auprès des clients.", en: 'An active subscription is required to appear to clients.' },
  subMonthly: { fr: 'Mensuel', en: 'Monthly' },
  subQuarterly: { fr: '3 mois', en: '3 months' },
  subYearly: { fr: 'Annuel', en: 'Yearly' },
  subPerMonth: { fr: '/ mois', en: '/ month' },
  subPer3Months: { fr: '/ 3 mois', en: '/ 3 months' },
  subPerYear: { fr: '/ an', en: '/ year' },
  subBestValue: { fr: 'Meilleure offre', en: 'Best value' },
  subPaymentTitle: { fr: 'Moyen de paiement', en: 'Payment method' },
  subPaymentPending: { fr: 'Les moyens de paiement seront disponibles très prochainement.', en: 'Payment methods will be available very soon.' },
  btnSubscribe: { fr: "S'abonner", en: 'Subscribe' },
  selectPaymentFirst: { fr: 'Choisissez un moyen de paiement.', en: 'Choose a payment method.' },

  // --- Catégories de services (23 domaines) ---
  svcEngineering: { fr: 'Ingénierie', en: 'Engineering' },
  svcArchitecture: { fr: 'Architecture', en: 'Architecture' },
  svcMechanicsWork: { fr: 'Mécanique', en: 'Mechanics' },
  svcElectricity: { fr: 'Électricité', en: 'Electricity' },
  svcMasonry: { fr: 'Maçonnerie', en: 'Masonry' },
  svcCarpentry: { fr: 'Menuiserie', en: 'Carpentry' },
  svcMedicine: { fr: 'Médecine', en: 'Medicine' },
  svcNursing: { fr: 'Infirmerie', en: 'Nursing' },
  svcHairdressing: { fr: 'Coiffure', en: 'Hairdressing' },
  svcSewing: { fr: 'Couture', en: 'Sewing' },
  svcDomesticWork: { fr: 'Travaux domestiques', en: 'Domestic work' },
  svcGardening: { fr: 'Jardinerie', en: 'Gardening' },
  svcWashing: { fr: 'Lavage', en: 'Washing' },
  svcCleaning: { fr: 'Entretien', en: 'Cleaning' },
  svcAccounting: { fr: 'Comptabilité', en: 'Accounting' },
  svcSecretarial: { fr: 'Secrétariat', en: 'Secretarial services' },
  svcCatering: { fr: 'Restauration', en: 'Catering' },
  svcHospitality: { fr: 'Hôtellerie', en: 'Hospitality' },
  svcTransport: { fr: 'Transport', en: 'Transport' },
  svcLogistics: { fr: 'Logistique', en: 'Logistics' },
  svcPhoto: { fr: 'Photographie', en: 'Photography' },
  svcEventPlanning: { fr: "Organisation d'événements", en: 'Event planning' },
  svcPublicAdmin: { fr: 'Administration publique', en: 'Public administration' },
  svcLegal: { fr: 'Juridique', en: 'Legal services' },
  svcFitness: { fr: 'Fitness', en: 'Fitness' },
  svcGymnastics: { fr: 'Gymnastique', en: 'Gymnastics' },
  svcAgriculture: { fr: 'Agriculture', en: 'Agriculture' },
  svcAgribusiness: { fr: 'Agro-industrie', en: 'Agribusiness' },
  svcPharmacy: { fr: 'Pharmacie', en: 'Pharmacy' },
  svcMedicalBiology: { fr: 'Biologie médicale', en: 'Medical biology' },
  svcTraining: { fr: 'Formation', en: 'Training' },
  svcEducation: { fr: 'Enseignement', en: 'Education' },
  svcBanking: { fr: 'Banque', en: 'Banking' },
  svcFinancial: { fr: 'Établissement financier', en: 'Financial institution' },
  svcTelecom: { fr: 'Télécommunication', en: 'Telecommunications' },
  svcIT: { fr: 'Informatique', en: 'IT' },
  svcCivilEngineering: { fr: 'Génie civil', en: 'Civil engineering' },
  svcRealEstate: { fr: 'Agent immobilier', en: 'Real estate agent' },
  svcSocial: { fr: 'Action sociale', en: 'Social work' },
  svcHumanitarian: { fr: 'Humanitaire (ONG)', en: 'Humanitarian (NGO)' },
  svcCoaching: { fr: 'Coaching', en: 'Coaching' },
  svcPersonalAssistant: { fr: 'Assistant personnel', en: 'Personal assistant' },
  svcImportExport: { fr: 'Importation-exportation', en: 'Import-export' },
  svcTransit: { fr: 'Transit', en: 'Transit' },
  svcSecurity: { fr: 'Sécurité privée', en: 'Private security' },
  svcGuarding: { fr: 'Gardiennage', en: 'Guarding' },
  svcSalesAgent: { fr: 'Agent Commercial', en: 'Sales agent' }
};

function wtsaGetLang() {
  return localStorage.getItem(WTSA_LANG_KEY) || 'fr';
}

function wtsaSetLang(lang) {
  localStorage.setItem(WTSA_LANG_KEY, lang);
  wtsaApplyLang(lang);
}

function wtsaApplyLang(lang) {
  document.documentElement.setAttribute('lang', lang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[key]) el.textContent = translations[key][lang];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[key]) el.placeholder = translations[key][lang];
  });

  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.lang === lang);
  });

  // Redéclenche l'affichage dynamique connexion/création de compte, s'il existe sur la page.
  if (typeof wtsaRefreshAuthCopy === 'function') {
    wtsaRefreshAuthCopy(lang);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const currentLang = wtsaGetLang();
  wtsaApplyLang(currentLang);

  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', () => wtsaSetLang(btn.dataset.lang));
  });
});
