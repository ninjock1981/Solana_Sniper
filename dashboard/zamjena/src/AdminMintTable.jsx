
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminMintTable() {
  const [data, setData] = useState([]);
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

  return (
    <div className="p-6 text-white bg-gray-950 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">📋 Mintani NFT-ovi</h1>
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
          {data.map((item, i) => (
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
