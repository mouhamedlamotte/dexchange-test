# DEXCHANGE_TEST API

API de gestion des transactions financières multi-canaux avec support pour Wave et Orange Money.

## 📋 Table des matières

* [Installation](https://claude.ai/chat/c4950ef5-88a5-4976-a006-51b06db240e2#installation)
* [Configuration](https://claude.ai/chat/c4950ef5-88a5-4976-a006-51b06db240e2#configuration)
* [Documentation](https://claude.ai/chat/c4950ef5-88a5-4976-a006-51b06db240e2#documentation)
* [Flux de consommation de l&#39;API](https://claude.ai/chat/c4950ef5-88a5-4976-a006-51b06db240e2#flux-de-consommation-de-lapi)
* [Architecture et Adapters](https://claude.ai/chat/c4950ef5-88a5-4976-a006-51b06db240e2#architecture-et-adapters)
* [Endpoints principaux](https://claude.ai/chat/c4950ef5-88a5-4976-a006-51b06db240e2#endpoints-principaux)

## 🚀 Installation

### Prérequis

* Docker & Docker Compose
* Node.js (optionnel pour développement local)

### Étapes d'installation

1. **Cloner le dépôt**

```bash
git clone https://github.com/mouhamedlamotte/dexchange-test
cd dexchange-test
```

2. **Configurer les variables d'environnement**

```bash
cp env.example .env
```

3. **Éditer le fichier `.env`**

```bash
# DATABASE
DB_NAME=dexchange_db
DB_USER=postgres
DB_PASSWORD=your_secure_password

# AUTH
X_API_KEY=your_secret_api_key

# SECURITY
CORS_ORIGIN=*
HELMET_CSP_DIRECTIVES=default-src 'self'
```

4. **Démarrer les services avec Docker**

```bash
docker compose up -d
```

L'API sera accessible sur `http://localhost:9999`

## 📖 Documentation

La documentation Swagger est disponible sur :

```
http://localhost:9999/api/v1/docs
```

## 🔐 Authentification

Tous les endpoints (sauf `/api/v1/health` et `/api/v1/docs`) nécessitent une clé API dans les headers :

```http
x-api-key: your_secret_api_key
```

## 🔄 Flux de consommation de l'API

### 1. Créer une transaction

```http
POST /api/v1/transactions
Content-Type: application/json
x-api-key: your_secret_api_key

{
  "amount": 12500,
  "channel": "wave",
  "recipient": {
    "name": "John Doe",
    "phone": "+221770000000"
  },
  "metadata": {
    "note": "Payment for order #1234"
  }
}
```

**Réponse :**

```json
{
  "statusCode": 201,
  "message": "Transaction created successfully",
  "data": {
    "id": "b9eec2d8-2d38-4a87-bbe1-9e2a5b77cd77",
    "reference": "DEXC_TX_2A4C9C9E6A7C4FBA",
    "amount": 12600,
    "fees": 100,
    "status": "PENDING",
    "payeeName": "John Doe",
    "payeePhone": "+221770000000",
    "channelId": "wave"
  }
}
```

**Calcul des frais :**

* Frais = 0.8% du montant, arrondi au supérieur
* Minimum : 100 FCFA
* Maximum : 1500 FCFA
* Montant total = montant + frais

### 2. Traiter la transaction

```http
POST /api/v1/transactions/{id}/process
x-api-key: your_secret_api_key
```

**Réponse :**

```json
{
  "statusCode": 202,
  "message": "Transaction processing started",
  "data": {
    "transactionId": "b9eec2d8-2d38-4a87-bbe1-9e2a5b77cd77"
  }
}
```

Le traitement est asynchrone et simule un délai de 3 secondes avant d'appeler l'adapter correspondant.

### 3. Vérifier le statut

```http
GET /api/v1/transactions/{id}
x-api-key: your_secret_api_key
```

**Statuts possibles :**

* `PENDING` : En attente de traitement
* `PROCESSING` : En cours de traitement
* `SUCCESS` : Transaction réussie
* `FAILED` : Transaction échouée
* `CANCELED` : Transaction annulée

### 4. Annuler une transaction (optionnel)

Uniquement possible si le statut est `PENDING` :

```http
POST /api/v1/transactions/{id}/cancel
x-api-key: your_secret_api_key
```

### 5. Consulter l'historique des actions

```http
GET /api/v1/actions?transactionId={id}
x-api-key: your_secret_api_key
```

Types d'actions trackées :

* `TRANSFER_CREATED`
* `TRANSFER_PROCESSING`
* `TRANSFER_SUCCESS`
* `TRANSFER_FAILED`
* `TRANSFER_CANCELED`

## 🏗️ Architecture et Adapters

### Pattern Adapter pour les canaux de paiement

L'architecture utilise le pattern **Adapter** pour supporter plusieurs fournisseurs de paiement (Wave, Orange Money, etc.) de manière extensible.

#### Interface TransferAdapter

```typescript
interface TransferAdapter {
  process(data: TransferData): Promise<void>;
}

interface TransferData {
  amount: number;
  currency: string;
  phone: string;
  transactionId: string;
}
```

### Service de Transfert (`TransferService`)

Le `TransferService` orchestre le traitement des transactions en :

1. **Validation** : Vérifie que la transaction existe et peut être traitée
2. **Changement de statut** : Passe la transaction en `PROCESSING`
3. **Sélection de l'adapter** : Choisit le bon adapter selon le canal
4. **Délai simulé** : Attend 3 secondes pour simuler un traitement réel
5. **Exécution** : Appelle la méthode `process()` de l'adapter

```typescript
private readonly adapters: Record<string, TransferAdapter>;

constructor(
  private readonly wave: WaveService,
  private readonly om: OMService,
  private readonly transactionService: TransactionsService,
) {
  this.adapters = {
    wave: this.wave,
    om: this.om,
  };
}

async process(id: string) {
  const transaction = await this.transactionService.findOne(id);
  
  // Validation du statut
  if (unauthorizedStatus.includes(transaction.status)) {
    throw new ConflictException('Transaction cannot be processed');
  }
  
  // Passage en PROCESSING
  await this.transactionService.updateStatus(id, Status.PROCESSING);
  
  // Sélection et exécution de l'adapter
  const adapter = this.adapters[transaction.channel.code];
  await adapter.process({
    amount: transaction.amount,
    currency: transaction.currency,
    phone: transaction.payeePhone,
    transactionId: transaction.id,
  });
}
```

### Implémentations des Adapters

Chaque adapter (`WaveService`, `OMService`) implémente l'interface `TransferAdapter` :

* **Responsabilité** : Communiquer avec l'API du fournisseur externe
* **Callback** : Met à jour le statut de la transaction (`SUCCESS` ou `FAILED`)
* **Isolation** : La logique spécifique à chaque fournisseur reste encapsulée

### Avantages de cette architecture

✅ **Extensibilité** : Ajouter un nouveau canal = créer un nouvel adapter

✅ **Maintenabilité** : Logique métier séparée des intégrations externes

✅ **Testabilité** : Chaque adapter peut être mocké indépendamment

✅ **Cohérence** : Interface commune garantit un comportement uniforme

## 📊 Service de Transactions (`TransactionsService`)

Gère le cycle de vie complet des transactions :

### Fonctionnalités principales

* **Création** : Génère une référence unique, calcule les frais, enregistre en base
* **Lecture** : Support de pagination, filtrage, tri et recherche
* **Mise à jour de statut** : Enregistre chaque changement dans les actions
* **Annulation** : Possible uniquement si `PENDING`

### Filtrage avancé

```http
GET /api/v1/transactions?status=SUCCESS&channel=wave&minAmount=1000&maxAmount=5000
```

Paramètres supportés :

* `status` : Filtrer par statut
* `channel` : Filtrer par canal (wave, om)
* `minAmount` / `maxAmount` : Plage de montant
* `q` : Recherche textuelle (référence, nom, téléphone)
* `sortBy` : Tri par `createdAt` ou `updatedAt`
* `sortOrder` : `asc` ou `desc`

## 🔍 Endpoints principaux

| Méthode | Endpoint                              | Description                       |
| -------- | ------------------------------------- | --------------------------------- |
| GET      | `/api/v1/health`                    | Health check (pas d'auth requise) |
| POST     | `/api/v1/transactions`              | Créer une transaction            |
| GET      | `/api/v1/transactions`              | Lister les transactions (paginé) |
| GET      | `/api/v1/transactions/{id}`         | Détails d'une transaction        |
| POST     | `/api/v1/transactions/{id}/process` | Traiter une transaction           |
| POST     | `/api/v1/transactions/{id}/cancel`  | Annuler une transaction           |
| GET      | `/api/v1/actions`                   | Historique des actions            |

## 🛠️ Technologies utilisées

* **NestJS** : Framework backend
* **Prisma** : ORM et gestion de base de données
* **PostgreSQL** : Base de données
* **Docker** : Containerisation
* **Swagger** : Documentation API

## 📝 Logs et Actions

Chaque opération sur une transaction génère une action trackée :

```typescript
await this.actions.add({
  type: ActionType.TRANSFER_CREATED,
  transactionId: transaction.id,
});
```

Cela permet un audit complet et un suivi détaillé de l'historique des transactions.
