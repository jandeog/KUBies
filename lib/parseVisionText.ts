// --- lib/parseVisionText.ts ---
export type FieldConfidence<T> = {
  value?: T;
  confidence: number; // 0–1
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
  multipleContacts?: ParsedContact[]; // if multiple names detected
};

// --- Language detection ---
function detectLanguage(text: string): "el" | "en" | "mixed" {
  const el = (text.match(/[Α-Ωα-ωΆ-ώ]/g) || []).length;
  const en = (text.match(/[A-Za-z]/g) || []).length;
  if (el > en * 2) return "el";
  if (en > el * 2) return "en";
  return "mixed";
}

const conf = (exists: any, weight = 0.9): number => (exists ? weight : 0);

// --- Helper: Fix common OCR noise in company names ---
function fixCompany(name?: string) {
  if (!name) return undefined;
  return (
    name
      // remove leading OCR “Ν” / “N” issues
      .replace(/^[ΝNH]+\s?/, "")
      // normalize spacing and casing
      .replace(/\s{2,}/g, " ")
      .trim() || undefined
  );
}

// --- Main parser ---
export function parseVisionText(text: string): ParsedContact {
  const clean = text.replace(/\s+/g, " ").trim();
  const lang = detectLanguage(clean);

  // Email
  const email = clean.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];

  // Phones (handle +30, spaces, dashes)
  const phones = Array.from(new Set(clean.match(/(\+?\d[\d\s\-]{7,}\d)/g)));

  // Website
  const website = clean.match(/(www\.[A-Za-z0-9.-]+)/i)?.[1];

  // Name (two Greek/Latin words with capital initials)
  const nameMatches = Array.from(
    clean.matchAll(
      /([Α-ΩΆΈΉΊΌΎΏA-Z][α-ωάέήίόύώa-z]+ [Α-ΩΆΈΉΊΌΎΏA-Z][α-ωάέήίόύώa-z]+)/gu
    )
  );
  const [first_name, last_name] = nameMatches[0]
    ? nameMatches[0][0].split(" ")
    : [undefined, undefined];

  // Titles (Greek + English)
  const title = clean.match(
    /(Σύμβουλος\s+\w+|Πωλήσεων|Διευθυντής|Manager|Sales|Engineer|Consultant|Supervisor|Director)/i
  )?.[0];

  // Company: collect candidate lines, prioritize meaningful words
  const lines = text
    .split(/\n|\\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2 && !s.includes("@") && !s.match(/\d/));
  const companyCandidates = lines.filter((s) =>
    /DOORS|COMPANY|ELEGANT|ΑΕ|ΕΠΕ|LTD|ΟΕ|ΙΚΕ|SA|HOB/i.test(s)
  );
  const rawCompany = companyCandidates[0] || lines[0];
  const company = fixCompany(rawCompany);

  // Address (capture “χλμ.”, “Τ.Κ.”, city names, etc.)
  const address = clean.match(
    /(\d+ ?(ο|ο\.|χλμ|χλμ\.)[^,]+,[^@]*?(Χαλκίδα|Αθήνα|Θεσσαλονίκη|TK|Τ\.Κ\.|T\.K\.|Greece))/i
  )?.[0];

  // Detect multiple contacts (cards with >1 name)
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
