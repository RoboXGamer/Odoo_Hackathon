export const seedData = {
  assets: [
    { id: 'AF-0012', name: 'Dell Latitude', category: 'Electronics', status: 'Allocated', department: 'Engineering', location: 'Bengaluru', owner: 'Priya Shah', updated: '2h ago' },
    { id: 'AF-0062', name: 'Epson Projector', category: 'Electronics', status: 'Maintenance', department: 'Facilities', location: 'HQ Floor 2', owner: '-', updated: '1d ago' },
    { id: 'AF-0201', name: 'Ergo Office Chair', category: 'Furniture', status: 'Available', department: '-', location: 'Warehouse', owner: '-', updated: '3d ago' },
    { id: 'AF-0114', name: 'MacBook Pro 14', category: 'Electronics', status: 'Allocated', department: 'Design', location: 'Mumbai', owner: 'Arjun Nair', updated: '5h ago' },
    { id: 'AF-0343', name: 'Tata Ace Van', category: 'Vehicle', status: 'Available', department: 'Field Operations', location: 'Pune Depot', owner: '-', updated: '1d ago' },
  ],
  departments: [
    { id: 'DEP-1', name: 'Engineering', head: 'Aditi Rao', parent: '-', employees: 42, status: 'Active' },
    { id: 'DEP-2', name: 'Facilities', head: 'Rohan Mehta', parent: '-', employees: 18, status: 'Active' },
    { id: 'DEP-3', name: 'Field Operations (East)', head: 'Sana Iqbal', parent: 'Field Operations', employees: 26, status: 'Inactive' },
  ],
  categories: [
    { id: 'CAT-1', name: 'Electronics', count: 64, status: 'Active' },
    { id: 'CAT-2', name: 'Furniture', count: 38, status: 'Active' },
    { id: 'CAT-3', name: 'Vehicle', count: 12, status: 'Active' },
  ],
  employees: [
    { id: 'EMP-1', name: 'Priya Shah', department: 'Engineering', email: 'priya@assetflow.local', status: 'Active' },
    { id: 'EMP-2', name: 'Arjun Nair', department: 'Design', email: 'arjun@assetflow.local', status: 'Active' },
    { id: 'EMP-3', name: 'Rohan Mehta', department: 'Facilities', email: 'rohan@assetflow.local', status: 'Active' },
  ],
  maintenance: [
    { id: 'MR-101', asset: 'AF-0062', title: 'Projector bulb not turning on', status: 'Pending', assignee: 'Unassigned', date: '2h ago' },
    { id: 'MR-102', asset: 'AF-0031', title: 'AC unit making noise', status: 'Approved', assignee: 'Unassigned', date: '4h ago' },
    { id: 'MR-103', asset: 'AF-0038', title: 'Forklift inspection', status: 'Technician assigned', assignee: 'R. Varma', date: 'Today' },
    { id: 'MR-104', asset: 'AF-0007', title: 'Printer jam', status: 'In progress', assignee: 'S. Kapoor', date: 'Yesterday' },
  ],
  bookings: [
    { id: 'BK-001', resource: 'Conference Room B2', title: 'Procurement team', date: '2026-07-07', start: '9:00', end: '10:00' },
    { id: 'BK-002', resource: 'Conference Room B2', title: 'Design team', date: '2026-07-07', start: '10:30', end: '11:45' },
  ],
  audits: [
    { asset: 'AF-003', name: 'Dell laptop', location: 'Desk E12', status: 'Verified', note: 'Serial matched' },
    { asset: 'AF-9921', name: 'Office chair', location: 'Desk E14', status: 'Missing', note: 'Not found at desk' },
    { asset: 'AF-9838', name: 'Monitor', location: 'Desk E15', status: 'Damaged', note: 'Panel crack' },
  ],
  transfers: [],
  logs: [
    { type: 'Allocation', title: 'Asset AF-0114 registered', detail: 'MacBook Pro 14', time: '15 min ago', read: false },
    { type: 'Booking', title: 'Booking confirmed', detail: 'Conference Room B2', time: '1h ago', read: false },
    { type: 'Maintenance', title: 'MR-101 moved to Pending', detail: 'Projector bulb', time: '2h ago', read: false },
    { type: 'Alert', title: 'Asset AF-9921 flagged', detail: 'Q3 audit discrepancy', time: '3h ago', read: false },
  ],
};
