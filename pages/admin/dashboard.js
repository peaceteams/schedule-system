import jwt from "jsonwebtoken";

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

export async function getServerSideProps({ req, res }) {
  const token = req.cookies.admin_session;

  // Cookie が無い → ログインしていない
  if (!token) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  try {
    // JWT を検証
    const admin = jwt.verify(token, process.env.JWT_SECRET);

    // OK → ページに admin 情報を渡す
    return {
      props: { admin },
    };
  } catch (err) {
    // 壊れた JWT / 期限切れ → Cookie を削除してログインへ
    res.setHeader(
      "Set-Cookie",
      "admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict; Secure"
    );

    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }
}