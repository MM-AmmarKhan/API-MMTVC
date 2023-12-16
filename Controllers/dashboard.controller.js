const { response } = require("express");
const db = require("../index");

exports.homepage = async (req, res) => {
  const token = req.body.token;
  const key = process.env.SECRET_CODE;
  let person_id = parseInt(token) - parseInt(key);
  try {
    if (!person_id || person_id < 1) {
      return res.status(400).send({ message: "Invalid User" });
    }
    const isSuperUser = await db.sequelize.query("SELECT isActive FROM phonebook.newsms_subscription WHERE subcategoryID = 841 AND personID = " + person_id, { type: db.sequelize.QueryTypes.SELECT });
    let categories;
    let dates_commericals_count;
    let query = "SELECT DISTINCT phonebook.bdsubcategory.subcategoryName, phonebook.bdsubcategory.subcategoryID, phonebook.bdbrand.brandName, phonebook.bdbrand.brandID";
    if (isSuperUser.length > 0 && isSuperUser[0].isActive == 1) {
      categories = await db.sequelize.query(query + `
        FROM phonebook.bdsubcategory
        JOIN phonebook.bdbrand ON phonebook.bdsubcategory.subcategoryID = phonebook.bdbrand.subcategoryID
        WHERE phonebook.bdbrand.isActive = 1
        ORDER BY phonebook.bdsubcategory.subcategoryName, phonebook.bdbrand.brandName ASC`,
        { type: db.sequelize.QueryTypes.SELECT }
      );
      dates_commericals_count = await db.sequelize.query(`SELECT    			
      COUNT(DATE(bddirectory.insertDate)) AS CountDate,
      DATE(bddirectory.insertDate) AS InsertDate
      FROM bddirectory
      INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID
      INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID
      WHERE bddirectory.insertDate >= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)
      AND bdcommercialtype.commercialTypeName = "Spot/TVC"
      AND bddirectory.isActive = 1
      GROUP BY DATE(bddirectory.insertDate)
      ORDER BY DATE(bddirectory.insertDate) DESC;`, { type: db.sequelize.QueryTypes.SELECT });
    }
    else {
      categories = await db.sequelize.query(query + `
        FROM phonebook.newsms_person
        JOIN phonebook.newsms_subscription ON phonebook.newsms_person.personID = newsms_subscription.personID
        JOIN phonebook.bdsubcategory ON newsms_subscription.subcategoryID = phonebook.bdsubcategory.subcategoryID
        JOIN phonebook.bdbrand ON phonebook.bdsubcategory.subcategoryID = phonebook.bdbrand.subcategoryID
        WHERE newsms_subscription.isActive = 1 AND phonebook.newsms_person.personID = ` + person_id + " ORDER BY phonebook.bdsubcategory.subcategoryName, phonebook.bdbrand.brandName ASC",
        { type: db.sequelize.QueryTypes.SELECT }
      );
      const subcategoryIDs = categories.map(item => item.subcategoryID);
      const Subcategories = subcategoryIDs.join(',');
      dates_commericals_count = await db.sequelize.query(`SELECT
      COUNT(DATE(bddirectory.insertDate)) AS CountDate,
      DATE(bddirectory.insertDate) AS InsertDate
      FROM bddirectory
      INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID
      INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID
      INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID
      WHERE bddirectory.insertDate >= DATE_SUB(CURDATE(), INTERVAL 3 YEAR)
      AND bdcommercialtype.commercialTypeName = "Spot/TVC"
      AND bdbrand.subcategoryID IN (`+ Subcategories + `)
      AND bddirectory.isActive = 1
      GROUP BY DATE(bddirectory.insertDate)
      ORDER BY DATE(bddirectory.insertDate) DESC;`, { type: db.sequelize.QueryTypes.SELECT });
    }

    const result = {};
    result.sideNav = {};
    result.main_data = transformData(dates_commericals_count);
    categories.forEach(item => {
      const { subcategoryName, brandName, brandID, subcategoryID } = item;
      if (!result.sideNav[subcategoryName]) {
        result.sideNav[subcategoryName] = [];
      }
      result.sideNav[subcategoryName].push({ brandName, brandID, subcategoryID });
    });
    if (Object.keys(result.sideNav).length) {
      res.status(200).send(result);
    } else {
      res.status(404).send({ message: error.message || "Subscription not found" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message || "Error Logging In" });
  }
};
exports.sidebar = async (req, res) => {
  const token = req.body.token;
  if (!token)
    return res.status(400).send({ message: "Token missing" });
  const key = process.env.SECRET_CODE;
  let person_id = parseInt(token) - parseInt(key);
  const isSuperUser = await db.sequelize.query("SELECT isActive FROM phonebook.newsms_subscription WHERE subcategoryID = 841 AND personID = " + person_id, { type: db.sequelize.QueryTypes.SELECT });
  let categories;
  let query = "SELECT DISTINCT phonebook.bdsubcategory.subcategoryName, phonebook.bdsubcategory.subcategoryID, bdcategory.categoryName,  bdcategory.categoryID, phonebook.bdbrand.brandName, phonebook.bdbrand.brandID";
  try{
    if (isSuperUser.length > 0 && isSuperUser[0].isActive == 1) {    
      categories = await db.sequelize.query(query + `
        FROM phonebook.bdsubcategory
        INNER JOIN phonebook.bdbrand ON phonebook.bdsubcategory.subcategoryID = phonebook.bdbrand.subcategoryID
        INNER JOIN bdcategory ON newsms_subscription.categoryID = bdcategory.categoryID     
        WHERE phonebook.bdbrand.isActive = 1
        ORDER BY phonebook.bdsubcategory.subcategoryName, phonebook.bdbrand.brandName ASC`,
        { type: db.sequelize.QueryTypes.SELECT }
      );
    }
    else {
      categories = await db.sequelize.query(query + `
        FROM phonebook.newsms_person
        INNER JOIN phonebook.newsms_subscription ON phonebook.newsms_person.personID = newsms_subscription.personID        
        INNER JOIN bdcategory ON newsms_subscription.categoryID = bdcategory.categoryID        
        INNER JOIN phonebook.bdsubcategory ON newsms_subscription.subcategoryID = phonebook.bdsubcategory.subcategoryID
        INNER JOIN phonebook.bdbrand ON phonebook.bdsubcategory.subcategoryID = phonebook.bdbrand.subcategoryID
        WHERE newsms_subscription.isActive = 1 AND phonebook.newsms_person.personID = ` + person_id + " ORDER BY phonebook.bdsubcategory.subcategoryName, phonebook.bdbrand.brandName ASC",
        { type: db.sequelize.QueryTypes.SELECT }
      );
    }
  }  
  catch (error) {
    return res.status(500).send({ message: error.message || "Error no result found" });
  }
  let response = {};
  response = groupByCategoryAndSubcategory(categories);

  res.status(200).send(response);
}
function transformData(originalData) {
  const transformedData = [];

  originalData.forEach(item => {
    const date = new Date(item.InsertDate);
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'short' }).toLowerCase();
    const day = date.getDate();
    const key = `${year}-${month}-${day}`;
    let yearObject = transformedData.find(obj => obj.year === year);
    if (!yearObject) {
      yearObject = { year, months: [] };
      transformedData.push(yearObject);
    }
    let monthObject = yearObject.months.find(m => m.title === month);
    if (!monthObject) {
      monthObject = { title: month, data: [] };
      yearObject.months.push(monthObject);
    }
    monthObject.data.push({
      date: `${year}-${month}-${day}`,
      count: item.CountDate
    });
  });

  return transformedData;
};
function transformSearchData(rawData) {
  const transformedData = [];

  rawData.forEach(item => {
    const date = new Date(item.transmissionDate);
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'short' }).toLowerCase();
    const day = date.getDate();
    const key = `${year}-${month}-${day}`;

    // Check if the year already exists in transformedData
    let yearObject = transformedData.find(obj => obj.year === year);

    // If not, create a new yearObject
    if (!yearObject) {
      yearObject = { year, month: [] };
      transformedData.push(yearObject);
    }

    // Check if the month already exists in the yearObject
    let monthObject = yearObject.month.find(m => m.title === month);

    // If not, create a new monthObject
    if (!monthObject) {
      monthObject = { title: month, data: [] };
      yearObject.month.push(monthObject);
    }

    // Add the date and count to the monthObject's data array
    monthObject.data.push({
      date: `${year}-${month}-${day}`,
      count: 1 // You may need to adjust this based on your logic for counting
    });
  });

  return transformedData;
};
exports.dateCommercials = async (req, res) => {
  const token = req.body.token;
  const commericals_date = req.body.commericals_date;
  const key = process.env.SECRET_CODE;
  let person_id = parseInt(token) - parseInt(key);
  const isSuperUser = await db.sequelize.query("SELECT isActive FROM phonebook.newsms_subscription WHERE subcategoryID = 841 AND personID = " + person_id, { type: db.sequelize.QueryTypes.SELECT });
  if (isSuperUser.length > 0 && isSuperUser[0].isActive == 1) {
    categories = await db.sequelize.query(
      `
      SELECT DISTINCT bdbrand.brandName, bdcategory.categoryName, bdcategory.categoryID, bdsubcategory.subcategoryName, bdcaption.captionName, bdcaption.captionID, bdcaption.Duration, bddirectory.insertDate, bddirectory.startTime, 
      REPLACE(bddirectory.filePath,'//172.168.100.241','http://103.249.154.245:8484') AS filePath, REPLACE(bddirectory.fileName,'.flv','.mp4') AS fileName,CONCAT(REPLACE(bddirectory.filePath, '//172.168.100.241', 'http://103.249.154.245:8484'), REPLACE(bddirectory.fileName, '.flv', '.mp4')) AS videoURL
      Date(bddirectory.firstRunDate) AS transmissionDate,
      bddirectory.duration AS videoDuration,
      rechannel.channelName,
      bdcommercialtype.commercialTypeName  
      FROM bddirectory
      INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID
      INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID
      INNER JOIN rechannel ON rechannel.channelID = bddirectory.channelID
      INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID
      INNER JOIN bdsubcategory ON bdbrand.subcategoryID = bdsubcategory.subcategoryID
      INNER JOIN bdcategory ON bdsubcategory.categoryID = bdcategory.categoryID
      WHERE DATE(bddirectory.insertDate) = '`+ commericals_date + `'
      AND bdcommercialtype.commercialTypeName = "Spot/TVC"
      AND bddirectory.isActive = 1
      ORDER BY bddirectory.insertDate ASC`,
      { type: db.sequelize.QueryTypes.SELECT }
    );
    return res.status(200).send(categories);
  }
  else {
    let subscribedSubcategories = await db.sequelize.query('SELECT subcategoryID FROM phonebook.newsms_subscription WHERE newsms_subscription.personID = ' + person_id, { type: db.sequelize.QueryTypes.SELECT });
    const subcategoryIDs = subscribedSubcategories.map(item => item.subcategoryID);
    const Subcategories = subcategoryIDs.join(',');
    const result = await db.sequelize.query("SELECT bdbrand.brandName, bdcategory.categoryName, bdcategory.categoryID, bdsubcategory.subcategoryID, bdsubcategory.subcategoryName, bdcaption.captionName, bdcaption.captionID, bdcaption.Duration, bddirectory.insertDate, bddirectory.startTime, REPLACE(bddirectory.filePath,'//172.168.100.241','http://103.249.154.245:8484') AS filePath, REPLACE(bddirectory.fileName,'.flv','.mp4') AS fileName, Date(bddirectory.firstRunDate) AS transmissionDate, bddirectory.duration AS videoDuration, rechannel.channelName, bdcommercialtype.commercialTypeName FROM bddirectory INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID INNER JOIN rechannel ON rechannel.channelID = bddirectory.channelID INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID INNER JOIN bdsubcategory ON bdbrand.subcategoryID = bdsubcategory.subcategoryID INNER JOIN bdcategory ON bdsubcategory.categoryID = bdcategory.categoryID WHERE DATE(bddirectory.insertDate) = '" + commericals_date + "' AND bdsubcategory.subcategoryID IN (" + Subcategories + ") ", { type: db.sequelize.QueryTypes.SELECT });
    return res.status(200).send(result);
  }

};
function groupByCategoryAndSubcategory(data) {
  const result = {};

  data.forEach(item => {
    const categoryName = item.categoryName;
    const subcategoryName = item.subcategoryName || 'Uncategorized';

    if (!result[categoryName]) {
      result[categoryName] = {};
    }

    if (!result[categoryName][subcategoryName]) {
      result[categoryName][subcategoryName] = {
        Subcategory: subcategoryName,
        Brand: [],
      };
    }

    if (!result[categoryName][subcategoryName].Brand.includes(item.brandName)) {
      result[categoryName][subcategoryName].Brand.push(item.brandName);
    }
  });
  return result;
}
exports.searchCommercial = async (req, res) => {
  const token = req.body.token;
  const searchTerm = req.body.searchTerm;
  if (!token || !searchTerm)
    return res.status(400).send({ message: "Token or Search Text missing" });
  const key = process.env.SECRET_CODE;
  let person_id = parseInt(token) - parseInt(key);
  const isSuperUser = await db.sequelize.query("SELECT isActive FROM phonebook.newsms_subscription WHERE subcategoryID = 841 AND personID = " + person_id, { type: db.sequelize.QueryTypes.SELECT });
  if (isSuperUser.length > 0 && isSuperUser[0].isActive == 1) {
    const result = await db.sequelize.query("SELECT bdbrand.brandName, bdcategory.categoryName, bdcategory.categoryID, bdsubcategory.subcategoryID, bdsubcategory.subcategoryName, bdcaption.captionName, bdcaption.captionID, bddirectory.insertDate, bddirectory.startTime, bdcommercialtype.commercialTypeName FROM bddirectory INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID  INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID INNER JOIN bdsubcategory ON bdbrand.subcategoryID = bdsubcategory.subcategoryID INNER JOIN bdcategory ON bdsubcategory.categoryID = bdcategory.categoryID WHERE YEAR(bddirectory.insertDate) > '2017' AND (bdbrand.brandName LIKE '%" + searchTerm + "%' OR bdcaption.captionName LIKE '%" + searchTerm + "%') AND bddirectory.isActive = 1 AND bdcommercialtype.commercialTypeName = 'Spot/TVC' ORDER BY Date(bddirectory.firstRunDate) DESC LIMIT 100", { type: db.sequelize.QueryTypes.SELECT });
    let response = {};
    response = groupByCategoryAndSubcategory(result);
    return res.status(200).send(response);
  }
  else {
    let subscribedSubcategories = await db.sequelize.query('SELECT subcategoryID FROM phonebook.newsms_subscription WHERE newsms_subscription.personID = ' + person_id, { type: db.sequelize.QueryTypes.SELECT });
    const subcategoryIDs = subscribedSubcategories.map(item => item.subcategoryID);
    const Subcategories = subcategoryIDs.join(',');
    const result = await db.sequelize.query(`SELECT bdbrand.brandName, bdcategory.categoryName, bdcategory.categoryID, bdsubcategory.subcategoryID, bdsubcategory.subcategoryName, bdcaption.captionName, 
    bdcaption.captionID, bddirectory.insertDate, bddirectory.startTime, 
    bdcommercialtype.commercialTypeName FROM bddirectory INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID 
     INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID INNER JOIN bdsubcategory ON bdbrand.subcategoryID = bdsubcategory.subcategoryID 
    INNER JOIN bdcategory ON bdsubcategory.categoryID = bdcategory.categoryID WHERE YEAR(bddirectory.insertDate) >= '2017' AND bdsubcategory.subcategoryID IN (${Subcategories}) AND 
    (bdbrand.brandName LIKE '${"%" + searchTerm + "%"}' OR bdcaption.captionName LIKE '${"%" + searchTerm + "%"}') AND bddirectory.isActive = 1 AND bdcommercialtype.commercialTypeName = 'Spot/TVC' 
    ORDER BY Date(bddirectory.firstRunDate) DESC LIMIT 100`, { type: db.sequelize.QueryTypes.SELECT });
    let response = {};
    response = groupByCategoryAndSubcategory(result);
    return res.status(200).send(response);
  }
};
exports.searchCommercialBySubcategory = async (req, res) => {
  const token = req.body.token;
  const brandName = req.body.brandName;
  if (!token || !brandName)
    return res.status(400).send({ message: "Token or Brand Text missing" });
  const key = process.env.SECRET_CODE;
  let person_id = parseInt(token) - parseInt(key);
  const isSuperUser = await db.sequelize.query("SELECT isActive FROM phonebook.newsms_subscription WHERE subcategoryID = 841 AND personID = " + person_id, { type: db.sequelize.QueryTypes.SELECT });
  if (isSuperUser.length > 0 && isSuperUser[0].isActive == 1) {
    const result = await db.sequelize.query(`SELECT bdbrand.brandName, bdcategory.categoryName, bdcategory.categoryID, bdsubcategory.subcategoryID, bdsubcategory.subcategoryName, bdcaption.captionName, 
    bdcaption.captionID, bdcaption.Duration, bddirectory.insertDate, bddirectory.startTime,
    Date(bddirectory.firstRunDate) AS transmissionDate, bddirectory.duration AS videoDuration, bdcommercialtype.commercialTypeName FROM bddirectory INNER JOIN bdcaption ON 
    bdcaption.captionID = bddirectory.captionID 
    INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID     
    INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID INNER JOIN bdsubcategory ON bdbrand.subcategoryID = bdsubcategory.subcategoryID 
    INNER JOIN bdcategory ON bdsubcategory.categoryID = bdcategory.categoryID WHERE YEAR(bddirectory.insertDate) > '2017' AND 
    bdbrand.brandName = '${brandName}' 
    AND bddirectory.isActive = 1 AND bdcommercialtype.commercialTypeName = 'Spot/TVC' ORDER BY Date(bddirectory.firstRunDate) DESC LIMIT 100`, { type: db.sequelize.QueryTypes.SELECT });
    let response = {};
    response.main_data = transformSearchData(result);
    return res.status(200).send(response);
  }
  else {
    let subscribedSubcategories = await db.sequelize.query('SELECT subcategoryID FROM phonebook.newsms_subscription WHERE newsms_subscription.personID = ' + person_id, { type: db.sequelize.QueryTypes.SELECT });
    const subcategoryIDs = subscribedSubcategories.map(item => item.subcategoryID);
    const Subcategories = subcategoryIDs.join(',');
    const result = await db.sequelize.query(`SELECT bdbrand.brandName, bdcategory.categoryName, bdcategory.categoryID, bdsubcategory.subcategoryID, bdsubcategory.subcategoryName, bdcaption.captionName, 
    bdcaption.captionID, bdcaption.Duration, bddirectory.insertDate, bddirectory.startTime, 
    Date(bddirectory.firstRunDate) AS transmissionDate, bddirectory.duration AS videoDuration, 
    bdcommercialtype.commercialTypeName FROM bddirectory INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID     
    INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID INNER JOIN bdsubcategory ON bdbrand.subcategoryID = bdsubcategory.subcategoryID 
    INNER JOIN bdcategory ON bdsubcategory.categoryID = bdcategory.categoryID WHERE YEAR(bddirectory.insertDate) >= '2017' AND bdsubcategory.subcategoryID IN (${Subcategories}) AND 
    bdbrand.brandName = '${brandName}'
    AND bddirectory.isActive = 1 AND bdcommercialtype.commercialTypeName = 'Spot/TVC' ORDER BY Date(bddirectory.firstRunDate) DESC LIMIT 100`, { type: db.sequelize.QueryTypes.SELECT });
    let response = {};
    response.main_data = transformSearchData(result);
    return res.status(200).send(response);
  }
};
exports.messages = async (req, res) => {
  const token = req.body.token;
  if (!token)
    return res.status(400).send({ message: "Timed Out" });
  const key = process.env.SECRET_CODE;
  let person_id = parseInt(token) - parseInt(key);
  const result = await db.sequelize.query("SELECT mgs.sender_name, mgs.sender_number,bdc.captionName, brand.brandName, bdc.Duration, bddirectory.startTime, CONCAT(REPLACE(bddirectory.filePath, '//172.168.100.241', 'http://103.249.154.245:8484'),REPLACE(bddirectory.fileName, '.flv', '.mp4')) AS fileUrl ,DATE(bddirectory.insertDate) FROM phonebook.mgsharinginternal as mgs  INNER JOIN phonebook.newsms_person as np ON mgs.receiver_number = np.personNumber  INNER JOIN pktvmedia.bdcaption as bdc ON bdc.captionID = mgs.captionID  INNER JOIN pktvmedia.bddirectory ON bdc.captionID = bddirectory.captionID  INNER JOIN pktvmedia.bdbrand as brand ON brand.brandID = bdc.brandID WHERE np.personID = " + person_id + " ORDER BY mgs.insertdate DESC LIMIT 15", { type: db.sequelize.QueryTypes.SELECT });
  return res.status(200).send(result);
};
exports.notification = async (req, res) => {
  const token = req.body.token;
  if (!token)
    return res.status(400).send({ message: "Timed Out" });
  const key = process.env.SECRET_CODE;
  let person_id = parseInt(token) - parseInt(key);
  const telNo = await db.sequelize.query("SELECT personNumber FROM phonebook.newsms_person WHERE personID = " + person_id, { type: db.sequelize.QueryTypes.SELECT });
  const result = await db.sequelize.query("SELECT message FROM phonebook.sms_jobs WHERE insertDate >= DATE_SUB(NOW(), INTERVAL 5 DAY) AND telNo = " + telNo[0].personNumber, { type: db.sequelize.QueryTypes.SELECT });
  let response = [];
  result.forEach(item => {
    try {
      let obj = {};
      let data = item.message.split('\r\n');
      obj.brand = data[2].replace("Brd:", '').trim();
      obj.caption = data[3].replace("Cap:", '').trim();
      obj.channel = data[4].replace("Ch:", '').trim();
      obj.duration = data[5].replace("Dur:", '').trim();
      obj.date = data[6].replace("DT:", '').trim();
      response.push(obj);
    }
    catch (err) {
      console.log(err);
    }
  })
  return res.status(200).send(response);
};
exports.getProfile = async (req, res) => {
  const token = req.body.token;
  if (!token)
    return res.status(400).send({ message: "Error: No token" });
  const key = process.env.SECRET_CODE;
  let person_id = parseInt(token) - parseInt(key);
  const result = await db.sequelize.query("SELECT nsp.personName, nsp.email, nsp.personNumber, nsc.`name` as 'company' FROM phonebook.newsms_person as nsp INNER JOIN phonebook.newsms_client as nsc ON nsc.clientID = nsp.clientID WHERE nsp.personID = " + person_id, { type: db.sequelize.QueryTypes.SELECT });
  let response = {};
  response.username = result[0].personName;
  response.email = result[0].email;
  response.company = result[0].company;
  response.phone = result[0].personNumber;
  return res.status(200).send(response);
};