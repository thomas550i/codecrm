<template>
  <nav class="dynamic-menu">
    <ul>
      <li v-for="item in menuItems" :key="item.menu_name">
        <a v-if="item.menu_type === 'DocType'" @click="goToDoctype(item)">{{ item.menu_name }}</a>
        <a v-else-if="item.menu_type === 'Custom URL'" :href="item.url" target="_blank">{{ item.menu_name }}</a>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const menuItems = ref([])
const router = useRouter()

async function fetchMenu() {
  const res = await fetch('/api/resource/CRM Menu?fields=["name","menu_name","menu_type","cmenudoctype","url"]')
  const data = await res.json()
  menuItems.value = data.data || []
}

function goToDoctype(item) {
  router.push({ name: 'DoctypeListForm', params: { doctypeName: item.cmenudoctype } })
}

onMounted(fetchMenu)
</script>

<style scoped>
.dynamic-menu {
  width: 220px;
  background: #f8f9fa;
  border-right: 1px solid #eee;
  padding: 1rem 0;
}
.dynamic-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.dynamic-menu li {
  margin-bottom: 0.5rem;
}
.dynamic-menu a {
  color: #333;
  text-decoration: none;
  padding: 0.5rem 1rem;
  display: block;
  border-radius: 4px;
  transition: background 0.2s;
}
.dynamic-menu a:hover {
  background: #e2e6ea;
}
</style>
