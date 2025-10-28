import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  // Handle GET request - fetch attendance records
  if (req.method === "GET") {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ success: false, message: "Missing date parameter" });
      }

      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("date", date);

      if (error) throw error;

      return res.status(200).json({ success: true, records: data || [] });
    } catch (err) {
      console.error("Error fetching attendance:", err);
      return res.status(500).json({ success: false, message: "Error fetching attendance", records: [] });
    }
  }

  // Handle POST request - mark attendance
  if (req.method === "POST") {
    try {
      const { student_number } = req.body;

      if (!student_number) {
        return res.status(400).json({ success: false, message: "Missing student_number" });
      }

      const studentsPath = path.join(process.cwd(), "public", "students.json");
      const students = JSON.parse(fs.readFileSync(studentsPath, "utf8"));
      const student = students[student_number];

      if (!student) {
        return res.status(404).json({ success: false, message: "Student not found" });
      }

      const date = new Date();
      const currentDate = date.toISOString().split("T")[0];
      const currentTime = date.toTimeString().split(" ")[0];

      // Check if already marked today
      const { data: existing, error: checkError } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("student_number", student_number)
        .eq("date", currentDate);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        return res.status(200).json({
          success: true,
          message: `✅ Already marked: ${student.name} (${student_number})`
        });
      }

      // Insert new record
      const { error: insertError } = await supabase.from("attendance_records").insert([
        {
          student_number,
          student_name: student.name,
          grade_level: student.grade_level,
          section: student.section,
          date: currentDate,
          time: currentTime,
          status: "Present"
        }
      ]);

      if (insertError) throw insertError;

      return res.status(200).json({
        success: true,
        message: `🟢 Marked Present: ${student.name} (${student_number})`
      });
    } catch (err) {
      console.error("Error saving attendance:", err);
      return res.status(500).json({ success: false, message: "Error saving attendance" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
