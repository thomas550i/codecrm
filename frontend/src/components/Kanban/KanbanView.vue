<template>
  <div class="flex overflow-x-auto h-full">
    <Draggable
      v-if="columns"
      :list="columns"
      item-key="column"
      @end="updateColumn"
      :delay="isTouchScreenDevice() ? 200 : 0"
      class="flex sm:mx-2.5 mx-2 pb-3.5"
    >
      <template #item="{ element: column }">
        <div
          v-if="!column.column.delete"
          class="flex flex-col gap-2.5 min-w-72 w-72 hover:bg-surface-gray-2 rounded-lg p-2.5"
        >
          <div class="flex gap-2 items-center group justify-between">
            <div class="flex items-center text-base">
              <Popover>
                <template #target="{ togglePopover }">
                  <Button
                    variant="ghost"
                    size="sm"
                    class="hover:!bg-surface-gray-2"
                    @click="togglePopover"
                  >
                    <IndicatorIcon :class="parseColor(column.column.color)" />
                  </Button>
                </template>
                <template #body>
                  <div
                    class="flex flex-col gap-3 px-3 py-2.5 min-w-40 rounded-lg bg-surface-modal shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    <div class="flex gap-1">
                      <Button
                        variant="ghost"
                        v-for="color in colors"
                        :key="color"
                        @click="() => (column.column.color = color)"
                      >
                        <IndicatorIcon :class="parseColor(color)" />
                      </Button>
                    </div>
                    <div class="flex flex-row-reverse">
                      <Button
                        variant="solid"
                        :label="__('Apply')"
                        @click="updateColumn"
                      />
                    </div>
                  </div>
                </template>
              </Popover>
              <div class="text-ink-gray-9">{{ column.column.name }}</div>
            </div>
            <div class="flex">
              <Dropdown :options="actions(column)">
                <template #default>
                  <Button
                    class="hidden group-hover:flex"
                    icon="more-horizontal"
                    variant="ghost"
                  />
                </template>
              </Dropdown>
              <Button
                icon="plus"
                variant="ghost"
                @click="options.onNewClick(column)"
              />
            </div>
          </div>
          <div class="overflow-y-auto flex flex-col gap-2 h-full">
            <Draggable
              :list="column.data"
              group="fields"
              item-key="name"
              class="flex flex-col gap-3.5 flex-1"
              @end="updateColumn"
              :delay="isTouchScreenDevice() ? 200 : 0"
              :data-column="column.column.name"
            >
              <template #item="{ element: fields }">
                <component
                  :is="options.getRoute ? 'router-link' : 'div'"
                  class="pt-3 px-3.5 pb-2.5 rounded-lg border bg-surface-white text-base flex flex-col text-ink-gray-9"
                  :data-name="fields.name"
                  v-bind="{
                    to: options.getRoute ? options.getRoute(fields) : undefined,
                    onClick: options.onClick
                      ? () => options.onClick(fields)
                      : undefined,
                  }"
                >
                  <slot
                    name="title"
                    v-bind="{ fields, titleField, itemName: fields.name }"
                  >
                    <div class="h-5 flex items-center">
                      <div v-if="fields[titleField]">
                        {{ fields[titleField] }}
                      </div>
                      <div class="text-ink-gray-4" v-else>
                        {{ __('No Title') }}
                      </div>
                    </div>
                  </slot>
                  <div class="border-b h-px my-2.5" />

                  <div class="flex flex-col gap-3.5">
                    <template v-for="value in column.fields" :key="value">
                      <slot
                        name="fields"
                        v-bind="{
                          fields,
                          fieldName: value,
                          itemName: fields.name,
                        }"
                      >
                        <div v-if="fields[value]" class="truncate">
                          {{ fields[value] }}
                        </div>
                      </slot>
                    </template>
                  </div>
                  <div class="border-b h-px mt-2.5 mb-2" />
                  <slot name="actions" v-bind="{ itemName: fields.name }">
                    <div class="flex gap-2 items-center justify-between">
                      <div></div>
                      <Button icon="plus" variant="ghost" @click.stop.prevent />
                    </div>
                  </slot>
                </component>
              </template>
            </Draggable>
            <div
              v-if="column.column.count < column.column.all_count"
              class="flex items-center justify-center"
            >
              <Button
                :label="__('Load More')"
                @click="emit('loadMore', column.column.name)"
              />
            </div>
          </div>
        </div>
      </template>
    </Draggable>
    <div class="shrink-0 min-w-64 flex flex-col items-center justify-center mt-2.5 mb-1 mr-5">
      <Dropdown
        :options="statusDropdownOptions"
        @select="handleStatusDropdownSelect"
      >
        <template #default>
          <Button
            class="w-full"
            :label="__('Add Status')"
            iconLeft="plus"
          />
        </template>
      </Dropdown>
      <DynamicFormModal
        v-if="showStatusForm"
        v-model="showStatusForm"
        :doctype="statusDoctype"
        :fields="statusFormFields"
        @success="onStatusCreated"
      />
    </div>
  </div>
</template>
<script setup>
import { ref, computed } from 'vue'
import { call } from 'frappe-ui'
import Autocomplete from '@/components/frappe-ui/Autocomplete.vue'
import IndicatorIcon from '@/components/Icons/IndicatorIcon.vue'
import { isTouchScreenDevice, colors, parseColor } from '@/utils'
import Draggable from 'vuedraggable'
import { Dropdown, Popover } from 'frappe-ui'

// Helper to insert new status in linked doctype if status field is Link
async function insertLinkedStatusIfNeeded(newStatus) {
  // Get doctype and status field from Kanban settings
  // Get doctype from parent props, status field from kanban settings
  const doctype = props.options?.doctype;
  const statusField = kanban.value?.data?.column_field;
  if (!doctype || !statusField) return;

  const props = defineProps({
    options: {
      type: Object,
      default: () => ({
        getRoute: null,
        onClick: null,
        onNewClick: null,
      }),
    },
  })
  const meta = await call('crm.api.views.get_field_meta', {
    doctype,
    fieldname: statusField,
  });
  console.log('Meta response:', meta);
  if (meta && meta.fieldtype === 'Link') {
    const linkedDoctype = meta.options;
    const statusFieldName = meta.fieldname || 'deal_status';
    console.log('Calling frappe.client.insert for:', newStatus, 'in', linkedDoctype, 'with field', statusFieldName);
    await call('frappe.client.insert', {
      doc: {
        doctype: linkedDoctype,
        [statusFieldName]: newStatus
      }
    });
  } else {
    console.log('Not a Link field or missing meta:', meta);
  }
}
// Helper to sync doctype status field with Kanban
async function syncDoctypeStatusField() {
  // Get doctype and status field from Kanban settings
  const doctype = props.options?.doctype;
  const statusField = kanban.value?.data?.column_field;
  // Get all status names from Kanban columns
  const statusList = kanban.value?.data?.data?.map(col => col.column.name) || [];
  if (!doctype || !statusField || !statusList.length) return;
  // Call backend API to update status field options
  await call('crm.api.kanban.update_deal_status_options', {
    doctype,
    status_field: statusField,
    status_list: statusList,
  });
}

const showStatusForm = ref(false)
const statusDoctype = ref('')
const statusFormFields = ref([])
const statusDropdownOptions = ref([])

// Fetch available statuses for dropdown
async function fetchStatusOptions() {
  // Get field meta
  const doctype = props.options?.doctype;
  const statusField = kanban.value?.data?.column_field;
  if (!doctype || !statusField) return;
  if (doctype === 'CRM Deal') {
    // Hardcoded insert API call for CRM Deal
    // Only deal_status is dynamic
    const newDealStatus = newStatusName.value.trim(); // Replace with dynamic value if needed
    await call('frappe.client.insert', {
      doc: {
        doctype: 'CRM Deal Status',
        type: 'Open',
        color: 'gray',
        deal_status: newDealStatus,
      }
    });
    // Optionally update dropdown/options here if needed
    return;
  }
  // Otherwise, proceed with normal logic
  const meta = await call('crm.api.views.get_field_meta', {
    doctype,
    fieldname: statusField,
  });
  if (meta && meta.fieldtype === 'Link') {
    const linkedDoctype = meta.options;
    // Fetch all status records from linked doctype
    const res = await call('frappe.client.get_list', {
      doctype: linkedDoctype,
      fields: ['name', meta.fieldname],
      limit: 100,
    });
    statusDropdownOptions.value = (res.message || []).map((item) => ({
      label: item[meta.fieldname] || item.name,
      value: item[meta.fieldname] || item.name,
    }));
    // Add 'Create New' option
    statusDropdownOptions.value.push({
      label: __('Create New'),
      value: '__create_new__',
    });
    statusDoctype.value = linkedDoctype;
    statusFormFields.value = [
      { fieldname: meta.fieldname, label: meta.label, fieldtype: 'Data', reqd: 1 },
    ];
  }
}

fetchStatusOptions();

function handleStatusDropdownSelect(option) {
  if (option.value === '__create_new__') {
    showStatusForm.value = true;
  } else {
    // Add selected status to Kanban columns
    addStatusToKanban(option.value);
  }
}

function addStatusToKanban(statusName) {
  kanban.value.data.data.push({
    column: {
      name: statusName,
      color: colors[kanban.value.data.data.length % colors.length],
      order: [],
      all_count: 0,
      count: 0,
      delete: false,
    },
    data: [],
    fields: [],
  });
  updateColumn();
  syncDoctypeStatusField();
}

function onStatusCreated(newDoc) {
  showStatusForm.value = false;
  // Add new status to Kanban columns
  addStatusToKanban(newDoc[statusFormFields.value[0].fieldname]);
  // Refresh dropdown
  fetchStatusOptions();
}

async function addStatus() {
  if (!newStatusName.value.trim()) return
  // Add new status to kanban columns
  kanban.value.data.data.push({
    column: {
      name: newStatusName.value,
      color: colors[kanban.value.data.data.length % colors.length],
      order: [],
      all_count: 0,
      count: 0,
      delete: false,
    },
    data: [],
    fields: [],
  })
  // Insert new status in linked doctype if needed
  try {
    await insertLinkedStatusIfNeeded(newStatusName.value)
  } catch (err) {
    console.error('Error inserting linked status:', err)
  }
  newStatusName.value = ''
  showAddStatus.value = false
  updateColumn()
  // Sync doctype status field with Kanban
  syncDoctypeStatusField()
}
const props = defineProps({
  options: {
    type: Object,
    default: () => ({
      getRoute: null,
      onClick: null,
      onNewClick: null,
    }),
  },
})

const emit = defineEmits(['update', 'loadMore'])

const kanban = defineModel()

const titleField = computed(() => {
  return kanban.value?.data?.title_field
})

const columns = computed(() => {
  if (!kanban.value?.data?.data || kanban.value.data.view_type != 'kanban')
    return []
  let _columns = kanban.value.data.data

  let has_color = _columns.some((column) => column.column?.color)
  if (!has_color) {
    _columns.forEach((column, i) => {
      column.column['color'] = colors[i % colors.length]
    })
  }
  return _columns
})

const deletedColumns = computed(() => {
  return columns.value
    .filter((col) => col.column['delete'])
    .map((col) => {
      return { label: col.column.name, value: col.column.name }
    })
})

function actions(column) {
  return [
    {
      group: __('Options'),
      hideLabel: true,
      items: [
        {
          label: __('Delete'),
          icon: 'trash-2',
          onClick: () => {
            column.column['delete'] = true
            updateColumn()
          },
        },
      ],
    },
  ]
}

function addColumn(e) {
  let column = columns.value.find((col) => col.column.name == e.value)
  column.column['delete'] = false
  updateColumn()
}

function updateColumn(d) {
  let toColumn = d?.to?.dataset.column
  let fromColumn = d?.from?.dataset.column
  let itemName = d?.item?.dataset.name

  let _columns = []
  columns.value.forEach((col) => {
    col.column['order'] = col.data.map((d) => d.name)
    if (col.column.page_length) {
      delete col.column.page_length
    }
    _columns.push(col.column)
  })

  let data = { kanban_columns: _columns }

  if (toColumn != fromColumn) {
    data = { item: itemName, to: toColumn, kanban_columns: _columns }
  }

  emit('update', data)
}
</script>
