import { Link } from 'react-router-dom';
import { Plus, Search, Mail, Pencil, Trash2, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import ClientDossierModal from '../components/ClientDossierModal';
import styles from './Clients.module.css';

export default function Clients({ store }) {
  const { state, deleteClient } = store;
  const [search, setSearch] = useState('');
  const [dossierClient, setDossierClient] = useState(null);
  const basePath = state?.settings?.clientFolderPath;
  const hasElectron = typeof window !== 'undefined' && window.electronAPI;

  const filtered = state.clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q)
    );
  });

  const handleDelete = (e, id, name) => {
    e.preventDefault();
    if (window.confirm(`Supprimer le client « ${name} » ?`)) deleteClient(id);
  };

  return (
    <div className={styles.page}>
      <div className="page-header">
        <h1 className="page-title">Clients & prospects</h1>
        <Link to="/clients/nouveau" className="btn btn-primary">
          <Plus size={18} />
          Nouveau client
        </Link>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="search"
            className="input"
            placeholder="Rechercher par nom, email, société..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom / Société</th>
              <th>Email</th>
              <th>Téléphone</th>
              <th>Adresse</th>
              <th width="120">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  <p>Aucun client. Ajoutez un client pour créer des devis et factures.</p>
                  <Link to="/clients/nouveau" className="btn btn-primary">
                    <Plus size={18} /> Nouveau client
                  </Link>
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/clients/${c.id}`} className={styles.clientName}>
                      {c.company || c.name || 'Sans nom'}
                    </Link>
                    {c.name && c.company && (
                      <span className={styles.clientSub}>{c.name}</span>
                    )}
                  </td>
                  <td>
                    {c.email ? (
                      <a href={`mailto:${c.email}`} className={styles.email}>
                        <Mail size={14} /> {c.email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{c.phone || '—'}</td>
                  <td className={styles.address}>
                    {[c.address, c.postalCode, c.city].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {hasElectron && basePath && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          title="Ouvrir le dossier"
                          onClick={() => setDossierClient(c)}
                        >
                          <FolderOpen size={16} />
                        </button>
                      )}
                      <Link to={`/clients/${c.id}`} className="btn btn-ghost" title="Modifier">
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        title="Supprimer"
                        onClick={(e) => handleDelete(e, c.id, c.company || c.name)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {dossierClient && basePath && (
        <ClientDossierModal
          client={dossierClient}
          basePath={basePath}
          onClose={() => setDossierClient(null)}
          store={store}
        />
      )}
    </div>
  );
}
