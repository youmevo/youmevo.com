export default function Home() {
  return (
    <>
      {/* Video Background */}
      <video autoPlay muted loop playsInline className="back-video">
        <source src="/bg.mp4" type="video/mp4" />
        Your browser does not support HTML5 video.
      </video>

      {/* Overlay content */}
      <div className="overlay">
        {/* Main Content (Middle Left) */}
        <main className="hero-section">
          <h1>
            <span
              className="glitch-text"
              data-text="Let's"
              style={{ "--i": 1 } as React.CSSProperties}
            >
              Let's
            </span>
            {/* Added space manually since spans are inline-block but might need spacing if margin-right logic is strict, but CSS handles margin-right: 15px. */}
            <span
              className="glitch-text"
              data-text="share"
              style={{ "--i": 2 } as React.CSSProperties}
            >
              share
            </span>
            <span
              className="glitch-text"
              data-text="moment"
              style={{ "--i": 3 } as React.CSSProperties}
            >
              moment
            </span>
            <span
              className="glitch-text"
              data-text="together"
              style={{ "--i": 4 } as React.CSSProperties}
            >
              together
            </span>
          </h1>
        </main>

        {/* Footer / Download Links */}
        <footer className="footer-container">
          <div className="app-downloads">
            <a href="#" className="store-badge apple">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                alt="Download on the App Store"
              />
            </a>
            <a href="#" className="store-badge google">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Get it on Google Play"
              />
            </a>
          </div>
          <p className="copyright">© youmevo 2026</p>
        </footer>
      </div>
    </>
  );
}
