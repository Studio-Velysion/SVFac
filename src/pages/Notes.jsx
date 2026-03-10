import { useState } from 'react';
import { StickyNote, Folder } from 'lucide-react';
import ClientDossierModal from '../components/ClientDossierModal';
import styles from './Notes.module.css';

export default function Notes({ store }) {
  const { state } = store || {};
  const basePath = state?.settings?.clientFolderPath;
  const clients = state?.clients || [];
  const [search, setSearch] = useState('');
  const [dossierClient, setDossierClient] = useState(null);

  const hasElectron = typeof window !== 'undefined' && window.electronAPI;
  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.page}>
      <h1 className="page-title">
        <StickyNote size={24} /> Notes & dossiers clients
      </h1>
      <p className={styles.intro}>
        Le dossier de base pour tous les clients est défini <strong>une seule fois</strong> dans Paramètres (onglet « Emplacement dossier client »). Chaque client a ensuite son sous-dossier. Cliquez sur un client pour ouvrir son dossier : voir le contenu, ajouter des notes, créer des sous-dossiers, supprimer des fichiers.
      </p>

      {!hasElectron && (
        <div className={styles.alert}>
          Les dossiers clients sont disponibles dans l’application Electron (fenêtre Windows).
          Ouvrez l’app avec <strong>Lancer-app.bat</strong> ou <strong>npm run start</strong>.
        </div>
      )}

      {hasElectron && !basePath && (
        <div className={styles.alert}>
          Définissez l’<strong>Emplacement dossier client</strong> dans Paramètres (bouton « Parcourir ») pour utiliser les dossiers clients. Ce chemin s’applique à tous les clients.
        </div>
      )}

      {hasElectron && basePath && (
        <>
          <div className={styles.toolbar}>
            <input
              type="search"
              className="input"
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: '320px' }}
            />
          </div>
          <div className={styles.clientGrid}>
            {filtered.length === 0 ? (
              <p className={styles.empty}>Aucun client. Ajoutez un client dans l’onglet Clients.</p>
            ) : (
              filtered.map((c) => (
                <div key={c.id} className={styles.clientCard}>
                  <div className={styles.clientCardName}>
                    {c.company || c.name || 'Sans nom'}
                  </div>
                  {c.name && c.company && (
                    <div className={styles.clientCardSub}>{c.name}</div>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setDossierClient(c)}
                  >
                    <Folder size={16} /> Ouvrir le dossier
                  </button>
                </div>
              ))
            )}
          </div>
          {dossierClient && (
            <ClientDossierModal
              client={dossierClient}
              basePath={basePath}
              onClose={() => setDossierClient(null)}
              store={store}
            />
          )}
        </>
      )}
    </div>
  );
}
