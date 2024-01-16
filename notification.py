import requests
import mysql.connector
from mmtvc_config import *

def send_alert(jobid, fcm_id, message):
    api_url = 'https://mmtvc.mediamonitors.com.pk/api/notification/alert'
    headers = {
        'Authorization': 'key=AIzaSyAMJ8jCgs_YVP30M1Kods2Y44DO_iFntFQ',
        'Content-Type': 'application/json',
    }

    data = {
        'jobid': jobid,
        'fcm_id': fcm_id,
    }

    try:
        response = requests.post(api_url, json=data, headers=headers)
        response.raise_for_status()

        if response.status_code == 200:
            print('Delivered')
        elif response.status_code == 208:
            print('Already Delivered')
        else:
            print(f'Error: {response.status_code} - {response.text}')
            write_to_error_file(response.text)

    except requests.exceptions.RequestException as e:
        print(f'Request failed: {e}')
        write_to_error_file(str(e))

def write_to_error_file(error_message):
    with open('error_jobs.txt', 'a') as error_file:
        error_file.write(error_message + '\n')

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

if __name__ == '__main__':
    sql_query = """
                    SELECT
                    jobsID, message, fcm_id
                    FROM
                    sms_jobs
                    INNER JOIN newsms_person ON newsms_person.personNumber = sms_jobs.telNo
                    WHERE
                    delivered = 0
                """  
    messages = execute_query(sql_query, fetch_result=True)
    for message in messages:
        message_to_send = message['message']
        job_id_to_send = message['jobsID']
        fcm_id_to_send = message['fcm_id']
        send_alert(job_id_to_send, fcm_id_to_send,message_to_send)    
