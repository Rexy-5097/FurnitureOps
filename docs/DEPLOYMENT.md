# FurnitureOps Deployment Manual

This guide outlines the steps to deploy FurnitureOps to production on Vercel.

## 1. GitHub Push

Initialize and push your code to a **PRIVATE** GitHub repository.

```bash
git init
git add .
git commit -m "Production Ready"
# Create a PRIVATE repository on GitHub, then:
git remote add origin <your-repo-url>
git push -u origin main
```

## 2. Vercel Setup

1.  Log in to [vercel.com](https://vercel.com).
2.  Click **Add New Project**.
3.  **Import** the `furniture-ops` repository from GitHub.
4.  **Framework Preset**: Ensure `Next.js` is selected (it should be auto-detected).

## 3. Environment Variables (CRITICAL)

You must configure the following environment variables in Vercel under **Settings > Environment Variables**.

| Variable                        | Description                 | Source                              |
| :------------------------------ | :-------------------------- | :---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase Project URL   | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Anon Key             | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY`     | **SECRET** Service Role Key | Supabase Dashboard > Settings > API |

> [!WARNING]
> **⚠ SERVICE ROLE KEY MUST NEVER BE EXPOSED**
> Do **NOT** prefix `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`. If you do, it will be exposed to the browser, allowing anyone to bypass security and wipe your database.

## 4. Region Selection

The Supabase database is provisioned in **Oceania (Sydney)**.

- **Vercel Function Region**: Set to **`syd1` (Sydney, Australia)**.
- **Why?**: Hosting the Vercel functions involved in server-side rendering and API routes close to the database minimizes latency. Mismatched regions (e.g., Vercel in US, DB in Sydney) can cause slow page loads and API timeouts.

## 5. Post-Deployment Verification

Once deployed, perform the following production QA checks:

- [ ] **Visit Vercel URL**: Ensure the site loads with SSL (https).
- [ ] **Guest View**: Verify "Admin Tools" are hidden.
- [ ] **Login**: Authenticate with `admin@furnitureops.com`.
- [ ] **Inventory Grid**: Confirm items load from the database.
- [ ] **Create Item**: Test adding a new furniture item.
  - [ ] **Image Upload**: Verify the image is uploaded to Supabase Storage and displayed.
- [ ] **Delete Item**: Test deleting an item.
- [ ] **Admin Tools**:
  - [ ] **Audit Logs**: Open Settings -> Audit Logs and confirm recent actions are logged.
  - [ ] **Kill Switch**: (Optional but recommended for final sign-off) Go to Danger Zone, type the code, and reset system.
