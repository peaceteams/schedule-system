import jwt from "jsonwebtoken";

export default function Dashboard({ admin }) {
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1>管理者ダッシュボード（テスト用）</h1>

      <p>ログイン成功！</p>

      <div style={{ marginTop: "20px", padding: "20px", background: "#f5f5f5" }}>
        <h3>JWT デコード結果</h3>
        <pre>{JSON.stringify(admin, null, 2)}</pre>
      </div>
    </div>
  );
}

// SSR で Cookie を読み取る
export async function getServerSideProps({ req }) {
  const token = req.cookies.admin_session || null;

  if (!token) {
    console.log("No admin_session cookie found");
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  try {
    const admin = jwt.verify(token, process.env.JWT_SECRET);

    return {
      props: { admin },
    };
  } catch (err) {
    console.log("JWT verify error:", err);
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }
}