import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    const { student_number } = req.body || {};
    if (!student_number) {
      return res.status(400).json({ success: false, message: "Missing student_number" });
    }

    // 🔍 Find the student
    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("student_number", student_number)
      .single();

    if (studentError || !studentData) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const date = new Date();
    const currentDate = date.toISOString().split("T")[0];
    const currentTime = date.toTimeString().split(" ")[0];

    // ⛔ Prevent duplicates
    const { data: existing, error: checkError } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_number", student_number)
      .eq("date", currentDate)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      return res.status(200).json({
        success: true,
        message: `✅ Already marked: ${studentData.name} (${student_number})`
      });
    }

    // ✅ Insert new attendance record
    const { error: insertError } = await supabase.from("attendance_records").insert([
      {
        date: currentDate,
        time: currentTime,
        student_number,
        status: "Present"
      }
    ]);

    if (insertError) throw insertError;

    return res.status(200).json({
      success: true,
      message: `🟢 Marked Present: ${studentData.name} (${student_number})`
    });
  } catch (error) {
    console.error("❌ Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error — check Supabase config or logs"
    });
  }
}
