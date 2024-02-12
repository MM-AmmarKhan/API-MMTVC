const video_404 = {
    "brandName": "N/A",
    "subcategoryName": "N/A",
    "categoryName": "N/A",
    "categoryID": 0,
    "captionName": "Video Not Available",
    "captionID": 1234567,
    "Duration":1,
    "insertDate": "1990-01-01T00:00:00.000Z",
    "startTime": 'N/A',
    "filePath": process.env.VIDEO_URL + "/branddirectory/",
    "fileName": "Video_Not_Avaiable.mp4",
    "videoURL": process.env.VIDEO_URL + '/branddirectory/Video_Not_Avaiable.mp4',
    "pictureURL":process.env.VIDEO_URL + '/branddirectory/Video_Not_Avaiable.jpg',
    "transmissionDate":'N/A',
    "videoDuration":1,
    "channelName":'N/A',
    "commercialTypeName":'Spot/TVC',
};
const notification_404 = [
    {
        "insertDate": "1990-01-01T00:00:00.000Z",
        "captionID": 1234567,
        "startTime": "00:00:00",
        "duration": 1,
        "filePath": process.env.VIDEO_URL + "/branddirectory/",
        "fileName": "Video_Not_Avaiable.mp4",
        "captionName": "Video Not Available",
        "brandName": "N/A",
        "subcategoryName": "N/A",
        "categoryName": "N/A",
        "channelName": "N/A",
        "commercialTypeName": "Spot/TVC"
    }
]

module.exports = video_404;
module.exports = notification_404;
