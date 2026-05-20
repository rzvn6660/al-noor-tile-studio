import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTileStore } from '../hooks/useTileStore';

const EMIRATES = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];

const SampleRequestModal = ({ onClose }) => {
  const { selectedFloorTile, selectedWallTile } = useTileStore();
  const [form, setForm] = useState({ name: '', phone: '', emirate: 'Dubai', address: '' });

  const handleSubmit = () => {
    if (!form.name || !form.phone) return;
    const number = import.meta.env.VITE_WHATSAPP_NUMBER || '971501234567';
    const floorName = selectedFloorTile?.name || 'None';
    const wallName = selectedWallTile?.name || 'None';
    const msg = `Hi Al-Noor! 🌟 I'd like to request free tile samples:\n\n` +
      `🪨 Floor Tile: ${floorName}\n` +
      `🧱 Wall Tile: ${wallName}\n\n` +
      `📋 My Details:\n` +
      `Name: ${form.name}\n` +
      `Phone: ${form.phone}\n` +
      `Emirate: ${form.emirate}\n` +
      `Address: ${form.address}\n\n` +
      `Please confirm availability and delivery time. Shukran! 🙏`;
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, '_blank');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '380px',
          background: 'rgba(8,8,24,0.98)',
          border: '1px solid rgba(201,169,110,0.3)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 40px rgba(201,169,110,0.08)',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#c9a96e', fontSize: '18px', fontWeight: 600 }}>
            📦 Request Free Samples
          </h2>
          <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
            We'll deliver to your door across UAE
          </p>
        </div>

        {/* Selected tiles preview */}
        <div style={{
          display: 'flex', gap: '10px', marginBottom: '20px',
          padding: '12px', background: 'rgba(255,255,255,0.03)',
          borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {[['Floor', selectedFloorTile, '#c9a96e'], ['Wall', selectedWallTile, '#7ab8f5']].map(([label, tile, color]) => (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '8px',
                background: tile?.hex_color || '#333',
                border: `2px solid ${color}`,
                margin: '0 auto 6px',
                boxShadow: `0 0 10px ${color}40`,
              }} />
              <div style={{ fontSize: '10px', color, letterSpacing: 1 }}>{label}</div>
              <div style={{ fontSize: '11px', color: '#e8d5b0', marginTop: 2 }}>{tile?.name || '—'}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        {[
          ['name', 'Your Name *', 'text', 'Ahmed Al Mansoori'],
          ['phone', 'Phone Number *', 'tel', '+971 50 000 0000'],
          ['address', 'Delivery Address', 'text', 'Villa 12, Al Barsha...'],
        ].map(([field, label, type, placeholder]) => (
          <div key={field} style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: 1 }}>
              {label.toUpperCase()}
            </label>
            <input
              type={type}
              placeholder={placeholder}
              value={form[field]}
              onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
              style={{
                width: '100%', padding: '10px 12px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px', color: '#e8d5b0', fontSize: '13px',
                fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        ))}

        {/* Emirate selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: 1 }}>
            EMIRATE
          </label>
          <select
            value={form.emirate}
            onChange={e => setForm(f => ({ ...f, emirate: e.target.value }))}
            style={{
              width: '100%', padding: '10px 12px',
              background: 'rgba(8,8,24,0.95)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', color: '#e8d5b0', fontSize: '13px',
              fontFamily: 'inherit', outline: 'none',
            }}
          >
            {EMIRATES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', borderRadius: '8px',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px',
            }}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            style={{
              flex: 2, padding: '12px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #25d366, #128c7e)',
              border: 'none', color: '#fff', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '13px', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <span>💬</span> Send via WhatsApp
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SampleRequestModal;
