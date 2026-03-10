import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Bienvenue from './pages/Bienvenue';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import Produits from './pages/Produits';
import ProduitForm from './pages/ProduitForm';
import DevisList from './pages/DevisList';
import DevisForm from './pages/DevisForm';
import FacturesList from './pages/FacturesList';
import FactureForm from './pages/FactureForm';
import LivraisonsList from './pages/LivraisonsList';
import LivraisonForm from './pages/LivraisonForm';
import AvoirsList from './pages/AvoirsList';
import AvoirForm from './pages/AvoirForm';
import Calendrier from './pages/Calendrier';
import Agenda from './pages/Agenda';
import DossierClient from './pages/DossierClient';
import Comptabilite from './pages/Comptabilite';
import Management from './pages/Management';
import Parametres from './pages/Parametres';

export default function App() {
  const store = useStore();
  // Page de bienvenue une seule fois : affichée uniquement si l’onboarding n’a jamais été terminé.
  // Après validation du formulaire, onboardingDone est mis à true et sauvegardé → plus jamais affichée au redémarrage.
  const showWelcome = store?.state?.onboardingDone === false;

  // Appliquer le thème (clair / sombre)
  useEffect(() => {
    const theme = store?.state?.settings?.theme || 'dark';
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [store?.state?.settings?.theme]);

  // Dossier client par défaut : Documents/Dossiers clients (créé automatiquement au premier lancement sous Electron)
  useEffect(() => {
    if (showWelcome) return;
    if (typeof window === 'undefined' || !window.electronAPI?.getDefaultClientFolder) return;
    const current = store?.state?.settings?.clientFolderPath;
    if (current) return;
    window.electronAPI.getDefaultClientFolder().then((defaultPath) => {
      if (defaultPath && store?.updateSettings) store.updateSettings({ clientFolderPath: defaultPath });
    });
  }, [showWelcome, store?.state?.settings?.clientFolderPath, store?.updateSettings]);

  if (showWelcome) {
    return <Bienvenue store={store} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout store={store} />}>
        <Route index element={<Dashboard store={store} />} />
        <Route path="clients" element={<Clients store={store} />} />
        <Route path="clients/nouveau" element={<ClientForm store={store} />} />
        <Route path="clients/:id" element={<ClientForm store={store} />} />
        <Route path="produits" element={<Produits store={store} />} />
        <Route path="produits/nouveau" element={<ProduitForm store={store} />} />
        <Route path="produits/:id" element={<ProduitForm store={store} />} />
        <Route path="devis" element={<DevisList store={store} />} />
        <Route path="devis/nouveau" element={<DevisForm store={store} />} />
        <Route path="devis/:id" element={<DevisForm store={store} />} />
        <Route path="factures" element={<FacturesList store={store} />} />
        <Route path="factures/nouveau" element={<FactureForm store={store} />} />
        <Route path="factures/:id" element={<FactureForm store={store} />} />
        <Route path="livraisons" element={<LivraisonsList store={store} />} />
        <Route path="livraisons/nouveau" element={<LivraisonForm store={store} />} />
        <Route path="livraisons/:id" element={<LivraisonForm store={store} />} />
        <Route path="avoirs" element={<AvoirsList store={store} />} />
        <Route path="avoirs/nouveau" element={<AvoirForm store={store} />} />
        <Route path="avoirs/:id" element={<AvoirForm store={store} />} />
        <Route path="calendrier" element={<Calendrier store={store} />} />
        <Route path="agenda" element={<Agenda store={store} />} />
        <Route path="dossier-client" element={<DossierClient store={store} />} />
        <Route path="comptabilite" element={<Comptabilite store={store} />} />
        <Route path="management/*" element={<Management store={store} />} />
        <Route path="parametres" element={<Parametres store={store} />} />
      </Route>
    </Routes>
  );
}
