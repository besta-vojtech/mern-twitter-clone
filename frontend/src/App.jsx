import { Route, Routes } from "react-router-dom";

import LoginPage from "./pages/auth/login/LoginPage.jsx"
import SignUpPage from "./pages/auth/signup/SignUpPage.jsx"
import HomePage from "./pages/home/HomePage.jsx"
import NotificationPage from "./pages/notifications/NotificationPage.jsx";
import ProfilePage from "./pages/profile/ProfilePage.jsx";

import RightPanel from "./components/common/RightPanel.jsx";
import Sidebar from "./components/common/Sidebar.jsx";

function App() {
  return (
    <div className='flex max-w-6xl mx-auto'>
      <Sidebar /> {/* Common component, because it is not wrapped with Routes. Will display on all pages (all routes) */}

      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/signup' element={<SignUpPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/notifications' element={<NotificationPage />} />
        <Route path='/profile/:username' element={<ProfilePage />} />
      </Routes>

      <RightPanel />
    </div>
  );
}

export default App
