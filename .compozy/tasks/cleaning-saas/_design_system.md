# Cleaning SaaS — Frontend Design System & UI Reference

This file is the single source of truth for all frontend tasks (T13, T14, T15).
The agent MUST read and follow this document before writing any frontend code.
Do NOT invent styles, colors, spacing, or components not defined here.

---

## Design System (JSON — Source of Truth)

```json
{
  "meta": {
    "name": "Cleaning SaaS UI",
    "style": "balanced-minimal",
    "inspiration": ["linear", "stripe", "shadcn"]
  },

  "colors": {
    "primary": "#4F46E5",
    "primary_hover": "#4338CA",
    "secondary": "#0EA5E9",
    "secondary_hover": "#0284C7",
    "background": "#0B0F19",
    "surface": "#111827",
    "surface_alt": "#1F2937",
    "border": "#2D3748",
    "text_primary": "#F9FAFB",
    "text_secondary": "#9CA3AF",
    "text_muted": "#6B7280",
    "success": "#22C55E",
    "warning": "#F59E0B",
    "error": "#EF4444"
  },

  "typography": {
    "font_family": "Inter, sans-serif",
    "scale": {
      "xs": "12px",
      "sm": "14px",
      "md": "16px",
      "lg": "18px",
      "xl": "20px",
      "2xl": "24px",
      "3xl": "30px"
    },
    "weights": {
      "regular": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    }
  },

  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 12,
    "lg": 16,
    "xl": 24,
    "2xl": 32
  },

  "radius": {
    "sm": "6px",
    "md": "8px",
    "lg": "12px",
    "xl": "16px"
  },

  "shadows": {
    "sm": "0 1px 2px rgba(0,0,0,0.05)",
    "md": "0 4px 6px rgba(0,0,0,0.1)",
    "lg": "0 10px 15px rgba(0,0,0,0.15)"
  },

  "layout": {
    "container_width": "1200px",
    "sidebar_width": "260px",
    "header_height": "64px"
  },

  "components": {
    "button": {
      "height": "40px",
      "padding": "0 16px",
      "radius": "8px",
      "variants": ["primary", "secondary", "ghost", "danger"]
    },
    "input": {
      "height": "40px",
      "padding": "0 12px",
      "radius": "8px",
      "border": "1px solid border",
      "focus_ring": "primary"
    },
    "card": {
      "padding": "16px",
      "radius": "12px",
      "background": "surface",
      "border": "1px solid border"
    },
    "badge": {
      "padding": "2px 8px",
      "radius": "6px",
      "variants": ["success", "warning", "error", "neutral"]
    },
    "modal": {
      "radius": "12px",
      "padding": "24px",
      "overlay": "rgba(0,0,0,0.6)"
    }
  },

  "interaction": {
    "hover_opacity": 0.9,
    "transition": "all 0.2s ease",
    "focus_ring": "2px solid primary"
  }
}
```

---

## Hard Rules (NON-NEGOTIABLE)

- DO NOT create new colors outside the design system
- DO NOT change the spacing scale
- DO NOT improvise typography
- DO NOT use inline styles outside the system tokens
- DO NOT introduce visual inconsistency
- If something is not defined, reuse the closest existing token

---

## UI Principles

- Prioritize clarity over aesthetics
- Minimize cognitive load
- Use consistent spacing and alignment
- Use visual hierarchy (typography + spacing)
- Avoid unnecessary elements
- Every element must justify its existence

---

## Component Usage

Use standardized components throughout:

- **Button**: variants — primary, secondary, ghost, danger
- **Input**: with focus ring, validation states, clear labels
- **Card**: for grouping related information
- **Badge**: for status indicators (success, warning, error, neutral)
- **Modal**: for confirmations and quick forms

All components MUST follow the design system definitions above.

---

## Layout Rules

- Respect container width (1200px) and spacing scale
- Use grid or flex layouts consistently
- Sidebar: 260px fixed width on desktop
- Header: 64px fixed height
- Maintain visual balance — avoid overcrowding
- Card-based layout where appropriate

---

## Interaction Rules

- Use defined hover states (opacity 0.9, transition 0.2s ease)
- Apply consistent transitions on all interactive elements
- Use focus ring (2px solid primary) for accessibility
- Provide clear, immediate feedback for all actions

---

## Responsiveness Rules (Mobile-First)

The application MUST be mobile-first. The user must be able to run their business entirely from a smartphone.

### Breakpoints
- Mobile: up to 640px
- Tablet: 641px – 1024px
- Desktop: above 1024px

### Navigation
- Mobile: bottom navigation OR collapsible sidebar — maximum 5 primary actions — always reachable with thumb
- Desktop: fixed sidebar — expanded menu

### Dashboard
- Mobile: vertical stacking of cards — prioritize key metrics only — quick actions at top
- Desktop: grid layout — full analytics view

### Forms / CRM
- Mobile: single column — progressive disclosure where needed
- Desktop: multi-column allowed

### Tables / Data
- Mobile: use cards or collapsible rows — avoid complex tables
- Desktop: full tables allowed

### Buttons & Interactions
- Minimum touch size: 44px
- No hover-dependent interactions on mobile
- Immediate feedback on tap

### Forbidden
- Horizontal scroll
- Hidden actions on mobile
- Tiny click targets
- Complex multi-column forms on mobile

---

## Screen Patterns

### Auth Screen
- Centered card layout
- Input fields (email, password)
- Primary CTA button
- Minimal and focused — reduce distractions
- Clear call to action

### Data Listing Screen
- Page header (title + primary action button)
- Search input
- Filters (status, date)
- Table or card list with consistent row actions (edit, view)
- Pagination
- Use badges for status
- Keep actions visible but not intrusive

### Form Screen (Create / Edit)
- Page title
- Grouped related fields
- Clear labels
- Validation feedback inline
- Submit + cancel buttons
- Keep layout simple and linear

### Detail View Screen
- Header with title and actions
- Information sections using cards
- Key data visually highlighted
- Activity / history section where applicable

### Dashboard Screen
- Stats cards (KPIs) at top
- Recent activity list
- Sidebar navigation
- Top header (user info, actions)
- Prioritize quick scanning — highlight key metrics — avoid clutter

### Settings Screen
- Sidebar or tabs for categories
- Forms for each configuration group
- Save actions with clear feedback states
- Group by category — avoid overwhelming the user

### Kanban Board
- Columns representing status stages (e.g., New Lead, In Progress, Completed)
- Draggable cards with job/lead details
- Clear status separation
- Smooth drag interactions
- Avoid overcrowding columns

---

## Output Requirements (All Frontend Tasks)

- React + TypeScript
- Functional components only
- TailwindCSS with design system tokens
- Clean, modular, production-ready code
- Avoid unnecessary abstraction
- Consistency is more important than creativity
