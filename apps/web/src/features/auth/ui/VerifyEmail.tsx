"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { verifyEmail } from "../auth.api";
import styles from "../auth.module.css";

export function VerifyEmail({ token }: { token: string }) {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  // Strict Mode runs effects twice in development. The token works only once,
  // so the request must run exactly once.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!token) {
      setResult({ ok: false, message: "This verification link is missing its token." });
      return;
    }
    verifyEmail(token)
      .then((data) => setResult({ ok: true, message: data.message }))
      .catch((err: unknown) =>
        setResult({ ok: false, message: err instanceof Error ? err.message : "Verification failed" }),
      );
  }, [token]);

  return (
    <section className={styles.page}>
      <h1>Verify email</h1>
      {!result && <p className={styles.muted}>Verifying...</p>}
      {result && <p className={result.ok ? styles.success : styles.error}>{result.message}</p>}
      {result?.ok && (
        <p>
          <Link href="/login">Log in</Link>
        </p>
      )}
    </section>
  );
}
