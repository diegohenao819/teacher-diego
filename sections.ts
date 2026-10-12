import type { InputField, PageType } from './types';

// The job a part does in the essay. Each role has one highlighter, so the same
// colour always means the same job (the thesis and its restatement are both blue).
export type PartRole = 'opening' | 'position' | 'support' | 'reasoning' | 'closing';

export interface PartConfig {
  field: InputField;
  label: string;
  role: PartRole;
  hint: string;
  example: string;
  minRows: number;
}

export interface SectionConfig {
  id: PageType;
  title: string;
  navLabel: string;
  shortNavLabel: string;
  /** What the student is about to write, used in the page title: "Write your ___." */
  noun: string;
  /** Max points on Diego's essay rubric. */
  points: number;
  parts: PartConfig[];
  needsThesis: boolean;
}

export const THESIS_CONTEXT: PartConfig = {
  field: 'thesisContext',
  label: 'Your thesis',
  role: 'position',
  hint: 'From your introduction. Not part of this paragraph.',
  example: '',
  minRows: 2,
};

export const SECTIONS: Record<PageType, SectionConfig> = {
  introduction: {
    id: 'introduction',
    title: 'Introduction',
    navLabel: 'Introduction',
    shortNavLabel: 'Intro',
    noun: 'introduction',
    points: 0.7,
    needsThesis: false,
    parts: [
      {
        field: 'hook',
        label: 'Hook',
        role: 'opening',
        hint: 'An engaging opener: a question, an anecdote, or a statistic.',
        example: 'What if the work week could be a day shorter without sacrificing pay?',
        minRows: 2,
      },
      {
        field: 'background',
        label: 'Background',
        role: 'support',
        hint: 'Briefly give the context the reader needs.',
        example:
          'The traditional five-day work week has been the standard for over a century, but modern businesses are starting to question this model.',
        minRows: 3,
      },
      {
        field: 'thesis',
        label: 'Thesis with two arguments',
        role: 'position',
        hint: 'State your stance and your two reasons (A and B).',
        example:
          'Implementing a four-day work week enhances company performance by boosting employee well-being and attracting top talent.',
        minRows: 2,
      },
      {
        field: 'transition',
        label: 'Transition',
        role: 'closing',
        hint: 'Lead the reader smoothly into your first body paragraph.',
        example:
          'By examining the benefits for current employees and its appeal to new hires, the advantages of this model become clear.',
        minRows: 2,
      },
    ],
  },
  body: {
    id: 'body',
    title: 'Body paragraph\u00a01',
    navLabel: 'Body 1',
    shortNavLabel: 'Body 1',
    noun: 'first body paragraph',
    points: 1,
    needsThesis: true,
    parts: [
      {
        field: 'claim',
        label: 'Claim',
        role: 'position',
        hint: 'State your first argument (reason A from your thesis).',
        example: 'Remote work increases employee productivity.',
        minRows: 2,
      },
      {
        field: 'evidence',
        label: 'Evidence',
        role: 'support',
        hint: 'Give a specific fact, example, or reason.',
        example: 'A Stanford study found remote workers were 13% more productive.',
        minRows: 3,
      },
      {
        field: 'warrant',
        label: 'Warrant',
        role: 'reasoning',
        hint: 'Explain how your evidence proves your claim.',
        example: 'This productivity gain comes from fewer distractions and more focused work time at home.',
        minRows: 3,
      },
      {
        field: 'conclusion',
        label: 'Conclusion',
        role: 'closing',
        hint: 'Restate your claim in a new way.',
        example: 'Therefore, offering remote options is a key strategy for improving business output.',
        minRows: 2,
      },
    ],
  },
  body2: {
    id: 'body2',
    title: 'Body paragraph\u00a02',
    navLabel: 'Body 2',
    shortNavLabel: 'Body 2',
    noun: 'second body paragraph',
    points: 1,
    needsThesis: true,
    parts: [
      {
        field: 'claim',
        label: 'Claim',
        role: 'position',
        hint: 'State your second argument (reason B from your thesis).',
        example: 'A shorter work week also helps companies attract top talent.',
        minRows: 2,
      },
      {
        field: 'evidence',
        label: 'Evidence',
        role: 'support',
        hint: 'Give a specific fact, example, or reason.',
        example: 'A Gallup poll found that 54% of workers would switch jobs for one that offers a four-day week.',
        minRows: 3,
      },
      {
        field: 'warrant',
        label: 'Warrant',
        role: 'reasoning',
        hint: 'Explain how your evidence proves your claim.',
        example: 'This willingness to change jobs shows that flexible schedules are a powerful recruitment tool.',
        minRows: 3,
      },
      {
        field: 'conclusion',
        label: 'Conclusion',
        role: 'closing',
        hint: 'Restate your claim in a new way.',
        example: 'Thus, offering a four-day week gives companies a clear edge in the competition for skilled employees.',
        minRows: 2,
      },
    ],
  },
  counterArgument: {
    id: 'counterArgument',
    title: 'Counter-argument',
    navLabel: 'Counter-argument',
    shortNavLabel: 'Counter',
    noun: 'counter-argument',
    points: 1,
    needsThesis: true,
    parts: [
      {
        field: 'counterArgument',
        label: 'Counter-argument',
        role: 'opening',
        hint: 'State a reasonable opposing view.',
        example: 'Some argue that remote work harms team collaboration.',
        minRows: 2,
      },
      {
        field: 'rebuttal',
        label: 'Rebuttal',
        role: 'position',
        hint: 'Answer the counter-argument directly.',
        example: 'However, modern tools and structured communication can maintain strong collaboration.',
        minRows: 3,
      },
      {
        field: 'evidence',
        label: 'Evidence',
        role: 'support',
        hint: 'Give evidence that supports your rebuttal.',
        example: 'A 2022 survey showed 85% of remote teams use dedicated collaboration software daily.',
        minRows: 3,
      },
      {
        field: 'warrant',
        label: 'Warrant',
        role: 'reasoning',
        hint: 'Explain how your evidence supports the rebuttal and weakens the counter-argument.',
        example: 'This reliance on specific tools shows that collaboration has adapted, not disappeared.',
        minRows: 3,
      },
      {
        field: 'conclusion',
        label: 'Conclusion',
        role: 'closing',
        hint: 'Say why your rebuttal is stronger.',
        example:
          'Thus, while collaboration concerns are valid, they are solvable, making the benefits of remote work outweigh the drawbacks.',
        minRows: 2,
      },
    ],
  },
  conclusion: {
    id: 'conclusion',
    title: 'Conclusion',
    navLabel: 'Conclusion',
    shortNavLabel: 'Conclusion',
    noun: 'conclusion',
    points: 0.5,
    needsThesis: false,
    parts: [
      {
        field: 'restatement',
        label: 'Restate your thesis',
        role: 'position',
        hint: 'Say your thesis again in a new way.',
        example:
          'Ultimately, a four-day work week is a strategic move that strengthens a company both internally and in the competitive job market.',
        minRows: 2,
      },
      {
        field: 'summary',
        label: 'Summarize arguments and counter',
        role: 'support',
        hint: 'Recap reasons A and B and why they outweigh the counter-argument.',
        example:
          'The model improves staff well-being and recruitment power. While some fear collaboration may suffer, this is manageable and does not negate the core benefits.',
        minRows: 3,
      },
      {
        field: 'callToAction',
        label: 'Call to action or reflection',
        role: 'closing',
        hint: 'End with a final thought or recommendation.',
        example:
          'Therefore, business leaders should seriously consider piloting a shorter week to build a more resilient and attractive workplace.',
        minRows: 2,
      },
    ],
  },
};

export const SECTION_ORDER: PageType[] = ['introduction', 'body', 'body2', 'counterArgument', 'conclusion'];

export const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
