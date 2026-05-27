import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import SupportTicket from '@/models/SupportTicket'
import { getAuthUser } from '@/lib/getAuthUser'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const tickets = await SupportTicket.find({ userId: user.userId }).sort({ createdAt: -1 })

    return NextResponse.json({ success: true, data: tickets })
  } catch (error: any) {
    console.error('Support Tickets GET error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { subject, message } = await req.json()

    if (!subject || !message) {
      return NextResponse.json({ success: false, message: 'Subject and message are required' }, { status: 400 })
    }

    await connectDB()

    const newTicket = await SupportTicket.create({
      userId: user.userId,
      subject,
      message,
    })

    return NextResponse.json({ success: true, data: newTicket }, { status: 201 })
  } catch (error: any) {
    console.error('Support Tickets POST error:', error)
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}
