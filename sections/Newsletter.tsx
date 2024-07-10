
interface Props {
  /**
   * @format rich-text
   */
  title?: string;
  /**
   * @format textarea
   */
  description?: string;
  /**
   * @format color-input
   */
  textColor?: string;
  /**
   * @format color-input
   */
  buttonColor?: string;
  /**
   * @format color-input
   */
  buttonTextColor?: string;
}

export default function NewsletterSubscription({
  title = "Subscribe to Our Newsletter",
  description = "Stay up-to-date with our latest news, promotions, and exclusive content.",
  textColor = "#333333",
}: Props) {
  return (
    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-2xl font-bold mb-4" style={{ color: textColor }}>
        {title}
      </h2>
      <p class="mb-6" style={{ color: textColor }}>
        {description}
      </p>
      <div class="flex">
        <input
          type="email"
          placeholder="Enter your email"
          class="flex-grow mr-2 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          class="btn btn-primary"
          type="submit"
        >
          <span class="inline [.htmx-request_&]:hidden">Subscribe</span>
          <span class="hidden [.htmx-request_&]:inline loading loading-spinner" /> 
        </button>
      </div>
    </div>
  );
}