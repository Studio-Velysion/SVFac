import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import styles from './ClientForm.module.css';

const UNITS = ['u', 'h', 'j', 'kg', 'L', 'm', 'm²', 'm³', 'lot', 'forfait'];

const emptyProduct = {
  name: '',
  reference: '',
  description: '',
  family: '',
  priceHT: '',
  tva: null,
  unit: 'u',
};

export default function ProduitForm({ store }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, addProduct, updateProduct, addFamily } = store;
  const isNew = id === 'nouveau' || !id;

  const existing = state.products.find((p) => p.id === id);
  const [form, setForm] = useState({ ...emptyProduct, family: state.families[0] || '' });
  const [newFamily, setNewFamily] = useState('');
  const defaultTva = state.settings.tvaRate ?? 0;
  const tvaDisplay = form.tva !== '' && form.tva != null ? String(form.tva) : String(defaultTva);
  const [tvaInput, setTvaInput] = useState(tvaDisplay);

  useEffect(() => {
    if (!isNew && existing) {
      setForm({
        name: existing.name ?? '',
        reference: existing.reference ?? '',
        description: existing.description ?? '',
        family: existing.family ?? state.families[0],
        priceHT: existing.priceHT ?? existing.price ?? '',
        tva: existing.tva ?? null,
        unit: existing.unit ?? 'u',
      });
      setTvaInput(String(existing.tva ?? state.settings.tvaRate ?? 0));
    } else if (isNew) {
      setForm({ ...emptyProduct, family: state.families[0] || '' });
      setTvaInput(String(state.settings.tvaRate ?? 0));
    }
  }, [id, isNew, existing?.id, state.families[0], state.settings.tvaRate]);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleAddFamily = () => {
    if (newFamily.trim()) {
      addFamily(newFamily.trim());
      handleChange('family', newFamily.trim());
      setNewFamily('');
    }
  };

  const parseTva = (raw) => {
    const n = parseFloat(String(raw).replace(',', '.'));
    return Number.isNaN(n) ? (state.settings.tvaRate ?? 0) : n;
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    const tvaVal = parseTva(tvaInput);
    const payload = {
      ...form,
      priceHT: form.priceHT === '' ? 0 : Number(form.priceHT),
      tva: tvaVal,
    };
    if (isNew) {
      const newId = addProduct(payload);
      navigate(`/produits/${newId}`);
    } else {
      updateProduct(id, payload);
      navigate('/produits');
    }
  };

  return (
    <div className={styles.page}>
      <div className="page-header">
        <Link to="/produits" className="btn btn-ghost">
          <ArrowLeft size={18} /> Retour
        </Link>
        <h1 className="page-title">{isNew ? 'Nouveau produit' : 'Modifier le produit'}</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 className={styles.blockTitle}>Désignation</h2>
          <div className={styles.grid}>
            <div>
              <label className="label">Référence</label>
              <input
                type="text"
                className="input"
                value={form.reference}
                onChange={(e) => handleChange('reference', e.target.value)}
                placeholder="REF-001"
              />
            </div>
            <div>
              <label className="label">Famille</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  className="input"
                  value={form.family}
                  onChange={(e) => handleChange('family', e.target.value)}
                >
                  {state.families.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <input
                  type="text"
                  className="input"
                  placeholder="Nouvelle famille"
                  value={newFamily}
                  onChange={(e) => setNewFamily(e.target.value)}
                  onBlur={handleAddFamily}
                />
              </div>
            </div>
            <div className={styles.full}>
              <label className="label">Désignation</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nom du produit ou prestation"
                required
              />
            </div>
            <div className={styles.full}>
              <label className="label">Description (optionnel)</label>
              <textarea
                className="input"
                rows={2}
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Description détaillée"
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 className={styles.blockTitle}>Tarification</h2>
          <div className={styles.grid}>
            <div>
              <label className="label">Prix unitaire HT</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={form.priceHT}
                onChange={(e) => handleChange('priceHT', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="label">TVA (%)</label>
              <input
                type="text"
                inputMode="decimal"
                className="input"
                value={tvaInput}
                onChange={(e) => setTvaInput(e.target.value)}
                onBlur={() => {
                  const raw = String(tvaInput).trim().replace(',', '.');
                  const num = parseFloat(raw);
                  if (raw !== '' && !Number.isNaN(num) && num >= 0 && num <= 100) {
                    handleChange('tva', num);
                  } else {
                    setTvaInput(String(state.settings.tvaRate ?? 0));
                    handleChange('tva', state.settings.tvaRate ?? 0);
                  }
                }}
                placeholder={String(state.settings.tvaRate ?? 0)}
              />
              <span style={{ fontSize: '0.75rem', marginTop: 2, display: 'block', color: 'var(--color-text-secondary, #888)' }}>Point ou virgule acceptés</span>
            </div>
            {state.settings.showUnits !== false && (
              <div>
                <label className="label">Unité</label>
                <select
                  className="input"
                  value={form.unit}
                  onChange={(e) => handleChange('unit', e.target.value)}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <Link to="/produits" className="btn btn-secondary">Annuler</Link>
          <button type="submit" className="btn btn-primary">
            <Save size={18} /> {isNew ? 'Créer le produit' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
