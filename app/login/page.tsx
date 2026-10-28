import Link from "next/link";
import Image from "next/image";
import { Chrome, ShieldCheck } from "lucide-react";
import { signIn } from "@/auth";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

function safeRedirect(callbackUrl?: string) {
  return callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
    ? callbackUrl
    : "/app";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;
  const redirectTo = safeRedirect(callbackUrl);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/50">
        <Link href="/">
          <Image
            src="/11i-maps-logo.png"
            width={92}
            height={40}
            alt="11i Maps"
            className="h-10 w-auto"
          />
        </Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">
          Sign in to 11i Maps
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Access your organisation, locations, audits and optimisation work.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo });
          }}
        >
          <button
            type="submit"
            className="mt-7 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            <Chrome className="h-4 w-4" /> Continue with Google
          </button>
        </form>

        <form
          action={async () => {
            "use server";
            await signIn("azure-ad", { redirectTo });
          }}
        >
          <button
            type="submit"
            className="mt-3 flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            <span className="grid grid-cols-2 gap-px" aria-hidden="true">
              <i className="h-1.5 w-1.5 bg-[#f25022]" />
              <i className="h-1.5 w-1.5 bg-[#7fba00]" />
              <i className="h-1.5 w-1.5 bg-[#00a4ef]" />
              <i className="h-1.5 w-1.5 bg-[#ffb900]" />
            </span>
            Continue with Microsoft
          </button>
        </form>

        <p className="mt-7 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          Sign-in asks only for identity scopes. Business Profile access is
          requested separately when an approved connector is configured.
        </p>
      </section>
    </main>
  );
}
