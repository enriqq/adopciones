import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAdmin } from '../components/auth/RequireAdmin.jsx'
import PublicApp from '../App.jsx' // layout público (explorar, favoritos, etc.)
import AdminDashboard from '../pages/admin/AdminDashboard.jsx'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicApp />} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminDashboard defaultTab="pets" />} />
          <Route path="/admin/pets" element={<AdminDashboard defaultTab="pets" />} />
          <Route
            path="/admin/users"
            element={<AdminDashboard defaultTab="users" />}
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
