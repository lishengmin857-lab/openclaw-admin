import { exportLicenses, type LicenseExportScope } from "@/lib/licenses";

function getScope(raw: string | null): LicenseExportScope {
  if (raw === "available" || raw === "activated" || raw === "all") {
    return raw;
  }

  return "active";
}

function buildFilename(format: string, scope: LicenseExportScope) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `openclaw-licenses-${scope}-${stamp}.${format}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "env").toLowerCase();
  const scope = getScope(searchParams.get("scope"));
  const exported = await exportLicenses(scope);

  if (format === "json") {
    return new Response(exported.jsonText, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${buildFilename("json", scope)}"`,
      },
    });
  }

  if (format === "txt") {
    return new Response(exported.txtText, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${buildFilename("txt", scope)}"`,
      },
    });
  }

  return new Response(exported.envText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildFilename("env", scope)}"`,
    },
  });
}
