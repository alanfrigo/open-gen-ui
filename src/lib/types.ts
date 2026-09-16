export type Media = {
  id: string;
  name: string;
  kind: 'image' | 'video';
  url: string;
  prompt?: string;
  projectId?: string;
  createdAt?: string;
};
export type Assistant = {
  id: string;
  name: string;
  description: string;
  instructions: string;
  skills: string[];
};
export type Project = { id: string; name: string; description: string };
export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  media?: Media[];
};
export type Workspace = {
  projects: Project[];
  assistants: Assistant[];
  skills: Skill[];
  messages: Message[];
  media: Media[];
};
export type Skill = {
  id: string;
  name: string;
  content: string;
  source?: string;
};
export type Model = {
  id: string;
  name: string;
  kind: 'image' | 'video';
  provider: string;
};
export const starterModels: Model[] = [
  {
    id: 'google/gemini-2.5-flash-image',
    name: 'Gemini Flash Image',
    kind: 'image',
    provider: 'Google',
  },
  {
    id: 'openai/gpt-5-image',
    name: 'GPT Image',
    kind: 'image',
    provider: 'OpenAI',
  },
  { id: 'google/veo-3.1', name: 'Veo 3.1', kind: 'video', provider: 'Google' },
  {
    id: 'openai/sora-2-pro',
    name: 'Sora 2 Pro',
    kind: 'video',
    provider: 'OpenAI',
  },
];
export const initialWorkspace: Workspace = {
  projects: [],
  assistants: [
    {
      id: 'creative',
      name: 'Diretor criativo',
      description: 'Do primeiro insight ao último frame.',
      instructions:
        'Atue como diretor criativo. Ajude a definir composição, luz, narrativa visual e movimento. Preserve a intenção do usuário.',
      skills: [],
    },
  ],
  skills: [],
  messages: [],
  media: [],
};
