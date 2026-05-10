webhook-system/
├── src/
│   ├── index.ts
│   ├── types/
│   │   └── webhook.types.ts
│   ├── services/
│   │   ├── URLValidator.ts
│   │   ├── WebhookDispatcher.ts
│   │   ├── WebhookWorker.ts
│   │   └── RateLimiter.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── validation.ts
│   ├── database/
│   │   └── database.ts
│   └── routes/
│       └── webhook.routes.ts
├── .env
├── package.json
├── tsconfig.json
└── docker-compose.yml