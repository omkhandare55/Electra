/**
 * @fileoverview Electra AI Frontend Application
 * Handles tab navigation, form submissions, API calls, and result rendering.
 */

'use strict';

/* ═══ Utility Functions ═══ */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function show(el) { el?.classList.remove('hidden'); }
function hide(el) { el?.classList.add('hidden'); }

/** Animate a number from 0 to target */
function animateValue(el, target, duration = 800) {
  const start = 0;
  const startTime = performance.now();
  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased);
    el.textContent = current;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/** Set SVG ring progress (circle circumference = 2 * PI * 42 ≈ 264) */
function setRingProgress(fillEl, value) {
  const circumference = 2 * Math.PI * 42;
  const dashLen = (value / 100) * circumference;
  fillEl.style.strokeDasharray = `${dashLen} ${circumference}`;
}

/** Set bar width with animation */
function setBarWidth(barEl, value, max = 100) {
  setTimeout(() => { barEl.style.width = `${(value / max) * 100}%`; }, 100);
}

/** Safely make API calls */
async function apiCall(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || err.details?.join(', ') || 'Request failed');
  }
  return res.json();
}

/* ═══ Tab Navigation ═══ */
function initTabs() {
  const navLinks = $$('.nav-link');
  const panels = $$('.tab-panel');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const tab = link.dataset.tab;
      navLinks.forEach(l => { l.classList.remove('active'); l.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => p.classList.remove('active'));
      link.classList.add('active');
      link.setAttribute('aria-selected', 'true');
      $(`#panel-${tab}`)?.classList.add('active');
    });

    link.addEventListener('keydown', (e) => {
      const links = Array.from(navLinks);
      const idx = links.indexOf(e.target);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const next = e.key === 'ArrowRight' ? (idx + 1) % links.length : (idx - 1 + links.length) % links.length;
        links[next].focus();
        links[next].click();
      }
    });
  });
}

/* ═══ Gemini Status Check ═══ */
async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    const dot = $('#gemini-status');
    const label = $('#gemini-label');
    if (data.gemini) {
      dot.classList.remove('offline');
      label.textContent = 'Gemini AI';
    } else {
      dot.classList.add('offline');
      label.textContent = 'Fallback Mode';
    }
  } catch { /* silent */ }
}

/* ═══ Simulator ═══ */
function initSimulator() {
  const form = $('#sim-form');
  const btnSimulate = $('#btn-simulate');
  const btnSmartAdvice = $('#btn-smart-advice');

  let lastSimInput = null;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const promises = Array.from($$('input[name="promises"]:checked')).map(c => c.value);
    if (promises.length === 0) {
      alert('Please select at least one campaign promise.');
      return;
    }

    const input = {
      user_role: 'candidate',
      user_level: $('#user_level').value,
      region_type: $('#region_type').value,
      budget: $('#budget').value,
      campaign_strategy: $('#campaign_strategy').value,
      promises,
      target_audience: $('#target_audience').value,
      opponent_strength: $('#opponent_strength').value,
      incumbency: $('#incumbency').checked,
      coalition: $('#coalition').checked
    };

    lastSimInput = input;
    hide($('#empty-state'));
    hide($('#results-content'));
    show($('#loading-state'));
    btnSimulate.disabled = true;
    btnSimulate.textContent = '⏳ Simulating...';

    try {
      const data = await apiCall('/api/simulate', input);
      renderResults(data);
    } catch (err) {
      alert('Simulation failed: ' + err.message);
      show($('#empty-state'));
    } finally {
      hide($('#loading-state'));
      btnSimulate.disabled = false;
      btnSimulate.innerHTML = '<span class="btn-icon" aria-hidden="true">⚡</span> Run Simulation';
    }
  });

  btnSmartAdvice?.addEventListener('click', async () => {
    if (!lastSimInput) return;
    btnSmartAdvice.disabled = true;
    btnSmartAdvice.textContent = '🤖 Getting AI advice...';
    const adviceBox = $('#smart-advice-box');
    hide(adviceBox);

    try {
      const data = await apiCall('/api/smart-advice', lastSimInput);
      $('#advice-content').textContent = data.smart_advice || 'No advice available.';
      $('#advice-badge').textContent = data.gemini_powered ? '✨ Powered by Google Gemini' : '📋 Fallback Analysis';
      show(adviceBox);
    } catch (err) {
      $('#advice-content').textContent = 'Could not get AI advice: ' + err.message;
      show(adviceBox);
    } finally {
      btnSmartAdvice.disabled = false;
      btnSmartAdvice.innerHTML = '<span aria-hidden="true">🤖</span> Get AI Smart Advice';
    }
  });
}

function renderResults(data) {
  const { simulation_result: r, analysis: a } = data;

  // Badge
  const badge = $('#result-badge');
  badge.textContent = r.result;
  badge.className = `result-badge ${r.result.toLowerCase()}`;

  // Score rings
  animateValue($('#val-popularity'), r.popularity_score);
  animateValue($('#val-trust'), r.trust_score);
  animateValue($('#val-reach'), r.reach_score);

  setTimeout(() => {
    setRingProgress($('.popularity-fill'), r.popularity_score);
    setRingProgress($('.trust-fill'), r.trust_score);
    setRingProgress($('.reach-fill'), r.reach_score);
  }, 100);

  // Update ARIA
  $$('.score-ring').forEach((ring, i) => {
    const val = [r.popularity_score, r.trust_score, r.reach_score][i];
    ring.setAttribute('aria-valuenow', val);
  });

  // Metrics
  $('#val-voteshare').textContent = r.vote_share + '%';
  $('#val-winprob').textContent = r.winning_probability + '%';
  setBarWidth($('#bar-voteshare'), r.vote_share, 65);
  setBarWidth($('#bar-winprob'), r.winning_probability);

  // Analysis
  $('#analysis-summary').textContent = a.summary;
  renderList($('#analysis-strengths'), a.strengths);
  renderList($('#analysis-weaknesses'), a.weaknesses);
  renderList($('#analysis-improvements'), a.improvements);

  hide($('#smart-advice-box'));
  show($('#results-content'));
}

function renderList(ul, items) {
  ul.innerHTML = '';
  if (!items || items.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'None identified';
    li.style.color = 'var(--text-muted)';
    ul.appendChild(li);
    return;
  }
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  });
}

/* ═══ Mentor ═══ */
function initMentor() {
  const form = $('#mentor-form');
  const topicChips = $$('.topic-chip');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = $('#mentor-question').value.trim();
    if (!question) return;
    await askMentor(question, $('#mentor-level').value);
  });

  topicChips.forEach(chip => {
    chip.addEventListener('click', async () => {
      const q = chip.dataset.q;
      $('#mentor-question').value = q;
      await askMentor(q, $('#mentor-level').value);
    });
  });
}

async function askMentor(question, level) {
  hide($('#mentor-empty'));
  hide($('#mentor-content'));
  show($('#mentor-loading'));
  $('#btn-mentor').disabled = true;

  try {
    const data = await apiCall('/api/mentor', { question, user_level: level });
    renderMentor(data, level);
  } catch (err) {
    alert('Mentor error: ' + err.message);
    show($('#mentor-empty'));
  } finally {
    hide($('#mentor-loading'));
    $('#btn-mentor').disabled = false;
  }
}

function renderMentor(data, level) {
  const r = data.mentor_response;

  // Level badge
  const badge = $('#mentor-level-badge');
  badge.textContent = level;
  badge.className = `level-badge ${level}`;

  // Topic
  $('#mentor-topic-label').textContent = r.topic ? `📌 ${r.topic.toUpperCase()}` : '';

  // Explanation
  $('#mentor-explanation').textContent = r.explanation || r.response || '';

  // Steps
  const stepsDiv = $('#mentor-steps');
  stepsDiv.innerHTML = '';
  if (r.steps) {
    r.steps.forEach(step => {
      const div = document.createElement('div');
      div.className = 'step';
      div.textContent = step;
      stepsDiv.appendChild(div);
    });
  }

  // Example
  const exDiv = $('#mentor-example');
  if (r.real_world_example) {
    exDiv.innerHTML = `<strong>🌏 Real-world Example:</strong> ${r.real_world_example}`;
    show(exDiv);
  } else {
    hide(exDiv);
  }

  // AI enhancement
  const aiDiv = $('#mentor-ai');
  if (data.ai_insight) {
    $('#mentor-ai-content').textContent = data.ai_insight;
    show(aiDiv);
  } else {
    hide(aiDiv);
  }

  show($('#mentor-content'));
}

/* ═══ Analyzer ═══ */
function initAnalyzer() {
  $('#analyzer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    hide($('#analyzer-empty'));
    hide($('#analyzer-content'));
    show($('#analyzer-loading'));
    $('#btn-analyze').disabled = true;

    try {
      const data = await apiCall('/api/analyze-strategy', {
        region_type: $('#az-region').value,
        campaign_strategy: $('#az-strategy').value,
        target_audience: $('#az-audience').value,
        budget: $('#az-budget').value
      });
      renderAnalyzer(data);
    } catch (err) {
      alert('Analysis error: ' + err.message);
      show($('#analyzer-empty'));
    } finally {
      hide($('#analyzer-loading'));
      $('#btn-analyze').disabled = false;
    }
  });
}

function renderAnalyzer(data) {
  $('#az-eff-value').textContent = data.strategy_effectiveness + '%';
  $('#az-val-region').textContent = data.region_fit + '%';
  $('#az-val-audience').textContent = data.audience_fit + '%';
  setBarWidth($('#az-bar-region'), data.region_fit);
  setBarWidth($('#az-bar-audience'), data.audience_fit);

  const rec = $('#az-recommendation');
  rec.textContent = data.recommendation;
  rec.className = 'az-recommendation';
  if (data.strategy_effectiveness > 70) rec.classList.add('strong');
  else if (data.strategy_effectiveness > 50) rec.classList.add('moderate');
  else rec.classList.add('weak');

  show($('#analyzer-content'));
}

/* ═══ Initialize ═══ */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSimulator();
  initMentor();
  initAnalyzer();
  checkHealth();
});
