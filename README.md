# AssetFlow

### Smart Asset Allocation, Booking, Maintenance, and Audit Management

AssetFlow is a responsive asset-operations platform designed to help organizations manage the complete lifecycle of physical resources from one place.

It replaces scattered spreadsheets, manual approvals, and disconnected booking systems with a unified dashboard for registering assets, assigning ownership, transferring custody, booking shared resources, tracking maintenance, conducting audits, and reviewing operational reports.

> Built as a functional frontend prototype for the Odoo Hackathon.

---

## The Problem

Organizations often manage laptops, vehicles, rooms, furniture, tools, and other shared resources through spreadsheets or separate systems. This creates several common problems:

- The same asset can accidentally be allocated to multiple employees.
- Resource bookings may overlap.
- Ownership and transfer history becomes difficult to trace.
- Maintenance requests lack a clear approval workflow.
- Missing or damaged assets may only be discovered during manual audits.
- Management has limited visibility into utilization and idle assets.

AssetFlow brings these processes into one consistent workflow with clear status tracking and accountability.

## Solution Overview

AssetFlow provides a central workspace where administrators and teams can:

- Maintain a searchable asset directory.
- Allocate assets to employees and departments.
- Prevent direct double allocation.
- Submit and track transfer requests.
- Book rooms and equipment without time conflicts.
- Manage maintenance through a Kanban workflow.
- Perform asset audits and record discrepancies.
- Monitor utilization, maintenance trends, and idle assets.
- Review a unified activity and notification feed.

## Features

### Dashboard

- Live asset, allocation, availability, and booking statistics
- Asset-utilization overview
- Overdue-return alerts
- Quick actions
- Recent activity feed

### Organization Setup

- Manage departments, categories, and employees
- Create and edit organization records
- Search across organization data
- Track active and inactive records

### Asset Directory

- Register, edit, view, and delete assets
- Search by asset name, tag, or location
- Filter by category, status, and department
- Track ownership, condition, and location
- Open detailed asset information in a side panel

### Allocation and Transfers

- Track current asset custody
- Block direct reallocation of assigned assets
- Submit transfer requests with a reason
- Maintain an activity trail for transfers

### Resource Booking

- Book shared rooms and equipment
- View bookings on a time-based schedule
- Detect overlapping reservations automatically
- Cancel existing bookings

### Maintenance Kanban

- Create and edit maintenance requests
- Drag cards between workflow stages
- Use move controls on touch devices
- Track assignees and issue status
- Automatically update resolved asset availability

Workflow stages:

1. Pending
2. Approved
3. Technician assigned
4. In progress
5. Resolved

### Asset Audits

- Verify expected asset locations
- Mark assets as verified, missing, or damaged
- Add auditor notes
- Generate discrepancy activity records
- Close an audit cycle

### Reports and Notifications

- Utilization and maintenance visualizations
- Most-used and idle-asset insights
- Filterable notifications
- Global application search
- CSV export for dashboard and asset data

## Screens

The prototype includes the following responsive application screens:

1. Dashboard
2. Organization Setup
3. Asset Directory
4. Allocation and Transfer
5. Resource Booking
6. Maintenance Management
7. Asset Audit
8. Reports and Analytics
9. Activity and Notifications

## Key Business Rules Demonstrated

- An allocated asset cannot be directly allocated again.
- Transfers require a destination employee and a reason.
- Resource bookings cannot overlap for the same date and resource.
- Maintenance requests follow defined workflow stages.
- Resolving maintenance can return an asset to available inventory.
- Audit discrepancies are reflected in the activity system.
- Actions across modules update shared dashboard data.

---

<div align="center">
  <strong>AssetFlow</strong><br>
  One workspace for every asset, booking, transfer, maintenance request, and audit.
</div>
