/**
 * CARRIER INTEL & SCRAPER DASHBOARD — FRONTEND ENGINE
 */

document.addEventListener('DOMContentLoaded', () => {
  // App State
  const state = {
    currentTab: 'tab-upload-csv',
    activeCarrier: null,
    crmPage: 1,
    crmLimit: 25,
    crmSearch: '',
    crmState: '',
    autoscroll: true,
    lastScrapeStats: null,

    // CSV Uploader State
    parsedCsv: null,
    csvDots: [],
    csvLiveCarriers: [],
    csvFilterTerm: '',
    csvFilterState: '',
  };

  // DOM Elements Cache
  const els = {
    // Nav & HUD
    tabs: document.querySelectorAll('.nav-tab'),
    panes: document.querySelectorAll('.tab-pane'),
    connStatusBadge: document.getElementById('connStatusBadge'),
    engineStatusBadge: document.getElementById('engineStatusBadge'),
    engineStatusText: document.getElementById('engineStatusText'),
    tabScraperBadge: document.getElementById('tabScraperBadge'),
    tabCarriersCountBadge: document.getElementById('tabCarriersCountBadge'),
    tabFailedCountBadge: document.getElementById('tabFailedCountBadge'),
    hudTotalCarriers: document.getElementById('hudTotalCarriers'),
    hudDoneCount: document.getElementById('hudDoneCount'),
    hudSpeed: document.getElementById('hudSpeed'),
    hudEta: document.getElementById('hudEta'),

    // Top buttons
    quickTestNavBtn: document.getElementById('quickTestNavBtn'),
    exportCsvTopBtn: document.getElementById('exportCsvTopBtn'),
    exportJsonTopBtn: document.getElementById('exportJsonTopBtn'),

    // ==========================================
    // CSV UPLOADER TAB ELEMENTS
    // ==========================================
    downloadSampleCsvBtn: document.getElementById('downloadSampleCsvBtn'),
    toggleRawPasteBtn: document.getElementById('toggleRawPasteBtn'),
    csvUploadCard: document.getElementById('csvUploadCard'),
    csvDropZone: document.getElementById('csvDropZone'),
    browseCsvFileBtn: document.getElementById('browseCsvFileBtn'),
    useSampleDataBtn: document.getElementById('useSampleDataBtn'),
    mainCsvFileInput: document.getElementById('mainCsvFileInput'),
    rawPasteBox: document.getElementById('rawPasteBox'),
    rawPasteTextarea: document.getElementById('rawPasteTextarea'),
    parseRawPasteBtn: document.getElementById('parseRawPasteBtn'),
    cancelRawPasteBtn: document.getElementById('cancelRawPasteBtn'),

    csvConfirmCard: document.getElementById('csvConfirmCard'),
    csvRowsBadge: document.getElementById('csvRowsBadge'),
    csvDotsBadge: document.getElementById('csvDotsBadge'),
    csvFileNameDisplay: document.getElementById('csvFileNameDisplay'),
    csvDetectedColSelect: document.getElementById('csvDetectedColSelect'),
    csvConcurrencyKnob: document.getElementById('csvConcurrencyKnob'),
    csvDelayKnob: document.getElementById('csvDelayKnob'),
    csvPreviewThead: document.getElementById('csvPreviewThead'),
    csvPreviewTbody: document.getElementById('csvPreviewTbody'),
    startCsvScrapingBtn: document.getElementById('startCsvScrapingBtn'),
    changeCsvFileBtn: document.getElementById('changeCsvFileBtn'),
    startScrapeCountText: document.getElementById('startScrapeCountText'),

    // Scraped Live Stream Banner & Table
    csvLiveResultsSection: document.getElementById('csvLiveResultsSection'),
    csvScrapeProgressBanner: document.getElementById('csvScrapeProgressBanner'),
    csvJobTitle: document.getElementById('csvJobTitle'),
    csvProgressPercent: document.getElementById('csvProgressPercent'),
    csvProgressBarFill: document.getElementById('csvProgressBarFill'),
    csvProcessedCount: document.getElementById('csvProcessedCount'),
    csvTotalCount: document.getElementById('csvTotalCount'),
    csvSpeedText: document.getElementById('csvSpeedText'),
    csvEtaText: document.getElementById('csvEtaText'),
    csvKpiOk: document.getElementById('csvKpiOk'),
    csvKpiEmpty: document.getElementById('csvKpiEmpty'),
    csvKpiFailed: document.getElementById('csvKpiFailed'),
    csvKpiElapsed: document.getElementById('csvKpiElapsed'),
    csvLiveFoundBadge: document.getElementById('csvLiveFoundBadge'),
    csvDownloadResultsBtn: document.getElementById('csvDownloadResultsBtn'),
    csvTableFilterInput: document.getElementById('csvTableFilterInput'),
    csvTableStateSelect: document.getElementById('csvTableStateSelect'),
    csvScrapedTableBody: document.getElementById('csvScrapedTableBody'),

    // Inspector
    inspectorForm: document.getElementById('inspectorForm'),
    inspectorInput: document.getElementById('inspectorInput'),
    clearInspectorInputBtn: document.getElementById('clearInspectorInputBtn'),
    inspectorSearchBtn: document.getElementById('inspectorSearchBtn'),
    inspectorCarrierContent: document.getElementById('inspectorCarrierContent'),
    inspectorCarrierActions: document.getElementById('inspectorCarrierActions'),
    saveCurrentCarrierBtn: document.getElementById('saveCurrentCarrierBtn'),
    inspectorMapsLink: document.getElementById('inspectorMapsLink'),
    inspectorTimingBadge: document.getElementById('inspectorTimingBadge'),
    inspectorHttpStatus: document.getElementById('inspectorHttpStatus'),
    rawJsonViewer: document.getElementById('rawJsonViewer'),
    copyRawJsonBtn: document.getElementById('copyRawJsonBtn'),
    chipBtns: document.querySelectorAll('.chip-btn'),
    multiProbeInput: document.getElementById('multiProbeInput'),
    multiProbeBtn: document.getElementById('multiProbeBtn'),
    multiProbeResults: document.getElementById('multiProbeResults'),

    // Range Scraper
    modeRangeBtn: document.getElementById('modeRangeBtn'),
    modeListBtn: document.getElementById('modeListBtn'),
    rangeFormSection: document.getElementById('rangeFormSection'),
    listFormSection: document.getElementById('listFormSection'),
    rangeStartInput: document.getElementById('rangeStartInput'),
    rangeCountInput: document.getElementById('rangeCountInput'),
    rangePreviewText: document.getElementById('rangePreviewText'),
    rangePreviewTotal: document.getElementById('rangePreviewTotal'),
    customListTextarea: document.getElementById('customListTextarea'),
    dropArea: document.getElementById('dropArea'),
    leadFileInput: document.getElementById('leadFileInput'),
    concurrencySlider: document.getElementById('concurrencySlider'),
    concurrencyValueDisplay: document.getElementById('concurrencyValueDisplay'),
    delaySlider: document.getElementById('delaySlider'),
    delayValueDisplay: document.getElementById('delayValueDisplay'),
    startScraperBtn: document.getElementById('startScraperBtn'),
    pauseScraperBtn: document.getElementById('pauseScraperBtn'),
    resumeScraperBtn: document.getElementById('resumeScraperBtn'),
    stopScraperBtn: document.getElementById('stopScraperBtn'),
    monitorStatusPill: document.getElementById('monitorStatusPill'),
    progressBarFill: document.getElementById('progressBarFill'),
    progressPercentText: document.getElementById('progressPercentText'),
    progressProcessedText: document.getElementById('progressProcessedText'),
    progressTotalText: document.getElementById('progressTotalText'),
    progressSpeedText: document.getElementById('progressSpeedText'),
    progressEtaText: document.getElementById('progressEtaText'),
    kpiOkCount: document.getElementById('kpiOkCount'),
    kpiEmptyCount: document.getElementById('kpiEmptyCount'),
    kpiFailedCount: document.getElementById('kpiFailedCount'),
    kpiElapsedText: document.getElementById('kpiElapsedText'),
    terminalBody: document.getElementById('terminalBody'),
    clearLogsBtn: document.getElementById('clearLogsBtn'),
    autoscrollCheckbox: document.getElementById('autoscrollCheckbox'),

    // CRM
    refreshCrmBtn: document.getElementById('refreshCrmBtn'),
    crmSearchInput: document.getElementById('crmSearchInput'),
    crmStateSelect: document.getElementById('crmStateSelect'),
    crmTableBody: document.getElementById('crmTableBody'),
    crmShowingCount: document.getElementById('crmShowingCount'),
    crmTotalCount: document.getElementById('crmTotalCount'),
    crmPrevPageBtn: document.getElementById('crmPrevPageBtn'),
    crmNextPageBtn: document.getElementById('crmNextPageBtn'),
    crmCurrentPageText: document.getElementById('crmCurrentPageText'),

    // Config
    configForm: document.getElementById('configForm'),
    cfgBaseUrl: document.getElementById('cfgBaseUrl'),
    cfgPath: document.getElementById('cfgPath'),
    cfgMethod: document.getElementById('cfgMethod'),
    cfgQueryParam: document.getElementById('cfgQueryParam'),
    cfgConcurrency: document.getElementById('cfgConcurrency'),
    cfgUserAgent: document.getElementById('cfgUserAgent'),
    configPresetSelect: document.getElementById('configPresetSelect'),
    resetConfigBtn: document.getElementById('resetConfigBtn'),
    testConnectionBtn: document.getElementById('testConnectionBtn'),
    connTargetUrl: document.getElementById('connTargetUrl'),
    connProbeStatus: document.getElementById('connProbeStatus'),
    connProbeLatency: document.getElementById('connProbeLatency'),
    connProbeOutput: document.getElementById('connProbeOutput'),

    // Failed
    failedListBadge: document.getElementById('failedListBadge'),
    failedListContainer: document.getElementById('failedListContainer'),
    retryAllFailedBtn: document.getElementById('retryAllFailedBtn'),
    doneCountStateDisplay: document.getElementById('doneCountStateDisplay'),
    clearAllDataBtn: document.getElementById('clearAllDataBtn'),

    // Modal & Toast
    carrierModal: document.getElementById('carrierModal'),
    modalCarrierName: document.getElementById('modalCarrierName'),
    modalCarrierBody: document.getElementById('modalCarrierBody'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    closeModalFooterBtn: document.getElementById('closeModalFooterBtn'),
    toastContainer: document.getElementById('toastContainer'),
  };

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    els.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // =========================================================================
  // TAB NAVIGATION
  // =========================================================================
  function switchTab(tabId) {
    state.currentTab = tabId;
    els.tabs.forEach(t => {
      if (t.dataset.tab === tabId) t.classList.add('active');
      else t.classList.remove('active');
    });
    els.panes.forEach(p => {
      if (p.id === tabId) p.classList.add('active');
      else p.classList.remove('active');
    });

    if (tabId === 'tab-crm') loadCarriers();
    if (tabId === 'tab-config') loadConfig();
    if (tabId === 'tab-failed') loadFailedState();
  }

  els.tabs.forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });

  els.quickTestNavBtn.addEventListener('click', () => switchTab('tab-inspector'));
  els.exportCsvTopBtn.addEventListener('click', () => { window.location.href = '/api/export/csv'; });
  els.exportJsonTopBtn.addEventListener('click', () => { window.location.href = '/api/export/json'; });

  // =========================================================================
  // STATUS & SSE REAL-TIME CONNECTION
  // =========================================================================
  let eventSource = null;

  function initSSE() {
    if (eventSource) eventSource.close();

    eventSource = new EventSource('/api/scrape/stream');

    eventSource.addEventListener('init', (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.stats) updateScraperMetrics(data.stats);
        if (data.logs && Array.isArray(data.logs)) {
          els.terminalBody.innerHTML = '';
          data.logs.reverse().forEach(log => appendTerminalLog(log));
        }
      } catch (err) { console.error('SSE init error:', err); }
    });

    eventSource.addEventListener('stats', (e) => {
      try {
        const stats = JSON.parse(e.data);
        updateScraperMetrics(stats);
      } catch (err) { console.error('SSE stats error:', err); }
    });

    eventSource.addEventListener('log', (e) => {
      try {
        const log = JSON.parse(e.data);
        appendTerminalLog(log);
        if (log.level === 'found') {
          const current = Number(els.hudTotalCarriers.textContent) || 0;
          els.hudTotalCarriers.textContent = String(current + 1);
        }
      } catch (err) { console.error('SSE log error:', err); }
    });

    // Real-Time Carrier Event
    eventSource.addEventListener('carrier', (e) => {
      try {
        const carrier = JSON.parse(e.data);
        handleLiveCarrierArrival(carrier);
      } catch (err) { console.error('SSE carrier error:', err); }
    });

    eventSource.onopen = () => {
      els.connStatusBadge.className = 'status-pill status-online';
      els.connStatusBadge.querySelector('.status-text').textContent = 'MOTUS API CONNECTED';
    };

    eventSource.onerror = () => {
      els.connStatusBadge.className = 'status-pill status-idle';
      els.connStatusBadge.querySelector('.status-text').textContent = 'RECONNECTING...';
    };
  }

  function handleLiveCarrierArrival(carrier) {
    // Avoid duplicate
    if (state.csvLiveCarriers.some(c => c.dotNumber === carrier.dotNumber)) return;

    state.csvLiveCarriers.unshift(carrier);
    els.csvLiveFoundBadge.textContent = `${state.csvLiveCarriers.length} Carriers Scraped`;

    // Populate state dropdown if needed
    if (carrier.state && !Array.from(els.csvTableStateSelect.options).some(o => o.value === carrier.state)) {
      const opt = document.createElement('option');
      opt.value = carrier.state;
      opt.textContent = carrier.state;
      els.csvTableStateSelect.appendChild(opt);
    }

    renderCsvScrapedTable();
  }

  async function fetchOverallStatus() {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) return;
      const data = await res.json();
      els.hudTotalCarriers.textContent = String(data.totalCarriers || 0);
      els.tabCarriersCountBadge.textContent = String(data.totalCarriers || 0);
      els.hudDoneCount.textContent = String(data.doneCount || 0);
      els.tabFailedCountBadge.textContent = String(data.failedCount || 0);
      if (data.scraper) updateScraperMetrics(data.scraper);
    } catch {}
  }

  function updateScraperMetrics(stats) {
    state.lastScrapeStats = stats;

    const total = stats.total || 0;
    const processed = stats.processed || 0;
    const ok = stats.ok || 0;
    const empty = stats.empty || 0;
    const failed = stats.failed || 0;
    const speed = stats.reqPerSec || 0;
    const eta = stats.etaMinutes || 0;

    const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

    // HUD
    els.hudSpeed.innerHTML = `${speed} <small>req/s</small>`;
    els.hudEta.innerHTML = `${eta} <small>min</small>`;

    // Update CSV Progress Banner
    if (stats.isRunning || processed > 0) {
      els.csvScrapeProgressBanner.style.display = 'block';
      els.csvProgressPercent.textContent = `${pct}%`;
      els.csvProgressBarFill.style.width = `${pct}%`;
      els.csvProcessedCount.textContent = String(processed);
      els.csvTotalCount.textContent = String(total);
      els.csvSpeedText.textContent = `${speed} req/s`;
      els.csvEtaText.textContent = `${eta} min`;

      els.csvKpiOk.textContent = String(ok);
      els.csvKpiEmpty.textContent = String(empty);
      els.csvKpiFailed.textContent = String(failed);

      const elapsedSec = stats.elapsedSeconds || 0;
      const mins = Math.floor(elapsedSec / 60).toString().padStart(2, '0');
      const secs = (elapsedSec % 60).toString().padStart(2, '0');
      els.csvKpiElapsed.textContent = `${mins}:${secs}`;
    }

    // Range Tab Scraper elements
    els.progressBarFill.style.width = `${pct}%`;
    els.progressPercentText.textContent = `${pct}%`;
    els.progressProcessedText.textContent = String(processed);
    els.progressTotalText.textContent = String(total);
    els.progressSpeedText.textContent = `${speed} req/s`;
    els.progressEtaText.textContent = `${eta} min`;
    els.kpiOkCount.textContent = String(ok);
    els.kpiEmptyCount.textContent = String(empty);
    els.kpiFailedCount.textContent = String(failed);

    const elapsedSec = stats.elapsedSeconds || 0;
    const mins = Math.floor(elapsedSec / 60).toString().padStart(2, '0');
    const secs = (elapsedSec % 60).toString().padStart(2, '0');
    els.kpiElapsedText.textContent = `${mins}:${secs}`;

    // Badges & Controls
    if (stats.isRunning) {
      if (stats.isPaused) {
        els.engineStatusBadge.className = 'status-pill status-idle';
        els.engineStatusText.textContent = 'ENGINE PAUSED';
        els.monitorStatusPill.className = 'badge badge-amber';
        els.monitorStatusPill.textContent = 'PAUSED';
        els.startScraperBtn.style.display = 'none';
        els.pauseScraperBtn.style.display = 'none';
        els.resumeScraperBtn.style.display = 'inline-flex';
        els.stopScraperBtn.style.display = 'inline-flex';
        els.tabScraperBadge.style.display = 'inline-block';
        els.tabScraperBadge.textContent = 'Paused';
      } else {
        els.engineStatusBadge.className = 'status-pill status-scraping';
        els.engineStatusText.textContent = `SCRAPING (${speed}/s)`;
        els.monitorStatusPill.className = 'badge badge-emerald';
        els.monitorStatusPill.textContent = 'SCRAPING LIVE';
        els.startScraperBtn.style.display = 'none';
        els.pauseScraperBtn.style.display = 'inline-flex';
        els.resumeScraperBtn.style.display = 'none';
        els.stopScraperBtn.style.display = 'inline-flex';
        els.tabScraperBadge.style.display = 'inline-block';
        els.tabScraperBadge.textContent = 'Running';
      }
    } else {
      els.engineStatusBadge.className = 'status-pill status-idle';
      els.engineStatusText.textContent = 'ENGINE IDLE';
      els.monitorStatusPill.className = 'badge badge-idle';
      els.monitorStatusPill.textContent = 'IDLE';
      els.startScraperBtn.style.display = 'inline-flex';
      els.pauseScraperBtn.style.display = 'none';
      els.resumeScraperBtn.style.display = 'none';
      els.stopScraperBtn.style.display = 'none';
      els.tabScraperBadge.style.display = 'none';
    }
  }

  function appendTerminalLog(log) {
    const entry = document.createElement('div');
    entry.className = `log-entry log-entry-${log.level}`;
    entry.innerHTML = `
      <span class="log-time">[${log.timestamp}]</span>
      <span class="log-level">[${log.level.toUpperCase()}]</span>
      <span class="log-msg">${escapeHtml(log.message)}</span>
    `;

    els.terminalBody.prepend(entry);
    if (els.terminalBody.children.length > 300) {
      els.terminalBody.lastElementChild.remove();
    }
    if (els.autoscrollCheckbox.checked) {
      els.terminalBody.scrollTop = 0;
    }
  }

  els.clearLogsBtn.addEventListener('click', () => {
    els.terminalBody.innerHTML = '';
  });

  // =========================================================================
  // TAB 0: UPLOAD CSV & SCRAPE (MAIN FEATURE)
  // =========================================================================
  // File Drop Zone
  ['dragenter', 'dragover'].forEach(eventName => {
    els.csvDropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      els.csvDropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    els.csvDropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      els.csvDropZone.classList.remove('dragover');
    });
  });

  els.csvDropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) handleCsvFile(files[0]);
  });

  els.browseCsvFileBtn.addEventListener('click', () => els.mainCsvFileInput.click());
  els.mainCsvFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleCsvFile(e.target.files[0]);
  });

  // Paste Text Toggling
  els.toggleRawPasteBtn.addEventListener('click', () => {
    const isVisible = els.rawPasteBox.style.display !== 'none';
    els.rawPasteBox.style.display = isVisible ? 'none' : 'block';
  });

  els.cancelRawPasteBtn.addEventListener('click', () => {
    els.rawPasteBox.style.display = 'none';
  });

  els.parseRawPasteBtn.addEventListener('click', () => {
    const content = els.rawPasteTextarea.value.trim();
    if (!content) {
      showToast('Please paste some CSV or DOT text first.', 'error');
      return;
    }
    processCsvContent(content, 'pasted_data.csv');
  });

  // "Use Sample 10 Leads"
  els.useSampleDataBtn.addEventListener('click', async () => {
    try {
      showToast('Loading sample leads CSV...', 'info');
      const res = await fetch('/api/sample-csv');
      const content = await res.text();
      processCsvContent(content, 'sample_leads.csv');
    } catch (err) {
      showToast('Error loading sample CSV: ' + err.message, 'error');
    }
  });

  function handleCsvFile(file) {
    if (!file.name.match(/\.(csv|txt)$/i)) {
      showToast('Please upload a .csv or .txt file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      processCsvContent(e.target.result, file.name);
    };
    reader.readAsText(file);
  }

  async function processCsvContent(content, fileName) {
    try {
      const res = await fetch('/api/parse-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse CSV');

      state.parsedCsv = data;
      state.csvDots = data.dots || [];

      // Update UI elements
      els.csvFileNameDisplay.textContent = fileName;
      els.csvRowsBadge.textContent = `${data.totalRows} Rows`;
      els.csvDotsBadge.textContent = `${data.totalDotsFound} Valid USDOTs`;
      els.startScrapeCountText.textContent = String(data.totalDotsFound);

      // Populate column select
      els.csvDetectedColSelect.innerHTML = '';
      (data.headers || []).forEach((h, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = `${h} (Column ${idx + 1})`;
        if (idx === data.dotColumnIndex) opt.selected = true;
        els.csvDetectedColSelect.appendChild(opt);
      });

      // Render Preview Table
      renderCsvPreviewTable(data.headers, data.previewRows, data.dotColumnIndex);

      // Show confirmation card
      els.csvConfirmCard.style.display = 'block';
      els.csvConfirmCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      showToast(`Extracted ${data.totalDotsFound} USDOT numbers from ${fileName}`, 'success');
    } catch (err) {
      showToast('CSV Parsing error: ' + err.message, 'error');
    }
  }

  function renderCsvPreviewTable(headers, rows, dotIdx) {
    els.csvPreviewThead.innerHTML = `
      <tr>${headers.map((h, i) => `<th>${escapeHtml(h)} ${i === dotIdx ? '★' : ''}</th>`).join('')}</tr>
    `;

    els.csvPreviewTbody.innerHTML = '';
    (rows || []).slice(0, 5).forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = row.map((cell, i) => {
        return `<td ${i === dotIdx ? 'style="font-family:var(--font-mono);font-weight:700;color:var(--emerald);"' : ''}>${escapeHtml(cell)}</td>`;
      }).join('');
      els.csvPreviewTbody.appendChild(tr);
    });
  }

  els.changeCsvFileBtn.addEventListener('click', () => {
    els.csvConfirmCard.style.display = 'none';
    els.mainCsvFileInput.value = '';
  });

  // START SCRAPING UPLOADED CSV
  els.startCsvScrapingBtn.addEventListener('click', async () => {
    if (!state.csvDots || state.csvDots.length === 0) {
      showToast('No valid USDOT numbers detected in this CSV.', 'error');
      return;
    }

    const concurrency = Number(els.csvConcurrencyKnob.value);
    const delayMs = Number(els.csvDelayKnob.value);

    try {
      els.startCsvScrapingBtn.disabled = true;
      els.startCsvScrapingBtn.innerHTML = `<span>⏳ Initializing Worker Pool...</span>`;

      // Clear previous live scraped table for fresh view
      state.csvLiveCarriers = [];
      els.csvScrapedTableBody.innerHTML = `
        <tr><td colspan="10" class="table-empty">
          <div style="padding: 24px;text-align:center;">
            <div class="spinner" style="width:32px;height:32px;margin: 0 auto 12px;"></div>
            <h4 style="color:#fff;margin-bottom:4px;">Scraping in Progress...</h4>
            <p style="color:var(--text-muted);font-size:0.85rem;">Carriers will populate below in real time as each USDOT is parsed.</p>
          </div>
        </td></tr>
      `;

      const res = await fetch('/api/scrape/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'list',
          dots: state.csvDots,
          concurrency,
          delayMs,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start scrape');

      showToast(`Scraping started for ${state.csvDots.length} carriers!`, 'success');

      // Scroll to live results section
      els.csvLiveResultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      els.csvScrapeProgressBanner.style.display = 'block';
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      els.startCsvScrapingBtn.disabled = false;
      els.startCsvScrapingBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        <span>🚀 Start Scraping This CSV (${state.csvDots.length} Carriers)</span>
      `;
    }
  });

  // Render Live Scraped Table
  function renderCsvScrapedTable() {
    let list = [...state.csvLiveCarriers];

    if (state.csvFilterTerm) {
      const q = state.csvFilterTerm.toLowerCase();
      list = list.filter(c =>
        c.dotNumber?.toLowerCase().includes(q) ||
        c.legalName?.toLowerCase().includes(q) ||
        c.dbaName?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.state?.toLowerCase().includes(q)
      );
    }

    if (state.csvFilterState) {
      list = list.filter(c => c.state === state.csvFilterState);
    }

    if (list.length === 0) {
      els.csvScrapedTableBody.innerHTML = `
        <tr><td colspan="10" class="table-empty">No carriers match current filter.</td></tr>
      `;
      return;
    }

    els.csvScrapedTableBody.innerHTML = '';
    list.forEach((c, idx) => {
      const tr = document.createElement('tr');
      if (idx === 0) tr.className = 'new-row-pulse';
      tr.style.cursor = 'pointer';

      const dotStatusBadge = c.dotStatus === 'Active'
        ? `<span class="badge badge-emerald">Active</span>`
        : `<span class="badge badge-rose">${escapeHtml(c.dotStatus || 'Inactive')}</span>`;

      const mcStatusBadge = c.mcStatus && c.mcStatus !== 'N/A'
        ? (c.mcStatus === 'Active' ? `<span class="badge badge-emerald">Active</span>` : `<span class="badge badge-amber">${escapeHtml(c.mcStatus)}</span>`)
        : `<span class="badge badge-outline">N/A</span>`;

      const locationStr = [c.city, c.state].filter(Boolean).join(', ') || c.physicalAddress || '—';
      const officerStr = c.officerName ? `${c.officerName}${c.officerTitle ? ' (' + c.officerTitle + ')' : ''}` : '—';

      tr.innerHTML = `
        <td><span class="table-dot-badge">${escapeHtml(c.dotNumber)}</span></td>
        <td>
          <strong class="table-carrier-name">${escapeHtml(c.legalName || 'N/A')}</strong>
          ${c.dbaName ? `<div style="font-size:0.75rem;color:var(--cyan);">DBA: ${escapeHtml(c.dbaName)}</div>` : ''}
        </td>
        <td>${dotStatusBadge}</td>
        <td><strong style="font-family:var(--font-mono);font-size:0.8rem;color:#cbd5e1;">${escapeHtml(c.mcNumber || '—')}</strong></td>
        <td>${mcStatusBadge}</td>
        <td>${escapeHtml(locationStr)}</td>
        <td>${escapeHtml(c.phone || '—')}</td>
        <td><span style="font-size:0.78rem;color:var(--text-muted);word-break:break-all;">${escapeHtml(c.email || '—')}</span></td>
        <td><span style="font-size:0.78rem;">${escapeHtml(officerStr)}</span></td>
        <td><span style="font-family:var(--font-mono);font-size:0.8rem;">${escapeHtml(c.powerUnits || '—')}</span></td>
        <td>
          <button class="btn btn-secondary btn-xs view-csv-carrier-btn" data-dot="${escapeHtml(c.dotNumber)}">Details</button>
        </td>
      `;

      tr.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') openCarrierModal(c);
      });
      tr.querySelector('.view-csv-carrier-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openCarrierModal(c);
      });

      els.csvScrapedTableBody.appendChild(tr);
    });
  }

  els.csvTableFilterInput.addEventListener('input', debounce((e) => {
    state.csvFilterTerm = e.target.value.trim();
    renderCsvScrapedTable();
  }, 200));

  els.csvTableStateSelect.addEventListener('change', (e) => {
    state.csvFilterState = e.target.value;
    renderCsvScrapedTable();
  });

  // =========================================================================
  // TAB 1: LIVE INSPECTOR & REAL DATA TEST
  // =========================================================================
  async function performInspect(dotQuery) {
    const query = String(dotQuery).trim();
    if (!query) return;

    els.inspectorInput.value = query;
    els.inspectorSearchBtn.disabled = true;
    const btnText = els.inspectorSearchBtn.querySelector('.btn-text');
    const spinner = els.inspectorSearchBtn.querySelector('.spinner');
    btnText.textContent = 'Querying MOTUS API...';
    spinner.style.display = 'inline-block';

    els.inspectorCarrierContent.innerHTML = `
      <div class="empty-state-placeholder">
        <div class="spinner" style="width:32px;height:32px;margin-bottom:14px;"></div>
        <h3>Fetching Live DOT Data</h3>
        <p>Connecting to official MOTUS database for query <strong>${escapeHtml(query)}</strong>...</p>
      </div>
    `;

    const start = performance.now();

    try {
      const res = await fetch(`/api/lookup?dot=${encodeURIComponent(query)}`);
      const latency = Math.round(performance.now() - start);
      els.inspectorTimingBadge.textContent = `⚡ ${latency} ms`;

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const result = await res.json();
      els.inspectorHttpStatus.textContent = `${result.status} ${result.ok ? 'OK' : 'ERR'}`;
      els.inspectorHttpStatus.className = result.ok ? 'badge badge-emerald' : 'badge badge-rose';

      els.rawJsonViewer.textContent = JSON.stringify(result.raw, null, 2);

      if (result.carrier) {
        state.activeCarrier = result.carrier;
        renderCarrierCard(result.carrier);
        els.inspectorCarrierActions.style.display = 'flex';

        const fullAddr = `${result.carrier.physicalAddress}, ${result.carrier.city}, ${result.carrier.state} ${result.carrier.zip}`;
        els.inspectorMapsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`;

        showToast(`Carrier found: ${result.carrier.legalName}`, 'success');
      } else {
        state.activeCarrier = null;
        els.inspectorCarrierActions.style.display = 'none';
        els.inspectorCarrierContent.innerHTML = `
          <div class="empty-state-placeholder">
            <div class="empty-icon">⚠️</div>
            <h3>No Active Carrier Found</h3>
            <p>USDOT <strong>${escapeHtml(query)}</strong> returned no matching records in MOTUS registry.</p>
          </div>
        `;
        showToast(`DOT ${query} returned no records`, 'info');
      }
    } catch (err) {
      els.inspectorCarrierContent.innerHTML = `
        <div class="empty-state-placeholder">
          <div class="empty-icon">❌</div>
          <h3>Inspection Failed</h3>
          <p>${escapeHtml(err.message || 'Network error')}</p>
        </div>
      `;
      els.rawJsonViewer.textContent = `// Error:\n${err.message}`;
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      els.inspectorSearchBtn.disabled = false;
      btnText.textContent = 'Inspect Live DOT';
      spinner.style.display = 'none';
    }
  }

  function renderCarrierCard(carrier) {
    const fullStreet = carrier.physicalAddress || 'None listed';
    const cityStateZip = [carrier.city, carrier.state, carrier.zip].filter(Boolean).join(', ') || '—';
    const mailingAddr = carrier.mailingAddress || 'Same as physical / None listed';

    const dotBadge = carrier.dotStatus === 'Active'
      ? `<span class="badge badge-emerald" title="Top Status from DOT Registry">DOT: ACTIVE</span>`
      : `<span class="badge badge-rose" title="Top Status from DOT Registry">DOT: ${escapeHtml((carrier.dotStatus || 'INACTIVE').toUpperCase())}</span>`;

    const mcBadge = carrier.mcStatus && carrier.mcStatus !== 'N/A'
      ? (carrier.mcStatus === 'Active'
          ? `<span class="badge badge-emerald" title="Bottom Status from Operating Authority">MC: ACTIVE</span>`
          : `<span class="badge badge-amber" title="Bottom Status from Operating Authority">MC: ${escapeHtml(carrier.mcStatus.toUpperCase())}</span>`)
      : `<span class="badge badge-outline" title="Operating Authority Status">MC: N/A</span>`;

    els.inspectorCarrierContent.innerHTML = `
      <div class="carrier-hero-header">
        <div class="carrier-title-row">
          <div>
            <h3 class="carrier-legal-name">${escapeHtml(carrier.legalName || 'Unknown Entity')}</h3>
            ${carrier.dbaName ? `<div class="carrier-dba-name">DBA: ${escapeHtml(carrier.dbaName)}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
            <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
              ${dotBadge}
              ${mcBadge}
            </div>
            ${carrier.outOfService === 'YES' ? `<span class="badge badge-rose" style="font-size:0.68rem;">OUT OF SERVICE</span>` : ''}
          </div>
        </div>

        <div class="carrier-pills-row">
          <div class="info-pill"><strong>USDOT:</strong> ${escapeHtml(carrier.dotNumber)}</div>
          <div class="info-pill"><strong>MC / Docket:</strong> ${escapeHtml(carrier.mcNumber || 'N/A')}</div>
          ${carrier.entityType ? `<div class="info-pill"><strong>Entity Type:</strong> ${escapeHtml(carrier.entityType)}</div>` : ''}
          ${carrier.operatingAuthorityType ? `<div class="info-pill"><strong>Authority:</strong> ${escapeHtml(carrier.operatingAuthorityType)}</div>` : ''}
          ${carrier.businessType ? `<div class="info-pill"><strong>Business:</strong> ${escapeHtml(carrier.businessType)}</div>` : ''}
        </div>
      </div>

      <div class="carrier-sections-grid">
        <div class="carrier-info-box">
          <h4>👤 Officer & Executive Leadership</h4>
          <div class="carrier-stats-list">
            <div class="stat-item">
              <span class="stat-item-label">Officer Name:</span>
              <span class="stat-item-val">${escapeHtml(carrier.officerName || 'None listed')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Title / Role:</span>
              <span class="stat-item-val">${escapeHtml(carrier.officerTitle || 'None listed')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Direct Phone:</span>
              <span class="stat-item-val">${escapeHtml(carrier.officerPhone || carrier.phone || 'None listed')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Direct Email:</span>
              <span class="stat-item-val">${escapeHtml(carrier.officerEmail || carrier.email || 'None listed')}</span>
            </div>
          </div>
        </div>

        <div class="carrier-info-box">
          <h4>📞 General Contact & Authority</h4>
          <div class="carrier-stats-list">
            <div class="stat-item">
              <span class="stat-item-label">Primary Phone:</span>
              <span class="stat-item-val">${escapeHtml(carrier.phone || 'None listed')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Primary Email:</span>
              <span class="stat-item-val">${escapeHtml(carrier.email || 'None listed')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Auth Status:</span>
              <span class="stat-item-val">${escapeHtml(carrier.mcStatus || 'N/A')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Out of Service:</span>
              <span class="stat-item-val" style="color:${carrier.outOfService === 'YES' ? 'var(--rose)' : 'var(--emerald)'}">${escapeHtml(carrier.outOfService || 'NO')}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="carrier-sections-grid">
        <div class="carrier-info-box">
          <h4>📍 Physical & Mailing Addresses</h4>
          <p class="carrier-address-text" style="margin-bottom:8px;">
            <span style="font-size:0.74rem;color:var(--text-muted);text-transform:uppercase;font-weight:600;">Physical Address:</span><br>
            <strong>${escapeHtml(fullStreet)}</strong><br>
            ${escapeHtml(cityStateZip)}
          </p>
          <p class="carrier-address-text" style="border-top:1px dashed rgba(255,255,255,0.06);padding-top:6px;">
            <span style="font-size:0.74rem;color:var(--text-muted);text-transform:uppercase;font-weight:600;">Mailing Address:</span><br>
            ${escapeHtml(mailingAddr)}
          </p>
        </div>

        <div class="carrier-info-box">
          <h4>🚛 Fleet, Drivers & MCS-150 Profile</h4>
          <div class="carrier-stats-list">
            <div class="stat-item">
              <span class="stat-item-label">Power Units:</span>
              <span class="stat-item-val">${escapeHtml(carrier.powerUnits || 'N/A')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Total Drivers:</span>
              <span class="stat-item-val">${escapeHtml(carrier.drivers || 'N/A')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">MCS-150 Date:</span>
              <span class="stat-item-val">${escapeHtml(carrier.mcs150Date || 'N/A')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">MCS-150 Mileage:</span>
              <span class="stat-item-val">${escapeHtml(carrier.mcs150Mileage || 'N/A')}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  els.inspectorForm.addEventListener('submit', (e) => {
    e.preventDefault();
    performInspect(els.inspectorInput.value);
  });

  els.clearInspectorInputBtn.addEventListener('click', () => {
    els.inspectorInput.value = '';
    els.inspectorInput.focus();
  });

  els.chipBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const dot = btn.dataset.dot;
      performInspect(dot);
    });
  });

  els.copyRawJsonBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(els.rawJsonViewer.textContent);
    showToast('Raw JSON copied to clipboard!', 'success');
  });

  els.saveCurrentCarrierBtn.addEventListener('click', async () => {
    if (!state.activeCarrier) return;
    try {
      const res = await fetch('/api/carriers/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.activeCarrier),
      });
      const data = await res.json();
      if (data.saved) {
        showToast(`Carrier ${state.activeCarrier.dotNumber} saved to carriers.csv!`, 'success');
        fetchOverallStatus();
      } else {
        showToast(`Carrier ${state.activeCarrier.dotNumber} already exists in database.`, 'info');
      }
    } catch (e) {
      showToast('Error saving carrier: ' + e.message, 'error');
    }
  });

  // Multi Probe
  els.multiProbeBtn.addEventListener('click', async () => {
    const raw = els.multiProbeInput.value;
    const dots = raw.split(/[\s,]+/).map(d => d.trim()).filter(Boolean);
    if (dots.length === 0) return;

    els.multiProbeBtn.disabled = true;
    els.multiProbeBtn.textContent = 'Probing...';
    els.multiProbeResults.innerHTML = '<div style="color:var(--text-muted);padding:10px;">Probing live endpoints...</div>';

    try {
      const res = await fetch('/api/lookup/multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dots }),
      });
      const data = await res.json();
      els.multiProbeResults.innerHTML = '';

      (data.results || []).forEach(item => {
        const div = document.createElement('div');
        div.className = `probe-mini-card ${item.carrier ? 'found' : ''}`;
        if (item.carrier) {
          const dotBadge = item.carrier.dotStatus === 'Active'
            ? `<span class="badge badge-emerald" style="font-size:0.65rem;">DOT: Active</span>`
            : `<span class="badge badge-rose" style="font-size:0.65rem;">DOT: ${escapeHtml(item.carrier.dotStatus || 'Inactive')}</span>`;

          const mcBadge = item.carrier.mcStatus && item.carrier.mcStatus !== 'N/A'
            ? (item.carrier.mcStatus === 'Active'
                ? `<span class="badge badge-emerald" style="font-size:0.65rem;">MC: Active</span>`
                : `<span class="badge badge-amber" style="font-size:0.65rem;">MC: ${escapeHtml(item.carrier.mcStatus)}</span>`)
            : '';

          div.innerHTML = `
            <div class="probe-mini-header">
              <span class="probe-mini-dot">USDOT #${escapeHtml(item.carrier.dotNumber)}</span>
              <div style="display:flex;gap:4px;">
                ${dotBadge}
                ${mcBadge}
              </div>
            </div>
            <div class="probe-mini-name">${escapeHtml(item.carrier.legalName)}</div>
            <div class="probe-mini-loc">${escapeHtml(item.carrier.city)}, ${escapeHtml(item.carrier.state)} ${item.carrier.mcNumber ? '• MC: ' + escapeHtml(item.carrier.mcNumber) : ''}</div>
          `;
          div.style.cursor = 'pointer';
          div.title = 'Click to view full inspection profile';
          div.addEventListener('click', () => {
            renderCarrierCard(item.carrier);
            state.activeCarrier = item.carrier;
            els.rawJsonViewer.textContent = JSON.stringify(item.raw, null, 2);
            els.inspectorCarrierActions.style.display = 'flex';
          });
        } else {
          div.innerHTML = `
            <div class="probe-mini-header">
              <span class="probe-mini-dot" style="color:var(--text-dim);">USDOT #${escapeHtml(item.dot || 'N/A')}</span>
              <span class="badge badge-idle">NOT FOUND</span>
            </div>
            <div class="probe-mini-name" style="color:var(--text-dim);font-weight:normal;">No record in registry</div>
          `;
        }
        els.multiProbeResults.appendChild(div);
      });
    } catch (e) {
      els.multiProbeResults.innerHTML = `<div style="color:var(--rose);">Probe failed: ${e.message}</div>`;
    } finally {
      els.multiProbeBtn.disabled = false;
      els.multiProbeBtn.textContent = 'Probe All';
    }
  });

  // =========================================================================
  // TAB 2: RANGE SCRAPER ENGINE
  // =========================================================================
  function updateRangePreview() {
    const start = Number(els.rangeStartInput.value) || 1000000;
    const count = Number(els.rangeCountInput.value) || 100;
    const end = start + count - 1;
    els.rangePreviewText.textContent = `${start.toLocaleString()} → ${end.toLocaleString()}`;
    els.rangePreviewTotal.textContent = count.toLocaleString();
  }

  els.rangeStartInput.addEventListener('input', updateRangePreview);
  els.rangeCountInput.addEventListener('input', updateRangePreview);
  updateRangePreview();

  // Mode toggling
  els.modeRangeBtn.addEventListener('click', () => {
    els.modeRangeBtn.classList.add('active');
    els.modeListBtn.classList.remove('active');
    els.rangeFormSection.style.display = 'block';
    els.listFormSection.style.display = 'none';
  });

  els.modeListBtn.addEventListener('click', () => {
    els.modeListBtn.classList.add('active');
    els.modeRangeBtn.classList.remove('active');
    els.rangeFormSection.style.display = 'none';
    els.listFormSection.style.display = 'block';
  });

  // Sliders
  els.concurrencySlider.addEventListener('input', (e) => {
    els.concurrencyValueDisplay.textContent = `${e.target.value} parallel`;
  });

  els.delaySlider.addEventListener('input', (e) => {
    els.delayValueDisplay.textContent = `${e.target.value} ms`;
  });

  // File Drop (Range Tab)
  els.dropArea.addEventListener('click', () => els.leadFileInput.click());
  els.leadFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      els.customListTextarea.value = ev.target.result;
      showToast(`Loaded ${file.name} successfully`, 'success');
    };
    reader.readAsText(file);
  });

  // Start Scraper (Range Tab)
  els.startScraperBtn.addEventListener('click', async () => {
    const isRange = els.modeRangeBtn.classList.contains('active');
    const concurrency = Number(els.concurrencySlider.value);
    const delayMs = Number(els.delaySlider.value);

    let payload = {};
    if (isRange) {
      payload = {
        type: 'range',
        start: Number(els.rangeStartInput.value),
        count: Number(els.rangeCountInput.value),
        concurrency,
        delayMs,
      };
    } else {
      const text = els.customListTextarea.value;
      const dots = text.split(/[\r\n,]+/).map(d => d.trim()).filter(d => /^\d{3,9}$/.test(d));
      if (dots.length === 0) {
        showToast('Please paste valid DOT numbers first.', 'error');
        return;
      }
      payload = {
        type: 'list',
        dots,
        concurrency,
        delayMs,
      };
    }

    try {
      els.startScraperBtn.disabled = true;
      const res = await fetch('/api/scrape/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start scrape');

      showToast('Scraper started successfully!', 'success');
      updateScraperMetrics(data.status);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      els.startScraperBtn.disabled = false;
    }
  });

  els.pauseScraperBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/scrape/pause', { method: 'POST' });
      const data = await res.json();
      updateScraperMetrics(data.status);
      showToast('Scraper paused.', 'info');
    } catch (e) { showToast(e.message, 'error'); }
  });

  els.resumeScraperBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/scrape/resume', { method: 'POST' });
      const data = await res.json();
      updateScraperMetrics(data.status);
      showToast('Scraper resumed.', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  });

  els.stopScraperBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/scrape/stop', { method: 'POST' });
      const data = await res.json();
      updateScraperMetrics(data.status);
      showToast('Stopping scraper… draining active workers.', 'info');
    } catch (e) { showToast(e.message, 'error'); }
  });

  // =========================================================================
  // TAB 3: CARRIER LEADS CRM TABLE
  // =========================================================================
  async function loadCarriers() {
    try {
      const params = new URLSearchParams({
        page: String(state.crmPage),
        limit: String(state.crmLimit),
      });
      if (state.crmSearch) params.set('search', state.crmSearch);
      if (state.crmState) params.set('state', state.crmState);

      const res = await fetch(`/api/carriers?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();

      els.crmShowingCount.textContent = String(data.carriers.length);
      els.crmTotalCount.textContent = String(data.total);
      els.hudTotalCarriers.textContent = String(data.total);
      els.tabCarriersCountBadge.textContent = String(data.total);

      if (els.crmStateSelect.options.length <= 1 && data.states && data.states.length > 0) {
        data.states.forEach(st => {
          const opt = document.createElement('option');
          opt.value = st;
          opt.textContent = st;
          els.crmStateSelect.appendChild(opt);
        });
      }

      const totalPages = Math.ceil(data.total / state.crmLimit) || 1;
      els.crmCurrentPageText.textContent = `Page ${state.crmPage} of ${totalPages}`;
      els.crmPrevPageBtn.disabled = state.crmPage <= 1;
      els.crmNextPageBtn.disabled = state.crmPage >= totalPages;

      if (data.carriers.length === 0) {
        els.crmTableBody.innerHTML = `
          <tr><td colspan="10" class="table-empty">No carriers found matching criteria. Upload a CSV or run a scrape above!</td></tr>
        `;
        return;
      }

      els.crmTableBody.innerHTML = '';
      data.carriers.forEach(c => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';

        const dotStatusBadge = c.dotStatus === 'Active'
          ? `<span class="badge badge-emerald">Active</span>`
          : `<span class="badge badge-rose">${escapeHtml(c.dotStatus || 'Inactive')}</span>`;

        const mcStatusBadge = c.mcStatus && c.mcStatus !== 'N/A'
          ? (c.mcStatus === 'Active' ? `<span class="badge badge-emerald">Active</span>` : `<span class="badge badge-amber">${escapeHtml(c.mcStatus)}</span>`)
          : `<span class="badge badge-outline">N/A</span>`;

        const locationStr = [c.city, c.state].filter(Boolean).join(', ') || c.physicalAddress || '—';
        const officerStr = c.officerName ? `${c.officerName}${c.officerTitle ? ' (' + c.officerTitle + ')' : ''}` : '—';

        tr.innerHTML = `
          <td><span class="table-dot-badge">${escapeHtml(c.dotNumber)}</span></td>
          <td>
            <strong class="table-carrier-name">${escapeHtml(c.legalName || 'N/A')}</strong>
            ${c.dbaName ? `<div style="font-size:0.75rem;color:var(--cyan);">DBA: ${escapeHtml(c.dbaName)}</div>` : ''}
          </td>
          <td>${dotStatusBadge}</td>
          <td><strong style="font-family:var(--font-mono);font-size:0.8rem;color:#cbd5e1;">${escapeHtml(c.mcNumber || '—')}</strong></td>
          <td>${mcStatusBadge}</td>
          <td>${escapeHtml(locationStr)}</td>
          <td>${escapeHtml(c.phone || '—')}</td>
          <td><span style="font-size:0.78rem;color:var(--text-muted);word-break:break-all;">${escapeHtml(c.email || '—')}</span></td>
          <td><span style="font-size:0.78rem;">${escapeHtml(officerStr)}</span></td>
          <td>
            <button class="btn btn-secondary btn-xs view-carrier-btn" data-dot="${escapeHtml(c.dotNumber)}">View</button>
          </td>
        `;

        tr.addEventListener('click', (e) => {
          if (e.target.tagName !== 'BUTTON') openCarrierModal(c);
        });
        tr.querySelector('.view-carrier-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          openCarrierModal(c);
        });

        els.crmTableBody.appendChild(tr);
      });
    } catch (e) {
      console.error('Failed to load carriers:', e);
    }
  }

  els.crmSearchInput.addEventListener('input', debounce((e) => {
    state.crmSearch = e.target.value.trim();
    state.crmPage = 1;
    loadCarriers();
  }, 300));

  els.crmStateSelect.addEventListener('change', (e) => {
    state.crmState = e.target.value;
    state.crmPage = 1;
    loadCarriers();
  });

  els.refreshCrmBtn.addEventListener('click', () => loadCarriers());

  els.crmPrevPageBtn.addEventListener('click', () => {
    if (state.crmPage > 1) {
      state.crmPage--;
      loadCarriers();
    }
  });

  els.crmNextPageBtn.addEventListener('click', () => {
    state.crmPage++;
    loadCarriers();
  });

  // Modal display
  function openCarrierModal(c) {
    els.modalCarrierName.textContent = c.legalName || `USDOT #${c.dotNumber}`;

    const dotBadge = c.dotStatus === 'Active'
      ? `<span class="badge badge-emerald">DOT: Active</span>`
      : `<span class="badge badge-rose">DOT: ${escapeHtml(c.dotStatus || 'Inactive')}</span>`;

    const mcBadge = c.mcStatus && c.mcStatus !== 'N/A'
      ? (c.mcStatus === 'Active' ? `<span class="badge badge-emerald">MC: Active</span>` : `<span class="badge badge-amber">MC: ${escapeHtml(c.mcStatus)}</span>`)
      : `<span class="badge badge-outline">MC: N/A</span>`;

    const fullStreet = c.physicalAddress || 'None listed';
    const cityStateZip = [c.city, c.state, c.zip].filter(Boolean).join(', ') || '—';
    const mailingAddr = c.mailingAddress || 'Same as physical / None listed';

    els.modalCarrierBody.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(10,15,29,0.7);padding:12px 16px;border-radius:var(--radius-md);border:1px solid var(--bg-card-border);margin-bottom:16px;">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <div class="info-pill"><strong>USDOT:</strong> ${escapeHtml(c.dotNumber)}</div>
          <div class="info-pill"><strong>MC / Docket:</strong> ${escapeHtml(c.mcNumber || 'None')}</div>
          ${c.dbaName ? `<span style="font-size:0.85rem;color:var(--cyan);">DBA: ${escapeHtml(c.dbaName)}</span>` : ''}
        </div>
        <div style="display:flex;gap:8px;">
          ${dotBadge}
          ${mcBadge}
          ${c.outOfService === 'YES' ? `<span class="badge badge-rose">OUT OF SERVICE</span>` : ''}
        </div>
      </div>

      <div class="carrier-sections-grid">
        <div class="carrier-info-box">
          <h4>👤 Officer & Management</h4>
          <div class="carrier-stats-list">
            <div class="stat-item">
              <span class="stat-item-label">Officer Name:</span>
              <span class="stat-item-val">${escapeHtml(c.officerName || 'None listed')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Title / Role:</span>
              <span class="stat-item-val">${escapeHtml(c.officerTitle || 'None listed')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Direct Phone:</span>
              <span class="stat-item-val">${escapeHtml(c.officerPhone || c.phone || 'None listed')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Direct Email:</span>
              <span class="stat-item-val">${escapeHtml(c.officerEmail || c.email || 'None listed')}</span>
            </div>
          </div>
        </div>

        <div class="carrier-info-box">
          <h4>🏢 Entity & Authority</h4>
          <div class="carrier-stats-list">
            <div class="stat-item">
              <span class="stat-item-label">Entity Type:</span>
              <span class="stat-item-val">${escapeHtml(c.entityType || 'N/A')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Operating Authority:</span>
              <span class="stat-item-val">${escapeHtml(c.operatingAuthorityType || 'N/A')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Business Type:</span>
              <span class="stat-item-val">${escapeHtml(c.businessType || 'N/A')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Out of Service:</span>
              <span class="stat-item-val" style="color:${c.outOfService === 'YES' ? 'var(--rose)' : 'var(--emerald)'}">${escapeHtml(c.outOfService || 'NO')}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="carrier-sections-grid" style="margin-top:14px;">
        <div class="carrier-info-box">
          <h4>📍 Address Details</h4>
          <p class="carrier-address-text" style="margin-bottom:8px;">
            <span style="font-size:0.74rem;color:var(--text-muted);text-transform:uppercase;font-weight:600;">Physical Address:</span><br>
            <strong>${escapeHtml(fullStreet)}</strong><br>
            ${escapeHtml(cityStateZip)}
          </p>
          <p class="carrier-address-text" style="border-top:1px dashed rgba(255,255,255,0.06);padding-top:6px;">
            <span style="font-size:0.74rem;color:var(--text-muted);text-transform:uppercase;font-weight:600;">Mailing Address:</span><br>
            ${escapeHtml(mailingAddr)}
          </p>
        </div>

        <div class="carrier-info-box">
          <h4>🚛 Fleet, Drivers & Safety</h4>
          <div class="carrier-stats-list">
            <div class="stat-item">
              <span class="stat-item-label">Power Units (Fleet):</span>
              <span class="stat-item-val">${escapeHtml(c.powerUnits || 'N/A')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">Total Drivers:</span>
              <span class="stat-item-val">${escapeHtml(c.drivers || 'N/A')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">MCS-150 Date:</span>
              <span class="stat-item-val">${escapeHtml(c.mcs150Date || 'N/A')}</span>
            </div>
            <div class="stat-item">
              <span class="stat-item-label">MCS-150 Mileage:</span>
              <span class="stat-item-val">${escapeHtml(c.mcs150Mileage || 'N/A')}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    els.carrierModal.style.display = 'flex';
  }

  els.closeModalBtn.addEventListener('click', () => { els.carrierModal.style.display = 'none'; });
  els.closeModalFooterBtn.addEventListener('click', () => { els.carrierModal.style.display = 'none'; });
  els.carrierModal.addEventListener('click', (e) => {
    if (e.target === els.carrierModal) els.carrierModal.style.display = 'none';
  });

  // =========================================================================
  // TAB 4: API & CONFIG STUDIO
  // =========================================================================
  async function loadConfig() {
    try {
      const res = await fetch('/api/config');
      if (!res.ok) return;
      const cfg = await res.json();
      els.cfgBaseUrl.value = cfg.baseUrl || 'https://motus.dot.gov';
      els.cfgPath.value = cfg.endpoint?.path || '/api/carriers/search';
      els.cfgMethod.value = cfg.endpoint?.method || 'GET';
      els.cfgQueryParam.value = cfg.endpoint?.queryParam || 'query';
      els.cfgConcurrency.value = cfg.concurrency || 8;
      els.cfgUserAgent.value = cfg.staticHeaders?.['user-agent'] || '';
      els.connTargetUrl.textContent = `${cfg.baseUrl}${cfg.endpoint?.path || ''}`;
    } catch (e) {
      console.error('Config fetch failed:', e);
    }
  }

  els.configForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      baseUrl: els.cfgBaseUrl.value.trim(),
      endpoint: {
        path: els.cfgPath.value.trim(),
        method: els.cfgMethod.value,
        queryParam: els.cfgQueryParam.value.trim(),
      },
      concurrency: Number(els.cfgConcurrency.value),
      staticHeaders: {
        'user-agent': els.cfgUserAgent.value.trim(),
      },
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      showToast('Configuration updated successfully!', 'success');
      loadConfig();
    } catch (err) {
      showToast('Failed to save config: ' + err.message, 'error');
    }
  });

  els.resetConfigBtn.addEventListener('click', async () => {
    if (!confirm('Reset configuration to default verified MOTUS endpoint?')) return;
    try {
      await fetch('/api/config/reset', { method: 'POST' });
      showToast('Configuration reset to defaults!', 'success');
      loadConfig();
    } catch (err) {
      showToast('Reset failed: ' + err.message, 'error');
    }
  });

  els.testConnectionBtn.addEventListener('click', async () => {
    els.testConnectionBtn.disabled = true;
    els.connProbeStatus.textContent = 'Probing...';
    els.connProbeStatus.className = 'badge badge-amber';
    els.connProbeOutput.textContent = '// Sending probe request to DOT API...';

    const start = performance.now();
    try {
      const res = await fetch('/api/lookup?dot=3000000');
      const latency = Math.round(performance.now() - start);
      const data = await res.json();

      els.connProbeLatency.textContent = `${latency} ms`;
      if (res.ok && data.ok) {
        els.connProbeStatus.textContent = 'Connected (200 OK)';
        els.connProbeStatus.className = 'badge badge-emerald';
        els.connProbeOutput.textContent = `// Connectivity Verified!\nHTTP Status: ${data.status}\nDuration: ${latency}ms\nSample Carrier Parsed: ${data.carrier?.legalName || 'Verified'}\n\nRaw Header Preview:\n${JSON.stringify(data.raw, null, 2).slice(0, 500)}...`;
        showToast('API Connection verified!', 'success');
      } else {
        els.connProbeStatus.textContent = `HTTP ${data.status}`;
        els.connProbeStatus.className = 'badge badge-rose';
        els.connProbeOutput.textContent = JSON.stringify(data, null, 2);
      }
    } catch (err) {
      els.connProbeStatus.textContent = 'Failed';
      els.connProbeStatus.className = 'badge badge-rose';
      els.connProbeOutput.textContent = `// Connectivity Error:\n${err.message}`;
    } finally {
      els.testConnectionBtn.disabled = false;
    }
  });

  // =========================================================================
  // TAB 5: FAILED & RESUMPTION MANAGER
  // =========================================================================
  async function loadFailedState() {
    try {
      const res = await fetch('/api/failed');
      const data = await res.json();
      const count = data.count || 0;
      els.failedListBadge.textContent = `${count} Failed`;
      els.tabFailedCountBadge.textContent = String(count);

      if (count === 0) {
        els.failedListContainer.innerHTML = '<p class="text-muted">No failed DOT numbers recorded. All requests succeeded!</p>';
        els.retryAllFailedBtn.disabled = true;
      } else {
        els.retryAllFailedBtn.disabled = false;
        els.failedListContainer.innerHTML = '';
        data.failed.slice(0, 100).forEach(dot => {
          const pill = document.createElement('span');
          pill.className = 'failed-dot-pill';
          pill.textContent = `DOT #${dot}`;
          els.failedListContainer.appendChild(pill);
        });
      }

      const statusRes = await fetch('/api/status');
      const statusData = await statusRes.json();
      els.doneCountStateDisplay.textContent = `${(statusData.doneCount || 0).toLocaleString()} DOTs`;
    } catch (e) {
      console.error('Failed to load state:', e);
    }
  }

  els.retryAllFailedBtn.addEventListener('click', async () => {
    try {
      els.retryAllFailedBtn.disabled = true;
      const res = await fetch('/api/failed/retry', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Retrying ${data.retriedCount} failed DOTs in background!`, 'success');
      switchTab('tab-upload-csv');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      els.retryAllFailedBtn.disabled = false;
    }
  });

  els.clearAllDataBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to completely reset all carriers, done history, and failed records? This cannot be undone.')) return;
    try {
      await fetch('/api/data/reset', { method: 'POST' });
      showToast('All data and history reset!', 'success');
      state.csvLiveCarriers = [];
      renderCsvScrapedTable();
      fetchOverallStatus();
      loadCarriers();
      loadFailedState();
    } catch (e) {
      showToast(e.message, 'error');
    }
  });

  // =========================================================================
  // UTILS
  // =========================================================================
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  initSSE();
  fetchOverallStatus();
});
