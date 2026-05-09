import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { requireAdminSession } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard({ admin }) {
  useEffect(() => {
    // ★ Realtime: admin_sessions の DELETE を監視
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
          console.log("DELETE DETECTED:", payload);

          // ★ 自分の sessionId が削除されたら即ログアウト
          if (payload.old.id === admin.sessionId) {
            console.log("This device session deleted → force logout");
            window.location.href = "/admin/login";
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [admin.sessionId]);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>ログイン中: {admin.adminId}</p>

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
      admin: {
        adminId: auth.adminId,
        sessionId: auth.sessionId, // ★ Realtime 用に追加
      },
    },
  };
}