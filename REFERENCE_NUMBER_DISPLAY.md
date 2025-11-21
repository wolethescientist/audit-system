# Workflow Reference Number Display

## Overview
The workflow reference number is now prominently displayed as the **FIRST and MOST VISIBLE** element on workflow pages. It is **IMMUTABLE** (cannot be changed) and serves as the unique identifier for tracking workflows.

## Format
```
WF-YYYY-XXXXX
```
- **WF**: Workflow prefix
- **YYYY**: Year (e.g., 2024, 2025)
- **XXXXX**: 5-digit unique number (e.g., 00001, 00123, 99999)

**Examples:**
- `WF-2024-00001`
- `WF-2024-00123`
- `WF-2025-00456`

## Display Locations

### 1. Create Workflow Page (`/workflows/create`)

**Position**: At the very top of the form, before all other fields

**Appearance**:
```
┌─────────────────────────────────────────────────────────────┐
│ Workflow Reference Number (Auto-generated)                  │
│ ┌─────────────────────────────────────────┐                │
│ │ WF-2024-XXXXX (Will be auto-generated)  │  Immutable     │
│ └─────────────────────────────────────────┘                │
│ This reference number will be used to track this workflow   │
│ throughout its lifecycle.                                    │
└─────────────────────────────────────────────────────────────┘
```

**Features**:
- Blue background to stand out
- Read-only input field (cursor shows "not-allowed")
- "Immutable" label next to it
- Explanatory text below
- Shows preview format before creation
- After creation, shows actual reference number in success alert

### 2. Workflow Detail Page (`/workflows/{id}`)

**Position**: At the absolute top of the page, above everything else

**Appearance**:
```
┌─────────────────────────────────────────────────────────────┐
│                    Workflow Reference Number                 │
│                                                              │
│                      WF-2024-00123                          │
│                                                              │
│                                            [STATUS BADGE]    │
└─────────────────────────────────────────────────────────────┘
```

**Features**:
- **Gradient blue background** (blue-600 to blue-800)
- **White text** for high contrast
- **Large, bold, monospace font** (text-2xl)
- **Status badge** on the right side
- Takes full width of the page
- First thing users see when opening a workflow

### 3. Workflow List Page (`/workflows`)

**Position**: Next to workflow name in each row

**Appearance**:
```
Financial Audit Approval Process  [WF-2024-00123]
```

**Features**:
- Displayed as a badge next to the workflow name
- Monospace font for easy reading
- Gray background badge
- Visible in the list view

## Immutability

### Backend Protection
- Reference number is generated **once** when workflow is created
- Database column has **UNIQUE constraint**
- Cannot be modified after creation
- No API endpoint allows updating reference number

### Frontend Protection
- Input field is **read-only** on create page
- No edit functionality on detail page
- Displayed in non-editable format

## User Experience Flow

### Creating a Workflow
1. User navigates to "Create Workflow"
2. **First thing they see**: Reference number field showing preview format
3. User fills in other details (audit, name, description, steps)
4. User clicks "Create Workflow"
5. Backend generates actual reference number
6. Success alert shows: "Workflow created successfully! Reference Number: WF-2024-00123"
7. User is redirected to workflow detail page
8. Reference number is prominently displayed at the top

### Viewing a Workflow
1. User opens a workflow
2. **First thing they see**: Large, prominent reference number banner at the top
3. Reference number is always visible while scrolling
4. User can easily copy/share the reference number for tracking

### Listing Workflows
1. User views workflow list
2. Each workflow shows its reference number as a badge
3. Easy to scan and identify workflows by reference number

## Benefits

1. **Easy Tracking**: Reference number makes it simple to track workflows in conversations, emails, and reports
2. **Unique Identification**: No two workflows can have the same reference number
3. **Professional**: Gives workflows a formal, trackable identifier
4. **Immutable**: Once created, it never changes, ensuring consistency
5. **Prominent Display**: Always visible and easy to find
6. **Year-based**: Easy to identify when workflow was created

## Technical Implementation

### Database
- Column: `reference_number` (String, Unique, Indexed, Not Null)
- Generated on workflow creation
- Format: `WF-{YEAR}-{5-digit-random}`

### Backend
- Auto-generation in `create_workflow()` endpoint
- Uniqueness check (regenerates if duplicate)
- Included in all workflow responses

### Frontend
- Displayed on create page (preview)
- Prominently displayed on detail page (actual)
- Shown in list view (badge)
- Read-only/immutable everywhere

## Example Workflow Lifecycle

```
1. CREATE
   User creates workflow
   → Reference Number Generated: WF-2024-00123
   
2. IN PROGRESS
   Staff 1 reviews → Reference: WF-2024-00123
   Staff 2 approves → Reference: WF-2024-00123
   
3. TRACKING
   Email: "Please review workflow WF-2024-00123"
   Meeting: "Status of WF-2024-00123?"
   Report: "Workflow WF-2024-00123 completed"
   
4. COMPLETED
   Workflow archived with reference: WF-2024-00123
   Historical records maintained with same reference
```

## Visual Hierarchy

The reference number is designed to be the **MOST PROMINENT** identifier:

1. **Size**: Large text (text-2xl on detail page)
2. **Color**: High contrast (white on blue gradient)
3. **Position**: Top of page, above all other content
4. **Font**: Monospace for easy reading and copying
5. **Background**: Distinctive blue gradient banner
6. **Spacing**: Generous padding and margins

This ensures users **ALWAYS** see the reference number first and can easily use it for tracking and communication.
