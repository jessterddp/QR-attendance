from datetime import datetime
import pandas as pd
import os
import json

def handler(request):
    if request.method != "POST":
        return {
            "statusCode": 405,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"success": False, "message": "Method not allowed"})
        }

    try:
        body = request.json()
        student_number = body.get("student_number")
    except Exception:
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"success": False, "message": "Invalid JSON"})
        }

    students_file = "students.json"
    attendance_file = "attendance_records.csv"

    if not os.path.exists(students_file):
        return {
            "statusCode": 404,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"success": False, "message": "students.json not found"})
        }

    with open(students_file, "r") as f:
        students = json.load(f)

    if student_number not in students:
        return {
            "statusCode": 404,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"success": False, "message": "Student not found"})
        }

    student = students[student_number]
    current_date = datetime.now().strftime("%Y-%m-%d")
    current_time = datetime.now().strftime("%H:%M:%S")

    if os.path.exists(attendance_file):
        df = pd.read_csv(attendance_file)
    else:
        df = pd.DataFrame(columns=['Date', 'Time', 'Student Number', 'Student Name', 'Grade Level', 'Section', 'Status'])

    # Prevent duplicate attendance for the same day
    already_marked = df[
        (df['Date'] == current_date) & 
        (df['Student Number'] == student_number)
    ]

    if not already_marked.empty:
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"success": True, "message": f"✅ Already marked: {student['name']} ({student_number})"})
        }

    new_record = {
        'Date': current_date,
        'Time': current_time,
        'Student Number': student_number,
        'Student Name': student['name'],
        'Grade Level': student['grade_level'],
        'Section': student['section'],
        'Status': 'Present'
    }

    df = pd.concat([df, pd.DataFrame([new_record])], ignore_index=True)
    df.to_csv(attendance_file, index=False)

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"success": True, "message": f"🟢 Marked Present: {student['name']} ({student_number})"})
    }
