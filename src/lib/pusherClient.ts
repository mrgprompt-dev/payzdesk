import PusherClient from 'pusher-js';

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || 'not_set';
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';

// Singleton instance to prevent multiple connections on the client
let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = () => {
  if (pusherKey === 'not_set') {
    console.warn('Pusher key is not set. Real-time features will be disabled.');
    return null;
  }
  
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(pusherKey, {
      cluster: pusherCluster,
      channelAuthorization: {
        endpoint: '/api/pusher/auth',
        transport: 'ajax',
      },
    });
  }
  
  return pusherClientInstance;
};
