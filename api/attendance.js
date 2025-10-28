import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const { student_number } = req.body;

    if (!student_number) {
      return res
        .status(400)
        .json({ success: false, message: "Missing student_number" });
    }

    const studentsFile = path.join(process.cwd(), "students.json");
    const attendanceFile = path.join(process.cwd(), "attendance_records.csv");

    // Check if students.json exists
    if (!fs.existsSync(studentsFile)) {
      return res
        .status(404)
        .json({ success: false, message: "students.json not found" });
    }

    const students = JSON.parse(fs.readFileSync(studentsFile, "utf8"));

    if (!students[student_number]) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const student = students[student_number];
    const currentDate = new Date().toISOString().split("T")[0];
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour12: false,
    });

    // If CSV doesn't exist, create one with headers
    if (!fs.existsSync(attendanceFile)) {
      fs.writeFileSync(
        attendanceFile,
        "Date,Time,Student Number,Student Name,Grade Level,Section,Status\n",
        "utf8"
      );
    }

    // Read CSV data
    const csvData = fs.readFileSync(attendanceFile, "utf8").split("\n");

    // Check for duplicate entry for same day
    const alreadyMarked = csvData.some((line) =>
      line.includes(`${currentDate},`) &&
      line.includes(`,${student_number},`)
    );

    if (alreadyMarked) {
      return res.status(200).json({
        success: true,
        message: `✅ Already marked: ${student.name} (${student_number})`,
      });
    }

    // Append new record
    const newRecord = `${currentDate},${currentTime},${student_number},"${student.name}",${student.grade_level},${student.section},Present\n`;
    fs.appendFileSync(attendanceFile, newRecord, "utf8");

    return res.status(200).json({
      success: true,
      message: `🟢 Marked Present: ${student.name} (${student_number})`,
    });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}
