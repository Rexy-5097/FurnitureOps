# Architecture Design for FurnitureOps

## SECTION 1: Database Schema (PostgreSQL)

### Table: inventory

```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  origin TEXT,
  price NUMERIC NOT NULL CHECK (price > 0),
  quantity_available INTEGER DEFAULT 0 CHECK (quantity_available >= 0),
  quantity_sold INTEGER DEFAULT 0 CHECK (quantity_sold >= 0),
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Constraint: Ensure atomic stock updates through application logic or DB functions.
-- Constraint: Non-negative inventory enforced by CHECK constraints.
```

### Table: audit_logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL, -- Examples: CREATE_ITEM, UPDATE_ITEM, KILL_SWITCH
  details JSONB, -- Stores structured metadata about the action
  actor_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Constraint: Audit logs must be immutable (enforced by RLS below).
```

## SECTION 2: Security Model (Row Level Security)

### Constraints

- The system is private.
- Only authenticated users may read data.
- Only the Admin may modify data.

### Definitions

- **Admin**: Determined by a specific claim or role in `auth.users`, or simply checking if the user is authenticated if single-user mode is strictly assumed as per SRS "Single-admin system". For this architecture, we assume _any authenticated user_ is the Admin given the "Single-admin system" constraint, or checks against specific Admin ID if multi-user expansion occurs.

### Policies

#### `inventory`

- **SELECT**: Authenticated users can read.
  - _SQL Pseudo-code_: `auth.role() = 'authenticated'`
- **INSERT**: Admin only.
  - _SQL Pseudo-code_: `auth.role() = 'authenticated'` (assuming single admin)
- **UPDATE**: Admin only.
  - _SQL Pseudo-code_: `auth.role() = 'authenticated'`
- **DELETE**: Admin only.
  - _SQL Pseudo-code_: `auth.role() = 'authenticated'`

#### `audit_logs`

- **INSERT**: Authenticated users.
  - _SQL Pseudo-code_: `auth.role() = 'authenticated'`
- **SELECT**: Admin only.
  - _SQL Pseudo-code_: `auth.role() = 'authenticated'`
- **UPDATE**: NOT ALLOWED.
  - _SQL Pseudo-code_: `false`
- **DELETE**: NOT ALLOWED.
  - _SQL Pseudo-code_: `false`

## SECTION 3: Storage Architecture (Supabase Storage)

### Bucket Configuration

- **Bucket name**: `furniture-images`

### Folder Structure

- `/{user_id}/{timestamp}_{filename}`
- **Rationale**: Prevents file name collisions and ensures organization by uploader.

### Policies

- **Upload**: Only authenticated users.
- **Download**: Only authenticated users.
- **Public Access**: FALSE. Images are NOT publicly accessible.

## SECTION 4: API Route Structure (Next.js App Router)

### Endpoints

- `GET /api/inventory`
  - Fetch all items.
  - Supports search (`?search=`) and filter (`?origin=`) query params.

- `POST /api/inventory`
  - Create new inventory item.

- `PATCH /api/inventory/[id]`
  - Update price or quantity.

- `DELETE /api/inventory/[id]`
  - Delete a single item.

- `POST /api/admin/kill-switch`
  - Dangerous operation.
  - Requires `confirmation_code` in request body.
  - Must log action in `audit_logs`.
