import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import PropertyDetail from './pages/PropertyDetail';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Saved from './pages/Saved';
import Messages from './pages/Messages';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />
        <Route path="/add-property" element={<AddProperty />} />
        <Route path="/edit-property/:id" element={<EditProperty />} />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'dark:bg-[#1c2027] dark:text-white',
          duration: 3000,
          style: {
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        }}
      />
    </BrowserRouter>
  );
}
