export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="px-6 text-center text-lg">{process.env.NEXT_PUBLIC_TEST ?? "NO FUNCIONA"}</p>
    </main>
  );
}
