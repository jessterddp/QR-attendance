import fs from "fs";
import path from "path";

/**
 * Vercel Serverless Function — Handles student attendance via POST requests.
 * Expects JSON: { "student_number": "12345" }
 */
export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { student_number } = req.body;

    if (!student_number) {
      return res.status(400).json({
        success: false,
        message: "Missing student_number in request body",
      });
    }

    // File paths
    const studentsPath = path.join(process.cwd(), "students.json");
    const attendancePath = path.join(process.cwd(), "attendance_records.csv");

    // Check if students.json exists
    if (!fs.existsSync(studentsPath)) {
      return res.status(404).json({
        success: false,
        message: "students.json not found on server",
      });
    }

    // Load students
    const students = JSON.parse(fs.readFileSync(studentsPath, "utf8"));
    const student = students[student_number];

    // Validate student
    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student number ${student_number} not found`,
      });
    }

    // Get current date/time
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().split(" ")[0];

    // Ensure attendance file exists
    if (!fs.existsSync(attendancePath)) {
      fs.writeFileSync(
        attendancePath,
        "Date,Time,Student Number,Student Name,Grade Level,Section,Status\n"
      );
    }

    const csv = fs.readFileSync(attendancePath, "utf8");

    // Prevent duplicate attendance for same day
    const alreadyMarked = csv.includes(`${currentDate},${student_number}`);
    if (alreadyMarked) {
      return res.status(200).json({
        success: true,
        message: `✅ Already marked: ${student.name} (${student_number})`,
      });
    }

    // Add new attendance record
    const newLine = `${currentDate},${currentTime},${student_number},${student.name},${student.grade_level},${student.section},Present\n`;
    fs.appendFileSync(attendancePath, newLine);

    return res.status(200).json({
      success: true,
      message: `🟢 Marked Present: ${student.name} (${student_number})`,
    });
  } catch (error) {
    console.error("Error in attendance handler:", error);
    return res.status(500).json({
      success: false,
      message: "Server error — please check logs or file permissions",
    });
  }
}
