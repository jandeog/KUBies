export type ParsedContact = {
  text?: string;
  company?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  email?: string;
  phones?: string[];
  address?: string;
  website?: string;
};

export function parseVisionText(text: string): ParsedContact {
  const clean = text.replace(/\s+/g, " ").trim();

  const email = clean.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phones = Array.from(new Set(clean.match(/(\+?\d[\d\s\-]{7,}\d)/g)));
  const website = clean.match(/(www\.[A-Za-z0-9.-]+)/i)?.[1];

  const nameMatch = clean.match(
    /([Α-ΩΆΈΉΊΌΎΏA-Z][α-ωάέήίόύώa-z]+ [Α-ΩΆΈΉΊΌΎΏA-Z][α-ωάέήίόύώa-z]+)/u
  );
  const [first_name, last_name] = nameMatch ? nameMatch[0].split(" ") : [undefined, undefined];

  const company =
    clean
      .split(/(?=\b[A-ZΑ-Ω])/)
      .find((s) => /^[A-ZΑ-Ω0-9\s.&\-]+$/.test(s.trim()) && !s.match(/\d/))
      ?.trim() || undefined;

  const title = clean.match(/(Σύμβουλος|Διευθυντής|Manager|Sales|Πωλήσεων)/i)?.[0];

  const address = clean.match(
    /(Οδός|χλμ|Χαλκίδα|Λεωφ|ΤΚ|TK|Street|Str\.?) [^,]+(,[^,]+)*?/i
  )?.[0];

  return { text, company, first_name, last_name, title, email, phones, address, website };
}
