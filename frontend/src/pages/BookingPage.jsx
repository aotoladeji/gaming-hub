import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/api';

export default function BookingPage() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [stations, setStations] = useState([]);
  const [form, setForm] = useState({
    customer_name: '', phone_number: '', customer_email: '', booking_date: '', start_time: '', duration_hours: 1, station_id: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    api.getGames(true).then((data) => {
      const games = data.games || [];
      const found = games.find((g) => String(g.id) === String(gameId));
      setGame(found || null);
      if (found) {
        api.getStations(found.console_type).then(setStations).catch(() => {});
      }
    });
  }, [gameId]);

  const totalPrice = game ? (Number(game.price_per_hour) * Number(form.duration_hours || 0)).toFixed(2) : '0.00';

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setFormError('');
    setSubmitting(true);
    try {
      const booking = await api.createBooking({
        ...form,
        game_id: Number(gameId),
        station_id: Number(form.station_id),
        duration_hours: Number(form.duration_hours),
      });
      setConfirmation(booking);
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!game) {
    return <div className="container" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Loading game details…</div>;
  }

  if (confirmation) {
    return <ConfirmationScreen booking={confirmation} />;
  }

  return (
    <div className="container" style={{ maxWidth: 560, padding: '48px 24px' }}>
      <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13 }}>&larr; Back to games</Link>

      <div className="card" style={{ padding: 28, marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26 }}>{game.title}</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{game.console_type}</div>
          </div>
          <div className="mono" style={{ color: 'var(--mint)', fontWeight: 700, fontSize: 18 }}>
            ₦{Number(game.price_per_hour).toLocaleString()}/hr
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label>Full Name</label>
            <input name="customer_name" value={form.customer_name} onChange={handleChange} placeholder="e.g. Ada Obi" required />
            {errors.customer_name && <div className="field-error">{errors.customer_name[0]}</div>}
          </div>

          <div>
            <label>Phone Number</label>
            <input name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="e.g. 0801 234 5678" required />
            {errors.phone_number && <div className="field-error">{errors.phone_number[0]}</div>}
          </div>

          <div>
            <label>Email <span style={{ textTransform: 'none', color: 'var(--text-muted)', fontWeight: 400 }}>(optional — for your e-ticket)</span></label>
            <input type="email" name="customer_email" value={form.customer_email} onChange={handleChange} placeholder="e.g. ada@example.com" />
            {errors.customer_email && <div className="field-error">{errors.customer_email[0]}</div>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label>Date</label>
              <input type="date" name="booking_date" value={form.booking_date} onChange={handleChange} min={new Date().toISOString().slice(0, 10)} required />
              {errors.booking_date && <div className="field-error">{errors.booking_date[0]}</div>}
            </div>
            <div>
              <label>Start Time</label>
              <input type="time" name="start_time" value={form.start_time} onChange={handleChange} required />
              {errors.start_time && <div className="field-error">{errors.start_time[0]}</div>}
            </div>
          </div>

          <div>
            <label>Duration (hours)</label>
            <input type="number" name="duration_hours" min="1" max="12" step="1" value={form.duration_hours} onChange={handleChange} required />
            {errors.duration_hours && <div className="field-error">{errors.duration_hours[0]}</div>}
          </div>

          <div>
            <label>Station</label>
            <select name="station_id" value={form.station_id} onChange={handleChange} required>
              <option value="" disabled>Select an available station</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id} disabled={s.status === 'maintenance'}>
                  {s.name} {s.status === 'maintenance' ? '(under maintenance)' : ''}
                </option>
              ))}
            </select>
            {errors.station_id && <div className="field-error">{errors.station_id[0]}</div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Estimated total</span>
            <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--mint)' }}>₦{Number(totalPrice).toLocaleString()}</span>
          </div>

          {formError && <div className="field-error">{formError}</div>}

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Booking…' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ConfirmationScreen({ booking }) {
  return (
    <div className="container" style={{ maxWidth: 480, padding: '64px 24px', textAlign: 'center' }}>
      <div className="card" style={{ padding: 32 }}>
        <div className="badge badge-confirmed" style={{ marginBottom: 16 }}>Booking Confirmed</div>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>You're booked in!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Show this ticket ID at the counter to check in.</p>

        <div style={{ background: 'var(--bg-alt)', border: '1px dashed var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>TICKET ID</div>
          <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: 'var(--violet)', letterSpacing: '0.05em' }}>
            {booking.ticket_number}
          </div>
        </div>

        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
          <Row label="Game" value={booking.game_title} />
          <Row label="Station" value={booking.station_name} />
          <Row label="Date" value={booking.booking_date} />
          <Row label="Time" value={`${booking.start_time.slice(0,5)} – ${booking.end_time.slice(0,5)}`} />
          <Row label="Duration" value={`${booking.duration_hours} hour(s)`} />
          <Row label="Amount" value={`₦${Number(booking.total_price).toLocaleString()}`} highlight />
        </div>

        <Link to="/" className="btn btn-outline" style={{ marginTop: 26, width: '100%' }}>Back to home</Link>
        <Link to={`/manage?ticket=${booking.ticket_number}`} style={{ display: 'block', marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>
          Need to cancel or check this ticket later? Manage it here.
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className={highlight ? 'mono' : ''} style={{ fontWeight: 600, color: highlight ? 'var(--mint)' : 'var(--text)' }}>{value}</span>
    </div>
  );
}
