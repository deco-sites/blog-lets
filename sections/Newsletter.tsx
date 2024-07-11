import type { AppContext } from "../apps/site.ts";
import { useComponent } from "./Component.tsx"
import type { AppContext as RecordsApp } from "site/apps/deco/records.ts";
import type { AppContext as ResendApp } from "apps/resend/mod.ts";
import { eq } from "std/semver/mod.ts";
import { newsletter } from "site/db/schema.ts";

export interface Props {
  /**
   * @format rich-text
   * @description The title of the section.
   */
  title?: string;
  /**
   * @format textarea
   * @description The description of the section.
   */
  description?: string;
  /**
   * @description Text shown on the button.
   */
  buttonText?: string;
  /**
   * @description Response of the form.
   */
  submissionResponse: { error?: string; email: string };
}

export async function action(
  props: Props,
  req: Request,
  ctx: AppContext & RecordsApp & ResendApp,
): Promise<Props> {
  const form = await req.formData();
  const email = `${form.get("email") ?? ""}`;

  if (!email) {
    return { ...props, submissionResponse: { email: "" } };
  }

  const drizzle = await ctx.invoke("records/loaders/drizzle.ts");

  try {
    const records = await drizzle
      .select({ email: newsletter.email })
      .from(newsletter)
      .where(eq(newsletter.email, email));
    if (records.length) {
      return {
        ...props,
        submissionResponse: { error: "Email already exists.", email },
      };
    }

    const confirmationKey = crypto.randomUUID();

    await drizzle.insert(newsletter).values({
      email,
      confirmed_at: null,
      confirmation_Key: confirmationKey,
    });

    await ctx.invoke("resend/actions/emails/send.ts", {
      subject: `Personal Blog - Confirm your subscription`,
      html: `<h1>Thanks for subscribing!</h1><br/><br/>Click <a href="https://blog.lucis.dev/confirm-newsletter?key=${confirmationKey}">here</a> to confirm your subscription.`, // mudar a href aquii
      to: email,
    })

  } catch (e) {
    console.log(e)
    ctx.monitoring?.logger?.error(e);
    return {
      ...props, submissionResponse: { error: "System error", email },
    };
  }
}

export function loader(props: Props) {
  return props;
}


export default function NewsletterSubscriber(props: Props) {
  const {
    title = "Subscribe to our Newsletter",
    description = "Stay up to date with our latest news and offers!",
    buttonText = "Subscribe",
    submissionResponse,
  } = props;

  return (
    <section class="hero min-h-screen">
      <div class="hero-content text-center text-neutral-content">
        <div class="max-w-md">
          <h1 class="mb-5 mt-10 text-5xl font-bold">{title}</h1>
          <p class="mb-5">{description}</p>
          <form
            class="form-control"
            hx-post={useComponent(import.meta.url, props)} //call to URL -- request
            hx-target="closest section"
            hx-swap="outerHTML"
          >
            <input
              type="email"
              value={submissionResponse?.email}
              placeholder="Email address"
              class="input input-bordered"
              name="email"
              required
            />
            <button class="btn btn-primary" type="submit">
              <span class="inline [.htmx-request_&]:hidden">{buttonText}</span>
              <span class="hidden [.htmx-request_&]:inline loading loading-spinner" />
            </button>
          </form>
        </div>
        {submissionResponse?.error && (
          <div role="alert" class="alert alert-warning">
            <span>{submissionResponse?.error}</span>
          </div>
        )}
        {submissionResponse && !submissionResponse.error && (
          <div role="alert" class="alert alert-success">
            <span>
              Thanks for subscribing! <br /> You will recieve{" "}
              <b class="font-bold">an e-mail of confirmation</b>.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}