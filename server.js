// ===== DEPENDENCIES =====
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const crypto     = require('crypto');
const path       = require('path');
const fs         = require('fs');
const fetch      = require('node-fetch');
const cron       = require('node-cron');
const rateLimit  = require('express-rate-limit');
const { google } = require('googleapis');

// ===== CONFIG (secrets from environment ONLY — never hardcode) =====
const API_KEY         = process.env.RAPIDAPI_KEY;
const AUTH_TOKEN      = process.env.BACKEND_AUTH_TOKEN;
const PORT            = process.env.PORT || 3000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim());

// Fail fast if secrets are missing
if (!API_KEY) {
  console.error('FATAL: RAPIDAPI_KEY environment variable is not set.');
  process.exit(1);
}
if (!AUTH_TOKEN) {
  console.error('FATAL: BACKEND_AUTH_TOKEN environment variable is not set.');
  console.error('   Generate one: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service_account.json');
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('FATAL: ' + SERVICE_ACCOUNT_PATH + ' not found. See README.');
  process.exit(1);
}

// ===== IN-MEMORY STATE =====
let backendWatchlist = [];
let backendAlerts    = {};
let isJobRunning     = false; // prevents parallel cron runs

// ===== GOOGLE DRIVE AUTH =====
const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_PATH,
  scopes: ['https://www.googleapis.com/auth/drive.file']
});
const driveService = google.drive({ version: 'v3', auth });

// ===== EXPRESS APP =====
const app = express();
app.set('trust proxy', 1);

// Security headers (relaxed CSP since this is an API, not serving HTML views)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: 'same-site' },
  originAgentCluster: false
}));

// CORS — explicit allowlist, reject everything else
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser (curl, Postman)
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) return callback(null, true);
    var err = new Error('CORS: Origin not allowed');
