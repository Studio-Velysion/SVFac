import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, FileText, Copy, Receipt, Trash2 } from 'lucide-react';
import { useState } from 'react';
import styles from './DevisList.module.css';

export default function DevisList({ store }) {
  const navigate = useNavigate();
  const { state, transformDevisToFacture, duplicateDocument } = store;
  const [search, setSearch] = useState('');

  const validiteJours = state.settings.validiteDevisJours || 30;
  const maintenant = new Date();

  const devis = state.devis
    .filter((d) => {
      const q = search.toLowerCase();
      return (
        (d.ref || '').toLowerCase().includes(q) ||
        (state.clients.find((c) => c.id === d.clientId)?.name ?? '').toLowerCase().includes(q) ||
        (state.clients.find((c) => c.id === d.clientId)?.company ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getClient = (id) => state.clients.find((c) => c.id === id);

  const isExpired = (d) => {
    if (d.transformeEnFacture) return false;
    const dateLimite = new Date(d.date);
    dateLimite.setDate(dateLimite.getDate() + validiteJours);
    return dateLimite < maintenant;
  };

  const handleTransform = (devisId) => {
    const factureId = transformDevisToFacture(devisId);
    if (factureId) navigate(`/factures/${factureId}`);
  };

  const handleDuplicate = (d) => {
    const newId = duplicateDocument(d);
    if (newId) navigate(`/devis/${newId}`);
  };

  return (
    <div className={styles.page}>
      <div className="page-header">
        <h1 className="page-title">Devis</h1>
        <Link to="/devis/nouveau" className="btn btn-primary">
          <Plus size={18} />
          Nouveau devis
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
              <th>Validité</th>
              <th>Total TTC</th>
              <th>Statut</th>
              <th width="200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {devis.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  <p>Aucun devis.</p>
                  <Link to="/devis/nouveau" className="btn btn-primary">
                    <Plus size={18} /> Nouveau devis
                  </Link>
                </td>
              </tr>
            ) : (
              devis.map((d) => {
                const expired = isExpired(d);
                return (
                  <tr key={d.id} className={expired ? styles.rowExpired : ''}>
                    <td>
                      <Link to={`/devis/${d.id}`} className={styles.ref}>
                        {d.ref}
                      </Link>
                    </td>
                    <td>{getClient(d.clientId)?.company || getClient(d.clientId)?.name || '—'}</td>
                    <td>{d.date ? format(new Date(d.date), 'dd/MM/yyyy', { locale: fr }) : '—'}</td>
                    <td>
                      {d.date
                        ? format(
                            new Date(new Date(d.date).setDate(new Date(d.date).getDate() + validiteJours)),
                            'dd/MM/yyyy',
                            { locale: fr }
                          )
                        : '—'}
                    </td>
                    <td>
                      {d.totalTTC != null
                        ? `${Number(d.totalTTC).toFixed(2)} ${state.settings.devise}`
                        : '—'}
                    </td>
                    <td>
                      {d.transformeEnFacture ? (
                        <span className="badge badge-success">Transformé en facture</span>
                      ) : expired ? (
                        <span className="badge badge-danger">Expiré</span>
                      ) : (
                        <span className="badge badge-warning">En attente</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link to={`/devis/${d.id}`} className="btn btn-ghost" title="Modifier">
                          <FileText size={16} />
                        </Link>
                        {!d.transformeEnFacture && (
                          <button
                            type="button"
                            className="btn btn-ghost"
                            title="Transformer en facture"
                            onClick={() => handleTransform(d.id)}
                          >
                            <Receipt size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-ghost"
                          title="Dupliquer"
                          onClick={() => handleDuplicate(d)}
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
