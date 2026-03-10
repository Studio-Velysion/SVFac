/**
 * Blocs prédéfinis pour les templates devis/factures.
 * Variables dynamiques : {{variable}} remplacées à la génération.
 */
export function registerInvoiceBlocks(editor) {
  const blockManager = editor.BlockManager;

  blockManager.add('logo', {
    label: 'Logo',
    category: 'Devis / Facture',
    content: `
      <div class="invoice-logo" data-gjs-type="logo" style="padding:10px 0;">
        <img src="https://via.placeholder.com/120x60?text=LOGO" alt="Logo" style="max-width:120px;max-height:60px;" />
        <span style="display:none;">{{logo}}</span>
      </div>`,
  });

  blockManager.add('company-info', {
    label: 'Infos entreprise',
    category: 'Devis / Facture',
    content: `
      <div class="invoice-company" data-gjs-type="company" style="padding:10px 0; font-size:12px;">
        <strong>{{company_name}}</strong><br/>
        {{company_address}}<br/>
        {{company_email}}<br/>
        {{company_phone}}
      </div>`,
  });

  blockManager.add('client-info', {
    label: 'Infos client',
    category: 'Devis / Facture',
    content: `
      <div class="invoice-client" data-gjs-type="client" style="padding:10px 0; font-size:12px;">
        <strong>Client</strong><br/>
        {{client_name}}<br/>
        {{client_address}}<br/>
        {{client_email}}
      </div>`,
  });

  blockManager.add('document-title', {
    label: 'Titre (Devis/Facture)',
    category: 'Devis / Facture',
    content: `
      <div class="invoice-title" data-gjs-type="title" style="padding:15px 0; text-align:center;">
        <h2 style="margin:0; font-size:22px;">FACTURE {{invoice_number}}</h2>
        <p style="margin:5px 0 0; font-size:12px; color:#666;">Date : {{invoice_date}}</p>
      </div>`,
  });

  blockManager.add('items-table', {
    label: 'Tableau produits',
    category: 'Devis / Facture',
    content: `
      <div class="invoice-items" data-gjs-type="items">
        <table style="width:100%; border-collapse:collapse; margin:15px 0; font-size:12px;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="border:1px solid #ddd; padding:8px;">Désignation</th>
              <th style="border:1px solid #ddd; padding:8px;">Qté</th>
              <th style="border:1px solid #ddd; padding:8px;">P.U.</th>
              <th style="border:1px solid #ddd; padding:8px;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colspan="4" style="border:1px solid #ddd; padding:12px;">{{items}}</td></tr>
          </tbody>
        </table>
      </div>`,
  });

  blockManager.add('totals', {
    label: 'Totaux',
    category: 'Devis / Facture',
    content: `
      <div class="invoice-totals" data-gjs-type="totals" style="margin:15px 0; font-size:12px; text-align:right;">
        <p style="margin:4px 0;">Sous-total : {{subtotal}}</p>
        <p style="margin:4px 0;">TVA : {{tax}}</p>
        <p style="margin:8px 0 0; font-weight:bold; font-size:14px;">Total : {{total}}</p>
      </div>`,
  });

  blockManager.add('notes', {
    label: 'Notes',
    category: 'Devis / Facture',
    content: `
      <div class="invoice-notes" data-gjs-type="notes" style="margin:15px 0; padding:10px; background:#f9f9f9; font-size:12px;">
        {{notes}}
      </div>`,
  });

  blockManager.add('signature', {
    label: 'Signature',
    category: 'Devis / Facture',
    content: `
      <div class="invoice-signature" data-gjs-type="signature" style="margin:25px 0; padding:15px 0; font-size:12px;">
        <p style="margin:0 0 40px;">Signature du client</p>
        <p style="margin:0; border-bottom:1px solid #333; width:200px; height:30px;"></p>
      </div>`,
  });

  blockManager.add('footer', {
    label: 'Footer',
    category: 'Devis / Facture',
    content: `
      <div class="invoice-footer" data-gjs-type="footer" style="margin-top:30px; padding-top:10px; border-top:1px solid #ddd; font-size:11px; color:#666; text-align:center;">
        {{footer}}
      </div>`,
  });

  blockManager.add('columns-2', {
    label: '2 colonnes',
    category: 'Layout',
    content: `
      <div class="invoice-row" style="display:flex; gap:20px; margin:10px 0;">
        <div style="flex:1; min-width:0;"></div>
        <div style="flex:1; min-width:0;"></div>
      </div>`,
  });

  blockManager.add('section', {
    label: 'Section',
    category: 'Layout',
    content: '<div class="invoice-section" style="margin:15px 0; padding:10px;"></div>',
  });
}
