import { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import styles from './AideModal.module.css';

const LICENSE_URL = `${import.meta.env.BASE_URL}license.txt`;

export default function InfoLogicielModal({ open, onClose }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(LICENSE_URL)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error('Fichier introuvable'))))
      .then(setText)
      .catch((e) => setError(e.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className={styles.header}>
          <h2 className={styles.title}><Info size={24} /> Information du logiciel</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <X size={24} />
          </button>
        </div>
        <div className={styles.content}>
          {loading && <p className={styles.intro}>Chargement…</p>}
          {error && <p className={styles.intro} style={{ color: 'var(--color-danger)' }}>{error}</p>}
          {!loading && !error && (
            <pre className={styles.licenseText}>{text}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
