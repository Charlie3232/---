// 注意：請將此處替換為您正確部署的 GAS 網址
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbylgai0URjTlQBNvr4lN23XjDYeaHkCJIMxHqiXe5SqTb9cSDGgnWGqYOCJhekUqkgi/exec'; 
let allIssues = [];
let dataConfig = {};
let isMutating = false; 
let userList = []; 
let currentUser = { id: "", name: "", role: "" };
let currentModalType = 'TS';

// 原始：還原防彈選單生成邏輯
function fillFormSelect(id, list) {
  const el = document.getElementById(id);
  if(el && dataConfig[list]) {
    let options = dataConfig[list].map(t => `<option value="${t}">${t}</option>`);
    options.unshift('<option value="" disabled selected>請選擇...</option>');
    el.innerHTML = options.join('');
  }
}

// 修改：增加等待機制的 handleLogin
async function handleLogin() {
  const idInput = document.getElementById('login-user').value.trim();
  const pwdInput = document.getElementById('login-pwd').value.trim();
  if (!idInput || !pwdInput) { alert("請輸入識別碼與密碼"); return; }
  if (userList.length === 0) {
      document.getElementById('login-status').innerText = "伺服器同步中，請稍候...";
      await fetchDataOnLoad();
  }
  const user = userList.find(u => u.id === idInput && u.pwd === pwdInput);
  if (user) {
    currentUser = { id: user.id, name: user.name, role: (user.id === "G0006" ? "MANAGER" : "USER") };
    document.getElementById('current-username-display').innerText = currentUser.name;
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('main-ui').style.display = 'block';
    if (currentUser.role === "MANAGER") {
        document.getElementById('btn-tab-main').style.display = 'block';
        document.getElementById('btn-tab-manager').style.display = 'block';
    }
    initUI();
  } else { 
      alert("識別碼或密碼錯誤"); 
      document.getElementById('login-status').innerText = "驗證失敗，請重試。";
  }
}

async function fetchDataOnLoad() {
  try {
    const resp = await fetch(SCRIPT_URL + '?action=getData');
    const data = await resp.json();
    allIssues = data.issues || [];
    dataConfig = data.config || {};
    userList = data.users || [];
    if(document.getElementById('login-status')) {
        document.getElementById('login-status').innerText = "系統就緒，請登入。";
        document.getElementById('login-status').style.color = "#0f0";
    }
  } catch(e) { console.error("Initial load failed", e); }
}
window.onload = fetchDataOnLoad;

// 原始：init 深度邏輯
function initUI() {
  fillUIConfigs(); 
  renderIssues();
  renderManagerIssues();
  renderStats();
  setInterval(silentSync, 10000); // 原始 10 秒同步頻率
}

async function silentSync() {
  if (isMutating || document.getElementById('main-ui').style.display === 'none') return;
  try {
    const resp = await fetch(SCRIPT_URL + '?action=getData');
    const data = await resp.json();
    if (isMutating) return;
    allIssues = data.issues || [];
    renderIssues();
    renderManagerIssues();
    renderStats();
  } catch(e) {}
}

// 嵌入：動態項目紀錄
function addRecordItem(text = "", checked = false) {
  const container = document.getElementById('records-container');
  const div = document.createElement('div');
  div.className = 'record-item-row';
  div.innerHTML = `
    <input type="checkbox" class="record-chk" ${checked ? 'checked' : ''}>
    <input type="text" class="pixel-input record-txt-input" style="flex:1; border-width:2px; font-size:14px;" value="${text}">
    <button type="button" class="pixel-btn" style="background:#444; padding:5px 10px; border:none; color:#fff;" onclick="this.parentElement.remove()">X</button>
  `;
  container.appendChild(div);
}

// 嵌入：結案自動通知
function handleStatusChange() {
  const status = document.getElementById('input-status').value;
  if (status === "已解決" || status === "Done") {
    const closedDate = prompt("專案完成！請確認實際結案日期 (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    if (closedDate) window.currentClosedDate = closedDate;
  }
}

// 原始：切換 Tab
function switchTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).style.display = 'block';
  document.getElementById('btn-' + tabId).classList.add('active');
  if(tabId === 'tab-main' && currentUser.role === "MANAGER") renderStats();
}

document.addEventListener('click', function(e) {
  if (!e.target.matches('.select-selected')) {
    document.querySelectorAll('.select-items').forEach(el => el.style.display = 'none');
  }
});

function toggleDropdown(id, event) {
  event.stopPropagation();
  document.querySelectorAll('.select-items').forEach(el => { if(el.id !== id) el.style.display = 'none'; });
  const el = document.getElementById(id);
  el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

// 原始：防彈選單
const fillCheckboxes = (id, listKey, onChangeCode) => {
  const el = document.getElementById(id);
  if(el && dataConfig[listKey]) {
    let html = dataConfig[listKey].map(t => `<label class="checkbox-label" onclick="event.stopPropagation()"><input type="checkbox" value="${t}" onchange="${onChangeCode}"> ${t}</label>`).join('');
    el.innerHTML = html;
  }
};

function fillUIConfigs() {
  fillCheckboxes('items-owner', 'owners', 'renderIssues()');
  fillCheckboxes('items-status', 'statusList', 'renderIssues()');
  fillCheckboxes('items-product', 'products', 'renderIssues()');
  fillCheckboxes('items-project', 'projects', 'renderIssues()');
  fillCheckboxes('items-customer', 'customers', 'renderIssues()');
  fillCheckboxes('stats-product', 'products', 'renderStats()');
  fillCheckboxes('stats-status', 'statusList', 'renderStats()');
  fillFormSelect('input-owner', 'owners');
  fillFormSelect('input-status', 'statusList');
  fillFormSelect('input-customer', 'customers');
  fillFormSelect('input-product', 'products');
  fillFormSelect('input-project', 'projects');
}

const getCheckedValues = (id) => {
  return Array.from(document.querySelectorAll(`#${id} input[type="checkbox"]:checked`)).map(cb => cb.value);
};

const isTaskUrgent = (deadlineStr, status) => {
  if (!deadlineStr || status === "已解決" || status === "Done") return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let dParts = String(deadlineStr).split(/[-/T ]/);
  if(dParts.length < 3) return false;
  const deadline = new Date(dParts[0], dParts[1] - 1, dParts[2]);
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) <= 2;
};

// 原始：全長 Pebble 渲染與排序引擎
function renderIssues() {
  const container = document.getElementById('issue-display');
  const search = document.getElementById('search-input').value.toLowerCase();
  const fOwners = getCheckedValues('items-owner');
  const fStats = getCheckedValues('items-status');
  const fProds = getCheckedValues('items-product');
  const fProjs = getCheckedValues('items-project');

  let filtered = allIssues.filter(i => 
    (!i.id || !String(i.id).startsWith('MGR-')) && 
    String(i.issue).toLowerCase().includes(search) &&
    (fOwners.length === 0 || fOwners.includes(i.owner)) &&
    (fStats.length === 0 ? (i.status !== "已解決") : fStats.includes(i.status)) &&
    (fProds.length === 0 || fProds.includes(i.product)) &&
    (fProjs.length === 0 || fProjs.includes(i.project))
  ).sort((a,b) => {
    const isDoneA = (a.status === "已解決" || a.status === "Done");
    const isDoneB = (b.status === "已解決" || b.status === "Done");
    if (isDoneA !== isDoneB) return isDoneA ? 1 : -1;
    const urgentA = isTaskUrgent(a.deadline, a.status);
    const urgentB = isTaskUrgent(b.deadline, b.status);
    if (urgentA !== urgentB) return urgentA ? -1 : 1;
    return new Date(b.date) - new Date(a.date);
  });

  container.innerHTML = filtered.map(i => {
    const isDone = (i.status === "已解決" || i.status === "Done");
    const urgentClass = (!isDone && isTaskUrgent(i.deadline, i.status)) ? 'urgent-card' : '';
    return `<div class="pebble ${isDone ? 'resolved-card' : ''} ${urgentClass}" onclick="openEdit('${i.id}')">
      <div style="font-size:12px; margin-bottom:8px; color:var(--pixel-green)">[ ${i.status} ]</div>
      <div style="font-size:22px; margin-bottom:12px; line-height:1.3;">${i.issue}</div>
      <div style="font-size:14px; color:#888;">${i.owner} | ${i.product} | ${i.project}<br><small>建立: ${i.date}</small></div>
    </div>`;
  }).join('');
}

function renderManagerIssues() {
  const container = document.getElementById('manager-issue-display');
  const search = document.getElementById('search-input-mgr').value.toLowerCase();
  let filtered = allIssues.filter(i => i.id && String(i.id).startsWith('MGR-') && String(i.issue).toLowerCase().includes(search))
  .sort((a, b) => new Date(b.date) - new Date(a.date));
  container.innerHTML = filtered.map(i => `<div class="pebble" onclick="openEdit('${i.id}')">
    <div style="font-size:12px; margin-bottom:8px; color:#ff0055">[ ${i.status} ]</div>
    <div style="font-size:22px; margin-bottom:12px;">${i.issue}</div>
    <div style="font-size:14px; color:#888;">${i.owner} | 建立: ${i.date}</div>
  </div>`).join('');
}

function renderStats() {
  const container = document.getElementById('stats-bars');
  const start = document.getElementById('stats-date-start').value;
  const end = document.getElementById('stats-date-end').value;
  const prods = getCheckedValues('stats-product');
  const stats = getCheckedValues('stats-status');
  const totalCounts = {}; let total = 0;

  allIssues.filter(i => {
    if(i.id.startsWith('MGR-')) return false;
    const d = i.date.replace(/\//g, '-');
    if(start && d < start) return false;
    if(end && d > end) return false;
    if(prods.length > 0 && !prods.includes(i.product)) return false;
    if(stats.length > 0 && !stats.includes(i.status)) return false;
    return true;
  }).forEach(i => { totalCounts[i.owner] = (totalCounts[i.owner] || 0) + 1; total++; });

  if(total === 0) { container.innerHTML = "無數據"; return; }
  const colors = ['#0f0', '#ffeb3b', '#ff0055', '#a020f0', '#ff9800', '#00bcd4'];
  container.innerHTML = Object.keys(totalCounts).sort((a,b)=>totalCounts[b]-totalCounts[a]).map((o, idx) => {
    const pct = Math.round(totalCounts[o]/total*100);
    return `<div class="stat-row"><div class="stat-label">${o}</div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${pct}%; background:${colors[idx%colors.length]}"></div><div class="stat-value">${totalCounts[o]}件 (${pct}%)</div></div></div>`;
  }).join('');
}

function openModal(type = 'TS') {
  currentModalType = type; fillUIConfigs();
  document.getElementById('issueForm').reset();
  document.getElementById('records-container').innerHTML = '';
  document.getElementById('link-group').innerHTML = '<input type="text" class="pixel-input wide link-entry" placeholder="https://...">';
  document.getElementById('edit-id').value = "";
  document.getElementById('input-creator').value = currentUser.name;
  document.getElementById('input-created-date').value = new Date().toLocaleDateString('zh-TW');
  window.currentClosedDate = ""; addRecordItem();
  document.getElementById('modal-overlay').style.display = 'flex';
  document.getElementById('btn-delete').style.display = 'none';
}

function openEdit(id) {
  fillUIConfigs();
  const i = allIssues.find(x => x.id === id);
  if(!i) return;
  openModal(id.startsWith('MGR-') ? 'MGR' : 'TS');
  document.getElementById('edit-id').value = i.id;
  document.getElementById('input-issue').value = i.issue;
  document.getElementById('input-owner').value = i.owner;
  document.getElementById('input-status').value = i.status;
  document.getElementById('input-customer').value = i.customer;
  document.getElementById('input-product').value = i.product;
  document.getElementById('input-project').value = i.project;
  document.getElementById('input-deadline').value = i.deadline;
  document.getElementById('input-description').value = i.description;
  document.getElementById('input-creator').value = i.creator || 'UNKNOWN';
  document.getElementById('input-created-date').value = i.date;
  window.currentClosedDate = i.closedDate || "";
  const container = document.getElementById('records-container'); container.innerHTML = '';
  (i.records || "").split('||').forEach(item => { if(item) addRecordItem(item.substring(3), item.startsWith('[v]')); });
  if(container.innerHTML === '') addRecordItem();
  const linkGroup = document.getElementById('link-group'); linkGroup.innerHTML = "";
  (i.link || "").split(' | ').forEach(url => {
    if(!url) return;
    const input = document.createElement('input'); input.className = "pixel-input wide link-entry"; input.value = url; input.style.marginTop = "10px";
    linkGroup.appendChild(input);
  });
  if(!linkGroup.innerHTML) addLinkField();
  document.getElementById('btn-delete').style.display = 'inline-block';
}

async function submitIssue() {
  const btn = document.getElementById('submit-btn'); btn.disabled = true; btn.innerText = "[ 同步中... ]";
  const recs = Array.from(document.querySelectorAll('.record-item-row')).map(row => {
    const chk = row.querySelector('.record-chk').checked ? '[v]' : '[ ]';
    return chk + row.querySelector('.record-txt-input').value;
  }).join('||');
  const payload = {
    action: document.getElementById('edit-id').value ? "edit" : "add",
    id: document.getElementById('edit-id').value || (currentModalType === 'MGR' ? 'MGR-' : 'TS-') + Date.now(),
    issue: document.getElementById('input-issue').value,
    owner: document.getElementById('input-owner').value,
    status: document.getElementById('input-status').value,
    customer: document.getElementById('input-customer').value,
    product: document.getElementById('input-product').value,
    project: document.getElementById('input-project').value,
    deadline: document.getElementById('input-deadline').value,
    priority: document.getElementById('input-priority').value,
    description: document.getElementById('input-description').value,
    records: recs, creator: document.getElementById('input-creator').value,
    closedDate: window.currentClosedDate || "", 
    date: document.getElementById('input-created-date').value,
    link: Array.from(document.querySelectorAll('.link-entry')).map(el => el.value).filter(v => v).join(' | ')
  };
  try {
    isMutating = true; await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
    isMutating = false; alert("同步完成!"); location.reload(); 
  } catch(e) { alert("失敗"); btn.disabled = false; isMutating = false; }
}

function addLinkField() {
  const input = document.createElement('input');
  input.className = "pixel-input wide link-entry"; input.style.marginTop = "10px";
  document.getElementById('link-group').appendChild(input);
}
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }
async function deleteIssue() {
  const pwd = prompt("請輸入確認密碼:"); if (pwd !== "13091309" && pwd !== "13321332") return;
  const id = document.getElementById('edit-id').value;
  isMutating = true; await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: "delete", id: id }) });
  isMutating = false; location.reload();
}
