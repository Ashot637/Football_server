import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

const expo = new Expo();

async function sendPushNotifications(pushTokens: string[], message: string): Promise<void> {
  let messages: ExpoPushMessage[] = [];

  for (let pushToken of pushTokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Создайте сообщение для каждого токена
    messages.push({
      to: pushToken,
      sound: 'default',
      body: message,
      data: { withSome: 'data' },
    });
  }

  let chunks = expo.chunkPushNotifications(messages);
  let tickets: ExpoPushTicket[] = [];

  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notifications', error);
    }
  }
}

export default sendPushNotifications;
