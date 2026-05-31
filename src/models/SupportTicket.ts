import mongoose from 'mongoose'

export interface ISupportTicket extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  subject: string
  message: string
  status: 'open' | 'closed'
  replies: Array<{
    sender: 'user' | 'admin'
    message: string
    createdAt: Date
  }>
  createdAt: Date
  updatedAt: Date
}

const SupportTicketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    replies: [
      {
        sender: { type: String, enum: ['user', 'admin'], required: true },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
)

export default mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema)
