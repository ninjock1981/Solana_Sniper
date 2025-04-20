
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminMintTable() {
  const [data, setData] = useState([]);
  const [walletFilter, setWalletFilter] = useState('');
  const [mintFilter, setMintFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token !== 'secret123') {
      navigate('/admin');
      return;
    }

    fetch('https://solana-sniper-6igl.onrender.com:8082/minted')
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin');
  };

  const handleCSVDownload = () => {
    window.open('https://solana-sniper-6igl.onrender.com:8082/download', '_blank');
  };

  const filteredData = data.filter(item =>
    item.wallet_address.toLowerCase().includes(walletFilter.toLowerCase()) &&
    item.mint_address.toLowerCase().includes(mintFilter.toLowerCase())
  );

  return (
    <div className="p-6 text-white bg-gray-950 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📋 Mintani NFT-ovi</h1>
        <div className="flex gap-2">
          <button onClick={handleCSVDownload} className="bg-blue-700 px-3 py-1 rounded">📥 CSV</button>
          <button onClick={handleLogout} className="bg-red-600 px-3 py-1 rounded">Logout</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="🎯 Filter po walletu..."
          className="p-2 rounded bg-gray-800 border border-gray-700 w-full md:w-1/2"
          value={walletFilter}
          onChange={(e) => setWalletFilter(e.target.value)}
        />
        <input
          type="text"
          placeholder="🧬 Filter po mint adresi..."
          className="p-2 rounded bg-gray-800 border border-gray-700 w-full md:w-1/2"
          value={mintFilter}
          onChange={(e) => setMintFilter(e.target.value)}
        />
      </div>

      <table className="w-full text-left border border-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">Mint Address</th>
            <th className="p-2">Wallet</th>
            <th className="p-2">Vrijeme</th>
            <th className="p-2">Linkovi</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((item, i) => (
            <tr key={i} className="border-t border-gray-700">
              <td className="p-2">{item.id}</td>
              <td className="p-2">{item.mint_address}</td>
              <td className="p-2">{item.wallet_address}</td>
              <td className="p-2">{item.timestamp}</td>
              <td className="p-2">
                <a href={`https://solscan.io/token/${item.mint_address}`} target="_blank" className="text-blue-400 mr-2">Solscan</a>
                <a href={`https://solana.fm/address/${item.mint_address}`} target="_blank" className="text-pink-400">SolanaFM</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
