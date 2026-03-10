import { Link } from 'react-router-dom';
import { Phone, Mail, Building2, Search, Plus } from 'lucide-react';
import { useState } from 'react';
import styles from './Agenda.module.css';

export default function Agenda({ store }) {
  const { state } = store;
  const [search, setSearch] = useState('');

  const clients = state.clients
    .filter((c) => {
      const q = search.toLowerCase();
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.phone || '').replace(/\s/g, '').includes(q.replace(/\s/g, '')) ||
        (c.email || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const nameA = (a.company || a.name || '').toLowerCase();
      const nameB = (b.company || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

  return (
    <div className={styles.page}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Agenda téléphonique</h1>
          <p className={styles.subtitle}>
            Tous les numéros et contacts de vos clients
          </p>
        </div>
        <Link to="/clients/nouveau" className="btn btn-primary">
          <Plus size={18} /> Nouveau contact
        </Link>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="search"
            className="input"
            placeholder="Rechercher par nom, société, téléphone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.list}>
        {clients.length === 0 ? (
          <div className={styles.empty}>
            <p>Aucun client à afficher.</p>
            <Link to="/clients/nouveau" className="btn btn-primary">
              Ajouter un client
            </Link>
          </div>
        ) : (
          clients.map((c) => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardMain}>
                <div className={styles.cardHeader}>
                  <Building2 size={18} className={styles.cardIcon} />
                  <div>
                    <Link to={`/clients/${c.id}`} className={styles.cardName}>
                      {c.company || c.name || 'Sans nom'}
                    </Link>
                    {c.company && c.name && (
                      <span className={styles.cardSub}>{c.name}</span>
                    )}
                  </div>
                </div>
                <div className={styles.cardContacts}>
                  {c.phone ? (
                    <a
                      href={`tel:${c.phone.replace(/\s/g, '')}`}
                      className={styles.contactLink}
                      title="Appeler"
                    >
                      <Phone size={16} />
                      <span>{c.phone}</span>
                    </a>
                  ) : (
                    <span className={styles.contactEmpty}>
                      <Phone size={16} />
                      Aucun numéro
                    </span>
                  )}
                  {c.email ? (
                    <a
                      href={`mailto:${c.email}`}
                      className={styles.contactLink}
                      title="Envoyer un email"
                    >
                      <Mail size={16} />
                      <span>{c.email}</span>
                    </a>
                  ) : (
                    <span className={styles.contactEmpty}>
                      <Mail size={16} />
                      Aucun email
                    </span>
                  )}
                </div>
                {(c.address || c.city) && (
                  <p className={styles.cardAddress}>
                    {[c.address, [c.postalCode, c.city].filter(Boolean).join(' ')]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
              <Link to={`/clients/${c.id}`} className={styles.cardEdit}>
                Voir la fiche
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
