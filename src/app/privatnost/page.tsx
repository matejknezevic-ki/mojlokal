import Link from "next/link";
import { Coffee } from "lucide-react";

// HINWEIS: Entwurf einer DSGVO-Datenschutzerklärung auf Kroatisch.
// Platzhalter ersetzen und vor dem produktiven Einsatz rechtlich prüfen lassen.
export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Coffee className="h-5 w-5 text-terracotta" />
        <span className="font-display text-lg font-semibold">mojlokal</span>
      </Link>

      <h1 className="font-display text-3xl font-semibold">Politika privatnosti</h1>
      <p className="mt-2 text-sm text-espresso/50">
        Zadnja izmjena: srpanj 2026.
      </p>

      <div className="mt-6 space-y-5 text-sm leading-relaxed text-espresso-light">
        <section>
          <h2 className="font-display text-lg font-semibold text-espresso">
            1. Voditelj obrade
          </h2>
          <p>
            MK KI Services e.U., Sperlingstraße 10, 4540 Bad Hall, Austrija,
            e-mail: matej@mk-ki.at. Za sva pitanja o
            zaštiti podataka obratite nam se na navedenu adresu.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-espresso">
            2. Koje podatke obrađujemo
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Vlasnici lokala:</strong> e-mail adresa, lozinka (pohranjena
              kriptirano), naziv lokala, ime.
            </li>
            <li>
              <strong>Konobari:</strong> ime, radno vrijeme (početak i kraj smjene),
              raspored smjena, dostupnost, zahtjevi za slobodne dane, PIN (pohranjen
              kriptirano). Konobare u aplikaciju unosi vlasnik lokala, koji je za tu
              obradu odgovoran kao poslodavac.
            </li>
            <li>
              <strong>Podaci o poslovanju:</strong> stanje blagajne na kraju smjene,
              stavke checkliste, poruke primopredaje.
            </li>
            <li>
              <strong>Napojnice:</strong> vidljive isključivo konobaru koji ih je
              unio — vlasnik lokala nema pristup.
            </li>
            <li>
              <strong>Push obavijesti:</strong> ako ih uključite, pohranjujemo
              pretplatu vašeg preglednika (endpoint i ključeve) radi slanja
              obavijesti.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-espresso">
            3. Svrha i pravna osnova
          </h2>
          <p>
            Podatke obrađujemo isključivo radi pružanja usluge (čl. 6. st. 1. b
            GDPR — izvršenje ugovora): izrada rasporeda smjena, evidencija radnog
            vremena i stanja blagajne. Podatke ne prodajemo i ne koristimo za
            oglašavanje.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-espresso">
            4. Izvršitelji obrade
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Supabase</strong> (baza podataka i autentifikacija) — podaci se
              pohranjuju u EU (AWS, Frankfurt, eu-central-1).
            </li>
            <li>
              <strong>Vercel</strong> (hosting aplikacije).
            </li>
            <li>
              <strong>Anthropic</strong> (AI izrada rasporeda) — pri generiranju
              rasporeda prenose se imena konobara, željeni broj smjena i
              dostupnost; podaci se ne koriste za treniranje modela.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-espresso">
            5. Rok čuvanja
          </h2>
          <p>
            Podatke čuvamo dok postoji korisnički račun. Brisanjem računa brišu se
            svi podaci lokala, uključujući konobare, smjene i evidencije. Zahtjev za
            brisanje možete poslati na matej@mk-ki.at.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-espresso">
            6. Vaša prava
          </h2>
          <p>
            Imate pravo na pristup, ispravak, brisanje i prenosivost svojih
            podataka, pravo na ograničenje obrade i pravo na prigovor, kao i pravo
            na pritužbu nadzornom tijelu (u Hrvatskoj: AZOP — Agencija za zaštitu
            osobnih podataka).
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-espresso">
            7. Kolačići
          </h2>
          <p>
            Koristimo isključivo tehnički nužne kolačiće: sesiju za prijavu
            (vlasnik odnosno konobar) i postavku jezika. Ne koristimo kolačiće za
            praćenje ni analitiku trećih strana.
          </p>
        </section>
      </div>

      <p className="mt-10 text-xs text-espresso/40">
        <Link href="/impressum" className="underline underline-offset-4">
          Impressum
        </Link>
      </p>
    </div>
  );
}
