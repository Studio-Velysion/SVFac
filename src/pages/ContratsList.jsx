import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import styles from './Clients.module.css';

export default function ContratsList({ store }) {
  const { state, deleteContract } = store;
  const contracts = state.contracts || [];
  const clients = state.clients || [];

  const getClientName = (clientId) => {
    const c = clients.find((x) => x.id === clientId);
    return c ? (c.company || c.name || '—') : '—';
  };

  const handleDelete = (e, id, titre) => {
    e.preventDefault();
    if (window.confirm(`Supprimer le contrat « ${titre} » ?`)) deleteContract(id);
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
  const formatMontant = (m) => (m != null ? `${Number(m).toFixed(2)} €` : '—');

  return (
    <div className={styles.page}>
      <div className="page-header">
        <h1 className="page-title">Créer / Gérer contrats</h1>
        <Link to="/contrats/nouveau" className="btn btn-primary">
          <Plus size={18} /> Nouveau contrat
        </Link>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Réf. / Titre</th>
              <th>Client</th>
              <th>Début</th>
              <th>Fin</th>
              <th>Montant</th>
              <th>Statut</th>
              <th width="120">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  <p>Aucun contrat.</p>
                  <Link to="/contrats/nouveau" className="btn btn-primary">
                    <Plus size={18} /> Nouveau contrat
                  </Link>
                </td>
              </tr>
            ) : (
              contracts.map((ct) => (
                <tr key={ct.id}>
                  <td>
                    <Link to={`/contrats/${ct.id}`} className={styles.clientName}>
                      {ct.ref ? `${ct.ref} — ` : ''}{ct.titre || 'Sans titre'}
                    </Link>
                  </td>
                  <td>{getClientName(ct.clientId)}</td>
                  <td>{formatDate(ct.dateDebut)}</td>
                  <td>{formatDate(ct.dateFin)}</td>
                  <td>{formatMontant(ct.montant)}</td>
                  <td>
                    <span
                      className={
                        ct.statut === 'termine'
                          ? 'badge badge-success'
                          : ct.statut === 'resilie'
                          ? 'badge badge-danger'
                          : 'badge badge-warning'
                      }
                    >
                      {ct.statut === 'termine' ? 'Terminé' : ct.statut === 'resilie' ? 'Résilié' : 'En cours'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/contrats/${ct.id}`} className="btn btn-ghost" title="Modifier">
                      <Pencil size={16} />
                    </Link>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      title="Supprimer"
                      onClick={(e) => handleDelete(e, ct.id, ct.titre)}
                    >
                      <Trash2 size={16} />
                    </button>
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
