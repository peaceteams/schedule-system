import { useState } from "react";

export default function AdminRegister() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const res = await fetch("/api/adminRegister", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (data.ok) {
            setIsError(false);
            setMessage("確認メールを送信しました。メールをチェックしてください。");
        } else {
            setIsError(true);
            setMessage("エラー: " + (data.error || data.message));
        }
    };

  return (
    <div style={styles.container}>
        <h2>管理者アカウント登録</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
        <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
        />

        <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
        />

        <button type="submit" style={styles.button}>
            登録する
        </button>
        </form>

        {message && (
            <div
                style={{
                ...styles.message,
                backgroundColor: isError ? "#ffe0e0" : "#e0ffe0",
                color: isError ? "#c00000" : "#008000",
                }}
            >
                {message}
            </div>
        )}
    </div>
    );
}

const styles = {
    container: {
        fontFamily: "sans-serif",
        maxWidth: "400px",
        margin: "40px auto",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "8px",
    },
    form: {
        marginTop: "20px",
    },
        input: {
        width: "100%",
        padding: "10px",
        margin: "8px 0",
        border: "1px solid #ccc",
        borderRadius: "4px",
    },
    button: {
        width: "100%",
        padding: "12px",
        background: "#0070f3",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "16px",
    },
        message: {
        marginTop: "15px",
        padding: "10px",
        borderRadius: "4px",
    },
};