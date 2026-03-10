import { useState, useCallback, useEffect } from 'react';

export const STORAGE_KEY = 'devis-factures-data';

const defaultCompany = {
  name: 'Mon entreprise',
  address: '',
  postalCode: '',
  city: '',
  siret: '',
  tva: '',
  email: '',
  phone: '',
  logo: null,
};

const defaultSettings = {
  devisPrefix: 'DEV',
  facturePrefix: 'FAC',
  livraisonPrefix: 'BL',
  avoirPrefix: 'AVO',
  tvaRate: 0,
  tvaApplicable: true,
  showUnits: true,
  devise: '€',
  validiteDevisJours: 30,
  clientFolderPath: '',
  theme: 'dark',
  googleDriveConnected: false,
  googleClientId: '',
  googleClientSecret: '',
  documentTemplate: {
    blockOrder: ['company', 'header', 'notes', 'date', 'lines', 'totals', 'amountLetters', 'payment', 'footer'],
    options: {
      showLogo: true,
      showSiret: true,
      showCompanyEmail: true,
      showCompanyPhone: true,
      showFooter: true,
      footerText: 'Document généré par Devis & Factures — Studio Velysion CreatorHub',
    },
  },
};

function loadState() {
  const empty = {
    onboardingDone: false,
    company: { ...defaultCompany },
    settings: { ...defaultSettings },
    clients: [],
    products: [],
    families: ['Prestations', 'Produits', 'Divers'],
    devis: [],
    factures: [],
    bonsLivraison: [],
    avoirs: [],
    emailTemplates: [],
    calendarEvents: [],
    contracts: [],
    comptabilityEntries: [],
    managementProjects: [],
    managementTasks: [],
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const hasCompletedOnboarding = data.hasOwnProperty('onboardingDone')
          ? data.onboardingDone
          : (data.company?.name && data.company.name !== 'Mon entreprise');
      return {
        onboardingDone: hasCompletedOnboarding,
        company: { ...defaultCompany, ...(data.company || {}) },
        settings: { ...defaultSettings, ...(data.settings || {}) },
        clients: Array.isArray(data.clients) ? data.clients : [],
        products: Array.isArray(data.products) ? data.products : [],
        families: Array.isArray(data.families) && data.families.length ? data.families : empty.families,
        devis: Array.isArray(data.devis) ? data.devis : [],
        factures: Array.isArray(data.factures) ? data.factures : [],
        bonsLivraison: Array.isArray(data.bonsLivraison) ? data.bonsLivraison : [],
        avoirs: Array.isArray(data.avoirs) ? data.avoirs : [],
        emailTemplates: Array.isArray(data.emailTemplates) ? data.emailTemplates : [],
        calendarEvents: Array.isArray(data.calendarEvents) ? data.calendarEvents : [],
        contracts: Array.isArray(data.contracts) ? data.contracts : [],
        comptabilityEntries: Array.isArray(data.comptabilityEntries) ? data.comptabilityEntries : [],
        managementProjects: Array.isArray(data.managementProjects) ? data.managementProjects : [],
        managementTasks: Array.isArray(data.managementTasks) ? data.managementTasks : [],
      };
    }
  } catch (_) {}
  return { ...empty };
}

function saveState(state) {
  try {
    // Sauvegarde complète (dont onboardingDone) pour que le logiciel ne réaffiche pas la page de bienvenue au redémarrage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

export function useStore() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateCompany = useCallback((company) => {
    setState((s) => ({ ...s, company: { ...s.company, ...company } }));
  }, []);

  const updateSettings = useCallback((settings) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...settings } }));
  }, []);

  const completeOnboarding = useCallback((companyData) => {
    setState((s) => ({
      ...s,
      onboardingDone: true, // une seule fois : au prochain lancement l’app s’ouvrira directement
      company: { ...s.company, ...companyData },
    }));
  }, []);

  const addClient = useCallback((client) => {
    const id = `c-${Date.now()}`;
    setState((s) => ({ ...s, clients: [...s.clients, { ...client, id }] }));
    return id;
  }, []);

  const updateClient = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
  }, []);

  const deleteClient = useCallback((id) => {
    setState((s) => ({ ...s, clients: s.clients.filter((c) => c.id !== id) }));
  }, []);

  const addProduct = useCallback((product) => {
    const id = `p-${Date.now()}`;
    setState((s) => ({
      ...s,
      products: [...s.products, { ...product, id, family: product.family || s.families[0] }],
    }));
    return id;
  }, []);

  const updateProduct = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      products: s.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }));
  }, []);

  const deleteProduct = useCallback((id) => {
    setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
  }, []);

  const addFamily = useCallback((name) => {
    setState((s) =>
      s.families.includes(name) ? s : { ...s, families: [...s.families, name] }
    );
  }, []);

  const addDevis = useCallback((devis) => {
    const num = state.devis.length + 1;
    const ref = `${state.settings.devisPrefix}-${String(num).padStart(4, '0')}`;
    const id = `d-${Date.now()}`;
    const doc = {
      ...devis,
      id,
      ref,
      num,
      type: 'devis',
      createdAt: new Date().toISOString(),
      status: 'envoyé',
      transformeEnFacture: false,
    };
    setState((s) => ({ ...s, devis: [...s.devis, doc] }));
    return id;
  }, [state.devis.length, state.settings.devisPrefix]);

  const updateDevis = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      devis: s.devis.map((d) => (d.id === id ? { ...d, ...data } : d)),
    }));
  }, []);

  const transformDevisToFacture = useCallback((devisId) => {
    const devis = state.devis.find((d) => d.id === devisId);
    if (!devis) return null;
    const num = state.factures.length + 1;
    const ref = `${state.settings.facturePrefix}-${String(num).padStart(4, '0')}`;
    const id = `f-${Date.now()}`;
    const facture = {
      ...devis,
      id,
      ref,
      num,
      type: 'facture',
      createdAt: new Date().toISOString(),
      status: 'non reglee',
      devisId,
      regleLe: null,
      montantRegle: 0,
    };
    setState((s) => ({
      ...s,
      devis: s.devis.map((d) =>
        d.id === devisId ? { ...d, transformeEnFacture: true } : d
      ),
      factures: [...s.factures, facture],
      clients: s.clients.map((c) =>
        c.id === devis.clientId ? { ...c, isClient: true } : c
      ),
    }));
    return id;
  }, [state.devis, state.factures.length, state.settings.facturePrefix, state.clients]);

  const addFacture = useCallback((facture) => {
    const num = state.factures.length + 1;
    const ref = `${state.settings.facturePrefix}-${String(num).padStart(4, '0')}`;
    const id = `f-${Date.now()}`;
    const doc = {
      ...facture,
      id,
      ref,
      num,
      type: 'facture',
      createdAt: new Date().toISOString(),
      status: facture.status || 'non reglee',
      regleLe: null,
      montantRegle: 0,
    };
    setState((s) => ({ ...s, factures: [...s.factures, doc] }));
    return id;
  }, [state.factures.length, state.settings.facturePrefix]);

  const updateFacture = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      factures: s.factures.map((f) => (f.id === id ? { ...f, ...data } : f)),
    }));
  }, []);

  const setFactureReglee = useCallback((id, regleLe, montantRegle, modePaiement) => {
    setState((s) => ({
      ...s,
      factures: s.factures.map((f) =>
        f.id === id
          ? { ...f, status: 'reglee', regleLe, montantRegle: montantRegle ?? f.totalTTC, modePaiement: modePaiement ?? f.modePaiement }
          : f
      ),
    }));
  }, []);

  const addBonLivraison = useCallback((livraison) => {
    const num = state.bonsLivraison.length + 1;
    const ref = `${state.settings.livraisonPrefix || 'BL'}-${String(num).padStart(4, '0')}`;
    const id = `bl-${Date.now()}`;
    const doc = {
      ...livraison,
      id,
      ref,
      num,
      type: 'livraison',
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, bonsLivraison: [...s.bonsLivraison, doc] }));
    return id;
  }, [state.bonsLivraison.length, state.settings.livraisonPrefix]);

  const updateBonLivraison = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      bonsLivraison: s.bonsLivraison.map((bl) => (bl.id === id ? { ...bl, ...data } : bl)),
    }));
  }, []);

  const addAvoir = useCallback((avoir) => {
    const num = state.avoirs.length + 1;
    const ref = `${state.settings.avoirPrefix || 'AVO'}-${String(num).padStart(4, '0')}`;
    const id = `a-${Date.now()}`;
    const doc = {
      ...avoir,
      id,
      ref,
      num,
      type: 'avoir',
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, avoirs: [...s.avoirs, doc] }));
    return id;
  }, [state.avoirs.length, state.settings.avoirPrefix]);

  const updateAvoir = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      avoirs: s.avoirs.map((a) => (a.id === id ? { ...a, ...data } : a)),
    }));
  }, []);

  const duplicateDocument = useCallback((doc) => {
    if (doc.type === 'devis') {
      const { id, ref, num, createdAt, transformeEnFacture, ...rest } = doc;
      return addDevis(rest);
    }
    if (doc.type === 'facture') {
      const { id, ref, num, createdAt, status, regleLe, montantRegle, devisId, ...rest } = doc;
      return addFacture(rest);
    }
    if (doc.type === 'livraison') {
      const { id, ref, num, createdAt, ...rest } = doc;
      return addBonLivraison(rest);
    }
    if (doc.type === 'avoir') {
      const { id, ref, num, createdAt, ...rest } = doc;
      return addAvoir(rest);
    }
    return null;
  }, [addDevis, addFacture, addBonLivraison, addAvoir]);

  const addEmailTemplate = useCallback((tpl) => {
    const id = `et-${Date.now()}`;
    setState((s) => ({ ...s, emailTemplates: [...(s.emailTemplates || []), { ...tpl, id }] }));
    return id;
  }, []);

  const updateEmailTemplate = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      emailTemplates: (s.emailTemplates || []).map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));
  }, []);

  const deleteEmailTemplate = useCallback((id) => {
    setState((s) => ({ ...s, emailTemplates: (s.emailTemplates || []).filter((t) => t.id !== id) }));
  }, []);

  const addCalendarEvent = useCallback((event) => {
    const id = `ev-${Date.now()}`;
    const doc = { ...event, id, type: 'custom', createdAt: new Date().toISOString() };
    setState((s) => ({ ...s, calendarEvents: [...(s.calendarEvents || []), doc] }));
    return id;
  }, []);

  const updateCalendarEvent = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      calendarEvents: (s.calendarEvents || []).map((e) => (e.id === id ? { ...e, ...data } : e)),
    }));
  }, []);

  const deleteCalendarEvent = useCallback((id) => {
    setState((s) => ({ ...s, calendarEvents: (s.calendarEvents || []).filter((e) => e.id !== id) }));
  }, []);

  const addContract = useCallback((contract) => {
    const id = `ct-${Date.now()}`;
    setState((s) => ({ ...s, contracts: [...(s.contracts || []), { ...contract, id }] }));
    return id;
  }, []);

  const updateContract = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      contracts: (s.contracts || []).map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
  }, []);

  const deleteContract = useCallback((id) => {
    setState((s) => ({ ...s, contracts: (s.contracts || []).filter((c) => c.id !== id) }));
  }, []);

  const addComptabilityEntry = useCallback((entry) => {
    const id = `ce-${Date.now()}`;
    setState((s) => ({
      ...s,
      comptabilityEntries: [...(s.comptabilityEntries || []), { ...entry, id }],
    }));
    return id;
  }, []);

  const updateComptabilityEntry = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      comptabilityEntries: (s.comptabilityEntries || []).map((e) =>
        e.id === id ? { ...e, ...data } : e
      ),
    }));
  }, []);

  const deleteComptabilityEntry = useCallback((id) => {
    setState((s) => ({
      ...s,
      comptabilityEntries: (s.comptabilityEntries || []).filter((e) => e.id !== id),
    }));
  }, []);

  const addManagementProject = useCallback((project) => {
    const id = Date.now();
    setState((s) => ({
      ...s,
      managementProjects: [...(s.managementProjects || []), { ...project, id }],
    }));
    return id;
  }, []);

  const addManagementTask = useCallback((task) => {
    const id = Date.now() + Math.random();
    setState((s) => ({
      ...s,
      managementTasks: [...(s.managementTasks || []), { ...task, id }],
    }));
    return id;
  }, []);

  const updateManagementProject = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      managementProjects: (s.managementProjects || []).map((p) => (p.id === id ? { ...p, ...data } : p)),
    }));
  }, []);

  const deleteManagementProject = useCallback((id) => {
    setState((s) => ({
      ...s,
      managementProjects: (s.managementProjects || []).filter((p) => p.id !== id),
      managementTasks: (s.managementTasks || []).filter((t) => t.projectId !== id),
    }));
  }, []);

  const updateManagementTask = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      managementTasks: (s.managementTasks || []).map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));
  }, []);

  const deleteManagementTask = useCallback((id) => {
    setState((s) => ({
      ...s,
      managementTasks: (s.managementTasks || []).filter((t) => t.id !== id),
    }));
  }, []);

  return {
    state,
    updateCompany,
    updateSettings,
    completeOnboarding,
    addClient,
    updateClient,
    deleteClient,
    addProduct,
    updateProduct,
    deleteProduct,
    addFamily,
    addDevis,
    updateDevis,
    transformDevisToFacture,
    addFacture,
    updateFacture,
    setFactureReglee,
    addBonLivraison,
    updateBonLivraison,
    duplicateDocument,
    addAvoir,
    updateAvoir,
    addEmailTemplate,
    updateEmailTemplate,
    deleteEmailTemplate,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    addContract,
    updateContract,
    deleteContract,
    addComptabilityEntry,
    updateComptabilityEntry,
    deleteComptabilityEntry,
    addManagementProject,
    updateManagementProject,
    deleteManagementProject,
    addManagementTask,
    updateManagementTask,
    deleteManagementTask,
  };
}
