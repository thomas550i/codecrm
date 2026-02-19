<template>
  <div
    v-if="visible"
    ref="target"
    class="absolute z-20 h-screen bg-surface-white transition-all duration-300 ease-in-out"
    :style="{
      'box-shadow': '8px 0px 8px rgba(0, 0, 0, 0.1)',
      'max-width': '350px',
      'min-width': '350px',
      left: 'calc(100% + 1px)',
    }"
  >
    <div class="flex h-screen flex-col text-ink-gray-9">
      <div
        class="z-20 flex items-center justify-between border-b bg-surface-white px-5 py-2.5"
      >
        <div class="text-base font-medium">{{ __('Notifications') }}</div>
        <div class="flex gap-1">
          <Button
            :tooltip="__('Mark all as read')"
            :icon="MarkAsDoneIcon"
            variant="ghost"
            @click="markAllAsRead"
          />
          <Button
            :tooltip="__('Close')"
            icon="x"
            variant="ghost"
            @click="() => toggle()"
          />
        </div>
      </div>
      <div
        v-if="notifications.data?.length"
        class="divide-y divide-outline-gray-modals overflow-auto text-base"
      >
        <RouterLink
          v-for="n in notifications.data"
          :key="n.creation"
          :to="getRoute(n)"
          class="flex cursor-pointer items-start gap-2.5 px-4 py-2.5 hover:bg-surface-gray-2"
          :style="n.read ? '' : 'background: #fff7f7;'"
          @click="markAsRead(n.comment || n.notification_type_doc)"
        >
          <div class="mt-1 flex items-center gap-2.5">
            <div
              class="size-[8px] rounded-full"
              :class="n.read ? 'bg-gray-300' : 'bg-red-500 animate-pulse'"
            />
            <WhatsAppIcon v-if="n.type == 'WhatsApp'" class="size-7" />
            <UserAvatar v-else :user="n.from_user.name" size="lg" />
          </div>
          <div>
            <div v-if="n.notification_text" v-html="n.notification_text" />
            <div v-else class="mb-2 space-x-1 leading-5" :class="n.read ? 'text-ink-gray-5' : 'text-ink-gray-9 font-bold'">
              <span class="font-medium">
                {{ n.from_user.full_name }}
              </span>
              <span>
                {{ __('mentioned you in {0}', [n.reference_doctype]) }}
              </span>
              <span class="font-medium">
                {{ n.reference_name }}
              </span>
            </div>
            <div class="text-sm" :class="n.read ? 'text-ink-gray-5' : 'text-red-500 font-semibold'">
              {{ __(timeAgo(n.creation)) }}
            </div>
          </div>
        </RouterLink>
      </div>
      <div
        v-else
        class="flex flex-1 flex-col items-center justify-center gap-2"
      >
        <NotificationsIcon class="h-20 w-20 text-ink-gray-2" />
        <div class="text-lg font-medium text-ink-gray-4">
          {{ __('No new notifications') }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import WhatsAppIcon from '@/components/Icons/WhatsAppIcon.vue'
import MarkAsDoneIcon from '@/components/Icons/MarkAsDoneIcon.vue'
import NotificationsIcon from '@/components/Icons/NotificationsIcon.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import {
  visible,
  notifications,
  notificationsStore,
} from '@/stores/notifications'
import { globalStore } from '@/stores/global'
import { timeAgo } from '@/utils'
import { onClickOutside } from '@vueuse/core'
import { capture } from '@/telemetry'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const { $socket } = globalStore()
const { mark_as_read, toggle, mark_doc_as_read } = notificationsStore()
const router = useRouter()

const target = ref(null)
onClickOutside(
  target,
  () => {
    if (visible.value) toggle()
  },
  {
    ignore: ['#notifications-btn'],
  },
)

function markAsRead(doc) {
  capture('notification_mark_as_read')
  mark_doc_as_read(doc)
}

function markAllAsRead() {
  capture('notification_mark_all_as_read')
  mark_as_read.reload()
}

// Request browser notification permission
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Show browser notification
function showBrowserNotification(notification) {
  if (!notification || Notification.permission !== 'granted') return

  // Extract text from HTML notification_text
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = notification.notification_text || ''
  const notificationText = tempDiv.textContent || tempDiv.innerText || 'New notification'

  const browserNotification = new Notification('CRM Notification', {
    body: notificationText.trim(),
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: notification.notification_type_doc || 'crm-notification',
    requireInteraction: false,
    silent: false,
  })

  // Handle notification click
  browserNotification.onclick = () => {
    window.focus()
    router.push(getRoute(notification))
    markAsRead(notification.comment || notification.notification_type_doc)
    browserNotification.close()
  }

  // Auto close after 10 seconds
  setTimeout(() => {
    browserNotification.close()
  }, 10000)
}

onBeforeUnmount(() => {
  $socket.off('crm_notification')
})

onMounted(() => {
  // Request notification permission on mount
  requestNotificationPermission()

  $socket.on('crm_notification', () => {
    notifications.reload().then(() => {
      // Show browser notification for the latest unread notification
      const latestNotification = notifications.data?.find(n => !n.read)
      if (latestNotification) {
        showBrowserNotification(latestNotification)
      }
    })
  })
})

function getRoute(notification) {
  let params = {
    leadId: notification.reference_name,
  }
  if (notification.route_name === 'Deal') {
    params = {
      dealId: notification.reference_name,
    }
  }

  return {
    name: notification.route_name,
    params: params,
    hash: notification.hash,
  }
}
</script>
