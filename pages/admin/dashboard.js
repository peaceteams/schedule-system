import { requireAdminSession } from "@/lib/auth";

export default function Dashboard({ admin }) {
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
  // ★ 共通認証ライブラリを呼ぶだけ
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
      },
    },
  };
}