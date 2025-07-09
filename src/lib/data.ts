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
        content: `<h1>Q2 2024 Business Review</h1><p>Date: July 15, 2024</p><h2>Key Performance Indicators</h2><p>Overall, a strong quarter with a <strong>15% revenue growth</strong> YoY. User engagement is up by <em>22%</em>, largely due to the new features launched in April. <mark>However, customer acquisition cost (CAC) has increased by 10%.</mark></p><h3>Financials</h3><ul><li><p><strong>Revenue:</strong> $2.5M</p></li><li><p><strong>Profit Margin:</strong> 18%</p></li><li><p><strong>CAC:</strong> $110</p></li></ul><blockquote><p>We are on track to exceed our annual revenue target, but we must focus on optimizing our marketing spend to control CAC.</p></blockquote><h2>Action Items</h2><ul data-type="taskList"><li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Analyze marketing channel performance</p></div></li><li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>Develop a strategy for CAC reduction</p></div></li><li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>Prepare Q3 forecast</p></div></li></ul><p>For more details, see the <a href="#" target="_blank" rel="noopener noreferrer nofollow">full presentation slides</a>.</p>`,
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
        content: `# Monthly Apartment Budget\n# All figures are estimates for planning.\n\n# --- Income ---\nmy_salary = 4500\nside_hustle = 350\ntotal_income = my_salary + side_hustle\n\n# --- Fixed Expenses ---\nrent = 1800\nutilities = 150       # Electric, Water, Gas\ninternet = 60\nrenters_insurance = 15\n\n# --- Variable Expenses ---\ngroceries = 400\ntransportation = 100    # Gas & Public transit\ndining_out = 250\nentertainment = 150\nshopping = 100\n\n# --- Totals ---\ntotal_fixed = rent + utilities + internet + renters_insurance\ntotal_variable = groceries + transportation + dining_out + entertainment + shopping\ntotal_expenses = total_fixed + total_variable\n\n# --- Final Balance ---\n# This is what's left for savings or other goals.\nremaining_balance = total_income - total_expenses`,
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
        content: `# Website V2 Launch Plan\n\n**Target Launch Date:** 2024-09-01\n\nThis document outlines the final steps and checks required for the successful launch of our new website.\n\n## Launch Timeline\n\n| Phase | Start Date | End Date | Owner |\n|---|---|---|---|\n| Final Content Review | 2024-08-01 | 2024-08-15 | Marketing |\n| QA & Bug Fixing | 2024-08-15 | 2024-08-25 | Engineering |\n| DNS Propagation | 2024-08-31 | 2024-09-01 | Ops |\n| Public Launch | 2024-09-01 | 2024-09-01 | All |\n\n## Pre-Launch Checklist\n\n- [x] Finalize all page content\n- [x] Complete mobile responsiveness testing\n- [ ] Set up URL redirects from the old site\n- [ ] Perform security audit\n- [ ] Backup the current website\n\n## Style Snippet\n\nEnsure the new call-to-action button style is applied:\n\n\`\`\`css\n.cta-button {\n  background-color: #5A67D8;\n  color: white;\n  padding: 12px 24px;\n  border-radius: 8px;\n  text-decoration: none;\n}\n\`\`\`\n\nFor more information on the deployment process, see the [deployment guide](https://example.com).\n`,
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
        content: `<h2>Simple & Delicious Garlic Butter Pasta</h2><p>This is my go-to recipe for a quick, easy, and incredibly satisfying weeknight dinner. It takes less than 20 minutes!</p><h3>Ingredients</h3><ul><li><p>200g Spaghetti or your favorite pasta</p></li><li><p>4 cloves of garlic, minced</p></li><li><p>3 tablespoons of unsalted butter</p></li><li><p>1/4 cup reserved pasta water</p></li><li><p>Salt and fresh black pepper to taste</p></li><li><p>Red pepper flakes (optional)</p></li><li><p>Freshly grated Parmesan cheese</p></li><li><p>Chopped fresh parsley for garnish</p></li></ul><h3>Instructions</h3><ol><li><p>Cook pasta according to package directions. Before draining, reserve about a cup of the starchy pasta water.</p></li><li><p>While the pasta is cooking, melt butter in a large skillet over medium heat.</p></li><li><p>Add the minced garlic and red pepper flakes (if using) and cook for about 1-2 minutes until fragrant. Be careful not to burn the garlic.</p></li><li><p>Drain the pasta and add it directly to the skillet with the garlic butter.</p></li><li><p>Add 1/4 cup of the reserved pasta water to the skillet. Toss everything together until the pasta is well-coated and the sauce thickens slightly.</p></li><li><p>Season generously with salt and pepper. Serve immediately, topped with plenty of Parmesan cheese and fresh parsley.</p></li></ol>`,
        folderId: null,
        summary: null,
        lastModified: now,
        isTrashed: false,
        versions: []
      },
    ];
    
    return { notes: initialNotes, folders: initialFolders };
}
