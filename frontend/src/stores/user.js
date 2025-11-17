import router from '@/router'
import { createResource } from 'frappe-ui'

export const userResource = createResource({
  url: 'frappe.auth.get_logged_user',
  cache: 'User',
  // Log the loaded user data for debugging roles
  transform(data) {
    console.log('[CRM DEBUG] userResource loaded:', data)
    return data
  },
  onError(error) {
    if (error && error.exc_type === 'AuthenticationError') {
      router.push({ name: 'Home' })
    }
  },
})
