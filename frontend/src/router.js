import { createRouter, createWebHistory } from 'vue-router'
import { userResource } from '@/stores/user'
import { sessionStore } from '@/stores/session'
import { viewsStore } from '@/stores/views'

const routes = [
  {
    path: '/',
    name: 'Home',
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/pages/MobileNotification.vue'),
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard.vue'),
  },
  {
    alias: '/leads',
    path: '/leads/view/:viewType?',
    name: 'Leads',
    component: () => import('@/pages/Leads.vue'),
  },
  {
    path: '/leads/:leadId',
    name: 'Lead',
    component: () => import(`@/pages/${handleMobileView('Lead')}.vue`),
    props: true,
  },
  {
    alias: '/deals',
    path: '/deals/view/:viewType?',
    name: 'Deals',
    component: () => import('@/pages/Deals.vue'),
  },
  {
    path: '/deals/:dealId',
    name: 'Deal',
    component: () => import(`@/pages/${handleMobileView('Deal')}.vue`),
    props: true,
  },
  {
    alias: '/opportunitys',
    path: '/opportunity/view/:viewType?',
    name: 'Opportunitys',
    component: () => import('@/pages/Opportunitys.vue'),
  },
  {
    path: '/opportunitys/:dealId',
    name: 'Opportunity',
    component: () => import(`@/pages/${handleMobileView('Opportunity')}.vue`),
    props: true,
  },
  {
    alias: '/notes',
    path: '/notes/view/:viewType?',
    name: 'Notes',
    component: () => import('@/pages/Notes.vue'),
  },
  {
    alias: '/tasks',
    path: '/tasks/view/:viewType?',
    name: 'Tasks',
    component: () => import('@/pages/Tasks.vue'),
  },
  {
    alias: '/contacts',
    path: '/contacts/view/:viewType?',
    name: 'Contacts',
    component: () => import('@/pages/Contacts.vue'),
  },
  {
    path: '/contacts/:contactId',
    name: 'Contact',
    component: () => import(`@/pages/${handleMobileView('Contact')}.vue`),
    props: true,
  },
  {
    alias: '/organizations',
    path: '/organizations/view/:viewType?',
    name: 'Organizations',
    component: () => import('@/pages/Organizations.vue'),
  },
  {
    path: '/organizations/:organizationId',
    name: 'Organization',
    component: () => import(`@/pages/${handleMobileView('Organization')}.vue`),
    props: true,
  },
  {
    alias: '/call-logs',
    path: '/call-logs/view/:viewType?',
    name: 'Call Logs',
    component: () => import('@/pages/CallLogs.vue'),
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: () => import('@/pages/Welcome.vue'),
  },
  {
    path: '/:invalidpath',
    name: 'Invalid Page',
    component: () => import('@/pages/InvalidPage.vue'),
  },
]

const handleMobileView = (componentName) => {
  return window.innerWidth < 768 ? `Mobile${componentName}` : componentName
}

let router = createRouter({
  history: createWebHistory('/crm'),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const { isLoggedIn } = sessionStore()

  isLoggedIn && (await userResource.promise)

  // If userResource didn't include roles, fetch users and populate roles as a fallback
  try {
    const userRolesPresent = Array.isArray(userResource.data?.roles) && userResource.data.roles.length > 0
    if (isLoggedIn && !userRolesPresent) {
      const session = sessionStore()
      const sessionUser = session.user
      console.log('[CRM DEBUG] userResource.roles missing, fetching crm.api.session.get_users as fallback')
      const res = await (await import('frappe-ui')).call('crm.api.session.get_users')
      // res is expected to be [users, crm_users]
      const users = res?.[0] || res?.users || []
      const found = users.find((u) => u.name === sessionUser || u.email === sessionUser)
      if (found) {
        // assign roles onto userResource.data for downstream checks
        if (!userResource.data) userResource.data = {}
        userResource.data.roles = found.roles || []
        console.log('[CRM DEBUG] Fallback roles set from get_users:', userResource.data.roles)
      }
    }
  } catch (err) {
    console.warn('[CRM DEBUG] fallback role fetch failed', err)
  }

  if (to.name === 'Home' && isLoggedIn) {
    const { views, getDefaultView } = viewsStore()
    await views.promise

      let defaultView = getDefaultView()
      const userRoles = userResource.data?.roles || []
      console.log('[CRM DEBUG] userRoles:', userRoles)
      console.log('[CRM DEBUG] defaultView:', defaultView)
      if (userRoles.includes('Dashboard Manager')) {
        console.log('[CRM DEBUG] Redirecting to Dashboard')
        next({ name: 'Dashboard' })
        return
      }
      if (!defaultView) {
        console.log('[CRM DEBUG] No defaultView, redirecting to Leads')
        next({ name: 'Leads' })
        return
      }

      let { route_name, type, name, is_standard } = defaultView
      route_name = route_name || 'Leads'
      console.log('[CRM DEBUG] Redirecting to', route_name, type, name, is_standard)

      if (name && !is_standard) {
        next({ name: route_name, params: { viewType: type }, query: { view: name } })
      } else {
        next({ name: route_name, params: { viewType: type } })
      }
  } else if (!isLoggedIn) {
    window.location.href = '/login?redirect-to=/crm'
  } else if (to.matched.length === 0) {
    next({ name: 'Invalid Page' })
  } else if (['Deal', 'Lead'].includes(to.name) && !to.hash) {
    let storageKey = to.name === 'Deal' ? 'lastDealTab' : 'lastLeadTab'
    const activeTab = localStorage.getItem(storageKey) || 'activity'
    const hash = '#' + activeTab
    next({ ...to, hash })
  } else {
    next()
  }
})

export default router
