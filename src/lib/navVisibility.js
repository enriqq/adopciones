/**
 * Pestañas visibles según rol (RBAC UI).
 * @param {{
 *   isLoggedIn: boolean,
 *   systemRole: string | null,
 *   hasRefugio: boolean,
 * }} ctx
 */
export function getVisibleNav(ctx) {
  const { isLoggedIn, systemRole, hasRefugio } = ctx
  const role = systemRole ?? (isLoggedIn ? 'user' : null)

  return {
    explore: true,
    favorites: isLoggedIn && role !== 'admin',
    myApplications: isLoggedIn && (role === 'user' || role === 'shelter'),
    profile: isLoggedIn,
    registerPet: isLoggedIn && (role === 'shelter' || role === 'admin') && hasRefugio,
    shelterDashboard:
      isLoggedIn && (role === 'shelter' || role === 'admin'),
    admin: isLoggedIn && role === 'admin',
  }
}

/**
 * @param {string} tab
 * @param {ReturnType<typeof getVisibleNav>} visible
 */
export function isTabAllowed(tab, visible) {
  const map = {
    explore: visible.explore,
    favorites: visible.favorites,
    'my-applications': visible.myApplications,
    profile: visible.profile,
    register: visible.registerPet,
  }
  return map[tab] ?? false
}
