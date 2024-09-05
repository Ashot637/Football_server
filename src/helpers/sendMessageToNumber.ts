import axios from 'axios';
import https from 'https';

export const sendMessageToNumber = async (phoneNumber: string, message: string) => {
  try {
    const agent = new https.Agent({
      // Enforces using TLS 1.2 or higher
      secureProtocol: 'TLSv1_2_method',
    });

    const { data } = await axios.post(
      'https://api.fortis-tele.com/api/SendSMS',
      {
        api_id: process.env.MESSAGE_PROVIDER_API_ID,
        api_password: process.env.MESSAGE_PROVIDER_API_PASSWORD,
        sms_type: 'T',
        encoding: 'T',
        sender_id: process.env.MESSAGE_PROVIDER_SENDER_ID,
        phonenumber: phoneNumber,
        textmessage: message,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PostmanRuntime/7.41.2',
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
        },
        httpsAgent: agent,
      },
    );

    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error; // Re-throw the error after logging
  }
};
