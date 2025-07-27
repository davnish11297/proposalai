export interface Suggestion {
  id: string;
  title: string;
  content: string;
  category: string;
}

export const generateProposalSuggestions = async (): Promise<Suggestion[]> => {
  // Mock suggestions for now - in a real app, this would call the AI service
  const mockSuggestions: Suggestion[] = [
    {
      id: '1',
      title: 'Professional Introduction',
      content: 'We are excited to present this comprehensive proposal for your consideration. Our team has carefully analyzed your requirements and developed a tailored solution that addresses your specific needs.',
      category: 'Introduction'
    },
    {
      id: '2',
      title: 'Executive Summary',
      content: 'This proposal outlines a strategic approach to achieving your objectives through innovative solutions and proven methodologies. Our approach combines industry best practices with cutting-edge technology.',
      category: 'Summary'
    },
    {
      id: '3',
      title: 'Project Scope',
      content: 'The project scope encompasses all aspects of the solution, including planning, development, testing, and implementation phases. We will work closely with your team to ensure seamless integration.',
      category: 'Scope'
    },
    {
      id: '4',
      title: 'Timeline & Milestones',
      content: 'Our proposed timeline includes key milestones and deliverables to ensure transparent project management. Regular progress updates and stakeholder meetings will keep everyone informed.',
      category: 'Timeline'
    },
    {
      id: '5',
      title: 'Investment & ROI',
      content: 'The proposed investment represents excellent value for money, with a clear return on investment timeline. Our competitive pricing reflects our commitment to delivering maximum value.',
      category: 'Pricing'
    },
    {
      id: '6',
      title: 'Team & Expertise',
      content: 'Our experienced team brings together diverse expertise and proven track records in delivering successful projects. We are committed to your success and will go above and beyond to exceed expectations.',
      category: 'Team'
    }
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return mockSuggestions;
}; 