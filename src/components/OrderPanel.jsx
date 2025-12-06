
import React, { useState } from 'react';

export default function OrderPanel({ symbol, price }) {
    const [side, setSide] = useState('BUY');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    const executeOrder = async () => {
        setLoading(true);
        setMsg(null);
        try {
            const res = await fetch('/api/paper/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, side, quantity, strategy: 'MANUAL' })
            });
            const data = await res.json();
            if (data.success) {
                setMsg({ type: 'success', text: 'ORDER FILLED' });
            } else {
                setMsg({ type: 'error', text: data.error });
            }
        } catch (e) {
            setMsg({ type: 'error', text: 'Execution Failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-panel p-4 rounded-xl border border-white/10">
            <h3 className="text-neon-green font-bold font-mono text-sm mb-4">EXECUTION_TERMINAL</h3>

            <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                    onClick={() => setSide('BUY')}
                    className={`py-2 rounded font-mono text-xs font-bold border transition ${side === 'BUY'
                            ? 'bg-green-500/20 border-green-500 text-green-500'
                            : 'border-gray-800 text-gray-600'
                        }`}
                >
                    BUY
                </button>
                <button
                    onClick={() => setSide('SELL')}
                    className={`py-2 rounded font-mono text-xs font-bold border transition ${side === 'SELL'
                            ? 'bg-red-500/20 border-red-500 text-red-500'
                            : 'border-gray-800 text-gray-600'
                        }`}
                >
                    SELL
                </button>
            </div>

            <div className="mb-4">
                <label className="text-[10px] text-gray-500 font-mono uppercase block mb-1">Quantity</label>
                <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-black/50 border border-gray-700 rounded p-2 text-white font-mono focus:border-neon-blue outline-none"
                />
            </div>

            <div className="mb-4 text-xs font-mono text-gray-400 flex justify-between">
                <span>EST. TOTAL</span>
                <span className="text-white">${(price * quantity).toFixed(2)}</span>
            </div>

            <button
                onClick={executeOrder}
                disabled={loading}
                className={`w-full py-3 rounded font-mono font-bold tracking-widest text-xs transition ${side === 'BUY' ? 'bg-green-600 hover:bg-green-500 text-black' : 'bg-red-600 hover:bg-red-500 text-black'
                    }`}
            >
                {loading ? 'PROCESSING...' : `SUBMIT ${side} ORDER`}
            </button>

            {msg && (
                <div className={`mt-2 text-center text-xs font-mono ${msg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {msg.text}
                </div>
            )}
        </div>
    );
}
