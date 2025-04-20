
import { useEffect, useRef, useState } from 'react';

export default function AdminPanel() {
  const wsRef = useRef(null);
  const [log, setLog] = useState([]);
  const [status, setStatus] = useState("Nepoznat");
  const [score, setScore] = useState(null);
  const [minted, setMinted] = useState([]);
  const [search, setSearch] = useState("");
  const [walletFilter, setWalletFilter] = useState("");
  const [mintFilter, setMintFilter] = useState("");

  useEffect(() => {
    const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}?token=secret123`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "log") setLog(prev => [data.message, ...prev.slice(0, 49)]);
      if (data.type === "status") setStatus(data.message);
      if (data.type === "score") setScore(data.data);
      if (data.type === "minted") setMinted(data.data);
    };
    return () => ws.close();
  }, []);

  const sendCommand = (cmd) => {
    if (wsRef.current?.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: "admin_command", command: cmd }));
    }
  };

  const filtered = minted.filter(n =>
    (!search || n.mint_address.includes(search)) &&
    (!walletFilter || n.wallet_address.includes(walletFilter)) &&
    (!mintFilter || n.mint_address.toLowerCase().includes(mintFilter.toLowerCase()))
  );

  const colorFor = (rec) => rec === "BUY" ? "text-green-500" : rec === "HOLD" ? "text-yellow-400" : "text-red-500";

  return (
    <div className="p-4 space-y-4 text-white">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <p>Status: {status}</p>

      <div className="flex gap-2">
        <button onClick={() => sendCommand("start")} className="bg-green-600 px-4 py-2 rounded">Start</button>
        <button onClick={() => sendCommand("stop")} className="bg-red-600 px-4 py-2 rounded">Stop</button>
        <button onClick={() => sendCommand("test_telegram")} className="bg-purple-600 px-4 py-2 rounded">📩 Test Telegram</button>
        <button onClick={() => window.open("https://solana-sniper-6igl.onrender.com:8082/download", "_blank")} className="bg-blue-600 px-4 py-2 rounded">📥 CSV Export</button>
      </div>

      {score && (
        <div className="mt-4 p-2 bg-black rounded">
          AI SCORE: <span className={`font-bold ${colorFor(score.recommendation)}`}>{score.value}/100 ({score.recommendation})</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <input
          type="text"
          placeholder="🔍 Mint search..."
          className="p-2 rounded bg-gray-800 border border-gray-600"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="🎯 Wallet filter..."
          className="p-2 rounded bg-gray-800 border border-gray-600"
          value={walletFilter}
          onChange={e => setWalletFilter(e.target.value)}
        />
        <input
          type="text"
          placeholder="🧬 Mint filter..."
          className="p-2 rounded bg-gray-800 border border-gray-600"
          value={mintFilter}
          onChange={e => setMintFilter(e.target.value)}
        />
      </div>

      <div className="mt-4 space-y-2">
        {filtered.map((nft, i) => (
          <div key={i} className="p-3 bg-gray-900 rounded border border-gray-700">
            <div className="text-sm">🧬 Mint: <span className="text-blue-400">{nft.mint_address}</span></div>
            <div className="text-sm">👛 Wallet: <span className="text-yellow-300">{nft.wallet_address}</span></div>
            <div className="text-sm">🕒 {nft.timestamp}</div>
            <div className="text-sm mt-1">🔗 <a href={nft.solscan} className="underline text-blue-300" target="_blank" rel="noreferrer">Solscan</a> | <a href={nft.solanafm} className="underline text-pink-300" target="_blank" rel="noreferrer">SolanaFM</a></div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">📋 Logovi</h2>
        <div className="bg-black text-white p-4 rounded h-64 overflow-y-scroll text-sm">
          {log.map((entry, i) => <div key={i}>{entry}</div>)}
        </div>
      </div>
    </div>
  );
}
