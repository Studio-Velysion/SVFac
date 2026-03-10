import { X, HelpCircle } from 'lucide-react';
import styles from './AideModal.module.css';

export default function AideModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}><HelpCircle size={24} /> Aide — SVFac</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fermer">
            <X size={24} />
          </button>
        </div>
        <div className={styles.content}>
          <p className={styles.intro}>
            SVFac (Studio Velysion Facture) permet de gérer devis, factures, clients, produits et comptabilité. Ce document décrit chaque partie du logiciel.
          </p>

          <section className={styles.section}>
            <h3>Tableau de bord</h3>
            <p>Vue d’ensemble : chiffre d’affaires (factures réglées), CA total, factures en attente de règlement. Affiche les derniers devis et factures, les devis en fin de validité et des raccourcis (nouveau devis, nouvelle facture, etc.).</p>
          </section>

          <section className={styles.section}>
            <h3>Clients</h3>
            <p>Liste de tous les clients (entreprise, nom, contact). Vous pouvez ajouter, modifier ou supprimer un client. Les clients sont utilisés pour les devis, factures, bons de livraison et dossiers.</p>
          </section>

          <section className={styles.section}>
            <h3>Produits</h3>
            <p>Catalogues de produits ou prestations : désignation, prix unitaire HT, TVA. Lors de la création d’un devis ou d’une facture, vous choisissez les produits et quantités. Vous pouvez aussi saisir des lignes libres.</p>
          </section>

          <section className={styles.section}>
            <h3>Devis</h3>
            <p>Création et suivi des devis : client, date, lignes (produits, quantités, prix), frais de port, acompte, TVA. Un devis peut être transformé en facture en un clic. Vous pouvez dupliquer un devis, l’imprimer ou l’envoyer par e-mail.</p>
          </section>

          <section className={styles.section}>
            <h3>Factures</h3>
            <p>Même principe que les devis. Vous indiquez le mode de paiement (virement, carte, espèces). Une facture peut être marquée « Réglée » avec date et mode de règlement. Les factures alimentent le chiffre d’affaires et la comptabilité.</p>
          </section>

          <section className={styles.section}>
            <h3>Bons de livraison</h3>
            <p>Documents de livraison (BL) liés à un client et une date. Utiles pour accompagner les livraisons. Même éditeur que devis/factures (lignes, totaux). Vous pouvez les imprimer ou les envoyer par e-mail.</p>
          </section>

          <section className={styles.section}>
            <h3>Avoirs</h3>
            <p>Documents d’avoir (remboursement ou annulation) : référence à la facture d’origine, motif, montant. Ils apparaissent dans la liste des documents et peuvent être imprimés ou envoyés par e-mail.</p>
          </section>

          <section className={styles.section}>
            <h3>Calendrier</h3>
            <p>Calendrier des échéances : dates de paiement des factures et événements personnels. Permet de voir d’un coup d’œil les échéances à venir.</p>
          </section>

          <section className={styles.section}>
            <h3>Agenda</h3>
            <p>Gestion d’un agenda (rendez-vous, tâches personnelles). Les événements peuvent être liés à des clients ou des documents si besoin.</p>
          </section>

          <section className={styles.section}>
            <h3>Dossier client</h3>
            <p>Vue par client : tous les devis, factures et contrats du client. Vous pouvez ouvrir le dossier de fichiers du client (si un emplacement est défini dans Paramètres) pour y déposer devis, factures et notes.</p>
          </section>

          <section className={styles.section}>
            <h3>Comptabilité</h3>
            <p>
              <strong>Cartes :</strong> Chiffre d’affaires (factures réglées), CA total factures, Recettes (écritures), Dépenses, Solde — selon la période (année / mois) sélectionnée.<br />
              <strong>Saisir les totaux factures :</strong> crée automatiquement deux écritures « Recette totale » et « Factures totales » pour la période (à partir des factures).<br />
              <strong>Paiement client :</strong> enregistrer manuellement un encaissement (sans facture). Indiquez le nom du client, ce qu’il a acheté (désignation), le montant et comment il a payé (espèces, virement, carte bancaire). Vous pouvez aussi saisir une dépense en changeant le type.<br />
              <strong>Onglets :</strong> Écritures, Grand livre (par catégorie, Débit/Crédit), Compte de résultat (recettes et dépenses par catégorie + résultat).<br />
              <strong>Export :</strong> boutons PDF et Excel pour télécharger les écritures de la période affichée.
            </p>
          </section>

          <section className={styles.section}>
            <h3>Tâches</h3>
            <p>Gestion de projets et de tâches (kanban) : création de projets, tâches avec statuts, sous-tâches. Utile pour suivre l’avancement des missions ou chantiers.</p>
          </section>

          <section className={styles.section}>
            <h3>Paramètres</h3>
            <p>
              <strong>Mon entreprise :</strong> nom, adresse, SIRET, TVA, logo, coordonnées.<br />
              <strong>Documents :</strong> préfixes (devis, facture, bon de livraison, avoir), devise, validité des devis (jours), modèle de document (ordre des blocs, pied de page).<br />
              <strong>Modèle de document :</strong> personnalisation de l’ordre des blocs (en-tête, tableau, totaux, etc.) et options d’impression.<br />
              <strong>Dossiers :</strong> emplacement du dossier de base des clients (sous-dossiers par client).<br />
              <strong>Emails :</strong> modèles d’e-mail pour l’envoi de devis/factures (variables : client, référence, total, date).<br />
              <strong>Google Drive :</strong> connexion optionnelle (Client ID / Secret) pour sauvegarder ou ouvrir des fichiers.<br />
              <strong>Données :</strong> sauvegarde (export .zip) et import d’une sauvegarde pour restaurer les données.<br />
              <strong>Apparence :</strong> thème clair/sombre, réglable aussi via le bouton soleil/lune dans la barre latérale.
            </p>
          </section>

          <section className={styles.section}>
            <h3>Général</h3>
            <p>Les données (clients, produits, devis, factures, écritures comptables, paramètres) sont enregistrées localement sur votre ordinateur. Pensez à faire des sauvegardes régulières depuis Paramètres → Données.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
