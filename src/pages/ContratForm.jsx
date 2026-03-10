import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save } from 'lucide-react';

export default function ContratForm({ store }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, addContract, updateContract } = store;
  const isNew = !id || id === 'nouveau';
  const contract = state.contracts?.find((c) => c.id === id) || null;
  const clients = state.clients || [];

  const [form, setForm] = useState({
    clientId: '',
    ref: '',
    titre: '',
    dateDebut: '',
    dateFin: '',
    montant: '',
    statut: 'en_cours',
    note: '',
  });

  useEffect(() => {
    if (!isNew && contract) {
      setForm({
        clientId: contract.clientId || '',
        ref: contract.ref || '',
        titre: contract.titre || '',
        dateDebut: contract.dateDebut ? contract.dateDebut.slice(0, 10) : '',
        dateFin: contract.dateFin ? contract.dateFin.slice(0, 10) : '',
        montant: contract.montant != null ? String(contract.montant) : '',
        statut: contract.statut || 'en_cours',
        note: contract.note || '',
      });
    }
  }, [isNew, contract]);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      montant: form.montant ? parseFloat(form.montant.replace(',', '.')) : null,
    };
    if (isNew) {
      addContract(payload);
      navigate('/contrats');
    } else {
      updateContract(id, payload);
      navigate('/contrats');
    }
  };

  return (
    <div className="page-header" style={{ flexDirection: 'column', alignItems: 'stretch', maxWidth: 640 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title">{isNew ? 'Nouveau contrat' : 'Modifier le contrat'}</h1>
        <Link to="/contrats" className="btn btn-ghost">
          Retour
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="label">Client</label>
            <select
              className="input"
              value={form.clientId}
              onChange={(e) => handleChange('clientId', e.target.value)}
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
              value={form.ref}
              onChange={(e) => handleChange('ref', e.target.value)}
              placeholder="Ex: CONT-2024-001"
            />
          </div>
          <div>
            <label className="label">Titre du contrat</label>
            <input
              type="text"
              className="input"
              value={form.titre}
              onChange={(e) => handleChange('titre', e.target.value)}
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
                value={form.dateDebut}
                onChange={(e) => handleChange('dateDebut', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Date de fin</label>
              <input
                type="date"
                className="input"
                value={form.dateFin}
                onChange={(e) => handleChange('dateFin', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Montant (€)</label>
            <input
              type="text"
              className="input"
              value={form.montant}
              onChange={(e) => handleChange('montant', e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="label">Statut</label>
            <select
              className="input"
              value={form.statut}
              onChange={(e) => handleChange('statut', e.target.value)}
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
              value={form.note}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder="Notes libres..."
            />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={18} /> {isNew ? 'Créer' : 'Enregistrer'}
            </button>
            <Link to="/contrats" className="btn btn-ghost">
              Annuler
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
