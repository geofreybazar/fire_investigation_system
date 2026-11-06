# FIIS Requirements

> **Status: APPROVED (revision 10), approved by the project owner on 2026-10-10.**
> All items tagged PROPOSED or INTERPRETED in this revision were accepted with the approval and are binding requirements. Items tagged OPEN remain undecided and must be resolved before the feature they affect is built.
> **Revision 11 (2026-10-28):** refreshes §1.2 and §10.1 to match the code, and adds §11.5, answers to Q-01, Q-20, Q-21, Q-22 and Q-23 (audit log, notifications, statistics, incident map, attachments). All five were **approved by the project owner on 2026-10-28** and are implemented (roadmap phases 1–5, PRs #1–#6). Parts those answers left open stay OPEN: official BFP report forms (Q-20), email/SMS notifications (Q-21), attachment retention (Q-22), and the Fire Stations, Monitoring and Response Units pages (Q-01).
> **Revision 12 (2026-11-03):** adds §11.6, the owner's answers to Q-19, Q-34g, Q-41, Q-50, Q-51 and Q-52c. Q-19 is built; its migration adds three `User` columns.
> **Revision 13 (2026-11-06): investigation-only redesign, approved by the project owner on 2026-11-06.** FIIS no longer records or manages fire incidents. A chief investigator at any level opens an **investigation case** directly and assigns its first investigation. §R13 below holds the binding rules and **supersedes** every section marked *WITHDRAWN in rev 13* (§3, §4, the fire-incident rows of §2.7, §6.3, §9.6–§9.8), along with any incident-only rule elsewhere in this document. Where older text says "incident", read "case" unless the section is withdrawn. The case fields are **provisional** until the official forms from the concerned office are available.
> Last updated: 2026-11-06. Derived from `CLAUDE.md`, owner answers given on 2026-10-10 (rounds 1–9), the Prisma schema (`backend/prisma/`), backend modules (`backend/src/modules/`), frontend pages, hooks and services (`frontend/src/`), and backend unit tests.

## 0. How to read this document

Each requirement carries a status tag:

| Tag | Meaning |
|---|---|
| **CONFIRMED** | Stated by the project owner, either in `CLAUDE.md` or in the round 1–9 answers (2026-10-10). Where an owner answer changes a `CLAUDE.md` rule, the answer wins and the change is listed in D-27. |
| **IMPLEMENTED** | Present in the current code or schema. It is a description of the code, **not** approved business policy. |
| **PROPOSED** | Suggested behavior or design that needs owner approval before implementation. |
| **OPEN** | Cannot be specified until a business question in §11 is answered. |
| **INTERPRETED** | The owner's answer is recorded, but one reading of it was chosen and needs confirmation (question listed alongside). |

A requirement can carry two tags, e.g. *CONFIRMED / not implemented*.

Discrepancies between code and expected behavior are numbered `D-xx` (§10). Business questions are numbered `Q-xx` (§11).

---

## R13. Investigation-only system (revision 13, CONFIRMED 2026-11-06)

### R13.1 Scope

- **Removed:** fire incident recording, incident approval, the status and alarm timeline, rekindle, responding resources and personnel, and the incident numbering. The `FireIncident`, `IncidentLocation`, `IncidentTimeline`, `IncidentImpact`, `FireOpertaionResources`, `IncidentPersonnel` and `FireIncidentEvent` tables and their enums were dropped (development data only). The unscoped Fire Stations, Monitoring and Response Units pages (Q-01) were removed.
- **Kept unchanged:** administration (users, offices, positions, categories and subcategories), authentication, the audit log, notifications, attachments and statistics. The last four were re-pointed to cases.
- **Roles removed:** `NHQ_OPERATION`, `NHQ_OPERATION_STAFF`, `REGIONAL_OPERATION`, `REGIONAL_OPERATION_STAFF`, `DISTRICT_PROVINCE_OPERATION`, `DISTRICT_PROVINCE_OPERATION_STAFF`, `CITY_MUNICIPALITY_OPERATION`, `CITY_MUNICIPALITY_OPERATION_STAFF` and `CITY_MUNICIPALITY_COMMEL`. Accounts that held them were removed by the migration.

### R13.2 Investigation case

An `InvestigationCase` is the record of the fire being investigated. It is the parent of its investigations, referrals and case documents.

| Rule | ID |
|---|---|
| Only chief investigators (`*_CHIEF_INVESTIGATOR`, at **any** office level) and `SUPER_ADMIN` create cases. | FR-CASE-001 |
| The creator picks the **city/municipal station** where the fire happened, from the active stations within their own office's scope. Region, province/district and city/municipality are derived from that station, never taken from the client. | FR-CASE-002 |
| The case starts **handled by the creator's office**. | FR-CASE-003 |
| Creating a case also creates and assigns its first investigation (`-01`) to an active investigator of the creator's office, in one transaction. | FR-CASE-004 |
| Case fields (provisional): place of occurrence and barangay (required), optional latitude/longitude, optional fire, call-received and reported date-times, category (required) and subcategory, optional establishment, impact (casualties, establishments burned, families/individuals affected, estimated and final damages), remarks. More fields will be added from the official forms. | FR-CASE-005 |
| The creator (while still a chief investigator) or the handling office's chief investigator may edit the case fields until one of its investigations is approved. | FR-CASE-006 |
| A subcategory must belong to the case's category. | FR-CASE-007 |
| `SUPER_ADMIN` alone soft-deletes a case, giving a reason and the reference of the memo approved by the Chief, BFP. Deletion hides the case and everything connected to it. `SUPER_ADMIN` can list and restore deleted cases. Both are recorded in the audit log (`CASE_DELETED`, `CASE_RESTORED`). | FR-CASE-008 |
| The creator or the handling office's chief investigator attaches case documents. Investigation evidence stays with each investigation (assigned investigator, while open). | FR-CASE-009 |

### R13.3 Numbering

| Rule | ID |
|---|---|
| Case number `INV-YYYY-MM-<REGIONCODE>-NNNNNN`, generated inside the transaction that creates the case, from the existing per-(year, month, region code) counter in Asia/Manila time. The region code is that of the case station's region. | FR-NUM-101 |
| Investigation number `<caseNo>-NN`, the case's own sequence from `01`. | FR-NUM-102 |
| A region code is frozen once any case number has used it. | FR-NUM-103 |

### R13.4 Investigations and referrals

§5 still applies, with "incident" read as "case" and these changes:
- The `FIRE_OUT` / `FIRE_OUT_UPON_ARRIVAL` and approval gates are removed. Rekindling no longer exists.
- The referral chain is the **case station's** chain: station → district/province → region → NHQ. The handling office may refer up to any office above it in that chain, or down to any office below it in that chain, while no investigation is open (FR-INV-101).
- After an approved investigation, the handling chief may refer the case or start a further investigation (`-02`, …). At most one investigation is open at a time (FR-INV-102).
- When a station moves (Q-51), a case located at it and handled outside its new chain blocks the move until its investigations are finished. A finished case returns to the station automatically.

### R13.5 Visibility

- Every role except `NHQ_ADMIN` and `REGIONAL_ADMIN` views cases whose **station** is their own office or below it. NHQ offices and `SUPER_ADMIN` see every case. Deleted cases are visible only in the `SUPER_ADMIN` deleted listing. Out-of-scope cases return 404 (FR-CASE-010).
- Statistics, the case map and the case report count non-deleted cases in scope. Cause and classification come from each case's latest approved investigation.

### R13.6 Notifications

`INVESTIGATOR_ASSIGNED` (on case creation and on each new investigation), `CASE_REFERRED`, `REPORT_SUBMITTED`, `REPORT_APPROVED` and `REPORT_REJECTED` remain. The incident notification types and the "Incident updates" preference were removed.

---

## 1. System purpose and scope

### 1.1 Purpose

FIIS is a web application for fire investigations at the Bureau of Fire Protection (BFP), Philippines. Since revision 13, chief investigators at any level open investigation cases, assign investigators, and refer cases up and down the office hierarchy. Investigators produce reports that chief investigators approve. Access follows the BFP office hierarchy. Fire incidents are not recorded (§R13).

### 1.2 Current state of implementation

| Area | Backend | Frontend |
|---|---|---|
| Authentication (login, logout, token refresh) | Implemented | Implemented |
| Personnel (user) management | Implemented | Implemented |
| Office management | Implemented | Implemented |
| Position management | Implemented | Implemented |
| Incident classification (categories / subcategories) | Categories: full CRUD. Subcategories: create only (FR-CAT-007 in progress) | Implemented (subcategory create only) |
| Notification preferences and in-app notifications | Implemented (Q-21 approved; in-app only, no email or SMS) | Implemented (settings and navbar bell) |
| Fire incidents | **Removed in rev 13** | Removed |
| Investigation cases: create, list, edit, soft deletion and restore | Implemented (rev 13): `/api/case` | Implemented (Cases pages) |
| Investigations, referral between offices, assignment, reports | Implemented (rev 11, re-keyed to cases in rev 13) | Implemented |
| Evidence / attachments | Implemented (Q-22 approved): `/api/attachments` upload, list, download, soft removal; `case` and `investigation` targets | Implemented (attachments on case and investigation pages, Evidence page) |
| Dashboard, case map, statistics, case reports | Implemented (Q-20, Q-01 approved; rev 13): `GET /api/statistics/summary`, `cases`, `cases.csv`, `map` | Implemented |
| Monitoring, fire stations, response units | **Removed in rev 13** | Removed |
| Audit history | Referral and report-review history, plus the general `AuditLog` (Q-23 approved) | Referral and review history; Audit Log page for admins |

### 1.3 In scope

- Investigation cases opened by chief investigators, with location, classification, dates and impact (§R13).
- Soft deletion and restore of cases by `SUPER_ADMIN`.
- Investigations of cases. Chief investigators refer cases within the station's office chain, and a higher or lower office can re-investigate after an approved investigation.
- Investigation reports reviewed and approved by the handling chief investigator; approval completes and locks the investigation.
- Organizational administration (admin roles): offices, personnel, positions, classifications.
- Reporting and statistics (navigation entries exist; no defined content).

### 1.4 Out of scope / undecided

- Fire incident recording and management (removed in rev 13).
- Requests to delete cases are handled **outside** the system; `SUPER_ADMIN` records the memo reference (§R13.2).
- There is no BFP policy for case or investigation number formats; the system's own formats are used (§R13.3).

---

## 2. User roles and permissions

### 2.1 Roles

IMPLEMENTED in the `ROLE` enum (`prisma/models/user.prisma`), plus one role CONFIRMED to be added:

| Tier | Roles |
|---|---|
| System | `SUPER_ADMIN` |
| National Headquarters | `NHQ_ADMIN`, `NHQ_VIEWER`, `NHQ_CHIEF_INVESTIGATOR`, `NHQ_INVESTIGATOR` |
| Regional | `REGIONAL_ADMIN`, `REGIONAL_CHIEF_INVESTIGATOR`, `REGIONAL_INVESTIGATOR`, `REGIONAL_VIEWER` |
| District / Provincial | `DISTRICT_PROVINCE_CHIEF_INVESTIGATOR`, `DISTRICT_PROVINCE_INVESTIGATOR`, `DISTRICT_PROVINCE_VIEWER` |
| City / Municipal station | `CITY_MUNICIPALITY_INVESTIGATOR`, `CITY_MUNICIPALITY_CHIEF_INVESTIGATOR` |

The `*_OPERATION`, `*_OPERATION_STAFF` and `CITY_MUNICIPALITY_COMMEL` roles were removed in revision 13 (§R13.1). Role notes below that mention them are historical.

Admin roles are `SUPER_ADMIN`, `NHQ_ADMIN` and `REGIONAL_ADMIN`. All others are non-admin roles.

Role notes (CONFIRMED):
- `SUPER_ADMIN` is a single account held by the developer and created manually in the database, bypassing the application. No one can create or assign `SUPER_ADMIN` through the system. Its permissions:
  - **Fire incidents:** view, delete, and restore deleted incidents. It does not create, update or approve them.
  - **Investigations and reports:** full access.
  - **Administration** (users, offices, positions, classifications): full access, except creating another `SUPER_ADMIN`.
- `NHQ_ADMIN` and `REGIONAL_ADMIN` have **no access to fire incidents**. They manage users, offices and positions.
- `CITY_MUNICIPALITY_OPERATION` is the station's **chief of operations**. It approves incident creation and cannot make changes to incidents itself.
- `CITY_MUNICIPALITY_COMMEL` is a radio operator designation, with permissions identical to `CITY_MUNICIPALITY_OPERATION_STAFF`.
- Each office tier has a chief investigator role (`CITY_MUNICIPALITY_`, `DISTRICT_PROVINCE_`, `REGIONAL_`, `NHQ_CHIEF_INVESTIGATOR`). The chief investigator of the office currently handling an incident's investigation decides, refers, assigns, and approves reports (§5).

Other notes:
- The station tier still has no admin or viewer role (Q-04).
- `SUPER_ADMIN` is hidden from the frontend role picker (`frontend/src/constants/personnel.ts`), which matches the confirmed rule; the backend still accepts it (D-07).

### 2.2 Ranks (IMPLEMENTED, `RANK` enum)

`FDIR, FCSUPT, FSSUPT, FSUPT, FCINSP, FSINSP, FINSP, SFO4, SFO3, SFO2, SFO1, FO3, FO2, FO1`. Rank is informational; no permission depends on it.

### 2.3 Role → assignable office type (IMPLEMENTED, `users/utils/users.role_office.permissions.ts`)

| Role group | Office types the role may be assigned to |
|---|---|
| `SUPER_ADMIN` | Any |
| `NHQ_*` | `NATIONAL_HEADQUARTERS` |
| `REGIONAL_*` | `REGIONAL_OFFICE` |
| `DISTRICT_PROVINCE_*` | `DISTRICT_FIRE_STATION`, `PROVINCIAL_FIRE_STATION` |
| `CITY_MUNICIPALITY_*` | `CITY_FIRE_STATION`, `MUNICIPAL_FIRE_STATION` (PROPOSED to include the new `CITY_MUNICIPALITY_CHIEF_INVESTIGATOR`) |

CONFIRMED (CLAUDE.md): preserve the role × office-type permission rules.

### 2.4 Who may grant which role

CONFIRMED:
- No role can create or assign `SUPER_ADMIN`.
- `NHQ_ADMIN` can create `REGIONAL_ADMIN`; `REGIONAL_ADMIN` cannot.
- `SUPER_ADMIN` has full administration access, except creating another `SUPER_ADMIN`.

| Acting role | May create/assign | Status |
|---|---|---|
| `SUPER_ADMIN` | All roles except `SUPER_ADMIN` | CONFIRMED |
| `NHQ_ADMIN` | All roles except `SUPER_ADMIN` | CONFIRMED |
| `REGIONAL_ADMIN` | `REGIONAL_*` except `REGIONAL_ADMIN`, plus `DISTRICT_PROVINCE_*` and `CITY_MUNICIPALITY_*` (including the new chief investigator role) | CONFIRMED (exclusion) / IMPLEMENTED (rest) / PROPOSED (new role) |
| All others | None | IMPLEMENTED |

The current code violates these rules (D-07).

### 2.5 Who may manage which office type (IMPLEMENTED, `office/utils/office.permissions.ts`)

| Acting role | Office types it may create/update |
|---|---|
| `SUPER_ADMIN` | All |
| `NHQ_ADMIN` | All except `NATIONAL_HEADQUARTERS` |
| `REGIONAL_ADMIN` | District, Provincial, City, Municipal |
| All others | None |

### 2.6 Coarse endpoint access (IMPLEMENTED, `@Roles` on controllers)

| Resource | Roles allowed |
|---|---|
| Offices `/api/office_api` | `SUPER_ADMIN`, `NHQ_ADMIN`, `REGIONAL_ADMIN` |
| Positions `/api/position_api` | `SUPER_ADMIN`, `NHQ_ADMIN`, `REGIONAL_ADMIN` |
| Users: create, list, edit, activate/deactivate | `SUPER_ADMIN`, `NHQ_ADMIN`, `REGIONAL_ADMIN` |
| Users: get by id, change own password | Any authenticated user |
| Incident categories (all operations, including read) | `SUPER_ADMIN`, `NHQ_ADMIN`, `NHQ_CHIEF_INVESTIGATOR`, `NHQ_INVESTIGATOR`, `NHQ_OPERATION`, `NHQ_OPERATION_STAFF` |
| Incident subcategories: create | Same NHQ roles as categories |
| Notification settings | Any authenticated user (for any user id, D-03) |
| Fire incident `POST /api/fire-incident` | **Unauthenticated** (stub, D-01) |

### 2.7 Incident and investigation permission matrix

Definitions:
- **Scope:** the user's own office and **all offices below it** in the hierarchy (CONFIRMED).
- **Owning station:** the city/municipal station whose user created the incident.
- **Station operations group:** the owning station's `CITY_MUNICIPALITY_OPERATION_STAFF`, `CITY_MUNICIPALITY_COMMEL` and `CITY_MUNICIPALITY_OPERATION`.
- **Handling office:** the office currently responsible for deciding on, and conducting, the incident's investigation (§5.3).
- **Open investigation:** an investigation that has been assigned to an investigator and whose report is not yet approved.

**Fire incidents** *(WITHDRAWN in rev 13; see §R13.2 for cases)*

| Action | Who | Status |
|---|---|---|
| Submit an incident for creation | `CITY_MUNICIPALITY_OPERATION_STAFF`, `CITY_MUNICIPALITY_COMMEL` | CONFIRMED |
| Add timeline entries (status and/or alarm change), including while pending approval | Same, of the owning station | CONFIRMED |
| See a pending or rejected incident | Station operations group, `SUPER_ADMIN` | CONFIRMED |
| Approve or reject creation | `CITY_MUNICIPALITY_OPERATION` of the owning station | CONFIRMED |
| Edit and resubmit a rejected incident | The staff/COMMEL member who submitted it | CONFIRMED (Q-50) |
| Remove a **rejected**, never-approved incident | The staff/COMMEL member who submitted it | CONFIRMED (Q-50; pending ones cannot be removed) |
| Update an approved incident (status, alarm level, details, date fields) without approval | `CITY_MUNICIPALITY_OPERATION_STAFF`, `CITY_MUNICIPALITY_COMMEL` of the owning station | CONFIRMED |
| Make any change to an incident | **Not** `CITY_MUNICIPALITY_OPERATION`, **not** `SUPER_ADMIN` | CONFIRMED |
| View approved incidents | All non-admin roles within scope; `SUPER_ADMIN` everywhere | CONFIRMED |
| Delete an approved incident | **`SUPER_ADMIN` only**, no in-system approval | CONFIRMED |
| View and restore deleted incidents | `SUPER_ADMIN` only | CONFIRMED |
| Any access to incidents | **Not** `NHQ_ADMIN` or `REGIONAL_ADMIN` | CONFIRMED |

**Investigations** (`SUPER_ADMIN` may perform every action, CONFIRMED)

| Action | Who | Status |
|---|---|---|
| Start an investigation (create it and assign an investigator in one step) | Chief investigator of the handling office | CONFIRMED |
| Refer the case up to any office above in the chain, or down to an office below, while no investigation is open | Chief investigator of the handling office | CONFIRMED (Q-52c) |
| Do nothing (no investigation) | Chief investigator of the handling office | CONFIRMED |
| After an approved investigation, refer the case up **or down** so another office can start a new investigation | Chief investigator of the handling office | CONFIRMED |
| Be assigned | An active `*_INVESTIGATOR` of the handling office | CONFIRMED (office) / PROPOSED (active) |
| Reassign an open investigation | **No one**; it must be finished first | CONFIRMED |
| Record investigation details, write, edit and submit the report | Assigned investigator | CONFIRMED |
| Review, approve or reject the report | Chief investigator of the handling office only | CONFIRMED |
| View investigations | Non-admin roles with the incident in scope | PROPOSED (follows the incident view rule) |
| Any access to investigations | Not `NHQ_ADMIN` / `REGIONAL_ADMIN` | INTERPRETED from "no access to the fire incidents" (Q-48c) |

---

## 3. Fire incident management and status lifecycle

> **WITHDRAWN in rev 13.** Kept for history only; see §R13.

### 3.1 Confirmed rules

From `CLAUDE.md`:
- FireIncident is the authoritative incident record.
- Incident location is required at creation and persisted with the incident.
- Status values use the enum identifiers `VERIFICATION`, `ON_GOING`, `FIRE_UNDER_CONTROL`, `FIRE_OUT`, `FIRE_OUT_UPON_ARRIVAL`, `FALSE_ALARM`. Round 4 approved adding **`REKINDLE`**.
- Status transitions are validated in the backend, not the frontend.
- Incident history and audit information are preserved when status changes.

From rounds 1–6:
- An incident is owned by the office of the user who adds it. Only station staff/COMMEL can add incidents, so **every incident is owned by a city or municipal station**.
- **Only creation needs approval**, by the owning station's `CITY_MUNICIPALITY_OPERATION`. Updates do not.
- Deleting means **hiding** the incident and all its connected data. `SUPER_ADMIN` can restore it.
- The incident date fields are **optional**, because reporting is often delayed.
- The current alarm is `FireIncident.currentAlarmLevel`. It changes only when staff or COMMEL add a timeline entry, and it **only goes up**, from `FIRST_ALARM` towards `GENERAL_ALARM`. Levels can be skipped. **A rekindle has no new alarm.**
- An `IncidentTimeline` entry is created for every status change and every alarm-level change. **Saved entries can be corrected or voided.**
- The timeline time (`occurredAt`) is entered by the user. The record's `createdAt` / `updatedAt` are set by the server.
- The previous status is determined **chronologically by event time (`occurredAt`)**, not by the order records were saved.

### 3.2 Data captured (IMPLEMENTED in schema, `prisma/models/fireIncident/`)

| Group | Fields / model |
|---|---|
| Identity | `incidentNo` (unique, currently required) |
| Times | `dateTimeReported`, `dateTimeFireIncident`, `dateTimeCallReceived`, `dateTimeUnresponded`. All **optional** (CONFIRMED) and can be filled in later. The meaning of "unresponded" is unclear (Q-09b). |
| State | `fireIncidentStatus` (required), `currentAlarmLevel` (optional, `FireAlarmLevel`) |
| Classification | `categoryId` (required), `subcategoryId` (optional) |
| Establishment | optional `Establishment` (name, owner, occupant, BIN/BAN no. (unique), floor area, storeys, content storage) |
| Creator | `createdById` (User) |
| Related 1:1 | `IncidentLocation`, `IncidentImpact` (casualties by civilian/BFP/LEA, establishments burned, families/individuals affected, estimated and final damages), `FireOpertaionResources` (trucks and ambulances by ownership/manning), `IncidentPersonnel` (ground commander, arson investigator, sender as free text) |
| Related 1:N | `IncidentTimeline` (status, alarm level, `occurredAt`, remarks, `createdById`, `createdAt`) |
| Related | `Investigation` (currently 1:1; becomes 1:N, §5) |
| Other | `remarks` |

### 3.3 Status lifecycle

CONFIRMED (rounds 1–5):
- The normal progression is `VERIFICATION → ON_GOING → FIRE_UNDER_CONTROL → FIRE_OUT`.
- `FIRE_OUT`, `FIRE_OUT_UPON_ARRIVAL` and `FALSE_ALARM` are completed statuses.
- An incident can start as `VERIFICATION`, `FALSE_ALARM`, `ON_GOING` or `FIRE_OUT_UPON_ARRIVAL`.
- Among `VERIFICATION`, `ON_GOING` and `FIRE_UNDER_CONTROL`, statuses may be skipped and may move backwards, as long as every change is recorded with a timestamp.
- **`FIRE_OUT` cannot move backwards**; its only next status is `REKINDLE`.
- **`REKINDLE`** can only follow `FIRE_OUT`, and only `FIRE_OUT` can follow `REKINDLE`. An incident **may rekindle multiple times**. `REKINDLE` counts as its own category, and an existing investigation continues unaffected.
- `FIRE_OUT_UPON_ARRIVAL` and `FALSE_ALARM` are **final**: no further status changes.
- `FIRE_OUT_UPON_ARRIVAL` is allowed only as the initial status or directly after `VERIFICATION`, and only when no alarm has been raised or the alarm is `FIRST_ALARM`.
- `FALSE_ALARM` is allowed only as the initial status or directly after `VERIFICATION`.

Transition table (all CONFIRMED):

| From \ To | `VERIFICATION` | `ON_GOING` | `FIRE_UNDER_CONTROL` | `FIRE_OUT` | `FIRE_OUT_UPON_ARRIVAL` | `FALSE_ALARM` | `REKINDLE` |
|---|---|---|---|---|---|---|---|
| *(new incident)* | ✅ | ✅ | ❌ | ❌ | ✅ (alarm none / 1st) | ✅ | ❌ |
| `VERIFICATION` | — | ✅ | ✅ | ✅ | ✅ (alarm none / 1st) | ✅ | ❌ |
| `ON_GOING` | ✅ | — | ✅ | ✅ | ❌ | ❌ | ❌ |
| `FIRE_UNDER_CONTROL` | ✅ | ✅ | — | ✅ | ❌ | ❌ | ❌ |
| `FIRE_OUT` | ❌ | ❌ | ❌ | — | ❌ | ❌ | ✅ |
| `FIRE_OUT_UPON_ARRIVAL` | ❌ | ❌ | ❌ | ❌ | — | ❌ | ❌ |
| `FALSE_ALARM` | ❌ | ❌ | ❌ | ❌ | ❌ | — | ❌ |
| `REKINDLE` | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | — |

Consequences:
- An incident that has reached `FIRE_OUT` alternates between `FIRE_OUT` and `REKINDLE` from then on.
- While an incident is in `REKINDLE`, no investigation can be started and no case can be referred (§5.4); an open investigation keeps running.
- Adding `REKINDLE` requires an enum migration (D-30) and an update to the lifecycle list in `CLAUDE.md` (D-27).

### 3.4 Alarm level

CONFIRMED:
- The alarm level goes **up**, from `FIRST_ALARM` towards `GENERAL_ALARM`, and **levels can be skipped**.
- It changes only when `CITY_MUNICIPALITY_OPERATION_STAFF` or `CITY_MUNICIPALITY_COMMEL` add a timeline entry.
- **A rekindle has no new alarm.**

Order, INTERPRETED as the enum declaration order (no objection raised; Q-10c):

`(none) < FIRST_ALARM < SECOND_ALARM < THIRD_ALARM < FOURTH_ALARM < FIFTH_ALARM < TASK_FORCE_ALPHA < TASK_FORCE_BRAVO < TASK_FORCE_CHARLIE < TASK_FORCE_DELTA < GENERAL_ALARM`

Rules:

| Rule | Status |
|---|---|
| A timeline entry may keep the alarm level or raise it; lowering it returns 400. | CONFIRMED ("can go up") / INTERPRETED (never down) |
| Levels may be skipped (e.g. `FIRST_ALARM → THIRD_ALARM`). | CONFIRMED |
| `FIRE_OUT_UPON_ARRIVAL` requires the alarm to be none or `FIRST_ALARM` at that point. | CONFIRMED |
| The `REKINDLE` entry and the `FIRE_OUT` entry that follows it keep the alarm level unchanged; an alarm change on those entries returns 400. | CONFIRMED ("rekindle won't have new alarm") / INTERPRETED (applies to the `FIRE_OUT` after it too) |
| Alarm changes are not allowed on `FIRE_OUT_UPON_ARRIVAL` or `FALSE_ALARM` incidents (they are final). | PROPOSED |
| With backdated entries, the "only up" rule is checked against the chronological neighbours (§3.5). | PROPOSED |

### 3.5 Timeline and timestamps

CONFIRMED:
- Every status change and every alarm-level change creates an `IncidentTimeline` entry.
- `occurredAt` is entered by the user; `createdAt` (and `updatedAt` where present) are set by the server.
- Previous and current status are determined by `occurredAt` order, not by save order.

PROPOSED rules for backdated entries (follow from ordering by event time):
- Entries are ordered by `occurredAt`; ties are broken by `createdAt`.
- A new entry is validated against its **chronological neighbours**. For both status and alarm, the step from the previous entry to the new one must be allowed, and so must the step from the new one to the next entry (if any). If either fails, the entry is rejected (400).
- The alarm-level condition for `FIRE_OUT_UPON_ARRIVAL` uses the alarm level in effect just before the new entry's `occurredAt`.
- `FireIncident.fireIncidentStatus` and `currentAlarmLevel` always equal the chronologically latest entry, updated in the same transaction as the insert.
- `occurredAt` cannot be in the future.

**Corrections.** CONFIRMED: a saved timeline entry can be corrected or voided.

PROPOSED design, which keeps the history CLAUDE.md requires:
- The original entry is never overwritten or erased.
- A **void** marks the entry `voidedAt`, `voidedById` and `voidReason`. Voided entries stay visible in the history but are ignored when working out the current status and alarm.
- A **correction** voids the original and adds a replacement entry that links to it (`correctsEntryId`), in one transaction.
- The remaining (non-voided) timeline must still pass every rule in §3.3–3.5 after the change; otherwise the correction or void is rejected (400).
- `FireIncident.fireIncidentStatus` and `currentAlarmLevel` are recomputed in the same transaction.
- A correction or void that would move the incident out of `FIRE_OUT` / `FIRE_OUT_UPON_ARRIVAL` while it has an investigation is rejected (409). Otherwise the investigation's precondition would silently stop being true.

CONFIRMED (round 8): corrections and voids are made by the owning station's `CITY_MUNICIPALITY_OPERATION_STAFF` and `CITY_MUNICIPALITY_COMMEL`, the same people who add entries. No time limit was set (INTERPRETED); the investigation guard above is the only freeze.

### 3.6 Organizational ownership

CONFIRMED: the owning office is the office of the user who adds the incident. `FireIncident` currently has no office field (D-02). PROPOSED: add `officeId`, set by the backend from the submitter's office at creation, never from client input, so later changes to the submitter's assignment don't move the incident.

### 3.7 Creation approval

CONFIRMED:
1. `CITY_MUNICIPALITY_OPERATION_STAFF` or `CITY_MUNICIPALITY_COMMEL` submits the incident.
2. While approval is pending, staff/COMMEL can add timeline entries.
3. A `CITY_MUNICIPALITY_OPERATION` of the same station approves or rejects it.
4. A rejected incident can be edited and resubmitted, or removed by station staff. **Only rejected incidents can be removed this way; pending ones cannot.**
5. Pending and rejected incidents are visible only to the station operations group and `SUPER_ADMIN`.

PROPOSED design:
- Add an approval state to `FireIncident` (`PENDING`, `APPROVED`, `REJECTED`) with submitter, approver, decision time and rejection remarks. Keep a history of decisions across resubmissions.
- Once an incident is `APPROVED`, it can never return to `PENDING` or `REJECTED`.
- Assign `incidentNo` on approval, inside the approval transaction, using the existing generator. `incidentNo` becomes nullable until approval (D-28). Rejected and removed incidents consume no number.
- Status and alarm changes on a pending incident follow the same rules (§3.3–3.5).
- Pending, rejected and removed incidents are excluded from incident lists for everyone outside the station operations group, and from statistics.
- Removing a rejected incident is a soft delete, like `SUPER_ADMIN` deletion (§3.8) (INTERPRETED).

Answered 2026-11-03 (§11.6):
- **Q-50:** Only the original submitter can edit, resubmit or remove a rejected incident. If the submitter has left, `SUPER_ADMIN` can clear it and the station submits a new one.
- **Q-34g:** One approval is enough. With no active `CITY_MUNICIPALITY_OPERATION`, the incident stays pending until an admin provides one.

### 3.8 Deletion and restore

CONFIRMED:
- An **approved** incident can be deleted only by `SUPER_ADMIN`. There is no in-system approval; the request is a physical letter memo from the station, manually approved by the Chief of the BFP.
- A **rejected**, never-approved incident can be removed by station staff (§3.7).
- Deletion **hides** the incident and **all data connected to it**: location, timeline, impact, resources, personnel, investigations, reports and attachments. Nothing is physically erased.
- `SUPER_ADMIN` can see deleted incidents and **restore** them.

PROPOSED:
- Add `deletedAt`, `deletedById` and a deletion reason to `FireIncident`. For `SUPER_ADMIN` deletions, the reason includes the memo reference and Chief BFP approval details.
- Children are hidden through the parent's `deletedAt`, so a single flag hides and restores everything consistently. Every incident and investigation query filters out deleted incidents, except `SUPER_ADMIN`'s deleted-items view.
- Restore clears `deletedAt` and records who restored it and when. The incident returns with its original number and approval state.
- Incident and investigation numbers of deleted incidents are never reused.

---

## 4. Incident location requirements

> **WITHDRAWN in rev 13.** Kept for history only; see §R13.

### 4.1 Confirmed

- Location is required when creating an incident and must be persisted with it. (CONFIRMED)
- Follow the existing `IncidentLocation` relationship and validation conventions. (CONFIRMED)
- **The location is based on the submitting user's office.** Only city/municipal operation staff and COMMEL add or edit incidents, so the region, province/district and city/municipality come from their station's place in the office hierarchy. (CONFIRMED, round 8)
- **Latitude and longitude are added** for future mapping. (CONFIRMED)

### 4.2 Location fields

| Field | Source | Required | Status |
|---|---|---|---|
| `region` | Name of the station's Regional Office (`office.regionId`) | Yes | CONFIRMED (from office) / PROPOSED (field mapping) |
| `province_district` | Name of the station's parent District/Provincial office (`office.parentId`) | Yes (always derivable) | CONFIRMED (from office) / PROPOSED (field mapping, now always filled) |
| `city_municipality` | Name of the station itself | Yes (always derivable) | CONFIRMED (from office) / PROPOSED (field mapping, now always filled) |
| `barangay` (new) | Typed by the user | Yes | CONFIRMED (own field, typed) / PROPOSED (required) |
| `placeOfOccurence` (sic) | Typed by the user: street, building, landmark | Yes | CONFIRMED (typed by user) / IMPLEMENTED (required) |
| `latitude`, `longitude` (new) | Entered by the user, or picked on a map later | No | CONFIRMED (added, optional) |
| `fireIncidentId` | — | Yes, unique (1:1 with incident) | IMPLEMENTED |

PROPOSED rules:
- The backend fills `region`, `province_district` and `city_municipality` from the submitter's office when the incident is created. Client-supplied values for these fields are ignored. A station can therefore never record a fire outside its own hierarchy.
- The three office-derived values are stored as **text snapshots** at creation time, matching the existing columns. Renaming or re-parenting an office later doesn't rewrite past incidents. Scope and statistics by office use `FireIncident.officeId` (§3.6), not these strings.
- `latitude` is a decimal in [-90, 90] and `longitude` in [-180, 180] (e.g. `Decimal(9,6)`). If one is given, both are required. Station staff/COMMEL can add or change them later as a normal update.
- `barangay` is free text and trimmed. It's required, since every fire location is in a barangay (PROPOSED; a reference list is not required).

### 4.3 Discrepancies and gaps

- The relation is optional on the `FireIncident` side (`location IncidentLocation?`), so the database does not enforce "location required". It must be enforced by creating both records in one transaction (D-04).
- The incident Zod schema (`fire-incident/schema/fire-incident.schema.ts`) has no location fields (D-01).
- `IncidentLocation` has no `latitude` / `longitude` columns, and `province_district` / `city_municipality` are nullable although they are now always derivable (D-31).

---

## 5. Fire investigation workflows

### 5.1 Confirmed

From `CLAUDE.md` (as amended by rounds 5–6):
- Follow the FireIncident ↔ Investigation relationship. Round 5 **approved changing it to several investigations per incident**, so the unique `fireIncidentId` constraint is removed (D-29).
- Keep incident lifecycle state separate from investigation fields (cause, classification, origin, investigation dates).
- Do not invent completion rules or classifications.

From rounds 1–6:
- Investigation is **optional**.
- An investigation can only be started when the incident's status is **`FIRE_OUT` or `FIRE_OUT_UPON_ARRIVAL`**.
- Once the incident is completed, the handling office's chief investigator has three options:
  1. **Start an investigation** by assigning an investigator.
  2. **Refer the case** to another office.
  3. **Do nothing.**
- **An investigation starts when it is assigned to an investigator.** Creating the investigation and assigning it happen together.
- **An open investigation cannot be reassigned**; it must be finished first.
- **A user with an active investigation cannot be deactivated.**
- A chief investigator can refer a case directly to any higher level, but only within the hierarchy their office belongs to. They can also bring it back down to an office below.
- **A case cannot be referred while an investigation is active (open).**
- After referral, **only the new handling office's chief investigator** acts on the case, and the investigator **must be from the handling office**.
- After an investigation's report is approved, the chief investigator may refer the case **up or down**, and the receiving office can **conduct a new investigation**.
- **Several investigations per incident are allowed, with only one open at a time.** Earlier investigations stay locked.
- **For statistics, the latest completed investigation replaces earlier ones**, whichever office conducted it.
- The assigned investigator records the investigation and writes and submits the report.
- **`classification` and `causeOfFire` must no longer be `UNDER_INVESTIGATION` when the report is approved.**
- Only the handling chief investigator reviews, approves or rejects the report. A rejected report goes back to the investigator for editing and resubmission.
- An approved report is locked, and approval completes the investigation.
- If the incident is rekindled, an open investigation continues.

### 5.2 Current schema (IMPLEMENTED)

**Investigation**: `investigationNo` (unique, no generator exists), `causeOfFire` (`CauseOfFire`, 39 values), `classification` (`FireCaseClassification`: `UNDER_INVESTIGATION`, `ACCIDENTAL`, `INCENDIARY_INTENTIONAL`, `NATURAL`, `FIRE_CASE_WITH_NEGLIGENT_ACTS`), `originOfFire` (text), `startedAt`, `completedAt`, `fireIncidentId` (**unique**, to be removed).

**InvestigationReport** (1:1 with Investigation): `findings`, `cause`, `conclusion`, `recommendations`, `status` (`ReportStatus`: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`), `submittedAt`, `reviewedAt`.

### 5.3 Proposed data model

Because a case can be referred before any investigation exists, and each office that investigates produces its own investigation, the case's location and each investigation are tracked separately.

**Case handling (on the incident), PROPOSED:**
- `FireIncident.investigationHandlingOfficeId`: the office currently responsible. It is set to the owning station when the incident first reaches `FIRE_OUT` or `FIRE_OUT_UPON_ARRIVAL` (INTERPRETED: the station chief is the first to decide).
- `InvestigationReferral` history: incident, from office, to office, direction (up/down), referred by, referred at, remarks.

**Investigation (one per conducted investigation), PROPOSED changes:**
- `fireIncidentId`: **no longer unique**, indexed.
- `investigationNo`: generated when the investigation is started (§9.8).
- `conductingOfficeId`: the handling office at the time it was started.
- `assignedInvestigatorId` and `assignedById`. Both are fixed for the life of the investigation, since reassignment is not allowed.
- `startedAt` = assignment time (CONFIRMED: starting = assigning).
- `completedAt` = report approval time (CONFIRMED).

**InvestigationReport:** stays 1:1 with its investigation. Add the reviewer (`User`), rejection remarks and a decision history.

**"One open investigation at a time":** an investigation is open when `startedAt` is set and `completedAt` is null. Prisma can't express a partial unique index, so enforce it in the start-investigation transaction (lock the incident row, check for an open investigation). Optionally also add a raw-SQL partial unique index in the migration.

**Statistics:** cause, classification and origin for an incident come from its **latest completed investigation** (latest `completedAt`). Earlier investigations remain visible but don't count (CONFIRMED).

### 5.4 Referral rules

Using the chain *owning station → district/provincial → regional → NHQ*:

| Rule | Status |
|---|---|
| Referral and starting an investigation require the incident status to be `FIRE_OUT` or `FIRE_OUT_UPON_ARRIVAL`. | CONFIRMED (start) / PROPOSED (referral) |
| The handling office's chief investigator may refer the case to **any** ancestor of the handling office, skipping levels. | CONFIRMED |
| Referral to an office outside the chain (another region, a sibling district) is rejected. | CONFIRMED |
| The handling office's chief investigator may refer the case down to an office below it, within the owning station's chain. | CONFIRMED (limited to the owning station's chain, Q-52c) |
| No referral while an investigation is open (assigned and not yet approved) (400). | CONFIRMED |
| After an approved investigation, the handling chief may refer the case up **or down**; the new handling office may then start a new investigation. | CONFIRMED |
| After referral, only the new handling office's chief investigator can start, refer, or decide on reports. | CONFIRMED |
| The assigned investigator must be an active `*_INVESTIGATOR` of the handling office. | CONFIRMED (office) / PROPOSED (active check) |

Because cases only move along the owning station's chain, the handling office is always the owning station or one of its ancestors. Its users therefore already have the incident in scope (§6.3).

### 5.5 Workflow

```
Incident reaches FIRE_OUT or FIRE_OUT_UPON_ARRIVAL
        │
        ▼
Handling office = owning station
        │
        ▼
Handling chief investigator decides:
   ├──► do nothing (end, until someone acts)
   ├──► refer up (any ancestor) / down (office below) ──► new handling office decides (loop)
   └──► start investigation = create + assign investigator of the handling office
        (startedAt, investigationNo generated; no reassignment, no referral until approved)
                │
                ▼
        Investigator records details + report (DRAFT) ──► submits (SUBMITTED)
                │
                ▼
        Handling chief reviews (UNDER_REVIEW)
                ├──► REJECTED ──► investigator edits ──► resubmits
                └──► APPROVED (only if classification and causeOfFire ≠ UNDER_INVESTIGATION):
                     report and investigation locked (completedAt)
                          │
                          └──► (optional) handling chief refers up or down ──► that office decides (loop)
```

OPEN:
- Relationship between `Investigation.causeOfFire` (enum) and `InvestigationReport.cause` (free text).

---

## 6. Office hierarchy and organizational access restrictions

### 6.1 Hierarchy (CONFIRMED in CLAUDE.md; IMPLEMENTED in `office/utils/office-heirarchy.validator.ts`)

| Office type | Allowed parent |
|---|---|
| `NATIONAL_HEADQUARTERS` | None |
| `REGIONAL_OFFICE` | `NATIONAL_HEADQUARTERS` |
| `DISTRICT_FIRE_STATION`, `PROVINCIAL_FIRE_STATION` | `REGIONAL_OFFICE` |
| `CITY_FIRE_STATION`, `MUNICIPAL_FIRE_STATION` | `DISTRICT_FIRE_STATION` or `PROVINCIAL_FIRE_STATION` |

Every non-NHQ office must have a parent.

### 6.2 Region scope (IMPLEMENTED)

- Each office below regional level stores `regionId`, the id of its ancestor Regional Office, computed from the parent on create/update.
- Only Regional Offices carry a `regionCode`, which is required for them, forbidden for others, unique, and stored trimmed and upper-cased.
- `REGIONAL_ADMIN` office listings are limited to their own office plus offices whose `regionId` equals their office.

### 6.3 Incident visibility

> **WITHDRAWN in rev 13.** Kept for history only; see §R13.

CONFIRMED:
- Non-admin roles can view **approved** fire incidents of their own office and all offices below it.
- Pending and rejected incidents are visible only to the station operations group and `SUPER_ADMIN`.
- Deleted incidents are visible only to `SUPER_ADMIN`.
- `NHQ_ADMIN` and `REGIONAL_ADMIN` have no incident access. `SUPER_ADMIN` can view all incidents.

| User's office | Approved incidents visible to non-admin roles |
|---|---|
| National Headquarters | All incidents nationwide |
| Regional Office | All stations in the region |
| District / Provincial | All its city/municipal stations |
| City / Municipal station | Own station only |

Implementation notes (PROPOSED):
- District/provincial scope can't be derived from `regionId`. It needs the station's `parentId`, or a full ancestor lookup.
- The same ancestor lookup validates referral targets (§5.4).

CONFIRMED (CLAUDE.md): enforced in the backend on every read, including list, detail, investigations, reports and attachments, never only by hiding UI.

### 6.4 Current gaps (see §10)

Region scoping is only applied to office **listings**. It is not applied to office update/delete, user listing, user edit/status change, user creation target office, or office parent selection (D-08 to D-11).

---

## 7. Authentication and authorization expectations

### 7.1 Confirmed (CLAUDE.md)

- Preserve httpOnly-cookie authentication and refresh-token rotation.
- Enforce authentication, role permissions, and office scope in the backend; hiding UI is not authorization.
- Use `AuthGuard`, `RoleGuard`, `@Roles()`, `@CurrentUser()` and authorization services.
- Never expose password hashes, refresh tokens, JWTs or secrets in responses or logs.
- `AuthGuard` failures return `error: "TOKEN_EXPIRED"`; the frontend relies on that string.

### 7.2 Current behavior (IMPLEMENTED)

- Login with `account_number` + `password` (bcrypt). Sets `access_token` (15 min) and `refresh_token` (7 days) cookies: httpOnly, `sameSite=strict`, `secure` in production.
- Refresh tokens are stored in `RefreshToken` and rotated on `POST /api/auth/refresh_token` (new token stored, old deleted).
- Logout deletes the stored refresh token.
- New users get the shared `DEFAULT_PASSWORD`. Password change requires the current password; the new one must be ≥12 characters with upper, lower, digit and special character.
- Frontend: one shared refresh call on `TOKEN_EXPIRED`, then retry; redirects to `/login` on `Unauthorized`. The user object is cached in `localStorage`.

### 7.3 Gaps (see §10)

Inactive users can log in and refresh (D-12). The login and create-user responses include the password hash, which the frontend stores in `localStorage` (D-06). Logout does not clear cookies (D-13). Refresh tokens are stored in plaintext (D-14). There was no forced password change after the default password (resolved 2026-11-03, FR-AUTH-010).

Role and office come from the JWT. A role or office change takes effect only on the next token refresh (up to 15 minutes). This matters for approval, assignment, referral and report-approval rights; the owner accepted the delay (Q-41).

### 7.4 `SUPER_ADMIN` account

CONFIRMED: created manually by the developer outside the application. For incidents, it can view, delete and restore. It has full access to investigations, reports and administration, except creating another `SUPER_ADMIN`.

PROPOSED:
- Document the manual creation procedure (seed script or SQL, bcrypt hash) outside the repository's public docs.
- The account is subject to the same login, refresh and deactivation rules as everyone else.
- Every `SUPER_ADMIN` write is audited (FR-AUD-003).
- For investigations, authorization skips the role and handling-office checks for `SUPER_ADMIN`, but **not** the data-integrity rules: start preconditions, one open investigation at a time, no reassignment, referral blocked while open, the approval precondition on classification and cause, and locked approved reports.

---

## 8. Reporting, notifications, attachments and audit history

| Capability | Status | Notes |
|---|---|---|
| Incident reports / statistics | **IMPLEMENTED** (Q-20, Q-01 approved 2026-10-28) | Statistics page (totals, active, rekindled, investigated; casualties and damages; by month, status, category type, category, alarm, child office, cause and classification), incident report table with CSV export (up to 10,000 rows per file), incident map, and dashboard KPIs and "my tasks". Only approved, non-deleted incidents within the viewer's scope count. The incident date is the fire's date, or the recording date when blank (Asia/Manila months). `REKINDLE` counts as its own category (incidents that rekindled at least once). Causes and classifications use the latest completed investigation. Official BFP report forms stay OPEN. |
| Notification preferences | IMPLEMENTED | Per user: `incidentUpdates`, `investigationUpdates`, `reportReview`, `systemAnnouncements` (default on). Created with the user. |
| Notification delivery | **IMPLEMENTED** in-app (Q-21 approved 2026-10-28) | `Notification` inbox per user, sent after the change commits (best effort; a failure never undoes the change). Triggers and recipients as in §11.5 Q-21, filtered by preference; the actor is never notified. Email and SMS remain OPEN. |
| Attachments / evidence | **IMPLEMENTED** (Q-22 approved 2026-10-28) | Incident attachments by the owning station's staff/COMMEL; investigation evidence by the assigned investigator while the investigation is open (locked after approval). JPEG, PNG, WebP and PDF up to 20 MB, recognised by file signature (the declared type is ignored); a SHA-256 hash is stored. Files live on server disk outside the web root (`UPLOAD_DIR`) under random keys and are only served as downloads through an endpoint that applies the incident's visibility; every download is audited. Removal is soft, by the uploader. Attachments are hidden and restored with their incident. Retention period stays OPEN. |
| Incident status/alarm history | Schema only | `IncidentTimeline` records status, alarm level, user-entered `occurredAt`, remarks, creator and server `createdAt`. One entry per status or alarm change; ordered by `occurredAt` (CONFIRMED). `createdById` has no FK to `User` (D-15). |
| General audit log | **IMPLEMENTED** (Q-23 approved 2026-10-28) | `AuditLog` records every change to users, roles, offices, positions and categories, and SUPER_ADMIN incident deletion and restore, in the same transaction as the change (field changes only, never passwords or tokens). Incident and investigation workflow history stays in the timeline, event, referral and review tables. Read through `GET /api/audit`, scoped as in §11.5 Q-23. Attachment downloads join it with Phase 5. |

---

## 9. Functional requirements

### 9.1 Authentication (FR-AUTH)

| ID | Requirement | Status |
|---|---|---|
| FR-AUTH-001 | Users log in with account number and password; credentials are verified against a bcrypt hash. | IMPLEMENTED |
| FR-AUTH-002 | On login, issue a 15-minute access token and a 7-day refresh token as httpOnly cookies. | CONFIRMED / IMPLEMENTED |
| FR-AUTH-003 | Refresh tokens are persisted and rotated on each refresh; a rotated or logged-out token is rejected. | CONFIRMED / IMPLEMENTED |
| FR-AUTH-004 | Any authentication failure on a guarded route returns 401 with `error: "TOKEN_EXPIRED"`. | CONFIRMED / IMPLEMENTED |
| FR-AUTH-005 | Logout invalidates the stored refresh token. | IMPLEMENTED |
| FR-AUTH-006 | Deactivated users cannot log in or refresh tokens. | PROPOSED (D-12) |
| FR-AUTH-007 | Logout clears both auth cookies. | PROPOSED (D-13) |
| FR-AUTH-008 | No API response includes the password hash or refresh token. | CONFIRMED / **violated** (D-06) |
| FR-AUTH-009 | Users change their own password by supplying the current password; the new password meets the complexity policy (≥12 chars, upper, lower, digit, special) and differs from the current one. | CONFIRMED (Q-19) |
| FR-AUTH-010 | A user created through the API must change the default password before doing anything else; until then the API refuses every other authenticated request with 403 `PASSWORD_CHANGE_REQUIRED`. | CONFIRMED (Q-19) |
| FR-AUTH-011 | After 5 failed logins an account is locked for 15 minutes, and the login error is the same for every failure, so it doesn't reveal which accounts exist. | CONFIRMED (Q-19) |

**Acceptance criteria / edge cases**
- Unknown account and wrong password return the same 401 message.
- Reusing a refresh token after rotation fails with 401.
- Two concurrent requests with an expired access token trigger exactly one refresh call on the frontend.
- A user deactivated mid-session loses access no later than access-token expiry (pending FR-AUTH-006).

### 9.2 Personnel / users (FR-USR)

| ID | Requirement | Status |
|---|---|---|
| FR-USR-001 | Admins create users with account number (6–10 chars, upper-cased), rank, names, email (lower-cased), role, office and position; account number and email are unique. | IMPLEMENTED |
| FR-USR-002 | No API request can create a user with, or change a user's role to, `SUPER_ADMIN`. | CONFIRMED / **violated** (D-07) |
| FR-USR-003 | `REGIONAL_ADMIN` cannot create or assign `REGIONAL_ADMIN`; `NHQ_ADMIN` and `SUPER_ADMIN` can. | CONFIRMED / **violated** (D-07) |
| FR-USR-004 | Otherwise, the acting admin may only grant roles allowed by §2.4. | IMPLEMENTED |
| FR-USR-005 | A role may only be assigned to an office of an allowed type (§2.3). | CONFIRMED / IMPLEMENTED |
| FR-USR-006 | `CITY_MUNICIPALITY_CHIEF_INVESTIGATOR` exists as a role assignable to city/municipal stations. | CONFIRMED (role) / PROPOSED (office types, granting admins) |
| FR-USR-007 | `REGIONAL_ADMIN` may only create, list, edit or (de)activate users in offices within their region. | PROPOSED (D-09, D-10) |
| FR-USR-008 | `NHQ_ADMIN` and `REGIONAL_ADMIN` cannot edit, deactivate or change the role of the `SUPER_ADMIN` account; `REGIONAL_ADMIN` cannot edit or deactivate a `REGIONAL_ADMIN`. | PROPOSED (follows from FR-USR-002/003) |
| FR-USR-009 | Users are deactivated rather than deleted; lists default to active users. | IMPLEMENTED |
| FR-USR-010 | A user record includes a notification-preference row created at the same time. | IMPLEMENTED |
| FR-USR-011 | Admins cannot deactivate themselves. | PROPOSED |
| FR-USR-012 | Reading another user's profile requires admin rights over that user's office. | PROPOSED (D-03) |
| FR-USR-013 | A user who is the assigned investigator of an open investigation cannot be deactivated (409). | CONFIRMED |
| FR-USR-014 | The same user's account cannot be moved to another office or edited in any way (role, position, details) while the investigation is open (409). | CONFIRMED |
| FR-USR-015 | A station's only active chief investigator or chief of operations **can** be deactivated or moved; the system does not block it. Consequence: until a replacement is assigned, the station's pending incidents can't be approved (`SUPER_ADMIN` doesn't approve incidents) and its cases can't be decided except by `SUPER_ADMIN`. PROPOSED: show the admin a warning when this leaves a station without one. | CONFIRMED / PROPOSED (warning) |

**Edge cases**: duplicate account number or email returns 409; nonexistent office returns 404; role/office-type mismatch returns 403; any request with `role: SUPER_ADMIN` returns 403; `REGIONAL_ADMIN` creating `REGIONAL_ADMIN` returns 403; deactivating, moving or editing an investigator with an open investigation returns 409, and succeeds once the report is approved.

### 9.3 Offices (FR-OFF)

| ID | Requirement | Status |
|---|---|---|
| FR-OFF-001 | Offices follow the hierarchy in §6.1; violations return 400. | CONFIRMED / IMPLEMENTED |
| FR-OFF-002 | Regional offices require a unique region code; other office types must not have one. | IMPLEMENTED |
| FR-OFF-003 | The acting role may only create/update office types allowed by §2.5. | CONFIRMED / IMPLEMENTED |
| FR-OFF-004 | An office with assigned users or child offices cannot be deleted (409). | IMPLEMENTED |
| FR-OFF-005 | `REGIONAL_ADMIN` may only create, update or delete offices within their region, and only choose parents within their region. | PROPOSED (D-08) |
| FR-OFF-006 | Delete is authorized by the same office-type rules as create/update. | PROPOSED (D-08) |
| FR-OFF-007 | Changing an office's parent recomputes `regionId` for it and all descendants. | PROPOSED (D-11) |
| FR-OFF-008 | An office that owns incidents (including hidden ones), handles a case, or conducted an investigation cannot be deleted. | PROPOSED |
| FR-OFF-009 | Moving an office is allowed, and its stations' incidents follow them. The move is refused (409, naming the incidents) if a referred case would fall outside the station's new chain while unfinished: it has an open investigation, or the handling office has not completed one. Finished cases in that position return to the owning station, recorded in the referral history with the admin as actor, and its chief investigators are notified. | CONFIRMED (Q-51) |
| FR-OFF-010 | A region code cannot be changed once incidents have been numbered with it. | PROPOSED (Q-25) |

### 9.4 Positions (FR-POS)

| ID | Requirement | Status |
|---|---|---|
| FR-POS-001 | Admins create, rename, list and delete positions; names are unique and title-cased. | IMPLEMENTED |
| FR-POS-002 | A position with assigned users cannot be deleted (409). | IMPLEMENTED |
| FR-POS-003 | Paginated position totals count positions. | PROPOSED (D-16: currently counts offices) |
| FR-POS-004 | Whether `REGIONAL_ADMIN` may manage the national position list. | OPEN (Q-26) |

### 9.5 Incident classification (FR-CAT)

| ID | Requirement | Status |
|---|---|---|
| FR-CAT-001 | Categories have a unique title-cased name and a type (`STRUCTURAL`, `NON_STRUCTURAL`, `TRANSPORTATION`, `WILDLAND`). | IMPLEMENTED |
| FR-CAT-002 | Subcategories belong to one category; names are unique within a category. | IMPLEMENTED |
| FR-CAT-003 | A category with subcategories cannot be deleted. | IMPLEMENTED |
| FR-CAT-004 | A category or subcategory referenced by any incident (including hidden ones) cannot be deleted. | PROPOSED (D-17) |
| FR-CAT-005 | Category edits are validated with the same schema as creation. | PROPOSED (D-18) |
| FR-CAT-006 | Every role that views or records incidents can **read** categories and subcategories. | PROPOSED (D-19, required by §2.7) |
| FR-CAT-007 | Subcategories can be edited and deleted. | PROPOSED (currently create-only) |
| FR-CAT-008 | Who maintains the classification list. Currently NHQ admin, operation and investigator roles. | OPEN (Q-27) |

### 9.6 Fire incidents (FR-INC)

> **WITHDRAWN in rev 13.** Kept for history only; see §R13.

| ID | Requirement | Status |
|---|---|---|
| FR-INC-001 | Only `CITY_MUNICIPALITY_OPERATION_STAFF` and `CITY_MUNICIPALITY_COMMEL` can submit an incident for creation. Every other role, including `SUPER_ADMIN`, gets 403. | CONFIRMED |
| FR-INC-002 | All incident endpoints require authentication and role checks. | CONFIRMED / **not implemented** (D-01) |
| FR-INC-003 | The owning office is the submitter's office, set by the backend; clients cannot set or change it. | CONFIRMED (ownership) / PROPOSED (mechanism, D-02) |
| FR-INC-004 | A submitted incident is pending until a `CITY_MUNICIPALITY_OPERATION` of the same station approves it. | CONFIRMED |
| FR-INC-005 | While pending, staff/COMMEL of the station can add timeline entries. | CONFIRMED |
| FR-INC-006 | A `CITY_MUNICIPALITY_OPERATION` can approve or reject only incidents of their own station. | CONFIRMED |
| FR-INC-007 | A rejected incident can be edited and resubmitted. | CONFIRMED (only the original submitter, Q-50) |
| FR-INC-008 | A rejected, never-approved incident can be removed (hidden) by the staff/COMMEL member who submitted it (Q-50). Pending and approved incidents cannot be removed by them (403). | CONFIRMED |
| FR-INC-009 | Pending and rejected incidents are visible only to the station operations group and `SUPER_ADMIN`. | CONFIRMED |
| FR-INC-010 | `CITY_MUNICIPALITY_OPERATION` and `SUPER_ADMIN` cannot create or update incident data (403). `CITY_MUNICIPALITY_OPERATION` only approves or rejects; `SUPER_ADMIN` only views, deletes and restores. | CONFIRMED |
| FR-INC-011 | `CITY_MUNICIPALITY_OPERATION_STAFF` and `CITY_MUNICIPALITY_COMMEL` of the owning station update approved incidents (status, alarm level, details) directly, without approval. | CONFIRMED |
| FR-INC-012 | Staff from another station cannot update the incident (403). | CONFIRMED (follows from ownership) |
| FR-INC-013 | `dateTimeReported`, `dateTimeFireIncident`, `dateTimeCallReceived` and `dateTimeUnresponded` are optional at submission and can be filled in or corrected later by station staff/COMMEL. | CONFIRMED (optional) / INTERPRETED (editable later) |
| FR-INC-014 | Only `SUPER_ADMIN` can delete an approved incident; no in-system approval. Deletion hides the incident and all connected data. | CONFIRMED |
| FR-INC-015 | `SUPER_ADMIN` can list deleted incidents and restore them with all connected data. | CONFIRMED |
| FR-INC-016 | Allowed initial statuses: `VERIFICATION`, `FALSE_ALARM`, `ON_GOING`, `FIRE_OUT_UPON_ARRIVAL`. Others return 400. | CONFIRMED |
| FR-INC-017 | Transitions follow the §3.3 table; all others return 400. | CONFIRMED |
| FR-INC-018 | `FIRE_OUT` can only move to `REKINDLE`; `REKINDLE` can only move to `FIRE_OUT`; rekindling may repeat. | CONFIRMED |
| FR-INC-019 | `FIRE_OUT_UPON_ARRIVAL` and `FALSE_ALARM` are final. | CONFIRMED |
| FR-INC-020 | `FIRE_OUT_UPON_ARRIVAL` is accepted only as the initial status or directly after `VERIFICATION`, and only if the alarm level is none or `FIRST_ALARM`. | CONFIRMED |
| FR-INC-021 | `FALSE_ALARM` is accepted only as the initial status or directly after `VERIFICATION`. | CONFIRMED |
| FR-INC-022 | The alarm level changes only through a timeline entry by station staff/COMMEL, only upward in the §3.4 order, with skips allowed. `REKINDLE` brings no new alarm. | CONFIRMED / INTERPRETED (order, no lowering: Q-10c) |
| FR-INC-023 | Every status change and every alarm-level change creates an `IncidentTimeline` entry, in the same transaction that updates the incident. | CONFIRMED (entry) / PROPOSED (transaction) |
| FR-INC-024 | `occurredAt` is entered by the user; `createdAt` / `updatedAt` are set by the server and cannot be supplied by the client. | CONFIRMED |
| FR-INC-025 | Previous status and alarm are determined by `occurredAt`; a backdated entry is validated against its chronological neighbours (§3.5). | CONFIRMED (ordering) / PROPOSED (neighbour validation) |
| FR-INC-026 | `occurredAt` cannot be in the future. | PROPOSED |
| FR-INC-026a | Saved timeline entries can be corrected or voided. The original is kept and marked void, the timeline is re-validated, and current status/alarm are recomputed (§3.5). | CONFIRMED (allowed; by station staff/COMMEL) / PROPOSED (mechanism) |
| FR-INC-027 | Non-admin users can list, search, filter and view approved incidents within their scope (§6.3); out-of-scope access returns 403 or 404. | CONFIRMED (scope) / PROPOSED (list features) |
| FR-INC-028 | `NHQ_ADMIN` and `REGIONAL_ADMIN` get 403 on every incident endpoint. | CONFIRMED |
| FR-INC-029 | Impact, resources and personnel data are entered and updated by station staff/COMMEL as normal updates. | PROPOSED (when: Q-13) |

**Acceptance criteria / edge cases**
- Permissions:
  - `CITY_MUNICIPALITY_INVESTIGATOR`, `CITY_MUNICIPALITY_CHIEF_INVESTIGATOR`, `CITY_MUNICIPALITY_OPERATION`, `SUPER_ADMIN` and any non-station role get 403 when submitting or updating an incident.
  - A chief of operations from station A cannot approve station B's incident.
  - A station investigator, or any higher-office user, cannot see the station's pending or rejected incidents.
  - Staff removing a pending or approved incident returns 403; removing a rejected one succeeds and consumes no incident number.
- Submission:
  - Submitting with all four date fields empty succeeds; filling them in later is a normal update.
- Status rules:
  - Creating with initial status `FIRE_UNDER_CONTROL`, `FIRE_OUT` or `REKINDLE` returns 400.
  - `VERIFICATION → FIRE_OUT_UPON_ARRIVAL` with alarm `SECOND_ALARM` returns 400; with none or `FIRST_ALARM` it succeeds.
  - `ON_GOING → FIRE_OUT_UPON_ARRIVAL` and `ON_GOING → FALSE_ALARM` return 400.
  - `FIRE_OUT → ON_GOING`, `FIRE_OUT → FIRE_UNDER_CONTROL` and `FIRE_OUT → VERIFICATION` return 400.
  - `FIRE_OUT → REKINDLE → FIRE_OUT → REKINDLE → FIRE_OUT` succeeds. `REKINDLE → ON_GOING` and `REKINDLE → FIRE_UNDER_CONTROL` return 400.
  - Any change from `FALSE_ALARM` or `FIRE_OUT_UPON_ARRIVAL` returns 400.
- Alarm level:
  - `FIRST_ALARM → THIRD_ALARM` succeeds.
  - `THIRD_ALARM → SECOND_ALARM` returns 400.
  - `FIFTH_ALARM → TASK_FORCE_ALPHA → GENERAL_ALARM` succeeds.
  - `FIRE_OUT → REKINDLE` with a new alarm level returns 400; with the alarm unchanged it succeeds.
- Timeline:
  - Changing only the alarm level creates a timeline entry with the unchanged status.
  - A backdated entry placed between `ON_GOING` (10:00) and `FIRE_OUT` (12:00) as `FIRE_UNDER_CONTROL` (11:00) succeeds. The same entry as `FALSE_ALARM` returns 400.
  - A backdated entry with a lower alarm than the entry before it, or a higher alarm than the entry after it, returns 400.
  - A client-supplied `createdAt` is ignored or rejected.
  - Voiding a mistyped `FIRE_UNDER_CONTROL` entry succeeds. The entry stays in the history marked void, and the current status is recomputed.
  - Correcting an entry so that the timeline becomes invalid (e.g. `FIRE_OUT` followed by `ON_GOING`) returns 400.
  - Voiding the `FIRE_OUT` entry of an incident that has an investigation returns 409.
- Approval, numbering, deletion and restore:
  - On approval, the incident number is generated in the approval transaction; a failed approval leaves the incident pending and consumes no number.
  - After `SUPER_ADMIN` deletion, the incident, its timeline, investigations and reports disappear from every list and detail endpoint for everyone except `SUPER_ADMIN`'s deleted view; the data remains in the database.
  - After restore, all of it reappears unchanged, with the same numbers.
- Concurrent status updates each produce their own timeline entry; neither is lost.

### 9.7 Incident location (FR-LOC)

> **WITHDRAWN in rev 13.** Kept for history only; see §R13.

| ID | Requirement | Status |
|---|---|---|
| FR-LOC-001 | An incident cannot be submitted without a location; incident and location are created in one transaction. | CONFIRMED |
| FR-LOC-002 | `region`, `province_district` and `city_municipality` are set by the backend from the submitter's office hierarchy; client values are ignored. | CONFIRMED (from office) / PROPOSED (mechanism) |
| FR-LOC-003 | `placeOfOccurence` (required) and `barangay` (own field) are typed by the user. | CONFIRMED / PROPOSED (`barangay` required) |
| FR-LOC-004 | Optional `latitude` / `longitude` are stored for future mapping; values out of range, or only one of the pair, return 400. | CONFIRMED (optional fields) / PROPOSED (validation) |
| FR-LOC-005 | Office-derived values are snapshots; later office renames or moves don't change past incidents. | PROPOSED |

**Edge cases**: submitting with a different `region` in the body still stores the station's region; a station directly under a District Fire Station stores the district's name in `province_district`; `latitude: 95` returns 400; latitude without longitude returns 400.

### 9.8 Incident and investigation numbering (FR-NUM)

> **WITHDRAWN in rev 13.** Kept for history only; see §R13.

| ID | Requirement | Status |
|---|---|---|
| FR-NUM-001 | Incident numbers are generated by the backend using `generateIncidentNumber` inside a database transaction. | CONFIRMED |
| FR-NUM-002 | There is no BFP policy for the format; use the existing generator format `YYYY-MM-<REGIONCODE>-NNNNNN` with its counter (sequence per year, month and region code, 6-digit zero-padded). | CONFIRMED |
| FR-NUM-003 | Year and month boundaries use Asia/Manila time. | CONFIRMED / IMPLEMENTED |
| FR-NUM-004 | The `(year, month, regionCode)` counter uniqueness is preserved; there is no second incident-numbering implementation. | CONFIRMED |
| FR-NUM-005 | Clients cannot supply `incidentNo`. | PROPOSED (D-20) |
| FR-NUM-006 | The region code is the `regionCode` of the owning station's Regional Office (`office.regionId` → `regionCode`). Every incident is station-owned, so a region code always exists. | PROPOSED |
| FR-NUM-007 | The incident number is assigned when the incident is approved, using the approval time for year and month. Pending, rejected and removed-before-approval incidents have no number. `incidentNo` becomes nullable. | PROPOSED (follows from §3.7 and the generator's default date) |
| FR-NUM-008 | Investigation numbers use a unique format almost the same as the incident number, plus an identifier marking it as an investigation. | CONFIRMED |
| FR-NUM-009 | Format: `INV-<incidentNo>-<NN>`, where `NN` is the 2-digit sequence of investigations for that incident (e.g. `INV-2026-10-NCR-000123-01`, then `-02` after re-investigation). Generated in the start-investigation transaction under the same incident lock that enforces "one open at a time". Needs no new counter table, ties the number to its incident, and works for NHQ-conducted investigations (NHQ has no region code). | CONFIRMED (format) / PROPOSED (generation mechanism) |
| FR-NUM-010 | Numbers of deleted incidents and their investigations are never reused; restored records keep their numbers. | PROPOSED (soft delete keeps the rows) |

**Edge cases**: first incident of a month creates counter = 1; month rollover at 00:00 Manila on the 1st; concurrent approvals in the same region produce distinct sequential numbers; a rolled-back transaction does not consume a number; two chiefs starting investigations on the same incident at once produce one investigation (the other gets 409), so no duplicate `NN`.

### 9.9 Investigations (FR-INV)

| ID | Requirement | Status |
|---|---|---|
| FR-INV-001 | An incident may have several investigations, with at most one open (assigned, not yet approved) at a time. | CONFIRMED |
| FR-INV-002 | Investigation is optional. | CONFIRMED |
| FR-INV-003 | An investigation can only be started when the incident status is `FIRE_OUT` or `FIRE_OUT_UPON_ARRIVAL`; otherwise 400 (including `REKINDLE`). | CONFIRMED |
| FR-INV-004 | When an incident first reaches a completed fire status, its handling office is the owning station. | INTERPRETED |
| FR-INV-005 | The handling office's chief investigator may start an investigation, refer the case, or do nothing. | CONFIRMED |
| FR-INV-006 | Starting an investigation creates it, generates its number and assigns an investigator in one step; `startedAt` is the assignment time. | CONFIRMED (start = assign) / PROPOSED (number at start) |
| FR-INV-007 | The assignee must be an active `*_INVESTIGATOR` of the handling office. | CONFIRMED (office) / PROPOSED (active) |
| FR-INV-008 | An open investigation cannot be reassigned (400). | CONFIRMED |
| FR-INV-009 | The handling chief may refer the case to any ancestor office (skipping levels), or down within the owning station's chain. Other targets return 400/403. | CONFIRMED (Q-52c) |
| FR-INV-010 | Referral is rejected (400) while an investigation is open. | CONFIRMED |
| FR-INV-011 | After referral, only the new handling office's chief investigator can act on the case; the previous office's chief gets 403. | CONFIRMED |
| FR-INV-012 | After an investigation is approved, the handling chief may refer the case up or down, and the new handling office may start a new investigation. | CONFIRMED |
| FR-INV-013 | Only the assigned investigator can record investigation details (cause, classification, origin, dates). | CONFIRMED |
| FR-INV-014 | Investigation fields are stored on `Investigation`, never on `FireIncident`. Investigation actions do not change incident status. | CONFIRMED |
| FR-INV-015 | Rekindling an incident does not change an open investigation. | CONFIRMED |
| FR-INV-016 | Report approval requires `classification` and `causeOfFire` to be set and not `UNDER_INVESTIGATION`; otherwise 400. | CONFIRMED |
| FR-INV-017 | Report approval completes the investigation (`completedAt` set) and locks the investigation and its report. | CONFIRMED |
| FR-INV-018 | Earlier (approved) investigations remain visible and locked when another office investigates. | CONFIRMED |
| FR-INV-019 | Statistics use the incident's latest completed investigation. | CONFIRMED |
| FR-INV-020 | Referrals, starts and assignments are stored with actor and timestamp. | PROPOSED (schema, D-25) |
| FR-INV-021 | `SUPER_ADMIN` can perform every investigation action, subject to data-integrity rules (§7.4). | CONFIRMED (access) / PROPOSED (integrity limits) |

**Edge cases**:
- Starting:
  - Starting an investigation on an `ON_GOING`, `FALSE_ALARM` or `REKINDLE` incident returns 400.
  - Starting a second investigation while one is open returns 409, including when two chiefs try at once (transaction check).
  - Assigning a non-investigator, an inactive user, or a user from another office returns 400/403.
- Referral and authority:
  - A chief investigator from another station, or from a non-handling office, gets 403.
  - Referring from a station in Region A to Region B's office returns 400/403.
  - Referring while an investigation is open returns 400.
  - Reassigning an open investigation returns 400.
- Re-investigation:
  - After the station's investigation is approved and the case is referred to the region, the regional chief can start a new investigation (number `…-02`). Once that is approved, statistics show the regional findings, and the station's investigation stays visible and locked.
  - After approval, referring the case back down to the station succeeds. If the station then completes a third investigation (`…-03`), statistics switch to the station's latest findings.
- Approval and editing:
  - Approving a report while `classification` is `UNDER_INVESTIGATION` returns 400.
  - An unassigned investigator cannot edit (403).
  - Editing an approved investigation or report returns 400/403.

### 9.10 Investigation reports (FR-RPT)

| ID | Requirement | Status |
|---|---|---|
| FR-RPT-001 | Each investigation has one report with statuses `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`. | IMPLEMENTED (schema) |
| FR-RPT-002 | Only the assigned investigator creates, edits and submits the report. | CONFIRMED |
| FR-RPT-003 | Only the handling office's chief investigator moves the report to `UNDER_REVIEW`, approves or rejects it. Investigators get 403. | CONFIRMED |
| FR-RPT-004 | A rejected report returns to the investigator for editing and can be resubmitted (`REJECTED → SUBMITTED`). | CONFIRMED |
| FR-RPT-005 | Approval requires the investigation's `classification` and `causeOfFire` to be set and not `UNDER_INVESTIGATION`. | CONFIRMED |
| FR-RPT-006 | The same check also applies at submission, so the investigator sees the problem before review. | PROPOSED |
| FR-RPT-007 | The investigator cannot edit a report while it is `SUBMITTED` or `UNDER_REVIEW`. | PROPOSED |
| FR-RPT-008 | An approved report is locked for everyone, including `SUPER_ADMIN`. | CONFIRMED (locked) / PROPOSED (applies to `SUPER_ADMIN`) |
| FR-RPT-009 | Submission sets `submittedAt`; approval or rejection sets `reviewedAt` and records the deciding chief and rejection remarks. Earlier rejections are kept in history. | PROPOSED (reviewer field missing, D-25) |
| FR-RPT-010 | Statistical/summary reports (incident reports, statistics pages). | CONFIRMED (Q-20, 2026-10-28) / IMPLEMENTED; official BFP forms OPEN |

### 9.11 Notifications (FR-NOT)

| ID | Requirement | Status |
|---|---|---|
| FR-NOT-001 | Each user can view and update their own notification preferences. | IMPLEMENTED |
| FR-NOT-002 | A user can only read or change their **own** preferences. | PROPOSED (D-03) |
| FR-NOT-003 | Notifications for the triggers in §8, according to preferences. | CONFIRMED (Q-21, 2026-10-28) / IMPLEMENTED (in-app) |

### 9.12 Attachments (FR-ATT)

| ID | Requirement | Status |
|---|---|---|
| FR-ATT-001 | Access to attachments is restricted by the owning incident/investigation's office scope; they are hidden and restored with the incident. | CONFIRMED / IMPLEMENTED |
| FR-ATT-002 | Attachment types, limits, storage, retention, chain of custody. | CONFIRMED (Q-22, 2026-10-28) / IMPLEMENTED; retention period OPEN |

### 9.13 Audit (FR-AUD)

| ID | Requirement | Status |
|---|---|---|
| FR-AUD-001 | Every status and alarm change is recorded in the timeline with user-entered time, server time and actor, and is never overwritten. | CONFIRMED |
| FR-AUD-002 | Each submission, approval, rejection, resubmission and removal records actor, time and remarks. | PROPOSED (follows from §3.7) |
| FR-AUD-003 | Every `SUPER_ADMIN` write is recorded; deletions also record the memo reference and Chief BFP approval details; restores record who and when. | PROPOSED (follows from §3.8, §7.4) |
| FR-AUD-004 | Referrals, investigation starts/assignments, report submissions and decisions record actor and time. | PROPOSED |
| FR-AUD-005 | Timeline `createdById` references a real user. | PROPOSED (D-15) |
| FR-AUD-006 | Changes to users, roles and offices are audited. | CONFIRMED (Q-23, 2026-10-28) / IMPLEMENTED |
| FR-AUD-007 | Logs do not contain sensitive incident, investigation or personal information. | CONFIRMED |

---

## 10. Discrepancies between code and expected behavior

Severity: **H** = security or data-integrity risk, **M** = rule not enforced, **L** = defect or inconsistency.

| ID | Sev | Location | Discrepancy |
|---|---|---|---|
| D-01 | H | `fire-incident/fire-incident.controller.ts` | `POST /api/fire-incident` has no `AuthGuard`/`RoleGuard`, accepts `any` body, and returns a placeholder string. `FireIncidientRepository` (sic) is not registered in the module. The Zod schema has no location. |
| D-02 | H | `fireIncident.prisma` | `FireIncident` has no owning office, although ownership by the creator's office is confirmed. Scope rules (§6.3) can't be enforced. |
| D-03 | H | `notification.controller.ts`, `users.controller.ts` | `GET/PATCH /api/notification/:id` and `GET /api/users/:id` accept any user id from any authenticated user (IDOR). |
| D-04 | M | `fireIncident.prisma` | Location is optional at the database level, contrary to the "required" rule. |
| D-05 | L | `IncidentLocation.prisma` | `onDelete` is RESTRICT while all other incident children cascade. With soft deletion confirmed, cascades are not used for incident deletion; the inconsistency only matters for manual DB maintenance. |
| D-06 | H | `auth.controller.ts` login, `users.service.ts` createUser, `LoginForm.tsx` | Login and create-user responses return the full `User` row including the password hash; the frontend stores the login response in `localStorage`. |
| D-07 | H | `users.permissions.ts` | **Violates confirmed rules:** `SUPER_ADMIN` and `NHQ_ADMIN` can create/assign `SUPER_ADMIN`; `REGIONAL_ADMIN` can create/assign `REGIONAL_ADMIN`. |
| D-08 | H | `office.service.ts` | `deleteOffice` has no office-type or region check. `updateOffice` checks only the **new** type, not the target office's current type or region. `REGIONAL_ADMIN` can choose any parent office nationwide. |
| D-09 | H | `users.service.ts` | `createUser`/`editUser` check office **type** only; a `REGIONAL_ADMIN` can create or move users into another region's offices. `editUser` does not check that the target user is within the actor's scope or that the actor may manage the target's current role. |
| D-10 | H | `users.service.ts`, `users.repository.ts` | `findPaginatedUsers` and `changeUserStatus` are not region-scoped; a `REGIONAL_ADMIN` can list and deactivate any user nationwide, including NHQ admins and the `SUPER_ADMIN`. `changeUserStatus` and `editUser` also don't check for open investigations (FR-USR-013, FR-USR-014). |
| D-11 | M | `office.repository.ts` | Re-parenting an office recomputes its own `regionId` but not its descendants'. |
| D-12 | H | `auth.service.ts` | `login` and `refresh` do not check `isActive`; deactivated users keep access. |
| D-13 | L | `auth.controller.ts` | Logout does not clear cookies. |
| D-14 | M | `refreshToken.prisma`, `auth.repository.ts` | Refresh tokens are stored in plaintext (an earlier migration named a `tokenhash` column). |
| D-15 | L | `IncidentTimeline.prisma` | `createdById` has no relation to `User`. There are no void/correction fields (`voidedAt`, `voidedById`, `voidReason`, `correctsEntryId`) for the confirmed corrections (FR-INC-026a). |
| D-16 | L | `position.repository.ts` | Paginated total uses `office.count` instead of `position.count`. |
| D-17 | M | `fire-incident-categories.service.ts`, `fireIncidentSubcategory.prisma` | Category delete checks subcategories but not incidents. A category referenced by incidents is blocked only by the foreign key, which surfaces as a generic 400 "Related record does not exist" instead of a clear 409. No subcategory delete exists yet; the `onDelete: Cascade` from category to subcategory needs review once it does. |
| D-18 | M | `fire-incident-categories.controller.ts` | `PATCH /:id` uses `@Body()` with no schema, so edits bypass validation and normalization. |
| D-19 | M | `fire-incident-categories.controller.ts` | Only NHQ roles can **read** categories, but station staff must choose a category to record incidents. |
| D-20 | M | `fire-incident.schema.ts` | Schema requires a client-supplied `incidentNo`, contradicting backend generation. It accepts any `fireIncidentStatus` at creation, contradicting the confirmed initial-status rule. The date fields are already optional, which matches FR-INC-013. |
| D-21 | L | `app.module.ts`, `config/configuration.ts` | Global `JwtModule` registered with `process.env.JWT_SECRET` at import time and 60 s default expiry; configuration maps `REFRESH_TOKEN_SECRET` while auth reads `REFRESH_SECRET`. Works today only because explicit secrets are passed per call. |
| D-22 | L | `prisma-exception.filter.ts`, `auth.service.ts` | `console.log` of Prisma error causes; account numbers logged on login failure. Review against the "no sensitive logging" rule. |
| D-23 | L | Frontend `Router.tsx`, sidebar | All routes and links are shown to every role. Admin roles will see incident pages they cannot use. Not a security issue (backend enforces), but the UI does not reflect permissions. |
| D-24 | L | Naming | `placeOfOccurence`, `FireOpertaionResources`, `FireIncidientRepository`, `office-heirarchy`, `LPG_EXPLOSION_CAUSED_BY_DEFECTIVE_HOSELlNE` (lowercase L in enum). Renaming requires approval per CLAUDE.md. |
| D-25 | M | Schema | Missing: incident approval state, approver, approval history; soft-delete and restore fields; case handling office and referral history; investigation conducting office, assignee, assigner; report reviewer and rejection remarks. |
| D-26 | M | `user.prisma`, permission maps, frontend `constants/personnel.ts` | `CITY_MUNICIPALITY_CHIEF_INVESTIGATOR` (confirmed) does not exist. Adding it requires an enum migration and entries in `users.permissions.ts`, `users.role_office.permissions.ts`, `office.permissions.ts` (all are exhaustive `Record<ROLE, …>`, so TypeScript will flag missing entries) and the frontend role list. |
| D-27 | M | `CLAUDE.md` | Out of date with confirmed rules. Update once this document is approved: <ul><li>Lifecycle: lists six statuses as a single sequence; needs `REKINDLE`, the transition table and the alarm-level rule.</li><li>Investigations: says to preserve the unique `fireIncidentId`; now several investigations per incident.</li><li>Missing entirely: the approval flow, soft deletion and restore, the no-API `SUPER_ADMIN` rule and its limited incident role, admin roles having no incident access, referrals, investigation numbering, office-derived incident location, and the new role.</li></ul> |
| D-28 | M | `fireIncident.prisma` | `incidentNo` is required (`String @unique`), but confirmed pending-approval incidents need a row before a number is assigned. |
| D-29 | H | `investigation.prisma`, `FireIncident.investigation` relation | `Investigation.fireIncidentId` is `@unique` and `FireIncident.investigation` is 1:1. The confirmed rule needs 1:N with one open at a time. Requires a migration that drops the unique index; code that reads `incident.investigation` must change to a list. |
| D-30 | M | `enums.prisma` | `FireIncidentStatus` lacks the confirmed `REKINDLE` value. |
| D-31 | M | `IncidentLocation.prisma` | No `barangay`, `latitude` or `longitude` columns (confirmed). `province_district` and `city_municipality` are nullable, although they are now always derived from the office hierarchy. |


### 10.1 Triage (approved 2026-10-10)

| Priority | Decision | Items |
|---|---|---|
| 1 | Fix first (security) | D-01, D-03, D-06, D-07, D-08, D-09, D-10, D-12 |
| 2 | Fix as part of the incident and investigation modules | D-02, D-04, D-20, D-25, D-26, D-28, D-29, D-30, D-31 |
| 3 | Fix when convenient | D-13, D-14, D-15, D-16, D-17, D-18, D-19, D-21, D-22, D-23 |
| — | Defer (renames need separate approval) | D-24 |
| — | Accept as-is (soft delete makes it irrelevant) | D-05 |
| — | Done with this approval | D-27 (`CLAUDE.md` updated) |

**Progress**

| Date | Phase | Resolved |
|---|---|---|
| 2026-10-10 | Phase 1 (security, branch `phase-1-security-fixes`) | D-01, D-03, D-06, D-07, D-08, D-09, D-10, D-12 |
| 2026-10-10 | Phase 2 (schema, migration `20261010120000_add_incident_workflow_schema`) | Schema level: D-02, D-15, D-25, D-26 (enum, permission maps and frontend role list), D-28, D-29, D-30, D-31. Each still needs its Phase 3/4 service logic. |
| 2026-10-10 | Phase 3 (fire-incident backend) | D-04 (incident and location created in one write), D-20 (new input schemas), D-18 (category edits validated), D-19 (incident roles can read categories). Service logic for D-02, D-15, D-25, D-28, D-30, D-31. |
| 2026-10-10 | Phase 4 (investigation backend) | Service logic for D-29 (several investigations per incident, one open at a time), referrals, assignment, reports and reviews; FR-USR-013/014 (investigators with an open investigation are locked). |
| 2026-10-10 | Phase 5 (frontend) | Fire-incident list, submission, detail (approval, timeline with corrections, details, impact/resources/personnel, deletion and restore) and investigation pages (case queue, assignments, referral, start, drafting, submission and review). Controls are shown by role; the backend enforces every rule. |

| 2026-10-28 | Roadmap phase 1 (branch `roadmap-phase-1-binding-gaps`) | D-13 (logout clears cookies), D-14 (refresh tokens hashed), D-16, D-17 (409 for categories and subcategories in use), D-21, D-22, D-23 (role-aware sidebar and routes; Fire Operations pages hidden, Q-01); FR-CAT-007 (subcategory edit/delete), FR-OFF-007 (descendants re-regioned), FR-OFF-008 (offices with incident or investigation records can't be deleted), FR-OFF-010 (region code frozen once used), FR-USR-015 (warning), FR-AUD-003 (memo reference), FR-INC-027 (category, date, place and barangay filters) |

| 2026-10-28 | Roadmap phase 2 (branch `roadmap-phase-2-audit-log`, migration `20261028140000_add_audit_log`) | FR-AUD-006 and Q-23: general audit log for users, offices, positions, categories and SUPER_ADMIN incident deletion/restore; `GET /api/audit` with per-role scope; Audit Log page |
| 2026-10-28 | Roadmap phase 3 (branch `roadmap-phase-3-notifications`, migration `20261028160000_add_notifications`) | FR-NOT-003 and Q-21: in-app notifications for incident submission, resubmission, approval, rejection, finished fires, referrals, assignments and report decisions; `incidentUpdates` preference; navbar bell |
| 2026-10-28 | UI polish (branch `ui-polish`) | Branding, status colours, login accessibility, one sidebar component, coming-soon pages, shared page header and empty state |
| 2026-10-28 | Roadmap phase 4 (branch `roadmap-phase-4-statistics`) | FR-RPT-010, Q-20 and Q-01: statistics, incident reports with CSV export, incident map, dashboard KPIs and tasks |
| 2026-10-28 | Roadmap phase 5 (branch `roadmap-phase-5-attachments`, migration `20261028180000_add_attachments`) | FR-ATT-001/002 and Q-22: incident attachments, investigation evidence, Evidence page, audited downloads |

| 2026-11-03 | Owner answers (branch `q-answers-incident-rules`) | Q-50: only the original submitter changes a rejected incident. Q-51 / FR-OFF-009: office moves check referred cases. Q-34g, Q-41 and Q-52c needed no code change. |
| 2026-11-03 | Q-19 (branch `q-19-login-security`, migration `add_login_security`) | FR-AUTH-009, FR-AUTH-010, FR-AUTH-011: forced password change and temporary lockout |
| 2026-11-03 | Case queue (branch `investigation-case-queue`) | The chief investigator's case queue lists only cases waiting on the office: Fire Out or Fire Out Upon Arrival with no investigation by the office since the case reached it (a later referral back counts as reaching it again), or a submitted report to review. Queue rows say what is needed and link to the latest investigation |

Still open from priority 2: none. Still open from priority 3: none (D-13 to D-23 resolved by roadmap phase 1 and earlier phases).

---

## 11. Unresolved business questions

### 11.1 Answered

| ID | Round | Answer summary | Recorded in |
|---|---|---|---|
| Q-02 | 1 | Station staff/COMMEL record incidents; others view within scope; investigators handle investigations. | §2.7 |
| Q-03 | 1 | `CITY_MUNICIPALITY_COMMEL` = radio operator, same permissions as operation staff. | §2.1 |
| Q-05 | 1 | `NHQ_ADMIN` cannot create `SUPER_ADMIN`; NHQ admin creates `REGIONAL_ADMIN`. | §2.4 |
| Q-06 | 1 | Incident owned by the creator's office. | §3.6 |
| Q-07 | 1 | `VERIFICATION` → … → `FIRE_OUT`; three completed statuses; alarm = `currentAlarmLevel`. | §3.3 |
| Q-11, Q-12 | 1 | Investigation optional, only on completed fires; chief investigator decides and assigns. | §5.1 |
| Q-17 | 1 | Investigator submits; chief investigator approves. | §5.1 |
| Q-29 | 1 | Obsolete: incidents are always station-owned. | §9.8 |
| Q-30 | 2 | Chief of operations = `CITY_MUNICIPALITY_OPERATION`. | §2.1 |
| Q-31 | 2 | Scope = own office and all offices below. | §6.3 |
| Q-32 | 2 | Among admins, only `SUPER_ADMIN` has incident access. | §2.7 |
| Q-33 | 2 | Add `CITY_MUNICIPALITY_CHIEF_INVESTIGATOR`; investigators from any level depending on referral. | §2.1, §5.1 |
| Q-34 | 2 | Creation approved by `CITY_MUNICIPALITY_OPERATION`; chief cannot make changes; rejected can be edited and resubmitted. | §3.7 |
| Q-35 | 2 | No one creates `SUPER_ADMIN` in the system. | §2.1 |
| Q-36 | 2 | Chief investigator creates the investigation and assigns it. | §5.1 |
| Q-37 | 2 | Only chief investigator reviews, approves, rejects. | §5.1 |
| Q-42 | 3 | Refer directly to any level within own chain; that level's chief assigns or refers further; can bring it back down. | §5.4 |
| Q-43 | 3 | Deletion of approved incidents: `SUPER_ADMIN` only, request outside the system. | §3.8 |
| Q-44 | 3 | `FIRE_OUT_UPON_ARRIVAL` only as initial or after `VERIFICATION`, with no alarm or 1st alarm; timeline entry for every status/alarm change. | §3.3 |
| Q-40 | 3 | `FIRE_OUT` cannot go back to `ON_GOING`. | §3.3 |
| Q-47 | 3 | Staff/COMMEL can add timeline entries while pending approval. | §3.7 |
| Q-37b | 3 | Rejected report goes back for editing and resubmission. | §5.1 |
| Q-45 | 3 | Initial status: `VERIFICATION`, `FALSE_ALARM`, `ON_GOING` or `FIRE_OUT_UPON_ARRIVAL`. | §3.3 |
| Q-46 | 3 | Timeline time entered by user; `createdAt`/`updatedAt` by server. | §3.5 |
| Q-48 | 3 | `SUPER_ADMIN` has all access (narrowed for incidents in round 5). | §2.1 |
| Q-49 | 3 | Deletions via the developer account, on a physical memo approved by the Chief, BFP. | §3.8 |
| Q-55 | 4 | `FIRE_OUT` cannot move backwards. | §3.3 |
| Q-56 | 4 | Add `REKINDLE`; only from `FIRE_OUT`; counts as rekindle; existing investigation continues. | §3.3 |
| Q-52 | 4 | Only the new handling chief acts; investigator from the handling office; cases move only before an investigation starts; after approval another office can investigate anew. | §5.4 |
| Q-46b | 4 | Previous status is determined chronologically by event time. | §3.5 |
| Q-54 | 4 | Staff may remove a rejected, never-approved incident; approved ones only by `SUPER_ADMIN`. | §3.7 |
| Q-53 | 4 | Pending/rejected visible to operation staff, COMMEL and chief of operations. | §3.7 |
| Q-48b | 4 | `SUPER_ADMIN` has every permission (narrowed for incidents in round 5). | §2.1 |
| Q-43b | 4 | Deletion keeps the incident and all connected data, hidden. | §3.8 |
| Q-37c | 4 | Approved report is locked; approval completes the investigation. | §5.1 |
| Q-59 | 5 | Option A: several investigations per incident, one open at a time, earlier ones locked; the higher office's investigation replaces the station's in statistics (refined in round 7: the latest completed one counts). | §5.1, §5.3 |
| Q-57 | 5 | `REKINDLE` → `FIRE_OUT`; rekindling can repeat. | §3.3 |
| Q-55b | 5 | `FIRE_OUT_UPON_ARRIVAL` and `FALSE_ALARM` are final. | §3.3 |
| Q-60 | 5 | An investigation starts when assigned to an investigator; no referral while one is active. Chief may start, refer, or do nothing. | §5.1, §5.4 |
| Q-61 | 5 | `SUPER_ADMIN` only views and deletes fire incidents; full access to investigations and reports. | §2.1, §7.4 |
| Q-62 | 5 | `SUPER_ADMIN` can see and restore deleted incidents. | §3.8 |
| Q-58 | 5 | Staff can remove only rejected incidents, not pending ones. | §3.7 |
| Q-14 | 6 | Investigation number: unique format like the incident number plus an investigation identifier. | §9.8 |
| Q-28 | 6 | No policy; use the existing counter-based incident-number format. | §9.8 |
| Q-09 | 6 | Incident date fields are optional (reporting is often delayed). | §3.2, FR-INC-013 |
| Q-10 | 6 | Alarm level goes up from `FIRST_ALARM` to `GENERAL_ALARM`; changes when staff/COMMEL add a timeline entry. | §3.4 |
| Q-16 | 6 | `classification` and `causeOfFire` must leave `UNDER_INVESTIGATION` before approval. | §5.1, FR-INV-016 |
| Q-63 | 6 | After approval, cases can be referred up and down. | §5.4 |
| Q-39 | 6 | Open investigations cannot be reassigned; they must be finished first. | §5.1, FR-INV-008 |
| Q-64 | 6 | A user with an active investigation cannot be deactivated. | FR-USR-013 |
| Q-14b | 7 | Investigation number `INV-<incidentNo>-<NN>` approved. | FR-NUM-009 |
| Q-65 | 7 | Statistics use the latest completed investigation. | §5.3, FR-INV-019 |
| Q-10b | 7 | Alarm levels can be skipped; a rekindle has no new alarm. | §3.4 |
| Q-64b | 7 | An investigator with an active investigation cannot be moved or edited. | FR-USR-014 |
| Q-46c | 7 | Saved timeline entries can be corrected or voided. | §3.5, FR-INC-026a |
| Q-08 | 8 | Location is based on the submitting user's office; add latitude/longitude for future mapping. | §4 |
| Q-46d | 8 | Corrections/voids by station operation staff and COMMEL. | §3.5 |
| Q-64c | 8 | A station's only chief investigator or chief of operations can be deactivated or moved. | FR-USR-015 |
| Q-66 | 9 | Place of occurrence typed by the user; barangay gets its own field; latitude/longitude optional. | §4.2 |

### 11.2 Confirm before building

| ID | Affects | Question |
|---|---|---|
| — | — | None. All questions that block the incident and investigation modules are answered. §11.3 and §11.4 affect later features. |

### 11.3 Important

Answered questions stay listed here for their IDs; check §11.5 and §11.6 for their answers.

| ID | Question |
|---|---|
| Q-52c | When a chief refers a case down, can it go to any office below them, or only to offices in the owning station's chain (its own district/province or the station)? |
| Q-10c | Is the alarm order `FIRST … FIFTH_ALARM`, then `TASK_FORCE_ALPHA … DELTA`, then `GENERAL_ALARM` correct, and can the alarm never be lowered? |
| Q-48c | Do `NHQ_ADMIN` and `REGIONAL_ADMIN` also have no access to **investigations** and reports? |
| Q-50 | Can any staff/COMMEL of the station resubmit or remove a rejected incident, or only the original submitter? |
| Q-34g | If a station has several `CITY_MUNICIPALITY_OPERATION` users, is one approval enough? Who approves if none is active? |
| Q-51 | If a station is moved to another district/province or region, should its existing incidents and open cases follow it? |
| Q-41 | Is a delay of up to 15 minutes before role or office changes take effect acceptable for approval, assignment and report-approval rights? |
| Q-09b | What does `dateTimeUnresponded` mean (for the field label and help text)? |
| Q-01 | Which navigation areas are in scope: Incident Map, Monitoring, Fire Stations, Response Units, Evidence, Statistics, Incident Reports, Dashboard? What does each contain? |
| Q-04 | Is the absence of station-level admin and viewer roles intentional? |
| Q-13 | When are impact, resources and personnel data entered and edited? Is `finalEstimatedDamages` set by the investigation? |
| Q-19 | Must users change the default password on first login? Is the current password policy approved? Any lockout after failed logins? |
| Q-21 | Notification channels and trigger events? |
| Q-22 | Attachment/evidence requirements: file types, size limits, storage, retention, chain of custody, who may view or download? |
| Q-23 | What actions require an audit trail beyond those listed in FR-AUD? |

### 11.4 Minor

| ID | Question |
|---|---|
| Q-20 | Required report outputs (official BFP forms, statistics breakdowns, export formats)? |
| Q-25 | Can a region code change after incidents have been numbered with it? |
| Q-26 | Are positions a national list managed by NHQ only, or can regional admins add them? |
| Q-27 | Which roles may maintain incident categories and subcategories? |

### 11.5 Answers approved in revision 11

| ID | Proposed answer |
|---|---|
| Q-23 | **APPROVED 2026-10-28.** A general `AuditLog` (actor, action, entity, office, non-sensitive changed fields, time) records every change to users, roles, offices, positions and categories, every `SUPER_ADMIN` write and every attachment download. Incident and investigation history stays in the existing timeline, event, referral and review tables. `SUPER_ADMIN` reads everything, `NHQ_ADMIN` reads admin changes, and `REGIONAL_ADMIN` reads changes in its region. |
| Q-21 | **APPROVED 2026-10-28.** In-app notifications only for now (no email or SMS). Triggers: incident submitted/resubmitted (to the station's chief of operations), approved/rejected (to the submitter), reached `FIRE_OUT`/`FIRE_OUT_UPON_ARRIVAL` (to the handling chief investigators), case referred (to the target office's chief investigators), investigator assigned (to the assignee), report submitted (to the handling chief), report approved/rejected (to the assignee). A new `incidentUpdates` preference joins the existing three. |
| Q-20 | **APPROVED 2026-10-28.** Dashboard (KPIs and "my tasks"), a statistics page (by status with `REKINDLE` as its own bucket, category, alarm, month, child office, impact totals, cause and classification from the latest completed investigation) and an incident report table with CSV export. Only approved, non-deleted incidents within the viewer's scope count. Official BFP forms stay OPEN. |
| Q-01 | **APPROVED 2026-10-28.** In scope: Dashboard, Statistics, Incident Reports, Incident Map (approved incidents with coordinates, OpenStreetMap tiles) and Evidence (Q-22). Monitoring, Fire Stations and Response Units are hidden until they are scoped. |
| Q-22 | **APPROVED 2026-10-28.** Attachments on incidents (by the owning station's staff/COMMEL) and on investigations (by the assigned investigator while open; locked after approval). JPEG, PNG, WebP and PDF, up to 20 MB, checked by file signature; a SHA-256 hash is stored for integrity. Files are kept on server disk outside the web root and downloaded only through an authorized endpoint; downloads are audited. Removal is soft. Attachments are hidden and restored with their incident. Retention period stays OPEN. |

### 11.6 Answers approved in revision 12 (2026-11-03)

| ID | Answer | Built |
|---|---|---|
| Q-19 | Users created through the API must change the default password at first login. The current password policy is approved. After 5 failed logins an account is locked for 15 minutes; even the correct password is refused during the lock. | Yes |
| Q-34g | One approval is enough. With no active chief of operations the incident stays pending until an admin provides one; `SUPER_ADMIN` does not approve. | Yes |
| Q-41 | The delay of up to 15 minutes before role or office changes take effect is acceptable. | Yes |
| Q-50 | Only the original submitter can edit, resubmit, remove or attach files to a rejected incident. If the submitter has left, `SUPER_ADMIN` can clear the incident and the station submits a new one. | Yes |
| Q-51 | Incidents follow a moved station. See FR-OFF-009 for moves with referred cases. | Yes |
| Q-52c | A case referred down stays within the owning station's chain. | Yes |

| ID | New question |
|---|---|
| Q-67 | There is no way for an admin to reset a forgotten password. Should there be one, and who may use it? |

---

## 12. Approval

| Item | Owner | Status |
|---|---|---|
| Document reviewed and approved | Project owner | Approved 2026-10-10 |
| §11.2 confirmations | Project owner | Complete |
| PROPOSED designs accepted: §3.5 timeline validation and corrections, §3.7 approval state, §3.8 soft delete, §5.3 data model, required `barangay` | Project owner | Accepted 2026-10-10 |
| §10 discrepancies triaged (fix / accept / defer) | Project owner | Approved 2026-10-10 (§10.1) |
| §11.5 proposed answers (revision 11) | Project owner | All approved 2026-10-28 (Q-23, Q-21, Q-20, Q-01, Q-22) |
| §11.6 answers (revision 12) | Project owner | Given 2026-11-03 (Q-19, Q-34g, Q-41, Q-50, Q-51, Q-52c) |
