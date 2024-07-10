import { AppContext } from "../apps/site.ts";
import type { AppContext as RecordsApp } from "site/apps/deco/records.ts";
import { eq } from "drizzle-orm";
import { newsletter } from "../db/schema.ts";


export interface Props {
  really?: boolean;
  error?: string;
}

export const loader = async (
  props: Props,
  req: Request,
  ctx: AppContext & RecordsApp
) => {
  const url = new URL(req.url);

  const reallyQs = url.searchParams.get("really");

  if (!reallyQs) {
    return props;
  }

  const confirmationKey = url.searchParams.get("key");

  if (!confirmationKey) {
    return { ...props, error: "No key confirmation." };
  }

  const drizzle = await ctx.invoke("records/loaders/drizzle.ts");

  await drizzle
    .update(newsletter)
    .set({
      confirmed_at: new Date().toISOString(),
      confirmation_key: null,
    })
    .where(eq(newsletter.confirmation_key, confirmationKey ?? ""));

  return { ...props, really: true };
};

export default function ConfirmEmail(props: Props) {
  return (
    <div>
      {/* To avoid confirmation by non-browser reqs (ex: preview, email anti-spam...) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
          if (!window.location.search.includes('really')) {
            window.location.href = window.location.href + '&really=true'; 
          }`,
        }}
      />
      {props.really && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <h1 className="text-4xl font-bold mb-4">Subscription confirmed!</h1>
            <p className="text-lg mb-8">
              Thanks again for your subscription.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}