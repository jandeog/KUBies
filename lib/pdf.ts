import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function buildDiaryPdf({ diary, site, photoUrls }:{ diary:any; site:any; photoUrls:string[] }){
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  const margin = 40;
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  let y = height - margin;
  const drawText = (text:string, size=12, color=rgb(0,0,0)) => {
    page.drawText(text, { x: margin, y, size, font, color });
    y -= size + 8;
  };

  drawText('Site Diary', 20);
  drawText(`Date: ${diary?.date}`);
  drawText(`Site: ${site?.name || ''}`);
  if (site?.address) drawText(`Address: ${site.address}`);
  if (diary?.weather) drawText(`Weather: ${diary.weather}`);

  const paragraphs = [
    ['Activities', diary?.activities || ''],
    ['Notes', diary?.notes || ''],
  ];

  for (const [label, content] of paragraphs) {
    drawText(label, 14);
    for (const line of wrapText(content, 90)) drawText(line, 12);
    y -= 8;
    if (y < 200) { y = await addPage(pdf); }
  }

  // Photos grid (2 per row)
  for (let i=0; i<photoUrls.length; i++) {
    if (y < 260) { y = await addPage(pdf); }
    const url = photoUrls[i];
    try {
      const imgBytes = await fetch(url).then(r=>r.arrayBuffer());
      const img = await pdf.embedPng(imgBytes).catch(async ()=> pdf.embedJpg(imgBytes));
      const imgW = (width - margin*2 - 10) / 2;
      const imgH = 160;
      const col = i % 2;
      const x = margin + col * (imgW + 10);
      const yPos = y - imgH;
      page.drawImage(img, { x, y: yPos, width: imgW, height: imgH });
      if (col === 1) y -= imgH + 10;
    } catch {}
  }

  const bytes = await pdf.save();
  return new Uint8Array(bytes);
}

function wrapText(text:string, max:number){
  const words = (text || '').toString().split(/\s+/);
  const lines:string[] = [];
  let line:string[] = [];
  for (const w of words){
    const t = [...line, w].join(' ');
    if (t.length > max){ lines.push(line.join(' ')); line=[w]; } else { line.push(w); }
  }
  if (line.length) lines.push(line.join(' '));
  return lines;
}

async function addPage(pdf: PDFDocument){
  pdf.addPage([595.28, 841.89]);
  return 800; // reset y for new page
}
