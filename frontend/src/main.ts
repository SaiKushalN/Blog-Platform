import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => {
    console.error('Error starting application:', err);
    
    // Show user-friendly error message
    const appRoot = document.querySelector('app-root');
    if (appRoot) {
      appRoot.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-family: 'Roboto', sans-serif;
          text-align: center;
          padding: 20px;
        ">
          <h1 style="color: #f44336; margin-bottom: 20px;">
            Application Error
          </h1>
          <p style="color: #666; margin-bottom: 20px;">
            Sorry, something went wrong while starting the application.
          </p>
          <button onclick="window.location.reload()" style="
            background: #3f51b5;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          ">
            Reload Page
          </button>
        </div>
      `;
    }
  });
