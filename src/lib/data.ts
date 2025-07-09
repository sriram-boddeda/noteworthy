import { v4 as uuidv4 } from 'uuid';
import { Calculator, FileText, FileType } from 'lucide-react';
import React from 'react';

export interface NoteVersion {
  timestamp: number;
  content: string;
}

export interface Note {
  id: string;
  title: string;
  type: 'richtext' | 'markdown' | 'calculator';
  tags: string[];
  content: string;
  folderId?: string | null;
  summary?: string | null;
  lastModified: number;
  isTrashed?: boolean;
  versions: NoteVersion[];
}

export interface Folder {
  id: string;
  name: string;
  isTrashed?: boolean;
}

export type ActionDetail =
  | { type: 'CREATE'; destination?: string }
  | { type: 'RENAME'; from: string; to: string }
  | { type: 'DELETE' }
  | { type: 'RESTORE'; from?: string }
  | { type: 'RESTORE_VERSION' }
  | { type: 'PERMANENT_DELETE' }
  | { type: 'MOVE'; from: string; to: string }
  | { type: 'COPY'; destination: string }
  | { type: 'RETRIEVE' };

export interface ActionHistory {
  id: string;
  timestamp: number;
  entityType: 'note' | 'folder';
  entityId: string | null;
  entityName: string;
  action: ActionDetail;
  entityData?: Note | Folder | null;
  containedEntitiesData?: Note[] | null;
}


export const noteTypeOptions = [
    { value: 'richtext', label: 'Rich Text Note', icon: React.createElement(FileText, { className: "size-4 shrink-0" }) },
    { value: 'markdown', label: 'Markdown Note', icon: React.createElement(FileType, { className: "size-4 shrink-0" }) },
    { value: 'calculator', label: 'Calculator Note', icon: React.createElement(Calculator, { className: "size-4 shrink-0" }) },
];


export function getInitialData(): { notes: Note[], folders: Folder[] } {
    const initialFolders: Folder[] = [
      { id: 'folder-prod-1', name: 'Productivity', isTrashed: false },
      { id: 'folder-pers-1', name: 'Personal', isTrashed: false },
      { id: 'folder-drafts-1', name: 'Drafts', isTrashed: false },
    ];
    
    const now = Date.now();

    const initialNotes: Note[] = [
      {
        id: uuidv4(),
        title: 'Quarterly Business Review',
        type: 'richtext',
        tags: ['qbr', 'finance', 'strategy', 'work'],
        content: `<h1>Q2 2024 Business Review</h1><p>Date: July 15, 2024</p><h2>Key Performance Indicators</h2><p>Overall, a strong quarter with a <strong>15% revenue growth</strong> YoY. User engagement is up by <em>22%</em>, largely due to the new features launched in April. <mark>However, customer acquisition cost (CAC) has increased by 10%.</mark></p><h3 style="text-align: center;">Financials Summary</h3><p style="text-align: center;">A quick look at our core numbers.</p><table><tbody><tr><th><p>Metric</p></th><th><p>Q1 2024</p></th><th><p>Q2 2024</p></th><th><p>Change</p></th></tr><tr><td><p>Revenue</p></td><td><p>$2.1M</p></td><td><p>$2.5M</p></td><td><p>+19%</p></td></tr><tr><td><p>Profit Margin</p></td><td><p>20%</p></td><td><p>18%</p></td><td><p>-2%</p></td></tr><tr><td><p>CAC</p></td><td><p>$100</p></td><td><p>$110</p></td><td><p>+10%</p></td></tr></tbody></table><p>The dip in profit margin is attributed to increased server costs and marketing spend.</p><blockquote><p>We are on track to exceed our annual revenue target, but we must focus on optimizing our marketing spend to control CAC.</p></blockquote><h2>Action Items</h2><ul data-type="taskList"><li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Analyze marketing channel performance</p></div></li><li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>Develop a strategy for CAC reduction</p></div></li><li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>Prepare Q3 forecast</p></div></li></ul><p>We should also review our server resource allocation. Here is the script we use to check resource usage:</p><pre><code class="language-python">import os\n\ndef check_server_usage():\n    # Check CPU Usage\n    cpu_usage = os.popen("top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'").read().strip()\n    print(f"Current CPU Usage: {cpu_usage}%")\n\ncheck_server_usage()</code></pre><p>For more details, see the <a href="#" target="_blank" rel="noopener noreferrer nofollow">full presentation slides</a>.</p>`,
        folderId: 'folder-prod-1',
        summary: 'A detailed review of Q2 2024 performance, highlighting revenue growth, increased user engagement, and rising customer acquisition costs. Key financials and action items are outlined.',
        lastModified: now - 1000 * 60 * 5,
        isTrashed: false,
        versions: []
      },
      {
        id: uuidv4(),
        title: 'Apartment Budget',
        type: 'calculator',
        tags: ['budget', 'finance', 'home', 'monthly'],
        content: `# Comprehensive Personal Budget
# This calculator helps plan monthly and yearly finances.

# --- Monthly Income ---
# All figures are after tax.
salary_monthly = 4500
freelance_income = 350
total_monthly_income = salary_monthly + freelance_income

# --- Monthly Fixed Expenses ---
rent = 1800
utilities = 150       # Electric, Water, Gas
internet = 60
renters_insurance = 15
student_loan = 250
gym_membership = 40
subscriptions = 35    # Streaming, music, etc.

total_fixed_expenses = rent + utilities + internet + renters_insurance + student_loan + gym_membership + subscriptions

# --- Monthly Variable Expenses (Estimates) ---
groceries = 400
transportation = 100    # Gas & Public transit
dining_out = 200
entertainment = 150
shopping = 120
personal_care = 50

total_variable_expenses = groceries + transportation + dining_out + entertainment + shopping + personal_care

# --- Monthly Summary ---
total_monthly_expenses = total_fixed_expenses + total_variable_expenses
net_monthly_savings = total_monthly_income - total_monthly_expenses

# --- Yearly Projections ---
# These calculations project the monthly figures over a full year.
yearly_income = total_monthly_income * 12
yearly_expenses = total_monthly_expenses * 12
projected_yearly_savings = net_monthly_savings * 12

# --- Savings Goals ---
# Calculate how many months to reach a goal.
emergency_fund_goal = 5000
months_to_goal = emergency_fund_goal / net_monthly_savings`,
        folderId: 'folder-pers-1',
        summary: null,
        lastModified: now - 1000 * 60 * 10,
        isTrashed: false,
        versions: []
      },
      {
        id: uuidv4(),
        title: 'Website Launch Plan',
        type: 'markdown',
        tags: ['project', 'webdev', 'launch', 'marketing'],
        content: `# Website V2 Launch Plan

**Target Launch Date:** 2024-09-01

This document outlines the final steps and checks required for the successful launch of our new website. The project's success can be modeled by the formula $S = \\frac{U \\times C}{T}$, where $U$ is user satisfaction, $C$ is content quality, and $T$ is time to launch.

<img src="https://placehold.co/800x400.png" alt="Website mockup" data-ai-hint="website mockup" style="border-radius: 8px; margin: 1em 0;" />
*A mockup of the new homepage design.*

---

## Launch Timeline

| Phase                | Start Date | End Date   | Owner       |
| -------------------- | ---------- | ---------- | ----------- |
| Final Content Review | 2024-08-01 | 2024-08-15 | Marketing   |
| QA & Bug Fixing      | 2024-08-15 | 2024-08-25 | Engineering |
| DNS Propagation      | 2024-08-31 | 2024-09-01 | Ops         |
| Public Launch        | 2024-09-01 | 2024-09-01 | All         |

## Pre-Launch Checklist

- [x] **Content & SEO**
  - [x] Finalize all page content.
  - [ ] Set up URL redirects from the old site.
  - [x] Complete SEO metadata for all pages.
- [ ] **Technical**
  - [x] Complete mobile responsiveness testing.
  - [ ] Perform security audit.
  - [ ] Backup the current website.
- [ ] **Marketing**
  - [ ] Prepare launch day email campaign.
  - [ ] Schedule social media announcements.

## Style Snippet

Ensure the new call-to-action button style is applied:

\`\`\`css
.cta-button {
  background-color: #5A67D8; /* A nice blue */
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  transition: background-color 0.3s ease;
}

.cta-button:hover {
  background-color: #434190;
}
\`\`\`

For more information on the deployment process, see the [deployment guide](https://example.com).
`,
        folderId: 'folder-prod-1',
        summary: null,
        lastModified: now - 1000 * 60 * 20,
        isTrashed: false,
        versions: []
      },
      {
        id: uuidv4(),
        title: 'My Favorite Pasta Recipe',
        type: 'richtext',
        tags: ['recipe', 'cooking', 'personal'],
        content: `<h2>Simple & Delicious Garlic Butter Pasta</h2><p>This is my go-to recipe for a quick, easy, and incredibly satisfying weeknight dinner. It takes less than 20 minutes!</p><blockquote><p>As the saying goes, "Life is a combination of magic and pasta." - Federico Fellini</p></blockquote><h3>Ingredients</h3><ul><li><p>200g Spaghetti or your favorite pasta</p></li><li><p>4 cloves of garlic, minced</p></li><li><p>3 tablespoons of unsalted butter</p></li><li><p>1/4 cup reserved pasta water</p></li><li><p>Salt and fresh black pepper to taste</p></li><li><p>Red pepper flakes (optional)</p></li><li><p>Freshly grated Parmesan cheese</p></li><li><p>Chopped fresh parsley for garnish</p></li></ul><h3>Instructions</h3><ol><li><p>Cook pasta according to package directions. Before draining, reserve about a cup of the starchy pasta water.</p></li><li><p>While the pasta is cooking, melt butter in a large skillet over medium heat.</p></li><li><p>Add the minced garlic and red pepper flakes (if using) and cook for about 1-2 minutes until fragrant. Be careful not to burn the garlic.</p></li><li><p>Drain the pasta and add it directly to the skillet with the garlic butter.</p></li><li><p>Add 1/4 cup of the reserved pasta water to the skillet. Toss everything together until the pasta is well-coated and the sauce thickens slightly.</p></li><li><p>Season generously with salt and pepper. Serve immediately, topped with plenty of Parmesan cheese and fresh parsley.</p></li></ol>`,
        folderId: null,
        summary: null,
        lastModified: now,
        isTrashed: false,
        versions: []
      },
    ];
    
    return { notes: initialNotes, folders: initialFolders };
}
