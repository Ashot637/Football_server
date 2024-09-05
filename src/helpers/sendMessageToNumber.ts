import axios from 'axios';
import https from 'https';

// Create an HTTPS agent that enforces TLS 1.2 or higher
const httpsAgent = new https.Agent({
  secureProtocol: 'TLSv1_2_method', // Forces the use of TLS 1.2
});

// Your Axios request with the custom HTTPS agent
export const sendMessageToNumber = async (phoneNumber: string, message: string) => {
  try {
    const response = await axios.post(
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
          Accept: '*/*',
          'User-Agent': 'PostmanRuntime/7.41.2',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
        },
        httpsAgent, // Use the custom agent
      },
    );

    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error; // Rethrow the error for further handling
  }
};
