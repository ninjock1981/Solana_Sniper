
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminMintTable from './AdminMintTable';
import AdminPanel from './AdminPanel';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminPanel />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/mints" element={<AdminMintTable />} />
      </Routes>
    </BrowserRouter>
  );
}
