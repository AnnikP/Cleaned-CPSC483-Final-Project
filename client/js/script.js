// ── Config ────────────────────────────────────────────────────────────────
  const API_URL = 'http://127.0.0.1:8000/api/predict';
 
  // ── Progress tracking ────────────────────────────────────────────────────
  const segs = document.querySelectorAll('.progress-seg');
 
  function updateProgress() {
    document.querySelectorAll('[data-section]').forEach((sec, i) => {
      const radios = {};
      let filled = 0;
      sec.querySelectorAll('input, select').forEach(el => {
        if (el.type === 'radio')   { radios[el.name] = radios[el.name] || el.checked; }
        else if (el.type === 'number') { if (el.value !== '') filled++; }
        else if (el.tagName === 'SELECT') { if (el.value !== '') filled++; }
      });
      Object.values(radios).forEach(v => { if (v) filled++; });
      segs[i].classList.toggle('filled', filled > 0);
    });
  }
 
  document.getElementById('assessmentForm').addEventListener('input',  updateProgress);
  document.getElementById('assessmentForm').addEventListener('change', updateProgress);
 
  // ── Reset ─────────────────────────────────────────────────────────────────
  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('assessmentForm').reset();
    document.getElementById('result-card').style.display  = 'none';
    document.getElementById('error-banner').style.display = 'none';
    segs.forEach(s => s.classList.remove('filled'));
  });
 
  // ── Submit ────────────────────────────────────────────────────────────────
  document.getElementById('assessmentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
 
    const btn = document.getElementById('submitBtn');
    document.getElementById('result-card').style.display  = 'none';
    document.getElementById('error-banner').style.display = 'none';
 
    btn.innerHTML = '<div class="spinner"></div> Analyzing...';
    btn.disabled = true;
 
    // ── Collect form values ──────────────────────────────────────────────
    const fd   = new FormData(this);
    const data = {};
 
    for (const [k, v] of fd.entries()) {
      data[k] = parseFloat(v);
    }
 
    // Unchecked checkboxes are absent from FormData — default them to 0
    ['MemoryComplaints','BehavioralProblems','Confusion','Disorientation',
     'PersonalityChanges','DifficultyCompletingTasks','Forgetfulness'].forEach(f => {
      if (!(f in data)) data[f] = 0;
    });
 
    // ── POST to FastAPI ──────────────────────────────────────────────────
    try {
      const res = await fetch(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data)
      });
 
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server returned ${res.status}`);
      }
 
      const { prediction, probability } = await res.json();
 
      showResult({ atRisk: prediction === 1, probability, inputData: data });
 
    } catch (err) {
      document.getElementById('error-text').textContent =
        err.message.includes('Failed to fetch')
          ? 'Cannot reach the server. Make sure uvicorn is running on port 8000.'
          : `Error: ${err.message}`;
      document.getElementById('error-banner').style.display = 'flex';
      console.error('[NeuroAssess]', err);
 
    } finally {
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        Run Assessment`;
      btn.disabled = false;
      document.getElementById('result-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
 
  // ── Render result ─────────────────────────────────────────────────────────
  function showResult({ atRisk, probability, inputData: d }) {
    const card  = document.getElementById('result-card');
    card.className = atRisk ? 'at-risk' : 'low-risk';
    card.style.display = 'block';
 
    const pct = (probability * 100).toFixed(1);
    document.getElementById('resultLabel').textContent = atRisk
      ? `Elevated Risk Detected — ${pct}% Probability`
      : `Low Risk Indicated — ${pct}% Probability`;
 
    document.getElementById('resultDesc').textContent = atRisk
      ? "The model indicates this patient has a heightened probability of Alzheimer's disease based on the provided clinical data. Further neurological evaluation is recommended."
      : "Based on the provided clinical data, the model does not currently indicate a high likelihood of Alzheimer's disease. Routine monitoring is advised.";
 
    const iconColor = atRisk ? 'var(--danger)' : 'var(--safe)';
    document.getElementById('resultIcon').innerHTML = atRisk
      ? `<svg viewBox="0 0 24 24" width="22" height="22" stroke="${iconColor}" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
      : `<svg viewBox="0 0 24 24" width="22" height="22" stroke="${iconColor}" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
 
    // Contributing risk flags from input values
    const flags = [];
    if (d.Age > 75)                    flags.push('Age > 75');
    if (d.FamilyHistoryAlzheimers)     flags.push('Family History');
    if (d.MMSE < 20)                   flags.push('Low MMSE');
    if (d.FunctionalAssessment < 5)    flags.push('Functional Decline');
    if (d.ADL < 4)                     flags.push('Low ADL');
    if (d.Confusion)                   flags.push('Confusion');
    if (d.MemoryComplaints)            flags.push('Memory Complaints');
    if (d.Disorientation)              flags.push('Disorientation');
    if (d.Depression)                  flags.push('Depression');
    if (d.CardiovascularDisease)       flags.push('Cardiovascular Disease');
    if (d.Diabetes)                    flags.push('Diabetes');
    if (d.Hypertension)                flags.push('Hypertension');
 
    document.getElementById('resultFactors').innerHTML =
      flags.map(f => `<span class="factor-tag">${f}</span>`).join('');
  }