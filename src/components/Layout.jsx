import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  Receipt,
  Truck,
  FileMinus,
  Calendar,
  Phone,
  FolderOpen,
  Calculator,
  CheckSquare,
  Settings,
  Sun,
  Moon,
  HelpCircle,
  Info,
  Download,
} from 'lucide-react';
import AideModal from './AideModal';
import InfoLogicielModal from './InfoLogicielModal';
import UpdatePopup from './UpdatePopup';
import { checkForUpdate, getIgnoredUpdateVersion, setIgnoredUpdateVersion } from '../lib/updates';
import styles from './Layout.module.css';

// Logo de l’application en haut à gauche (public/icon.png)
const appLogoUrl = `${import.meta.env.BASE_URL}logo-transparent.png`;

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/produits', icon: Package, label: 'Produits' },
  { to: '/devis', icon: FileText, label: 'Devis' },
  { to: '/factures', icon: Receipt, label: 'Factures' },
  { to: '/livraisons', icon: Truck, label: 'Bons de livraison' },
  { to: '/avoirs', icon: FileMinus, label: 'Avoirs' },
  { to: '/calendrier', icon: Calendar, label: 'Calendrier' },
  { to: '/agenda', icon: Phone, label: 'Agenda' },
  { to: '/dossier-client', icon: FolderOpen, label: 'Dossier client' },
  { to: '/comptabilite', icon: Calculator, label: 'Comptabilité' },
  { to: '/management', icon: CheckSquare, label: 'Tâches' },
  { to: '/parametres', icon: Settings, label: 'Paramètres' },
];

export default function Layout({ store }) {
  const theme = store?.state?.settings?.theme || 'dark';
  const setTheme = (value) => store?.updateSettings?.({ theme: value });
  const [aideOpen, setAideOpen] = useState(false);
  const [infoLogicielOpen, setInfoLogicielOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdatePopup, setShowUpdatePopup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await checkForUpdate();
      if (cancelled || !result.available) return;
      setUpdateInfo({ version: result.version, url: result.url, body: result.body });
      const ignored = getIgnoredUpdateVersion();
      if (ignored !== result.version) setShowUpdatePopup(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleIgnoreUpdate = () => {
    if (updateInfo?.version) {
      setIgnoredUpdateVersion(updateInfo.version);
      setShowUpdatePopup(false);
    }
  };

  const showUpdateButton = updateInfo && getIgnoredUpdateVersion() === updateInfo.version;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandLogoWrap} aria-hidden>
            <img src={appLogoUrl} alt="" className={styles.brandLogo} />
          </div>
          <span className={styles.brandText}>SVFac</span>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <nav className={styles.nav}>
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
              end={to === '/'}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
      <div className={styles.aideButtons}>
        {showUpdateButton && (
          <button
            type="button"
            className={styles.aideBtn}
            onClick={() => setShowUpdatePopup(true)}
            title="Mise à jour disponible"
            aria-label="Mise à jour disponible"
          >
            <Download size={22} /> Mise à jour
          </button>
        )}
        <button
          type="button"
          className={styles.aideBtn}
          onClick={() => setInfoLogicielOpen(true)}
          title="Information du logiciel"
          aria-label="Information du logiciel"
        >
          <Info size={22} /> Information du logiciel
        </button>
        <button
          type="button"
          className={styles.aideBtn}
          onClick={() => setAideOpen(true)}
        title="Aide"
        aria-label="Ouvrir l’aide"
      >
        <HelpCircle size={22} /> Aide
        </button>
      </div>
      <AideModal open={aideOpen} onClose={() => setAideOpen(false)} />
      <InfoLogicielModal open={infoLogicielOpen} onClose={() => setInfoLogicielOpen(false)} />
      <UpdatePopup
        open={showUpdatePopup}
        onClose={() => setShowUpdatePopup(false)}
        onIgnore={handleIgnoreUpdate}
        update={updateInfo}
      />
    </div>
  );
}
