import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, FileMinus, Copy } from 'lucide-react';
import { useState } from 'react';
import styles from './AvoirsList.module.css';

export default function AvoirsList({ store }) {
  const navigate = useNavigate();
  const { state, duplicateDocument } = store;
  const [search, setSearch] = useState('');

  const avoirs = (state.avoirs || [])
    .filter((a) => {
      const q = search.toLowerCase();
      const client = state.clients.find((c) => c.id === a.clientId);
      return (
        (a.ref || '').toLowerCase().includes(q) ||
        (client?.name ?? '').toLowerCase().includes(q) ||
        (client?.company ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getClient = (id) => state.clients.find((c) => c.id === id);

  const handleDuplicate = (doc) => {
    const newId = duplicateDocument(doc);
    if (newId) navigate(`/avoirs/${newId}`);
  };

  return (
    <div className={styles.page}>
      <div className="page-header">
        <h1 className="page-title">Avoirs</h1>
        <Link to="/avoirs/nouveau" className="btn btn-primary">
          <Plus size={18} />
          Nouvel avoir
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
            {avoirs.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  <p>Aucun avoir.</p>
                  <Link to="/avoirs/nouveau" className="btn btn-primary">
                    <Plus size={18} /> Nouvel avoir
                  </Link>
                </td>
              </tr>
            ) : (
              avoirs.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link to={`/avoirs/${a.id}`} className={styles.ref}>
                      {a.ref}
                    </Link>
                  </td>
                  <td>{getClient(a.clientId)?.company || getClient(a.clientId)?.name || '—'}</td>
                  <td>{a.date ? format(new Date(a.date), 'dd/MM/yyyy', { locale: fr }) : '—'}</td>
                  <td>
                    {a.totalTTC != null
                      ? `${Number(a.totalTTC).toFixed(2)} ${state.settings.devise}`
                      : '—'}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/avoirs/${a.id}`} className="btn btn-ghost" title="Voir / Modifier">
                        <FileMinus size={16} />
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        title="Dupliquer"
                        onClick={() => handleDuplicate(a)}
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
