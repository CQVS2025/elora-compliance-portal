# Base44 App

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Base44 credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `VITE_BASE44_APP_ID` - Your Base44 application ID
- `VITE_BASE44_BACKEND_URL` - Base44 backend API URL (e.g., https://api.base44.com)
- `VITE_BASE44_FUNCTIONS_VERSION` - Functions version (typically "prod")

### 3. Run Development Server
```bash
npm run dev
```

## Troubleshooting

### App shows "Configuration Error"
If you see a configuration error message, ensure all required environment variables are set in your `.env` file:
- Check that `VITE_BASE44_APP_ID` is set
- Check that `VITE_BASE44_BACKEND_URL` is set
- Restart the dev server after changing environment variables

### App stuck on loading spinner
This usually indicates:
1. Missing or incorrect environment variables
2. Network connectivity issues to the Base44 backend
3. Invalid app ID or backend URL

The app will timeout after 10 seconds and show an error message if it cannot connect.
