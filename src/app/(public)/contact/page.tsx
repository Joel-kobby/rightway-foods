import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — RightWay Foods",
  description: "Get in touch with RightWay Foods for orders, wholesale inquiries, or support.",
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
      <p className="text-gray-500 mb-10">We would love to hear from you. Reach out for orders, wholesale inquiries, or any questions.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div className="bg-[hsl(45,30%,96%)] rounded-2xl p-6">
            <h2 className="font-bold text-gray-900 mb-4">Get In Touch</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <span className="text-xl">📞</span>
                <div>
                  <p className="font-medium">Phone</p>
                  <p>+233 XX XXX XXXX</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">✉️</span>
                <div>
                  <p className="font-medium">Email</p>
                  <p>derightwayfoods@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">📍</span>
                <div>
                  <p className="font-medium">Location</p>
                  <p>Accra, Ghana</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">🕐</span>
                <div>
                  <p className="font-medium">Business Hours</p>
                  <p>Mon – Fri: 8am – 6pm</p>
                  <p>Sat: 9am – 4pm</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[hsl(142,71%,18%)] text-white rounded-2xl p-6">
            <h2 className="font-bold mb-2">Wholesale Inquiries</h2>
            <p className="text-white/70 text-sm">
              Are you a shop, restaurant, or business looking to buy in bulk? Call or email us directly for special wholesale pricing.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">Send a Message</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(142,71%,25%)]" placeholder="Kwame Mensah" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone / Email</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(142,71%,25%)]" placeholder="0244 000 000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(142,71%,25%)]" placeholder="How can we help you?" />
            </div>
            <button type="submit" className="w-full bg-[hsl(142,71%,25%)] text-white font-semibold py-3 rounded-lg hover:opacity-90 transition">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
