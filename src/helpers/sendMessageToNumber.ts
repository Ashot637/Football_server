import axios from 'axios';

export const sendMessageToNumber = (number: string, code: string) => {
  let data = JSON.stringify({
    data: {
      from: 'Dexatel',
      to: [number],
      text: `Your verification code is ${code}`,
      channel: 'SMS',
    },
  });

  let config = {
    method: 'post',
    url: 'https://api.dexatel.com/v1/messages',
    headers: {
      'X-Dexatel-Key': process.env.DEXATEL_API_KEY,
      'Content-Type': 'application/json',
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
};
