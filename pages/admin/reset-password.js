import dynamic from "next/dynamic";

const ResetPasswordPage = dynamic(
  () => import("@/components/reset-password"),
  { ssr: false } // ← ここで SSR を完全停止
);

export default ResetPasswordPage;