# Stock Market Dashboard

A modern, responsive stock market dashboard built with React, TypeScript, and Vite. Track stocks, analyze charts, and manage your watchlist with real-time market data.

![Stock Market Dashboard](https://img.shields.io/badge/React-18.2-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue) ![Vite](https://img.shields.io/badge/Vite-6.0-purple) ![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Real-time Stock Data**: Fetch live stock quotes from Finnhub API
- **Interactive Charts**: Visualize price history with Recharts
- **Watchlist Management**: Save and track your favorite stocks
- **Stock Search**: Search for stocks by symbol with autocomplete
- **Market Overview**: View major market indices (S&P 500, NASDAQ, DOW)
- **Top Movers**: Track daily top gainers and losers
- **Responsive Design**: Optimized for desktop and mobile devices
- **Dark Theme**: Modern dark UI with Tailwind CSS

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18 + Vite |
| **Language** | TypeScript |
| **State Management** | Redux Toolkit |
| **Routing** | React Router v6 |
| **Forms** | React Hook Form |
| **Validation** | Zod |
| **HTTP Client** | Axios |
| **Charts** | Recharts |
| **Styling** | Tailwind CSS |

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx       # Main layout with header/footer
│   ├── SearchForm.tsx   # Stock search with autocomplete
│   ├── StockChart.tsx   # Interactive price charts
│   ├── StockTable.tsx   # Stock data table
│   ├── StockCard.tsx    # Stock detail card
│   ├── Watchlist.tsx    # User watchlist component
│   ├── MarketOverview.tsx # Market indices display
│   ├── LoadingSpinner.tsx
│   └── ErrorMessage.tsx
├── pages/               # Route pages
│   ├── Dashboard.tsx    # Main dashboard page
│   └── StockDetail.tsx  # Individual stock page
├── store/               # Redux store
│   ├── index.ts         # Store configuration
│   ├── hooks.ts         # Typed hooks
│   └── slices/          # Redux slices
│       ├── stockSlice.ts
│       ├── watchlistSlice.ts
│       └── marketSlice.ts
├── services/            # API services
│   └── api.ts           # Finnhub API integration
├── validation/          # Zod schemas
│   └── schemas.ts       # Form validation schemas
├── types/               # TypeScript types
│   └── index.ts
├── App.tsx              # Root component with routing
├── main.tsx             # Application entry point
└── index.css            # Global styles with Tailwind
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Finnhub API key (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/stock-market-dashboard.git
   cd stock-market-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API key:
   ```env
   VITE_FINNHUB_API_KEY=your_finnhub_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

### Getting a Finnhub API Key

1. Visit [Finnhub.io](https://finnhub.io/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env` file

> **Note**: The free tier has rate limits (60 API calls/minute). The app includes built-in rate limiting to handle this.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Routes

| Path | Description |
|------|-------------|
| `/` | Main dashboard with market overview |
| `/stock/:symbol` | Detailed view for specific stock |

## State Management

The app uses Redux Toolkit with three main slices:

### stockSlice
- `selectedStock`: Currently viewed stock quote
- `historicalData`: Price history for charts
- `searchResults`: Stock search results
- `timeRange`: Selected chart time range

### watchlistSlice
- `items`: List of saved stocks (persisted in localStorage)
- `quotes`: Real-time quotes for watchlist items

### marketSlice
- `indices`: Major market index data
- `topGainers`: Top gaining stocks
- `topLosers`: Top losing stocks

## Form Validation

Zod schemas are used for form validation:

```typescript
// Symbol validation
const symbolSchema = z
  .string()
  .min(1, 'Symbol is required')
  .max(5, 'Symbol must be 5 characters or less')
  .regex(/^[A-Z]{1,5}$/, 'Invalid symbol format');
```

## API Integration

The app integrates with Finnhub API for:
- Real-time stock quotes
- Historical price data (candles)
- Stock symbol search
- Company profiles

Rate limiting is implemented to respect API limits:

```typescript
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
```

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Netlify

1. Push your code to GitHub
2. Connect repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FINNHUB_API_KEY` | Finnhub API key | Yes |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- React.memo for component memoization
- useCallback for event handler optimization
- Debounced search input
- Rate-limited API calls
- Lazy loading for charts

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Finnhub](https://finnhub.io/) for providing free stock market API
- [Recharts](https://recharts.org/) for the charting library
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework

---

**Disclaimer**: This application is for educational purposes only. Stock data may be delayed and should not be used for making financial decisions.
