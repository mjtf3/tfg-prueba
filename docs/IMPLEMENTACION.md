# Plan de implementación — Aplicación de trazabilidad (Agropaco S.L.)

> Documento de trabajo. Recoge el plan de implementación acordado para construir la capa de
> dominio de la aplicación sobre el andamiaje ya existente. Se desarrolla **por sprints**,
> con revisión entre cada iteración.

## Contexto

La memoria del TFG describe una aplicación web de gestión de la trazabilidad para una
comercializadora hortofrutícola ("Agropaco S.L."). Este repo ya contiene el andamiaje
correspondiente a los Sprints 1–2:

- Nuxt 4 + Vue 3 + Nitro, Tailwind v4 + daisyUI v5, pnpm.
- Drizzle ORM sobre PostgreSQL (`pg`), `docker-compose.yml` con `postgres:17` (BD `agricola`).
- better-auth (email/password + GitHub + Google) con campo `role` (`oficina`/`operario`,
  `input:false`), middleware global de autenticación y shell de dashboard.
- `server/database/schemas/trazabilidad-schema.ts`: el modelo de datos del dominio, que
  coincide con la memoria (catálogos, `recoleccion`, `pale`, `lote`, `caja`, `venta`, puentes
  `lote_recoleccion` y `caja_recoleccion`).

Objetivo: cubrir **RF-01…RF-12** y **RNF-01…RNF-06**.

## Decisiones

- **Ritmo**: por sprints (3→7), con parada para revisión entre cada iteración.
- **QR**: escaneo con `qr-scanner` (Nimiq, ligero — RNF-02); generación con `qrcode`.
- **Persistencia del esquema**: `pnpm drizzle:push` (sin carpeta `drizzle/`).
- **Seed**: catálogos de ejemplo + usuario `oficina` inicial (bootstrap del rol).

## Convenciones

- Prettier: sin punto y coma, comillas simples, `printWidth 120`, `tabWidth 2`.
- Lint: `oxlint` (`pnpm lint` / `pnpm lint:fix`).
- Drizzle: `integer(...).primaryKey().generatedAlwaysAsIdentity()`, índices en FKs,
  `relations(...)` para consultas relacionales.
- Auth cliente: `useAuth()`; gating de rutas con `definePageMeta({ auth: ... })`.
- UI mobile-first (RNF-01) con daisyUI. Rutas `/dashboard/**` usan el layout `dashboard`.

---

## Sprint 3 — Modelo de datos en BD + seed + autorización

- `docker compose up -d database` + `pnpm drizzle:push`.
- `server/database/seed.ts` + script `db:seed`: catálogos de ejemplo + usuario `oficina`
  de desarrollo (`oficina@agropaco.local` / `agropaco123`). Las credenciales se pueden
  sobrescribir con `SEED_OFICINA_EMAIL` / `SEED_OFICINA_PASSWORD` / `SEED_OFICINA_NAME`.
- `server/utils/require-auth.ts`: `requireUser` (401) y `requireRole(...)` (403).
- Exponer `role` en cliente (`useAuth`).
- Sidebar por rol.

RF: base de RF-08/09/10; RNF-06.

## Sprint 4 — Registro de recolecciones + generación de QR

- API catálogos (lectura) y API recolecciones (alta con `codigo_trazabilidad` + palés/QR,
  validación propio/comprado, totales).
- `server/utils/qr.ts` (data-URL con `qrcode`).
- UI `/dashboard/recolecciones` (lista, alta, detalle con QR imprimibles).

RF: RF-01, RF-02, RF-07, RF-11 (parcial), RF-09.

## Sprint 5 — Escaneo de QR + modo consecutivo

- `app/composables/useQrScanner.ts` (`qr-scanner`, cámara trasera).
- API lookup de palé por QR + patch de conteo de cajas (acumulados).
- UI `/dashboard/escaneo` (operario, mobile-first, modo consecutivo).

RF: RF-03, RF-04, RF-10, RF-11; RNF-01, RNF-02.

## Sprint 6 — Lotes, cajas y ventas

- API lotes (N:M `lote_recoleccion`, mismo producto/categoría), cajas (máx. 2 recolecciones),
  ventas (`total = kilos * precioVenta`).
- UI `/dashboard/lotes` y `/dashboard/ventas` (oficina).

RF: RF-05, RF-06, RF-11; RNF-05.

## Sprint 7 — Consulta de trazabilidad + informes

- API trazabilidad por QR (cadena palé → recolección → lotes → ventas).
- UI `/dashboard/trazabilidad` (escaneo o entrada manual del QR).
- Informes básicos (oficina).

RF: RF-12, RF-09.

---

## Verificación global

1. `docker compose up -d database` + `pnpm drizzle:push` + `pnpm db:seed`.
2. `pnpm dev` y flujo end-to-end: alta de recolección → QR → escaneo/conteo → lote/venta →
   consulta de trazabilidad.
3. `pnpm lint` y `pnpm build` limpios.
4. Rutas de API protegidas devuelven 401/403 según rol.
5. Revisión mobile-first de las vistas de operario.

## Notas / riesgos

- Si la memoria exige migraciones versionadas, generar `drizzle/` con `drizzle-kit generate`
  al cierre (no bloqueante).
- Formato de `codigo_trazabilidad` / contenido del QR: se fija en el Sprint 4.
- Confirmar que better-auth infiere `role` en cliente; si no, añadir `inferAdditionalFields`.
- El repo no tiene framework de test; añadir Vitest sería una iteración aparte.
