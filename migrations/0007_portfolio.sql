-- Portfolio projects shown on /portfolio and /portfolio/<slug>
-- Run with: npx wrangler d1 execute linktree-db --local --file=./migrations/0007_portfolio.sql
-- Text fields come in pairs (_en / _es). body_* uses blank lines between paragraphs
-- and "- " at the start of a line for list items.

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  year TEXT DEFAULT NULL,
  kind_en TEXT NOT NULL DEFAULT '',
  kind_es TEXT NOT NULL DEFAULT '',
  summary_en TEXT NOT NULL DEFAULT '',
  summary_es TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  body_es TEXT NOT NULL DEFAULT '',
  stack TEXT NOT NULL DEFAULT '',
  image_url TEXT DEFAULT NULL,
  site_url TEXT DEFAULT NULL,
  repo_url TEXT DEFAULT NULL,
  is_visible INTEGER NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_display_order ON projects(display_order);

INSERT OR IGNORE INTO projects
  (slug, name, year, kind_en, kind_es, summary_en, summary_es, body_en, body_es, stack, site_url, repo_url, display_order)
VALUES
(
  'matilist', 'Matilist', '2026',
  'Personal app', 'App personal',
  'A task manager for Android, Windows and the web that syncs across devices and keeps working offline.',
  'Una app de tareas para Android, Windows y la web que se sincroniza entre dispositivos y funciona sin conexión.',
  'A task manager inspired by Todoist that I use every day. One TypeScript monorepo ships the Android app, the Windows desktop app and the web app, all synced through Firestore.

- Projects, sections, subtasks and labels, with priorities and manual order.
- Natural-language entry: "Pay the power bill tomorrow 6pm p1 #Home" sets the date, time, priority and project.
- Recurring tasks with a history of what was completed.
- Several reminders per task; on Android they can ring as a full-screen alarm.
- Rich notes with folders, sharing the same labels as tasks.
- Android widgets and quick capture from the share menu.
- Offline first: create and complete tasks without a connection; changes sync when it returns.
- Guest mode without an account, plus full JSON export and import.',
  'Una app de tareas inspirada en Todoist que uso todos los días. Un único monorepo en TypeScript genera la app de Android, la de escritorio para Windows y la web, todas sincronizadas con Firestore.

- Proyectos, secciones, subtareas y etiquetas, con prioridades y orden manual.
- Carga en lenguaje natural: "Pagar la luz mañana 18hs p1 #Casa" define fecha, hora, prioridad y proyecto.
- Tareas que se repiten, con historial de lo completado.
- Varios recordatorios por tarea; en Android pueden sonar como alarma de pantalla completa.
- Notas con formato y carpetas, con las mismas etiquetas que las tareas.
- Widgets de Android y captura rápida desde el menú compartir.
- Sin conexión: creás y completás tareas sin red y todo se sincroniza al volver.
- Modo invitado sin cuenta, y exportación e importación completa en JSON.',
  'TypeScript, React Native, Expo, Tauri, Firebase',
  'https://matilist.web.app', 'https://github.com/MatiasTK/matilist', 0
),
(
  'wizapp', 'WizAPP', '2023',
  'Desktop app', 'App de escritorio',
  'A desktop app to discover and control WiZ smart bulbs from your computer.',
  'Una app de escritorio para encontrar y controlar lámparas inteligentes WiZ desde la computadora.',
  'WiZ bulbs only come with a phone app, so I built one for the desktop. It finds the bulbs on the local network and controls them directly.

- Automatic bulb discovery and support for several bulbs.
- On/off, brightness, scenes and custom scene colours.
- Update notifications, Spanish and English, and minimise to tray.
- Released as installable builds on GitHub.',
  'Las lámparas WiZ sólo traen app para el celular, así que hice una para la computadora. Encuentra las lámparas en la red local y las controla directamente.

- Detección automática de lámparas y soporte para varias.
- Encendido y apagado, brillo, escenas y colores de escena personalizados.
- Aviso de actualizaciones, español e inglés, y minimizar a la bandeja.
- Publicada con instaladores en GitHub.',
  'TypeScript, Electron, React, Tailwind CSS, Zustand',
  'https://github.com/MatiasTK/WizAPP/releases/latest', 'https://github.com/MatiasTK/WizAPP', 1
),
(
  'dividimos-cuentas', 'Dividimos Cuentas', '2024',
  'Web app', 'App web',
  'A web app to split a bill among friends, with equal, proportional or fixed shares.',
  'Una app web para dividir una cuenta entre amigos, en partes iguales, proporcionales o fijas.',
  'Splitting a dinner bill gets messy when not everyone had the same things. Dividimos Cuentas handles several items and several people at once.

- Bills with several items and several members.
- Equal, proportional or fixed shares.
- A history of past events.
- Light and dark mode, and a responsive layout.',
  'Dividir la cuenta de una cena se complica cuando no todos consumieron lo mismo. Dividimos Cuentas maneja varios ítems y varias personas a la vez.

- Cuentas con varios ítems y varios integrantes.
- División en partes iguales, proporcionales o fijas.
- Historial de eventos.
- Modo claro y oscuro, y diseño responsivo.',
  'TypeScript, React, Vite, Chakra UI, React Hook Form, Zod',
  'https://cuentas.mvjs.me/', 'https://github.com/MatiasTK/dividimos-cuentas', 2
),
(
  'wordle-es', 'WordleES', '2022',
  'Web game', 'Juego web',
  'Wordle in Spanish, with its own word API.',
  'Wordle en español, con su propia API de palabras.',
  'A recreation of Wordle in Spanish, built with React and TypeScript. The words come from WordleES-API, a separate TypeScript service I wrote for it.',
  'Una recreación de Wordle en español, hecha con React y TypeScript. Las palabras salen de WordleES-API, un servicio aparte en TypeScript que escribí para el juego.',
  'TypeScript, React, Node.js',
  'http://wordle.mvjs.me/', 'https://github.com/MatiasTK/WordleES', 3
);
