const db = require("../index");
const axios = require('axios');
exports.tvcalert = async (req, res) => {
  const { jobid, fcm_id, message } = req.body;  
  if (!jobid || !fcm_id) return res.status(400).send({ message: "Missing jobid or FCM_ID" });
  
  const headers = {
    'Authorization': 'key=AIzaSyAMJ8jCgs_YVP30M1Kods2Y44DO_iFntFQ',
    'Content-Type': 'application/json',
  };
  try {
    if(!message)
    {
      const job = await db.sequelize.query(`SELECT message, sms_jobs.delivered FROM phonebook.sms_jobs WHERE jobsID = ` + jobid, { type: db.sequelize.QueryTypes.SELECT });
      if(job.length === 0) {
        return res.status(404).send('Job not found');
      }
      if(job[0].delivered === 1) {
        return res.status(208).send('Already Delivered');
      }
      const data = {
        to: fcm_id,
        notification: {
          body: job[0].message,
        },
      };
      const response = await axios.post('https://fcm.googleapis.com/fcm/send', data, { headers });
      if(response.data.failure > 0) {
        return res.status(500).send('MMTVC API Error:',response.data);
      }
      const result = await db.sequelize.query(`UPDATE phonebook.sms_jobs SET delivered = 1 WHERE jobsID = ` + jobid, { type: db.sequelize.QueryTypes.UPDATE });
      return res.status(200).send('Delivered');
    }
    else{
      const data = {
        to: fcm_id,
        notification: {
          body: message,
        },
      };
      const response = await axios.post('https://fcm.googleapis.com/fcm/send', data, { headers });
      if(response.data.failure > 0) {
        return res.status(500).send('MMTVC API Error:',response.data);
      }
      const result = await db.sequelize.query(`UPDATE phonebook.sms_jobs SET delivered = 1 WHERE jobsID = ` + jobid, { type: db.sequelize.QueryTypes.UPDATE });
      return res.status(200).send('Delivered');
    }
   
  } catch (error) {
    console.error('Error sending FCM notification:', error.message);
    return res.status(500).send('Internal Server Error');
  }
};