<template>
  <div class="login-wrapper">
    <!-- Bagian kiri (Logo + teks horizontal) -->
    <div class="left-panel">
      <div class="logo-section">
        <img src="/logo-callmaker.png" alt="Logo" class="logo-large" />
        <div class="logo-text">
          <h1>CALLMAKER</h1>
          <p>your trading partner</p>
        </div>
      </div>
    </div>

    <!-- Bagian kanan (Card login) -->
    <div class="right-panel">
      <div class="login-card">
        <img src="/logo-callmaker.png" alt="Logo kecil" class="logo-small" />
        <h2>Please login your<br />account</h2>

        <form @submit.prevent="handleLogin">
          <input
            v-model="username"
            type="text"
            placeholder="Enter your Account"
          />
          <input
            v-model="password"
            type="password"
            placeholder="Enter your Password"
          />

          <div class="form-footer">
            <a href="#" class="register-link">Register new account</a>
            <button type="submit">Login</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";          // ✅ Tambahkan ini
import axios from "axios";
import { useRouter } from "vue-router";

const router = useRouter();
const username = ref("");           // ✅ Tambahkan ini
const password = ref("");           // ✅ Tambahkan ini

const handleLogin = async () => {
  if (!username.value || !password.value) {
    alert("Please fill in both fields");
    return;
  }

  try {
    const res = await axios.post("http://localhost:5000/api/auth/login", {
      username: username.value,
      password: password.value,
    });

    // Simpan token & user info
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    alert("✅ Login berhasil!");
    router.push("/dashboard");
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || "❌ Login failed!");
  }
};
</script>


<style scoped>
/* Wrapper utama: full screen dan horizontal */
.login-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background: #fff;
  font-family: "Poppins", sans-serif;
  gap: 100px; /* jarak antara kiri-kanan */
  overflow: hidden;
  padding: 0 5vw;
}

/* Panel kiri (Logo + teks di kanan logo) */
.left-panel {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  flex: 1;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-large {
  width: 130px;
  height: auto;
}

.logo-text h1 {
  font-size: 2.4rem;
  font-weight: 700;
  color: #222;
  margin: 0;
}

.logo-text p {
  color: #666;
  font-size: 1rem;
  margin: 4px 0 0;
}

/* Panel kanan (Login card) */
.right-panel {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex: 1;
}

.login-card {
  background: #fff;
  width: 380px;
  padding: 50px 40px;
  border-radius: 25px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  text-align: center;
}

.logo-small {
  width: 60px;
  margin-bottom: 15px;
}

h2 {
  font-weight: 600;
  color: #333;
  margin-bottom: 25px;
  line-height: 1.4;
}

/* Input styling */
input {
  width: 100%;
  padding: 14px;
  margin-bottom: 15px;
  border-radius: 10px;
  border: 1px solid #ccc;
  outline: none;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

input:focus {
  border-color: #000;
}

/* Footer login form */
.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.register-link {
  font-size: 0.9rem;
  color: #555;
  text-decoration: underline;
  transition: color 0.2s;
}

.register-link:hover {
  color: #000;
}

button {
  background: white;
  border: 1px solid #000;
  border-radius: 8px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

button:hover {
  background: black;
  color: white;
}

/* Responsif untuk HP/tablet */
@media (max-width: 900px) {
  .login-wrapper {
    flex-direction: column;
    gap: 40px;
    padding: 40px 20px;
  }

  .left-panel {
    justify-content: center;
  }

  .logo-section {
    flex-direction: column;
  }

  .login-card {
    width: 100%;
    max-width: 360px;
    padding: 40px 25px;
  }
}
</style>
