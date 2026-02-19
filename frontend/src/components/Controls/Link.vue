<template>
  <div class="space-y-1.5 p-[2px] -m-[2px]">
    <label class="block" :class="labelClasses" v-if="attrs.label">
      {{ __(attrs.label) }}
    </label>
    <Autocomplete
      ref="autocomplete"
      :options="options.data"
      v-model="value"
      :size="attrs.size || 'sm'"
      :variant="attrs.variant"
      :placeholder="attrs.placeholder"
      :disabled="attrs.disabled"
      :placement="attrs.placement"
      :filterable="false"
    >
      <template #target="{ open, togglePopover }">
        <slot name="target" v-bind="{ open, togglePopover }" />
      </template>

      <template #prefix>
        <slot name="prefix" />
      </template>

      <template #item-prefix="{ active, selected, option }">
        <slot name="item-prefix" v-bind="{ active, selected, option }" />
      </template>

      <template #item-label="{ active, selected, option }">
        <slot name="item-label" v-bind="{ active, selected, option }">
          <div v-if="option.description" class="flex flex-col gap-1">
            <div class="flex-1 font-semibold truncate text-ink-gray-7">
              {{ option.label }}
            </div>
            <div class="flex-1 text-sm truncate text-ink-gray-5">
              {{ option.description }}
            </div>
          </div>
          <div v-else class="flex-1 truncate text-ink-gray-7">
            {{ option.label }}
          </div>
        </slot>
      </template>

      <template #footer="{ value, close }">
        <div v-if="attrs.onCreate">
          <Button
            variant="ghost"
            class="w-full !justify-start"
            :label="__('Create New')"
            iconLeft="plus"
            @click="() => attrs.onCreate(value, close)"
          />
        </div>
        <div>
          <Button
            variant="ghost"
            class="w-full !justify-start"
            :label="__('Clear')"
            iconLeft="x"
            @click="() => clearValue(close)"
          />
        </div>
      </template>
    </Autocomplete>
  </div>
</template>

<script setup>
import Autocomplete from '@/components/frappe-ui/Autocomplete.vue'
import { watchDebounced } from '@vueuse/core'
import { createResource } from 'frappe-ui'
import { useAttrs, computed, ref } from 'vue'

const props = defineProps({
  doctype: {
    type: String,
    required: true,
  },
  filters: {
    type: [Array, Object, String],
    default: [],
  },
  modelValue: {
    type: String,
    default: '',
  },
  hideMe: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const attrs = useAttrs()

const valuePropPassed = computed(() => 'value' in attrs)

const value = computed({
  get: () => (valuePropPassed.value ? attrs.value : props.modelValue),
  set: (val) => {
    if (val?.value) {
      // Store the label when a value is selected
      selectedLabel.value = val.label || val.value
      emit(valuePropPassed.value ? 'change' : 'update:modelValue', val.value)
    }
  },
})

const autocomplete = ref(null)
const text = ref('')
const selectedLabel = ref('')

watchDebounced(
  () => autocomplete.value?.query,
  (val) => {
    val = val || ''
    if (text.value === val) return
    text.value = val
    reload(val)
  },
  { debounce: 300, immediate: true },
)

watchDebounced(
  () => props.doctype,
  () => reload(''),
  { debounce: 300, immediate: true },
)

// Watch for value changes and fetch the label if needed
watchDebounced(
  () => value.value,
  (newValue) => {
    if (newValue && typeof newValue === 'string') {
      // Check if we already have this value in options
      const existingOption = options.data?.find(opt => opt.value === newValue)
      if (existingOption) {
        selectedLabel.value = existingOption.label
      } else if (props.doctype && newValue !== '@me') {
        // Fetch the label for this value
        fetchValueLabel(newValue)
      }
    } else if (!newValue) {
      selectedLabel.value = ''
    }
  },
  { debounce: 100, immediate: true },
)

const labelResource = createResource({
  url: 'frappe.desk.search.search_link',
  method: 'POST',
  auto: false,
  onSuccess: (data) => {
    if (data && data.length > 0) {
      selectedLabel.value = data[0].label || data[0].value
    }
  },
})

function fetchValueLabel(val) {
  if (!val || !props.doctype) return
  labelResource.update({
    params: {
      txt: val,
      doctype: props.doctype,
      filters: props.filters,
    },
  })
  labelResource.fetch()
}

const options = createResource({
  url: 'frappe.desk.search.search_link',
  cache: [props.doctype, text.value, props.hideMe, props.filters],
  method: 'POST',
  params: {
    txt: text.value,
    doctype: props.doctype,
    filters: props.filters,
  },
  transform: (data) => {
    let allData = data.map((option) => {
      return {
        label: option.label || option.value,
        value: option.value,
        description: option.description,
      }
    })
    
    // If we have a selected value, ensure it's in the options with its label
    if (value.value && typeof value.value === 'string') {
      const hasSelected = allData.some(opt => opt.value === value.value)
      if (!hasSelected && selectedLabel.value) {
        allData.unshift({
          label: selectedLabel.value,
          value: value.value,
        })
      }
    }
    
    if (!props.hideMe && props.doctype == 'User') {
      allData.unshift({
        label: '@me',
        value: '@me',
      })
    }
    return allData
  },
})

function reload(val) {
  if (!props.doctype) return
  if (
    options.data?.length &&
    val === options.params?.txt &&
    props.doctype === options.params?.doctype
  )
    return

  options.update({
    params: {
      txt: val,
      doctype: props.doctype,
      filters: props.filters,
    },
  })
  options.reload()
}

function clearValue(close) {
  selectedLabel.value = ''
  emit(valuePropPassed.value ? 'change' : 'update:modelValue', '')
  close()
}

const labelClasses = computed(() => {
  return [
    {
      sm: 'text-xs',
      md: 'text-base',
    }[attrs.size || 'sm'],
    'text-ink-gray-5',
  ]
})
</script>
