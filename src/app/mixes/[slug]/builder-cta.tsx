"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BuilderState = { readonly href: string | null; readonly checked: boolean };

export default function BuilderCta({ slug }: { readonly slug: string }) {
  const [state, setState] = useState<BuilderState>({ href: null, checked: false });

  useEffect(() => {
    let active = true;
    fetch(`/api/mixes/${encodeURIComponent(slug)}/builder`)
      .then(async (response): Promise<{ status: string; href?: string }> => response.ok
        ? response.json() as Promise<{ status: string; href?: string }>
        : { status: "UNAVAILABLE" })
      .then(result => { if (active) setState({ href: result.status === "READY" && typeof result.href === "string" ? result.href : null, checked: true }); })
      .catch(() => { if (active) setState({ href: null, checked: true }); });
    return () => { active = false; };
  }, [slug]);

  return <>
    <Link className="btn btn-primary" href={state.href ?? "/builder"}>Открыть в конструкторе</Link>
    {state.checked && !state.href && <p className="muted builder-availability">Не все компоненты этого рецепта пока доступны в конструкторе.</p>}
  </>;
}
