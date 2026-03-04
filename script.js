// 注意：請將此處替換為您正確部署的 GAS 網址
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwurW1oi_qoAEPcCIoTKjWR87xpC5T_KVy2R6tpwc4yPXNmtDE9CW9Ud9yJL9heIofN/exec'; 
let allIssues = [];
let dataConfig = {};
let isMutating = false; 
let userList = []; 
let currentUser = { id: "", name: "", role: "" };
let currentModalType = 'TS';

// 修復：還原防彈選單邏輯
function fillFormSelect(id, list) {
  const el = document.getElementById(id);
  if(el && dataConfig[list]) {
    let options = dataConfig[list].map(t => `<option value="${t}">${t}</option>`);
    options.unshift('<option value="" disabled selected>請選擇...</option>');
    el.innerHTML = options.join('');
  }
}

// 修改：增加等待機制，確保資料加載完畢再驗證
async function handleLogin() {
  const idInput = document.getElementById('login-user').value.trim();
  const pwdInput = document.getElementById('login-pwd').value.trim();
  
  if (!idInput || !pwdInput) { alert("請輸入 ID 與密碼"); return; }

  // 如果清單還是空的，手動嘗試再抓一次
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
      alert("驗證失敗：識別碼或密碼錯誤"); 
      document.getElementById('login-status').innerText = "驗證未通過，請重試。";
  }
}

async function fetchDataOnLoad() {
  try {
    const resp = await fetch(SCRIPT_URL + '?action=getData');
    const data = await resp.json();
    allIssues = data.issues || [];
    dataConfig = data.config || {};
    userList = data.users || [];
    // 更新登入畫面狀態
    if(document.getElementById('login-status')) {
        document.getElementById('login-status').innerText = "系統就緒，請登入。";
        document.getElementById('login-status').style.color = "#0f0";
    }
  } catch(e) { 
      console.error("Initial load failed", e); 
      if(document.getElementById('login-status')) {
          document.getElementById('login-status').innerText = "連線失敗，請檢查網路。";
          document.getElementById('login-status').style.color = "#f00";
      }
  }
}
window.onload = fetchDataOnLoad;

function initUI() {
  fillUIConfigs(); 
  renderIssues();
  renderManagerIssues();
  renderStats();
  setInterval(silentSync, 10000); // 原始 10 秒靜默同步
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

// 變動功能：動態項目紀錄
function addRecordItem(text = "", checked = false) {
  const container = document.getElementById('records-container');
  const div = document.createElement('div');
  div.className = 'record-item-row';
  div.innerHTML = `
    <input type="checkbox" class="record-chk" ${checked ? 'checked' : ''}>
    <input type="text" class="pixel-input record-txt-input" style="flex:1; border-width:2px; font-size:14px;" value="${text}" placeholder="輸入進度記錄...">
    <button type="button" class="pixel-btn" style="background:#444; padding:5px 10px; border:none; color:#fff;" onclick="this.parentElement.remove()">X</button>
  `;
  container.appendChild(div);
}

// 變動功能：結案自動通知 L 欄
function handleStatusChange() {
  const status = document.getElementById('input-status').value;
  if (status === "已解決" || status === "Done") {
    const closedDate = prompt("專案已結案！請確認實際結案日期 (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    if (closedDate) window.currentClosedDate = closedDate;
  }
}

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
  
  fillCheckboxes('items-status-mgr', 'statusList', 'renderManagerIssues()');
  fillCheckboxes('items-customer-mgr', 'customers', 'renderManagerIssues()');

  fillCheckboxes('stats-product', 'products', 'renderStats()');
  fillCheckboxes('stats-status', 'statusList', 'updateStatsStatusText()');
  
  fillFormSelect('input-owner', 'owners');
  fillFormSelect('input-status', 'statusList');
  fillFormSelect('input-customer', 'customers');
  fillFormSelect('input-product', 'products');
  fillFormSelect('input-project', 'projects');
}

function updateStatsStatusText() {
  const vals = getCheckedValues('stats-status');
  const txt = document.getElementById('stats-status-text');
  if (vals.length === 0) txt.innerText = "狀態: 全狀態 ▾";
  else txt.innerText = vals.length > 1 ? `狀態: 已選(${vals.length}) ▾` : `狀態: ${vals[0]} ▾`;
  renderStats();
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
    (fOwners.length === 0 || fOwners.includes(String(i.owner))) &&
    (fStats.length === 0 ? (String(i.status) !== "已解決" && String(i.status) !== "Done") : fStats.includes(String(i.status))) &&
    (fProds.length === 0 || fProds.includes(String(i.product))) &&
    (fProjs.length === 0 || fProjs.includes(String(i.project)))
  ).sort((a, b) => {
    const statA = String(a.status);
    const statB = String(b.status);
    const isDoneA = (statA === "已解決" || statA === "Done");
    const isDoneB = (statB === "已解決" || statB === "Done");
    if (isDoneA !== isDoneB) return isDoneA ? 1 : -1;
    const urgentA = isTaskUrgent(a.deadline, statA);
    const urgentB = isTaskUrgent(b.deadline, statB);
    if (urgentA !== urgentB) return urgentA ? -1 : 1;
    return new Date(b.date) - new Date(a.date);
  });

  container.innerHTML = filtered.map(i => {
    const stat = String(i.status);
    const isDone = (stat === "已解決" || stat === "Done");
    const urgentClass = (!isDone && isTaskUrgent(i.deadline, stat)) ? 'urgent-card' : '';
    return `<div class="pebble ${isDone ? 'resolved-card' : ''} ${urgentClass}" onclick="openEdit('${i.id}')">
      <div style="font-size:12px; margin-bottom:8px; color:var(--pixel-green)">[ ${stat} ]</div>
      <div style="font-size:22px; margin-bottom:12px; line-height:1.3;">${i.issue}</div>
      <div style="font-size:14px; color:#888;">${i.owner} | ${i.product} | ${i.project}<br><small>建立: ${i.date}</small></div>
    </div>`;
  }).join('');
}

function renderManagerIssues() {
  const container = document.getElementById('manager-issue-display');
  const search = document.getElementById('search-input-mgr').value.toLowerCase();
  const fStats = getCheckedValues('items-status-mgr');
  let filtered = allIssues.filter(i => 
    i.id && String(i.id).startsWith('MGR-') && 
    String(i.issue).toLowerCase().includes(search) &&
    (fStats.length === 0 ? (String(i.status) !== "已解決" && String(i.status) !== "Done") : fStats.includes(String(i.status)))
  ).sort((a, b) => new Date(b.date) - new Date(a.date));
  container.innerHTML = filtered.map(i => `<div class="pebble" onclick="openEdit('${i.id}')">
    <div style="font-size:12px; margin-bottom:8px; color:#ff0055">[ ${i.status} ]</div>
    <div style="font-size:22px; margin-bottom:12px;">${i.issue}</div>
    <div style="font-size:14px; color:#888;">${i.owner} | 建立: ${i.date}</div>
  </div>`).join('');
}

function renderStats() {
  const container = document.getElementById('stats-bars');
  const startMonth = document.getElementById('stats-date-start').value; 
  const endMonth = document.getElementById('stats-date-end').value; 
  const prods = getCheckedValues('stats-product');
  const fStats = getCheckedValues('stats-status');
  const ownerCounts = {}; let total = 0;

  allIssues.forEach(i => {
    if (i.id && String(i.id).startsWith('MGR-')) return;
    if (fStats.length > 0 && !fStats.includes(String(i.status))) return;
    if (prods.length > 0 && !prods.includes(String(i.product))) return;
    
    let issueDate = i.date ? i.date.replace(/\//g, '-') : "";
    if (startMonth || endMonth) {
      if (!issueDate) return; 
      if (startMonth && issueDate < startMonth) return;
      if (endMonth && issueDate > endMonth) return;
    }
    ownerCounts[i.owner] = (ownerCounts[i.owner] || 0) + 1;
    total++;
  });

  if(total === 0) { container.innerHTML = "<p style='color:#888; text-align:center;'>無符合數據</p>"; return; }
  const colors = ['#0f0', '#ffeb3b', '#ff0055', '#a020f0', '#ff9800', '#00bcd4'];
  container.innerHTML = Object.keys(ownerCounts).sort((a,b)=>ownerCounts[b]-ownerCounts[a]).map((o, idx) => {
    const pct = Math.round(ownerCounts[o]/total*100);
    return `<div class="stat-row">
      <div class="stat-label">${o}</div>
      <div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${pct}%; background:${colors[idx%colors.length]}"></div>
      <div class="stat-value">${ownerCounts[o]}件 (${pct}%)</div></div>
    </div>`;
  }).join('');
}

function openModal(type = 'TS') {
  currentModalType = type; fillUIConfigs();
  document.getElementById('edit-id').value = "";
  document.getElementById('issueForm').reset();
  document.getElementById('records-container').innerHTML = '';
  document.getElementById('link-group').innerHTML = '<input type="text" class="pixel-input wide link-entry" placeholder="https://...">';
  document.getElementById('input-created-date').value = new Date().toLocaleDateString('zh-TW');
  document.getElementById('input-creator').value = currentUser.name;
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
  document.getElementById('input-priority').value = i.priority;
  document.getElementById('input-deadline').value = i.deadline ? i.deadline.replace(/\//g, '-') : "";
  document.getElementById('input-description').value = i.description || "";
  document.getElementById('input-creator').value = i.creator || 'UNKNOWN';
  document.getElementById('input-created-date').value = i.date;
  window.currentClosedDate = i.closedDate || "";

  const container = document.getElementById('records-container');
  container.innerHTML = '';
  (i.records || "").split('||').forEach(item => { if(item) addRecordItem(item.substring(3), item.startsWith('[v]')); });
  if(container.innerHTML === '') addRecordItem();

  const linkGroup = document.getElementById('link-group');
  linkGroup.innerHTML = "";
  (i.link || "").split(' | ').forEach(url => {
    if(!url) return;
    const input = document.createElement('input');
    input.className = "pixel-input wide link-entry"; input.value = url; input.style.marginTop = "10px";
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
    isMutating = false; alert("同步成功!"); location.reload(); 
  } catch(e) { alert("同步失敗"); btn.disabled = false; isMutating = false; }
}

function addLinkField() {
  const input = document.createElement('input');
  input.className = "pixel-input wide link-entry"; input.style.marginTop = "10px";
  document.getElementById('link-group').appendChild(input);
}
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }
async function deleteIssue() {
  const pwd = prompt("請輸入密碼:"); if (pwd !== "13091309" && pwd !== "13321332") return;
  const id = document.getElementById('edit-id').value;
  isMutating = true; await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: "delete", id: id }) });
  isMutating = false; location.reload();
}
