import Pusher from 'pusher';

// Server-side Pusher instance for broadcasting events
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || 'not_set',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY || 'not_set',
  secret: process.env.PUSHER_SECRET || 'not_set',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
  useTLS: true,
});
