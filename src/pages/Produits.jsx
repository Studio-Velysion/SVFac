import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import styles from './Produits.module.css';

export default function Produits({ store }) {
  const { state, deleteProduct } = store;
  const [search, setSearch] = useState('');
  const [familyFilter, setFamilyFilter] = useState('');

  const filtered = state.products.filter((p) => {
    const matchSearch =
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.reference || '').toLowerCase().includes(search.toLowerCase());
    const matchFamily = !familyFilter || p.family === familyFilter;
    return matchSearch && matchFamily;
  });

  const handleDelete = (e, id, name) => {
    e.preventDefault();
    if (window.confirm(`Supprimer le produit « ${name} » ?`)) deleteProduct(id);
  };

  return (
    <div className={styles.page}>
      <div className="page-header">
        <h1 className="page-title">Produits & prestations</h1>
        <Link to="/produits/nouveau" className="btn btn-primary">
          <Plus size={18} />
          Nouveau produit
        </Link>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="search"
            className="input"
            placeholder="Rechercher un produit ou référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input"
          style={{ width: 'auto', minWidth: '160px' }}
          value={familyFilter}
          onChange={(e) => setFamilyFilter(e.target.value)}
        >
          <option value="">Toutes les familles</option>
          {state.families.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Référence</th>
              <th>Désignation</th>
              <th>Famille</th>
              <th>Prix unitaire HT</th>
              <th>TVA</th>
              <th>Unité</th>
              <th width="100">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  <p>Aucun produit. Ajoutez des produits pour les insérer dans les devis et factures.</p>
                  <Link to="/produits/nouveau" className="btn btn-primary">
                    <Plus size={18} /> Nouveau produit
                  </Link>
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td className={styles.ref}>{p.reference || '—'}</td>
                  <td className={styles.name}>{p.name || 'Sans nom'}</td>
                  <td><span className="badge badge-warning">{p.family || '—'}</span></td>
                  <td>
                    {(p.priceHT != null ? p.priceHT : p.price) != null
                      ? `${Number(p.priceHT ?? p.price).toFixed(2)} ${state.settings.devise}`
                      : '—'}
                  </td>
                  <td>{p.tva != null ? `${p.tva} %` : `${state.settings.tvaRate} %`}</td>
                  <td>{p.unit || 'u'}</td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/produits/${p.id}`} className="btn btn-ghost" title="Modifier">
                        <Pencil size={16} />
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        title="Supprimer"
                        onClick={(e) => handleDelete(e, p.id, p.name)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
