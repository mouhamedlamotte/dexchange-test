# ✅ Test Backend DEXCHANGE – NestJS

## **Objectif**

Construire une mini-API de gestion de **transferts** avec :

* Auth **API Key**
* Règles métier (frais & états)
* Simulation de traitement
* CRUD partiel avec transitions d’état contrôlées
* Pagination & filtres
* Logs d’audit
* Swagger + 1–2 tests unitaires

**Durée cible :** 6–8h

**Stack:** NestJS + TypeScript + MongoDB/Postgres (ou in-memory si justifié)

---

### ✅ Fonctionnalités à développer

### 1) Auth par API Key

* Header obligatoire : `x-api-key: <clé>`
* Middleware/Guard
* Clé stockée en DB ou en variable (in-memory OK pour test)
* Rejets :
  * Pas de clé → 401
  * Clé invalide → 403

---

### 2) Création d’un transfert

`POST /transfers`

Body :

```json
{
  "amount": 12500,
  "currency": "XOF",
  "channel": "WAVE",
  "recipient": { "phone": "+221770000000", "name": "Jane Doe" },
  "metadata": { "orderId": "ABC-123" }
}

```

Règles métier :

* `status = PENDING`
* Générer `reference` unique (`TRF-20250101-XXXX`)
* Frais :
  ```
  fees = 0.8% arrondi au supérieur
  min = 100
  max = 1500
  total = amount + fees

  ```
* Sauvegarder & retourner l'objet
* Audit action : `TRANSFER_CREATED`

---

### 3) Récupérer la liste des transferts

`GET /transfers`

Avec filtres :

* `status`
* `channel`
* `minAmount`, `maxAmount`
* `q` (recherche dans reference/nom)

Pagination : **cursor based**

* query : `limit` (max 50) & `cursor`
* réponse :

```json
{
  "items": [...],
  "nextCursor": "...."
}

```

---

### 4) Récupérer un transfert

`GET /transfers/:id`

→ 404 si pas trouvé

---

### 5) Simuler le traitement

`POST /transfers/:id/process`

Flux état :

```
PENDING ➜ PROCESSING ➜ SUCCESS | FAILED

```

Simulation :

* 70% → SUCCESS + `provider_ref`
* 30% → FAILED + `error_code`

Erreurs :

* Si status déjà final (`SUCCESS`, `FAILED`, `CANCELED`) → **409**

Audit :

* `TRANSFER_PROCESSING`
* `TRANSFER_SUCCESS` / `TRANSFER_FAILED`

> Bonus léger : délai 2–3s via setTimeout pour rendre le process réel

---

### 6) Annuler un transfert

`POST /transfers/:id/cancel`

Règle :

* Seul `PENDING` peut être `CANCELED`
* Sinon → **409**
* Audit : `TRANSFER_CANCELED`

---

### 🧱 Structure recommandée

```
src/
  common/
    guards/api-key.guard.ts
  transfers/
    dto/
    entities/
    transfers.controller.ts
    transfers.service.ts
    transfers.repository.ts
    provider.simulator.ts
  audit/
    audit.service.ts
main.ts

```

---

### 🧪 Tests unitaires (minimum 2)

* Calcul des frais
* Transition d’état (ex: `PENDING → PROCESSING → SUCCESS`)

---

### 📘 Swagger

Doit documenter :

* Tous endpoints
* Headers nécessaires (`x-api-key`)
* Exemple de payloads

---

### ✅ Critères d'évaluation

| Critère                            | Poids      |
| ----------------------------------- | ---------- |
| Respect des règles métier         | ⭐⭐⭐⭐⭐ |
| Qualité du code & structure NestJS | ⭐⭐⭐⭐⭐ |
| Validations DTO & erreurs HTTP      | ⭐⭐⭐⭐   |
| Pagination & filtres                | ⭐⭐⭐⭐   |
| Logs d’audit                       | ⭐⭐⭐     |
| Swagger & README                    | ⭐⭐⭐     |
| Tests unitaires                     | ⭐⭐       |

---

### ⭐ Bonus facultatif

* Seeds: `npm run seed`
* Provider adapters séparés (`wave`, `om`)
* Docker compose (DB + app)

---

### 📦 Livrables

* Repo GitHub
* Swagger accessible sur `/docs`
* `.env.example`
* README contenant :
  * Setup & commandes
  * Routes + exemples
  * Explication du flow
  * Choix techniques
  * Ce que tu ferais avec plus de temps

---
