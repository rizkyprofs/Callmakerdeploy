<template>
  <div class="dashboard">
    <div class="container">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading dashboard...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>❌ {{ error }}</p>
        <button @click="retryLoading" class="retry-btn">Try Again</button>
        <button @click="handleLogout" class="logout-btn">Logout</button>
      </div>

      <!-- Main Content -->
      <div v-else-if="user" class="main-content">
        <!-- Header -->
        <div class="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <div class="role-badge" :class="user.role">
              {{ user.role.toUpperCase() }}
            </div>
          </div>
          <div class="user-info">
            <span>Welcome, {{ user.name }}</span>
            <button @click="handleLogout" class="logout-btn">Logout</button>
          </div>
        </div>

        <!-- Admin & Callmaker Features -->
        <div v-if="user.role === 'admin' || user.role === 'callmaker'" class="admin-features">
          <div class="features-grid">
            <button @click="showCreateModal = true" class="feature-btn create-btn">
              ➕ Create New Signal
            </button>
            
            <!-- Admin Only Features -->
            <div v-if="user.role === 'admin'" class="admin-only">
              <button @click="togglePendingFilter" class="feature-btn pending-btn">
                ⏳ {{ showOnlyPending ? 'Show All' : 'Show Pending' }} ({{ pendingCount }})
              </button>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card total">
            <h3>Total Signals</h3>
            <p class="stat-number">{{ signals.length }}</p>
          </div>
          
          <div class="stat-card pending">
            <h3>Pending Signals</h3>
            <p class="stat-number">{{ pendingCount }}</p>
          </div>
          
          <div class="stat-card approved">
            <h3>Approved Signals</h3>
            <p class="stat-number">{{ approvedCount }}</p>
          </div>

          <!-- User-specific stat -->
          <div v-if="user.role === 'callmaker'" class="stat-card my-signals">
            <h3>My Signals</h3>
            <p class="stat-number">{{ mySignalsCount }}</p>
          </div>
        </div>

        <!-- Signals Table -->
        <div class="signals-section">
          <div class="section-header">
            <h2>
              <span v-if="showOnlyPending">Pending Signals</span>
              <span v-else-if="user.role === 'user'">Trading Signals</span>
              <span v-else-if="user.role === 'callmaker'">My Signals</span>
              <span v-else>All Signals</span>
              <span class="signal-count">({{ filteredSignals.length }})</span>
            </h2>
            <div class="table-controls">
              <button @click="refreshData" class="refresh-btn" :disabled="refreshing">
                🔄 {{ refreshing ? 'Refreshing...' : 'Refresh' }}
              </button>
            </div>
          </div>
          
          <!-- Empty State -->
          <div v-if="filteredSignals.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>No Signals Found</h3>
            <p v-if="showOnlyPending">No pending signals requiring approval</p>
            <p v-else-if="user.role === 'user'">Check back later for new trading signals</p>
            <p v-else-if="user.role === 'callmaker'">Create your first signal to get started</p>
            <p v-else>No signals in the system yet</p>
            
            <button 
              v-if="user.role === 'callmaker' && !showOnlyPending" 
              @click="showCreateModal = true" 
              class="create-btn"
            >
              Create First Signal
            </button>
          </div>
          
          <!-- Signals Table -->
          <div v-else class="signals-table-container">
            <table class="signals-table">
              <thead>
                <tr>
                  <th>Coin</th>
                  <th>Entry Price</th>
                  <th>Target Price</th>
                  <th>Stop Loss</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th v-if="user.role !== 'user'">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="signal in filteredSignals" :key="signal.id" class="signal-row">
                  <td class="coin-name">
                    <span class="coin-symbol">{{ getCoinSymbol(signal.coin_name) }}</span>
                    {{ signal.coin_name }}
                  </td>
                  <td class="price-cell">${{ formatPrice(signal.entry_price) }}</td>
                  <td class="price-cell">${{ formatPrice(signal.target_price) }}</td>
                  <td class="price-cell">${{ formatPrice(signal.stop_loss) }}</td>
                  <td>
                    <span :class="['status-badge', signal.status]">
                      {{ signal.status }}
                    </span>
                  </td>
                  <td class="signal-date">{{ formatDate(signal.created_at) }}</td>
                  
                  <!-- Role-based Actions -->
                  <td v-if="user.role !== 'user'" class="actions">
                    <!-- Callmaker can edit/delete their pending signals -->
                    <div v-if="user.role === 'callmaker' && signal.status === 'pending'" class="callmaker-actions">
                      <button 
                        @click="editSignal(signal)"
                        class="action-btn edit-btn"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        @click="deleteSignal(signal.id)"
                        class="action-btn delete-btn"
                      >
                        🗑️ Delete
                      </button>
                    </div>

                    <!-- Admin can approve/reject pending signals -->
                    <div v-if="user.role === 'admin'" class="admin-actions">
                      <button 
                        v-if="signal.status === 'pending'"
                        @click="approveSignal(signal.id)"
                        class="action-btn approve-btn"
                        :disabled="actionLoading"
                      >
                        ✅ Approve
                      </button>
                      <button 
                        v-if="signal.status === 'pending'"
                        @click="rejectSignal(signal.id)"
                        class="action-btn reject-btn"
                        :disabled="actionLoading"
                      >
                        ❌ Reject
                      </button>
                      <button 
                        @click="deleteSignal(signal.id)"
                        class="action-btn delete-btn"
                        :disabled="actionLoading"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Create/Edit Signal Modal -->
        <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click.self="closeModal">
          <div class="modal">
            <h3>{{ showEditModal ? 'Edit Signal' : 'Create New Signal' }}</h3>
            <form @submit.prevent="showEditModal ? updateSignal() : createSignal()">
              <div class="form-group">
                <label>Coin Name *</label>
                <input 
                  v-model="currentSignal.coin_name" 
                  placeholder="e.g., BTC/USDT, ETH/USDT" 
                  required
                >
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label>Entry Price *</label>
                  <input 
                    v-model="currentSignal.entry_price" 
                    type="number" 
                    step="0.0001"
                    placeholder="0.00" 
                    required
                  >
                </div>
                <div class="form-group">
                  <label>Target Price *</label>
                  <input 
                    v-model="currentSignal.target_price" 
                    type="number" 
                    step="0.0001"
                    placeholder="0.00" 
                    required
                  >
                </div>
                <div class="form-group">
                  <label>Stop Loss *</label>
                  <input 
                    v-model="currentSignal.stop_loss" 
                    type="number" 
                    step="0.0001"
                    placeholder="0.00" 
                    required
                  >
                </div>
              </div>
              
              <div class="form-group">
                <label>Notes (optional)</label>
                <textarea 
                  v-model="currentSignal.note" 
                  placeholder="Additional notes about this signal..."
                  rows="3"
                ></textarea>
              </div>
              
              <div class="modal-actions">
                <button 
                  type="button" 
                  @click="closeModal" 
                  class="cancel-btn"
                  :disabled="actionLoading"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="submit-btn"
                  :disabled="actionLoading"
                >
                  {{ actionLoading ? 'Processing...' : (showEditModal ? 'Update Signal' : 'Create Signal') }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Debug Info (Hanya di development) -->
        <div v-if="isDevelopment" class="debug-info">
          <h4>Debug Info:</h4>
          <p>User Role: {{ user?.role }}</p>
          <p>Signals Count: {{ signals.length }}</p>
          <p>API Base: {{ apiBase }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// State management
const user = ref(null)
const signals = ref([])
const loading = ref(true)
const error = ref(null)
const refreshing = ref(false)
const actionLoading = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showOnlyPending = ref(false)

// API configuration
const isDevelopment = ref(process.env.NODE_ENV === 'development')
const apiBase = ref('http://localhost:5000/api')

// Debug function untuk melihat semua endpoints
const debugEndpoints = () => {
  console.log('🔄 Available Endpoints:')
  console.log('GET:', `${apiBase.value}/signals`)
  console.log('POST:', `${apiBase.value}/signals`)
  console.log('PUT:', `${apiBase.value}/signals/:id`)
  console.log('PATCH:', `${apiBase.value}/signals/:id/status`)
  console.log('DELETE:', `${apiBase.value}/signals/:id`)
}

// Signal forms
const currentSignal = ref({
  id: null,
  coin_name: '',
  entry_price: '',
  target_price: '',
  stop_loss: '',
  note: ''
})

// Computed values (tetap sama)
const pendingCount = computed(() => signals.value.filter(signal => signal.status === 'pending').length)
const approvedCount = computed(() => signals.value.filter(signal => signal.status === 'approved').length)
const mySignalsCount = computed(() => {
  if (user.value && user.value.role === 'callmaker') {
    return signals.value.filter(signal => signal.created_by === user.value.id).length
  }
  return 0
})
const filteredSignals = computed(() => {
  if (showOnlyPending.value) return signals.value.filter(signal => signal.status === 'pending')
  if (user.value?.role === 'callmaker') return signals.value.filter(signal => signal.created_by === user.value.id)
  return signals.value
})

// Utility functions (tetap sama)
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
const formatPrice = (price) => parseFloat(price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
const getCoinSymbol = (coinName) => {
  const symbols = { 'BTC': '₿', 'ETH': 'Ξ', 'ADA': 'A', 'SOL': 'S', 'XRP': 'X', 'ETFC': 'E' }
  const coin = coinName.split('/')[0]
  return symbols[coin] || '₿'
}

// Enhanced API Call dengan multiple fallbacks
const apiCall = async (url, options = {}) => {
  const token = localStorage.getItem('token')
  const defaultHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }

  const config = {
    headers: { ...defaultHeaders, ...options.headers },
    ...options
  }

  console.log(`🔄 API Call: ${config.method} ${url}`)
  
  try {
    const response = await fetch(url, config)
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API Error: ${response.status}`, errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }
    
    // Coba parse sebagai JSON, fallback ke text
    try {
      const data = await response.json()
      console.log('✅ API Success:', data)
      return data
    } catch (jsonError) {
      console.warn('⚠️ Response is not JSON, returning as text')
      return await response.text()
    }
  } catch (err) {
    console.error('❌ Fetch Error:', err)
    throw err
  }
}

// Test semua endpoints
const testEndpoints = async () => {
  console.group('🧪 Testing Endpoints')
  try {
    const token = localStorage.getItem('token')
    
    // Test GET signals
    console.log('Testing GET /signals...')
    const getResponse = await fetch(`${apiBase.value}/signals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    console.log('GET /signals:', getResponse.status, getResponse.statusText)
    
    // Test structure of first signal
    if (getResponse.ok) {
      const signalsData = await getResponse.json()
      if (signalsData.length > 0) {
        console.log('First signal structure:', signalsData[0])
      }
    }
    
  } catch (err) {
    console.error('Endpoint test failed:', err)
  }
  console.groupEnd()
}

// Fetch User Data
const fetchUserData = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('No authentication token found')

    const userData = await apiCall(`${apiBase.value}/auth/user`, { method: 'GET' })
    return userData
  } catch (err) {
    console.error('Error fetching user data:', err)
    throw err
  }
}

// Fetch Signals dengan improved error handling
const fetchSignals = async () => {
  try {
    const signalsData = await apiCall(`${apiBase.value}/signals`, { method: 'GET' })
    signals.value = signalsData
  } catch (err) {
    console.error('Error fetching signals:', err)
    
    // Fallback: coba endpoint alternatif
    try {
      console.log('Trying fallback endpoint...')
      const fallbackResponse = await apiCall(`${apiBase.value}/signal`, { method: 'GET' })
      signals.value = Array.isArray(fallbackResponse) ? fallbackResponse : [fallbackResponse]
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError)
      signals.value = []
      throw err
    }
  }
}


// CREATE Signal - SIMPLIFIED
const createSignal = async () => {
  try {
    actionLoading.value = true
    
    const signalData = {
      coin_name: currentSignal.value.coin_name,
      entry_price: parseFloat(currentSignal.value.entry_price),
      target_price: parseFloat(currentSignal.value.target_price),
      stop_loss: parseFloat(currentSignal.value.stop_loss),
      note: currentSignal.value.note || ''
    }

    console.log('Creating signal with data:', signalData)

    // ✅ CORRECT ENDPOINT
    await apiCall(`${apiBase.value}/signals`, {
      method: 'POST',
      body: JSON.stringify(signalData)
    })

    showCreateModal.value = false
    resetSignalForm()
    await refreshData()
    alert('Signal created successfully!')
    
  } catch (err) {
    console.error('Error creating signal:', err)
    alert(`Failed to create signal: ${err.message}`)
  } finally {
    actionLoading.value = false
  }
}

// UPDATE Signal Status - SIMPLIFIED
const updateSignalStatus = async (signalId, status) => {
  try {
    actionLoading.value = true
    console.log(`Updating signal ${signalId} to ${status}`)

    // ✅ CORRECT ENDPOINT
    await apiCall(`${apiBase.value}/signals/${signalId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })

    await refreshData()
    alert(`Signal ${status} successfully!`)
    
  } catch (err) {
    console.error('Error updating signal status:', err)
    alert(`Failed to update signal: ${err.message}`)
  } finally {
    actionLoading.value = false
  }
}

// DELETE Signal - SIMPLIFIED
const deleteSignal = async (signalId) => {
  if (!confirm('Are you sure you want to delete this signal? This action cannot be undone.')) return
  
  try {
    actionLoading.value = true
    console.log(`Deleting signal: ${signalId}`)

    // ✅ CORRECT ENDPOINT - tanpa /delete
    await apiCall(`${apiBase.value}/signals/${signalId}`, {
      method: 'DELETE'
    })

    await refreshData()
    alert('Signal deleted successfully!')
    
  } catch (err) {
    console.error('Error deleting signal:', err)
    alert(`Failed to delete signal: ${err.message}`)
  } finally {
    actionLoading.value = false
  }
}

// UPDATE Signal (edit) - SIMPLIFIED
const updateSignal = async () => {
  try {
    actionLoading.value = true
    
    const signalData = {
      coin_name: currentSignal.value.coin_name,
      entry_price: parseFloat(currentSignal.value.entry_price),
      target_price: parseFloat(currentSignal.value.target_price),
      stop_loss: parseFloat(currentSignal.value.stop_loss),
      note: currentSignal.value.note || ''
    }

    console.log('Updating signal:', currentSignal.value.id, signalData)
    
    // ✅ CORRECT ENDPOINT
    await apiCall(`${apiBase.value}/signals/${currentSignal.value.id}`, {
      method: 'PUT',
      body: JSON.stringify(signalData)
    })

    showEditModal.value = false
    resetSignalForm()
    await refreshData()
    alert('Signal updated successfully!')
    
  } catch (err) {
    console.error('Error updating signal:', err)
    alert(`Failed to update signal: ${err.message}`)
  } finally {
    actionLoading.value = false
  }
}


// Action wrappers
const approveSignal = async (signalId) => {
  if (!confirm('Are you sure you want to approve this signal?')) return
  await updateSignalStatus(signalId, 'approved')
}

const rejectSignal = async (signalId) => {
  if (!confirm('Are you sure you want to reject this signal?')) return
  await updateSignalStatus(signalId, 'rejected')
}

const editSignal = (signal) => {
  currentSignal.value = { ...signal }
  showEditModal.value = true
}

// UI Actions (tetap sama)
const refreshData = async () => {
  refreshing.value = true
  try {
    await loadDashboardData()
  } finally {
    refreshing.value = false
  }
}

const loadDashboardData = async () => {
  try {
    loading.value = true
    error.value = null

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const userData = await fetchUserData()
    user.value = userData
    await fetchSignals()
    
    // Debug info
    debugEndpoints()
    await testEndpoints()
    
  } catch (err) {
    console.error('Error loading dashboard:', err)
    error.value = err.message
    
    if (err.message.includes('Session expired') || err.message.includes('token')) {
      setTimeout(() => router.push('/login'), 2000)
    }
  } finally {
    loading.value = false
  }
}

const retryLoading = async () => await loadDashboardData()
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
const togglePendingFilter = () => showOnlyPending.value = !showOnlyPending.value
const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  resetSignalForm()
}
const resetSignalForm = () => {
  currentSignal.value = { id: null, coin_name: '', entry_price: '', target_price: '', stop_loss: '', note: '' }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
:root{
  --bg: #f7f7f8;
  --surface: #ffffff;
  --muted: #9ea3a7;
  --text: #0f1112;
  --muted-2: #dfe3e6;
  --accent-dark: #171717;
  --danger: #b12c2c;
  --success: #147a3a;
  --radius-lg: 14px;
  --radius-md: 10px;
  --shadow-1: 0 8px 24px rgba(10,10,10,0.04);
  --shadow-2: 0 18px 40px rgba(8,8,8,0.06);
  --glass: rgba(0,0,0,0.03);
  --max-width: 1180px;
  --fw-strong: 800;
  --fw-medium: 600;
  --fw-regular: 400;
}

/* Global */
* { box-sizing: border-box; }
html,body,#app { height:100%; font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; margin:0; color:var(--text); background:var(--bg); -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }

/* Page container */
.dashboard { min-height:100vh; padding:28px 20px; display:flex; justify-content:center; }
.container { width:100%; max-width:var(--max-width); }

/* Top area layout: header + actions in one row */
.header-wrap {
  display:flex;
  justify-content:space-between;
  gap:20px;
  align-items:center;
  margin-bottom:22px;
}
.dashboard-header {
  display:flex;
  gap:18px;
  align-items:center;
}
.dashboard-header h1 {
  margin:0;
  font-size:1.4rem;
  font-weight:var(--fw-strong);
  letter-spacing:-0.2px;
}
.role-badge {
  padding:6px 12px;
  border-radius:999px;
  font-size:0.75rem;
  font-weight:var(--fw-medium);
  color:var(--surface);
  background:var(--accent-dark);
  box-shadow:var(--shadow-1);
  text-transform:uppercase;
}

/* Top-right actions: search + user */
.header-actions {
  display:flex;
  gap:12px;
  align-items:center;
}
.user-info { display:flex; align-items:center; gap:12px; font-weight:600; color:var(--text); }
.user-info .logout-btn { background:transparent; border:1px solid var(--muted-2); padding:8px 12px; border-radius:8px; cursor:pointer; }

/* Main content uses a 2-column responsive layout:
   left: content (stats, table), right: compact sidebar for actions & debug (on wide screens) */
.content-grid {
  display:grid;
  grid-template-columns: 1fr 340px;
  gap:20px;
  align-items:start;
}

/* Right column (sidebar) */
.sidebar {
  position:sticky;
  top:28px;
  align-self:start;
  display:flex;
  flex-direction:column;
  gap:18px;
}

/* Admin tiles (compact) */
.admin-features {
  background:var(--surface);
  padding:14px;
  border-radius:12px;
  box-shadow:var(--shadow-1);
  border:1px solid var(--muted-2);
  display:flex;
  flex-direction:column;
  gap:10px;
}
.features-row {
  display:flex;
  gap:8px;
  align-items:center;
  flex-wrap:wrap;
}
.feature-tile {
  flex:1 1 120px;
  min-width:110px;
  background:linear-gradient(180deg, #fff, #fbfbfb);
  border-radius:10px;
  padding:10px 12px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  border:1px solid var(--muted-2);
  cursor:pointer;
  transition:transform .12s ease, box-shadow .12s ease;
  font-weight:700;
}
.feature-tile:hover { transform:translateY(-4px); box-shadow:var(--shadow-2); }

/* Floating action button for Create */
.fab-create {
  position:fixed;
  right:26px;
  bottom:34px;
  width:60px;
  height:60px;
  border-radius:999px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:var(--accent-dark);
  color:white;
  font-weight:800;
  font-size:22px;
  box-shadow: 0 12px 36px rgba(8,8,8,0.18);
  border: none;
  cursor:pointer;
}

/* Stats grid */
.stats-grid {
  display:grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap:14px;
  margin-bottom:18px;
}
.stat-card {
  background:var(--surface);
  padding:14px;
  border-radius:12px;
  border:1px solid var(--muted-2);
  box-shadow:var(--shadow-1);
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:10px;
}
.stat-left { display:flex; flex-direction:column; gap:6px; }
.stat-left h3 { margin:0; font-size:0.82rem; color:var(--muted); font-weight:800; letter-spacing:0.4px; }
.stat-number { font-size:1.3rem; font-weight:var(--fw-strong); color:var(--text); }

/* Main panel (table, section) */
.panel {
  background:transparent; /* table container handles card */
}

/* Signals Section card with compact header */
.signals-section {
  background:var(--surface);
  border-radius:12px;
  padding:12px;
  border:1px solid var(--muted-2);
  box-shadow:var(--shadow-1);
}
.section-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
  padding:8px 6px 12px 6px;
  border-bottom:1px dashed var(--muted-2);
}
.section-header h2 { margin:0; font-weight:900; font-size:1rem; }
.table-controls { display:flex; gap:8px; align-items:center; }

/* Compact empty state */
.empty-state {
  padding:40px 20px;
  text-align:center;
  color:var(--muted);
}

/* Table styles: compact, sticky header, grouped actions */
.signals-table-container {
  width:100%;
  overflow:auto;
  border-radius:10px;
  margin-top:12px;
  background:var(--surface);
  border:1px solid var(--muted-2);
}
.signals-table {
  width:100%;
  border-collapse:collapse;
  min-width:840px;
  font-size:0.92rem;
}
.signals-table thead th {
  position:sticky;
  top:0;
  background:linear-gradient(180deg, #fff, #fbfbfb);
  padding:10px 12px;
  text-align:left;
  font-weight:800;
  color:var(--muted);
  font-size:0.78rem;
  border-bottom:1px solid var(--muted-2);
  letter-spacing:0.6px;
}
.signals-table tbody td {
  padding:10px 12px;
  border-bottom:1px solid #f3f4f5;
  vertical-align:middle;
  color:var(--text);
}
.signal-row { transition: background .12s ease, transform .08s ease; }
.signal-row:hover { background: linear-gradient(90deg, rgba(0,0,0,0.01), rgba(0,0,0,0.005)); }

/* Coin column: small avatar + coin name, tighter */
.coin-name { display:flex; gap:10px; align-items:center; font-weight:700; }
.coin-symbol {
  width:34px; height:34px; border-radius:8px; display:inline-flex; align-items:center; justify-content:center;
  background:linear-gradient(180deg, var(--muted-2), #ffffff); color:var(--text); font-weight:800; font-size:0.85rem;
  border:1px solid rgba(0,0,0,0.04);
}

/* Price cells - compact numeric alignment */
.price-cell { font-feature-settings: "tnum"; text-align:left; font-weight:700; }

/* Status badges: toned, small */
.status-badge {
  padding:6px 10px;
  border-radius:999px;
  font-size:0.72rem;
  font-weight:800;
  text-transform:uppercase;
  letter-spacing:0.5px;
  border:1px solid rgba(0,0,0,0.04);
}
.status-badge.pending { background: #fffaf5; color:#6b5b40; }
.status-badge.approved { background:#f5fff7; color:var(--success); }
.status-badge.rejected { background:#fff6f6; color:var(--danger); }

/* Actions grouped into icon-only compact buttons */
.actions { display:flex; gap:6px; align-items:center; }
.action-btn {
  height:34px; padding:6px 10px; border-radius:8px; border:1px solid rgba(0,0,0,0.05);
  background:transparent; cursor:pointer; font-weight:800; font-size:0.82rem;
  display:inline-flex; align-items:center; gap:8px;
}
.action-ghost { background:transparent; color:var(--muted); }
.approve-btn { color:var(--success); border-color: rgba(20,122,58,0.08); }
.reject-btn { color:var(--danger); border-color: rgba(177,44,44,0.08); }
.delete-btn { color:#666; border-color: rgba(0,0,0,0.04); }
.edit-btn { color:#1f6fe0; border-color: rgba(31,111,224,0.08); }

/* Modal: denser layout with two-column numeric inputs on large screens */
.modal-overlay {
  position:fixed; inset:0; background: rgba(10,10,10,0.42); display:flex; align-items:center; justify-content:center; z-index:1000;
}
.modal {
  width:100%; max-width:620px; border-radius:12px; background:var(--surface);
  padding:18px; border:1px solid var(--muted-2); box-shadow:var(--shadow-2);
}
.modal h3 { margin:0 0 10px 0; text-align:center; font-size:1.05rem; font-weight:900; color:var(--text); }
.modal form { display:flex; flex-direction:column; gap:10px; }
.form-row {
  display:grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap:10px;
}
.form-group { display:flex; flex-direction:column; gap:6px; }
.form-group label { font-weight:800; font-size:0.78rem; color:var(--muted); }
.modal input, .modal textarea {
  padding:10px 12px; border-radius:8px; border:1px solid var(--muted-2); background:transparent; color:var(--text); font-size:0.95rem;
}
.modal textarea { min-height:88px; resize:vertical; }

/* Modal actions - compact */
.modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:6px; }
.cancel-btn, .submit-btn {
  padding:8px 12px; border-radius:8px; font-weight:900; cursor:pointer; border:1px solid rgba(0,0,0,0.05);
}
.cancel-btn { background:transparent; color:#666; }
.submit-btn { background:var(--accent-dark); color:white; border-color: rgba(0,0,0,0.06); }

/* Debug panel (small) */
.debug-info {
  background: linear-gradient(180deg, #fff, #fbfbfb);
  padding:10px 12px; border-radius:10px; border:1px solid var(--muted-2); font-size:0.86rem; color:var(--muted);
}

/* Small screens: single-column layout, hide sticky sidebar */
@media (max-width: 980px) {
  .content-grid { grid-template-columns: 1fr; }
  .sidebar { position:static; order:2; }
  .header-wrap { flex-direction:column; align-items:stretch; gap:12px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .signals-table { min-width:720px; }
  .fab-create { right:16px; bottom:18px; }
  .form-row { grid-template-columns: 1fr; }
}

/* Extra small screens: single-column stats */
@media (max-width: 520px) {
  .stats-grid { grid-template-columns: 1fr; }
  .signals-table { min-width:640px; font-size:0.9rem; }
}
</style>
