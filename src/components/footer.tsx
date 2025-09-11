import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-4 pt-4 py-4 text-center text-xs text-muted-foreground">
      <div>
        <p>
          © {currentYear} Xtreme Construction. Todos los derechos reservados.
        </p>
        <p>
          Diseñado y desarrollado por{" "}
          <Link
            href="https://github.com/juliandavidnunesfranco"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            JulianDev
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
