import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, FileText, Copy } from 'lucide-react';
import { useState } from 'react';
import styles from './LivraisonsList.module.css';

export default function LivraisonsList({ store }) {
  const navigate = useNavigate();
  const { state, duplicateDocument } = store;
  const [search, setSearch] = useState('');

  const livraisons = (state.bonsLivraison || [])
    .filter((bl) => {
      const q = search.toLowerCase();
      const client = state.clients.find((c) => c.id === bl.clientId);
      return (
        (bl.ref || '').toLowerCase().includes(q) ||
        (client?.name ?? '').toLowerCase().includes(q) ||
        (client?.company ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getClient = (id) => state.clients.find((c) => c.id === id);

  const handleDuplicate = (doc) => {
    const newId = duplicateDocument(doc);
    if (newId) navigate(`/livraisons/${newId}`);
  };

  return (
    <div className={styles.page}>
      <div className="page-header">
        <h1 className="page-title">Bons de livraison</h1>
        <Link to="/livraisons/nouveau" className="btn btn-primary">
          <Plus size={18} />
          Nouveau bon de livraison
        </Link>
      </div>

      <div className={styles.toolbar}>
        <input
          type="search"
          className="input"
          style={{ maxWidth: '320px' }}
          placeholder="Rechercher par référence ou client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Réf.</th>
              <th>Client</th>
              <th>Date</th>
              <th>Total TTC</th>
              <th width="120">Actions</th>
            </tr>
          </thead>
          <tbody>
            {livraisons.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  <p>Aucun bon de livraison.</p>
                  <Link to="/livraisons/nouveau" className="btn btn-primary">
                    <Plus size={18} /> Nouveau bon de livraison
                  </Link>
                </td>
              </tr>
            ) : (
              livraisons.map((bl) => (
                <tr key={bl.id}>
                  <td>
                    <Link to={`/livraisons/${bl.id}`} className={styles.ref}>
                      {bl.ref}
                    </Link>
                  </td>
                  <td>{getClient(bl.clientId)?.company || getClient(bl.clientId)?.name || '—'}</td>
                  <td>{bl.date ? format(new Date(bl.date), 'dd/MM/yyyy', { locale: fr }) : '—'}</td>
                  <td>
                    {bl.totalTTC != null
                      ? `${Number(bl.totalTTC).toFixed(2)} ${state.settings.devise}`
                      : '—'}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/livraisons/${bl.id}`} className="btn btn-ghost" title="Voir / Modifier">
                        <FileText size={16} />
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        title="Dupliquer"
                        onClick={() => handleDuplicate(bl)}
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
