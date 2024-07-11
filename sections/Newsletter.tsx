import type { AppContext } from "../apps/site.ts";
import { useComponent } from "./Component.tsx"
import type { AppContext as RecordsApp } from "site/apps/deco/records.ts";
import type { AppContext as ResendApp } from "apps/resend/mod.ts";
import { eq } from "std/semver/mod.ts";
import { newsletter } from "site/db/schema.ts";

// Interface que define as propriedades aceitas pelo componente
export interface Props {
  /**
   * @format rich-text
   * @description O título da seção.
   */
  title?: string;
  /**
   * @format textarea
   * @description A descrição da seção.
   */
  description?: string;
  /**
   * @description Texto exibido no botão.
   */
  buttonText?: string;
  /**
   * @description Resposta do formulário.
   */
  submissionResponse: { error?: string; email: string };
}

// Função assíncrona que trata a submissão do formulário
export async function action(
  props: Props,
  req: Request,
  ctx: AppContext & RecordsApp & ResendApp,
): Promise<Props> {
  // Obtém os dados do formulário
  const form = await req.formData();
  const email = `${form.get("email") ?? ""}`;

  // Verifica se o email está vazio
  if (!email) {
    console.log("Email is empty");
    return { ...props, submissionResponse: { email: "" } };
  }

  // Carrega o drizzle para interagir com o banco de dados
  const drizzle = await ctx.invoke("records/loaders/drizzle.ts");

  try {
    // Verifica se o email já está registrado no banco de dados
    console.log("Checking if email already exists in the database");
    const records = await drizzle
      .select({ email: newsletter.email })
      .from(newsletter)
      .where(newsletter.email === email);
    if (records.length) {
      console.log("Email already exists");
      return {
        ...props,
        submissionResponse: { error: "Email already exists.", email },
      };
    }

    // Gera uma chave de confirmação única
    const confirmationKey = crypto.randomUUID();
    console.log(`Generated confirmation key: ${confirmationKey}`);

    // Insere o novo registro de newsletter no banco de dados
    console.log("Inserting new email into the database");
    await drizzle.insert(newsletter).values({
      email,
      confirmed_at: null,
      confirmation_Key: confirmationKey,
    });

    // Envia email de confirmação para o usuário
    console.log(`Sending confirmation email to: ${email}`);
    await ctx.invoke("resend/actions/emails/send.ts", {
      subject: `Personal Blog - Confirm your subscription`,
      html: `<h1>Thanks for subscribing!</h1><br/><br/>Click <a href="https://sites-blog-lets--leticia.decocdn.com/confirm-newsletter?key=${confirmationKey}">here</a> to confirm your subscription.`,
      to: email,
    });

  } catch (e) {
    console.log("An error occurred:", e);
    ctx.monitoring?.logger?.error(e);
    return {
      ...props, submissionResponse: { error: "System error", email },
    };
  }

  // Retorna as propriedades caso não haja erros
  return props;
}

// Função que retorna as propriedades do componente
export function loader(props: Props) {
  return props;
}

// Componente funcional que renderiza o formulário de inscrição na newsletter
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
            // Configura a requisição HTMX para enviar o formulário para o servidor
            hx-post={useComponent(import.meta.url, props)} // URL para onde a requisição será enviada
            hx-target="closest section" // Elemento alvo que será atualizado com a resposta do servidor
            hx-swap="outerHTML" // Modo de substituição do conteúdo do alvo
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
          <div role="alert" class="alert alert-warning mt-10">
            <span>{submissionResponse?.error}</span>
          </div>
        )}
        {submissionResponse && !submissionResponse.error && (
          <div role="alert" class="alert alert-success mt-10">
            <span>
              Thanks for subscribing! <br /> You will receive{" "}
              <b class="font-bold">an e-mail of confirmation</b>.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
