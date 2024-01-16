from flask import Flask, current_app
from flask_mail import Mail, Message
import requests
from mmtvc_config import *
import mysql.connector
from datetime import datetime

app = Flask(__name__)
app.config['MAIL_SERVER'] = MAIL_SERVER
app.config['MAIL_PORT'] = MAIL_PORT
app.config['MAIL_USE_TLS'] = MAIL_USE_TLS
app.config['MAIL_USE_SSL'] = MAIL_USE_SSL
app.config['MAIL_USERNAME'] = MAIL_USERNAME
app.config['MAIL_PASSWORD'] = MAIL_PASSWORD
app.config['MAIL_DEFAULT_SENDER'] = MAIL_DEFAULT_SENDER
mail = Mail(app)


def get_tiny_url(url):
    response = requests.get(f'http://tinyurl.com/api-create.php?url={url}')
    return response.text

def send_email(receiver_name, receiver_email, sender_name, link):
    current_year = datetime.now().year
    subject = f"Media Monitors - New TVC Email App Share from {sender_name}"
    tiny_url = get_tiny_url(link)

    message = f"""
    <html>
    <head>
        <style>
            /* Your CSS styles here */
        </style>
    </head>
    <body>
        <p>Hi {receiver_name},</p>
        <br/>
        <p>You have a message from {sender_name}. Kindly click below link to preview the NEW TV Ad reference provided to you:</p>
        <p><a href='{tiny_url}' class='btn btn-danger pull-center'>Play Share Video</a></p>
        <br/>
        <p>Note: This is a system-generated email. Please do not reply to this email.</p>
        <p>Regards,</p>
        <p>{sender_name}</p>
        <p>Media Monitors Pakistan | (Media Info Systems (Private) Limited)</p>
        <p>43 H/III | Unit # 2 | Block 6 P.E.C.H.S. | Off Razi Road, | KARACHI - PAKISTAN</p>
        <p>T +92 (0) 2134306575-6 | F +92 (0) 213 430 6578</p>
        <p><a href='mailto:info@mediamonitors.com.pk'>info@mediamonitors.com.pk</a> | <a href='http://mediamonitors.com.pk/'>www.mediamonitors.com.pk</a></p>
        <hr>
        <p class='intro'>Disclaimer :</p>
        <p class='intro'>This message was sent to {receiver_email}, on behalf of MediaMonitors latest New TVC Video Alert Emails.</p>
        <p class='intro'>If you don't want to receive these emails from Media Monitors Pakistan in the future, simply send a request to <a class='intro' href='mailto:info@mediamonitors.com.pk'>info@mediamonitors.com.pk</a></p>
        <p class='intro'>43H/III, Unit # 2, Street 43, Block 6, P.E.C.H.S., off Razi Road, Karachi -75400 Pakistan. All rights reserved copyright@{current_year} mediamonitors.com.pk</p>
    </body>
    </html>
    """

    with app.app_context():
        msg = Message(subject, recipients=[receiver_email], html=message)
        mail.send(msg)

def execute_query(query, params=None, fetch_result=False):
    db_connection = None
    db_cursor = None

    try: 
        db_connection = mysql.connector.connect(
            host=DATABASE_HOST,
            database=DATABASE_PHONEBOOK,
            user=DATABASE_USER,
            password=DATABASE_PASSWORD
        )
        db_cursor = db_connection.cursor(dictionary=True)

        if params:
            db_cursor.execute(query, params)
        else:
            db_cursor.execute(query)

        if fetch_result:
            result = db_cursor.fetchall()
            return result
        else:
            db_connection.commit()
            return None

    except mysql.connector.Error as err:
        print(f"Error: {err}")
        return None

    finally:
        if db_cursor:
            db_cursor.close()
        if db_connection:
            db_connection.close()

def get_email():
    emails_to_send = execute_query("SELECT mgsharingexternal.shareid, mgsharingexternal.sender_name, mgsharingexternal.sender_email, mgsharingexternal.receiver_name, mgsharingexternal.receiver_email, CONCAT(REPLACE (pktvmedia.bddirectory.filePath, '//172.168.100.241/branddirectory', 'http://103.249.154.245:8484/stream.php?fp=') , REPLACE(pktvmedia.bddirectory.fileName,'.flv','.mp4'),'&rd=1&e=',mgsharingexternal.receiver_email ) AS caption FROM mgsharingexternal INNER JOIN pktvmedia.bddirectory ON mgsharingexternal.captionID = pktvmedia.bddirectory.captionID WHERE mgsharingexternal.isemail = 0",None,True)
    return emails_to_send

if __name__ == '__main__':
    email_data = get_email()
    for email in email_data:        
        send_email(email['receiver_name'], email['receiver_email'].replace(' ', ''), email['sender_name'], email['caption'].replace(' ', ''))
    print("Emails sent successfully")
    execute_query("UPDATE mgsharingexternal SET isemail = 1 WHERE isemail = 0",None,False)