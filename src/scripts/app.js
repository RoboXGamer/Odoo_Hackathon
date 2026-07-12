import { createIcons, icons } from "lucide";

const routeByScreen = {
  dashboard: "/",
  organization: "/organization",
  assets: "/assets",
  allocation: "/allocation",
  booking: "/booking",
  maintenance: "/maintenance",
  audit: "/audit",
  reports: "/reports",
  notifications: "/notifications",
};
const emptyState = {
  assets: [],
  departments: [],
  categories: [],
  employees: [],
  maintenance: [],
  bookingResources: [],
  bookings: [],
  audits: [],
  transfers: [],
  allocations: [],
  logs: [],
};
let db = clone(emptyState),
  orgTab = "Departments",
  assetFilters = {
    q: "",
    category: "All categories",
    status: "All statuses",
    department: "All departments",
  },
  notificationFilter = "All",
  modalAction = null,
  dragId = null;
function clone(v) {
  return JSON.parse(JSON.stringify(v));
}
async function load() {
  try {
    const res = await fetch("/api/bootstrap");
    if (!res.ok) throw Error("Unable to load workspace data");
    return Object.assign(clone(emptyState), await res.json());
  } catch (e) {
    toast(e.message || "Unable to load workspace data");
    return clone(emptyState);
  }
}
function save() {
  renderAll();
}
async function apiRequest(resource, method, body, id) {
  const res = await fetch(`/api/${resource}${id ? `/${encodeURIComponent(id)}` : ""}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Error(data.error || "Save failed");
  return data.item ?? data;
}
const apiCreate = (resource, body) => apiRequest(resource, "POST", body);
const apiPatch = (resource, id, body) => apiRequest(resource, "PATCH", body, id);
const apiDelete = (resource, id) => apiRequest(resource, "DELETE", null, id);
function uid(p) {
  return p + "-" + Date.now().toString(36).toUpperCase();
}
function esc(s = "") {
  return String(s).replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
}
function addLog(type, title, detail) {
  const log = { type, title, detail, time: "Just now", read: false };
  db.logs.unshift(log);
  return log;
}
function badge(s) {
  return `<span class="badge ${s === "Allocated" || s === "Verified" || s === "Active" ? "blue" : s === "Maintenance" || s === "Damaged" ? "amber" : s === "Missing" || s === "Inactive" ? "red" : s === "Pending" ? "gray" : ""}">${esc(s)}</span>`;
}
function showScreen(id) {
  location.href = routeByScreen[id] || "/";
}
function renderAll() {
  renderAssets();
  renderOrg();
  renderKanban();
  renderBookings();
  renderAudit();
  renderLogs();
  renderDashboard();
  renderAllocation();
  renderReports();
  bindControls();
}
function renderAssets() {
  const body = document.getElementById("assetRows");
  if (!body) return;
  let rows = db.assets.filter(
    (a) =>
      (a.name + a.id + a.location + (a.serialNumber || "") + (a.qrCode || ""))
        .toLowerCase()
        .includes(assetFilters.q.toLowerCase()) &&
      (assetFilters.category === "All categories" ||
        a.category === assetFilters.category) &&
      (assetFilters.status === "All statuses" ||
        a.status === assetFilters.status) &&
      (assetFilters.department === "All departments" ||
        a.department === assetFilters.department),
  );
  body.innerHTML = rows.length
    ? rows
        .map(
          (a) =>
            `<tr class="clickable" onclick="openAsset('${a.id}')"><td><div class="asset-cell"><span class="asset-icon">▣</span><div><b>${esc(a.name)}</b><small>${a.id}</small></div></div></td><td>${esc(a.category)}</td><td>${badge(a.status)}</td><td>${esc(a.department)}</td><td>${esc(a.location)}</td><td>${esc(a.updated)}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="6"><div class="empty"><b>No assets found</b>Adjust your filters or register a new asset.</div></td></tr>`;
}
function renderOrg() {
  const panel = document.querySelector(
    '[data-title="Organization setup"] .panel',
  );
  if (!panel) return;
  const search =
    panel.querySelector(".search input")?.value?.toLowerCase() || "";
  const tabs = panel.querySelectorAll(".tab");
  tabs.forEach((t) =>
    t.classList.toggle("active", t.textContent.trim() === orgTab),
  );
  const head = panel.querySelector("thead"),
    body = panel.querySelector("tbody");
  const button = document.querySelector(
    '[data-title="Organization setup"] .page-head .primary',
  );
  const singular = { Departments: "department", Categories: "category", Employees: "employee" }[orgTab];
  button.textContent = `+ Add ${singular}`;
  button.onclick = () => openModal("Add " + singular);
  if (orgTab === "Departments") {
    head.innerHTML =
      "<tr><th>Department</th><th>Head</th><th>Parent</th><th>Employees</th><th>Status</th><th></th></tr>";
    body.innerHTML = db.departments
      .filter((x) => x.name.toLowerCase().includes(search))
      .map(
        (x) =>
          `<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.head)}</td><td>${esc(x.parent)}</td><td>${x.employees}</td><td>${badge(x.status)}</td><td><button class="action-btn" onclick="event.stopPropagation();editOrg('Department','${x.id}')">Edit</button><button class="action-btn danger-text" onclick="event.stopPropagation();deleteOrg('Department','${x.id}')">Delete</button></td></tr>`,
      )
      .join("");
  } else if (orgTab === "Categories") {
    head.innerHTML =
      "<tr><th>Category</th><th>Assets</th><th>Status</th><th></th></tr>";
    body.innerHTML = db.categories
      .filter((x) => x.name.toLowerCase().includes(search))
      .map(
        (x) =>
          `<tr><td><b>${esc(x.name)}</b></td><td>${x.count}</td><td>${badge(x.status)}</td><td><button class="action-btn" onclick="event.stopPropagation();editOrg('Category','${x.id}')">Edit</button><button class="action-btn danger-text" onclick="event.stopPropagation();deleteOrg('Category','${x.id}')">Delete</button></td></tr>`,
      )
      .join("");
  } else {
    head.innerHTML =
      "<tr><th>Employee</th><th>Department</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr>";
    body.innerHTML = db.employees
      .filter((x) => x.name.toLowerCase().includes(search))
      .map(
        (x) =>
          `<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.department)}</td><td>${esc(x.email)}</td><td>${esc((x.role || "employee").replaceAll("_", " "))}</td><td>${badge(x.status)}</td><td><button class="action-btn" onclick="editOrg('Employee','${x.id}')">Edit</button></td></tr>`,
      )
      .join("");
  }
}
function renderKanban() {
  const k = document.getElementById("kanban");
  if (!k) return;
  const cols = [
    "Pending",
    "Approved",
    "Technician assigned",
    "In progress",
    "Resolved",
  ];
  k.innerHTML = cols
    .map((s, i) => {
      const cards = db.maintenance.filter((x) => x.status === s);
      return `<div class="column" data-status="${s}"><div class="column-head"><span>${s}</span><span class="count">${cards.length}</span></div>${cards.map((t) => `<div class="ticket" draggable="true" data-id="${t.id}"><div class="ticket-id">${t.id} · ${t.asset}</div><b>${esc(t.title)}</b><small>${esc(t.assignee)} · ${esc(t.date)}</small><div class="ticket-actions"><button onclick="event.stopPropagation();editMaintenance('${t.id}')">Edit</button><button onclick="event.stopPropagation();moveCard('${t.id}',${i - 1})" ${i === 0 ? "disabled" : ""}>←</button><button onclick="event.stopPropagation();moveCard('${t.id}',${i + 1})" ${i === 4 ? "disabled" : ""}>→</button></div></div>`).join("")}<div class="drop-hint">Drag cards here</div></div>`;
    })
    .join("");
  k.querySelectorAll(".ticket").forEach((c) => {
    c.ondragstart = () => {
      dragId = c.dataset.id;
      c.classList.add("dragging");
    };
    c.ondragend = () => {
      dragId = null;
      c.classList.remove("dragging");
      k.querySelectorAll(".column").forEach((x) =>
        x.classList.remove("drag-over"),
      );
    };
  });
  k.querySelectorAll(".column").forEach((c) => {
    c.ondragover = (e) => {
      e.preventDefault();
      c.classList.add("drag-over");
    };
    c.ondragleave = () => c.classList.remove("drag-over");
    c.ondrop = (e) => {
      e.preventDefault();
      const item = db.maintenance.find((x) => x.id === dragId);
      if (item && item.status !== c.dataset.status) {
        item.status = c.dataset.status;
        if (item.status === "Resolved") {
          const a = db.assets.find((x) => x.id === item.asset);
          if (a) {
            a.status = "Available";
            apiPatch("assets", a.id, { status: "Available" }).catch((e) =>
              toast(e.message || "Save failed"),
            );
          }
        }
        apiPatch("maintenance", item.id, { status: item.status })
          .then(() => apiCreate("logs", addLog("Maintenance", `${item.id} moved to ${item.status}`, item.asset)))
          .catch((e) => toast(e.message || "Save failed"));
        save();
      }
      c.classList.remove("drag-over");
    };
  });
}
function renderBookings() {
  const tl = document.querySelector(
    '[data-title="Resource booking"] .timeline',
  );
  if (!tl) return;
  const resources = (db.bookingResources?.length ? db.bookingResources.map((x) => x.name) : [...new Set(db.bookings.map((x) => x.resource))]);
  const resource =
    document.getElementById("bookingResource")?.value || resources[0] || "";
  const day = document.getElementById("bookingDay")?.value || new Date().toISOString().slice(0, 10);
  const arr = db.bookings.filter(
    (b) => b.resource === resource && b.date === day && b.status !== "Cancelled",
  );
  tl.innerHTML = arr
    .map((b) => {
      const [sh, sm] = b.start.split(":").map(Number),
        [eh, em] = b.end.split(":").map(Number),
        top = ((sh - 9) * 60 + sm) * 0.9,
        height = Math.max(36, ((eh - sh) * 60 + em - sm) * 0.9);
      return `<div class="booking" style="top:${top}px;height:${height}px"><strong>${esc(b.title)}</strong><small>${b.start}–${b.end} · ${esc(b.status || "Upcoming")}</small><button class="action-btn" style="position:absolute;right:30px;top:4px" onclick="rescheduleBooking('${b.id}')">Edit</button><button class="action-btn" style="position:absolute;right:5px;top:4px" onclick="deleteBooking('${b.id}')">×</button></div>`;
    })
    .join("");
  const toolbar = document.querySelector(
    '[data-title="Resource booking"] .toolbar',
  );
  const resourceSelect = document.getElementById("bookingResource");
  const dayInput = document.getElementById("bookingDay");
  if (resourceSelect && !resourceSelect.dataset.loaded) {
    resourceSelect.dataset.loaded = 1;
    resourceSelect.innerHTML = optionList(resources, resource);
  }
  if (dayInput && !dayInput.value) dayInput.value = day;
  if (toolbar && !dayInput)
    toolbar.innerHTML = `<select class="btn" id="bookingResource" style="flex:1">${optionList(resources)}</select><input class="btn" id="bookingDay" type="date" value="${esc(day)}">`;
}
function renderAllocation() {
  const sec = document.querySelector('[data-title="Allocation & transfer"]');
  if (!sec) return;
  const assetSelect = document.getElementById("transferAsset");
  const employeeSelect = document.getElementById("transferEmployee");
  if (assetSelect && !assetSelect.dataset.loaded) {
    assetSelect.dataset.loaded = 1;
    assetSelect.innerHTML = db.assets.map((a) => `<option value="${esc(a.id)}">${esc(a.id)} - ${esc(a.name)}</option>`).join("");
  }
  if (employeeSelect && !employeeSelect.dataset.loaded) {
    employeeSelect.dataset.loaded = 1;
    employeeSelect.innerHTML = `<option value="">Select employee...</option>${db.employees.map((e) => `<option value="${esc(e.name)}">${esc(e.name)}</option>`).join("")}`;
  }
  const selectedAsset = db.assets.find((a) => a.id === assetSelect?.value) || db.assets[0];
  const from = document.getElementById("transferFrom");
  if (from && selectedAsset) from.value = selectedAsset.owner || "";
  const warning = document.getElementById("transferWarningTitle");
  if (warning) {
    warning.textContent = selectedAsset?.owner
      ? `Currently allocated to ${selectedAsset.owner} (${selectedAsset.department})`
      : "Select an asset to review custody.";
  }
  const history = document.getElementById("allocationHistory");
  if (history) {
    const records = (db.allocations || []).filter((x) => x.asset === selectedAsset?.id);
    history.innerHTML = selectedAsset
      ? (records.map((x) => `<div class="history-row"><span class="history-line"></span><div><b>${esc(x.holderType)}: ${esc(x.holder)} ${x.overdue ? '<span class="badge red">Overdue</span>' : ""}</b><small>${esc(x.allocatedAt)}${x.expectedReturn ? ` · Expected ${esc(x.expectedReturn)}` : ""} · ${esc(x.status)}</small>${x.status === "Active" ? `<button class="action-btn" onclick="requestReturn('${x.id}')">Request return</button>` : x.status === "Return Requested" ? `<button class="action-btn approval-action" onclick="completeReturn('${x.id}')">Approve check-in</button>` : ""}</div></div>`).join("") || `<div class="history-row"><span class="history-line"></span><div><b>${esc(selectedAsset.name)} custody record</b><small>${esc(selectedAsset.updated)} - ${esc(selectedAsset.location)}</small></div></div>`)
      : '<div class="empty"><b>No asset selected</b>Choose an asset to view custody.</div>';
  }
  const requests = document.getElementById("transferRequests");
  if (requests) requests.innerHTML = (db.transfers || []).length ? db.transfers.map((x) => `<div class="list-row"><span><b>${esc(x.asset)} → ${esc(x.to)}</b><small style="display:block;color:var(--muted)">${esc(x.reason)}</small></span><span>${badge(x.status)} ${x.status === "Pending" ? `<button class="action-btn approval-action" onclick="decideTransfer('${x.id}','Approved')">Approve</button><button class="action-btn danger-text approval-action" onclick="decideTransfer('${x.id}','Rejected')">Reject</button>` : ""}</span></div>`).join("") : '<div class="empty"><b>No transfer requests</b></div>';
}
function renderAudit() {
  const body = document.querySelector('[data-title="Asset audit"] tbody');
  if (!body) return;
  body.innerHTML = db.audits
    .map(
      (a, i) =>
        `<tr><td><b>${a.asset} ${esc(a.name)}</b></td><td>${esc(a.location)}</td><td><select class="status-select" onchange="updateAudit(${i},this.value)"><option ${a.status === "Verified" ? "selected" : ""}>Verified</option><option ${a.status === "Missing" ? "selected" : ""}>Missing</option><option ${a.status === "Damaged" ? "selected" : ""}>Damaged</option></select></td><td><input style="border:0;background:transparent" value="${esc(a.note)}" onchange="updateAuditNote(${i},this.value)"></td></tr>`,
    )
    .join("");
  const vals = db.audits.filter((x) => x.status === "Verified").length,
    flag = db.audits.length - vals,
    mins = document.querySelectorAll('[data-title="Asset audit"] .mini strong');
  if (mins.length) {
    mins[0].textContent = `${db.audits.length} / ${db.audits.length}`;
    mins[1].textContent = vals;
    mins[2].textContent = flag;
  }
}
function renderLogs() {
  const outputs = [
    document.getElementById("logs"),
    document.getElementById("notificationList"),
  ].filter(Boolean);
  if (!outputs.length) return;
  const arr = db.logs.filter(
    (l) =>
      notificationFilter === "All" ||
      l.type === notificationFilter.replace(/s$/, ""),
  );
  const html = arr.length
    ? arr
        .map(
          (l) =>
            `<div class="log-row" style="opacity:${l.read ? 0.7 : 1}"><span class="log-icon">${l.type === "Alert" ? "!" : l.type === "Booking" ? "◷" : l.type === "Approval" ? "✓" : "⇄"}</span><div><b>${esc(l.title)}</b><p>${esc(l.detail)}</p></div><time>${esc(l.time)}</time></div>`,
        )
        .join("")
    : '<div class="empty"><b>No notifications</b>Nothing in this category.</div>';
  outputs.forEach((out) => {
    out.innerHTML = html;
  });
  document
    .querySelectorAll('[data-title="Activity & notifications"] .filters .tab, [data-notification-filter]')
    .forEach((t) =>
      t.classList.toggle("active", (t.dataset.notificationFilter || t.textContent.trim()) === notificationFilter),
    );
}
function renderDashboard() {
  const list = document.getElementById("activityList");
  if (list)
    list.innerHTML = db.logs
      .slice(0, 4)
      .map(
        (l) =>
          `<div class="activity-item"><span class="activity-icon">${l.type === "Booking" ? "◷" : "✓"}</span><div><b>${esc(l.title)}</b><small>${esc(l.detail)}</small></div><span class="time">${l.time}</span></div>`,
      )
      .join("");
  const nums = document.querySelectorAll(
    '[data-title="Dashboard"] .stat strong',
  );
  if (nums.length) {
    nums[0].textContent = db.assets.length;
    const allocated = db.assets.filter((x) => x.status === "Allocated").length;
    const available = db.assets.filter((x) => x.status === "Available").length;
    nums[1].textContent = allocated;
    nums[2].textContent = available;
    nums[3].textContent = db.bookings.length;
    const percent = db.assets.length ? Math.round((allocated / db.assets.length) * 100) : 0;
    const utilization = document.getElementById("utilizationPercent");
    if (utilization) utilization.textContent = `${percent}%`;
  }
  const alertText = document.getElementById("dashboardAlertText");
  if (alertText) {
    const alerts = db.logs.filter((x) => x.type === "Alert" && !x.read).length;
    alertText.textContent = alerts ? `${alerts} unread alerts need follow-up.` : "No urgent alerts.";
  }
  const legend = document.getElementById("utilizationLegend");
  if (legend) {
    const rows = [
      ["Allocated", db.assets.filter((x) => x.status === "Allocated").length, "#635bff"],
      ["Available", db.assets.filter((x) => x.status === "Available").length, "#14b8a6"],
      ["Maintenance", db.assets.filter((x) => x.status === "Maintenance").length, "#f59e0b"],
    ];
    legend.innerHTML = rows
      .map(([label, count, color]) => `<div class="legend-row" style="--c:${color}"><span>${label}</span><b>${count}</b></div>`)
      .join("");
  }
  const activeReturns = (db.allocations || []).filter((x) => x.status !== "Returned" && x.expectedReturn);
  const today = new Date().toISOString().slice(0, 10);
  const renderReturns = (items) => items.length ? items.map((x) => `<div class="list-row"><span>${esc(x.asset)} · ${esc(x.holder)}</span><b>${esc(x.expectedReturn)}</b></div>`).join("") : '<div class="empty"><b>None</b></div>';
  const overdue = document.getElementById("overdueReturns"), upcoming = document.getElementById("upcomingReturns");
  if (overdue) overdue.innerHTML = renderReturns(activeReturns.filter((x) => x.expectedReturn < today));
  if (upcoming) upcoming.innerHTML = renderReturns(activeReturns.filter((x) => x.expectedReturn >= today));
}
function renderReports() {
  const used = document.getElementById("mostUsedAssets");
  if (used) {
    const counts = db.bookings.reduce((acc, booking) => {
      acc[booking.resource] = (acc[booking.resource] || 0) + 1;
      return acc;
    }, {});
    const rows = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    const max = Math.max(1, ...rows.map(([, count]) => count));
    used.innerHTML = rows.length
      ? rows
          .map(
            ([name, count]) =>
              `<div class="list-row"><span>${esc(name)}</span><div class="progress"><span style="width:${Math.round((count / max) * 100)}%"></span></div></div>`,
          )
          .join("")
      : '<div class="empty"><b>No usage data</b>Bookings will appear here.</div>';
  }
  const status = document.getElementById("assetsByStatus");
  if (status) {
    const counts = db.assets.reduce((acc, asset) => {
      acc[asset.status] = (acc[asset.status] || 0) + 1;
      return acc;
    }, {});
    status.innerHTML = Object.entries(counts).length
      ? Object.entries(counts)
          .map(([name, count]) => `<div class="list-row"><span>${esc(name)}</span><b>${count}</b></div>`)
          .join("")
      : '<div class="empty"><b>No assets</b>Status counts will appear here.</div>';
  }
}
function bindControls() {
  const ap = document.querySelector('[data-title="Asset directory"]');
  if (ap && !ap.dataset.bound) {
    ap.dataset.bound = 1;
    const [q, cat, st, dep] = ap.querySelectorAll("input,select");
    q.oninput = (e) => {
      assetFilters.q = e.target.value;
      renderAssets();
    };
    cat.innerHTML =
      "<option>All categories</option>" +
      db.categories.map((x) => `<option>${esc(x.name)}</option>`).join("");
    st.innerHTML =
      "<option>All statuses</option><option>Available</option><option>Allocated</option><option>Reserved</option><option>Under Maintenance</option><option>Lost</option><option>Retired</option><option>Disposed</option>";
    dep.innerHTML =
      "<option>All departments</option>" +
      db.departments
        .map((x) => `<option>${esc(x.name.replace(" (East)", ""))}</option>`)
        .join("");
    [cat, st, dep].forEach(
      (x, i) =>
        (x.onchange = (e) => {
          assetFilters[["category", "status", "department"][i]] =
            e.target.value;
          renderAssets();
        }),
    );
  }
  const org = document.querySelector('[data-title="Organization setup"]');
  if (org && !org.dataset.bound) {
    org.dataset.bound = 1;
    org.querySelectorAll(".tab").forEach(
      (t) =>
        (t.onclick = () => {
          orgTab = t.textContent.trim();
          renderOrg();
        }),
    );
    org.querySelector(".search input").oninput = renderOrg;
  }
  document
    .querySelectorAll('[data-title="Activity & notifications"] .filters .tab, [data-notification-filter]')
    .forEach((t) => {
      if (t.dataset.bound) return;
      t.dataset.bound = 1;
      t.onclick = () => {
        notificationFilter = t.dataset.notificationFilter || t.textContent.trim();
        renderLogs();
      };
    });
  const br = document.getElementById("bookingResource"),
    bd = document.getElementById("bookingDay");
  if (br && !br.dataset.bound) {
    br.dataset.bound = bd.dataset.bound = 1;
    br.onchange = renderBookings;
    bd.onchange = renderBookings;
  }
  const transferAsset = document.getElementById("transferAsset");
  if (transferAsset && !transferAsset.dataset.bound) {
    transferAsset.dataset.bound = 1;
    transferAsset.onchange = renderAllocation;
  }
}
function optionList(items, selected = "") {
  return items
    .map((value) => `<option ${value === selected ? "selected" : ""}>${esc(value)}</option>`)
    .join("");
}
function assetForm(item = {}) {
  const categories = db.categories.map((x) => x.name);
  const departments = db.departments.map((x) => x.name);
  const statuses = ["Available", "Allocated", "Reserved", "Under Maintenance", "Lost", "Retired", "Disposed"];
  return `<div class="form-grid"><div class="field"><label>Asset name *</label><input name="name" required value="${esc(item.name || "")}"></div><div class="field"><label>Asset tag</label><input name="id" placeholder="Generated automatically" value="${esc(item.id || "")}" ${item.id ? "readonly" : ""}></div><div class="field"><label>Serial number</label><input name="serialNumber" value="${esc(item.serialNumber || "")}"></div><div class="field"><label>QR identifier</label><input name="qrCode" placeholder="Defaults to asset tag" value="${esc(item.qrCode || "")}"></div><div class="field"><label>Category</label><select name="category" required>${optionList(categories, item.category)}</select></div><div class="field"><label>Status</label><select name="status">${optionList(statuses, item.status || "Available")}</select></div><div class="field"><label>Condition</label><select name="condition">${optionList(["New", "Good", "Fair", "Damaged"], item.condition || "Good")}</select></div><div class="field"><label>Acquisition date</label><input type="date" name="acquisitionDate" value="${esc(item.acquisitionDate || "")}"></div><div class="field"><label>Acquisition cost</label><input type="number" min="0" step="0.01" name="acquisitionCost" value="${esc(item.acquisitionCost || 0)}"></div><div class="field"><label>Department</label><select name="department" required>${optionList(departments, item.department || "Unassigned")}</select></div><div class="field"><label>Location *</label><input name="location" required value="${esc(item.location || "")}"></div><div class="field"><label>Shared/bookable</label><select name="shared"><option value="false">No</option><option value="true" ${item.shared ? "selected" : ""}>Yes</option></select></div><div class="field full"><label>Attachment references</label><input name="attachments" placeholder="Photo or document URLs" value="${esc(item.attachments || "")}"></div><input type="hidden" name="owner" value="${esc(item.owner || "-")}"></div>`;
}function setModal(title, html, action, wide = false) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = html;
  document.getElementById("modalError").classList.remove("show");
  document.getElementById("modalCard").classList.toggle("wide", wide);
  modalAction = action;
  document.getElementById("modal").classList.add("open");
}
function openModal(title) {
  if (title === "Register asset")
    return setModal(
      title,
      assetForm(),
      async (fd) => {
        if (fd.id && db.assets.some((x) => x.id === fd.id))
          throw Error("That asset tag already exists.");
        const item = await apiCreate("assets", { ...fd, id: fd.id || undefined, updated: "Just now" });
        db.assets.push(item);
        await apiCreate("logs", addLog("Allocation", `Asset ${item.id} registered`, fd.name));
      },
      true,
    );
  if (title === "Add department") return editOrg("Department");
  if (title === "Add category") return editOrg("Category");
  if (title === "Add employee") return editOrg("Employee");
  if (title === "Book a resource") return bookingModal();
  if (title === "Allocate asset") {
    const available = db.assets.filter((x) => x.status === "Available" && !x.shared);
    return setModal(title, `<div class="form-grid"><div class="field full"><label>Available asset</label><select name="asset" required>${available.map((x) => `<option value="${esc(x.id)}">${esc(x.id)} - ${esc(x.name)}</option>`).join("")}</select></div><div class="field"><label>Holder type</label><select name="holderType"><option>Employee</option><option>Department</option></select></div><div class="field"><label>Holder</label><input name="holder" required list="allocationHolders"><datalist id="allocationHolders">${[...db.employees.map((x) => x.name), ...db.departments.map((x) => x.name)].map((x) => `<option value="${esc(x)}">`).join("")}</datalist></div><div class="field full"><label>Expected return</label><input type="date" name="expectedReturn"></div></div>`, async (fd) => {
      const item = await apiCreate("allocations", { id: uid("AL"), ...fd, allocatedAt: new Date().toISOString(), status: "Active" });
      db.allocations.push(item);
      const asset = db.assets.find((x) => x.id === fd.asset);
      if (asset) Object.assign(asset, { status: "Allocated", owner: fd.holderType === "Employee" ? fd.holder : "-", department: fd.holderType === "Department" ? fd.holder : asset.department });
      await apiCreate("logs", addLog("Allocation", `${fd.asset} allocated`, `${fd.holderType}: ${fd.holder}`));
    }, true);
  }
  if (title === "Maintenance request" || title === "Raise requests")
    return maintenanceModal();
  setModal(
    title,
    `<div class="field"><label>Notes</label><textarea name="notes" required placeholder="Add details..."></textarea></div>`,
    async () => {
      await apiCreate("logs", addLog("Approval", title, "Submitted"));
    },
  );
}
function closeModal() {
  document.getElementById("modal").classList.remove("open");
  modalAction = null;
}
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = "✓  " + msg;
  t.style.opacity = 1;
  t.style.transform = "none";
  setTimeout(() => {
    t.style.opacity = 0;
    t.style.transform = "translateY(15px)";
  }, 2200);
}
const modalForm = document.getElementById("modalForm");
if (modalForm) modalForm.onsubmit = async (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  try {
    await modalAction?.(fd);
    save();
    closeModal();
    toast("Saved successfully");
  } catch (err) {
    const box = document.getElementById("modalError");
    box.textContent = err.message;
    box.classList.add("show");
  }
};
function editOrg(type, id) {
  const key =
      type === "Department"
        ? "departments"
        : type === "Category"
          ? "categories"
          : "employees",
    item = db[key].find((x) => x.id === id) || {};
  let html;
  if (type === "Department")
    html = `<div class="form-grid"><div class="field"><label>Name *</label><input name="name" required value="${esc(item.name || "")}"></div><div class="field"><label>Head</label><select name="head"><option value="-">Unassigned</option>${optionList(db.employees.map((x) => x.name), item.head)}</select></div><div class="field"><label>Parent</label><select name="parent"><option value="-">No parent</option>${optionList(db.departments.filter((x) => x.id !== id).map((x) => x.name), item.parent)}</select></div><div class="field"><label>Status</label><select name="status"><option>Active</option><option ${item.status === "Inactive" ? "selected" : ""}>Inactive</option></select></div></div>`;
  else if (type === "Category")
    html = `<div class="form-grid"><div class="field"><label>Name *</label><input name="name" required value="${esc(item.name || "")}"></div><div class="field"><label>Status</label><select name="status"><option>Active</option><option ${item.status === "Inactive" ? "selected" : ""}>Inactive</option></select></div></div>`;
  else
    html = `<div class="form-grid"><div class="field"><label>Name *</label><input name="name" required value="${esc(item.name || "")}"></div><div class="field"><label>Email *</label><input name="email" type="email" required value="${esc(item.email || "")}"></div><div class="field"><label>Department</label><select name="department">${db.departments.map((x) => `<option ${x.name === item.department ? "selected" : ""}>${x.name}</option>`).join("")}</select></div><div class="field"><label>Role</label><select name="role">${optionList(["employee", "department_head", "asset_manager", "admin"], item.role || "employee")}</select></div><div class="field"><label>Status</label><select name="status"><option>Active</option><option ${item.status === "Inactive" ? "selected" : ""}>Inactive</option></select></div></div>`;
  setModal(`${id ? "Edit" : "Add"} ${type}`, html, async (fd) => {
    if (id) {
      Object.assign(item, fd);
      await apiPatch(key, id, fd);
    } else {
      const created = {
        id: uid(type.slice(0, 3).toUpperCase()),
        ...fd,
        employees: type === "Department" ? 0 : undefined,
        count: type === "Category" ? 0 : undefined,
      };
      db[key].push(created);
      await apiCreate(key, created);
    }
    await apiCreate("logs", addLog(
      "Approval",
      `${type} ${fd.name} ${id ? "updated" : "created"}`,
      "Organization setup",
    ));
  });
}
async function deleteOrg(type, id) {
  const key = type === "Department" ? "departments" : "categories";
  const item = db[key].find((x) => x.id === id);
  if (!item) return;
  if (!confirm(`Delete ${type.toLowerCase()} "${item.name}"?`)) return;

  try {
    await apiDelete(key, id);
    db[key] = db[key].filter((x) => x.id !== id);
    await apiCreate("logs", addLog("Alert", `${type} ${item.name} deleted`, "Organization setup"));
    save();
    toast(`${type} deleted`);
  } catch (e) {
    toast(e.message || "Delete failed");
  }
}
function openAsset(id) {
  const a = db.assets.find((x) => x.id === id);
  if (!a) return;
  document.getElementById("drawerBody").innerHTML =
    `<div class="detail-hero"><span class="detail-icon">▣</span><div><h2 style="margin:0 0 5px">${esc(a.name)}</h2>${badge(a.status)}</div></div><div class="detail-grid"><div class="detail-item"><small>Asset tag</small><b>${a.id}</b></div><div class="detail-item"><small>Serial / QR</small><b>${esc(a.serialNumber || "-")} / ${esc(a.qrCode || a.id)}</b></div><div class="detail-item"><small>Category</small><b>${esc(a.category)}</b></div><div class="detail-item"><small>Condition</small><b>${esc(a.condition || "Good")}</b></div><div class="detail-item"><small>Department</small><b>${esc(a.department)}</b></div><div class="detail-item"><small>Location</small><b>${esc(a.location)}</b></div><div class="detail-item"><small>Assigned owner</small><b>${esc(a.owner)}</b></div><div class="detail-item"><small>Acquisition</small><b>${esc(a.acquisitionDate || "-")} · ${esc(a.acquisitionCost || 0)}</b></div></div><div style="display:flex;gap:8px;margin-top:20px"><button class="btn primary manager-action" onclick="editAsset('${id}')">Edit asset</button><button class="btn danger manager-action" onclick="deleteAsset('${id}')">Delete</button></div>`;
  document.getElementById("drawer").classList.add("open");
}
function closeDrawer() {
  document.getElementById("drawer").classList.remove("open");
}
function editAsset(id) {
  const a = db.assets.find((x) => x.id === id);
  setModal(
    "Edit asset",
    assetForm(a),
    async (fd) => {
      if (fd.id !== id && db.assets.some((x) => x.id === fd.id))
        throw Error("That asset tag already exists.");
      Object.assign(a, fd, { updated: "Just now" });
      await apiPatch("assets", id, { ...fd, updated: "Just now" });
      await apiCreate("logs", addLog("Allocation", `${fd.id} updated`, fd.name));
    },
    true,
  );
  closeDrawer();
}
function deleteAsset(id) {
  if (confirm("Delete this asset? This cannot be undone.")) {
    db.assets = db.assets.filter((x) => x.id !== id);
    apiDelete("assets", id)
      .then(() => apiCreate("logs", addLog("Alert", `Asset ${id} deleted`, "Inventory")))
      .catch((e) => toast(e.message || "Delete failed"));
    save();
    closeDrawer();
    toast("Asset deleted");
  }
}
function maintenanceModal(id) {
  const t = db.maintenance.find((x) => x.id === id) || {};
  setModal(
    id ? "Edit maintenance request" : "New maintenance request",
    `<div class="form-grid"><div class="field"><label>Asset tag *</label><input name="asset" required value="${esc(t.asset || "")}"></div><div class="field"><label>Status</label><select name="status">${["Pending", "Approved", "Technician assigned", "In progress", "Resolved"].map((x) => `<option ${x === t.status ? "selected" : ""}>${x}</option>`)}</select></div><div class="field full"><label>Issue *</label><textarea name="title" required>${esc(t.title || "")}</textarea></div><div class="field full"><label>Assignee</label><input name="assignee" value="${esc(t.assignee || "Unassigned")}"></div></div>`,
    async (fd) => {
      if (id) {
        Object.assign(t, fd);
        await apiPatch("maintenance", id, fd);
      } else {
        const item = { id: uid("MR"), ...fd, date: "Just now" };
        db.maintenance.push(item);
        await apiCreate("maintenance", item);
      }
      await apiCreate("logs", addLog("Maintenance", `${id || "New request"} ${fd.status}`, fd.asset));
    },
    true,
  );
}
function editMaintenance(id) {
  maintenanceModal(id);
}
function moveCard(id, index) {
  const statuses = [
    "Pending",
    "Approved",
    "Technician assigned",
    "In progress",
    "Resolved",
  ];
  if (index < 0 || index > 4) return;
  const x = db.maintenance.find((t) => t.id === id);
  x.status = statuses[index];
  apiPatch("maintenance", id, { status: x.status })
    .then(() => apiCreate("logs", addLog("Maintenance", `${id} moved to ${x.status}`, x.asset)))
    .catch((e) => toast(e.message || "Save failed"));
  save();
}
function bookingModal(id) {
  const current = db.bookings.find((x) => x.id === id) || {};
  const resources = (db.bookingResources?.length ? db.bookingResources.map((x) => x.name) : [...new Set(db.bookings.map((x) => x.resource))]);
  setModal(
    id ? "Reschedule booking" : "Book a resource",
    `<div class="form-grid"><div class="field full"><label>Resource</label><select name="resource" required>${optionList(resources, current.resource)}</select></div><div class="field full"><label>Purpose *</label><input name="title" required value="${esc(current.title || "")}"></div><div class="field"><label>Requester</label><input name="requester" value="${esc(current.requester || "")}"></div><div class="field"><label>Department</label><input name="department" value="${esc(current.department || "")}"></div><div class="field"><label>Date</label><input type="date" name="date" required value="${current.date || new Date().toISOString().slice(0, 10)}"></div><div class="field"><label>Reminder</label><input type="datetime-local" name="reminderAt" value="${esc(current.reminderAt || "")}"></div><div class="field"><label>Start</label><input type="time" name="start" required value="${current.start || "10:00"}"></div><div class="field"><label>End</label><input type="time" name="end" required value="${current.end || "11:00"}"></div></div>`,
    async (fd) => {
      if (fd.end <= fd.start) throw Error("End time must be after start time.");
      if (
        db.bookings.some(
          (b) =>
            b.id !== id &&
            b.resource === fd.resource &&
            b.date === fd.date &&
            fd.start < b.end &&
            fd.end > b.start,
        )
      )
        throw Error(
          "This slot overlaps with an existing booking. Choose another time.",
        );
      const item = { id: id || uid("BK"), ...fd, status: "Upcoming", cancelledAt: "" };
      if (id) { Object.assign(current, item); await apiPatch("bookings", id, fd); }
      else { db.bookings.push(item); await apiCreate("bookings", item); }
      await apiCreate("logs", addLog(
        "Booking",
        `Booking confirmed: ${fd.resource}`,
        `${fd.date} - ${fd.start}-${fd.end}`,
      ));
    },
    true,
  );
}
function deleteBooking(id) {
  if (confirm("Cancel this booking?")) {
    const booking = db.bookings.find((x) => x.id === id);
    apiPatch("bookings", id, { status: "Cancelled", cancelledAt: new Date().toISOString() })
      .then(() => apiCreate("logs", addLog("Booking", "Booking cancelled", id)))
      .catch((e) => toast(e.message || "Delete failed"));
    if (booking) booking.status = "Cancelled";
    save();
  }
}
function rescheduleBooking(id) { bookingModal(id); }
function updateAudit(i, status) {
  db.audits[i].status = status;
  apiPatch("audits", db.audits[i].asset, { status })
    .then(() => apiCreate("logs", addLog("Alert", `${db.audits[i].asset} marked ${status}`, "Q3 audit")))
    .catch((e) => toast(e.message || "Save failed"));
  save();
}
function updateAuditNote(i, note) {
  db.audits[i].note = note;
  apiPatch("audits", db.audits[i].asset, { note }).catch((e) =>
    toast(e.message || "Save failed"),
  );
  save();
}
function submitTransfer() {
  const sec = document.querySelector('[data-title="Allocation & transfer"]'),
    asset = document.getElementById("transferAsset")?.value,
    to = document.getElementById("transferEmployee")?.value,
    reason = sec.querySelector("textarea").value.trim();
  if (!asset || !to || !reason)
    return toast("Choose an employee and enter a reason");
  const item = { id: uid("TR"), asset, to, reason, status: "Pending" };
  db.transfers.push(item);
  apiCreate("transfers", item)
    .then(() => apiCreate("logs", addLog("Transfer", `Transfer requested: ${asset}`, `To ${to}`)))
    .catch((e) => toast(e.message || "Save failed"));
  save();
  sec.querySelector("textarea").value = "";
  toast("Transfer request submitted");
}
function decideTransfer(id, status) {
  const transfer = db.transfers.find((x) => x.id === id);
  if (!transfer) return;
  apiPatch("transfers", id, { status, decidedAt: new Date().toISOString() }).then(() => {
    transfer.status = status === "Approved" ? "Completed" : status;
    return apiCreate("logs", addLog("Approval", `Transfer ${transfer.status.toLowerCase()}: ${transfer.asset}`, `To ${transfer.to}`));
  }).then(save).catch((e) => toast(e.message || "Unable to update transfer"));
}
function requestReturn(id) {
  apiPatch("allocations", id, { status: "Return Requested" }).then(() => { const item = db.allocations.find((x) => x.id === id); if (item) item.status = "Return Requested"; save(); }).catch((e) => toast(e.message));
}
function completeReturn(id) {
  const condition = prompt("Check-in condition: New, Good, Fair, or Damaged", "Good") || "Good";
  const notes = prompt("Check-in notes", "") || "";
  apiPatch("allocations", id, { status: "Returned", returnedAt: new Date().toISOString(), checkInCondition: condition, checkInNotes: notes }).then(() => { const item = db.allocations.find((x) => x.id === id); if (item) Object.assign(item, { status: "Returned", checkInCondition: condition, checkInNotes: notes }); const asset = db.assets.find((x) => x.id === item?.asset); if (asset) Object.assign(asset, { status: "Available", owner: "-", condition }); save(); }).catch((e) => toast(e.message));
}
function exportCSV(kind) {
  let rows =
    kind === "assets"
      ? db.assets
      : kind === "overview"
        ? [
            { metric: "Total assets", value: db.assets.length },
            { metric: "Bookings", value: db.bookings.length },
            { metric: "Maintenance", value: db.maintenance.length },
          ]
        : db.logs;
  const keys = Object.keys(rows[0] || {}),
    csv = [
      keys.join(","),
      ...rows.map((r) =>
        keys
          .map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n"),
    a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `assetflow-${kind}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("CSV exported");
}
const bind = (selector, handler) => {
  const el = document.querySelector(selector);
  if (el) el.onclick = handler;
};
bind('[data-title="Allocation & transfer"] .primary', submitTransfer);
bind('[data-title="Dashboard"] .page-head .btn', () => exportCSV("overview"));
bind('[data-title="Reports & analytics"] .page-head .btn', () =>
  exportCSV("assets"),
);
bind('[data-title="Asset audit"] .alert .btn', () => {
  notificationFilter = "Alerts";
  showScreen("notifications");
});
bind('[data-title="Asset audit"] .page-head .success', () => {
  apiCreate("logs", addLog(
    "Approval",
    "Q3 audit cycle closed",
    `${db.audits.filter((x) => x.status !== "Verified").length} discrepancies`,
  )).catch((e) => toast(e.message || "Save failed"));
  save();
  toast("Audit cycle closed");
});
bind('[data-title="Activity & notifications"] .page-head .btn', () => {
  db.logs.forEach((x) => (x.read = true));
  db.logs.forEach((x) => {
    if (x.id) apiPatch("logs", x.id, { read: true }).catch((e) => toast(e.message || "Save failed"));
  });
  save();
  toast("All notifications marked as read");
});
bind("#markNotificationsRead", () => {
  db.logs.forEach((x) => (x.read = true));
  db.logs.forEach((x) => {
    if (x.id) apiPatch("logs", x.id, { read: true }).catch((e) => toast(e.message || "Save failed"));
  });
  save();
  toast("All notifications marked as read");
});
const searchBtn = document.getElementById("searchToggle");
if (searchBtn)
  searchBtn.onclick = () => {
    const searchPopover = document.getElementById("globalSearch");
    if (!searchPopover?.matches(":popover-open")) searchPopover?.showPopover?.();
    setTimeout(() => document.getElementById("globalSearchInput")?.focus(), 20);
  };
const globalSearchInput = document.getElementById("globalSearchInput");
if (globalSearchInput) globalSearchInput.oninput = (e) => {
  const q = e.target.value.toLowerCase(),
    items = [
      ...db.assets.map((x) => ({
        title: `${x.id} · ${x.name}`,
        sub: `Asset · ${x.location}`,
        action: `openAsset('${x.id}')`,
      })),
      ...db.employees.map((x) => ({
        title: x.name,
        sub: `Employee · ${x.department}`,
        action: `showScreen('organization')`,
      })),
    ]
      .filter((x) => (x.title + x.sub).toLowerCase().includes(q))
      .slice(0, 7);
  const globalSearchList = document.getElementById("globalSearchList");
  if (!globalSearchList) return;
  globalSearchList.innerHTML =
    items
      .map(
        (x) =>
          `<div class="result" onclick="${x.action};document.getElementById('globalSearch').hidePopover?.()"><b>${esc(x.title)}</b><small>${esc(x.sub)}</small></div>`,
      )
      .join("") || '<div class="empty">No matching results</div>';
};
Object.assign(window, {
  showScreen,
  openModal,
  toast,
  closeModal,
  closeDrawer,
  openAsset,
  editAsset,
  deleteAsset,
  editOrg,
  deleteOrg,
  editMaintenance,
  moveCard,
  deleteBooking,
  rescheduleBooking,
  updateAudit,
  updateAuditNote,
  decideTransfer,
  requestReturn,
  completeReturn,
});
createIcons({ icons });
const appShell = document.querySelector(".app");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const menuBtn = document.getElementById("menuBtn");
const sidebarStorageKey = "assetflow:sidebar-collapsed";
const isMobileNav = () => window.matchMedia("(max-width: 780px)").matches;
const setDesktopSidebarState = (collapsed) => {
  document.documentElement.classList.toggle("sidebar-collapsed", collapsed);
  appShell?.classList.toggle("sidebar-collapsed", collapsed);
  menuBtn?.setAttribute("aria-expanded", String(!collapsed));
};
const closeMobileSidebar = () => {
  sidebar?.classList.remove("open");
  overlay?.classList.remove("show");
  if (isMobileNav()) menuBtn?.setAttribute("aria-expanded", "false");
};
if (!isMobileNav()) {
  setDesktopSidebarState(localStorage.getItem(sidebarStorageKey) === "true");
}
if (menuBtn) {
  menuBtn.onclick = () => {
    if (isMobileNav()) {
      const willOpen = !sidebar?.classList.contains("open");
      sidebar?.classList.toggle("open", willOpen);
      overlay?.classList.toggle("show", willOpen);
      menuBtn.setAttribute("aria-expanded", String(willOpen));
      return;
    }

    const collapsed = !appShell?.classList.contains("sidebar-collapsed");
    setDesktopSidebarState(collapsed);
    localStorage.setItem(sidebarStorageKey, String(collapsed));
    closeMobileSidebar();
  };
}
overlay?.addEventListener("click", closeMobileSidebar);
window.addEventListener("resize", () => {
  if (!isMobileNav()) {
    closeMobileSidebar();
    setDesktopSidebarState(localStorage.getItem(sidebarStorageKey) === "true");
  }
});
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) logoutBtn.onclick = async () => {
  const { signOut } = await import("../lib/auth-client");
  await signOut();
  location.href = "/login";
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closeDrawer();
    document.getElementById("globalSearch")?.hidePopover?.();
    document.getElementById("notificationsPopover")?.hidePopover?.();
    closeMobileSidebar();
  }
});
load().then((data) => {
  db = data;
  renderAll();
  createIcons({ icons });
});





