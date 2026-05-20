import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTileStore } from '../hooks/useTileStore';

const QUICK_REPLIES = [
  'Best tiles for bathrooms? 🛁',
  'Price per m²? 💰',
  'Marble vs Granite? 🪨',
  'How to order? 🛒',
  'Delivery to Dubai? 🚚',
  'How many boxes do I need?',
];

const SYSTEM_PROMPT = `You are Noor, a warm, professional, and knowledgeable tile advisor at Al-Noor Building Materials in the UAE. You are fluent in Arabic and English. You know the full tile catalog including Calacatta Gold, Nero Marquina, Emperador Dark, Statuario White, Sahara Noir, Crema Marfil, and many more luxury tiles with their prices in AED. You can advise on: which tiles suit different rooms, installation tips (1.15x area factor for wastage), box calculations, price estimates, marble vs granite differences, grout selection, slip resistance for wet areas, delivery across UAE (Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain). Be warm, concise, and professional. Use some Arabic words naturally (Inshallah, Mashallah, Yalla). Always give AED prices when relevant.`;

const ChatAgent = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Marhaba! 👋 I\'m Noor, your personal tile advisor at Al-Noor Studio. How can I help you design your dream space today?',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();
  const { selectedFloorTile, selectedWallTile } = useTileStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;

    if (!apiKey) {
      // Offline fallback response
      setTimeout(() => {
        const fallback = generateFallbackResponse(userText, selectedFloorTile, selectedWallTile);
        setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
        setLoading(false);
      }, 1200);
      return;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 400,
          system: SYSTEM_PROMPT + `\n\nCurrent selection: Floor tile: ${selectedFloorTile?.name} (AED ${selectedFloorTile?.price_aed}/m²), Wall tile: ${selectedWallTile?.name} (AED ${selectedWallTile?.price_aed}/m²).`,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || 'Sorry, I could not process that. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const fallback = generateFallbackResponse(userText, selectedFloorTile, selectedWallTile);
      setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat bubble */}
      <motion.div
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed', bottom: '28px', left: '28px', zIndex: 100,
          width: '56px', height: '56px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #c9a96e, #a07840)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '22px',
          boxShadow: '0 0 20px rgba(201,169,110,0.5), 0 0 40px rgba(201,169,110,0.2)',
        }}
      >
        {open ? '✕' : '✨'}
        {/* Pulse ring */}
        <motion.div
          animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{
            position: 'absolute', width: '56px', height: '56px',
            borderRadius: '50%', border: '2px solid rgba(201,169,110,0.5)',
          }}
        />
      </motion.div>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed', bottom: '96px', left: '24px', zIndex: 99,
              width: '320px', maxHeight: '460px',
              background: 'rgba(8,8,16,0.96)',
              border: '1px solid rgba(201,169,110,0.25)',
              borderRadius: '16px',
              display: 'flex', flexDirection: 'column',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(201,169,110,0.1)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(201,169,110,0.05)',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #c9a96e, #7ab8f5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px',
              }}>✨</div>
              <div>
                <div style={{ color: '#c9a96e', fontWeight: 600, fontSize: '14px' }}>Noor</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Al-Noor Tile Advisor</div>
              </div>
              <div style={{
                marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%',
                background: '#4ade80',
                boxShadow: '0 0 6px #4ade80',
              }} />
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                  }}
                >
                  <div style={{
                    padding: '9px 13px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, rgba(201,169,110,0.25), rgba(201,169,110,0.12))'
                      : 'rgba(255,255,255,0.06)',
                    border: msg.role === 'user' ? '1px solid rgba(201,169,110,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    fontSize: '13px',
                    lineHeight: '1.5',
                    color: '#e8d5b0',
                  }}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div style={{ alignSelf: 'flex-start' }}>
                  <div style={{
                    padding: '10px 14px', borderRadius: '14px 14px 14px 4px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', gap: '5px',
                  }}>
                    {[0,1,2].map(i => (
                      <motion.div key={i}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                        style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c9a96e' }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            <div style={{ padding: '6px 14px', display: 'flex', gap: '6px', overflowX: 'auto', flexWrap: 'nowrap', scrollbarWidth: 'none' }}>
              {QUICK_REPLIES.map((q, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage(q)}
                  style={{
                    flexShrink: 0, padding: '5px 10px', borderRadius: '20px',
                    background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.25)',
                    color: '#c9a96e', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {q}
                </motion.button>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '8px' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask Noor anything..."
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', padding: '9px 12px', color: '#e8d5b0',
                  fontSize: '13px', fontFamily: 'inherit', outline: 'none',
                }}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => sendMessage()}
                style={{
                  padding: '9px 14px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #c9a96e, #a07840)',
                  border: 'none', color: '#080810', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
                }}
              >
                →
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Offline fallback with smart keyword matching
function generateFallbackResponse(text, floorTile, wallTile) {
  const t = text.toLowerCase();
  if (t.includes('bathroom') || t.includes('bath'))
    return 'For bathrooms, I recommend non-slip tiles with a roughness ≥ 0.4 — our Crema Marfil (AED 180/m²) and Arabescato (AED 310/m²) are perfect choices. For walls, Thassos White or Statuario look stunning! 🛁';
  if (t.includes('price') || t.includes('cost') || t.includes('aed'))
    return `Our range starts from AED 165/m² (Sand Dune) to AED 890/m² (Onyx Honey). Your current selection: ${floorTile?.name} at AED ${floorTile?.price_aed}/m² for floor, ${wallTile?.name} at AED ${wallTile?.price_aed}/m² for walls. Shall I calculate the total?`;
  if (t.includes('marble') || t.includes('granite'))
    return 'Great question! Marble offers natural beauty and veining — ideal for walls and low-traffic areas. Granite is denser and more scratch-resistant — perfect for kitchen floors. Both are luxury choices! Mashallah 🪨';
  if (t.includes('order') || t.includes('buy'))
    return 'To order, request samples here and our team will contact you within 24 hours. You can also visit our showroom in Dubai or call +971-X-XXXX-XXXX. We deliver across all 7 Emirates! 🛒';
  if (t.includes('delivery') || t.includes('dubai') || t.includes('sharjah'))
    return 'We deliver across all UAE emirates — Dubai, Abu Dhabi, Sharjah, Ajman, RAK, Fujairah, and UAQ! Standard delivery is 3–5 business days. Large orders may qualify for free delivery, Inshallah! 🚚';
  if (t.includes('boxes') || t.includes('quantity') || t.includes('many'))
    return 'To calculate boxes: measure your area in m², add 15% for wastage and cuts, then divide by the box coverage (usually 1.0–1.44 m²/box). Example: 20m² room → 20 × 1.15 = 23 m² needed. Would you like me to calculate for a specific area? 📐';
  return `Marhaba! I'd be happy to help you choose the perfect tiles. With ${floorTile?.name} on your floor and ${wallTile?.name} on your walls, you have excellent taste! What else would you like to know? ✨`;
}

export default ChatAgent;
