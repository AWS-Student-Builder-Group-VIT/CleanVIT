const { Expo } = require('expo-server-sdk');
const { PrismaClient } = require('@prisma/client');

let expo = new Expo();
const prisma = new PrismaClient();

const sendPushNotifications = async (messages) => {
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('Error sending push notification chunk', error);
    }
  }
};

const notifyUser = async (userId, body, data = {}) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { expoPushToken: true }
    });

    if (user && user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
      await sendPushNotifications([{
        to: user.expoPushToken,
        sound: 'default',
        body,
        data,
      }]);
    }
  } catch (error) {
    console.error('Error in notifyUser:', error);
  }
};

module.exports = {
  sendPushNotifications,
  notifyUser
};
