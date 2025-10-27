<template>
  <Dialog
    v-model="show"
    :options="{
      size: '3xl',
      actions: [
        {
          label: isCreateMode ? __('Create Opportunity') : __('Save Changes'),
          variant: 'solid',
          onClick: () => saveOpportunity(),
        },
      ],
    }"
  >
    <template #body-title>
      <h3 class="text-2xl font-semibold leading-6 text-ink-gray-9" style="display: inline-block;">
        {{ isCreateMode ? __('Create Opportunity') : __('Update Opportunity') }}
      </h3>
      &nbsp;
     
  <Button
          v-if="!isCreateMode"
          size="sm"
          :label="'Create Quotation'"
          @click="createQuotation"
        >
          <template #suffix>
            <ArrowUpRightIcon class="w-4 h-4" />
          </template>
        </Button>



    </template>

    <template #body-content>
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
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { call, Dropdown, DateTimePicker, toast } from 'frappe-ui'
import Link from '@/components/Controls/Link.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { usersStore } from '@/stores/users'
import { getFormat } from '@/utils'

const reload = defineModel('reloadOpp')

async function createQuotation() {
  try {
    if (!_opportunity.value.name) {
      toast.error(__('Please save the Opportunity first.'));
      return;
    }

    if (!_opportunity.value.deal) {
      toast.error(__('Please select a Deal.'));
      return;
    }

    // ✅ Get organization from the linked CRM Deal
    const dealData = await call('frappe.client.get', {
      doctype: 'CRM Deal',
      name: _opportunity.value.deal
    });

    const organization = dealData.organization;
    if (!organization) {
      toast.error(__('The selected Deal does not have an organization.'));
      return;
    }

    // ✅ Call backend method to get quotation URL
    const quotation_url = await call(
      'crm.fcrm.doctype.erpnext_crm_settings.erpnext_crm_settings.get_opportunity_quotation_url',
      {
        crm_deal: _opportunity.value.deal, // Opportunity Name
        organization: organization,          // From Deal
        opp_id: _opportunity.value.name
      }
    );

    if (quotation_url) {
      window.open(quotation_url, '_blank'); // Open Sales Quotation in new tab
    } else {
      toast.error(__('Could not generate quotation link.'));
    }
  } catch (err) {
    toast.error(__('Error creating quotation.'));
    console.error(err);
  }
}



// ✅ Helper to fetch option object
async function getOptionByName(name, doctype) {
  if (!name) return null
  try {
    const response = await call('frappe.client.get', {
      doctype: doctype,
      name: name
    })
    if (response) {
      return {
        label: response.title || response.name,
        value: response.name,
        description: response.name
      }
    }
    return null
  } catch (err) {
    console.error('Error fetching option:', err)
    return null
  }
}

const props = defineProps({
  oppdata: { type: Object, required: false, default: () => ({}) } // Empty by default
})

const show = defineModel()
const { users, getUser } = usersStore()
const error = ref(null)

// ✅ Detect Create or Update Mode
const isCreateMode = computed(() => !_opportunity.value.name) // If no name, it's create mode

// Opportunity data
const _opportunity = ref({
  name: '',
  deal: '',
  opportunity_for: '',
  more_info: '',
  assigned_to: '',
  expected_closing_date: '',
  status: 'Open'
})

// For <Link> value binding
const dealOption = ref(null)
const opportunityForOption = ref(null)

// Watch oppdata and populate fields + fetch options (for update)
watch(
  () => props.oppdata,
  async (val) => {
    if (val && val.name) {
      _opportunity.value = { ...val }
      // if (val.deal) dealOption.value = await getOptionByName(val.deal, 'CRM Deal')
      // if (val.opportunity_for) {
      //   opportunityForOption.value = await getOptionByName(val.opportunity_for, 'CRM Opportunity For')
      // }
    } else {
      // Reset for Create Mode
      _opportunity.value = {
        name: '',
        deal: '',
        opportunity_for: '',
        more_info: '',
        assigned_to: '',
        expected_closing_date: '',
        status: 'Open'
      }
      dealOption.value = null
      opportunityForOption.value = null
    }
  },
  { immediate: true }
)

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

// ✅ Save Opportunity (Create or Update)
async function saveOpportunity() {
  try {
    // Sync Link selections
    //_opportunity.value.deal = dealOption.value ? dealOption.value.value : ''
    //_opportunity.value.opportunity_for = opportunityForOption.value ? opportunityForOption.value.value : ''

    if (isCreateMode.value) {
      // Create new
      const d = await call('frappe.client.insert', {
        doc: {
          doctype: 'CRM Opportunity',
          ..._opportunity.value
        }
      })
      toast.success(__('Opportunity created successfully'))
      reload.value?.reload()
    } else {
      // Update existing
      const d = await call('frappe.client.set_value', {
        doctype: 'CRM Opportunity',
        name: _opportunity.value.name,
        fieldname: _opportunity.value
      })
      toast.success(__('Opportunity updated successfully'))
      reload.value?.reload()
    }
    show.value = false
  } catch (err) {
    error.value = err.messages?.[0] || 'Error saving opportunity'
    toast.error(error.value)
  }
}
</script>
