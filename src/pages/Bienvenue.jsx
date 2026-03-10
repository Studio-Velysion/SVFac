import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Building2, ArrowRight } from 'lucide-react';
import styles from './Bienvenue.module.css';

export default function Bienvenue({ store }) {
  const navigate = useNavigate();
  const { state, completeOnboarding } = store;
  const company = state.company || {};
  const [form, setForm] = useState({
    name: company.name || '',
    address: company.address || '',
    postalCode: company.postalCode || '',
    city: company.city || '',
    siret: company.siret || '',
    tva: company.tva || '',
    email: company.email || '',
    phone: company.phone || '',
  });
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = (form.name || '').trim();
    if (!name) {
      setError('Veuillez saisir le nom de l’entreprise.');
      return;
    }
    completeOnboarding({
      name: name || 'Mon entreprise',
      address: form.address?.trim() || '',
      postalCode: form.postalCode?.trim() || '',
      city: form.city?.trim() || '',
      siret: form.siret?.trim() || '',
      tva: form.tva?.trim() || '',
      email: form.email?.trim() || '',
      phone: form.phone?.trim() || '',
    });
    navigate('/', { replace: true });
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <img src={`${import.meta.env.BASE_URL}logo-transparent.png`} alt="" className={styles.logo} />
          </div>
          <h1 className={styles.title}>Bienvenue</h1>
          <p className={styles.subtitle}>
            SVFac vous permet de gérer vos devis, factures, clients et produits en un seul endroit.
            Pour commencer, renseignez les informations de votre entreprise. Elles apparaîtront sur vos documents.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Building2 size={20} /> Votre entreprise
            </h2>
            <div className={styles.grid}>
              <div className={styles.full}>
                <label htmlFor="bienvenue-name" className={styles.label}>Nom de l’entreprise / Raison sociale *</label>
                <input
                  id="bienvenue-name"
                  type="text"
                  className={styles.input}
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ex. Ma Société SARL"
                  required
                />
              </div>
              <div className={styles.full}>
                <label htmlFor="bienvenue-address" className={styles.label}>Adresse</label>
                <input
                  id="bienvenue-address"
                  type="text"
                  className={styles.input}
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Numéro et nom de rue"
                />
              </div>
              <div>
                <label htmlFor="bienvenue-postalCode" className={styles.label}>Code postal</label>
                <input
                  id="bienvenue-postalCode"
                  type="text"
                  className={styles.input}
                  value={form.postalCode}
                  onChange={(e) => handleChange('postalCode', e.target.value)}
                  placeholder="75001"
                />
              </div>
              <div>
                <label htmlFor="bienvenue-city" className={styles.label}>Ville</label>
                <input
                  id="bienvenue-city"
                  type="text"
                  className={styles.input}
                  value={form.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Paris"
                />
              </div>
              <div>
                <label htmlFor="bienvenue-siret" className={styles.label}>SIRET ou SIREN</label>
                <input
                  id="bienvenue-siret"
                  type="text"
                  className={styles.input}
                  value={form.siret}
                  onChange={(e) => handleChange('siret', e.target.value)}
                  placeholder="123 456 789 00012"
                />
              </div>
              <div>
                <label htmlFor="bienvenue-tva" className={styles.label}>N° TVA intracommunautaire</label>
                <input
                  id="bienvenue-tva"
                  type="text"
                  className={styles.input}
                  value={form.tva}
                  onChange={(e) => handleChange('tva', e.target.value)}
                  placeholder="FR XX XXXXXXXXX"
                />
              </div>
              <div>
                <label htmlFor="bienvenue-email" className={styles.label}>Email</label>
                <input
                  id="bienvenue-email"
                  type="email"
                  className={styles.input}
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contact@entreprise.fr"
                />
              </div>
              <div>
                <label htmlFor="bienvenue-phone" className={styles.label}>Téléphone</label>
                <input
                  id="bienvenue-phone"
                  type="tel"
                  className={styles.input}
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="01 23 45 67 89"
                />
              </div>
            </div>
          </section>

          {error && <p className={styles.error} role="alert">{error}</p>}

          <div className={styles.actions}>
            <button type="submit" className={styles.submit}>
              <FileText size={18} /> Commencer à utiliser le logiciel
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
