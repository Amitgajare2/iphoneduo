import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import IPhoneDuoViewer from './IPhoneDuoViewer';
import InstallGuide from './InstallGuide.jsx';
import './IPhoneDuoViewer.css';
import './app.css';

const artwork = {
  closed: './assets/ui/wallpaper-closed.avif',
  open: './assets/ui/wallpaper-open.avif',
};

const TITLES = {
  install: 'Install · iPhone Duo',
  preview: 'iPhone Duo · Fold Preview',
};

function readRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const route = hash.split(/[/?]/)[0];
  return route === 'install' || route === 'docs' ? 'install' : 'preview';
}

function useRoute() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  useEffect(() => {
    const docs = route === 'install';
    document.documentElement.classList.toggle('is-docs', docs);
    document.title = TITLES[route];
    if (docs) window.scrollTo(0, 0);
  }, [route]);

  return route;
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943" />
    </svg>
  );
}

function Preview() {
  return (
    <main className="idv-demo">
      <IPhoneDuoViewer
        assetsBase="./assets"
        defaultOpen
        closedImage={artwork.closed}
        openImage={artwork.open}
      />
      <a className="idv-demo-brand" href="#/install">
        <img src="./assets/iphone-duo-icon.svg" alt="" aria-hidden="true" />
        iPhone Duo
      </a>
      <nav className="idv-demo-nav" aria-label="Site">
        <a className="idv-demo-install" href="#/install">
          Install
          <span aria-hidden="true">→</span>
        </a>
        <a
          className="idv-demo-link"
          href="https://github.com/Amitgajare2/iphoneduo"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View project on GitHub"
          title="GitHub"
        >
          <GithubIcon />
        </a>
      </nav>
    </main>
  );
}

function App() {
  return useRoute() === 'install' ? <InstallGuide /> : <Preview />;
}

createRoot(document.getElementById('root')).render(<App />);
