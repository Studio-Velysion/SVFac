import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save, FileDown, Mail, StickyNote } from 'lucide-react';
import DocumentEditor from '../components/DocumentEditor';
import { documentTotals, recalcLines } from '../lib/documentUtils';
import DocumentPrint from '../components/DocumentPrint';
import EmailModal from '../components/EmailModal';
import styles from './DocumentForm.module.css';

const today = new Date().toISOString().slice(0, 10);

export default function LivraisonForm({ store }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, addBonLivraison, updateBonLivraison } = store;
  const isNew = id === 'nouveau' || !id;

  const existing = (state.bonsLivraison || []).find((bl) => bl.id === id);
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(today);
  const [lines, setLines] = useState([]);
  const [fraisPort, setFraisPort] = useState(0);
  const [acompte, setAcompte] = useState(0);
  const [notes, setNotes] = useState('');
  const [showPrint, setShowPrint] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    if (!isNew && existing) {
      setClientId(existing.clientId || '');
      setDate(existing.date || today);
      setLines(existing.lines ? recalcLines(existing.lines, state.settings.tvaApplicable !== false ? (state.settings.tvaRate ?? 0) : 0) : []);
      setFraisPort(existing.fraisPort ?? 0);
      setAcompte(existing.acompte ?? 0);
      setNotes(existing.notes || '');
    }
  }, [id, isNew, existing?.id]);

  const tvaRate = state.settings.tvaApplicable !== false ? (state.settings.tvaRate ?? 0) : 0;
  const totals = documentTotals(lines, { fraisPort, acompte }, tvaRate);

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      clientId,
      date,
      lines,
      fraisPort,
      acompte,
      notes,
      totalHT: totals.totalHT,
      totalTVA: totals.totalTVA,
      totalTTC: totals.totalTTC,
    };
    if (isNew) {
      addBonLivraison(payload);
      navigate('/livraisons');
    } else {
      updateBonLivraison(id, payload);
      navigate('/livraisons');
    }
  };

  const docForPrint = {
    type: 'livraison',
    ref: existing?.ref ?? 'BL-XXXX',
    date,
    notes,
    client: state.clients.find((c) => c.id === clientId),
    company: state.company,
    lines,
    ...totals,
    devise: state.settings.devise,
  };
  const clientObj = state.clients.find((c) => c.id === clientId);

  return (
    <div className={styles.page}>
      <div className="page-header">
        <Link to="/livraisons" className="btn btn-ghost">
          <ArrowLeft size={18} /> Retour
        </Link>
        <h1 className="page-title">
          {isNew ? 'Nouveau bon de livraison' : `Bon de livraison ${existing?.ref ?? ''}`}
        </h1>
        <div className={styles.headerActions}>
          <button type="button" className="btn btn-secondary" onClick={() => setShowEmail(true)}>
            <Mail size={18} /> Envoyer par email
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setShowPrint(true)}>
            <FileDown size={18} /> Imprimer / PDF
          </button>
          <button type="submit" form="livraison-form" className="btn btn-primary">
            <Save size={18} /> Enregistrer
          </button>
        </div>
      </div>

      <form id="livraison-form" onSubmit={handleSave} className={styles.form}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className={styles.row}>
            <div>
              <label className="label">Client</label>
              <select
                className="input"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">Sélectionner un client</option>
                {state.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company || c.name || 'Sans nom'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date de livraison</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DocumentEditor
          lines={lines}
          onChangeLines={setLines}
          products={state.products}
          tvaRateDefault={tvaRate}
          tvaApplicable={state.settings.tvaApplicable !== false}
          showUnits={state.settings.showUnits !== false}
          devise={state.settings.devise}
          fraisPort={fraisPort}
          acompte={acompte}
          onFraisPortChange={setFraisPort}
          onAcompteChange={setAcompte}
        />

        <div className="card" style={{ marginTop: '1rem' }}>
          <label className="label"><StickyNote size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Notes (optionnel)</label>
          <textarea
            className="input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instructions de livraison, remarques..."
          />
        </div>
      </form>

      {showEmail && (
        <EmailModal
          store={store}
          docRef={existing?.ref ?? docForPrint.ref}
          docType="bon de livraison"
          totalTTC={totals.totalTTC}
          date={date}
          client={clientObj}
          onClose={() => setShowEmail(false)}
        />
      )}
      {showPrint && (
        <DocumentPrint store={store} doc={docForPrint} onClose={() => setShowPrint(false)} />
      )}
    </div>
  );
}
