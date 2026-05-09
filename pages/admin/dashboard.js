import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { requireAdminSession } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard({ adminId, sessionId }) {
  useEffect(() => {
    const channel = supabase
      .channel("session-watch")
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "admin_sessions",
        },
        (payload) => {
          if (payload.old.id === sessionId) {
            window.location.href = "/admin/login";
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sessionId]);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>ログイン中: {adminId}</p>

      <button
        onClick={async () => {
          await fetch("/api/logout", { method: "POST" });
          window.location.href = "/admin/login";
        }}
      >
        ログアウト
      </button>
    </div>
  );
}

export async function getServerSideProps({ req }) {
  const auth = await requireAdminSession(req);

  if (!auth.ok) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  return {
    props: {
      adminId: auth.adminId,
      sessionId: auth.sessionId, // ★ admin の中に入れない
    },
  };
}