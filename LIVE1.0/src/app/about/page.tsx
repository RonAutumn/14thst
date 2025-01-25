export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 mt-8">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">About Us</h1>
        <div className="space-y-8">
          <section>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Welcome to <span className="font-semibold text-primary">HeavenHighNyc</span>, where we focus on providing high-quality products and exclusive offerings to our loyal customers. Our goal is to create an unparalleled experience that prioritizes quality, discretion, and efficiency.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">How Payments Work</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              To ensure seamless and secure transactions, all payments are processed through <span className="font-semibold text-primary">StickiTrips</span>, our official merch site. When you proceed to checkout, you will be redirected to StickiTrips' secure payment portal to complete your purchase.
            </p>
            
            <div className="mt-4 bg-amber-50 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
              <p className="text-amber-800 dark:text-amber-200">
                🔔 <strong>Important:</strong> Your billing statement will reflect a charge from <span className="font-semibold">StickiTrips</span>. This is normal and part of our standard checkout process.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">No Refunds or Exchanges</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              All sales are <span className="font-semibold text-primary">final</span>. We do not offer refunds, returns, or exchanges under any circumstances. Please ensure your order is correct before completing your purchase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-2">If you have any questions about your order or the payment process, feel free to contact us at:</p>
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                📧 Email: <a href="mailto:issues@heavenhighnyc.com" className="text-primary hover:underline">issues@heavenhighnyc.com</a>
              </p>
              <p className="text-gray-700 dark:text-gray-300">📞 Phone: (718) 306-9021 (Text Only)</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3 text-gray-800 dark:text-gray-100">Issues with Your Order?</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              If you experience any issues with your order, please reach out to us as soon as possible. While we do not offer refunds or exchanges, we are happy to assist with any concerns regarding order fulfillment, shipping, or other inquiries.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
} 