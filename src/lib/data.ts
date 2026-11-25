export type TabIcon = 'note' | 'doc' | 'team' | 'plain'

export interface NoteMeta {
  breadcrumbs: string[]
  modified: string
  backlinks: string[]
  related: string[]
  tags: string[]
  status: string
  priority: string
  created: string
  modifiedDate: string
  wordCount: string
  properties: { label: string; value: string }[]
}

export interface Note {
  id: string
  title: string
  icon: TabIcon
  content: string
  meta: NoteMeta
}

/* ------------------------------------------------------------------ */
/*  Note bodies                                                        */
/* ------------------------------------------------------------------ */

const secondBrainContent = `
<h2 class="ed-h1"><span class="md-mark">## </span>Knowledge Management</h2>
<h3 class="ed-h3"><span class="md-mark">### </span>Productivity System</h3>
<p class="ed-p">Building a <span class="note-link" data-note="second-brain">second brain</span> starts with capturing ideas as notes and connecting them into a personal knowledge management system that keeps growing over time.</p>
<p class="ed-p">A well organised system makes knowledge easy to capture, revisit, and connect — turning raw notes into a living knowledge base instead of a static archive.</p>
<p class="ed-p">If a note grows too large, split it into smaller notes and link them together; fragmented notes lose important context when they are not connected to the rest of the system.</p>
<ul class="ed-ul">
  <li class="ed-li"><span class="note-link" data-note="productivity-system">Personal Knowledge Management</span> forms the foundation for capturing and organising ideas.</li>
  <li class="ed-li">Lists with bullets and nested items keep related ideas close and easy to scan.</li>
  <li class="ed-li">Link notes together so context → connections across the vault stay visible.</li>
  <li class="ed-li">Turn scattered notes into a structured, searchable knowledge base.</li>
</ul>
<blockquote class="ed-quote">
  <p class="ed-p">A quote block highlights a productive idea worth keeping — a beautiful and stored thought regarded for quoting. Inclusion here demonstrates what a quote block looks like.</p>
  <p class="ed-p">The quote style keeps emphasis on the idea instead of the formatting.</p>
</blockquote>
<pre class="ed-code"><span class="ed-code-icon">&lt;/&gt;</span></pre>
<ul class="ed-ul">
  <li class="ed-li"><span class="note-link" data-note="productivity-system">[[Knowledge Management]]</span>, and <span class="note-link is-underlined" data-note="productivity-system">[[Productivity System]]</span></li>
  <li class="ed-li"><span class="note-link is-underlined" data-note="productivity-system">[[Productivity System]]</span></li>
  <li class="ed-li"><span class="note-link is-underlined" data-note="productivity-system">[[Productivity System]]</span></li>
  <li class="ed-li"><span class="note-link is-underlined" data-note="productivity-system">[[Productivity System]]</span></li>
  <li class="ed-li"><span class="note-link is-underlined" data-note="productivity-system">[[Productivity System]]</span></li>
</ul>
`.trim()

const projectsContent = `
<h2 class="ed-h1"><span class="md-mark">## </span>Projects Overview</h2>
<p class="ed-p">A single place to plan, track, and review every active project — from the first idea to the shipped release, with the notes that matter attached to it.</p>
<h3 class="ed-h3"><span class="md-mark">### </span>Active Projects</h3>
<ul class="ed-ul">
  <li class="ed-li"><span class="note-link" data-note="second-brain">Building a Second Brain</span> — personal knowledge management system.</li>
  <li class="ed-li"><span class="note-link" data-note="team-sync">Team Sync</span> — weekly alignment and decision log.</li>
  <li class="ed-li">Design system refresh — tokens, primitives, and documentation.</li>
  <li class="ed-li">Architecture notes — decisions recorded while they are fresh.</li>
</ul>
<blockquote class="ed-quote">
  <p class="ed-p">Plan in public, review in private, and keep every decision linked to the note where it was made.</p>
</blockquote>
<pre class="ed-code"><span class="ed-code-icon">&lt;/&gt;</span></pre>
<ul class="ed-ul">
  <li class="ed-li"><span class="note-link" data-note="team-sync">[[Team Sync]]</span>, and <span class="note-link is-underlined" data-note="second-brain">[[Building a Second Brain]]</span></li>
</ul>
`.trim()

const teamSyncContent = `
<h2 class="ed-h1"><span class="md-mark">## </span>Team Sync</h2>
<p class="ed-p">Weekly ritual: what shipped, what is blocked, and what needs a decision before the next sprint begins.</p>
<h3 class="ed-h3"><span class="md-mark">### </span>Agenda</h3>
<ul class="ed-ul">
  <li class="ed-li">Review last week's commitments and close the loop.</li>
  <li class="ed-li">Surface blockers early, while they are still cheap to fix.</li>
  <li class="ed-li">Decide owners and deadlines — write them down immediately.</li>
</ul>
<blockquote class="ed-quote">
  <p class="ed-p">Decisions recorded today become context for every note written tomorrow.</p>
</blockquote>
<pre class="ed-code"><span class="ed-code-icon">&lt;/&gt;</span></pre>
<ul class="ed-ul">
  <li class="ed-li"><span class="note-link is-underlined" data-note="projects-overview">[[Projects Overview]]</span></li>
</ul>
`.trim()

const documentsContent = `
<h2 class="ed-h1"><span class="md-mark">## </span>Documents</h2>
<p class="ed-p">Reference documents imported into the workspace. Keep filenames descriptive and link them from the notes that use them.</p>
<ul class="ed-ul">
  <li class="ed-li">Product briefs and specifications.</li>
  <li class="ed-li">Meeting transcripts that need a summary.</li>
  <li class="ed-li">Exports from other tools before they are processed.</li>
</ul>
`.trim()

const productivityContent = `
<h2 class="ed-h1"><span class="md-mark">## </span>Productivity System</h2>
<h3 class="ed-h3"><span class="md-mark">### </span>Daily loop</h3>
<p class="ed-p">Capture first, organise later. A productivity system works when the cost of writing something down is close to zero.</p>
<ul class="ed-ul">
  <li class="ed-li">Inbox — everything lands here first.</li>
  <li class="ed-li">Review — process the inbox once a day.</li>
  <li class="ed-li">Link — connect each note to at least one other note.</li>
</ul>
<blockquote class="ed-quote">
  <p class="ed-p">A note that is never linked is a note that will never be found again.</p>
</blockquote>
`.trim()

const dailyNotesContent = `
<h2 class="ed-h1"><span class="md-mark">## </span>Daily Notes</h2>
<p class="ed-p">A short log of what happened today and what deserves a dedicated note tomorrow.</p>
<ul class="ed-ul">
  <li class="ed-li">Captured three ideas about knowledge management.</li>
  <li class="ed-li">Linked <span class="note-link" data-note="productivity-system">[[Productivity System]]</span> to the weekly review.</li>
</ul>
`.trim()

const makeMeta = (m: Partial<NoteMeta>): NoteMeta => ({
  breadcrumbs: ['Home', 'Projects', 'Personal KM'],
  modified: 'Last modified: 5m ago',
  backlinks: [],
  related: [],
  tags: [],
  status: 'In Progress',
  priority: 'High',
  created: 'Oct 15, 2023',
  modifiedDate: 'Today, 10:15 AM',
  wordCount: '',
  properties: [],
  ...m,
})

/* ------------------------------------------------------------------ */
/*  Notes                                                              */
/* ------------------------------------------------------------------ */

export const NOTES: Note[] = [
  {
    id: 'second-brain',
    title: 'Building a Second Brain',
    icon: 'note',
    content: secondBrainContent,
    meta: makeMeta({
      backlinks: ['Note-taking App', 'Digital Garden'],
      related: ['Personal Knowledge Management', 'PRM Tools'],
      tags: ['#productivity', '#pkm', '#second-brain'],
      status: 'In Progress',
      priority: 'High',
      created: 'Oct 15, 2023',
      modifiedDate: 'Today, 10:15 AM',
      wordCount: '1,845 words',
      properties: [
        { label: 'Status', value: 'In Progress' },
        { label: 'Priority', value: 'High' },
      ],
    }),
  },
  {
    id: 'projects-overview',
    title: 'Projects Overview',
    icon: 'doc',
    content: projectsContent,
    meta: makeMeta({
      breadcrumbs: ['Home', 'Projects'],
      modified: 'Last modified: 1h ago',
      backlinks: ['Roadmap Q4', 'Design System'],
      related: ['Team Sync', 'Weekly Review'],
      tags: ['#projects', '#planning'],
      status: 'Planned',
      priority: 'Medium',
      created: 'Nov 2, 2023',
      modifiedDate: 'Yesterday, 4:20 PM',
      wordCount: '962 words',
      properties: [
        { label: 'Status', value: 'Planned' },
        { label: 'Priority', value: 'Medium' },
      ],
    }),
  },
  {
    id: 'team-sync',
    title: 'Team Sync',
    icon: 'team',
    content: teamSyncContent,
    meta: makeMeta({
      breadcrumbs: ['Home', 'Projects', 'Team'],
      modified: 'Last modified: 2h ago',
      backlinks: ['Daily Notes', 'Sprint 12'],
      related: ['Projects Overview', 'Meeting Notes'],
      tags: ['#team', '#sync'],
      status: 'Active',
      priority: 'Low',
      created: 'Oct 28, 2023',
      modifiedDate: '2h ago',
      wordCount: '534 words',
      properties: [
        { label: 'Status', value: 'Active' },
        { label: 'Priority', value: 'Low' },
      ],
    }),
  },
  {
    id: 'productivity-system',
    title: 'Productivity System',
    icon: 'note',
    content: productivityContent,
    meta: makeMeta({
      breadcrumbs: ['Home', 'Projects', 'Personal KM'],
      modified: 'Last modified: 12m ago',
      backlinks: ['Building a Second Brain', 'Weekly Review'],
      related: ['Daily Notes', 'Knowledge Management'],
      tags: ['#productivity', '#habits'],
      status: 'In Progress',
      priority: 'High',
      created: 'Oct 12, 2023',
      modifiedDate: '12m ago',
      wordCount: '640 words',
      properties: [
        { label: 'Status', value: 'In Progress' },
        { label: 'Priority', value: 'High' },
      ],
    }),
  },
  {
    id: 'daily-notes',
    title: 'Daily Notes',
    icon: 'plain',
    content: dailyNotesContent,
    meta: makeMeta({
      breadcrumbs: ['Home', 'Journal'],
      modified: 'Last modified: 25m ago',
      backlinks: ['Team Sync'],
      related: ['Weekly Review'],
      tags: ['#journal', '#daily'],
      status: 'Active',
      priority: 'Low',
      created: 'Nov 26, 2026',
      modifiedDate: '25m ago',
      wordCount: '210 words',
      properties: [
        { label: 'Status', value: 'Active' },
        { label: 'Priority', value: 'Low' },
      ],
    }),
  },
  {
    id: 'documents',
    title: 'Documents',
    icon: 'plain',
    content: documentsContent,
    meta: makeMeta({
      breadcrumbs: ['Home', 'Archive'],
      modified: 'Last modified: 3d ago',
      backlinks: [],
      related: ['Projects Overview'],
      tags: ['#archive'],
      status: 'Archived',
      priority: 'Low',
      created: 'Sep 30, 2023',
      modifiedDate: '3d ago',
      wordCount: '128 words',
      properties: [
        { label: 'Status', value: 'Archived' },
        { label: 'Priority', value: 'Low' },
      ],
    }),
  },
]

export const NOTE_MAP = Object.fromEntries(NOTES.map((n) => [n.id, n])) as Record<
  string,
  Note
>

export const emptyNote = (id: string, title: string): Note => ({
  id,
  title,
  icon: 'plain',
  content: `<h2 class="ed-h1"><span class="md-mark">## </span>${title}</h2><p class="ed-p">Start writing…</p>`,
  meta: makeMeta({
    breadcrumbs: ['Home', 'Notes'],
    modified: 'Last modified: just now',
    backlinks: [],
    related: ['Building a Second Brain'],
    tags: ['#draft'],
    status: 'Draft',
    priority: 'Low',
    created: 'Today',
    modifiedDate: 'just now',
    wordCount: '0 words',
    properties: [
      { label: 'Status', value: 'Draft' },
      { label: 'Priority', value: 'Low' },
    ],
  }),
})

/* ------------------------------------------------------------------ */
/*  Workspace tree                                                     */
/* ------------------------------------------------------------------ */

export interface TreeNode {
  id: string
  name: string
  kind: 'folder' | 'file'
  noteId?: string
  children?: TreeNode[]
}

export const WORKSPACE_TREE: TreeNode[] = [
  {
    id: 'projects',
    name: 'Projects',
    kind: 'folder',
    children: [
      {
        id: 'projects-second-brain',
        name: 'Building a Second Brain',
        kind: 'file',
        noteId: 'second-brain',
      },
      {
        id: 'projects-overview-note',
        name: 'Projects Overview',
        kind: 'file',
        noteId: 'projects-overview',
      },
    ],
  },
  {
    id: 'resources',
    name: 'Resources',
    kind: 'folder',
    children: [
      {
        id: 'resources-productivity',
        name: 'Productivity System',
        kind: 'file',
        noteId: 'productivity-system',
      },
    ],
  },
  { id: 'archive', name: 'Archive', kind: 'folder', children: [] },
  { id: 'products', name: 'Products', kind: 'folder', children: [] },
  {
    id: 'archive-expanded',
    name: 'Archive',
    kind: 'folder',
    children: [
      { id: 'archive-doc-1', name: 'Documents', kind: 'file', noteId: 'documents' },
      { id: 'archive-doc-2', name: 'Documents', kind: 'file', noteId: 'documents' },
    ],
  },
]

/* ------------------------------------------------------------------ */
/*  Command palette                                                    */
/* ------------------------------------------------------------------ */

export type CommandId =
  | 'new-note'
  | 'search-notes'
  | 'graph-view'
  | 'new-folder'
  | 'settings'

export interface Command {
  id: CommandId
  label: string
  shortcut: string
}

export const COMMANDS: Command[] = [
  { id: 'new-note', label: 'Create New Note', shortcut: 'Ctrl N' },
  { id: 'search-notes', label: 'Search Notes', shortcut: '/' },
  { id: 'graph-view', label: 'Open Graph View', shortcut: 'Ctrl ⇧ G' },
  { id: 'new-folder', label: 'Create Folder', shortcut: 'Ctrl ⇧ N' },
  { id: 'settings', label: 'Open Settings', shortcut: 'Ctrl ,' },
]
