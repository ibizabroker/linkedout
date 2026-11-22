import type { Workplace } from '@/lib/tracker/job-facts';

export type DemoJob = {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly location: string;
  readonly workplace: Workplace;
  readonly postedAgo: string;
  readonly applicants: number;
  readonly easyApply: boolean;
  readonly applied: boolean;
  readonly viewed: boolean;
  readonly saved: boolean;
  readonly reposted: boolean;
  readonly agency: boolean;
  readonly about: readonly string[];
};

const ABOUT: Readonly<Record<string, readonly string[]>> = {
  '4101': [
    'Build and maintain the screens people use all day.',
    'Work with design and backend on small, steady releases.',
    'Care about accessibility and speed.',
  ],
  '4102': [
    'Design the flows patients and staff use every day.',
    'Turn rough ideas into clear, tested screens.',
    'Share your work early and often.',
  ],
  '4103': [
    'Our client needs a frontend developer to start fast.',
    'Contract terms to be discussed with the recruiter.',
    'Send a résumé and we will be in touch.',
  ],
  '4104': [
    'Turn shipping data into plain weekly reports.',
    'Answer questions from the operations team.',
    'Comfortable with spreadsheets and basic SQL.',
  ],
  '4105': [
    'Our client is hiring a senior frontend developer.',
    'Start date is flexible but soon.',
    'Apply now and a recruiter will call.',
  ],
  '4106': [
    'Set the technical direction for a small product team.',
    'Review designs, write code and mentor others.',
    'Pick the right tool, then keep it simple.',
  ],
  '4107': [
    'A short contract for a product designer on a client project.',
    'Hand off clean files to the build team.',
    'Weeks, not months.',
  ],
  '4108': [
    'Help new customers get set up and stay happy.',
    'Answer questions, spot problems early and pass on what you learn.',
    'Friendly, clear writing matters here.',
  ],
  '4109': [
    'Contract-to-hire design role with our client.',
    'Own screens from sketch to hand-off.',
    'Conversion to full time after the first term.',
  ],
  '4110': [
    'Build the services behind our data tools.',
    'Keep them fast, tested and easy to change.',
    'Share on-call with a small team.',
  ],
  '4111': [
    'Keep daily operations running smoothly.',
    'Schedule, track and report across teams.',
    'Careful, calm and organized.',
  ],
  '4112': [
    'Our client needs a frontend developer on site.',
    'Build pages from designs and fix bugs.',
    'Apply to hear more from the recruiter.',
  ],
};

function job(
  id: string,
  title: string,
  company: string,
  location: string,
  workplace: Workplace,
  postedAgo: string,
  applicants: number,
  flags: Partial<
    Pick<DemoJob, 'easyApply' | 'applied' | 'viewed' | 'saved' | 'reposted' | 'agency'>
  > = {},
): DemoJob {
  return {
    id,
    title,
    company,
    location,
    workplace,
    postedAgo,
    applicants,
    easyApply: flags.easyApply ?? false,
    applied: flags.applied ?? false,
    viewed: flags.viewed ?? false,
    saved: flags.saved ?? false,
    reposted: flags.reposted ?? false,
    agency: flags.agency ?? false,
    about: ABOUT[id] ?? [],
  };
}

export const DEMO_JOBS: readonly DemoJob[] = [
  job(
    '4101',
    'Senior Frontend Engineer',
    'Harbor & Pine Software',
    'Austin, TX',
    'Hybrid',
    '2 days ago',
    212,
    {
      viewed: true,
    },
  ),
  job('4102', 'Product Designer', 'Alder Health Systems', 'Remote', 'Remote', '5 days ago', 38, {
    applied: true,
    easyApply: true,
  }),
  job(
    '4103',
    'Frontend Developer, Urgent Hire',
    'Brightpath Staffing',
    'Denver, CO',
    'On-site',
    '1 day ago',
    1640,
    {
      agency: true,
    },
  ),
  job('4104', 'Data Analyst', 'Lumen Freight', 'Chicago, IL', 'Hybrid', '3 days ago', 87, {
    saved: true,
    easyApply: true,
  }),
  job(
    '4105',
    'Senior Frontend Developer, Immediate Start',
    'Brightpath Staffing',
    'Denver, CO',
    'Hybrid',
    '1 week ago',
    960,
    { reposted: true, agency: true },
  ),
  job('4106', 'Staff Software Engineer', 'Tidewater Labs', 'Remote', 'Remote', '4 days ago', 415, {
    applied: true,
  }),
  job(
    '4107',
    'Product Designer (Contract)',
    'Northgate Talent Partners',
    'Seattle, WA',
    'On-site',
    '2 days ago',
    520,
    {
      viewed: true,
      agency: true,
    },
  ),
  job(
    '4108',
    'Customer Success Manager',
    'Quillworks',
    'Portland, OR',
    'Hybrid',
    '6 hours ago',
    8,
    {
      easyApply: true,
    },
  ),
  job(
    '4109',
    'Sr. Product Designer, Contract to Hire',
    'Northgate Talent Partners',
    'Seattle, WA',
    'Hybrid',
    '2 weeks ago',
    735,
    { reposted: true, agency: true },
  ),
  job('4110', 'Backend Engineer', 'Fenwick Analytics', 'Remote', 'Remote', '3 days ago', 154, {
    applied: true,
  }),
  job(
    '4111',
    'Operations Coordinator',
    'Copperleaf Robotics',
    'Boston, MA',
    'On-site',
    '1 day ago',
    26,
    {
      saved: true,
      viewed: true,
      easyApply: true,
    },
  ),
  job(
    '4112',
    'Frontend Developer',
    'Brightpath Staffing',
    'Denver, CO',
    'On-site',
    '5 days ago',
    1210,
    {
      viewed: true,
      agency: true,
    },
  ),
];
