// models/Post.ts
import { Schema, model, models, Document, Types } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content: string;         // Sanitised HTML
  excerpt?: string;        // Auto-generated first 200 chars of plain text
  image?: string;          // URL (Cloudinary or relative path)
  status: 'draft' | 'published';
  author: Types.ObjectId;  // ref: 'User'
  likes: Types.ObjectId[]; // array of User IDs
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    title:   { type: String, required: true, trim: true },
    content: { type: String, required: true },
    excerpt: { type: String },
    image:   { type: String },
    status:  { type: String, enum: ['draft', 'published'], default: 'draft' },
    author:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    likes:   [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Full-text search index on title and content
PostSchema.index({ title: 'text', content: 'text' });

export const Post = models.Post || model<IPost>('Post', PostSchema);
