const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbws3I5VBX9M_496JG_S-3PUHetLY6Gqrd1cM59amITq1LhchlylV9UHmeLEkIJWZRbC/exec'; 
let allIssues = [];
let dataConfig = {};
let isMutating = false; 
let userList = []; 
let currentUser = { id: "", name: "", role: "" };
let currentModalType = 'TS';

// 預設 2026 年日期格式化
const getToday = () => {
    const d = new Date();
    return `2026-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

function fillFormSelect(id, list) {
  const el = document.getElementById(id);
  if(el && dataConfig[list]) {
    let options = dataConfig[list].map(t => `<option value="${t}">${t}</option>`);
    options.unshift('<option value="" disabled selected>請選擇...</option>');
    el.innerHTML = options.join('');
  }
}

async function handleLogin() {
  const idInput = document.getElementById('login-user').value.trim();
  const pwdInput = document.getElementById('login-pwd').value.trim();
  if (!idInput || !pwdInput) { alert("請輸入識別碼與密碼"); return; }
  if (userList.length === 0) {
      document.getElementById('login-status').innerText = "伺服器同步中...";
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
  } else { alert("驗證失敗：人員識別碼或密碼錯誤"); }
}

async function fetchDataOnLoad() {
  try {
    const resp = await fetch(SCRIPT_URL + '?action=getData');
    const data = await resp.json();
    allIssues = data.issues || [];
    dataConfig = data.config || {};
    userList = data.users || [];
    if(document.getElementById('login-status')) document.getElementById('login-status').innerText = "系統就緒。";
  } catch(e) { console.error("Initial load failed", e); }
}
window.onload = fetchDataOnLoad;

function initUI() {
  fillUIConfigs(); 
  renderIssues();
  renderManagerIssues();
  renderStats();
  setInterval(silentSync, 15000); 
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

function addRecordItem(text = "", checked = false) {
  const container = document.getElementById('records-container');
  const div = document.createElement('div');
  div.className = 'record-item-row';
  div.innerHTML = `
    <input type="checkbox" class="record-chk" ${checked ? 'checked' : ''}>
    <input type="text" class="pixel-input record-txt-input" style="flex:1; border-width:2px; font-size:14px;" value="${text}" required>
    <button type="button" class="pixel-btn" style="background:#444; padding:5px 10px; border:none; color:#fff;" onclick="this.parentElement.remove()">X</button>
  `;
  container.appendChild(div);
}

function handleStatusChange() {
  const status = document.getElementById('input-status').value;
  const actualField = document.getElementById('input-actual-closed');
  if (status === "已解決" || status === "Done") {
    const closedDate = prompt("此項目已完成！請輸入實際結案日期 (YYYY-MM-DD):", getToday());
    if (closedDate) {
      window.currentClosedDate = closedDate;
      actualField.value = closedDate;
      actualField.style.opacity = "1";
    } else {
      document.getElementById('input-status').value = "";
      actualField.value = "";
    }
  } else {
      actualField.value = "";
      actualField.style.opacity = "0.5";
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).style.display = 'block';
  document.getElementById('btn-' + tabId).classList.add('active');
  if(tabId === 'tab-main') renderStats();
}

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
  const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 2;
};

// 負責人與產品雙統計
function renderStats() {
  const start = document.getElementById('stats-date-start').value;
  const end = document.getElementById('stats-date-end').value;
  const colors = ['#0f0', '#ffeb3b', '#ff0055', '#a020f0', '#ff9800', '#00bcd4'];

  const filtered = allIssues.filter(i => {
    if (i.id && String(i.id).startsWith('MGR-')) return false;
    let iDate = i.date ? i.date.replace(/\//g, '-') : "";
    if (start && iDate < start) return false;
    if (end && iDate > end) return false;
    return true;
  });

  // 1. 負責人統計
  const ownerCounts = {}; let ownerTotal = 0;
  filtered.forEach(i => { ownerCounts[i.owner] = (ownerCounts[i.owner] || 0) + 1; ownerTotal++; });
  document.getElementById('stats-bars').innerHTML = Object.keys(ownerCounts).sort((a,b)=>ownerCounts[b]-ownerCounts[a]).map((o, idx) => {
    const pct = ownerTotal ? Math.round(ownerCounts[o]/ownerTotal*100) : 0;
    return `<div class="stat-row"><div class="stat-label">${o}</div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${pct}%; background:${colors[idx%colors.length]}"></div><div class="stat-value">${ownerCounts[o]}件 (${pct}%)</div></div></div>`;
  }).join('') || "<p style='text-align:center;'>無負責人數據</p>";

  // 2. 產品統計
  const prodCounts = {}; let prodTotal = 0;
  filtered.forEach(i => { prodCounts[i.product] = (prodCounts[i.product] || 0) + 1; prodTotal++; });
  document.getElementById('product-stats-bars').innerHTML = Object.keys(prodCounts).sort((a,b)=>prodCounts[b]-prodCounts[a]).map((p, idx) => {
    const pct = prodTotal ? Math.round(prodCounts[p]/prodTotal*100) : 0;
    return `<div class="stat-row"><div class="stat-label">${p}</div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${pct}%; background:${colors[(idx+2)%colors.length]}"></div><div class="stat-value">${prodCounts[p]}件 (${pct}%)</div></div></div>`;
  }).join('') || "<p style='text-align:center;'>無產品數據</p>";
}

function renderIssues() {
  const container = document.getElementById('issue-display');
  const search = document.getElementById('search-input').value.toLowerCase();
  const fOwners = getCheckedValues('items-owner');
  const fStats = getCheckedValues('items-status');
  const fProds = getCheckedValues('items-product');

  let filtered = allIssues.filter(i => 
    (!i.id || !String(i.id).startsWith('MGR-')) && 
    String(i.issue).toLowerCase().includes(search) &&
    (fOwners.length === 0 || fOwners.includes(i.owner)) &&
    (fStats.length === 0 ? (i.status !== "已解決" && i.status !== "Done") : fStats.includes(i.status)) &&
    (fProds.length === 0 || fProds.includes(i.product))
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
    const stat = String(i.status);
    const isDone = (stat === "已解決" || stat === "Done");
    const isUrgent = (!isDone && isTaskUrgent(i.deadline, stat));
    return `<div class="pebble ${isDone ? 'resolved-card' : ''} ${isUrgent ? 'urgent-card' : ''}" onclick="openEdit('${i.id}')">
      <div style="font-size:11px; color:${isUrgent ? '#ff0055' : 'var(--pixel-green)'};">[ ${stat} ]</div>
      <div style="font-size:20px; margin:10px 0; line-height:1.3;">${i.issue}</div>
      <div style="font-size:12px; opacity:0.6;">${i.product} | ${i.owner}</div>
    </div>`;
  }).join('');
}

function renderManagerIssues() {
  const container = document.getElementById('manager-issue-display');
  const search = document.getElementById('search-input-mgr').value.toLowerCase();
  let filtered = allIssues.filter(i => i.id && String(i.id).startsWith('MGR-') && String(i.issue).toLowerCase().includes(search))
  .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  container.innerHTML = filtered.map(i => `<div class="pebble" onclick="openEdit('${i.id}')">
    <div style="font-size:11px; color:#ff0055; margin-bottom:8px;">[ ${i.status} ]</div>
    <div style="font-size:20px; margin-bottom:10px;">${i.issue}</div>
    <div style="font-size:12px; opacity:0.6;">${i.owner}</div>
  </div>`).join('');
}

function openModal(type) {
  window.currentModalType = type; fillUIConfigs();
  document.getElementById('issueForm').reset();
  document.getElementById('records-container').innerHTML = '';
  document.getElementById('link-group').innerHTML = '<input type="text" class="pixel-input wide link-entry" placeholder="https://...">';
  document.getElementById('input-created-date').value = new Date().toLocaleDateString('zh-TW');
  document.getElementById('input-creator').value = currentUser.name;
  document.getElementById('input-deadline').value = getToday();
  document.getElementById('input-actual-closed').value = "";
  document.getElementById('input-actual-closed').style.opacity = "0.5";
  window.currentClosedDate = ""; addRecordItem();
  document.getElementById('modal-overlay').style.display = 'flex';
  document.getElementById('submit-btn').innerText = "建立完成";
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
  document.getElementById('input-deadline').value = i.deadline ? i.deadline.replace(/\//g, '-') : getToday();
  document.getElementById('input-description').value = i.description || "";
  document.getElementById('input-creator').value = i.creator || currentUser.name;
  document.getElementById('input-created-date').value = i.date;
  
  const actual = i.closedDate ? i.closedDate.replace(/\//g, '-') : "";
  document.getElementById('input-actual-closed').value = actual;
  document.getElementById('input-actual-closed').style.opacity = actual ? "1" : "0.5";
  window.currentClosedDate = actual;

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
  document.getElementById('submit-btn').innerText = "編輯完成";
  document.getElementById('btn-delete').style.display = 'inline-block';
}

async function submitIssue() {
  const form = document.getElementById('issueForm');
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const btn = document.getElementById('submit-btn'); btn.disabled = true; 
  const oldText = btn.innerText; btn.innerText = "同步中...";
  
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
    records: recs, 
    creator: document.getElementById('input-creator').value,
    closedDate: document.getElementById('input-actual-closed').value || "", 
    date: document.getElementById('input-created-date').value,
    link: Array.from(document.querySelectorAll('.link-entry')).map(el => el.value).filter(v => v).join(' | ')
  };

  try {
    isMutating = true; 
    await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
    isMutating = false; 
    alert("同步成功!");
    closeModal(); 
    await fetchDataOnLoad(); 
    renderIssues(); renderManagerIssues(); renderStats();
  } catch(e) { alert("同步失敗"); }
  btn.disabled = false; btn.innerText = oldText;
}

function addLinkField() {
  const input = document.createElement('input'); input.className = "pixel-input wide link-entry"; input.style.marginTop = "10px";
  document.getElementById('link-group').appendChild(input);
}
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }
async function deleteIssue() {
  const pwd = prompt("確認密碼:"); if (pwd !== "13091309" && pwd !== "13321332") return;
  const id = document.getElementById('edit-id').value;
  isMutating = true; await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: "delete", id: id }) });
  isMutating = false; closeModal(); await fetchDataOnLoad(); renderIssues();
}
