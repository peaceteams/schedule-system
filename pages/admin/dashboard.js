import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { requireAdminSession } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function logout() {
  await fetch("/api/admin/logout", { method: "POST" });
  window.location.href = "/admin/login";
}

export default function Dashboard({ adminId, sessionId }) {
  useEffect(() => {
    console.log("[Dashboard] Realtime START");

    const channel = supabase
      .channel("session-watch")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "admin_sessions",
        },
        (payload) => {
          console.log("[Realtime] payload:", payload);

          // ここで sessionId を if で判定する
          if (payload.new.id === sessionId && payload.new.is_deleted === true) {
            console.log("[Realtime] MATCH → force logout");
            logout();
          }
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>ログイン中: {adminId}</p>

      <button
        onClick={async () => {
          logout();
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