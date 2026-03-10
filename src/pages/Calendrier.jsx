import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Receipt, Plus, Calendar as CalendarIcon } from 'lucide-react';
import styles from './Calendrier.module.css';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export default function Calendrier({ store }) {
  const [current, setCurrent] = useState(() => new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventDate, setEventDate] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventNote, setEventNote] = useState('');
  const { state, addCalendarEvent } = store || {};

  const paiementsByDate = useMemo(() => {
    const map = {};
    (state?.factures || [])
      .filter((f) => f.status === 'reglee' && f.regleLe)
      .forEach((f) => {
        const key = f.regleLe.slice(0, 10);
        if (!map[key]) map[key] = [];
        const client = (state?.clients || []).find((c) => c.id === f.clientId);
        map[key].push({
          ref: f.ref,
          clientName: client?.company || client?.name || '—',
          totalTTC: f.totalTTC,
          id: f.id,
          type: 'paiement',
        });
      });
    return map;
  }, [state?.factures, state?.clients]);

  const customEventsByDate = useMemo(() => {
    const map = {};
    (state?.calendarEvents || []).forEach((e) => {
      const key = e.date ? e.date.slice(0, 10) : '';
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push({ id: e.id, title: e.title, note: e.note, type: 'custom' });
    });
    return map;
  }, [state?.calendarEvents]);

  const handleAddEvent = (e) => {
    e.preventDefault();
    const date = eventDate || format(new Date(), 'yyyy-MM-dd');
    if (!eventTitle.trim() || !addCalendarEvent) return;
    addCalendarEvent({ title: eventTitle.trim(), date, note: eventNote.trim() });
    setEventTitle('');
    setEventNote('');
    setEventDate('');
    setShowEventModal(false);
  };

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className={styles.page}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Calendrier</h1>
          <p className={styles.subtitle}>
            Paiements des factures et événements personnels
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEventDate(format(current, 'yyyy-MM-dd'));
            setShowEventModal(true);
          }}
        >
          <Plus size={18} /> Ajouter un événement
        </button>
      </div>

      {showEventModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEventModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}><CalendarIcon size={20} /> Nouvel événement</h3>
            <form onSubmit={handleAddEvent}>
              <label className="label">Titre</label>
              <input
                type="text"
                className="input"
                required
                placeholder="Ex. Rappel client, Réunion..."
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
              />
              <label className="label">Date</label>
              <input
                type="date"
                className="input"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
              <label className="label">Note (optionnel)</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Détails..."
                value={eventNote}
                onChange={(e) => setEventNote(e.target.value)}
              />
              <div className={styles.modalActions}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowEventModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={styles.calendarToolbar}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setCurrent((d) => subMonths(d, 1))}
          aria-label="Mois précédent"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className={styles.monthTitle}>
          {format(current, 'MMMM yyyy', { locale: fr })}
        </h2>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setCurrent((d) => addMonths(d, 1))}
          aria-label="Mois suivant"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <div className={styles.calendar}>
        <div className={styles.weekdayRow}>
          {WEEKDAYS.map((d) => (
            <div key={d} className={styles.weekday}>
              {d}
            </div>
          ))}
        </div>
        <div className={styles.daysGrid}>
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const paiements = paiementsByDate[key] || [];
            const customEvents = customEventsByDate[key] || [];
            const inMonth = isSameMonth(day, current);
            const today = isToday(day);
            return (
              <div
                key={key}
                className={`${styles.dayCell} ${!inMonth ? styles.dayOtherMonth : ''} ${today ? styles.dayToday : ''}`}
              >
                <span className={styles.dayNumber}>{format(day, 'd')}</span>
                <div className={styles.dayEvents}>
                  {paiements.map((p) => (
                    <Link
                      key={p.id}
                      to={`/factures/${p.id}`}
                      className={styles.event}
                      title={`${p.ref} — ${p.clientName}`}
                    >
                      <Receipt size={12} />
                      <span>{p.ref}</span>
                      <span className={styles.eventClient}>{p.clientName}</span>
                      {p.totalTTC != null && (
                        <span className={styles.eventAmount}>
                          {Number(p.totalTTC).toFixed(0)} {state?.settings?.devise || '€'}
                        </span>
                      )}
                    </Link>
                  ))}
                  {customEvents.map((ev) => (
                    <span key={ev.id} className={styles.eventCustom} title={ev.note || ev.title}>
                      <CalendarIcon size={12} />
                      <span>{ev.title}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
