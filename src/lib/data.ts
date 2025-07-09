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
  {
    value: 'richtext',
    label: 'Rich Text Note',
    icon: React.createElement(FileText, { className: 'size-4 shrink-0' })
  },
  {
    value: 'markdown',
    label: 'Markdown Note',
    icon: React.createElement(FileType,   { className: 'size-4 shrink-0' })
  },
  {
    value: 'calculator',
    label: 'Calculator Note',
    icon: React.createElement(Calculator, { className: 'size-4 shrink-0' })
  },
];

export function getInitialData(): { notes: Note[]; folders: Folder[] } {
  const initialFolders: Folder[] = [
    { id: 'folder-prod-1',  name: 'Productivity', isTrashed: false },
    { id: 'folder-pers-1',  name: 'Personal',     isTrashed: false },
    { id: 'folder-drafts-1',name: 'Drafts',       isTrashed: false },
  ];

  const now = Date.now();

  const initialNotes: Note[] = [
    // Quarterly Business Review (Rich Text)
    {
      id: uuidv4(),
      title: 'Quarterly Business Review',
      type: 'richtext',
      tags: ['qbr', 'finance', 'strategy', 'work'],
      content: `<h1>Q2 2024 Business Review</h1>
<p>Date: July 15, 2024</p>
<h2>Key Performance Indicators</h2>
<p>Overall, a strong quarter with a <strong>15% revenue growth</strong> YoY. User engagement is up by <em>22%</em>, largely due to the new features launched in April. <mark>However, customer acquisition cost (CAC) has increased by 10%.</mark></p>
<h3 style="text-align: center;">Financials Summary</h3>
<table>
  <thead>
    <tr>
      <th>Metric</th>
      <th>Q1 2024</th>
      <th>Q2 2024</th>
      <th>Change</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Revenue</td><td>$2.1M</td><td>$2.5M</td><td>+19%</td></tr>
    <tr><td>Profit Margin</td><td>20%</td><td>18%</td><td>-2%</td></tr>
    <tr><td>CAC</td><td>$100</td><td>$110</td><td>+10%</td></tr>
  </tbody>
</table>
<blockquote><p>We are on track to exceed our annual revenue target, but we must focus on optimizing our marketing spend to control CAC.</p></blockquote>
<h2>Action Items</h2>
<ul data-type="taskList">
  <li data-checked="true"  data-type="taskItem">
    <label><input type="checkbox" checked /><span></span></label>
    <div><p>Analyze marketing channel performance</p></div>
  </li>
  <li data-checked="false" data-type="taskItem">
    <label><input type="checkbox" /><span></span></label>
    <div><p>Develop a strategy for CAC reduction</p></div>
  </li>
  <li data-checked="false" data-type="taskItem">
    <label><input type="checkbox" /><span></span></label>
    <div><p>Prepare Q3 forecast</p></div>
  </li>
</ul>
<pre><code class="language-python">import os

def check_server_usage():
    # Check CPU Usage
    cpu_usage = os.popen(
        "top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}'"
    ).read().strip()
    print(f"Current CPU Usage: {cpu_usage}%")

check_server_usage()
</code></pre>
<p>For more details, see the <a href="#" target="_blank" rel="noopener noreferrer nofollow">full presentation slides</a>.</p>`,
      folderId: 'folder-prod-1',
      summary: 'A detailed review of Q2 2024 performance, highlighting revenue growth, increased user engagement, and rising customer acquisition costs.',
      lastModified: now - 1000 * 60 * 5,
      isTrashed:   false,
      versions:    []
    },

    // Team Meeting Notes (Rich Text)
    {
      id: uuidv4(),
      title: 'Team Meeting Notes',
      type: 'richtext',
      tags: ['meeting', 'team', 'notes'],
      content: `<h2>Team Sync – July 08, 2025</h2>
<p><strong>Date:</strong> July 08, 2025</p>
<ul>
  <li>Reviewed current sprint progress</li>
  <li>Discussed blockers on API integration</li>
  <li>Planned next demo: July 15, 2025</li>
</ul>
<blockquote><p>"Communication is the key to a successful project."</p></blockquote>
<h3>Action Items</h3>
<ul data-type="taskList">
  <li data-checked="false" data-type="taskItem">
    <label><input type="checkbox" /><span></span></label>
    <div><p>Finalize API docs</p></div>
  </li>
  <li data-checked="false" data-type="taskItem">
    <label><input type="checkbox" /><span></span></label>
    <div><p>Assign UI tasks for dashboard</p></div>
  </li>
</ul>`,
      folderId: 'folder-prod-1',
      summary: 'Notes from the July team sync, including sprint progress, blockers, and action items.',
      lastModified: now - 1000 * 60 * 20,
      isTrashed:   false,
      versions:    []
    },

    // Apartment Budget (Calculator)
    {
      id: uuidv4(),
      title: 'Apartment Budget',
      type: 'calculator',
      tags: ['budget','finance','home','monthly'],
      content: `# Comprehensive Personal Budget
# This calculator helps plan monthly and yearly finances.

# --- Monthly Income ---
salary_monthly = 4500
freelance_income = 350
total_monthly_income = salary_monthly + freelance_income

# --- Fixed Expenses ---
rent = 1800
utilities = 150
internet = 60
renters_insurance = 15
student_loan = 250
gym_membership = 40
subscriptions = 35

total_fixed_expenses = rent + utilities + internet + renters_insurance + student_loan + gym_membership + subscriptions

# --- Variable Expenses ---
groceries = 400
transportation = 100
dining_out = 200
entertainment = 150
shopping = 120
personal_care = 50

total_variable_expenses = groceries + transportation + dining_out + entertainment + shopping + personal_care

# --- Summary & Projections ---
total_monthly_expenses = total_fixed_expenses + total_variable_expenses
net_monthly_savings   = total_monthly_income - total_monthly_expenses
yearly_income         = total_monthly_income * 12
yearly_expenses       = total_monthly_expenses * 12
projected_yearly_savings = net_monthly_savings * 12

# --- Savings Goal ---
emergency_fund_goal = 5000
months_to_goal     = emergency_fund_goal / net_monthly_savings
`,
      folderId: 'folder-pers-1',
      summary: null,
      lastModified: now - 1000 * 60 * 10,
      isTrashed:   false,
      versions:    []
    },

    // BMI Calculator (Calculator)
    {
      id: uuidv4(),
      title: 'BMI Calculator',
      type: 'calculator',
      tags: ['health','fitness','calculator'],
      content: `weight_kg = 70
height_m  = 1.75
bmi       = weight_kg / (height_m ** 2)

# Categories:
# Underweight: <18.5
# Normal:      18.5–24.9
# Overweight:  25–29.9
# Obese:       ≥30
bmi
`,
      folderId: 'folder-pers-1',
      summary: 'Calculate your BMI and view category thresholds.',
      lastModified: now - 1000 * 60 * 15,
      isTrashed:   false,
      versions:    []
    },

    // Website Launch Plan (Markdown)
    {
      id: uuidv4(),
      title: 'Website Launch Plan',
      type: 'markdown',
      tags: ['project','webdev','launch','marketing'],
      content: `# Website V2 Launch Plan

**Target Launch Date:** 2024-09-01

This document outlines the final steps and checks required for the successful launch of our new website.

\`\`\`css
.cta-button {
  background-color: #5A67D8;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
}
.cta-button:hover {
  background-color: #434190;
}
\`\`\`

For more information, see the [deployment guide](https://example.com).`,
      folderId: 'folder-prod-1',
      summary: null,
      lastModified: now - 1000 * 60 * 20,
      isTrashed:   false,
      versions:    []
    },

    // Project Roadmap (Markdown)
    {
      id: uuidv4(),
      title: 'Project Roadmap',
      type: 'markdown',
      tags: ['roadmap','planning','release'],
      content: `# Project Roadmap 2025

## Q3 Milestones
- Feature A: Aug 2025
- Feature B: Sep 2025

![Milestone Chart](https://placehold.co/600x200)

\`\`\`bash
# Deployment command
npm run build && npm run deploy
\`\`\`

> "Plans are nothing; planning is everything." — Dwight D. Eisenhower`,
      folderId: 'folder-drafts-1',
      summary: 'High-level roadmap covering Q3 milestones and deployment steps.',
      lastModified: now - 1000 * 60 * 30,
      isTrashed:   false,
      versions:    []
    },

    // My Favorite Pasta Recipe (Rich Text)
    {
      id: uuidv4(),
      title: 'My Favorite Pasta Recipe',
      type: 'richtext',
      tags: ['recipe','cooking','personal'],
      content: `<h2>Simple &amp; Delicious Garlic Butter Pasta</h2>
<p>This is my go-to recipe for a quick, easy, and incredibly satisfying weeknight dinner.</p>
<blockquote><p>"Life is a combination of magic and pasta." – Federico Fellini</p></blockquote>
<h3>Ingredients</h3>
<ul>
  <li>200g Spaghetti</li>
  <li>4 cloves garlic, minced</li>
  <li>3 tbsp unsalted butter</li>
  <li>¼ cup reserved pasta water</li>
  <li>Salt & pepper to taste</li>
  <li>Red pepper flakes (optional)</li>
  <li>Parmesan & parsley to garnish</li>
</ul>
<h3>Instructions</h3>
<ol>
  <li>Cook pasta; reserve 1 cup pasta water.</li>
  <li>Melt butter over medium heat.</li>
  <li>Add garlic & flakes; cook 1–2 mins.</li>
  <li>Toss pasta in skillet; add water to emulsify.</li>
  <li>Season & serve with parmesan + parsley.</li>
</ol>`,
      folderId: null,
      summary: null,
      lastModified: now,
      isTrashed:   false,
      versions:    []
    }
  ];

  return { notes: initialNotes, folders: initialFolders };
}
