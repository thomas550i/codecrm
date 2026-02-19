<template>
  <div>
    <h2>{{ doctypeName }} List</h2>
    <button @click="showForm = true">Add New</button>
    <ul>
      <li v-for="doc in docs" :key="doc.name">
        <span @click="selectDoc(doc)">{{ doc.name }}</span>
        <button @click="deleteDoc(doc.name)">Delete</button>
      </li>
    </ul>
    <div v-if="showForm">
      <h3>{{ selectedDoc ? 'Edit' : 'Add' }} {{ doctypeName }}</h3>
      <form @submit.prevent="saveDoc">
        <div v-for="field in fields" :key="field.fieldname">
          <label :for="field.fieldname">{{ field.label }}</label>
          <input v-model="form[field.fieldname]" :id="field.fieldname" />
        </div>
        <button type="submit">Save</button>
        <button type="button" @click="cancelForm">Cancel</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const doctypeName = ref(route.params.doctypeName)
const docs = ref([])
const fields = ref([])
const form = ref({})
const showForm = ref(false)
const selectedDoc = ref(null)

async function fetchFields() {
  const res = await fetch(`/api/resource/${doctypeName.value}/meta`)
  const data = await res.json()
  fields.value = data.fields || []
}

async function fetchDocs() {
  const res = await fetch(`/api/resource/${doctypeName.value}`)
  const data = await res.json()
  docs.value = data.data || []
}

function selectDoc(doc) {
  selectedDoc.value = doc
  form.value = { ...doc }
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  selectedDoc.value = null
  form.value = {}
}

async function saveDoc() {
  if (selectedDoc.value) {
    await fetch(`/api/resource/${doctypeName.value}/${selectedDoc.value.name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })
  } else {
    await fetch(`/api/resource/${doctypeName.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })
  }
  await fetchDocs()
  cancelForm()
}

async function deleteDoc(name) {
  await fetch(`/api/resource/${doctypeName.value}/${name}`, { method: 'DELETE' })
  await fetchDocs()
}

onMounted(() => {
  fetchFields()
  fetchDocs()
})

watch(() => route.params.doctypeName, (newVal) => {
  doctypeName.value = newVal
  fetchFields()
  fetchDocs()
})
</script>
