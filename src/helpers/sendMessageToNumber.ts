import axios from 'axios';

export const sendMessageToNumber = async (phoneNumber: string, message: string) => {
  const { data } = await axios.post('https://api.fortis-tele.com/api/SendSMS', {
    api_id: process.env.MESSAGE_PROVIDER_API_ID,
    api_password: process.env.MESSAGE_PROVIDER_API_PASSWORD,
    sms_type: 'T',
    encoding: 'T',
    sender_id: 'Ballhola.',
    phonenumber: phoneNumber,
    templateid: null,
    textmessage: message,
    V1: null,
    V2: null,
    V3: null,
    V4: null,
    V5: null,
    ValidityPeriodInSeconds: 60,
    uid: 'xyz',
    // "callback_url":"https://xyz.com/",
    pe_id: null,
    template_id: null,
  });
};
