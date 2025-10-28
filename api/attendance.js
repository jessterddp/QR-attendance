import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("❌ Missing Supabase environment variables");
      return res.status(500).json({ success: false, message: "Missing Supabase environment variables" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method !== "POST") {
      return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    const { student_number } = req.body || {};
    if (!student_number) {
      return res.status(400).json({ success: false, message: "Missing student_number" });
    }

    console.log("📩 Received student_number:", student_number);

    const { data: studentData, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("student_number", student_number)
      .single();

    if (studentError || !studentData) {
      console.error("⚠️ Student not found:", studentError || student_number);
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const date = new Date();
    const currentDate = date.toISOString().split("T")[0];
    const currentTime = date.toTimeString().split(" ")[0];

    const { data: existing, error: checkError } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("student_number", student_number)
      .eq("date", currentDate)
      .maybeSingle();

    if (checkError) {
      console.error("❌ Error checking existing record:", checkError);
      return res.status(500).json({ success: false, message: "Error checking attendance" });
    }

    if (existing) {
      return res.status(200).json({
        success: true,
        message: `✅ Already marked: ${studentData.name} (${student_number})`
      });
    }

    const { error: insertError } = await supabase.from("attendance_records").insert([
      {
        date: currentDate,
        time: currentTime,
        student_number,
        status: "Present",
      },
    ]);

    if (insertError) {
      console.error("❌ Error inserting attendance:", insertError);
      return res.status(500).json({ success: false, message: "Failed to insert attendance" });
    }

    console.log(`🟢 Marked present: ${studentData.name} (${student_number})`);
    return res.status(200).json({
      success: true,
      message: `🟢 Marked Present: ${studentData.name} (${student_number})`
    });
  } catch (error) {
    console.error("❌ Uncaught server error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error — check function logs in Vercel"
    });
  }
}
