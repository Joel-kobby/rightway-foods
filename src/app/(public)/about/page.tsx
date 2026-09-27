import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — RightWay Foods",
  description: "Learn about RightWay Foods — premium Ghanaian food products rooted in culture.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">About RightWay Foods</h1>
      <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
        <p>
          RightWay Foods is a Ghanaian food company dedicated to bringing quality, natural food products to homes and businesses across Ghana. We are rooted in Ghanaian food culture — products that generations of Ghanaian families have trusted.
        </p>
        <p>
          We source and supply premium palm oil, coconut oil, and fresh eggs. Every product we offer meets our strict quality standards — pure, natural, and free of unnecessary additives.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8">Our Mission</h2>
        <p>
          To make premium, natural Ghanaian food products accessible to every household and business across the country — with reliable delivery and honest pricing.
        </p>
        <h2 className="text-2xl font-bold text-gray-900 mt-8">Wholesale & Bulk Orders</h2>
        <p>
          We supply shops, restaurants, caterers, and corporate clients at competitive wholesale prices. Contact us to discuss your requirements.
        </p>
      </div>
    </div>
  );
}
