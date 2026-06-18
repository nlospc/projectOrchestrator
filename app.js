import { bootstrap } from "./src/core/data-store.js";
import { initApp } from "./src/ui/shell.js";

bootstrap()
  .then(() => initApp())
  .catch((err) => {
    document.body.innerHTML = `<div style="padding:2rem;font-family:sans-serif;color:#c00">
      <h2>启动失败</h2><pre>${err.message}</pre>
    </div>`;
  });
