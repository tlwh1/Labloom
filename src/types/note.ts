export type NoteTag = {
  id: string;
  label: string;
};

export type NoteAttachment = {
  id?: string;
  name: string;
  size: number;
  type: string;
  previewUrl?: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  category: string;
  tags: NoteTag[];
  attachments: NoteAttachment[];
};
