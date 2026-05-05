import jwt from "jsonwebtoken";

export default function Dashboard({ admin }) {
  return (
    <div style={{ padding: 40 }}>
      <h1>管理者ダッシュボード</h1>
      <pre>{JSON.stringify(admin, null, 2)}</pre>
    </div>
  );
}

export async function getServerSideProps({ req }) {
  const token = req.cookies.admin_session || null;

  if (!token) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }

  try {
    const admin = jwt.verify(token, process.env.JWT_SECRET);
    return { props: { admin } };
  } catch (err) {
    return {
      redirect: {
        destination: "/admin/login",
        permanent: false,
      },
    };
  }
}