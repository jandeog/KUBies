// --- parseVisionText.ts ---
export type FieldConfidence<T> = {
  value?: T;
  confidence: number; // 0 - 1
};

export type ParsedContact = {
  text?: string;
  lang: "el" | "en" | "mixed";
  company: FieldConfidence<string>;
  first_name: FieldConfidence<string>;
  last_name: FieldConfidence<string>;
  title: FieldConfidence<string>;
  email: FieldConfidence<string>;
  phones: FieldConfidence<string[]>;
  address: FieldConfidence<string>;
  website: FieldConfidence<string>;
  multipleContacts?: ParsedContact[]; // for cards with >1 person
};

// Detect language
function detectLanguage(text: string): "el" | "en" | "mixed" {
  const el = (text.match(/[Α-Ωα-ωΆ-ώ]/g) || []).length;
  const en = (text.match(/[A-Za-z]/g) || []).length;
  if (el > en * 2) return "el";
  if (en > el * 2) return "en";
  return "mixed";
}

// Confidence helper
const conf = (exists: any, weight = 0.9): number => (exists ? weight : 0);

export function parseVisionText(text: string): ParsedContact {
  const clean = text.replace(/\s+/g, " ").trim();
  const lang = detectLanguage(clean);

  // Base regexes
  const email = clean.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phones = Array.from(new Set(clean.match(/(\+?\d[\d\s\-]{7,}\d)/g)));
  const website = clean.match(/(www\.[A-Za-z0-9.-]+)/i)?.[1];
  const title = clean.match(/(Σύμβουλος|Διευθυντής|Manager|Sales|Πωλήσεων|Engineer)/i)?.[0];
  const address = clean.match(
    /(Οδός|χλμ|Χαλκίδα|Λεωφ|ΤΚ|TK|Street|Str\.?) [^,]+(,[^,]+)*?/i
  )?.[0];

  // Name (first + last)
  const nameMatches = Array.from(
    clean.matchAll(
      /([Α-ΩΆΈΉΊΌΎΏA-Z][α-ωάέήίόύώa-z]+ [Α-ΩΆΈΉΊΌΎΏA-Z][α-ωάέήίόύώa-z]+)/gu
    )
  );
  const [first_name, last_name] = nameMatches[0]
    ? nameMatches[0][0].split(" ")
    : [undefined, undefined];

  // Company (line with all caps)
  const company =
    clean
      .split(/(?=\b[A-ZΑ-Ω])/)
      .find(
        (s) =>
          /^[A-ZΑ-Ω0-9\s.&\-]+$/.test(s.trim()) &&
          !s.match(/\d/) &&
          s.length > 3 &&
          s.length < 40
      )
      ?.trim() || undefined;

  // Detect multiple contacts (e.g. two names)
  let multipleContacts: ParsedContact[] | undefined = undefined;
  if (nameMatches.length > 1) {
    multipleContacts = nameMatches.map((match) => {
      const [fn, ln] = match[0].split(" ");
      return {
        text,
        lang,
        company: { value: company, confidence: conf(company) },
        first_name: { value: fn, confidence: 0.9 },
        last_name: { value: ln, confidence: 0.9 },
        title: { value: title, confidence: conf(title) },
        email: { value: email, confidence: conf(email) },
        phones: { value: phones, confidence: conf(phones.length) },
        address: { value: address, confidence: conf(address) },
        website: { value: website, confidence: conf(website) },
      };
    });
  }

  return {
    text,
    lang,
    company: { value: company, confidence: conf(company) },
    first_name: { value: first_name, confidence: conf(first_name) },
    last_name: { value: last_name, confidence: conf(last_name) },
    title: { value: title, confidence: conf(title) },
    email: { value: email, confidence: conf(email) },
    phones: { value: phones, confidence: conf(phones.length) },
    address: { value: address, confidence: conf(address) },
    website: { value: website, confidence: conf(website) },
    multipleContacts,
  };
}
