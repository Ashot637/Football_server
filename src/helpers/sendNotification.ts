import admin, { ServiceAccount } from 'firebase-admin';
import { User } from '../models';
import serviceAccount from '../google-services.json';
export const sendNotification = async (title: string, body: string, userIds: number[]) => {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as ServiceAccount),
    });
  }

  const users = await User.findAll({
    attributes: ['id', 'deviceToken'],
    where: {
      id: userIds,
    },
  });

  await Promise.all(
    users.map(async (user) => {
      const message = {
        notification: {
          title,
          body,
        },
        token: 'user.deviceToken',
      };
      await admin.messaging().send(message);
    }),
  );
};
