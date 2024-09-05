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
        'Postman-Token': '<calculated when request is sent>', // This is usually dynamically generated and may not be needed.
        'Content-Type': 'application/json',
        'Content-Length': '<calculated when request is sent>', // Usually set automatically by axios.
        Host: '<calculated when request is sent>', // Also set automatically.
        'User-Agent': 'PostmanRuntime/7.41.2', // You can set this to something custom if needed.
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
      },
    },
  );

  // Handle the response data if needed
  return data;
};
