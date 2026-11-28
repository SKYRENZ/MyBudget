import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } =
await supabaseAdmin.auth.admin.updateUserById(
  "551d6329-756e-4274-ab4e-cd48b95a2a08",
  {
    email: "admin@mybudget.app",
    password: "123456789",
    email_confirm: true,
    user_metadata: {
      username: "admin",
      full_name: "Admin",
    },
  }
);

  return Response.json({ data, error });
}
