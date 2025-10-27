<template>
  <div class="p-6">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-10">
      <LoadingIndicator class="h-6 w-6" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-red-500 text-center py-10">
      {{ error }}
    </div>

    <!-- Document View -->
    <div v-else>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-semibold">
          {{ __(doctype) }} - {{ docname }}
        </h1>
        <Button variant="solid" theme="blue" @click="updateDoc" :loading="isSaving">
          {{ __('Update') }}
        </Button>
      </div>

      <!-- Dynamic Field Layout -->
       <div class="flex flex-col gap-4">
        <!-- Deal -->
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Deal/Customer') }}</div>
          <Link
            class="form-control"
            :value="_opportunity.deal"
            doctype="CRM Deal"
            @change="(option) => (_opportunity.deal = option)"
            :placeholder="__('Select Deal')"
            :hideMe="true"
          >
            <template #item-label="{ option }">{{ option.label }}</template>
          </Link>
        </div>

        <!-- Opportunity For -->
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Opportunity For') }}</div>
          <Link
            class="form-control"
            :value="_opportunity.opportunity_for"
            doctype="CRM Opportunity For"
            @change="(option) => (_opportunity.opportunity_for = option)"
            :placeholder="__('Select Opportunity For')"
            :hideMe="true"
          >
            <template #item-label="{ option }">{{ option.label }}</template>
          </Link>
        </div>

        <!-- More Info -->
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('More Info') }}</div>
          <textarea
            v-model="_opportunity.more_info"
            rows="3"
            class="w-full rounded border border-gray-300 p-2"
            placeholder="Enter details"
          ></textarea>
        </div>

        <!-- Assigned To -->
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Assigned to') }}</div>
          <Link
            class="form-control"
            :value="getUser(_opportunity.assigned_to)?.full_name"
            doctype="User"
            @change="(option) => (_opportunity.assigned_to = option)"
            :placeholder="__('Assigned to')"
            :filters="{
              name: ['in', users.data.crmUsers?.map((user) => user.name)],
            }"
            :hideMe="true"
          >
            <template #prefix>
              <UserAvatar class="mr-2 !h-4 !w-4" :user="_opportunity.assigned_to" />
            </template>
          </Link>
        </div>

        <!-- Expected Closing Date -->
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Expected Closing Date') }}</div>
          <DateTimePicker
            class="datepicker w-36"
            v-model="_opportunity.expected_closing_date"
            :placeholder="__('Expected Closing Date')"
            :formatter="(date) => getFormat(date, '', false, false)"
          />
        </div>

        <!-- Status Dropdown -->
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Status') }}</div>
          <Dropdown :options="statusOptions(updateStatus)">
            <Button :label="_opportunity.status" class="justify-between w-full" />
          </Dropdown>
        </div>

        <ErrorMessage class="mt-4" v-if="error" :message="__(error)" />
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usersStore } from '@/stores/users'
import { Button, LoadingIndicator, call, toast, createResource } from 'frappe-ui'
//import FieldLayout from '@/components/FieldLayout/FieldLayout.vue'

const route = useRoute()
const { users, getUser } = usersStore()
const doctype = 'CRM Opportunity'
const docname = route.params.opportunityId || window.location.pathname.split('/').pop()

function updateStatus(status) {
  _opportunity.value.status = status
}

const statusOptions = (callback) => [
  { label: 'Open', value: 'Open', onClick: () => callback('Open') },
  { label: 'Quote Sent', value: 'Quote Sent', onClick: () => callback('Quote Sent') },
  { label: 'Won', value: 'Won', onClick: () => callback('Won') },
  { label: 'Lost', value: 'Lost', onClick: () => callback('Lost') },
  { label: 'Backlog', value: 'Backlog', onClick: () => callback('Backlog') },
]

const loading = ref(true)
const error = ref(null)
const isSaving = ref(false)

const _opportunity = ref({
  name: '',
  deal: '',
  opportunity_for: '',
  more_info: '',
  assigned_to: '',
  expected_closing_date: '',
  status: 'Open'
})
const tabs = ref([])

// ✅ Fetch meta and document data
onMounted(async () => {
  try {
    // Get layout config
    const layoutRes = await call('crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_fields_layout', {
      doctype,
      type: 'Detail'
    })
    tabs.value = layoutRes

    // Get document data
    const docRes = await call('frappe.client.get', {
      doctype,
      name: docname
    })
    _opportunity.value = docRes
  } catch (err) {
    error.value = err.messages?.[0] || 'Failed to load document'
  } finally {
    loading.value = false
  }
})

// ✅ Update document
async function updateDoc() {
  try {
    isSaving.value = true
    await call('frappe.client.save', {
      doc: _opportunity.value
    })
    toast.success(__('Document updated successfully'))
  } catch (err) {
    toast.error(__('Error updating document'))
  } finally {
    isSaving.value = false
  }
}
</script>
