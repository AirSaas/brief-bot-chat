interface HomePageProps {
  onStartChat: () => void;
}

export default function HomePage({ onStartChat }: HomePageProps) {

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-brand-50 to-brand-100 flex flex-col">

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-16 relative">
            {/* Background Logo - Decorative */}
            <div className="absolute -right-60 top-20 opacity-10 blur-sm pointer-events-none">
              <div className="w-96 h-96 flex items-center justify-center">
                <img
                  src="https://cdn.prod.website-files.com/609552290d93fd43ba0f0849/65ba002d83b7017b6891e776_AirSaas-logo%20300x300.svg"
                  alt="AirSaas"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <h1
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
              style={{ fontFamily: "Google Sans, system-ui, sans-serif" }}
            >
              Vous avez une fiche projet à faire ?
            </h1>
            <h2
              className="text-3xl md:text-4xl font-medium text-brand-600 mb-8 leading-tight"
              style={{ fontFamily: "Google Sans, system-ui, sans-serif" }}
            >
              Laissez notre assistant IA vous aider
            </h2>

            <p
              className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed"
              style={{ fontFamily: "Google Sans, system-ui, sans-serif" }}
            >
              Brief Project transforme vos notes et échanges en une fiche projet
              claire, structurée et prête à partager en quelques secondes.
            </p>

            {/* CTA Button */}
            <button
              onClick={onStartChat}
              className="group inline-flex items-center gap-3 bg-brand-500 hover:bg-brand-600 text-white px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden"
              style={{
                fontFamily: "Google Sans, system-ui, sans-serif",
                color: "#FFFFFF",
                fontWeight: "500",
                background: "linear-gradient(135deg, #3C51E2 0%, #3041B5 100%)",
                boxShadow: "0 10px 25px rgba(60, 81, 226, 0.4), 0 4px 12px rgba(60, 81, 226, 0.2)",
              }}
            >
              {/* Rainbow Shine effect */}
              <div className="absolute inset-0 -top-2 -left-2 w-full h-full bg-gradient-to-r from-transparent via-cyan-300/40 via-yellow-300/40 via-pink-300/40 to-transparent opacity-40 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1200"></div>
              
              {/* Multi-color Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/30 via-purple-400/40 via-pink-400/30 to-yellow-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-400 blur-sm"></div>
              
              {/* Colorful Sparkles */}
              <div className="absolute top-2 right-4 w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full opacity-0 group-hover:opacity-90 transition-all duration-300 animate-pulse shadow-lg shadow-cyan-400/50"></div>
              <div className="absolute bottom-3 left-6 w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-80 transition-all duration-500 animate-pulse shadow-lg shadow-pink-400/50"></div>
              <div className="absolute top-4 left-3 w-1.5 h-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-70 transition-all duration-700 animate-pulse shadow-lg shadow-yellow-400/50"></div>
              <div className="absolute bottom-2 right-8 w-2.5 h-2.5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-0 group-hover:opacity-85 transition-all duration-400 animate-pulse shadow-lg shadow-green-400/50"></div>
              
              {/* Floating particles */}
              <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-gradient-to-r from-violet-400 to-indigo-400 rounded-full opacity-0 group-hover:opacity-60 transition-all duration-600 animate-bounce"></div>
              <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-gradient-to-r from-rose-400 to-red-400 rounded-full opacity-0 group-hover:opacity-70 transition-all duration-800 animate-bounce"></div>
              
              <span>👉</span>
              <span className="relative z-10 text-white">
                Tester Notre Assistant IA Brief Project gratuitement
              </span>
            </button>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-white/50">
              <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-8 h-8 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3
                className="text-xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "Google Sans, system-ui, sans-serif" }}
              >
                Se poser les bonnes questions
              </h3>
              <p
                className="text-gray-600 leading-relaxed"
                style={{ fontFamily: "Google Sans, system-ui, sans-serif" }}
              >
                Notre IA vous guide pour cadrer objectifs, risques, livrables et
                parties prenantes.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-white/50">
              <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-8 h-8 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3
                className="text-xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "Google Sans, system-ui, sans-serif" }}
              >
                Gain de temps
              </h3>
              <p
                className="text-gray-600 leading-relaxed"
                style={{ fontFamily: "Google Sans, system-ui, sans-serif" }}
              >
                Finis les allers-retours et les fiches rédigées à la dernière
                minute.
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 border border-white/50">
              <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <svg
                  className="w-8 h-8 text-brand-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h3
                className="text-xl font-bold text-gray-900 mb-4"
                style={{ fontFamily: "Google Sans, system-ui, sans-serif" }}
              >
                Résultat de niveau professionnel
              </h3>
              <p
                className="text-gray-600 leading-relaxed"
                style={{ fontFamily: "Google Sans, system-ui, sans-serif" }}
              >
                Une fiche claire, homogène et directement exploitable par vos
                équipes.
              </p>
            </div>
          </div>

          {/* Additional CTA */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-3xl p-8 text-white">
            <h3
              className="text-2xl font-bold mb-4 text-gray-900"
              style={{ fontFamily: "Google Sans, system-ui, sans-serif" }}
            >
              Prêt à créer votre fiche projet parfaite ?
            </h3>
            <p
              className="text-brand-100 text-gray-900 mb-4"
              style={{ fontFamily: "Google Sans, system-ui, sans-serif" }}
            >
              Commencez votre conversation avec notre assistant IA maintenant et
              découvrez la puissance de la création automatisée de fiches
              projet.
            </p>

            {/* AirSaas AI Logo */}
            <div className="flex justify-center">
              <div className="flex items-center justify-center">
                <img
                  src="/airsaas-ai-logo.svg"
                  alt="AirSaas AI Logo"
                  width={260}
                  height={260}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-8"
        style={{
          backgroundColor: "#6b7be9",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p
            className="text-white text-sm"
            style={{ fontFamily: "Google Sans, system-ui, sans-serif" }}
          >
            © {new Date().getFullYear()} AirSaas. Made with Love in France 🇫🇷
          </p>
        </div>
      </footer>
    </div>
  );
}
