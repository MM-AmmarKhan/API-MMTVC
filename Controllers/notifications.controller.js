const db = require("../index");

exports.tvcalert = async (req, res) => {
    const {message, fcm_id} = req.body;
    if(!message || !fcm_id) return res.status(400).send({ message: "Missing Message or FCM_ID" });
    if (fcm_id.length > 5 && message && message.length > 0) {    
      const data = {
        to: fcm_id,
        notification: {
          body: message,
        },
      };  
      const headers = {
        'Authorization': 'key=AIzaSyAMJ8jCgs_YVP30M1Kods2Y44DO_iFntFQ', // Replace with your FCM server key
        'Content-Type': 'application/json',
      };
      try {
        const response = await axios.post('https://fcm.googleapis.com/fcm/send', data, { headers });
        return res.status(200).send(response.data);
      } catch (error) {
        console.error('Error sending FCM notification:', error.message);
        return res.status(500).send('Internal Server Error');
      }
    } else {
      return res.status(400).send('Invalid Request');
    }
  };