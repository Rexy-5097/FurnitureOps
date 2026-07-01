# Software Requirements Specification (SRS) for FurnitureOps

## 1. Introduction

### Purpose of the document

This document validates the functional and non-functional requirements for FurnitureOps, serving as the single source of truth for database schema design, API contract design, security rules, and PWA behavior.

### Scope of FurnitureOps

FurnitureOps is a Full-Stack Inventory Management Progressive Web App (PWA) designed for a lean development environment. It focuses on inventory tracking, image-first management, and reliable data persistence.

### Intended audience

- **Developers**: For implementation details and constraints.
- **Reviewers**: For validating compliance with requirements.

## 2. User Persona

### Primary User: Shop Owner (Admin)

- **Responsibilities**: managing inventory, updating prices, tracking stock, ensuring data accuracy.
- **Technical comfort level**: moderate; comfortable with smartphones but requires a simple, foolproof interface.
- **Usage context**: mobile-first usage within the shop floor; intermittent connectivity.

### Core Needs

1.  **Fast data entry**: minimal clicks to add or update items.
2.  **Mobile usability**: large touch targets, camera integration.
3.  **Strong data security**: protection against unauthorized access.
4.  **Zero data loss**: reliable syncing and offline capability.

## 3. Functional Requirements (Must-Haves Only)

### 3.1 Authentication

- **Email/password authentication** via Supabase.
- **Access Control**: Only authenticated users can access the system.
- **Role-Based Access**: Only Admin can perform write operations.

### 3.2 Inventory Management

- **Add Item**:
  - Name
  - Price
  - Origin
  - Quantity Available
  - Item Photo
- **Edit Item**:
  - Update stock
  - Update price
- **View Inventory**:
  - Grid-based view
  - Image-first interaction
- **Click-to-Detail**:
  - Clicking/tapping an image opens a modal.
  - Modal shows all item details instantly.
- **Search and Filter**:
  - By item name
  - By origin

### 3.3 Image Handling

- **Capture**: Must support direct camera capture on mobile devices.
- **Optimization**: Images must be compressed client-side before upload.
- **Storage**: Stored securely in cloud storage.
- **Security**: Image access must be restricted to authenticated users.

### 3.4 Administrative Kill Switch

- **Function**: Admin-only "Reset Inventory".
- **Behavior**:
  - Clear all inventory data.
  - Preserve audit logs.
- **Confirmation**: Must require secondary confirmation (e.g., typing "DELETE-ALL" or entering a secure PIN).
- **Logging**: Action must be logged and irreversible.

## 4. Non-Functional Requirements (Quality Attributes)

### Performance

- **Responsiveness**: Item detail load time must be < 200 ms under normal conditions.

### Reliability

- **Offline Support**: Application must support Offline Read-Only mode via PWA.
- **Caching**: Cached inventory must be viewable without network.

### Security

- **RLS**: Row Level Security (RLS) must be enforced.
- **Permissions**:
  - Only the Admin can Insert, Update, or Delete data.
- **Audit**: All destructive actions must be auditable.

## 5. Data Entities (High-Level, No Schema)

### Item

- **ID**
- **Name**
- **Description**
- **Price**
- **Origin**
- **Quantity Available**
- **Quantity Sold**
- **Image URL**
- **Timestamps** (created/updated)

### Audit Log

- **Actor** (who performed the action)
- **Action type**
- **Target** (what was affected)
- **Timestamp**
- _Note: Audit Logs are immutable._

## 6. Assumptions and Constraints

- **Single-admin system** (initially).
- **Internet connectivity is intermittent**.
- **Mobile devices are primary access points**.

## 7. Out of Scope (Explicit)

- Billing
- Multi-user roles
- Analytics dashboards
- Notifications
