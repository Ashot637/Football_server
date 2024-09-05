const axios = require('axios');

export const sendMessageToNumber = async (phoneNumber: string, message: string) => {
  try {
    const response = await axios.post(
      'https://api.fortis-tele.com/api/SendSms',
      {
        api_id: process.env.MESSAGE_PROVIDER_API_ID,
        api_password: process.env.MESSAGE_PROVIDER_API_PASSWORD,
        sms_type: 'P',
        encoding: 'T',
        sender_id: process.env.MESSAGE_PROVIDER_SENDER_ID,
        phonenumber: phoneNumber,
        textmessage: message,
      },
      {
        headers: {
          'User-Agent': 'PostmanRuntime/7.41.2',
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      },
    );

    console.log('Response:', response.data);
  } catch (error: any) {
    console.error('Error sending SMS:', error.response ? error.response.data : error.message);
  }
};

////asdas
