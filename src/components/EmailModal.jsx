import { useState } from 'react';
import { Mail, X } from 'lucide-react';

function replacePlaceholders(text, data) {
  if (!text) return '';
  return text
    .replace(/\{client_nom\}/g, data.clientName || '')
    .replace(/\{ref\}/g, data.ref || '')
    .replace(/\{total\}/g, data.total != null ? String(data.total) : '')
    .replace(/\{date\}/g, data.date || '')
    .replace(/\{type\}/g, data.type || '');
}

export default function EmailModal({ store, docRef, docType, totalTTC, date, client, onClose }) {
  const templates = store.state.emailTemplates || [];
  const [selectedId, setSelectedId] = useState(templates[0]?.id || '');
  const selected = templates.find((t) => t.id === selectedId);

  const clientName = client ? (client.company || client.name || '') : '';
  const data = {
    clientName,
    ref: docRef,
    total: totalTTC,
    date,
    type: docType === 'devis' ? 'Devis' : docType === 'bon de livraison' ? 'Bon de livraison' : docType === 'avoir' ? 'Avoir' : 'Facture',
  };

  const subject = selected ? replacePlaceholders(selected.subject, data) : '';
  const body = selected ? replacePlaceholders(selected.body, data) : '';
  const to = selected?.to || client?.email || '';

  const handleOpenMail = () => {
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
    onClose();
  };

  return (
    <div className="email-modal-overlay" onClick={onClose}>
      <div className="email-modal" onClick={(e) => e.stopPropagation()}>
        <div className="email-modal-header">
          <h3><Mail size={20} /> Envoyer par email</h3>
          <button type="button" className="btn btn-ghost" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="email-modal-body">
          <label className="label">Modèle d’email prérempli</label>
          <select
            className="input"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">— Choisir —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {templates.length === 0 && (
            <p className="email-modal-hint">
              Aucun modèle. Ajoutez-en dans Paramètres → Emails préremplis.
            </p>
          )}
          {selected && (
            <>
              <label className="label">Destinataire</label>
              <input type="text" className="input" value={to} readOnly />
              <label className="label">Objet</label>
              <input type="text" className="input" value={subject} readOnly />
              <label className="label">Corps du message</label>
              <textarea className="input" rows={4} value={body} readOnly />
            </>
          )}
        </div>
        <div className="email-modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenMail}
            disabled={!selected}
          >
            <Mail size={18} /> Ouvrir le client mail
          </button>
        </div>
      </div>
    </div>
  );
}
