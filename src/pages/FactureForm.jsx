import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save, FileDown, CheckCircle, Mail, StickyNote } from 'lucide-react';
import DocumentEditor from '../components/DocumentEditor';
import { documentTotals, recalcLines } from '../lib/documentUtils';
import { PAYMENT_METHODS } from '../lib/paymentMethods';
import DocumentPrint from '../components/DocumentPrint';
import EmailModal from '../components/EmailModal';
import styles from './DocumentForm.module.css';

const today = new Date().toISOString().slice(0, 10);

export default function FactureForm({ store }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, addFacture, updateFacture, setFactureReglee } = store;
  const isNew = id === 'nouveau' || !id;

  const existing = state.factures.find((f) => f.id === id);
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(today);
  const [lines, setLines] = useState([]);
  const [fraisPort, setFraisPort] = useState(0);
  const [acompte, setAcompte] = useState(0);
  const [notes, setNotes] = useState('');
  const [modePaiement, setModePaiement] = useState('');
  const [showPrint, setShowPrint] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showRegleeModal, setShowRegleeModal] = useState(false);
  const [regleeDate, setRegleeDate] = useState(new Date().toISOString().slice(0, 10));
  const [regleeModePaiement, setRegleeModePaiement] = useState('virement');

  useEffect(() => {
    if (!isNew && existing) {
      setClientId(existing.clientId || '');
      setDate(existing.date || today);
      setLines(existing.lines ? recalcLines(existing.lines, state.settings.tvaApplicable !== false ? (state.settings.tvaRate ?? 0) : 0) : []);
      setFraisPort(existing.fraisPort ?? 0);
      setAcompte(existing.acompte ?? 0);
      setNotes(existing.notes || '');
      setModePaiement(existing.modePaiement || '');
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
      modePaiement: modePaiement || undefined,
      totalHT: totals.totalHT,
      totalTVA: totals.totalTVA,
      totalTTC: totals.totalTTC,
    };
    if (isNew) {
      addFacture(payload);
      navigate('/factures');
    } else {
      updateFacture(id, payload);
      navigate('/factures');
    }
  };

  const handleMarquerReglee = () => {
    setShowRegleeModal(true);
  };

  const confirmMarquerReglee = () => {
    setFactureReglee(id, regleeDate, undefined, regleeModePaiement);
    setShowRegleeModal(false);
  };

  const docForPrint = {
    type: 'facture',
    ref: existing?.ref ?? 'FAC-XXXX',
    date,
    notes,
    modePaiement: existing?.modePaiement ?? modePaiement,
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
        <Link to="/factures" className="btn btn-ghost">
          <ArrowLeft size={18} /> Retour
        </Link>
        <h1 className="page-title">
          {isNew ? 'Nouvelle facture' : `Facture ${existing?.ref ?? ''}`}
        </h1>
        <div className={styles.headerActions}>
          <button type="button" className="btn btn-secondary" onClick={() => setShowEmail(true)}>
            <Mail size={18} /> Envoyer par email
          </button>
          {!isNew && existing?.status !== 'reglee' && (
            <button type="button" className="btn btn-secondary" onClick={handleMarquerReglee}>
              <CheckCircle size={18} /> Marquer comme réglée
            </button>
          )}
          {showRegleeModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div className="card" style={{ maxWidth: 360 }}>
                <h3 style={{ margin: '0 0 1rem' }}>Marquer comme réglée</h3>
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
                    <button type="button" className="btn btn-ghost" onClick={() => setShowRegleeModal(false)}>Annuler</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => setShowPrint(true)}>
            <FileDown size={18} /> Imprimer / PDF
          </button>
          <button type="submit" form="facture-form" className="btn btn-primary">
            <Save size={18} /> Enregistrer
          </button>
        </div>
      </div>

      <form id="facture-form" onSubmit={handleSave} className={styles.form}>
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
              <label className="label">Date de la facture</label>
              <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Mode de paiement</label>
              <select
                className="input"
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value)}
              >
                <option value="">— Non spécifié</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
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
            placeholder="Notes internes ou à afficher sur le document..."
          />
        </div>
      </form>

      {showEmail && (
        <EmailModal
          store={store}
          docRef={existing?.ref ?? docForPrint.ref}
          docType="facture"
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
