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
const seed = {
  assets: [
    {
      id: "AF-0012",
      name: "Dell Latitude",
      category: "Electronics",
      status: "Allocated",
      department: "Engineering",
      location: "Bengaluru",
      owner: "Priya Shah",
      updated: "2h ago",
    },
    {
      id: "AF-0062",
      name: "Epson Projector",
      category: "Electronics",
      status: "Maintenance",
      department: "Facilities",
      location: "HQ Floor 2",
      owner: "—",
      updated: "1d ago",
    },
    {
      id: "AF-0201",
      name: "Ergo Office Chair",
      category: "Furniture",
      status: "Available",
      department: "—",
      location: "Warehouse",
      owner: "—",
      updated: "3d ago",
    },
    {
      id: "AF-0114",
      name: "MacBook Pro 14",
      category: "Electronics",
      status: "Allocated",
      department: "Design",
      location: "Mumbai",
      owner: "Arjun Nair",
      updated: "5h ago",
    },
    {
      id: "AF-0343",
      name: "Tata Ace Van",
      category: "Vehicle",
      status: "Available",
      department: "Field Operations",
      location: "Pune Depot",
      owner: "—",
      updated: "1d ago",
    },
  ],
  departments: [
    {
      id: "DEP-1",
      name: "Engineering",
      head: "Aditi Rao",
      parent: "—",
      employees: 42,
      status: "Active",
    },
    {
      id: "DEP-2",
      name: "Facilities",
      head: "Rohan Mehta",
      parent: "—",
      employees: 18,
      status: "Active",
    },
    {
      id: "DEP-3",
      name: "Field Operations (East)",
      head: "Sana Iqbal",
      parent: "Field Operations",
      employees: 26,
      status: "Inactive",
    },
  ],
  categories: [
    { id: "CAT-1", name: "Electronics", count: 64, status: "Active" },
    { id: "CAT-2", name: "Furniture", count: 38, status: "Active" },
    { id: "CAT-3", name: "Vehicle", count: 12, status: "Active" },
  ],
  employees: [
    {
      id: "EMP-1",
      name: "Priya Shah",
      department: "Engineering",
      email: "priya@assetflow.local",
      status: "Active",
    },
    {
      id: "EMP-2",
      name: "Arjun Nair",
      department: "Design",
      email: "arjun@assetflow.local",
      status: "Active",
    },
    {
      id: "EMP-3",
      name: "Rohan Mehta",
      department: "Facilities",
      email: "rohan@assetflow.local",
      status: "Active",
    },
  ],
  maintenance: [
    {
      id: "MR-101",
      asset: "AF-0062",
      title: "Projector bulb not turning on",
      status: "Pending",
      assignee: "Unassigned",
      date: "2h ago",
    },
    {
      id: "MR-102",
      asset: "AF-0031",
      title: "AC unit making noise",
      status: "Approved",
      assignee: "Unassigned",
      date: "4h ago",
    },
    {
      id: "MR-103",
      asset: "AF-0038",
      title: "Forklift inspection",
      status: "Technician assigned",
      assignee: "R. Varma",
      date: "Today",
    },
    {
      id: "MR-104",
      asset: "AF-0007",
      title: "Printer jam",
      status: "In progress",
      assignee: "S. Kapoor",
      date: "Yesterday",
    },
  ],
  bookings: [
    {
      id: "BK-001",
      resource: "Conference Room B2",
      title: "Procurement team",
      date: "2026-07-07",
      start: "9:00",
      end: "10:00",
    },
    {
      id: "BK-002",
      resource: "Conference Room B2",
      title: "Design team",
      date: "2026-07-07",
      start: "10:30",
      end: "11:45",
    },
  ],
  audits: [
    {
      asset: "AF-003",
      name: "Dell laptop",
      location: "Desk E12",
      status: "Verified",
      note: "Serial matched",
    },
    {
      asset: "AF-9921",
      name: "Office chair",
      location: "Desk E14",
      status: "Missing",
      note: "Not found at desk",
    },
    {
      asset: "AF-9838",
      name: "Monitor",
      location: "Desk E15",
      status: "Damaged",
      note: "Panel crack",
    },
  ],
  transfers: [],
  logs: [
    {
      type: "Allocation",
      title: "Asset AF-0114 registered",
      detail: "MacBook Pro 14",
      time: "15 min ago",
      read: false,
    },
    {
      type: "Booking",
      title: "Booking confirmed",
      detail: "Conference Room B2",
      time: "1h ago",
      read: false,
    },
    {
      type: "Maintenance",
      title: "MR-101 moved to Pending",
      detail: "Projector bulb",
      time: "2h ago",
      read: false,
    },
    {
      type: "Alert",
      title: "Asset AF-9921 flagged",
      detail: "Q3 audit discrepancy",
      time: "3h ago",
      read: false,
    },
  ],
};
let db = clone(seed),
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
    return Object.assign(clone(seed), await res.json());
  } catch (e) {
    toast(e.message || "Using local fallback data");
    return clone(seed);
  }
}
async function persist() {
  try {
    const res = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(db),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw Error(data.error || "Save failed");
    }
  } catch (e) {
    toast(e.message || "Save failed");
  }
}
function save() {
  renderAll();
  persist();
}
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
  db.logs.unshift({ type, title, detail, time: "Just now", read: false });
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
  bindControls();
}
function renderAssets() {
  const body = document.getElementById("assetRows");
  if (!body) return;
  let rows = db.assets.filter(
    (a) =>
      (a.name + a.id + a.location)
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
  button.textContent = `＋ Add ${orgTab.slice(0, -1).toLowerCase()}`;
  button.onclick = () => openModal("Add " + orgTab.slice(0, -1));
  if (orgTab === "Departments") {
    head.innerHTML =
      "<tr><th>Department</th><th>Head</th><th>Parent</th><th>Employees</th><th>Status</th><th></th></tr>";
    body.innerHTML = db.departments
      .filter((x) => x.name.toLowerCase().includes(search))
      .map(
        (x) =>
          `<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.head)}</td><td>${esc(x.parent)}</td><td>${x.employees}</td><td>${badge(x.status)}</td><td><button class="action-btn" onclick="event.stopPropagation();editOrg('Department','${x.id}')">Edit</button></td></tr>`,
      )
      .join("");
  } else if (orgTab === "Categories") {
    head.innerHTML =
      "<tr><th>Category</th><th>Assets</th><th>Status</th><th></th></tr>";
    body.innerHTML = db.categories
      .filter((x) => x.name.toLowerCase().includes(search))
      .map(
        (x) =>
          `<tr><td><b>${esc(x.name)}</b></td><td>${x.count}</td><td>${badge(x.status)}</td><td><button class="action-btn" onclick="editOrg('Category','${x.id}')">Edit</button></td></tr>`,
      )
      .join("");
  } else {
    head.innerHTML =
      "<tr><th>Employee</th><th>Department</th><th>Email</th><th>Status</th><th></th></tr>";
    body.innerHTML = db.employees
      .filter((x) => x.name.toLowerCase().includes(search))
      .map(
        (x) =>
          `<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.department)}</td><td>${esc(x.email)}</td><td>${badge(x.status)}</td><td><button class="action-btn" onclick="editOrg('Employee','${x.id}')">Edit</button></td></tr>`,
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
          if (a) a.status = "Available";
        }
        addLog("Maintenance", `${item.id} moved to ${item.status}`, item.asset);
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
  const resource =
    document.getElementById("bookingResource")?.value || "Conference Room B2";
  const day = document.getElementById("bookingDay")?.value || "2026-07-07";
  const arr = db.bookings.filter(
    (b) => b.resource === resource && b.date === day,
  );
  tl.innerHTML = arr
    .map((b) => {
      const [sh, sm] = b.start.split(":").map(Number),
        [eh, em] = b.end.split(":").map(Number),
        top = ((sh - 9) * 60 + sm) * 0.9,
        height = Math.max(36, ((eh - sh) * 60 + em - sm) * 0.9);
      return `<div class="booking" style="top:${top}px;height:${height}px"><strong>${esc(b.title)}</strong><small>${b.start}–${b.end}</small><button class="action-btn" style="position:absolute;right:5px;top:4px" onclick="deleteBooking('${b.id}')">×</button></div>`;
    })
    .join("");
  const toolbar = document.querySelector(
    '[data-title="Resource booking"] .toolbar',
  );
  if (toolbar && !document.getElementById("bookingDay"))
    toolbar.innerHTML = `<select class="btn" id="bookingResource" style="flex:1"><option>Conference Room B2</option><option>Projector AF-0062</option><option>Training Room A1</option></select><input class="btn" id="bookingDay" type="date" value="2026-07-07">`;
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
  const out = document.getElementById("logs");
  if (!out) return;
  const arr = db.logs.filter(
    (l) =>
      notificationFilter === "All" ||
      l.type === notificationFilter.replace(/s$/, ""),
  );
  out.innerHTML = arr.length
    ? arr
        .map(
          (l) =>
            `<div class="log-row" style="opacity:${l.read ? 0.7 : 1}"><span class="log-icon">${l.type === "Alert" ? "!" : l.type === "Booking" ? "◷" : l.type === "Approval" ? "✓" : "⇄"}</span><div><b>${esc(l.title)}</b><p>${esc(l.detail)}</p></div><time>${esc(l.time)}</time></div>`,
        )
        .join("")
    : '<div class="empty"><b>No notifications</b>Nothing in this category.</div>';
  document
    .querySelectorAll('[data-title="Activity & notifications"] .filters .tab')
    .forEach((t) =>
      t.classList.toggle("active", t.textContent.trim() === notificationFilter),
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
    nums[1].textContent = db.assets.filter(
      (x) => x.status === "Allocated",
    ).length;
    nums[2].textContent = db.assets.filter(
      (x) => x.status === "Available",
    ).length;
    nums[3].textContent = db.bookings.length;
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
      "<option>All statuses</option><option>Available</option><option>Allocated</option><option>Maintenance</option><option>Retired</option>";
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
  const nf = document.querySelector('[data-title="Activity & notifications"]');
  if (nf && !nf.dataset.bound) {
    nf.dataset.bound = 1;
    nf.querySelectorAll(".filters .tab").forEach(
      (t) =>
        (t.onclick = () => {
          notificationFilter = t.textContent.trim();
          renderLogs();
        }),
    );
  }
  const br = document.getElementById("bookingResource"),
    bd = document.getElementById("bookingDay");
  if (br && !br.dataset.bound) {
    br.dataset.bound = bd.dataset.bound = 1;
    br.onchange = renderBookings;
    bd.onchange = renderBookings;
  }
}
const fields = {
  asset: `<div class="form-grid"><div class="field"><label>Asset name *</label><input name="name" required></div><div class="field"><label>Asset tag *</label><input name="id" required placeholder="AF-0000"></div><div class="field"><label>Category</label><select name="category">${db.categories.map((x) => `<option>${x.name}</option>`).join("")}</select></div><div class="field"><label>Status</label><select name="status"><option>Available</option><option>Allocated</option><option>Maintenance</option><option>Retired</option></select></div><div class="field"><label>Department</label><select name="department"><option>—</option>${db.departments.map((x) => `<option>${x.name}</option>`).join("")}</select></div><div class="field"><label>Location *</label><input name="location" required></div><div class="field full"><label>Assigned owner</label><input name="owner" placeholder="Optional"></div></div>`,
};
function setModal(title, html, action, wide = false) {
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
      fields.asset,
      (fd) => {
        if (db.assets.some((x) => x.id === fd.id))
          throw Error("That asset tag already exists.");
        db.assets.push({ ...fd, updated: "Just now" });
        addLog("Allocation", `Asset ${fd.id} registered`, fd.name);
      },
      true,
    );
  if (title === "Add department") return editOrg("Department");
  if (title === "Book a resource") return bookingModal();
  if (title === "Maintenance request" || title === "Raise requests")
    return maintenanceModal();
  setModal(
    title,
    `<div class="field"><label>Notes</label><textarea name="notes" required placeholder="Add details..."></textarea></div>`,
    () => addLog("Approval", title, "Submitted"),
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
document.getElementById("modalForm").onsubmit = (e) => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  try {
    modalAction?.(fd);
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
    html = `<div class="form-grid"><div class="field"><label>Name *</label><input name="name" required value="${esc(item.name || "")}"></div><div class="field"><label>Head</label><input name="head" value="${esc(item.head || "")}"></div><div class="field"><label>Parent</label><input name="parent" value="${esc(item.parent || "—")}"></div><div class="field"><label>Status</label><select name="status"><option>Active</option><option ${item.status === "Inactive" ? "selected" : ""}>Inactive</option></select></div></div>`;
  else if (type === "Category")
    html = `<div class="form-grid"><div class="field"><label>Name *</label><input name="name" required value="${esc(item.name || "")}"></div><div class="field"><label>Status</label><select name="status"><option>Active</option><option ${item.status === "Inactive" ? "selected" : ""}>Inactive</option></select></div></div>`;
  else
    html = `<div class="form-grid"><div class="field"><label>Name *</label><input name="name" required value="${esc(item.name || "")}"></div><div class="field"><label>Email *</label><input name="email" type="email" required value="${esc(item.email || "")}"></div><div class="field"><label>Department</label><select name="department">${db.departments.map((x) => `<option ${x.name === item.department ? "selected" : ""}>${x.name}</option>`).join("")}</select></div><div class="field"><label>Status</label><select name="status"><option>Active</option><option ${item.status === "Inactive" ? "selected" : ""}>Inactive</option></select></div></div>`;
  setModal(`${id ? "Edit" : "Add"} ${type}`, html, (fd) => {
    if (id) Object.assign(item, fd);
    else
      db[key].push({
        id: uid(type.slice(0, 3).toUpperCase()),
        ...fd,
        employees: type === "Department" ? 0 : undefined,
        count: type === "Category" ? 0 : undefined,
      });
    addLog(
      "Approval",
      `${type} ${fd.name} ${id ? "updated" : "created"}`,
      "Organization setup",
    );
  });
}
function openAsset(id) {
  const a = db.assets.find((x) => x.id === id);
  if (!a) return;
  document.getElementById("drawerBody").innerHTML =
    `<div class="detail-hero"><span class="detail-icon">▣</span><div><h2 style="margin:0 0 5px">${esc(a.name)}</h2>${badge(a.status)}</div></div><div class="detail-grid"><div class="detail-item"><small>Asset tag</small><b>${a.id}</b></div><div class="detail-item"><small>Category</small><b>${esc(a.category)}</b></div><div class="detail-item"><small>Department</small><b>${esc(a.department)}</b></div><div class="detail-item"><small>Location</small><b>${esc(a.location)}</b></div><div class="detail-item"><small>Assigned owner</small><b>${esc(a.owner)}</b></div><div class="detail-item"><small>Last updated</small><b>${esc(a.updated)}</b></div></div><div style="display:flex;gap:8px;margin-top:20px"><button class="btn primary" onclick="editAsset('${id}')">Edit asset</button><button class="btn danger" onclick="deleteAsset('${id}')">Delete</button></div>`;
  document.getElementById("drawer").classList.add("open");
}
function closeDrawer() {
  document.getElementById("drawer").classList.remove("open");
}
function editAsset(id) {
  const a = db.assets.find((x) => x.id === id);
  setModal(
    "Edit asset",
    fields.asset,
    (fd) => {
      if (fd.id !== id && db.assets.some((x) => x.id === fd.id))
        throw Error("That asset tag already exists.");
      Object.assign(a, fd, { updated: "Just now" });
      addLog("Allocation", `${fd.id} updated`, fd.name);
    },
    true,
  );
  setTimeout(
    () =>
      Object.entries(a).forEach(([k, v]) => {
        const x = document.querySelector(`#modal [name="${k}"]`);
        if (x) x.value = v;
      }),
    0,
  );
  closeDrawer();
}
function deleteAsset(id) {
  if (confirm("Delete this asset? This cannot be undone.")) {
    db.assets = db.assets.filter((x) => x.id !== id);
    addLog("Alert", `Asset ${id} deleted`, "Inventory");
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
    (fd) => {
      if (id) Object.assign(t, fd);
      else db.maintenance.push({ id: uid("MR"), ...fd, date: "Just now" });
      addLog("Maintenance", `${id || "New request"} ${fd.status}`, fd.asset);
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
  addLog("Maintenance", `${id} moved to ${x.status}`, x.asset);
  save();
}
function bookingModal() {
  setModal(
    "Book a resource",
    `<div class="form-grid"><div class="field full"><label>Resource</label><select name="resource"><option>Conference Room B2</option><option>Projector AF-0062</option><option>Training Room A1</option></select></div><div class="field full"><label>Purpose *</label><input name="title" required></div><div class="field"><label>Date</label><input type="date" name="date" required value="2026-07-07"></div><div></div><div class="field"><label>Start</label><input type="time" name="start" required value="10:00"></div><div class="field"><label>End</label><input type="time" name="end" required value="11:00"></div></div>`,
    (fd) => {
      if (fd.end <= fd.start) throw Error("End time must be after start time.");
      if (
        db.bookings.some(
          (b) =>
            b.resource === fd.resource &&
            b.date === fd.date &&
            fd.start < b.end &&
            fd.end > b.start,
        )
      )
        throw Error(
          "This slot overlaps with an existing booking. Choose another time.",
        );
      db.bookings.push({ id: uid("BK"), ...fd });
      addLog(
        "Booking",
        `Booking confirmed: ${fd.resource}`,
        `${fd.date} · ${fd.start}–${fd.end}`,
      );
    },
    true,
  );
}
function deleteBooking(id) {
  if (confirm("Cancel this booking?")) {
    db.bookings = db.bookings.filter((x) => x.id !== id);
    addLog("Booking", "Booking cancelled", id);
    save();
  }
}
function updateAudit(i, status) {
  db.audits[i].status = status;
  addLog("Alert", `${db.audits[i].asset} marked ${status}`, "Q3 audit");
  save();
}
function updateAuditNote(i, note) {
  db.audits[i].note = note;
  save();
}
function submitTransfer() {
  const sec = document.querySelector('[data-title="Allocation & transfer"]'),
    asset = sec.querySelector("select").value,
    to = sec.querySelectorAll("select")[1].value,
    reason = sec.querySelector("textarea").value.trim();
  if (to === "Select employee..." || !reason)
    return toast("Choose an employee and enter a reason");
  db.transfers.push({ id: uid("TR"), asset, to, reason, status: "Pending" });
  addLog("Transfer", `Transfer requested: ${asset}`, `To ${to}`);
  save();
  sec.querySelector("textarea").value = "";
  toast("Transfer request submitted");
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
  addLog(
    "Approval",
    "Q3 audit cycle closed",
    `${db.audits.filter((x) => x.status !== "Verified").length} discrepancies`,
  );
  save();
  toast("Audit cycle closed");
});
bind('[data-title="Activity & notifications"] .page-head .btn', () => {
  db.logs.forEach((x) => (x.read = true));
  save();
  toast("All notifications marked as read");
});
const searchBtn = document.getElementById("searchToggle");
if (searchBtn)
  searchBtn.onclick = () => {
    document.getElementById("globalSearch").classList.toggle("open");
    setTimeout(() => document.getElementById("globalSearchInput").focus(), 20);
  };
document.getElementById("globalSearchInput").oninput = (e) => {
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
  document.getElementById("globalSearchList").innerHTML =
    items
      .map(
        (x) =>
          `<div class="result" onclick="${x.action};document.getElementById('globalSearch').classList.remove('open')"><b>${esc(x.title)}</b><small>${esc(x.sub)}</small></div>`,
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
  editMaintenance,
  moveCard,
  deleteBooking,
  updateAudit,
  updateAuditNote,
});
createIcons({ icons });
document.getElementById("menuBtn").onclick = () => {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("overlay").classList.add("show");
};
document.getElementById("overlay").onclick = () => {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
};
document.getElementById("logoutBtn").onclick = async () => {
  const { signOut } = await import("../lib/auth-client");
  await signOut();
  location.href = "/login";
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closeDrawer();
    document.getElementById("globalSearch").classList.remove("open");
  }
});
load().then((data) => {
  db = data;
  renderAll();
  createIcons({ icons });
});
