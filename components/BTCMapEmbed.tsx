export default function BTCMapEmbed() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            The BTC Map
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            BTC Map is a free, open map showing where you can spend Bitcoin in
            the real world. Built on open data that anyone can access and use,
            it helps customers discover Bitcoin-friendly businesses and makes it
            easy for businesses like yours to be found. When you list your
            business, you&apos;re joining a global community committed to
            transparency and open information.
          </p>
        </div>
        
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            id="btcmap"
            title="BTC Map"
            className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
            allowFullScreen={true}
            allow="geolocation"
            src="https://btcmap.org/map#16/-37.79677/144.99403"
          />
        </div>
      </div>
    </section>
  );
}
