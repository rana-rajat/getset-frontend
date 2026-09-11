import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import PropertyDetail from './pages/PropertyDetail';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Saved from './pages/Saved';
import Messages from './pages/Messages';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/properties/:id" element={<PropertyDetail />} />

        {/* Auth-required */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />

        {/* Owner-only */}
        <Route path="/add-property" element={<AddProperty />} />
        <Route path="/edit-property/:id" element={<EditProperty />} />
      </Routes>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            padding: '14px 18px',
            fontFamily: 'inherit',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 4px 24px -4px rgba(0,0,0,0.15)',
          },
        }}
      />
    </BrowserRouter>
  );
}
