<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">🔧 Admin Panel</h1>
    <button @click="$router.push('/')" class="bg-gray-300 px-3 py-1 rounded mb-4">⬅ Kembali</button>

    <div v-if="loading">⏳ Memuat sinyal pending...</div>
    <div v-else class="grid gap-4">
      <div v-for="signal in signals" :key="signal.id" class="border p-4 rounded shadow">
        <h2 class="text-lg font-semibold">{{ signal.title }}</h2>
        <p><strong>Pair:</strong> {{ signal.pair }}</p>
        <p><strong>Status:</strong> {{ signal.status }}</p>
        <button @click="approve(signal.id)" class="bg-green-500 text-white px-3 py-1 rounded mt-2">✅ ACC</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { auth } from "../stores/auth";

const signals = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/admin/pending", {
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    signals.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
});

async function approve(id) {
  try {
    await axios.put(`http://localhost:5000/api/admin/approve/${id}`, {}, {
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    signals.value = signals.value.filter(s => s.id !== id);
    alert("✅ Sinyal disetujui!");
  } catch (err) {
    alert("Gagal ACC sinyal!");
  }
}
</script>
