# QA Manual Test Plan

## Overview

**Project**: FurnitureOps  
**Version**: 1.0.0 (Phase 6 Candidate)  
**Date**: 2026-02-11

This checklist covers all critical paths for the FurnitureOps production release.

## Test Cases

| ID          | Feature            | Test Case                | Steps                                                                                                              | Expected Result                                                                                                                     | Status |
| ----------- | ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **AUTH-01** | **Authentication** | Guest Access             | 1. Open Incognito window.<br>2. Navigate to `/`.                                                                   | Dashboard loads.<br>Inventory grid is visible.<br>No "Admin Tools" button in navbar.                                                |        |
| **AUTH-02** | **Authentication** | Admin Login              | 1. Navigate to `/login`.<br>2. Enter valid credentials (admin@furnitureops.com / password).<br>3. Click "Sign In". | No errors.<br>Redirects to Dashboard (or stays on page with success state).<br>**After refresh**, "Settings" cog appears in navbar. |        |
| **INV-01**  | **Inventory**      | Create Item (Success)    | 1. Login as Admin.<br>2. Click FAB (+).<br>3. Fill form (Name, Price, Qty).<br>4. Click "Save".                    | Modal closes.<br>Grid refreshes instantly.<br>New item appears at top.                                                              |        |
| **INV-02**  | **Inventory**      | Create Item (Validation) | 1. Click FAB (+).<br>2. Leave Name empty.<br>3. Enter negative Price.<br>4. Click "Save".                          | Error message displayed in modal.<br>Save blocked.                                                                                  |        |
| **INV-03**  | **Inventory**      | Edit Item                | 1. Click on existing item.<br>2. Change Price.<br>3. Click "Save".                                                 | Modal closes.<br>Grid refreshes.<br>New price is visible.                                                                           |        |
| **INV-04**  | **Inventory**      | Delete Item              | 1. Click on existing item.<br>2. Click "Delete Item" (Red button).<br>3. Confirm browser dialog.                   | Modal closes.<br>Grid refreshes.<br>Item disappears.                                                                                |        |
| **INV-05**  | **Inventory**      | Image Upload             | 1. Create/Edit Item.<br>2. Click camera icon.<br>3. Select valid JPG/PNG.<br>4. Save.                              | Image uploads successfully.<br>Item card shows new image.                                                                           |        |
| **ADM-01**  | **Admin Tools**    | View Audit Logs          | 1. Click Settings Cog.<br>2. Select "Audit Logs" tab.                                                              | List of recent actions (CREATE, UPDATE, DELETE) appears.<br>Timestamps are correct.                                                 |        |
| **ADM-02**  | **Admin Tools**    | Kill Switch (Safe)       | 1. Go to "Danger Zone".<br>2. Type random text.<br>3. Click "RESET SYSTEM".                                        | Button disabled OR nothing happens.<br>Alert shows mismatch.                                                                        |        |
| **ADM-03**  | **Admin Tools**    | Kill Switch (Execute)    | 1. Type `DELETE-ALL-INVENTORY-PERMANENTLY`.<br>2. Click "RESET SYSTEM".<br>3. Confirm dialog.                      | Success alert.<br>Modal closes.<br>Grid becomes empty.<br>"No items found" state shown.                                             |        |
| **SEC-01**  | **Security**       | RLS Check                | 1. Run `npx tsx scripts/test-rls.ts`                                                                               | Output shows "Security Pass" for all checks.<br>No critical fails.                                                                  |        |

## Browser Compatibility

- [ ] Chrome (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (Latest)
- [ ] Mobile Viewport (iPhone/Android)

## Performance

- [ ] Lighthouse Score > 90 (Accessibility/SEO)
- [ ] Initial Load < 1.5s
