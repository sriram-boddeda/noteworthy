import { v4 as uuidv4 } from 'uuid';
import { Calculator, FileText, FileType } from 'lucide-react';
import React from 'react';

export interface Note {
  id: string;
  title: string;
  type: 'richtext' | 'markdown' | 'calculator';
  tags: string[];
  content: string;
  folderId?: string | null;
  summary?: string | null;
}

export interface Folder {
  id: string;
  name: string;
}

export const noteTypeOptions = [
    { value: 'richtext', label: 'Rich Text Note', icon: React.createElement(FileText, { className: "size-4" }) },
    { value: 'markdown', label: 'Markdown Note', icon: React.createElement(FileType, { className: "size-4" }) },
    { value: 'calculator', label: 'Calculator Note', icon: React.createElement(Calculator, { className: "size-4" }) },
];


export function getInitialData(): { notes: Note[], folders: Folder[] } {
    const initialFolders: Folder[] = [
      { id: uuidv4(), name: 'Productivity' },
      { id: uuidv4(), name: 'Personal' },
      { id: uuidv4(), name: 'Drafts' },
    ];

    const initialNotes: Note[] = [
      { id: uuidv4(), title: 'Trip Expenses', type: 'calculator', tags: ['travel', 'finance'], content: `# Trip Expenses Calculator\n# A simple calculator to split costs for a weekend getaway.\n\nnum_friends = 4\n\n# Costs\nhotel_total = 1200\nflight_per_person = 350\ncar_rental = 250\nfood_and_drinks = 580\nactivities = 320\n\n# Calculations\ntotal_flights = flight_per_person * num_friends\ntotal_shared_costs = hotel_total + car_rental + food_and_drinks + activities\ntotal_cost = total_shared_costs + total_flights\ncost_per_person = total_cost / num_friends\n`, folderId: initialFolders[0].id, summary: null },
      { id: uuidv4(), title: 'Meeting Notes', type: 'richtext', tags: ['work', 'meeting', 'q2'], content: '<h2>Meeting Notes Q2</h2><p>A lengthy discussion about the <strong>Q3 roadmap</strong> and resource allocation for the new "Phoenix" project. Key takeaways include the need for additional frontend developers and a revised marketing strategy. We also need to finalize the budget by next week.</p><p>Follow-up actions:</p><ul><li>HR to start sourcing frontend candidates.</li><li>Marketing team to present new strategy on Friday.</li><li>Finance to provide budget draft by EOD Wednesday.</li></ul>', folderId: initialFolders[0].id, summary: 'This note covers the Q2 meeting discussing the Q3 roadmap for the "Phoenix" project. Key outcomes include the need for more frontend developers, a new marketing strategy, and a finalized budget by next week, with specific action items assigned to HR, Marketing, and Finance.' },
      { id: uuidv4(), title: 'Project Proposal', type: 'markdown', tags: ['work', 'project', 'planning'], content: `# Project Titan Proposal\n\n**Author**: Alex Doe\n**Date**: May 20, 2024\n\n## 1. Introduction\nThis document outlines the proposal for Project Titan, a new initiative to overhaul our data processing pipeline. The goal is to improve efficiency by 40% and reduce operational costs.\n\n## 2. Goals\n- **Efficiency**: Reduce data processing time from 5 hours to 3 hours.\n- **Scalability**: Ensure the new system can handle 10x our current data volume.\n- **Cost**: Decrease monthly infrastructure spending by at least 15%.\n\n## 3. Tech Stack\nWe propose using the following technologies:\n\n| Layer | Technology |\n|---|---|\n| Orchestration | Airflow |\n| Processing | Spark |\n| Storage | Cloud Storage |\n`, folderId: initialFolders[1].id, summary: null },
      { id: uuidv4(), title: 'Grocery List', type: 'richtext', tags: ['home', 'shopping'], content: '<h2>Grocery List</h2><ul><li>Milk</li><li>Bread</li><li>Eggs</li><li>Cheese</li></ul>', folderId: null, summary: null },
    ];
    
    return { notes: initialNotes, folders: initialFolders };
}
