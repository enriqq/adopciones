import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RoleGuard } from '../components/auth/RoleGuard.jsx'
import PublicApp from '../App.jsx'
import AdminDashboard from '../pages/admin/AdminDashboard.jsx'
import ShelterDashboardPage from '../pages/ShelterDashboardPage.jsx'
import { useProfile } from '../hooks/useProfile.js'

function ShelterDashboardRoute() {
  const { session } = useProfile(null)
  return <ShelterDashboardPage currentUserId={session?.user?.id ?? null} />
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicApp />} />

        <Route element={<RoleGuard allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard defaultTab="pets" />} />
          <Route path="/admin/pets" element={<AdminDashboard defaultTab="pets" />} />
          <Route path="/admin/users" element={<AdminDashboard defaultTab="users" />} />
        </Route>

        <Route element={<RoleGuard allowedRoles={['shelter', 'admin']} />}>
          <Route path="/shelter-dashboard" element={<ShelterDashboardRoute />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
