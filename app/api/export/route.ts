import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Subscription } from "@/lib/validations";

// ---- CSV Export ----

function generateCSV(subscriptions: Subscription[]): string {
  const headers = [
    "Service",
    "Category",
    "Monthly Cost",
    "Annual Cost",
    "Billing Cycle",
    "Next Renewal",
    "Status",
    "Notes",
  ];

  const escapeCSV = (value: string | number | null | undefined): string => {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = subscriptions.map((sub) =>
    [
      sub.service,
      sub.category,
      sub.monthly_cost,
      sub.annual_cost,
      sub.billing_cycle,
      sub.next_renewal,
      sub.status,
      sub.notes,
    ]
      .map(escapeCSV)
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

// ---- PDF Export (simple text-based) ----

function generatePDF(subscriptions: Subscription[]): string {
  // Minimal valid PDF with subscription table
  const title = "Subblink Subscriptions Export";
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lines = [
    title,
    `Generated: ${date}`,
    "",
    "Service | Category | Monthly | Annual | Cycle | Renewal | Status",
    "-".repeat(80),
  ];

  for (const sub of subscriptions) {
    lines.push(
      `${sub.service} | ${sub.category ?? "-"} | $${sub.monthly_cost} | $${sub.annual_cost} | ${sub.billing_cycle} | ${sub.next_renewal ?? "-"} | ${sub.status}`,
    );
  }

  lines.push("", `Total subscriptions: ${subscriptions.length}`);

  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.monthly_cost, 0);
  const totalAnnual = subscriptions.reduce((sum, s) => sum + s.annual_cost, 0);
  lines.push(`Total monthly: $${totalMonthly.toFixed(2)}`);
  lines.push(`Total annual: $${totalAnnual.toFixed(2)}`);

  // Build a minimal PDF
  const content = lines.join("\n");
  const stream = buildMinimalPDF(content);
  return stream;
}

function buildMinimalPDF(text: string): string {
  // Escape special PDF characters in text
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

  const lines = escaped.split("\n");
  // Build text commands: place each line with Td offsets
  const textCommands = lines
    .map((line, i) => {
      if (i === 0) return `0 0 Td (${line}) Tj`;
      return `0 -14 Td (${line}) Tj`;
    })
    .join("\n");

  const streamContent = `BT /F1 10 Tf 50 750 Td\n${textCommands}\nET`;
  const streamLength = streamContent.length;

  const objects = [
    // Object 1: Catalog
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`,
    // Object 2: Pages
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`,
    // Object 3: Page
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`,
    // Object 4: Content Stream
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`,
    // Object 5: Font
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj`,
  ];

  let body = "";
  const offsets: number[] = [];
  const header = "%PDF-1.4\n";
  let pos = header.length;

  for (const obj of objects) {
    offsets.push(pos);
    const entry = obj + "\n";
    body += entry;
    pos += entry.length;
  }

  const xrefOffset = pos;
  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += `0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return header + body + xref + trailer;
}

// ---- QIF Export ----

function generateQIF(subscriptions: Subscription[]): string {
  const lines: string[] = ["!Type:Bank"];

  for (const sub of subscriptions) {
    // D = date (MM/DD/YYYY)
    const date = sub.next_renewal
      ? formatQIFDate(sub.next_renewal)
      : formatQIFDate(new Date().toISOString());
    lines.push(`D${date}`);

    // T = amount (negative for expenses)
    lines.push(`T-${sub.monthly_cost.toFixed(2)}`);

    // P = payee
    lines.push(`P${sub.service}`);

    // M = memo
    const memo = [
      sub.billing_cycle,
      sub.status,
      sub.notes,
    ]
      .filter(Boolean)
      .join(" | ");
    lines.push(`M${memo}`);

    // L = category
    if (sub.category) {
      lines.push(`L${sub.category}`);
    }

    // ^ = end of transaction
    lines.push("^");
  }

  return lines.join("\n");
}

function formatQIFDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

// ---- OFX Export (OFX 2.2 XML) ----

function generateOFX(subscriptions: Subscription[]): string {
  const now = new Date();
  const dtServer = formatOFXDateTime(now);
  const dtStart = formatOFXDateTime(
    new Date(now.getFullYear(), now.getMonth(), 1),
  );
  const dtEnd = formatOFXDateTime(now);

  const escapeXML = (str: string): string =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const transactions = subscriptions
    .map((sub, index) => {
      const dtPosted = sub.next_renewal
        ? formatOFXDateTime(new Date(sub.next_renewal))
        : dtServer;
      const fitId = `SUBBLINK${now.getFullYear()}${String(index + 1).padStart(6, "0")}`;
      const amount = (-sub.monthly_cost).toFixed(2);
      const memo = [sub.billing_cycle, sub.status, sub.category]
        .filter(Boolean)
        .join(" | ");

      return `          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>${dtPosted}</DTPOSTED>
            <TRNAMT>${amount}</TRNAMT>
            <FITID>${fitId}</FITID>
            <NAME>${escapeXML(sub.service)}</NAME>
            <MEMO>${escapeXML(memo)}</MEMO>
          </STMTTRN>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<?OFX OFXHEADER="200" VERSION="220" SECURITY="NONE" OLDFILEUID="NONE" NEWFILEUID="NONE"?>
<OFX>
  <SIGNONMSGSRSV1>
    <SONRS>
      <STATUS>
        <CODE>0</CODE>
        <SEVERITY>INFO</SEVERITY>
      </STATUS>
      <DTSERVER>${dtServer}</DTSERVER>
      <LANGUAGE>ENG</LANGUAGE>
    </SONRS>
  </SIGNONMSGSRSV1>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>0</TRNUID>
      <STATUS>
        <CODE>0</CODE>
        <SEVERITY>INFO</SEVERITY>
      </STATUS>
      <STMTRS>
        <CURDEF>USD</CURDEF>
        <BANKACCTFROM>
          <BANKID>000000000</BANKID>
          <ACCTID>SUBBLINK</ACCTID>
          <ACCTTYPE>CHECKING</ACCTTYPE>
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>${dtStart}</DTSTART>
          <DTEND>${dtEnd}</DTEND>
${transactions}
        </BANKTRANLIST>
        <LEDGERBAL>
          <BALAMT>0.00</BALAMT>
          <DTASOF>${dtServer}</DTASOF>
        </LEDGERBAL>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;
}

function formatOFXDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// ---- Route Handler ----

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "csv";
  const dateStr = new Date().toISOString().split("T")[0];

  // Fetch subscriptions
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("service");

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 },
    );
  }

  const subs = (subscriptions ?? []) as Subscription[];

  switch (format) {
    case "csv": {
      const csv = generateCSV(subs);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="subblink-subscriptions-${dateStr}.csv"`,
        },
      });
    }

    case "pdf": {
      const pdf = generatePDF(subs);
      return new NextResponse(pdf, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="subblink-subscriptions-${dateStr}.pdf"`,
        },
      });
    }

    case "qif": {
      const qif = generateQIF(subs);
      return new NextResponse(qif, {
        headers: {
          "Content-Type": "application/qif",
          "Content-Disposition": `attachment; filename="subblink-subscriptions-${dateStr}.qif"`,
        },
      });
    }

    case "ofx": {
      const ofx = generateOFX(subs);
      return new NextResponse(ofx, {
        headers: {
          "Content-Type": "application/x-ofx",
          "Content-Disposition": `attachment; filename="subblink-subscriptions-${dateStr}.ofx"`,
        },
      });
    }

    default:
      return NextResponse.json(
        { error: `Unsupported format: ${format}. Use csv, pdf, qif, or ofx.` },
        { status: 400 },
      );
  }
}
