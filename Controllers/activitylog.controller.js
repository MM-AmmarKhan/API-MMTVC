const db = require("../index");

const key = process.env.SECRET_CODE;
exports.internalShare = async (req, res) => {
  try {
    const { token, to_name, to_number, captionid, file_path } = req.body;
    if (!token, !to_name, !to_number)
      return res.status(400).send({ message: "Missing fields" });    
    let person_id = parseInt(token) - parseInt(key);
    const data = await db.sequelize.query("SELECT personName, personNumber FROM phonebook.newsms_person WHERE personID = '" + person_id + "'", { type: db.sequelize.QueryTypes.SELECT });
    const query = `INSERT INTO phonebook.mgsharinginternal (sender_name, sender_number, receiver_name, receiver_number, captionID, file_path) VALUES ('${data[0].personName}', '${data[0].personNumber}', '${to_name}', '${to_number}', '${captionid}', '${file_path}')`;
    const isinsert = await db.sequelize.query(query, { type: db.sequelize.QueryTypes.INSERT });
    return res.status(200).send({ message: "Success" });;
  } catch (error) {
    return res.status(400).send({ message: "Internal share error: " + error });
  }
};

exports.externalShare = async (req, res) => {
  try {
    const { token, to_name, to_email, captionid, file_path } = req.body;
    if (!token, !to_name, !to_email, !captionid)
      return res.status(400).send({ message: "Missing fields" });
    let person_id = parseInt(token) - parseInt(key);
    const data = await db.sequelize.query("SELECT personName, personNumber FROM phonebook.newsms_person WHERE personID = '" + person_id + "'", { type: db.sequelize.QueryTypes.SELECT });
    const query = `INSERT INTO phonebook.mgsharingexternal (sender_name, sender_email, receiver_name, receiver_email, captionID, file_path) VALUES ('${data[0].personName}', '${data[0].email}', '${to_name}', '${to_email}', '${captionid}', '${file_path}')`;
    const isinsert = await db.sequelize.query(query, { type: db.sequelize.QueryTypes.INSERT });
    return res.status(200).send({ message: "Success" });;
  } catch (error) {
    return res.status(400).send({ message: "External share error: " + error });
  }
};

exports.createLog = async (req, res) => {
  try {
    const { token, activity } = req.body;
    if (!token, !activity)
      return res.status(400).send({ message: "Missing token or activity log" });
    const key = process.env.SECRET_CODE;
    const userid = parseInt(token) - parseInt(key);
    const query = `INSERT INTO phonebook.mguseractivity (userid, activity, insertdate) VALUES ('${userid}', '${activity}', NOW())`;
    const isinsert = await db.sequelize.query(query, { type: db.sequelize.QueryTypes.INSERT });
    return res.status(200).send({ message: isinsert });;
  } catch (error) {
    return res.status(400).send({ message: "Create log error: " + error });
  }
};


