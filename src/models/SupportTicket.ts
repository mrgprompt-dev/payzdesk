import mongoose from 'mongoose'

export interface ISupportTicket extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  subject: string
  message: string
  status: 'open' | 'closed'
  createdAt: Date
  updatedAt: Date
}

const SupportTicketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  { timestamps: true }
)

export default mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema)
