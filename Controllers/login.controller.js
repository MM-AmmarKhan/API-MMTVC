const db = require("../index");

exports.auth = async (req, res) => {
  const phonenumber = req.body.phonenumber;
  const input_imei = req.body.imei;
  try {
    if (!phonenumber || phonenumber.length < 8) {
      return res.status(400).send({ message: "Invalid Phone Number" });
    }
    const data = await db.sequelize.query(
      `SELECT phonebook.newsms_client.name, phonebook.newsms_person.personID, phonebook.newsms_person.personName, phonebook.newsms_person.isactive,phonebook.newsms_person.imei 
      FROM phonebook.newsms_person 
      INNER JOIN phonebook.newsms_client 
      ON phonebook.newsms_client.clientID = phonebook.newsms_person.clientID        
      WHERE phonebook.newsms_client.isactive=1 
      AND phonebook.newsms_person.isactive=1 
      AND phonebook.newsms_person.personNumber =` + phonenumber,
      { type: db.sequelize.QueryTypes.SELECT }
    );
    if (data.length < 1) {
      return res.status(404).send({ message: "Invalid User: Not Found" });
    }
    const userData = data[0];
    if (userData.isactive === 0) {
      return res.status(400).send({ message: "User is deactivated" });
    }
    if (userData.imei && userData.imei !== input_imei) {
      return res.status(400).send({ message: "Security Error: Contact MediaMonitors" });
    }
    if (!userData.imei || userData.imei.toString().length < 1) {
      await db.sequelize.query(
        `UPDATE phonebook.newsms_person 
          SET imei = '`+input_imei+`'
          WHERE personNumber = '`+ phonenumber + "'"
      );
    }
    const key = process.env.SECRET_CODE;    
    const result = {
      company: userData.name,      
      personName: userData.personName,      
      token: parseInt(userData.personID)+parseInt(key),
      personID: userData.personID,
    };
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Logging In" });
  }
};
