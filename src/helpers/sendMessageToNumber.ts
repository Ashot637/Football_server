import axios from 'axios';

export const sendMessageToNumber = async (phoneNumber: string, message: string) => {
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
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    },
  );

  // Handle the response data if needed
  return data;
};
