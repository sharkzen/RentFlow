import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-border bg-surface text-muted border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm sm:flex-row">
        <p>© {new Date().getFullYear()} RentFlow. สงวนลิขสิทธิ์</p>
        <nav className="flex items-center gap-5">
          <Link
            href="/privacy"
            className="hover:text-foreground transition-colors"
          >
            นโยบายความเป็นส่วนตัว
          </Link>
        </nav>
      </div>
    </footer>
  );
}
