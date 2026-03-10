import { Link } from 'react-router-dom';
import { Search, FolderOpen, FileText, Receipt, Plus, Pencil, Trash2, FileSignature, Save, X } from 'lucide-react';
import { useState } from 'react';
import ClientDossierModal from '../components/ClientDossierModal';
import styles from './Clients.module.css';

const TAB_DOSSIERS = 'dossiers';
const TAB_CONTRATS = 'contrats';

export default function DossierClient({ store }) {
  const { state, deleteContract, addContract, updateContract } = store;
  const [search, setSearch] = useState('');
  const [dossierClient, setDossierClient] = useState(null);
  const [activeTab, setActiveTab] = useState(TAB_DOSSIERS);
  const [contractModal, setContractModal] = useState(false);
  const [editingContractId, setEditingContractId] = useState(null);
  const [contractForm, setContractForm] = useState({
    clientId: '',
    ref: '',
    titre: '',
    dateDebut: '',
    dateFin: '',
    montant: '',
    statut: 'en_cours',
    note: '',
  });

  const basePath = state?.settings?.clientFolderPath;
  const hasElectron = typeof window !== 'undefined' && window.electronAPI;
  const clients = state.clients || [];
  const devis = state.devis || [];
  const factures = state.factures || [];
  const contracts = state.contracts || [];

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q)
    );
  });

  const getCounts = (clientId) => {
    const d = devis.filter((doc) => doc.clientId === clientId).length;
    const f = factures.filter((doc) => doc.clientId === clientId).length;
    return { devis: d, factures: f };
  };

  const getClientName = (clientId) => {
    const c = clients.find((x) => x.id === clientId);
    return c ? (c.company || c.name || '—') : '—';
  };

  const openNewContract = () => {
    setEditingContractId(null);
    setContractForm({
      clientId: '',
      ref: '',
      titre: '',
      dateDebut: '',
      dateFin: '',
      montant: '',
      statut: 'en_cours',
      note: '',
    });
    setContractModal(true);
  };

  const openEditContract = (ct) => {
    setEditingContractId(ct.id);
    setContractForm({
      clientId: ct.clientId || '',
      ref: ct.ref || '',
      titre: ct.titre || '',
      dateDebut: ct.dateDebut ? ct.dateDebut.slice(0, 10) : '',
      dateFin: ct.dateFin ? ct.dateFin.slice(0, 10) : '',
      montant: ct.montant != null ? String(ct.montant) : '',
      statut: ct.statut || 'en_cours',
      note: ct.note || '',
    });
    setContractModal(true);
  };

  const handleContractSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...contractForm,
      montant: contractForm.montant ? parseFloat(contractForm.montant.replace(',', '.')) : null,
    };
    if (editingContractId) {
      updateContract(editingContractId, payload);
    } else {
      addContract(payload);
    }
    setContractModal(false);
  };

  const handleDeleteContract = (e, id, titre) => {
    e.preventDefault();
    if (window.confirm(`Supprimer le contrat « ${titre} » ?`)) deleteContract(id);
  };

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
  const formatMontant = (m) => (m != null ? `${Number(m).toFixed(2)} €` : '—');

  return (
    <div className={styles.page}>
      <div className="page-header">
        <h1 className="page-title">Dossier client</h1>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-separator)', paddingBottom: 0 }}>
        <button
          type="button"
          className={`btn ${activeTab === TAB_DOSSIERS ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab(TAB_DOSSIERS)}
        >
          <FolderOpen size={18} /> Dossiers clients
        </button>
        <button
          type="button"
          className={`btn ${activeTab === TAB_CONTRATS ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab(TAB_CONTRATS)}
        >
          <FileSignature size={18} /> Créer / Gérer contrats
        </button>
      </div>

      {activeTab === TAB_DOSSIERS && (
        <>
          <p className="label" style={{ marginBottom: '1rem' }}>
            Accédez au dossier de chaque client (devis, factures, documents). Configurez l’emplacement des dossiers dans Paramètres.
          </p>
          <div className={styles.toolbar}>
            <div className={styles.search}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="search"
                className="input"
                placeholder="Rechercher un client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Devis</th>
                  <th>Factures</th>
                  <th width="140">Dossier</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      <p>Aucun client. Ajoutez des clients depuis la page Clients.</p>
                      <Link to="/clients" className="btn btn-primary">
                        Voir les clients
                      </Link>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const { devis: nd, factures: nf } = getCounts(c.id);
                    return (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.company || c.name || 'Sans nom'}</strong>
                          {c.name && c.company && (
                            <span className={styles.clientSub}> {c.name}</span>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-warning">
                            <FileText size={12} /> {nd}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-success">
                            <Receipt size={12} /> {nf}
                          </span>
                        </td>
                        <td>
                          {hasElectron && basePath ? (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => setDossierClient(c)}
                            >
                              <FolderOpen size={16} /> Ouvrir le dossier
                            </button>
                          ) : (
                            <span className="empty-state">Configurer dans Paramètres</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === TAB_CONTRATS && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button type="button" className="btn btn-primary" onClick={openNewContract}>
              <Plus size={18} /> Nouveau contrat
            </button>
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
                      <button type="button" className="btn btn-primary" onClick={openNewContract}>
                        <Plus size={18} /> Nouveau contrat
                      </button>
                    </td>
                  </tr>
                ) : (
                  contracts.map((ct) => (
                    <tr key={ct.id}>
                      <td>
                        <button
                          type="button"
                          className={styles.clientName}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', color: 'inherit' }}
                          onClick={() => openEditContract(ct)}
                        >
                          {ct.ref ? `${ct.ref} — ` : ''}{ct.titre || 'Sans titre'}
                        </button>
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
                        <button type="button" className="btn btn-ghost" onClick={() => openEditContract(ct)} title="Modifier">
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          title="Supprimer"
                          onClick={(e) => handleDeleteContract(e, ct.id, ct.titre)}
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
        </>
      )}

      {dossierClient && basePath && (
        <ClientDossierModal
          client={dossierClient}
          basePath={basePath}
          onClose={() => setDossierClient(null)}
          store={store}
        />
      )}

      {contractModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div className="card" style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{editingContractId ? 'Modifier le contrat' : 'Nouveau contrat'}</h3>
              <button type="button" className="btn btn-ghost" onClick={() => setContractModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleContractSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Client</label>
                <select
                  className="input"
                  value={contractForm.clientId}
                  onChange={(e) => setContractForm((f) => ({ ...f, clientId: e.target.value }))}
                  required
                >
                  <option value="">— Choisir —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company || c.name || 'Sans nom'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Référence (optionnel)</label>
                <input
                  type="text"
                  className="input"
                  value={contractForm.ref}
                  onChange={(e) => setContractForm((f) => ({ ...f, ref: e.target.value }))}
                  placeholder="Ex: CONT-2024-001"
                />
              </div>
              <div>
                <label className="label">Titre du contrat</label>
                <input
                  type="text"
                  className="input"
                  value={contractForm.titre}
                  onChange={(e) => setContractForm((f) => ({ ...f, titre: e.target.value }))}
                  placeholder="Intitulé du contrat"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Date de début</label>
                  <input
                    type="date"
                    className="input"
                    value={contractForm.dateDebut}
                    onChange={(e) => setContractForm((f) => ({ ...f, dateDebut: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Date de fin</label>
                  <input
                    type="date"
                    className="input"
                    value={contractForm.dateFin}
                    onChange={(e) => setContractForm((f) => ({ ...f, dateFin: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="label">Montant (€)</label>
                <input
                  type="text"
                  className="input"
                  value={contractForm.montant}
                  onChange={(e) => setContractForm((f) => ({ ...f, montant: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="label">Statut</label>
                <select
                  className="input"
                  value={contractForm.statut}
                  onChange={(e) => setContractForm((f) => ({ ...f, statut: e.target.value }))}
                >
                  <option value="en_cours">En cours</option>
                  <option value="termine">Terminé</option>
                  <option value="resilie">Résilié</option>
                </select>
              </div>
              <div>
                <label className="label">Note</label>
                <textarea
                  className="input"
                  rows={3}
                  value={contractForm.note}
                  onChange={(e) => setContractForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Notes libres..."
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={18} /> {editingContractId ? 'Enregistrer' : 'Créer'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setContractModal(false)}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
