// backend/middleware/metrics.js
import client from 'prom-client';

const register = new client.Registry();

// Default metrics (CPU, memory)
client.collectDefaultMetrics({
  register,
  prefix: 'callmaker_',
});

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'callmaker_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestCounter = new client.Counter({
  name: 'callmaker_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new client.Gauge({
  name: 'callmaker_active_connections',
  help: 'Active connections'
});

const signalOperations = new client.Counter({
  name: 'callmaker_signal_operations_total',
  help: 'Total signal operations',
  labelNames: ['operation', 'status']
});

const authAttempts = new client.Counter({
  name: 'callmaker_auth_attempts_total',
  help: 'Authentication attempts',
  labelNames: ['result']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestCounter);
register.registerMetric(activeConnections);
register.registerMetric(signalOperations);
register.registerMetric(authAttempts);

export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  activeConnections.inc();
  
  const route = req.route?.path || req.path || 'unknown';
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: route,
      status_code: res.statusCode
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestCounter.inc(labels);
    activeConnections.dec();
  });
  
  next();
};

export const metricsHandler = async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.send(metrics);
};

export const metrics = {
  signalOperations,
  authAttempts
};

export default register;