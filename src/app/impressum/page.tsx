import Link from "next/link";
import { Coffee } from "lucide-react";

// HINWEIS: Platzhalter in [KLAMMERN] mit echten Firmendaten ersetzen und
// rechtlich prüfen lassen, bevor zahlende Kunden onboarden.
export default function ImprintPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Coffee className="h-5 w-5 text-terracotta" />
        <span className="font-display text-lg font-semibold">mojlokal</span>
      </Link>

      <h1 className="font-display text-3xl font-semibold">Impressum</h1>

      <div className="prose-sm mt-6 space-y-4 text-espresso-light">
        <section>
          <h2 className="font-display text-lg font-semibold text-espresso">
            Pružatelj usluge / Anbieter
          </h2>
          <p>
            [IME I PREZIME / NAZIV TVRTKE]
            <br />
            [ADRESA]
            <br />
            [POŠTANSKI BROJ, MJESTO]
            <br />
            [DRŽAVA]
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-espresso">Kontakt</h2>
          <p>
            E-mail: [E-MAIL ADRESA]
            <br />
            Telefon: [TELEFONSKI BROJ]
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-espresso">
            Registracija / UID
          </h2>
          <p>
            [OIB / UID-BROJ / OBRTNI REGISTAR — po potrebi]
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-espresso">
            Odgovornost za sadržaj
          </h2>
          <p>
            Sadržaji ove aplikacije izrađeni su s najvećom pažnjom. Za točnost,
            potpunost i aktualnost sadržaja ne preuzimamo odgovornost. Za sadržaje
            koje korisnici unose u aplikaciju (podaci o lokalu, smjenama, blagajni)
            odgovorni su isključivo korisnici sami.
          </p>
        </section>
      </div>

      <p className="mt-10 text-xs text-espresso/40">
        <Link href="/privatnost" className="underline underline-offset-4">
          Politika privatnosti
        </Link>
      </p>
    </div>
  );
}
