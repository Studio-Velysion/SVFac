import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  TrendingUp,
  FileText,
  Receipt,
  AlertCircle,
  ArrowRight,
  Users,
  Package,
} from 'lucide-react';
import styles from './Dashboard.module.css';

export default function Dashboard({ store }) {
  const { state } = store || {};
  const devis = state?.devis ?? [];
  const factures = state?.factures ?? [];
  const clients = state?.clients ?? [];
  const settings = state?.settings ?? {};

  const ca = factures
    .filter((f) => f.status === 'reglee')
    .reduce((s, f) => s + (f.totalTTC || 0), 0);
  const caTous = factures.reduce((s, f) => s + (f.totalTTC || 0), 0);

  const validiteJours = settings.validiteDevisJours || 30;
  const maintenant = new Date();
  const devisExpires = devis.filter((d) => {
    if (d.transformeEnFacture) return false;
    const dateLimite = new Date(d.date);
    dateLimite.setDate(dateLimite.getDate() + validiteJours);
    return dateLimite < maintenant;
  });

  const facturesImpayees = factures.filter((f) => f.status !== 'reglee');
  const totalImpaye = facturesImpayees.reduce((s, f) => s + (f.totalTTC || 0), 0);

  const derniersDevis = [...devis].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const derniersFactures = [...factures].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const getClient = (id) => clients.find((c) => c.id === id);

  return (
    <div className={styles.dashboard}>
      <h1 className="page-title">Tableau de bord</h1>

      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: 'rgba(124, 58, 237, 0.2)', color: 'var(--color-primary)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <p className={styles.cardLabel}>Chiffre d'affaires (payé)</p>
            <p className={styles.cardValue}>{ca.toFixed(2)} {settings.devise || '€'}</p>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: 'rgba(168, 85, 247, 0.2)', color: 'var(--color-secondary)' }}>
            <Receipt size={24} />
          </div>
          <div>
            <p className={styles.cardLabel}>CA total (toutes factures)</p>
            <p className={styles.cardValue}>{caTous.toFixed(2)} {settings.devise || '€'}</p>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <p className={styles.cardLabel}>En attente de règlement</p>
            <p className={styles.cardValue}>{totalImpaye.toFixed(2)} {settings.devise || '€'}</p>
            <p className={styles.cardSub}>{facturesImpayees.length} facture(s)</p>
          </div>
        </div>
      </div>

      {(devisExpires.length > 0 || facturesImpayees.length > 0) && (
        <div className={styles.alerts}>
          {devisExpires.length > 0 && (
            <div className={styles.alert}>
              <AlertCircle size={20} />
              <span>{devisExpires.length} devis en fin de validité ou expirés.</span>
              <Link to="/devis" className={styles.alertLink}>Voir les devis</Link>
            </div>
          )}
          {facturesImpayees.length > 0 && (
            <div className={styles.alert}>
              <AlertCircle size={20} />
              <span>{facturesImpayees.length} facture(s) non réglée(s).</span>
              <Link to="/factures" className={styles.alertLink}>Voir les factures</Link>
            </div>
          )}
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Derniers devis</h2>
            <Link to="/devis" className={styles.more}>
              Voir tout <ArrowRight size={16} />
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Réf.</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {derniersDevis.length === 0 ? (
                  <tr><td colSpan={4} className="empty-state">Aucun devis</td></tr>
                ) : (
                  derniersDevis.map((d) => (
                    <tr key={d.id}>
                      <td><Link to={`/devis/${d.id}`}>{d.ref}</Link></td>
                      <td>{getClient(d.clientId)?.name ?? '—'}</td>
                      <td>{d.date ? format(new Date(d.date), 'dd MMM yyyy', { locale: fr }) : '—'}</td>
                      <td>{d.totalTTC != null ? `${d.totalTTC.toFixed(2)} ${settings.devise || '€'}` : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Dernières factures</h2>
            <Link to="/factures" className={styles.more}>
              Voir tout <ArrowRight size={16} />
            </Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Réf.</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {derniersFactures.length === 0 ? (
                  <tr><td colSpan={5} className="empty-state">Aucune facture</td></tr>
                ) : (
                  derniersFactures.map((f) => (
                    <tr key={f.id}>
                      <td><Link to={`/factures/${f.id}`}>{f.ref}</Link></td>
                      <td>{getClient(f.clientId)?.name ?? '—'}</td>
                      <td>{f.date ? format(new Date(f.date), 'dd MMM yyyy', { locale: fr }) : '—'}</td>
                      <td>
                        <span className={`badge ${f.status === 'reglee' ? 'badge-success' : 'badge-danger'}`}>
                          {f.status === 'reglee' ? 'Réglée' : 'Non réglée'}
                        </span>
                      </td>
                      <td>{f.totalTTC != null ? `${f.totalTTC.toFixed(2)} ${settings.devise || '€'}` : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={styles.quick}>
        <Link to="/clients/nouveau" className={styles.quickCard}>
          <Users size={28} />
          <span>Nouveau client</span>
        </Link>
        <Link to="/produits/nouveau" className={styles.quickCard}>
          <Package size={28} />
          <span>Nouveau produit</span>
        </Link>
        <Link to="/devis/nouveau" className={styles.quickCard}>
          <FileText size={28} />
          <span>Nouveau devis</span>
        </Link>
        <Link to="/factures/nouveau" className={styles.quickCard}>
          <Receipt size={28} />
          <span>Nouvelle facture</span>
        </Link>
      </div>
    </div>
  );
}
