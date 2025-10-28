import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    const { student_number } = req.body || {};
    if (!student_number) {
      return res.status(400).json({ success: false, message: "Missing student_number" });
    }

    const studentsPath = path.join(process.cwd(), "students.json");
    const attendancePath = path.join(process.cwd(), "attendance_records.csv");

    if (!fs.existsSync(studentsPath)) {
      console.error("❌ students.json not found");
      return res.status(404).json({ success: false, message: "students.json not found" });
    }

    const students = JSON.parse(fs.readFileSync(studentsPath, "utf8"));
    const student = students[student_number];

    if (!student) {
      console.error(`⚠️ Student not found: ${student_number}`);
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const date = new Date();
    const currentDate = date.toISOString().split("T")[0];
    const currentTime = date.toTimeString().split(" ")[0];

    let csv = "";
    if (fs.existsSync(attendancePath)) {
      csv = fs.readFileSync(attendancePath, "utf8");
    }

    if (csv.includes(`${currentDate},${student_number}`)) {
      return res.status(200).json({
        success: true,
        message: `✅ Already marked: ${student.name} (${student_number})`
      });
    }

    const newLine = `${currentDate},${currentTime},${student_number},${student.name},${student.grade_level},${student.section},Present\n`;
    fs.appendFileSync(attendancePath, newLine);

    console.log(`🟢 Marked present: ${student.name} (${student_number})`);

    return res.status(200).json({
      success: true,
      message: `🟢 Marked Present: ${student.name} (${student_number})`
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    return res.status(500).json({ success: false, message: "Server error — check logs or file permissions" });
  }
}
