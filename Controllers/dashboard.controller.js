const { response } = require("express");
const db = require("../index");

exports.homepage = async (req, res) => {
  const token = req.body.token;
  const key = process.env.SECRET_CODE;
  let person_id = parseInt(token) - parseInt(key);
  const result = {};
  result.main_data = [];
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
      COUNT(DATE(bddirectory.firstRunDate)) AS CountDate,
      DATE(bddirectory.firstRunDate) AS InsertDate
      FROM bddirectory
      INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID
      INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID
      WHERE bddirectory.firstRunDate >= DATE_SUB(CURDATE(), INTERVAL ` + process.env.HOMEPAGE_PREVIOUS_YEARS + ` YEAR)
      AND bdcommercialtype.commercialTypeName = "Spot/TVC" AND bddirectory.isActive = 1 GROUP BY DATE(bddirectory.firstRunDate) ORDER BY DATE(bddirectory.firstRunDate) DESC;`, { type: db.sequelize.QueryTypes.SELECT });
    }
    else {
      categories = await db.sequelize.query(query + `
        FROM phonebook.newsms_person JOIN phonebook.newsms_subscription ON phonebook.newsms_person.personID = newsms_subscription.personID JOIN phonebook.bdsubcategory ON newsms_subscription.subcategoryID = phonebook.bdsubcategory.subcategoryID JOIN phonebook.bdbrand ON phonebook.bdsubcategory.subcategoryID = phonebook.bdbrand.subcategoryID
        WHERE newsms_subscription.isActive = 1 AND phonebook.newsms_person.personID = ` + person_id + " ORDER BY phonebook.bdsubcategory.subcategoryName, phonebook.bdbrand.brandName ASC",
        { type: db.sequelize.QueryTypes.SELECT }
      );
      const subcategoryIDs = categories.map(item => item.subcategoryID);
      const Subcategories = subcategoryIDs.join(',');
      if (Subcategories.length > 0) {
        dates_commericals_count = await db.sequelize.query(`SELECT
          COUNT(DATE(bddirectory.firstRunDate)) AS CountDate,
          DATE(bddirectory.firstRunDate) AS InsertDate
          FROM bddirectory
          INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID
          INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID
          INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID
          WHERE bddirectory.firstRunDate >= DATE_SUB(CURDATE(), INTERVAL ` + process.env.HOMEPAGE_PREVIOUS_YEARS + ` YEAR)
          AND bdcommercialtype.commercialTypeName = "Spot/TVC"
          AND bdbrand.subcategoryID IN (`+ Subcategories + `) AND bddirectory.isActive = 1 GROUP BY DATE(bddirectory.firstRunDate) ORDER BY DATE(bddirectory.firstRunDate) DESC;`, { type: db.sequelize.QueryTypes.SELECT });
      }
      else {        
        return res.status(404).send(result);
      }
    }    
    result.main_data = transformData(dates_commericals_count);
    if (Object.keys(result).length) {
      res.status(200).send(result);
    } else {
      res.status(404).send(result);
    }
  } catch (error) {
    res.status(500).send(result);
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
  let query = "SELECT phonebook.bdsubcategory.subcategoryName, phonebook.bdsubcategory.subcategoryID, bdcategory.categoryName,  phonebook.bdbrand.brandName, phonebook.bdbrand.brandID ";
  if (isSuperUser.length > 0 && isSuperUser[0].isActive == 1) {
    console.log("inside super ")
    categories = await db.sequelize.query(query + ` 
    FROM bddirectory   
    INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID
    INNER JOIN phonebook.bdbrand ON bdcaption.brandID = phonebook.bdbrand.brandID
    INNER JOIN phonebook.bdsubcategory ON phonebook.bdbrand.subcategoryID = phonebook.bdsubcategory.subcategoryID
    INNER JOIN bdcategory ON phonebook.bdsubcategory.categoryID = bdcategory.categoryID
    INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID
    WHERE YEAR(bddirectory.firstRunDate) >= ` + process.env.START_YEAR + ` AND bdcommercialtype.commercialTypeID = 1 GROUP BY phonebook.bdbrand.brandName ORDER BY phonebook.bdsubcategory.subcategoryName, phonebook.bdbrand.brandName ASC`,
      { type: db.sequelize.QueryTypes.SELECT }
    );
  }
  else{
    console.log("inside cazual ")
    try {
      categories = await db.sequelize.query(query + `
          FROM phonebook.newsms_person        
          INNER JOIN phonebook.newsms_subscription ON phonebook.newsms_person.personID = newsms_subscription.personID        
          INNER JOIN bdcategory ON newsms_subscription.categoryID = bdcategory.categoryID        
          INNER JOIN phonebook.bdsubcategory ON newsms_subscription.subcategoryID = phonebook.bdsubcategory.subcategoryID
          INNER JOIN phonebook.bdbrand ON phonebook.bdsubcategory.subcategoryID = phonebook.bdbrand.subcategoryID
          INNER JOIN bdcaption ON bdcaption.brandID = phonebook.bdbrand.brandID
          INNER JOIN bddirectory ON bddirectory.captionID = bdcaption.captionID
          INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID
          WHERE YEAR(bddirectory.firstRunDate) >= ` + process.env.START_YEAR + ` AND newsms_subscription.isActive = 1 AND phonebook.newsms_person.personID = ` + person_id + " AND bdcommercialtype.commercialTypeID = 1 GROUP BY phonebook.bdbrand.brandName ORDER BY phonebook.bdsubcategory.subcategoryName, phonebook.bdbrand.brandName ASC",
        { type: db.sequelize.QueryTypes.SELECT }
      );
    }
    catch (error) {
      return res.status(500).send({ message: error.message || "Error no result found" });
    }
  }  
  let response = {};
  response.searchResult = formatSearchResult(groupBySubcategory(categories));
  res.status(200).send(response);
}
function transformData(originalData) {
  const transformedData = [];

  originalData.forEach(item => {
    const date = new Date(item.InsertDate);
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const formattedDay = day.toString().padStart(2, '0');
    let yearObject = transformedData.find(obj => obj.year === year);
    if (!yearObject) {
      yearObject = { year, months: [] };
      transformedData.push(yearObject);
    }
    let monthObject = yearObject.months.find(m => m.title.toUpperCase() === month.toUpperCase());
    if (!monthObject) {
      monthObject = { title: month.toUpperCase(), data: [] };
      yearObject.months.push(monthObject);
    }
    monthObject.data.push({
      date: `${formattedDay}-${month.toUpperCase()}-${year}`,
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
    const formattedDay = day.toString().padStart(2, '0');

    // Check if the year already exists in transformedData
    let yearObject = transformedData.find(obj => obj.year === year);

    // If not, create a new yearObject
    if (!yearObject) {
      yearObject = { year, month: [] };
      transformedData.push(yearObject);
    }

    // Check if the month already exists in the yearObject
    let monthObject = yearObject.month.find(m => m.title.toUpperCase() === month.toUpperCase());

    // If not, create a new monthObject
    if (!monthObject) {
      monthObject = { title: month.toUpperCase(), data: [] };
      yearObject.month.push(monthObject);
    }

    // Add the date and count to the monthObject's data array
    monthObject.data.push({
      date: `${formattedDay}-${month.toUpperCase()}-${year}`,
      count: 1 // You may need to adjust this based on your logic for counting
    });
  });

  return transformedData;
};
exports.dateCommercials = async (req, res) => {
  const token = req.body.token;
  const commericals_date = req.body.commericals_date;
  if (!token || !commericals_date)
    return res.status(400).send({ message: "Token or Date missing" });
  const key = process.env.SECRET_CODE;
  let person_id = parseInt(token) - parseInt(key);
  let date = convertToValidDateFormat(commericals_date);
  if (date == null) {
    return res.status(400).send({ message: "Invalid date format. Should be (YYYY-MM-DD)" });
  }
  const isSuperUser = await db.sequelize.query("SELECT isActive FROM phonebook.newsms_subscription WHERE subcategoryID = 841 AND personID = " + person_id, { type: db.sequelize.QueryTypes.SELECT });
  if (isSuperUser.length > 0 && isSuperUser[0].isActive == 1) {
    categories = await db.sequelize.query(
      `
      SELECT DISTINCT bdbrand.brandName, bdcategory.categoryName, bdcategory.categoryID, bdsubcategory.subcategoryName, bdcaption.captionName, bdcaption.captionID, bdcaption.Duration, bddirectory.firstRunDate as insertDate, bddirectory.startTime, 
      REPLACE(bddirectory.filePath,'//172.168.100.241','http://103.249.154.245:8484') AS filePath, REPLACE(bddirectory.fileName,'.flv','.mp4') AS fileName,CONCAT(REPLACE(bddirectory.filePath, '//172.168.100.241', 'http://103.249.154.245:8484'), REPLACE(bddirectory.fileName, '.flv', '.mp4')) AS videoURL,
      CONCAT(REPLACE(bddirectory.filePath, '//172.168.100.241', 'http://103.249.154.245:8484'), REPLACE(bddirectory.fileName, '.flv', '.jpg')) AS pictureURL,
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
      WHERE DATE(bddirectory.firstRunDate) = '`+ date + `'
      AND YEAR(bddirectory.firstRunDate) >= ` + process.env.START_YEAR + `
      AND bdcommercialtype.commercialTypeName = "Spot/TVC"
      AND bddirectory.isActive = 1
      ORDER BY bddirectory.firstRunDate ASC`,
      { type: db.sequelize.QueryTypes.SELECT }
    );
    return res.status(200).send(categories);
  }
  else {
    let subscribedSubcategories = await db.sequelize.query('SELECT subcategoryID FROM phonebook.newsms_subscription WHERE newsms_subscription.personID = ' + person_id, { type: db.sequelize.QueryTypes.SELECT });
    const subcategoryIDs = subscribedSubcategories.map(item => item.subcategoryID);
    const Subcategories = subcategoryIDs.join(',');
    const result = await db.sequelize.query("SELECT bdbrand.brandName, bdcategory.categoryName, bdcategory.categoryID, bdsubcategory.subcategoryID, bdsubcategory.subcategoryName, bdcaption.captionName, bdcaption.captionID, bdcaption.Duration, bddirectory.firstRunDate, bddirectory.startTime, REPLACE(bddirectory.filePath,'//172.168.100.241','http://103.249.154.245:8484') AS filePath, REPLACE(bddirectory.fileName,'.flv','.mp4') AS fileName, Date(bddirectory.firstRunDate) AS transmissionDate, bddirectory.duration AS videoDuration, rechannel.channelName, bdcommercialtype.commercialTypeName FROM bddirectory INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID INNER JOIN rechannel ON rechannel.channelID = bddirectory.channelID INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID INNER JOIN bdsubcategory ON bdbrand.subcategoryID = bdsubcategory.subcategoryID INNER JOIN bdcategory ON bdsubcategory.categoryID = bdcategory.categoryID WHERE DATE(bddirectory.firstRunDate) = '" + commericals_date + "' AND bdsubcategory.subcategoryID IN (" + Subcategories + ") ", { type: db.sequelize.QueryTypes.SELECT });
    return res.status(200).send(result);
  }

};
function formatSearchResult(data) {
  const result = [];

  for (const category in data) {
    const categoryData = data[category].map(item => {
      return {
        brandName: item.brandName,
        brandID: item.brandID,
        subcategoryID: item.subcategoryID,
      };
    });

    result.push({
      Title: category,
      data: categoryData,
    });
  }

  return result;
}
function groupBySubcategory(data) {
  const result = {};

  data.forEach(item => {
    const subcategoryName = item.subcategoryName || 'Uncategorized';

    if (!result[subcategoryName]) {
      result[subcategoryName] = [];
    }

    const brandData = {
      brandName: item.brandName,
      brandID: item.brandID,
      subcategoryID: item.subcategoryID,
    };

    result[subcategoryName].push(brandData);
  });

  return result;
};
const isValidDateFormat = (dateString) => {
  const regex = /^\d{2}-\d{2}-\d{4}$/;
  return regex.test(dateString);
};

const convertToValidDateFormat = (dateString) => {
  const dateObject = new Date(dateString);
  if (!isNaN(dateObject.getTime())) {
    const day = dateObject.getDate().toString().padStart(2, '0');
    const month = (dateObject.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObject.getFullYear();
    return `${year}-${month}-${day}`;
  }
  return null; // Invalid date format, return null or handle as needed
};
exports.searchCommercial = async (req, res) => {
  const token = req.body.token;
  const searchTerm = req.body.searchTerm;
  if (!token || !searchTerm)
    return res.status(400).send({ message: "Token or Search Text missing" });
  const key = process.env.SECRET_CODE;
  let person_id = parseInt(token) - parseInt(key);
  try {
    const isSuperUser = await db.sequelize.query("SELECT isActive FROM phonebook.newsms_subscription WHERE subcategoryID = 841 AND personID = " + person_id, { type: db.sequelize.QueryTypes.SELECT });
    if (isSuperUser.length > 0 && isSuperUser[0].isActive == 1) {
      const result = await db.sequelize.query("SELECT bdbrand.brandName, bdbrand.brandID, bdcategory.categoryName, bdsubcategory.subcategoryID, bdsubcategory.subcategoryName, bdcommercialtype.commercialTypeName FROM bddirectory INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID  INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID INNER JOIN bdsubcategory ON bdbrand.subcategoryID = bdsubcategory.subcategoryID INNER JOIN bdcategory ON bdsubcategory.categoryID = bdcategory.categoryID WHERE YEAR(bddirectory.firstRunDate) >= " + process.env.START_YEAR + " AND (bdbrand.brandName LIKE '%" + searchTerm + "%' OR bdcaption.captionName LIKE '%" + searchTerm + "%') AND bddirectory.isActive = 1 AND bdcommercialtype.commercialTypeName = 'Spot/TVC' GROUP BY bdbrand.brandName ORDER BY bdbrand.brandName LIMIT 100", { type: db.sequelize.QueryTypes.SELECT });
      let response = {};
      response = formatSearchResult(groupBySubcategory(result));
      return res.status(200).send(response);
    }
    else {
      let subscribedSubcategories = await db.sequelize.query('SELECT subcategoryID FROM phonebook.newsms_subscription WHERE newsms_subscription.personID = ' + person_id, { type: db.sequelize.QueryTypes.SELECT });
      const subcategoryIDs = subscribedSubcategories.map(item => item.subcategoryID);
      const Subcategories = subcategoryIDs.join(',');
      const result = await db.sequelize.query(`SELECT bdbrand.brandName, bdbrand.brandID, bdcategory.categoryName, bdsubcategory.subcategoryID, bdsubcategory.subcategoryName, 
      bdcommercialtype.commercialTypeName FROM bddirectory INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID 
      INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID INNER JOIN bdsubcategory ON bdbrand.subcategoryID = bdsubcategory.subcategoryID 
      INNER JOIN bdcategory ON bdsubcategory.categoryID = bdcategory.categoryID WHERE YEAR(bddirectory.firstRunDate) >= ` + process.env.START_YEAR + ` AND bdsubcategory.subcategoryID IN (${Subcategories}) AND 
      (bdbrand.brandName LIKE '${"%" + searchTerm + "%"}' OR bdcaption.captionName LIKE '${"%" + searchTerm + "%"}') AND bddirectory.isActive = 1 AND bdcommercialtype.commercialTypeName = 'Spot/TVC' 
      GROUP BY bdbrand.brandName
      ORDER BY bdbrand.brandName LIMIT 100`, { type: db.sequelize.QueryTypes.SELECT });
      let response = {};
      response.searchResult = formatSearchResult(groupBySubcategory(result));
      return res.status(200).send(response);
    }
  }
  catch (error) {
    return res.status(500).send({ message: error.message || "Error no result found" });
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
    const result = await db.sequelize.query(`SELECT bdbrand.brandName, bdsubcategory.subcategoryID, bdsubcategory.subcategoryName, bdcaption.captionName, 
    bdcaption.captionID, bdcaption.Duration, bddirectory.firstRunDate, bddirectory.startTime,
    Date(bddirectory.firstRunDate) AS transmissionDate, bddirectory.duration AS videoDuration, bdcommercialtype.commercialTypeName FROM bddirectory INNER JOIN bdcaption ON 
    bdcaption.captionID = bddirectory.captionID 
    INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID     
    INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID INNER JOIN bdsubcategory ON bdbrand.subcategoryID = bdsubcategory.subcategoryID 
    INNER JOIN bdcategory ON bdsubcategory.categoryID = bdcategory.categoryID WHERE YEAR(bddirectory.firstRunDate) >= ` + process.env.START_YEAR + ` AND
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
    const result = await db.sequelize.query(`SELECT bdbrand.brandName, bdsubcategory.subcategoryID, bdsubcategory.subcategoryName, bdcaption.captionName, 
    bdcaption.captionID, bdcaption.Duration, bddirectory.firstRunDate as insertDate, bddirectory.startTime, 
    Date(bddirectory.firstRunDate) AS transmissionDate, bddirectory.duration AS videoDuration, 
    bdcommercialtype.commercialTypeName FROM bddirectory INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID     
    INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID INNER JOIN bdsubcategory ON bdbrand.subcategoryID = bdsubcategory.subcategoryID 
    INNER JOIN bdcategory ON bdsubcategory.categoryID = bdcategory.categoryID WHERE YEAR(bddirectory.firstRunDate) >= ` + process.env.START_YEAR + ` AND bdsubcategory.subcategoryID IN (${Subcategories}) AND 
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
  try {
    const result = await db.sequelize.query("SELECT mgs.sender_name, mgs.sender_number,bdc.captionName, brand.brandName, bdc.Duration, bddirectory.startTime, rechannel.channelName,bdsubcategory.subcategoryName, CONCAT(REPLACE(bddirectory.filePath, '//172.168.100.241', 'http://103.249.154.245:8484'), REPLACE(bddirectory.fileName, '.flv', '.jpg')) AS pictureURL, CONCAT(REPLACE(bddirectory.filePath, '//172.168.100.241', 'http://103.249.154.245:8484'),REPLACE(bddirectory.fileName, '.flv', '.mp4')) AS fileUrl , DATE(bddirectory.firstRunDate) as insertDate FROM phonebook.mgsharinginternal as mgs  INNER JOIN phonebook.newsms_person as np ON mgs.receiver_number = np.personNumber INNER JOIN pktvmedia.bdcaption as bdc ON bdc.captionID = mgs.captionID INNER JOIN pktvmedia.bddirectory ON bdc.captionID = bddirectory.captionID INNER JOIN pktvmedia.rechannel ON bddirectory.channelID = rechannel.channelID INNER JOIN pktvmedia.bdbrand as brand ON brand.brandID = bdc.brandID INNER JOIN pktvmedia.bdsubcategory ON brand.subcategoryID = bdsubcategory.subcategoryID WHERE np.personID = " + person_id + " ORDER BY mgs.insertdate DESC LIMIT 25", { type: db.sequelize.QueryTypes.SELECT });
    return res.status(200).send(result); 
  } catch (error) {
    return res.status(200).send({message: "No messages found"});
  }  
};
exports.notification = async (req, res) => {
  const token = req.body.token;
  if (!token)
    return res.status(400).send({ message: "Timed Out" });
  const key = process.env.SECRET_CODE;
  let person_id = parseInt(token) - parseInt(key);
  const result = await db.sequelize.query(`SELECT sms_jobs.message FROM phonebook.sms_jobs INNER JOIN phonebook.newsms_person ON newsms_person.personNumber = phonebook.sms_jobs.telNo WHERE newsms_person.personID = ` + person_id + ` ORDER BY sms_jobs.insertDate DESC LIMIT 10`, { type: db.sequelize.QueryTypes.SELECT });
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
exports.getAdByDateBrandDuration = async (req, res) => {
  const token = req.body.token;
  const brand = req.body.brand;
  let date = req.body.date;

  if (!token || !brand || !date)
    return res.status(400).send({ message: "Missing fields" });
  if (!isValidDateFormat(date)) {
    date = convertToValidDateFormat(date);
    if (!date) {
      return res.status(400).send({ message: "Invalid date format. Should be (YYYY-MM-DD)" });
    }
  }
  if (req.body.duration && !req.body.duration.toString().match(/[a-z]/i)) {
    const duration = req.body.duration.toString();
    const result = await db.sequelize.query(`SELECT bddirectory.firstRunDate as insertDate, bddirectory.startTime, bddirectory.duration, REPLACE(bddirectory.filePath,'//172.168.100.241','http://103.249.154.245:8484') AS filePath, REPLACE(bddirectory.fileName,'.flv','.mp4') AS fileName, bdcaption.captionName, bdbrand.brandName, bdsubcategory.subcategoryName, bdcategory.categoryName, rechannel.channelName, bdcommercialtype.commercialTypeName FROM bddirectory INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID INNER JOIN bdsubcategory ON bdbrand.subcategoryID = bdsubcategory.subcategoryID INNER JOIN bdcategory ON bdsubcategory.categoryID = bdcategory.categoryID INNER JOIN rechannel ON rechannel.channelID = bddirectory.channelID WHERE bdbrand.brandName = '` + brand + `' AND (bddirectory.firstRunDate >= DATE_SUB('` + date + `', INTERVAL 2 DAY)) AND bddirectory.duration = '` + duration + `' AND bdcommercialtype.commercialTypeName = 'Spot/TVC' AND bddirectory.isActive = 1`, { type: db.sequelize.QueryTypes.SELECT });
    return res.status(200).send(result);
  }
  else {
    const result = await db.sequelize.query(`SELECT bddirectory.firstRunDate as insertDate, bddirectory.startTime, bddirectory.duration, REPLACE(bddirectory.filePath,'//172.168.100.241','http://103.249.154.245:8484') AS filePath, REPLACE(bddirectory.fileName,'.flv','.mp4') AS fileName, bdcaption.captionName, bdbrand.brandName, bdsubcategory.subcategoryName, bdcategory.categoryName, rechannel.channelName, bdcommercialtype.commercialTypeName FROM bddirectory INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID INNER JOIN bdsubcategory ON bdbrand.subcategoryID = bdsubcategory.subcategoryID INNER JOIN bdcategory ON bdsubcategory.categoryID = bdcategory.categoryID INNER JOIN rechannel ON rechannel.channelID = bddirectory.channelID WHERE bdbrand.brandName = '` + brand + `' AND ((bddirectory.firstRunDate >= DATE_SUB('` + date + `', INTERVAL 1 DAY)) OR (bdcaption.editDate >= DATE_SUB('` + date + `', INTERVAL 1 DAY))) AND bdcommercialtype.commercialTypeName = 'Spot/TVC' AND bddirectory.isActive = 1`, { type: db.sequelize.QueryTypes.SELECT });
    return res.status(200).send(result);
  }
}
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