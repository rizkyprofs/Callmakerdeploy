<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">📡 Tambah Sinyal</h1>
    <button @click="$router.push('/')" class="bg-gray-300 px-3 py-1 rounded mb-4">⬅ Kembali</button>

    <form @submit.prevent="submitSignal" class="grid gap-2 max-w-md">
      <input v-model="title" placeholder="Judul" class="border px-3 py-2 rounded" required />
      <input v-model="pair" placeholder="Pair (misal: EUR/USD)" class="border px-3 py-2 rounded" required />
      <input v-model="entry" placeholder="Entry Point" class="border px-3 py-2 rounded" required />
      <input v-model="takeProfit" placeholder="Take Profit" class="border px-3 py-2 rounded" required />
      <input v-model="stopLoss" placeholder="Stop Loss" class="border px-3 py-2 rounded" required />
      <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded mt-2">Kirim Sinyal</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { auth } from "../stores/auth";



const title = ref("");
const pair = ref("");
const entry = ref("");
const takeProfit = ref("");
const stopLoss = ref("");

async function submitSignal() {
  try {
    await axios.post("http://localhost:5000/api/signals", {
      title: title.value,
      pair: pair.value,
      entry: entry.value,
      takeProfit: takeProfit.value,
      stopLoss: stopLoss.value,
    }, {
      headers: { Authorization: `Bearer ${auth.token}` }
    });
    alert("✅ Sinyal berhasil dikirim!");
  } catch (err) {
    alert("Gagal mengirim sinyal!");
  }
}
</script>
