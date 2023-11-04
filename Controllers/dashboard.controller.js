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
      AND bdbrand.subcategoryID IN (`+Subcategories+`)
      AND bddirectory.isActive = 1
      GROUP BY DATE(bddirectory.insertDate)
      ORDER BY DATE(bddirectory.insertDate) DESC;`, { type: db.sequelize.QueryTypes.SELECT });
    }

    const result = {};
    result.sideNav = {};
    result.dates_commericals_count = dates_commericals_count;
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
    const result = await db.sequelize.query("SELECT bdbrand.brandName, bdcategory.categoryName, bdcategory.categoryID, bdsubcategory.subcategoryID, bdsubcategory.subcategoryName, bdcaption.captionName, bdcaption.captionID, bdcaption.Duration, bddirectory.insertDate, bddirectory.startTime, REPLACE(bddirectory.filePath,'//172.168.100.241','http://103.249.154.245:8484') AS filePath, REPLACE(bddirectory.fileName,'.flv','.mp4') AS fileName, Date(bddirectory.firstRunDate) AS transmissionDate, bddirectory.duration AS videoDuration, rechannel.channelName, bdcommercialtype.commercialTypeName FROM bddirectory INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID INNER JOIN rechannel ON rechannel.channelID = bddirectory.channelID INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID INNER JOIN bdsubcategory ON bdbrand.subcategoryID = bdsubcategory.subcategoryID INNER JOIN bdcategory ON bdsubcategory.categoryID = bdcategory.categoryID WHERE YEAR(bddirectory.insertDate) > '2017' AND (bdbrand.brandName LIKE '%" + searchTerm + "%' OR bdcaption.captionName LIKE '%" + searchTerm + "%') AND bddirectory.isActive = 1 AND bdcommercialtype.commercialTypeName = 'Spot/TVC' ORDER BY Date(bddirectory.firstRunDate) LIMIT 100", { type: db.sequelize.QueryTypes.SELECT });
    return res.status(200).send(result);
  }
  else {
    let subscribedSubcategories = await db.sequelize.query('SELECT subcategoryID FROM phonebook.newsms_subscription WHERE newsms_subscription.personID = ' + person_id, { type: db.sequelize.QueryTypes.SELECT });
    const subcategoryIDs = subscribedSubcategories.map(item => item.subcategoryID);
    const Subcategories = subcategoryIDs.join(',');
    const result = await db.sequelize.query("SELECT bdbrand.brandName, bdcategory.categoryName, bdcategory.categoryID, bdsubcategory.subcategoryID, bdsubcategory.subcategoryName, bdcaption.captionName, bdcaption.captionID, bdcaption.Duration, bddirectory.insertDate, bddirectory.startTime, REPLACE(bddirectory.filePath,'//172.168.100.241','http://103.249.154.245:8484') AS filePath, REPLACE(bddirectory.fileName,'.flv','.mp4') AS fileName, Date(bddirectory.firstRunDate) AS transmissionDate, bddirectory.duration AS videoDuration, rechannel.channelName, bdcommercialtype.commercialTypeName FROM bddirectory INNER JOIN bdcaption ON bdcaption.captionID = bddirectory.captionID INNER JOIN bdcommercialtype ON bdcaption.commercialTypeID = bdcommercialtype.commercialTypeID INNER JOIN rechannel ON rechannel.channelID = bddirectory.channelID INNER JOIN bdbrand ON bdbrand.brandID = bdcaption.brandID INNER JOIN bdsubcategory ON bdbrand.subcategoryID = bdsubcategory.subcategoryID INNER JOIN bdcategory ON bdsubcategory.categoryID = bdcategory.categoryID WHERE YEAR(bddirectory.insertDate) > '2017' AND bdsubcategory.subcategoryID IN (" + Subcategories + ") AND (bdbrand.brandName LIKE '%" + searchTerm + "%' OR bdcaption.captionName LIKE '%" + searchTerm + "%') AND bddirectory.isActive = 1 AND bdcommercialtype.commercialTypeName = 'Spot/TVC' ORDER BY Date(bddirectory.firstRunDate) LIMIT 100", { type: db.sequelize.QueryTypes.SELECT });
    return res.status(200).send(result);
  }
}