// ===== CONFIG =====
const API_KEY = "3b6fb1fec2mshe51c9b329d9f3cdp1b06bejsn420c66fa4e22"; // Replace with your RapidAPI key

// Default from localStorage
let watchlist = JSON.parse(localStorage.getItem("watchlist")) || ["RELIANCE.NS", "TCS.NS", "AAPL"];
let alerts = JSON.parse(localStorage.getItem("stockAlerts")) || {};
let colorsEnabled = JSON.parse(localStorage.getItem("colorsEnabled"));
if (colorsEnabled === null) colorsEnabled = true;
let darkMode = JSON.parse(localStorage.getItem("darkMode"));
if (darkMode === null) darkMode = false;

const regionFlags = {
    US: "🇺🇸", IN: "🇮🇳", GB: "🇬🇧", CA: "🇨🇦", SG: "🇸🇬",
    HK: "🇭🇰", AU: "🇦🇺", JP: "🇯🇵", FR: "🇫🇷", DE: "🇩🇪",
    IT: "🇮🇹", BR: "🇧🇷"
};
const regionColors = {
    US: "#e8f4fd", IN: "#fff4e6", GB: "#f0f0f0", CA: "#eaffea",
    SG: "#fff0f5", HK: "#f2f2ff", AU: "#fef9e7", JP: "#f0fff0",
    FR: "#f9f0ff", DE: "#f6fff6", IT: "#fffaf0", BR: "#f0fff8"
};
const darkVariants = {
    US: "#0d3b66", IN: "#5a3e1b", GB: "#3a3a3a", CA: "#1d4020",
    SG: "#402835", HK: "#2c2c47", AU: "#4d4420", JP: "#1d4020",
    FR: "#3a1d40", DE: "#214021", IT: "#403a1d", BR: "#1d4033"
};

const alertSound = document.getElementById("alertSound");
const resultsBox = document.getElementById("autocompleteResults");
const searchInput = document.getElementById("newSymbol");
let pulseTimeouts = {};

if (Notification.permission !== "granted") Notification.requestPermission();

// ===== Dark Mode =====
function isNightTime() {
    const hour = new Date().getHours();
    return hour >= 19 || hour < 7;
}
function applyDarkMode() {
    document.body.classList.toggle("dark-mode", darkMode);
    document.getElementById("toggleDarkModeBtn").textContent = darkMode ? "☀️ Light Mode" : "🌙 Dark Mode";
}
function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    localStorage.setItem("darkModeManual", "true");
    applyDarkMode(); updateStocksTable();
}
function resetAutoMode() {
    localStorage.removeItem("darkModeManual");
    darkMode = isNightTime();
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    applyDarkMode(); updateStocksTable();
}
function initDarkMode() {
    if (!localStorage.getItem("darkModeManual")) {
        darkMode = isNightTime();
        localStorage.setItem("darkMode", JSON.stringify(darkMode));
    }
    applyDarkMode();
}
setInterval(() => {
    if (!localStorage.getItem("darkModeManual")) {
        const newMode = isNightTime();
        if (newMode !== darkMode) {
            darkMode = newMode;
            localStorage.setItem("darkMode", JSON.stringify(darkMode));
            applyDarkMode(); updateStocksTable();
        }
    }
}, 60000);

// ===== Colors =====
function toggleColors() {
    colorsEnabled = !colorsEnabled;
    localStorage.setItem("colorsEnabled", JSON.stringify(colorsEnabled));
    updateStocksTable();
}
function getRegion(symbol) {
    if (symbol.endsWith(".NS") || symbol.endsWith(".BO")) return "IN";
    if (symbol.endsWith(".HK")) return "HK";
    return "US";
}
function getFlagForSymbol(symbol) {
    return regionFlags[getRegion(symbol)] || "🌐";
}
function getColorForSymbol(symbol) {
    if (!colorsEnabled) return darkMode ? "#1e1e1e" : "white";
    const region = getRegion(symbol);
    return darkMode ? (darkVariants[region] || "#1e1e1e") : (regionColors[region] || "white");
}

// ===== Data Fetch =====
async function fetchStockPrice(symbol) {
    const url = `https://yh-finance.p.rapidapi.com/stock/v2/get-summary?symbol=${symbol}&region=${getRegion(symbol)}`;
    try {
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': 'yh-finance.p.rapidapi.com'
            }
        });
        const data = await res.json();
        return data.price?.regularMarketPrice?.raw ?? null;
    } catch {
        return null;
    }
}

// ===== Table Update =====
async function updateStocksTable() {
    const tbody = document.querySelector("#stocksTable tbody");
    tbody.innerHTML = "";

    for (let symbol of watchlist) {
        const price = await fetchStockPrice(symbol);
        const priceDisplay = price !== null ? price.toFixed(2) : "—";
        const alertValue = alerts[symbol] || "—";
        const flag = getFlagForSymbol(symbol);
        const bgColor = getColorForSymbol(symbol);

        const row = document.createElement("tr");
        row.style.backgroundColor = bgColor;
        row.innerHTML = `
          <td>${flag} ${symbol}</td>
          <td>${priceDisplay}</td>
          <td>${alertValue}</td>
          <td>
            <input type="number" step="0.01" id="alert-${symbol}">
            <button onclick="setAlert('${symbol}')">Set</button>
          </td>
          <td><button onclick="removeStock('${symbol}')">❌</button></td>
        `;

        if (alerts[symbol] && price !== null && price >= alerts[symbol]) {
            if (!row.dataset.alertShown) {
                triggerAlert(symbol, price);
                row.dataset.alertShown = "true";
                row.classList.add("alert-active");

                if (pulseTimeouts[symbol]) clearTimeout(pulseTimeouts[symbol]);
                pulseTimeouts[symbol] = setTimeout(() => {
                    row.classList.remove("alert-active");
                    row.style.backgroundColor = "#ffcccc";
                }, 10000);
            } else {
                row.style.backgroundColor = "#ffcccc";
            }
        } else {
            if (row.dataset.alertShown && price < alerts[symbol]) {
                row.dataset.alertShown = "";
            }
            row.classList.remove("alert-active");
            if (!row.dataset.alertShown) row.style.backgroundColor = bgColor;
        }
        tbody.appendChild(row);
    }
    syncWatchlistToBackend();
}

// ===== Alerts =====
function triggerAlert(symbol, price) {
    alertSound.play();
    if (Notification.permission === "granted") {
        new Notification(`Stock Alert: ${symbol}`, { body: `${symbol} hit ₹/$${price}` });
    }
    alert(`🚨 ALERT: ${symbol} reached ₹/$${price}`);
}
function setAlert(symbol) {
    const val = parseFloat(document.getElementById(`alert-${symbol}`).value);
    if (!isNaN(val)) {
        alerts[symbol] = val;
        localStorage.setItem("stockAlerts", JSON.stringify(alerts));
        updateStocksTable();
        syncWatchlistToBackend();
    }
}

// ===== Watchlist =====
function manualAddStock() {
    const symbol = searchInput.value.trim().toUpperCase();
    if (symbol && !watchlist.includes(symbol)) {
        watchlist.push(symbol);
        localStorage.setItem("watchlist", JSON.stringify(watchlist));
        updateStocksTable();
    }
    searchInput.value = "";
    resultsBox.innerHTML = "";
}
function removeStock(symbol) {
    watchlist = watchlist.filter(s => s !== symbol);
    delete alerts[symbol];
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
    localStorage.setItem("stockAlerts", JSON.stringify(alerts));
    updateStocksTable();
}

// ===== Autocomplete =====
async function searchStocks(query) {
    if (!query) return resultsBox.innerHTML = "";
    const regions = ["US", "IN", "GB", "CA", "SG", "HK", "AU", "JP"];
    let allResults = [];
    await Promise.all(regions.map(async region => {
        try {
            const res = await fetch(`https://yh-finance.p.rapidapi.com/auto-complete?q=${query}&region=${region}`, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': API_KEY,
                    'X-RapidAPI-Host': 'yh-finance.p.rapidapi.com'
                }
            });
            const data = await res.json();
            (data.quotes || []).forEach(q => {
                if (q.symbol && !allResults.find(r => r.symbol === q.symbol)) {
                    q.marketRegion = region; allResults.push(q);
                }
            });
        } catch {}
    }));
    showSearchResults(allResults);
}
function showSearchResults(results) {
    resultsBox.innerHTML = "";
    results.forEach(item => {
        const flag = regionFlags[item.marketRegion] || "🌐";
        const div = document.createElement("div");
        div.className = "autocomplete-item";
        div.innerHTML = `${flag} <strong>${item.symbol}</strong> - ${item.shortname || ""} <span style="color:grey">(${item.marketRegion})</span>`;
        div.onclick = () => {
            if (!watchlist.includes(item.symbol)) {
                watchlist.push(item.symbol);
                localStorage.setItem("watchlist", JSON.stringify(watchlist));
                updateStocksTable();
            }
            searchInput.value = "";
            resultsBox.innerHTML = "";
        };
        resultsBox.appendChild(div);
    });
}
searchInput.addEventListener("input", e => searchStocks(e.target.value.trim()));

// ===== CSV Export =====
function exportToCSV(auto = false) {
    const now = new Date();
    const timestamp = now.toLocaleString();
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Exported At:,${timestamp}\n`;
    csvContent += "Symbol,Price,Alert\n";
    const rows = document.querySelector("#stocksTable tbody").rows;
    for (let row of rows) {
        const symbol = row.cells[0].innerText.trim();
        const price = row.cells[1].innerText.trim();
        const alertValue = row.cells[2].innerText.trim();
        csvContent += `${symbol},${price},${alertValue}\n`;
    }
    if (!auto) {
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `stocks_${now.toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    return csvContent;
}

// ===== Backend Sync =====
function syncWatchlistToBackend() {
    fetch('/update-watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlist, alerts })
    }).catch(err => console.error('Sync failed:', err));
}

// ===== Init =====
initDarkMode();
updateStocksTable();
setInterval(updateStocksTable, 60000);
