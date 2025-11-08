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
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  color: white;
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  background: white;
  padding: 40px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.error-state p {
  font-size: 18px;
  margin-bottom: 20px;
  color: #e74c3c;
}

.retry-btn, .logout-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin: 0 10px;
  transition: all 0.3s ease;
}

.retry-btn {
  background: #3498db;
  color: white;
}

.logout-btn {
  background: #e74c3c;
  color: white;
}

.retry-btn:hover, .logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* Main Content */
.main-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f3f4;
}

.dashboard-header h1 {
  font-size: 2.5em;
  color: #2c3e50;
  margin: 0;
  font-weight: 700;
}

.role-badge {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 25px;
  font-size: 0.9em;
  font-weight: bold;
  text-transform: uppercase;
  margin-top: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.role-badge.admin {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.role-badge.callmaker {
  background: linear-gradient(45deg, #f39c12, #e67e22);
  color: white;
}

.role-badge.user {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
}

.user-info {
  text-align: right;
}

.user-info span {
  display: block;
  font-size: 1.1em;
  color: #2c3e50;
  margin-bottom: 10px;
  font-weight: 600;
}

/* Admin Features */
.admin-features {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.feature-btn {
  padding: 15px 25px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1em;
  transition: all 0.3s ease;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.create-btn {
  background: linear-gradient(45deg, #27ae60, #2ecc71);
  color: white;
}

.pending-btn {
  background: linear-gradient(45deg, #f39c12, #f1c40f);
  color: white;
}

.feature-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  border-left: 5px solid;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: inherit;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
}

.stat-card.total {
  border-left-color: #3498db;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.stat-card.pending {
  border-left-color: #f39c12;
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
}

.stat-card.approved {
  border-left-color: #27ae60;
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
}

.stat-card.my-signals {
  border-left-color: #9b59b6;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
}

.stat-card h3 {
  margin: 0 0 15px 0;
  font-size: 1em;
  opacity: 0.9;
  font-weight: 600;
}

.stat-number {
  font-size: 2.5em;
  font-weight: 700;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

/* Signals Section */
.signals-section {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f1f3f4;
}

.section-header h2 {
  color: #2c3e50;
  font-size: 1.8em;
  margin: 0;
  font-weight: 700;
}

.refresh-btn {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-icon {
  font-size: 4em;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 1.5em;
  margin-bottom: 10px;
  color: #2c3e50;
}

.empty-state p {
  margin-bottom: 25px;
  font-size: 1.1em;
}

/* Table Styles */
.signals-table-container {
  overflow-x: auto;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.signals-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.signals-table th {
  background: linear-gradient(135deg, #34495e, #2c3e50);
  color: white;
  padding: 18px 15px;
  text-align: left;
  font-weight: 600;
  font-size: 0.95em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.signals-table td {
  padding: 18px 15px;
  border-bottom: 1px solid #ecf0f1;
  transition: all 0.2s ease;
}

.signal-row:hover {
  background: #f8f9fa;
  transform: scale(1.01);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.coin-name {
  font-weight: 700;
  color: #2c3e50;
  font-size: 1.1em;
}

.signal-date {
  color: #7f8c8d;
  font-size: 0.9em;
}

/* Status Badges */
.status-badge {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-badge.approved {
  background: #d1f7e9;
  color: #155724;
  border: 1px solid #b7ebce;
}

.status-badge.rejected {
  background: #fde8e8;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Actions */
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8em;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.approve-btn {
  background: linear-gradient(45deg, #27ae60, #2ecc71);
  color: white;
}

.reject-btn {
  background: linear-gradient(45deg, #e74c3c, #c0392b);
  color: white;
}

.delete-btn {
  background: linear-gradient(45deg, #95a5a6, #7f8c8d);
  color: white;
}

.edit-btn {
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.modal {
  background: white;
  padding: 40px;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal h3 {
  margin: 0 0 25px 0;
  color: #2c3e50;
  font-size: 1.5em;
  text-align: center;
}

.modal input, .modal textarea {
  width: 100%;
  padding: 15px;
  margin-bottom: 20px;
  border: 2px solid #ecf0f1;
  border-radius: 10px;
  font-size: 1em;
  transition: all 0.3s ease;
}

.modal input:focus, .modal textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.modal textarea {
  min-height: 100px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 25px;
}

.cancel-btn, .submit-btn {
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #95a5a6;
  color: white;
}

.submit-btn {
  background: linear-gradient(45deg, #27ae60, #2ecc71);
  color: white;
}

.cancel-btn:hover, .submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard {
    padding: 10px;
  }
  
  .main-content {
    padding: 20px 15px;
  }
  
  .dashboard-header {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  
  .user-info {
    text-align: center;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .signals-table {
    font-size: 0.9em;
  }
  
  .actions {
    justify-content: center;
  }
  
  .modal {
    padding: 25px 20px;
    margin: 20px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}

/* Animation for table rows */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.signal-row {
  animation: fadeIn 0.5s ease-out;
}

/* Custom scrollbar */
.signals-table-container::-webkit-scrollbar {
  height: 8px;
}

.signals-table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.signals-table-container::-webkit-scrollbar-thumb {
  background: linear-gradient(45deg, #3498db, #2980b9);
  border-radius: 4px;
}

.signals-table-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(45deg, #2980b9, #21618c);
}


.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.debug-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-top: 20px;
  font-size: 0.8em;
  color: #6c757d;
}

.debug-info h4 {
  margin: 0 0 10px 0;
  color: #495057;
}

.coin-symbol {
  display: inline-block;
  width: 24px;
  height: 24px;
  background: #3498db;
  color: white;
  border-radius: 50%;
  text-align: center;
  line-height: 24px;
  font-weight: bold;
  margin-right: 8px;
  font-size: 0.8em;
}

.signal-count {
  font-size: 0.8em;
  opacity: 0.7;
  margin-left: 8px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.table-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.callmaker-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>