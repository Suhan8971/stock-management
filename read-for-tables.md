# Database Schema Documentation (PostgreSQL)

This document provides a detailed overview of the database tables, columns, and relationships for the CSD Stock Management system.

---

## 1. `project` Table
**Purpose**: Manages different projects or departments to which users and resources belong.

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `project_id` | `SERIAL (PK)` | Unique identifier for the project. |
| `project_name` | `VARCHAR(255)` | The name of the project. |

---

## 2. `item_totals` Table
**Purpose**: Represents a unique category or type of asset (e.g., "Camera", "Laptop") and tracks aggregate availability.

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `item_total_id` | `SERIAL (PK)` | Unique identifier for the item type. |
| `item_name` | `VARCHAR(255)` | Unique name of the resource type. |
| `category` | `VARCHAR(100)` | The category grouping for the item. |

**Relationships**:
- Linked to `Item` via name matching.
- Linked to `Booking` (One-to-Many).
- Linked to `Transaction` (One-to-Many).

---

## 3. `items` Table
**Purpose**: Represents individual physical units of stock.

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `item_id` | `SERIAL (PK)` | Unique identifier for the physical unit. |
| `item_name` | `VARCHAR(255)` | Name or descriptive label of the unit. |
| `category` | `VARCHAR(100)` | Category grouping. |
| `date` | `DATE` | Acquisition or record date. |

**Relationships**:
- Associated with `Booking` via `allocated_items` Many-to-Many table.
- Associated with `Transaction` via `allocated_items` Many-to-Many table.

---

## 4. `users` Table
**Purpose**: Stores information about individuals authorized to use or manage stock.

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `user_id` | `SERIAL (PK)` | Unique identifier for the user. |
| `name` | `VARCHAR(255)` | Full name of the individual. |
| `email` | `VARCHAR(255)` | Unique email address. |
| `role` | `VARCHAR(1)` | Role code (e.g., 'S' = Staff, 'U' = Student, 'O' = Other). |
| `project_id` | `FK (Project)` | Reference to the project the user belongs to. |

---

## 5. `bookings` Table
**Purpose**: Records reservations of items for future events.

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `booking_id` | `SERIAL (PK)` | Unique identifier for the booking. |
| `event_name` | `VARCHAR(255)` | Title of the event (e.g., "Workshop A"). |
| `item_total_id` | `FK (ItemTotal)` | The type of item being reserved. |
| `quantity` | `INTEGER` | Number of units reserved. |
| `from_date` | `DATE` | Reservation start date. |
| `to_date` | `DATE` | Reservation end date. |
| `status` | `VARCHAR(20)` | Current status (e.g., 'active', 'released'). |
| `created_at` | `TIMESTAMP` | Record creation time. |

---

## 6. `transactions` Table
**Purpose**: Tracks the actual movement (issuance and return) of assets.

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `transaction_id` | `SERIAL (PK)` | Unique identifier for the transaction. |
| `item_total_id` | `FK (ItemTotal)` | The type of item being issued. |
| `from_user_id` | `FK (User)` | The staff member authorizing/sending the item. |
| `to_user_id` | `VARCHAR(255)` | The recipient ID or name (Staff, Student, or External). |
| `quantity` | `INTEGER` | Number of units issued. |
| `transaction_type` | `VARCHAR(1)` | Type of transaction (e.g., Issue, Return). |
| `issued_date` | `DATE` | The date the item was given out. |
| `expected_return_date` | `DATE` | The date the item is due back. |
| `actual_return_date` | `DATE` | The date the item was actually returned. |
| `status` | `VARCHAR(50)` | Status (e.g., 'active', 'returned', 'overdue'). |
| `user_type` | `VARCHAR(50)` | Profile type of recipient (Staff, Student, Other). |
| `created_by` | `FK (User)` | The system user who recorded the transaction. |
| `created_at` | `TIMESTAMP` | Record creation time. |

---

## 7. `transactionlogs` Table
**Purpose**: Audit trail for tracking changes or actions performed on transactions.

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `log_id` | `SERIAL (PK)` | Unique identifier for the log entry. |
| `transaction_id` | `FK (Transaction)` | The transaction being logged. |
| `action` | `VARCHAR(100)` | The action performed (e.g., "Asset Returned"). |
| `action_by` | `FK (User)` | The user who performed the action. |
| `timestamp` | `TIMESTAMP` | When the action occurred. |
| `remarks` | `TEXT` | Optional notes or justification. |
