# Vector OHIP Connect

A comprehensive interface for testing and managing Oracle Hospitality Integration Platform (OHIP) APIs.

## Features

- **Multi-Environment Support**: Configure and switch between OPERA Cloud, Distribution, and R&A Storage environments
- **OAuth Token Management**: Auto-generate and refresh tokens using stored credentials (Client Credentials flow)
- **API Explorer**: Browse and test all OHIP API endpoints with dynamic parameter editing
- **Request Builder**: Build and customize API requests with path parameters, query parameters, headers, and JSON body
- **Response Viewer**: View formatted JSON responses with syntax highlighting and download capability
- **Excel Templates**: Download and upload Excel templates for POST requests (human-friendly format)
- **Request History**: Track all API calls with timestamps, status codes, and response times
- **Configuration Export/Import**: Export and import environment configurations as JSON files

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **UI**: React 18, Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: OAuth 2.0 (Client Credentials flow)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or Yarn package manager
- PostgreSQL database (optional - only needed for token caching & request logging)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ThameeraDananjaya/Vector-OHIP-Connect.git
cd Vector-OHIP-Connect
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup (Optional)

The database is used for **token caching** and **API request logging**. If you want these features:

1. Set up environment variables:
```bash
cp .env.example .env
# Add your PostgreSQL connection string:
# DATABASE_URL="postgresql://user:password@localhost:5432/vector_ohip"
```

2. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

**Without a database**: The app will still work for making API calls, but:
- Tokens won't be cached (new token generated each time)
- Request history won't be saved

## Environment Configuration

The application supports three OHIP environments:

### OPERA Cloud
- HostName
- AppKey  
- CLIENT_ID
- CLIENT_SECRET
- EnterpriseId
- HotelId

### Distribution
- HostName
- AppKey
- CLIENT_ID
- CLIENT_SECRET
- ChainCode
- HotelId

### R&A Storage
- IDCSHostName
- APPId
- APPSecret
- Scope

## API Endpoints

The application provides proxy endpoints for secure API communication:

- `POST /api/token` - Generate OAuth tokens
- `POST /api/proxy` - Proxy requests to OHIP APIs
- `GET /api/logs` - Fetch request history
- `DELETE /api/logs` - Clear request history

## License

MIT License
