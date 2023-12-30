const db = require("../index");

exports.tvcalert = async (req, res) => {
  const { jobid, message, fcm_id } = req.body;
  if (!jobid || !message || !fcm_id) return res.status(400).send({ message: "Missing Message or FCM_ID" });
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
    if(response.data.failure > 0) {
      return res.status(500).send('Internal Server Error');
    }
    const result = await db.sequelize.query(`UPDATE phonebook.sms_jobs SET delivered = 1 WHERE jobsID = ` + jobid, { type: db.sequelize.QueryTypes.UPDATE });
    if(result[1] === 0) {
      return res.status(208).send('Already Delivered');
    }
    else{
      return res.status(200).send('Delivered');
    }    
  } catch (error) {
    console.error('Error sending FCM notification:', error.message);
    return res.status(500).send('Internal Server Error');
  }
};