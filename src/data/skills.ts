/**
 * Skills, as typed data and deliberately NOT as a content collection.
 *
 * WHY NOT A COLLECTION. A collection is the right shape for content that is dated,
 * owned and versioned one entry at a time — projects, jobs, writing. Skills are a
 * taxonomy. They have no dates, no per-entry body, no lifecycle and no frontmatter of
 * their own: the only thing an entry would carry is its own label, and the group it
 * belongs to is the file's parent directory, so the frontmatter would be restating the
 * path. A folder of twenty-one markdown files whose entire payload is `label: Rust`
 * buys a glob loader and a Zod schema and pays for both with one more file per skill and
 * no way to express a group in the first place. The grouping is the content, and a
 * collection has no place to put it.
 *
 * So: one module, one export, typed. Adding a skill is one string in one array. The
 * type is checked by `astro check`, and a group cannot render without a label, because
 * the label is a field and not a comment.
 *
 * GROUPING IS BY WHAT THE ITEM IS, not by what balances the columns. Four groups of
 * 9, 5, 7 and 5 is uneven on purpose, and a group that would hold two items is not
 * a group.
 *
 * Two placements look like mistakes and are not:
 *
 *   - Rust appears twice, as a language and under native and systems. It is both, and a
 *     reader scanning either list is looking for the same fact.
 *   - Node.js and Tailwind CSS are under Web, not under Languages. One is a runtime and
 *     one is a styling layer; neither is a language a reviewer reads as competence in a
 *     language. Go is absent because no shipped project and no job on this site uses
 *     it.
 *
 * DELIBERATELY EXCLUDED. CCNAv7, IT Essentials, Six Sigma Yellow Belt and SCRUM
 * Foundation are real qualifications and they are not here on purpose. This is a
 * developer portfolio, and a vendor network certification and a process belt read as a
 * support and PM CV. The support and root-cause experience is already carried honestly
 * by the Experience section, where it belongs and where it is a strength rather than a
 * reframing. This is a decision, not an oversight. Do not "fix" it.
 */

export interface SkillGroup {
  /** Group heading, exactly as it should be read. Uppercased by CSS, not by the data. */
  label: string
  /** One entry per item, exactly as it should be displayed. */
  items: readonly string[]
}

/** The whole taxonomy. Order is the display order. */
export const skillGroups: readonly SkillGroup[] = [
  {
    label: 'Languages',
    items: ['TypeScript', 'JavaScript', 'Python', 'Rust', 'C#', 'Java', 'SQL', 'HTML5', 'CSS3'],
  },
  { label: 'Web', items: ['React', 'Vue.js', 'Node.js', 'REST APIs', 'Tailwind CSS'] },
  {
    label: 'Native & systems',
    items: ['Rust', 'GPUI', 'Axum', 'Windows', 'Linux', 'Networking', 'Virtualization'],
  },
  {
    label: 'Practices',
    items: [
      'Root Cause Analysis',
      'Incident & Problem Management',
      'System Diagnostics',
      'Technical Documentation',
      'Agile',
    ],
  },
]
