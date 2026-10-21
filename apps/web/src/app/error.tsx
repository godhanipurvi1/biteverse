"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section style={{ padding: "2rem", textAlign: "center" }}>
      <p>Something went wrong.</p>
      <button type="button" onClick={() => reset()}>
        Try again
      </button>
    </section>
  );
}
