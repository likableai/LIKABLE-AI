# Jupiter Ultra API Integration

## Overview

The backend has been updated to support Jupiter's Ultra API endpoint with API key authentication.

## Changes Made

### 1. Environment Configuration (`.env`)

- **Updated `JUPITER_API_URL`**: Changed from `https://api.jup.ag/price/v3` to `https://api.jup.ag/ultra`
- **Added `JUPITER_API_KEY`**: New environment variable for API authentication

```bash
# Jupiter API
JUPITER_API_URL=https://api.jup.ag/ultra
JUPITER_API_KEY=your_api_key_here
```

### 2. Price Oracle Service (`price-oracle.service.ts`)

Updated the service to support API key authentication:

- **Added private field**: `jupiterApiKey` to store the API key
- **Constructor enhancement**: Reads `JUPITER_API_KEY` from environment variables
- **Request headers**: Automatically includes `X-API-Key` header when API key is configured
- **Logging**: Provides feedback on whether API key is configured

### 3. Environment Validation (`env.validation.ts`)

- **Added validation**: `JUPITER_API_KEY` is now recognized as an optional environment variable
- **Description**: Clearly marked as "required for Ultra API endpoint"

## How to Use

### Step 1: Get Your Jupiter API Key

1. Visit Jupiter's API documentation or dashboard
2. Sign up or log in to get your API key
3. Copy your API key

### Step 2: Configure the Backend

1. Open `backend/.env`
2. Set your API key:

   ```bash
   JUPITER_API_KEY=your_actual_api_key_here
   ```

### Step 3: Verify Configuration

When you start the backend server, you should see:

```text
✓ Jupiter Price API URL: https://api.jup.ag/ultra
✓ Jupiter API Key: Configured
```

If the API key is missing, you'll see a warning:

```text
⚠ Jupiter API Key: Not configured (may be required for some endpoints)
```

## API Request Format

The price oracle now makes requests to Jupiter with the following format:

```typescript
GET https://api.jup.ag/ultra/price?ids=<TOKEN_MINT_ADDRESS>
Headers:
  Accept: application/json
  X-API-Key: <YOUR_API_KEY>
```

## Fallback Behavior

- If the API key is not configured, requests will still be made but without the `X-API-Key` header
- This allows backward compatibility with public endpoints
- The Ultra API endpoint may require the API key for access

## Testing

To test the integration:

1. Ensure your `.env` file has both variables set:

   ```bash
   JUPITER_API_URL=https://api.jup.ag/ultra
   JUPITER_API_KEY=your_api_key_here
   TOKEN_MINT_ADDRESS=your_token_mint_address
   ```

2. Start the backend server:

   ```bash
   cd backend
   npm run dev
   ```

3. Check the logs for successful price fetching:

   ```text
   ✓ Current token price: $0.1234
   ```

## Error Handling

The service includes robust error handling:

- **Invalid API key**: Will log the error and attempt to use cached price
- **Network issues**: Falls back to last known price from cache
- **Missing configuration**: Provides clear warning messages

## Next Steps

1. **Add your Jupiter API key** to the `.env` file
2. **Restart the backend** to apply changes
3. **Monitor logs** to ensure successful API calls
4. **Test price fetching** by making chat or voice requests

## Notes

- The API key is optional but recommended for production use
- Ultra API may have different rate limits or features compared to public endpoints
- Keep your API key secure and never commit it to version control
- The `.env` file is already in `.gitignore` for security
