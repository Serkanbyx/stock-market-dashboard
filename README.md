# 📈 Stock Market Dashboard

A modern, responsive stock market dashboard built with React, TypeScript, and Vite. Track stocks, analyze charts, and manage your watchlist with real-time market data.

[![Created by Serkanby](https://img.shields.io/badge/Created%20by-Serkanby-blue?style=flat-square)](https://serkanbayraktar.com/)
[![GitHub](https://img.shields.io/badge/GitHub-Serkanbyx-181717?style=flat-square&logo=github)](https://github.com/Serkanbyx)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## Features

- **Real-time Stock Data**: Fetch live stock quotes from Finnhub API
- **Interactive Charts**: Visualize price history with Recharts library
- **Watchlist Management**: Save and track your favorite stocks with localStorage persistence
- **Stock Search**: Search for stocks by symbol with autocomplete functionality
- **Market Overview**: View major market indices (S&P 500, NASDAQ, DOW)
- **Top Movers**: Track daily top gainers and losers in the market
- **Responsive Design**: Fully optimized for desktop, tablet, and mobile devices
- **Dark Theme**: Modern dark UI built with Tailwind CSS

## Live Demo

[🚀 View Live Demo](https://stock-market-dashboarddd.netlify.app/)

## Screenshots

### Dashboard View

The main dashboard displays market overview, watchlist, and top movers at a glance.

### Stock Detail View

Detailed stock analysis with interactive price charts and key metrics.

## Technologies

- **React 18**: Modern UI library with hooks and functional components
- **TypeScript**: Type-safe development with static type checking
- **Vite**: Next-generation frontend build tool for fast development
- **Redux Toolkit**: Efficient state management with simplified Redux
- **React Router v6**: Declarative routing for single-page applications
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
git clone https://github.com/Serkanbyx/Stock-Market-Dashboard.git
cd Stock-Market-Dashboard
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

## Usage

1. **Browse the Dashboard**: View market overview with major indices and top movers
2. **Search Stocks**: Use the search bar to find stocks by symbol (e.g., AAPL, GOOGL, MSFT)
3. **View Stock Details**: Click on any stock to see detailed charts and information
4. **Manage Watchlist**: Add stocks to your watchlist by clicking the star icon
5. **Analyze Charts**: Switch between different time ranges (1D, 1W, 1M, 3M, 1Y)
6. **Track Performance**: Monitor your watchlist stocks with real-time price updates

## How It Works?

### State Management

The app uses Redux Toolkit with three main slices:

```typescript
// stockSlice - manages stock data
selectedStock: StockQuote | null
historicalData: CandleData[]
searchResults: SearchResult[]
timeRange: '1D' | '1W' | '1M' | '3M' | '1Y'

// watchlistSlice - manages user watchlist
items: string[] // persisted in localStorage
quotes: Record<string, StockQuote>

// marketSlice - manages market data
indices: MarketIndex[]
topGainers: StockQuote[]
topLosers: StockQuote[]
```

### Form Validation

Zod schemas are used for form validation:

```typescript
const symbolSchema = z
  .string()
  .min(1, 'Symbol is required')
  .max(5, 'Symbol must be 5 characters or less')
  .regex(/^[A-Z]{1,5}$/, 'Invalid symbol format');
```

### API Integration

The app integrates with Finnhub API for:

- Real-time stock quotes
- Historical price data (candles)
- Stock symbol search
- Company profiles

Rate limiting is implemented to respect API limits:

```typescript
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
```

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
2. Connect repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

## Features in Detail

### Completed Features

✅ Real-time stock quotes with Finnhub API  
✅ Interactive price charts with multiple time ranges  
✅ Watchlist with localStorage persistence  
✅ Stock search with autocomplete  
✅ Market indices overview  
✅ Top gainers and losers tracking  
✅ Responsive design for all devices  
✅ Dark theme UI  

### Future Features

- [ ] Portfolio tracking with profit/loss calculation
- [ ] Price alerts and notifications
- [ ] News feed integration
- [ ] Multiple watchlists support
- [ ] Export data to CSV/PDF
- [ ] Technical indicators (RSI, MACD, etc.)

## Contributing

Contributions are welcome! Please follow these steps:

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

- [Finnhub](https://finnhub.io/) for providing free stock market API
- [Recharts](https://recharts.org/) for the charting library
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
- [Redux Toolkit](https://redux-toolkit.js.org/) for state management
- [React Hook Form](https://react-hook-form.com/) for form handling

## Contact

- **Issues**: [GitHub Issues](https://github.com/Serkanbyx/Stock-Market-Dashboard/issues)
- **Email**: [serkanbyx1@gmail.com](mailto:serkanbyx1@gmail.com)
- **Website**: [serkanbayraktar.com](https://serkanbayraktar.com/)

---

⭐ If you like this project, don't forget to give it a star!

**Disclaimer**: This application is for educational purposes only. Stock data may be delayed and should not be used for making financial decisions.
