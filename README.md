# 📈 Stock Market Dashboard

A modern, responsive stock market dashboard built with React, TypeScript, and Vite. Track stocks, analyze interactive charts, manage your watchlist, and practice trading with a virtual portfolio using real-time market data.

[![Created by Serkanby](https://img.shields.io/badge/Created%20by-Serkanby-blue?style=flat-square)](https://serkanbayraktar.com/)
[![GitHub](https://img.shields.io/badge/GitHub-Serkanbyx-181717?style=flat-square&logo=github)](https://github.com/Serkanbyx)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## Features

- **Real-time Stock Data**: Fetch live stock quotes from the Finnhub API
- **Interactive Charts**: Visualize price history across multiple time ranges with Recharts
- **Virtual Portfolio**: Practice trading with $100,000 in virtual cash, buy/sell at live prices, and track profit/loss
- **Watchlist Management**: Save and track your favorite stocks with localStorage persistence
- **Stock Search**: Search for stocks by symbol with debounced autocomplete and keyboard navigation
- **Market Overview**: View major market indices (S&P 500, NASDAQ, Dow Jones)
- **Top Movers**: Track the day's top gainers and losers
- **Performance Optimized**: Route-based code-splitting, memoization, and a cached/rate-limited API layer
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices
- **Dark Theme**: Modern, accessible dark UI built with Tailwind CSS

## Live Demo

[🚀 View Live Demo](https://stock-market-dashboarddd.netlify.app/)

## Screenshots

### Dashboard View

The main dashboard displays the market overview, watchlist, and top movers at a glance.

### Stock Detail View

Detailed stock analysis with interactive price charts, key statistics, and quick actions.

### Portfolio View

A simulated portfolio with holdings, allocation chart, transaction history, and live profit/loss tracking.

## Technologies

- **React 18**: Modern UI library with hooks and functional components
- **TypeScript**: Type-safe development with static type checking
- **Vite**: Next-generation frontend build tool for fast development
- **Redux Toolkit**: Efficient state management with simplified Redux
- **React Router v6**: Declarative routing with lazy-loaded routes
- **React Hook Form**: Performant form handling with minimal re-renders
- **Zod**: TypeScript-first schema validation library
- **Axios**: Promise-based HTTP client for API requests
- **Recharts**: Composable charting library for React
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Finnhub API key (free tier available)

### Local Development

1. **Clone the repository**

```bash
git clone https://github.com/serkanbyx/stock-market-dashboard.git
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

> **Note**: The free tier has rate limits (60 API calls/minute). The app includes built-in caching, request queueing, and rate limiting to handle this gracefully.

## Usage

1. **Browse the Dashboard**: View the market overview with major indices and top movers
2. **Search Stocks**: Use the search bar to find stocks by symbol (e.g., AAPL, GOOGL, MSFT)
3. **View Stock Details**: Click on any stock to see detailed charts and statistics
4. **Manage Watchlist**: Add stocks to your watchlist by clicking the star icon
5. **Trade in the Portfolio**: Open the Portfolio page to buy/sell stocks with virtual cash and track P&L
6. **Analyze Charts**: Switch between different time ranges (1D, 1W, 1M, 3M, 6M, 1Y, 5Y)

## How It Works?

### State Management

The app uses Redux Toolkit with four main slices:

```typescript
// stockSlice - manages selected stock data and charts
selectedStock: StockQuote | null
historicalData: HistoricalDataPoint[]
searchResults: SearchResult[]
timeRange: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y'

// watchlistSlice - manages the user watchlist (persisted in localStorage)
items: WatchlistItem[]
quotes: Record<string, StockQuote>

// marketSlice - manages market-wide data
indices: MarketIndex[]
topGainers: StockQuote[]
topLosers: StockQuote[]

// portfolioSlice - manages the virtual portfolio (persisted in localStorage)
holdings: PortfolioHolding[]
transactions: Transaction[]
cashBalance: number
currentPrices: Record<string, number>
```

### Form Validation

Zod schemas are used for form validation:

```typescript
const symbolSchema = z
  .string()
  .min(1, 'Symbol is required')
  .max(5, 'Symbol must be 5 characters or less')
  .regex(/^[A-Z]{1,5}$/, 'Invalid symbol format')
  .transform((val) => val.toUpperCase());
```

### API Integration

The app integrates with the Finnhub API for:

- Real-time stock quotes
- Historical price data (candles)
- Stock symbol search
- Company profiles

The API service layer adds an in-memory cache, a serialized request queue, and retry with exponential backoff to respect free-tier limits:

```typescript
const RATE_LIMIT_DELAY = 300; // ms between requests, with caching + retry
```

### Performance

Routes are lazy-loaded with `React.lazy` + `Suspense`, and heavy vendors (e.g. Recharts) are split into separate chunks via Vite `manualChunks`. This keeps the initial bundle small; the charting library only loads when a chart page is visited.

## Project Structure

```
.
├── .github/             # Community health files (issue/PR templates, policies)
├── docs/                # Project documentation (build-guide.md)
├── public/              # Static assets
└── src/
    ├── components/       # Reusable UI components
    │   ├── Layout.tsx
    │   ├── SearchForm.tsx
    │   ├── StockChart.tsx
    │   ├── StockTable.tsx
    │   ├── StockCard.tsx
    │   ├── Watchlist.tsx
    │   ├── MarketOverview.tsx
    │   ├── PortfolioSummary.tsx
    │   ├── HoldingsTable.tsx
    │   ├── TransactionForm.tsx
    │   ├── TransactionHistory.tsx
    │   ├── AllocationChart.tsx
    │   ├── LoadingSpinner.tsx
    │   └── ErrorMessage.tsx
    ├── pages/            # Route pages (Dashboard, StockDetail, Portfolio)
    ├── store/            # Redux store, typed hooks, and slices
    │   └── slices/       # stockSlice, watchlistSlice, marketSlice, portfolioSlice
    ├── services/         # Finnhub API integration (cache + rate-limit + retry)
    ├── validation/       # Zod validation schemas
    ├── hooks/            # Reusable hooks (useDebounce, useLocalStorage)
    ├── utils/            # Formatters and helpers
    ├── types/            # Shared TypeScript types
    ├── App.tsx           # Root component with lazy-loaded routing
    ├── main.tsx          # Application entry point
    └── index.css         # Global styles with Tailwind
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Netlify

1. Push your code to GitHub
2. Connect the repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add the `VITE_FINNHUB_API_KEY` environment variable in the Netlify dashboard

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

## Features in Detail

### Completed Features

✅ Real-time stock quotes with the Finnhub API  
✅ Interactive price charts with multiple time ranges  
✅ Virtual portfolio with buy/sell and profit/loss tracking  
✅ Watchlist with localStorage persistence  
✅ Stock search with autocomplete  
✅ Market indices overview  
✅ Top gainers and losers tracking  
✅ Route-based code-splitting and vendor chunking  
✅ Responsive design for all devices  
✅ Dark theme UI  

### Future Features

- [ ] Price alerts and notifications
- [ ] News feed integration
- [ ] Multiple watchlists support
- [ ] Export data to CSV/PDF
- [ ] Technical indicators (RSI, MACD, etc.)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](.github/CONTRIBUTING.md) and [Code of Conduct](.github/CODE_OF_CONDUCT.md) before getting started.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using semantic commit messages
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Message Format

| Prefix | Description |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `style:` | Code style changes (formatting, etc.) |
| `refactor:` | Code refactoring |
| `test:` | Adding or updating tests |
| `chore:` | Maintenance tasks |

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Developer

**Serkanby**

- Website: [serkanbayraktar.com](https://serkanbayraktar.com/)
- GitHub: [@Serkanbyx](https://github.com/Serkanbyx)
- Email: [serkanbyx1@gmail.com](mailto:serkanbyx1@gmail.com)

## Acknowledgments

- [Finnhub](https://finnhub.io/) for providing the free stock market API
- [Recharts](https://recharts.org/) for the charting library
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
- [Redux Toolkit](https://redux-toolkit.js.org/) for state management
- [React Hook Form](https://react-hook-form.com/) for form handling

## Contact

- **Issues**: [GitHub Issues](https://github.com/serkanbyx/stock-market-dashboard/issues)
- **Email**: [serkanbyx1@gmail.com](mailto:serkanbyx1@gmail.com)
- **Website**: [serkanbayraktar.com](https://serkanbayraktar.com/)

---

⭐ If you like this project, don't forget to give it a star!

**Disclaimer**: This application is for educational purposes only. Stock data may be delayed and should not be used for making financial decisions.
