const axios = require('axios');

export const sendMessageToNumber = async (phoneNumber: string, message: string) => {
  try {
    const response = await axios.post('https://api.fortis-tele.com/api/SendSms', {
      api_id: 'API203452465',
      api_password: 'y"EnaM!Z6L',
      sms_type: 'P',
      encoding: 'T',
      sender_id: 'Ballhola',
      phonenumber: '37495444083',
      textmessage: 'test',
    });

    console.log('Response:', response.data);
  } catch (error: any) {
    console.error('Error sending SMS:', error.response ? error.response.data : error.message);
  }
};
