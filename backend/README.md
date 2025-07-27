# AML Checker Backend

Backend service for checking wallet addresses across multiple blockchain networks.

## Project Structure

```
src/
├── adapters/
│   ├── bitcoin.adapter.ts
│   ├── ethereum.adapter.ts
│   └── solana.adapter.ts
├── config/
│   ├── index.ts
│   └── logger.ts
├── controllers/
│   └── wallet.controller.ts
├── middleware/
│   ├── error-handler.ts
│   ├── rate-limiter.ts
│   └── request-validator.ts
├── routes/
│   └── api/
│       ├── index.ts
│       └── wallet.routes.ts
├── services/
│   ├── cache.service.ts
│   └── wallet/
│       ├── bitcoin.service.ts
│       ├── ethereum.service.ts
│       └── solana.service.ts
├── types/
│   ├── blockcypher.types.ts
│   ├── etherscan.types.ts
│   └── wallet-info.ts
├── utils/
│   └── validators.ts
├── app.ts
└── index.ts
```

## Features

- Multi-chain support (Ethereum, Bitcoin, Solana)
- Address validation
- Transaction history analysis
- Risk assessment
- Token tracking (ERC-20, SPL)
- Caching layer
- Rate limiting
- Error handling
- Logging

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Update environment variables in `.env`

## Development

Start development server:

```bash
npm run dev
```

## API Endpoints

### Validate Address

```http
POST /api/wallet/validate
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "network": "ethereum"
}
```

### Get Wallet Info

```http
POST /api/wallet/info
Content-Type: application/json

{
  "address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "network": "ethereum"
}
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run linter
- `npm run lint:fix` - Fix linting errors
- `npm run format` - Format code with Prettier
