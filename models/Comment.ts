// models/Comment.ts
import { Schema, model, models, Document, Types } from 'mongoose';

export interface IComment extends Document {
  post: Types.ObjectId;    // ref: 'Post'
  user: Types.ObjectId;    // ref: 'User'
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    post:    { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    user:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Comment = models.Comment || model<IComment>('Comment', CommentSchema);
