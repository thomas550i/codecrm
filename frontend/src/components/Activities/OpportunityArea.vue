<template>
  <div v-if="tasks.length" class="space-y-2">
    <div
      v-for="(task, i) in tasks"
      :key="task.name"
      class="activity flex justify-between items-center rounded-lg p-3 bg-white shadow-sm hover:bg-gray-50 cursor-pointer"
      @click="modalRef.showOpp(task)"
    >
      <!-- Left Section -->
      <div class="flex flex-col gap-1 truncate">
        <!-- Opportunity For -->
        <div class="text-sm text-gray-600">
          Opportunity for:
          <span class="font-semibold text-gray-900">{{ task.opportunity_for }} -  {{ task.name }}</span>
        </div>

        <!-- Expected Closing Date -->
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <CalendarIcon class="w-4 h-4 text-gray-400" />
          <span class="font-medium">Expected closing date:</span>
          <span>{{ formatDate(task.expected_closing_date, 'D MMM, hh:mm a') }}</span>
        </div>
      </div>

      <!-- Right Section -->
      <div class="flex items-center gap-2">
        <!-- Status Dropdown -->
       <Dropdown :options="oppStatusOptions(modalRef.updateOppStatus, task)" @click.stop>
  <Button
    variant="ghosted"
    class="inline-flex items-center gap-2 text-gray-700 hover:bg-gray-100 rounded-md px-3 py-1 whitespace-nowrap"
  >
    <OpportunityStatusIcon :status="task.status" style="display: inline !important;"/>
    <span>{{ task.status }}</span>
  </Button>
</Dropdown>


        <!-- Actions Menu -->
        <Dropdown
          :options="[
            {
              label: __('Delete'),
              icon: 'trash-2',
              onClick: () => {
                $dialog({
                  title: __('Delete Task'),
                  message: __('Are you sure you want to delete this task?'),
                  actions: [
                    {
                      label: __('Delete'),
                      theme: 'red',
                      variant: 'solid',
                      onClick(close) {
                        modalRef.deleteTask(task.name)
                        close()
                      },
                    },
                  ],
                })
              },
            },
          ]"
          @click.stop
        >
          <Button
            icon="more-horizontal"
            variant="ghosted"
            class="hover:bg-gray-100 text-gray-600 rounded-md"
          />
        </Dropdown>
      </div>
    </div>
  </div>
</template>

<script setup>
import CalendarIcon from '@/components/Icons/CalendarIcon.vue'
import OpportunityStatusIcon from '@/components/Icons/OpportunityStatusIcon.vue'
import TaskPriorityIcon from '@/components/Icons/TaskPriorityIcon.vue'
import DotIcon from '@/components/Icons/DotIcon.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { formatDate, oppStatusOptions } from '@/utils'
import { usersStore } from '@/stores/users'
import { globalStore } from '@/stores/global'
import { Tooltip, Dropdown } from 'frappe-ui'

const props = defineProps({
  tasks: Array,
  modalRef: Object,
})

const { getUser } = usersStore()
const { $dialog } = globalStore()
</script>
