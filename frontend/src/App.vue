<script setup>
import axios from "axios";
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

onMounted(async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/"); // kalau belum login, balik ke halaman login
    return;
  }

  try {
    await axios.get("http://localhost:5000/api/protected", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("✅ Token valid, user tetap di halaman sekarang");
  } catch (err) {
    console.error("❌ Token invalid:", err);
    localStorage.removeItem("token");
    router.push("/"); // redirect ke login
  }
});
</script>

<template>
  <router-view />
</template>

<style>
html, body, #app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background: #fff;
}
</style>
