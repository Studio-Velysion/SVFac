import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Plus, Receipt, Copy, CheckCircle, X } from 'lucide-react';
import { useState } from 'react';
import { getPaymentMethodLabel, PAYMENT_METHODS } from '../lib/paymentMethods';
import styles from './FacturesList.module.css';

export default function FacturesList({ store }) {
  const navigate = useNavigate();
  const { state, setFactureReglee, duplicateDocument } = store;
  const [search, setSearch] = useState('');
  const [regleeModal, setRegleeModal] = useState(null);
  const [regleeDate, setRegleeDate] = useState(new Date().toISOString().slice(0, 10));
  const [regleeModePaiement, setRegleeModePaiement] = useState('virement');

  const factures = state.factures
    .filter((f) => {
      const q = search.toLowerCase();
      const client = state.clients.find((c) => c.id === f.clientId);
      return (
        (f.ref || '').toLowerCase().includes(q) ||
        (client?.name ?? '').toLowerCase().includes(q) ||
        (client?.company ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getClient = (id) => state.clients.find((c) => c.id === id);

  const openRegleeModal = (id) => {
    setRegleeModal(id);
    setRegleeDate(new Date().toISOString().slice(0, 10));
    setRegleeModePaiement('virement');
  };

  const confirmMarquerReglee = () => {
    if (regleeModal) {
      setFactureReglee(regleeModal, regleeDate, undefined, regleeModePaiement);
      setRegleeModal(null);
    }
  };

  const handleDuplicate = (doc) => {
    const newId = duplicateDocument(doc);
    if (newId) navigate(`/factures/${newId}`);
  };

  return (
    <div className={styles.page}>
      <div className="page-header">
        <h1 className="page-title">Factures</h1>
        <Link to="/factures/nouveau" className="btn btn-primary">
          <Plus size={18} />
          Nouvelle facture
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
              <th>Statut</th>
              <th>Mode de paiement</th>
              <th width="200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {factures.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  <p>Aucune facture.</p>
                  <Link to="/factures/nouveau" className="btn btn-primary">
                    <Plus size={18} /> Nouvelle facture
                  </Link>
                </td>
              </tr>
            ) : (
              factures.map((f) => (
                <tr
                  key={f.id}
                  className={f.status === 'reglee' ? styles.rowPaid : styles.rowUnpaid}
                >
                  <td>
                    <Link to={`/factures/${f.id}`} className={styles.ref}>
                      {f.ref}
                    </Link>
                  </td>
                  <td>{getClient(f.clientId)?.company || getClient(f.clientId)?.name || '—'}</td>
                  <td>{f.date ? format(new Date(f.date), 'dd/MM/yyyy', { locale: fr }) : '—'}</td>
                  <td>
                    {f.totalTTC != null
                      ? `${Number(f.totalTTC).toFixed(2)} ${state.settings.devise}`
                      : '—'}
                  </td>
                  <td>
                    {f.status === 'reglee' ? (
                      <span className="badge badge-success">Réglée</span>
                    ) : (
                      <span className="badge badge-danger">Non réglée</span>
                    )}
                  </td>
                  <td>{getPaymentMethodLabel(f.modePaiement) || '—'}</td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/factures/${f.id}`} className="btn btn-ghost" title="Voir / Modifier">
                        <Receipt size={16} />
                      </Link>
                      {f.status !== 'reglee' && (
                        <button
                          type="button"
                          className="btn btn-ghost"
                          title="Marquer comme réglée"
                          onClick={() => openRegleeModal(f.id)}
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-ghost"
                        title="Dupliquer"
                        onClick={() => handleDuplicate(f)}
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

      {regleeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Marquer comme réglée</h3>
              <button type="button" className="btn btn-ghost" onClick={() => setRegleeModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Date de règlement</label>
                <input type="date" className="input" value={regleeDate} onChange={(e) => setRegleeDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Mode de paiement</label>
                <select className="input" value={regleeModePaiement} onChange={(e) => setRegleeModePaiement(e.target.value)}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-primary" onClick={confirmMarquerReglee}>Confirmer</button>
                <button type="button" className="btn btn-ghost" onClick={() => setRegleeModal(null)}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
