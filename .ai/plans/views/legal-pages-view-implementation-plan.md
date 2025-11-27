# View Implementation Plan: Legal Pages

## 1. Overview

The Legal Pages view consists of two static Astro pages (`/privacy` and `/terms`) that display the Privacy Policy and Terms of Service in an accessible, readable format. These pages are accessible to both authenticated and unauthenticated users and serve to meet legal compliance requirements while providing a clear, user-friendly reading experience.

Key features:
- Static content with no API interaction
- Readable single-column layout optimized for long-form text
- Table of contents for easy navigation within documents
- Print-friendly styling
- WCAG AA compliant accessibility
- Consistent header and footer navigation

## 2. View Routing

**Privacy Policy Page:**
- Path: `/privacy`
- Type: Astro static page
- Access: Public (authenticated and unauthenticated users)

**Terms of Service Page:**
- Path: `/terms`
- Type: Astro static page
- Access: Public (authenticated and unauthenticated users)

## 3. Component Structure

```
/privacy.astro
└── LegalPageLayout
    ├── LegalHeader
    ├── TableOfContents (desktop: sticky sidebar, mobile: collapsible)
    ├── main (content area)
    │   ├── h1 (Privacy Policy)
    │   ├── LastUpdated (metadata)
    │   └── sections (legal content with h2, h3, p, ul, etc.)
    └── LegalFooter

/terms.astro
└── LegalPageLayout
    ├── LegalHeader
    ├── TableOfContents
    ├── main (content area)
    │   ├── h1 (Terms of Service)
    │   ├── LastUpdated
    │   └── sections (legal content)
    └── LegalFooter
```

**Hierarchy:**
- `LegalPageLayout.astro` - Wraps entire page
  - `LegalHeader.astro` - Site logo and navigation
  - `TableOfContents.astro` - Section jump links (optional)
  - `main` - Legal document content
  - `LegalFooter.astro` - Links to other legal pages

## 4. Component Details

### LegalPageLayout.astro

**Component description:**
Main layout wrapper for all legal pages. Provides consistent structure with header, content area, and footer. Implements responsive single-column layout optimized for readability with proper spacing and typography.

**Main elements:**
- `<html>` with lang attribute
- `<head>` with meta tags (title, description)
- `<body>` with Tailwind CSS classes
- Header slot
- Main content area (max-width: 65ch for optimal readability)
- Footer slot

**Handled interactions:**
- None (static layout)

**Handled validation:**
- None (no user input)

**Types:**
- `LegalPageProps` (component props interface)

**Props:**
```typescript
interface LegalPageProps {
  title: string;           // Page title (e.g., "Privacy Policy")
  description: string;     // Meta description for SEO
  lastUpdated: string;     // Last updated date (ISO format)
}
```

---

### LegalHeader.astro

**Component description:**
Header navigation component for legal pages. Displays site logo/name and provides a link back to the home page. Simpler than the main app header with minimal navigation.

**Main elements:**
- `<header>` element with semantic HTML
- `<a>` link to home (`/`) with logo/site name
- Optional "Back to Home" text link

**Handled interactions:**
- Click logo → Navigate to `/`
- Click "Back to Home" → Navigate to `/`

**Handled validation:**
- None (no user input)

**Types:**
- None (no props needed)

**Props:**
- None

---

### LegalFooter.astro

**Component description:**
Footer component for legal pages. Provides navigation links to other legal pages (Privacy Policy, Terms of Service) and back to the main site.

**Main elements:**
- `<footer>` element with semantic HTML
- List of links: Home, Privacy Policy, Terms of Service
- Copyright notice (optional)
- Current page highlighted/non-clickable

**Handled interactions:**
- Click "Privacy Policy" → Navigate to `/privacy`
- Click "Terms of Service" → Navigate to `/terms`
- Click "Home" → Navigate to `/`

**Handled validation:**
- None (no user input)

**Types:**
- `LegalFooterProps`

**Props:**
```typescript
interface LegalFooterProps {
  currentPage: 'privacy' | 'terms';  // Highlights current page in footer
}
```

---

### TableOfContents.astro

**Component description:**
Table of contents component that generates jump links to major sections within the legal document. Displays as a sticky sidebar on desktop and a collapsible section on mobile for easy navigation through long documents.

**Main elements:**
- `<nav>` element with aria-label="Table of Contents"
- `<ul>` list of section links
- Each `<li>` contains `<a>` with href="#section-id"
- Sticky positioning on desktop (position: sticky, top: 2rem)
- Collapsible accordion on mobile (using `<details>` element)

**Handled interactions:**
- Click section link → Scroll to corresponding heading anchor
- Mobile: Click/tap to expand/collapse TOC

**Handled validation:**
- None (no user input)

**Types:**
- `TOCSection` (section data)
- `TableOfContentsProps` (component props)

**Props:**
```typescript
interface TOCSection {
  id: string;       // Anchor ID (e.g., "data-collection")
  title: string;    // Section heading text
  level: 2 | 3;     // Heading level (h2 or h3)
}

interface TableOfContentsProps {
  sections: TOCSection[];  // Array of sections to display in TOC
}
```

---

### LastUpdated.astro

**Component description:**
Small metadata component displaying the last updated date for the legal document. Helps users understand when the policy was last modified.

**Main elements:**
- `<p>` or `<time>` element with formatted date
- Optional "Last Updated:" label
- Datetime attribute for machine-readable date

**Handled interactions:**
- None (static display)

**Handled validation:**
- None (no user input)

**Types:**
- `LastUpdatedProps`

**Props:**
```typescript
interface LastUpdatedProps {
  date: string;  // ISO date string (e.g., "2025-01-15")
}
```

---

## 5. Types

### Component Props Types

```typescript
// LegalPageLayout props
interface LegalPageProps {
  title: string;           // Page title for <title> tag and h1
  description: string;     // Meta description for SEO
  lastUpdated: string;     // ISO date string (YYYY-MM-DD)
}

// TableOfContents props
interface TOCSection {
  id: string;       // Anchor ID without # (e.g., "data-collection")
  title: string;    // Display text for TOC link
  level: 2 | 3;     // Heading level (2 = h2, 3 = h3)
}

interface TableOfContentsProps {
  sections: TOCSection[];
}

// LegalFooter props
interface LegalFooterProps {
  currentPage: 'privacy' | 'terms';
}

// LastUpdated props
interface LastUpdatedProps {
  date: string;  // ISO date string
}
```

### No API Types Needed

These pages are static and do not interact with the backend API. All content is hardcoded or stored in markdown files within the frontend project.

## 6. State Management

**No state management required.**

Legal pages are purely static content rendered at build time (Astro SSG). No client-side state, no API calls, no dynamic content.

The only "interactive" element is the Table of Contents, which uses native browser anchor navigation (clicking `#section-id` links) and optional `<details>` element for mobile collapse/expand (native HTML, no JavaScript state needed).

## 7. API Integration

**No API integration.**

Legal pages display static content only. Privacy Policy and Terms of Service are stored as:
- Markdown files in `src/content/legal/` (recommended), or
- Hardcoded HTML within Astro page components

Content is rendered at build time via Astro's static site generation. No runtime API calls are made.

## 8. User Interactions

### 1. Navigate to Legal Page

**User Action:**
- User clicks "Privacy Policy" or "Terms of Service" link from landing page footer or app footer
- Or directly navigates to `/privacy` or `/terms` via URL

**Expected Outcome:**
- Browser navigates to legal page
- Full legal document loads with header, TOC (if present), content, and footer
- Page title updates to "Privacy Policy - GSD" or "Terms of Service - GSD"
- User can scroll to read full content

---

### 2. Navigate Back to Home

**User Action:**
- User clicks site logo or "Back to Home" link in LegalHeader

**Expected Outcome:**
- Browser navigates to `/` (landing page)
- User returns to main site

---

### 3. Jump to Section via Table of Contents

**User Action:**
- User clicks a section link in the Table of Contents (e.g., "Data Collection")

**Expected Outcome:**
- Page scrolls smoothly to the corresponding `<h2>` or `<h3>` section
- Browser URL updates with anchor (e.g., `/privacy#data-collection`)
- Focused section is highlighted or comes into view at top of viewport

---

### 4. Navigate Between Legal Pages

**User Action:**
- User clicks "Privacy Policy" or "Terms of Service" link in LegalFooter

**Expected Outcome:**
- Browser navigates to the other legal page
- New page loads with full content
- Current page link in footer is highlighted/non-clickable

---

### 5. Expand/Collapse TOC on Mobile

**User Action (Mobile Only):**
- User taps on Table of Contents heading to expand/collapse

**Expected Outcome:**
- TOC content expands or collapses using native `<details>` element behavior
- No JavaScript required (native HTML interaction)

---

### 6. Print Legal Document

**User Action:**
- User triggers browser print dialog (Cmd/Ctrl+P)

**Expected Outcome:**
- Print preview shows legal document with optimized formatting:
  - Header and footer navigation hidden or simplified
  - TOC included or hidden based on design decision
  - Readable font sizes and spacing for print
  - Page breaks inserted appropriately
  - Links shown with full URLs in print (optional)

---

## 9. Conditions and Validation

**No conditions or validation required.**

Legal pages are static content with no user input, no forms, no API calls. There are no business rules or validation logic to implement.

**Component-level conditions:**
- `LegalFooter`: Current page prop determines which link is highlighted (or non-clickable)
- `TableOfContents`: May be conditionally rendered (e.g., only show if sections array has items)

## 10. Error Handling

**Minimal error handling required** (static pages with no dynamic behavior).

### Potential Error Scenarios

1. **Page Not Found (404)**
   - If user navigates to `/privacy` or `/terms` but pages don't exist
   - **Handling:** Astro automatically serves 404 page (handled by existing `/404` page)

2. **Broken Anchor Links in TOC**
   - If TOC link points to non-existent section ID
   - **Handling:** Browser scrolls to top (default behavior); no error shown
   - **Prevention:** Ensure TOC section IDs match actual heading IDs in content

3. **Missing Content**
   - If markdown file or content is missing
   - **Handling:** Page builds with empty content or build fails (caught during development)
   - **Prevention:** Validate content files exist during build process

**No runtime errors expected** since these are static pages with no API calls or user input.

## 11. Implementation Steps

### Step 1: Set Up Content Structure

1. Create content directory for legal documents:
   ```
   src/content/legal/
   ├── privacy-policy.md
   └── terms-of-service.md
   ```

2. Write Privacy Policy markdown content:
   - Include frontmatter with title, lastUpdated
   - Structure with clear h2 and h3 headings for sections
   - Use standard privacy policy sections (Data Collection, Data Use, Data Sharing, User Rights, etc.)

3. Write Terms of Service markdown content:
   - Include frontmatter with title, lastUpdated
   - Structure with clear h2 and h3 headings for sections
   - Use standard terms sections (Acceptance, User Accounts, Prohibited Conduct, Termination, etc.)

**Note:** For MVP, use placeholder legal content and mark as DRAFT until legal review is completed.

---

### Step 2: Create Legal Page Layout Component

1. Create `src/layouts/LegalPageLayout.astro`

2. Implement layout structure:
   ```astro
   ---
   interface Props {
     title: string;
     description: string;
     lastUpdated: string;
   }
   const { title, description, lastUpdated } = Astro.props;
   ---
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="UTF-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
       <title>{title} - GSD</title>
       <meta name="description" content={description} />
     </head>
     <body class="bg-white text-gray-900">
       <slot name="header" />
       <div class="container mx-auto px-4 py-8 max-w-4xl">
         <div class="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
           <aside class="hidden lg:block">
             <slot name="toc" />
           </aside>
           <main class="prose prose-lg max-w-none">
             <slot />
           </main>
         </div>
       </div>
       <slot name="footer" />
     </body>
   </html>
   ```

3. Add Tailwind CSS typography plugin configuration for prose styling

4. Add print media query styles to hide navigation and optimize for print

---

### Step 3: Create Legal Header Component

1. Create `src/components/legal/LegalHeader.astro`

2. Implement header with logo and home link:
   ```astro
   <header class="border-b border-gray-200 bg-white">
     <div class="container mx-auto px-4 py-4 flex items-center justify-between">
       <a href="/" class="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-gray-700">
         <span>GSD</span>
       </a>
       <a href="/" class="text-sm text-gray-600 hover:text-gray-900">
         ← Back to Home
       </a>
     </div>
   </header>
   ```

3. Add appropriate ARIA labels and semantic HTML

4. Style with Tailwind CSS for responsiveness

---

### Step 4: Create Legal Footer Component

1. Create `src/components/legal/LegalFooter.astro`

2. Implement footer with navigation links:
   ```astro
   ---
   interface Props {
     currentPage: 'privacy' | 'terms';
   }
   const { currentPage } = Astro.props;
   ---
   <footer class="border-t border-gray-200 bg-gray-50 mt-16">
     <div class="container mx-auto px-4 py-8">
       <nav class="flex flex-wrap gap-4 justify-center text-sm">
         <a href="/" class="text-gray-600 hover:text-gray-900">Home</a>
         <span class="text-gray-400">•</span>
         {currentPage === 'privacy' ? (
           <span class="text-gray-900 font-medium">Privacy Policy</span>
         ) : (
           <a href="/privacy" class="text-gray-600 hover:text-gray-900">Privacy Policy</a>
         )}
         <span class="text-gray-400">•</span>
         {currentPage === 'terms' ? (
           <span class="text-gray-900 font-medium">Terms of Service</span>
         ) : (
           <a href="/terms" class="text-gray-600 hover:text-gray-900">Terms of Service</a>
         )}
       </nav>
       <p class="text-center text-xs text-gray-500 mt-4">
         © {new Date().getFullYear()} GSD. All rights reserved.
       </p>
     </div>
   </footer>
   ```

3. Style with Tailwind CSS for responsiveness

---

### Step 5: Create Table of Contents Component

1. Create `src/components/legal/TableOfContents.astro`

2. Implement sticky TOC for desktop, collapsible for mobile:
   ```astro
   ---
   interface TOCSection {
     id: string;
     title: string;
     level: 2 | 3;
   }

   interface Props {
     sections: TOCSection[];
   }

   const { sections } = Astro.props;
   ---

   <!-- Desktop: Sticky sidebar -->
   <nav aria-label="Table of Contents" class="hidden lg:block sticky top-8">
     <h2 class="text-sm font-bold text-gray-900 mb-4">Table of Contents</h2>
     <ul class="space-y-2 text-sm">
       {sections.map((section) => (
         <li class={section.level === 3 ? 'pl-4' : ''}>
           <a
             href={`#${section.id}`}
             class="text-gray-600 hover:text-gray-900 hover:underline"
           >
             {section.title}
           </a>
         </li>
       ))}
     </ul>
   </nav>

   <!-- Mobile: Collapsible -->
   <details class="lg:hidden mb-8 border border-gray-200 rounded-lg p-4">
     <summary class="font-bold text-gray-900 cursor-pointer">
       Table of Contents
     </summary>
     <ul class="mt-4 space-y-2 text-sm">
       {sections.map((section) => (
         <li class={section.level === 3 ? 'pl-4' : ''}>
           <a
             href={`#${section.id}`}
             class="text-gray-600 hover:text-gray-900 hover:underline"
           >
             {section.title}
           </a>
         </li>
       ))}
     </ul>
   </details>
   ```

3. Add smooth scroll behavior in CSS

---

### Step 6: Create LastUpdated Component

1. Create `src/components/legal/LastUpdated.astro`

2. Implement date display:
   ```astro
   ---
   interface Props {
     date: string;  // ISO date string
   }

   const { date } = Astro.props;
   const formattedDate = new Date(date).toLocaleDateString('en-US', {
     year: 'numeric',
     month: 'long',
     day: 'numeric'
   });
   ---
   <p class="text-sm text-gray-600 mb-8">
     <time datetime={date}>Last updated: {formattedDate}</time>
   </p>
   ```

---

### Step 7: Create Privacy Policy Page

1. Create `src/pages/privacy.astro`

2. Import components and render layout:
   ```astro
   ---
   import LegalPageLayout from '../layouts/LegalPageLayout.astro';
   import LegalHeader from '../components/legal/LegalHeader.astro';
   import LegalFooter from '../components/legal/LegalFooter.astro';
   import TableOfContents from '../components/legal/TableOfContents.astro';
   import LastUpdated from '../components/legal/LastUpdated.astro';

   const sections = [
     { id: 'introduction', title: 'Introduction', level: 2 },
     { id: 'data-collection', title: 'Data Collection', level: 2 },
     { id: 'data-use', title: 'How We Use Your Data', level: 2 },
     { id: 'data-sharing', title: 'Data Sharing', level: 2 },
     { id: 'data-retention', title: 'Data Retention', level: 2 },
     { id: 'user-rights', title: 'Your Rights', level: 2 },
     { id: 'cookies', title: 'Cookies and Tracking', level: 2 },
     { id: 'security', title: 'Security', level: 2 },
     { id: 'changes', title: 'Changes to This Policy', level: 2 },
     { id: 'contact', title: 'Contact Us', level: 2 },
   ];
   ---

   <LegalPageLayout
     title="Privacy Policy"
     description="GSD Privacy Policy - How we collect, use, and protect your data"
     lastUpdated="2025-01-15"
   >
     <LegalHeader slot="header" />
     <TableOfContents slot="toc" sections={sections} />

     <h1>Privacy Policy</h1>
     <LastUpdated date="2025-01-15" />

     <!-- Legal content here (markdown or HTML) -->
     <section id="introduction">
       <h2>Introduction</h2>
       <p>...</p>
     </section>

     <!-- Additional sections -->

     <LegalFooter slot="footer" currentPage="privacy" />
   </LegalPageLayout>
   ```

3. Add actual privacy policy content (placeholder for MVP)

4. Ensure all section IDs match TOC links

---

### Step 8: Create Terms of Service Page

1. Create `src/pages/terms.astro`

2. Implement similar structure to privacy page:
   ```astro
   ---
   import LegalPageLayout from '../layouts/LegalPageLayout.astro';
   import LegalHeader from '../components/legal/LegalHeader.astro';
   import LegalFooter from '../components/legal/LegalFooter.astro';
   import TableOfContents from '../components/legal/TableOfContents.astro';
   import LastUpdated from '../components/legal/LastUpdated.astro';

   const sections = [
     { id: 'acceptance', title: 'Acceptance of Terms', level: 2 },
     { id: 'accounts', title: 'User Accounts', level: 2 },
     { id: 'use', title: 'Acceptable Use', level: 2 },
     { id: 'prohibited', title: 'Prohibited Conduct', level: 2 },
     { id: 'content', title: 'User Content', level: 2 },
     { id: 'termination', title: 'Termination', level: 2 },
     { id: 'disclaimer', title: 'Disclaimer of Warranties', level: 2 },
     { id: 'limitation', title: 'Limitation of Liability', level: 2 },
     { id: 'changes', title: 'Changes to Terms', level: 2 },
     { id: 'contact', title: 'Contact Us', level: 2 },
   ];
   ---

   <LegalPageLayout
     title="Terms of Service"
     description="GSD Terms of Service - Rules and guidelines for using our service"
     lastUpdated="2025-01-15"
   >
     <LegalHeader slot="header" />
     <TableOfContents slot="toc" sections={sections} />

     <h1>Terms of Service</h1>
     <LastUpdated date="2025-01-15" />

     <!-- Legal content here -->

     <LegalFooter slot="footer" currentPage="terms" />
   </LegalPageLayout>
   ```

3. Add actual terms of service content (placeholder for MVP)

---

### Step 9: Add Print Styles

1. Add print media query to `LegalPageLayout.astro`:
   ```css
   @media print {
     header, footer, aside, [slot="toc"] {
       display: none;
     }

     body {
       font-size: 12pt;
       line-height: 1.5;
     }

     h1 {
       font-size: 18pt;
       page-break-before: always;
     }

     h2 {
       font-size: 14pt;
       page-break-after: avoid;
     }

     p {
       orphans: 3;
       widows: 3;
     }

     a[href^="http"]::after {
       content: " (" attr(href) ")";
       font-size: 10pt;
       color: #666;
     }
   }
   ```

2. Test print preview in browser

---

### Step 10: Link from Main Site

1. Update landing page footer (`src/pages/index.astro`) to include legal links:
   ```astro
   <footer>
     <nav>
       <a href="/privacy">Privacy Policy</a>
       <a href="/terms">Terms of Service</a>
     </nav>
   </footer>
   ```

2. If app footer exists in authenticated views, add legal links there as well

---

### Step 11: Test Accessibility

1. **Semantic HTML verification:**
   - Check proper heading hierarchy (h1 → h2 → h3, no skipped levels)
   - Verify landmark regions (`<header>`, `<main>`, `<footer>`, `<nav>`)
   - Ensure all links have descriptive text

2. **Keyboard navigation testing:**
   - Tab through all links in header, TOC, footer
   - Verify focus indicators are visible
   - Test TOC jump links with keyboard (Enter to follow link)

3. **Screen reader testing:**
   - Test with VoiceOver (macOS) or NVDA (Windows)
   - Verify TOC is announced correctly
   - Check that section headings are properly announced
   - Ensure skip links work (if implemented)

4. **Contrast verification:**
   - Use browser DevTools or online tool to check color contrast
   - Ensure text/background meets WCAG AA standard (4.5:1 for normal text)
   - Check link colors have sufficient contrast

5. **Responsive testing:**
   - Test on mobile viewport (320px, 375px, 768px)
   - Verify TOC collapses correctly on mobile
   - Check readability on small screens

---

### Step 12: Final Testing and Validation

1. **Cross-browser testing:**
   - Chrome, Firefox, Safari, Edge
   - Verify layout consistency across browsers

2. **Link testing:**
   - Click all internal links (logo, footer links)
   - Click all TOC anchor links
   - Verify browser back/forward navigation works

3. **Print testing:**
   - Open print preview (Cmd/Ctrl+P)
   - Verify print styles apply correctly
   - Check page breaks are appropriate

4. **Content review:**
   - Proofread legal content for accuracy
   - Verify all sections are complete
   - Check "Last Updated" dates are correct

5. **SEO verification:**
   - Check `<title>` tags are descriptive
   - Verify meta descriptions are present
   - Ensure pages are crawlable (no `noindex` directives)

---

## Completion Checklist

- [ ] Content structure created (`src/content/legal/`)
- [ ] Privacy Policy content written (placeholder or final)
- [ ] Terms of Service content written (placeholder or final)
- [ ] `LegalPageLayout.astro` implemented with responsive design
- [ ] `LegalHeader.astro` created with home navigation
- [ ] `LegalFooter.astro` created with legal page links
- [ ] `TableOfContents.astro` created with sticky/collapsible behavior
- [ ] `LastUpdated.astro` created for date display
- [ ] `/privacy` page created and rendered correctly
- [ ] `/terms` page created and rendered correctly
- [ ] Print styles added and tested
- [ ] Links added to landing page footer
- [ ] Accessibility tested (keyboard, screen reader, contrast)
- [ ] Cross-browser testing completed
- [ ] All anchor links verified working
- [ ] Responsive design tested on mobile/tablet/desktop
- [ ] Final content review and proofreading completed

---

## Notes for Developers

1. **Legal Content:** For MVP, use placeholder content clearly marked as "DRAFT" until legal review is completed. Actual privacy policy and terms should be reviewed by legal counsel before production launch.

2. **Markdown vs HTML:** The implementation can use either markdown files with Astro's content collections or hardcoded HTML. Markdown is recommended for easier content updates.

3. **TOC Generation:** Section IDs in TOC must match heading IDs in content. Consider automating TOC generation from markdown headings in future iterations.

4. **Print Optimization:** Test print preview in multiple browsers to ensure consistent print output.

5. **SEO:** Even though these are legal pages, good SEO practices help users find policies via search engines.

6. **Future Enhancements (Post-MVP):**
   - Versioning: Show previous versions of policies with date archive
   - Highlight changes: Show what changed in latest update
   - Accept/acknowledge: Require users to acknowledge updated terms
   - Multi-language support: Translate policies for international users
