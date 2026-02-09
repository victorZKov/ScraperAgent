import type { FullReport } from './types';

export const SAMPLE_MARKET_REPORT: FullReport = {
  Id: 'sample-market-001',
  Domain: 0,
  GeneratedAt: '2026-02-09T08:00:00Z',
  EmailSent: true,
  ModelUsed: 'AI Model',
  DurationSeconds: 42,
  Analysis: {
    ExecutiveSummary:
      'Markets showed renewed optimism as technology earnings exceeded expectations and Fed commentary suggested rate cuts remain on the table for Q2. The S&P 500 pushed toward new highs driven by semiconductor strength, while defensive sectors underperformed. Expert consensus leans bullish with notable enthusiasm around AI-related plays, though contrarian voices warn of overextension in mega-cap tech. Breadth remains a concern with leadership concentrated in a handful of names.',
    OverallSentiment: 3,
    SentimentScore: 0.42,
    KeyThemes: [
      'AI infrastructure spending accelerating beyond expectations across major cloud providers',
      'Fed rate cut expectations firming for the June meeting as inflation data softens',
      'Semiconductor cycle entering a sustained multi-year upswing driven by AI demand',
      'Small-cap rotation beginning as risk appetite returns and rate cuts approach',
      'Earnings quality improving across S&P 500 constituents with margin expansion',
    ],
    TradingSignals: [
      {
        Ticker: 'NVDA',
        Direction: 4,
        Confidence: 'HIGH',
        Timeframe: '1-3 months',
        Rationale:
          'Data center revenue growth accelerating; AI capex cycle still in early innings per multiple experts. Every major cloud provider increasing GPU orders.',
        SourceExperts: ['Mayhem4Markets', 'unusual_whales'],
        SourceTweetUrls: [],
      },
      {
        Ticker: 'AAPL',
        Direction: 3,
        Confidence: 'MEDIUM',
        Timeframe: '3-6 months',
        Rationale:
          'Services revenue inflection point with record margins. iPhone cycle bottoming with Apple Intelligence features as catalyst for upgrade super-cycle.',
        SourceExperts: ['jimcramer', 'MacroAlf'],
        SourceTweetUrls: [],
      },
      {
        Ticker: 'MSFT',
        Direction: 4,
        Confidence: 'HIGH',
        Timeframe: '1-3 months',
        Rationale:
          'Azure AI services growth exceeding expectations at 40%+ YoY. Enterprise Copilot adoption accelerating with measurable productivity gains reported.',
        SourceExperts: ['Mayhem4Markets', 'SqueezeMetrics'],
        SourceTweetUrls: [],
      },
      {
        Ticker: 'AMD',
        Direction: 3,
        Confidence: 'HIGH',
        Timeframe: '3-6 months',
        Rationale:
          'MI300X gaining enterprise traction; catching up to NVDA in AI inference workloads. Data center segment becoming dominant revenue driver.',
        SourceExperts: ['unusual_whales', 'TrendSpider'],
        SourceTweetUrls: [],
      },
      {
        Ticker: 'TSLA',
        Direction: 2,
        Confidence: 'LOW',
        Timeframe: '1-3 months',
        Rationale:
          'Mixed signals: price cuts weighing on margins but energy storage division growing rapidly. Expert opinions split evenly between bull and bear cases.',
        SourceExperts: ['DaveHcontrarian', 'EricBalchunas'],
        SourceTweetUrls: [],
      },
      {
        Ticker: 'META',
        Direction: 3,
        Confidence: 'MEDIUM',
        Timeframe: '1-3 months',
        Rationale:
          'Reels monetization improving faster than expected. AI-driven ad targeting boosting revenue per user across all properties.',
        SourceExperts: ['jimcramer', 'MacroAlf'],
        SourceTweetUrls: [],
      },
      {
        Ticker: 'JPM',
        Direction: 3,
        Confidence: 'MEDIUM',
        Timeframe: '3-6 months',
        Rationale:
          'Net interest income stabilizing above expectations; investment banking pipeline strengthening with IPO market recovery.',
        SourceExperts: ['DaveHcontrarian', 'MacroAlf'],
        SourceTweetUrls: [],
      },
      {
        Ticker: 'XOM',
        Direction: 1,
        Confidence: 'MEDIUM',
        Timeframe: '1-3 months',
        Rationale:
          'Oil prices weakening on demand concerns from China slowdown. Capital allocation under scrutiny as energy transition accelerates.',
        SourceExperts: ['Barchart', 'FinancialJuice'],
        SourceTweetUrls: [],
      },
    ],
    SectorBreakdown: [
      {
        Sector: 'Technology',
        Sentiment: 4,
        Summary:
          'Strong momentum driven by AI infrastructure spending and cloud revenue acceleration. Semiconductor sub-sector leading with NVDA and AMD at the forefront.',
        KeyTickers: ['NVDA', 'MSFT', 'AMD', 'AAPL'],
      },
      {
        Sector: 'Financials',
        Sentiment: 3,
        Summary:
          'Improving outlook as rate cut expectations firm. Investment banking recovery underway with IPO pipeline building. Regional banks stabilizing after 2024 stress.',
        KeyTickers: ['JPM', 'GS', 'BAC'],
      },
      {
        Sector: 'Healthcare',
        Sentiment: 2,
        Summary:
          'Mixed signals with GLP-1 drugs creating clear winners and losers across the sector. Biotech M&A activity picking up as large pharma seeks growth.',
        KeyTickers: ['LLY', 'UNH', 'AMGN'],
      },
      {
        Sector: 'Energy',
        Sentiment: 1,
        Summary:
          'Weakening crude prices and demand concerns from China weighing on sentiment. Transition to renewables creating uncertainty for traditional oil majors.',
        KeyTickers: ['XOM', 'CVX', 'SLB'],
      },
    ],
    ExpertSentiments: [
      {
        ExpertHandle: 'Mayhem4Markets',
        Sentiment: 4,
        KeyTakeaway:
          'AI capex cycle is the biggest investment theme since mobile internet — we are still in the first inning.',
        DetailedAnalysis:
          'Maintains aggressive bullish positioning in semiconductors and cloud infrastructure. Notes that enterprise AI spending is still in early innings with only 15% of Fortune 500 having deployed AI at scale. Sees NVDA as a generational compounder.',
        NotableCalls: ['NVDA $180 PT', 'MSFT top pick', 'Overweight semis'],
      },
      {
        ExpertHandle: 'unusual_whales',
        Sentiment: 3,
        KeyTakeaway:
          'Options flow strongly bullish on tech — unusual call buying in NVDA and AMD at levels not seen since Q4 2023.',
        DetailedAnalysis:
          'Tracking significant institutional call buying activity in semiconductor names. Dark pool prints suggest large funds accumulating positions ahead of earnings season. Put/call ratio at extreme lows suggesting conviction.',
        NotableCalls: ['NVDA call sweep $175', 'AMD Jan 2027 $200 calls'],
      },
      {
        ExpertHandle: 'DaveHcontrarian',
        Sentiment: 1,
        KeyTakeaway:
          'Market breadth deteriorating despite index highs — bearish divergence forming that historically precedes 10%+ corrections.',
        DetailedAnalysis:
          'Points to narrow market leadership as concerning. Only 40% of S&P components trading above their 50-day moving average while the index makes new highs. Historically a precursor to corrections of 10% or more.',
        NotableCalls: ['SPY puts $490', 'Short TSLA', 'Long VIX calls'],
      },
    ],
    RiskFactors: [
      'Narrow market breadth: AI-related names driving a disproportionate share of index gains, creating fragility',
      'Geopolitical tensions in the Middle East could spike oil prices and disrupt global risk appetite suddenly',
      'Consumer spending showing early signs of fatigue as credit card delinquencies reach 12-year highs',
      'Q2 earnings expectations may be set too high after strong Q1 results, setting up potential disappointment',
    ],
    Recommendations: [
      {
        Action: 'Accumulate NVDA on any pullback to the $150-155 range',
        RiskLevel: 'MEDIUM',
        Timeframe: '1-3 months',
        Reasoning:
          'Consensus strong buy among tracked experts; AI data center buildout provides multi-year tailwind with no signs of deceleration',
      },
      {
        Action: 'Initiate position in AMD for AI inference exposure',
        RiskLevel: 'MEDIUM',
        Timeframe: '3-6 months',
        Reasoning:
          'MI300X gaining traction with hyperscalers; cheaper entry point than NVDA for the AI semiconductor theme',
      },
      {
        Action: 'Reduce energy sector exposure, particularly XOM',
        RiskLevel: 'LOW',
        Timeframe: '1-3 months',
        Reasoning:
          'Multiple experts turning bearish on oil fundamentals; China demand concerns intensifying and unlikely to resolve near-term',
      },
    ],
  },
  TweetData: {
    TotalTweetsCollected: 523,
    ExpertsQueried: [
      { Handle: 'Mayhem4Markets', DisplayName: 'Mayhem', Category: 'Macro Strategist' },
      { Handle: 'unusual_whales', DisplayName: 'Unusual Whales', Category: 'Options Flow' },
      { Handle: 'DaveHcontrarian', DisplayName: 'Dave H', Category: 'Contrarian Analyst' },
      { Handle: 'jimcramer', DisplayName: 'Jim Cramer', Category: 'TV Analyst' },
      { Handle: 'MacroAlf', DisplayName: 'Alfonso Peccatiello', Category: 'Macro Strategist' },
    ],
    DataSource: 'live',
  },
  MarketData: [
    { Symbol: 'SPY', Price: 528.43, Change24hPercent: 0.87, Volume: 82_500_000 },
    { Symbol: 'QQQ', Price: 467.21, Change24hPercent: 1.23, Volume: 54_200_000 },
    { Symbol: 'NVDA', Price: 168.52, Change24hPercent: 3.41, Volume: 48_300_000 },
    { Symbol: 'AAPL', Price: 198.67, Change24hPercent: 0.54, Volume: 31_100_000 },
    { Symbol: 'MSFT', Price: 445.89, Change24hPercent: 1.67, Volume: 22_800_000 },
  ],
};

export const SAMPLE_CRYPTO_REPORT: FullReport = {
  Id: 'sample-crypto-001',
  Domain: 1,
  GeneratedAt: '2026-02-09T08:00:00Z',
  EmailSent: true,
  ModelUsed: 'AI Model',
  DurationSeconds: 38,
  Analysis: {
    ExecutiveSummary:
      'Bitcoin consolidated above $95,000 as institutional inflows via spot ETFs continued at a record pace. Ethereum showed relative strength with L2 activity surging and staking yields attracting traditional finance capital. The altcoin market is showing early signs of rotation with SOL and AVAX leading on DeFi activity metrics. On-chain data suggests whale accumulation is accelerating while retail participation remains subdued.',
    OverallSentiment: 3,
    SentimentScore: 0.55,
    KeyThemes: [
      'Bitcoin spot ETF inflows setting new weekly records as institutional adoption deepens',
      'Ethereum layer-2 ecosystem exploding with Base and Arbitrum leading in TVL growth',
      'Solana DeFi renaissance driving SOL outperformance vs broader altcoin market',
      'On-chain whale accumulation at levels not seen since pre-2024 halving cycle',
      'Regulatory clarity improving in US and EU creating tailwinds for institutional capital',
    ],
    TradingSignals: [
      {
        Ticker: 'BTC',
        Direction: 4,
        Confidence: 'HIGH',
        Timeframe: '24-72 hours',
        Rationale:
          'Spot ETF inflows exceeding $1B/week; on-chain metrics showing strong accumulation by long-term holders. Supply on exchanges at 5-year lows.',
        SourceExperts: ['100trillionUSD', 'whale_alert'],
        SourceTweetUrls: [],
      },
      {
        Ticker: 'ETH',
        Direction: 4,
        Confidence: 'HIGH',
        Timeframe: '1-2 weeks',
        Rationale:
          'ETH/BTC ratio bouncing from multi-year support. Staking yield attracting TradFi capital. L2 activity creating deflationary pressure via fee burns.',
        SourceExperts: ['DefiIgnas', 'milesdeutscher'],
        SourceTweetUrls: [],
      },
      {
        Ticker: 'SOL',
        Direction: 3,
        Confidence: 'HIGH',
        Timeframe: '24-72 hours',
        Rationale:
          'DeFi TVL growing 30% MoM. NFT marketplace volume surging. Network reliability improved significantly since Firedancer upgrade.',
        SourceExperts: ['CryptoCobain', 'AltcoinGordon'],
        SourceTweetUrls: [],
      },
      {
        Ticker: 'AVAX',
        Direction: 3,
        Confidence: 'MEDIUM',
        Timeframe: '1-2 weeks',
        Rationale:
          'Institutional subnet deployments increasing. Gaming ecosystem showing traction with several AAA partnerships announced.',
        SourceExperts: ['milesdeutscher', 'WatcherGuru'],
        SourceTweetUrls: [],
      },
      {
        Ticker: 'LINK',
        Direction: 3,
        Confidence: 'MEDIUM',
        Timeframe: '1-2 weeks',
        Rationale:
          'CCIP adoption accelerating across major protocols. Staking mechanism creating supply pressure. Key infrastructure for tokenized assets narrative.',
        SourceExperts: ['DefiIgnas', 'WuBlockchain'],
        SourceTweetUrls: [],
      },
      {
        Ticker: 'DOGE',
        Direction: 1,
        Confidence: 'MEDIUM',
        Timeframe: '24-72 hours',
        Rationale:
          'Meme coin rotation fading. On-chain activity declining while whale wallets distributing. No fundamental catalyst in sight.',
        SourceExperts: ['lookonchain', 'whale_alert'],
        SourceTweetUrls: [],
      },
      {
        Ticker: 'ARB',
        Direction: 3,
        Confidence: 'MEDIUM',
        Timeframe: '1-2 weeks',
        Rationale:
          'Leading L2 by TVL and developer activity. Governance proposals improving tokenomics. DeFi yields attracting capital rotation from L1s.',
        SourceExperts: ['DefiIgnas', 'CryptoCobain'],
        SourceTweetUrls: [],
      },
      {
        Ticker: 'XRP',
        Direction: 2,
        Confidence: 'LOW',
        Timeframe: '1-2 weeks',
        Rationale:
          'Regulatory clarity priced in. On-chain activity stagnant relative to peers. Limited DeFi ecosystem growth.',
        SourceExperts: ['WatcherGuru', 'WuBlockchain'],
        SourceTweetUrls: [],
      },
    ],
    SectorBreakdown: [
      {
        Sector: 'Layer 1s',
        Sentiment: 3,
        Summary:
          'BTC dominance stable as ETH and SOL show relative strength. Capital rotating from lower-conviction L1s into top-3 by market cap.',
        KeyTickers: ['BTC', 'ETH', 'SOL'],
      },
      {
        Sector: 'DeFi',
        Sentiment: 4,
        Summary:
          'DeFi renaissance underway with TVL approaching 2021 highs. Yield farming returns improving as protocols mature and real yield narratives gain traction.',
        KeyTickers: ['UNI', 'AAVE', 'MKR', 'LINK'],
      },
      {
        Sector: 'Layer 2s',
        Sentiment: 4,
        Summary:
          'L2 ecosystem exploding with transaction volumes exceeding Ethereum mainnet. Base and Arbitrum leading the charge with developer adoption.',
        KeyTickers: ['ARB', 'OP', 'MATIC'],
      },
      {
        Sector: 'Meme Coins',
        Sentiment: 1,
        Summary:
          'Meme coin momentum fading as capital rotates into fundamentals-driven projects. Whale wallets distributing across major meme tokens.',
        KeyTickers: ['DOGE', 'SHIB', 'PEPE'],
      },
    ],
    ExpertSentiments: [
      {
        ExpertHandle: '100trillionUSD',
        Sentiment: 4,
        KeyTakeaway:
          'Stock-to-flow model tracking perfectly post-halving — $150K BTC target by end of 2026 remains intact.',
        DetailedAnalysis:
          'PlanB maintains his conviction in the stock-to-flow model which has accurately predicted BTC price ranges post-halving. Current accumulation phase mirrors 2017 and 2021 patterns. Institutional inflows via ETFs adding a new demand vector not present in previous cycles.',
        NotableCalls: ['BTC $150K by Dec 2026', 'ETH $8K follow-on'],
      },
      {
        ExpertHandle: 'DefiIgnas',
        Sentiment: 3,
        KeyTakeaway:
          'DeFi yields are becoming competitive with TradFi for the first time — real yield is the narrative that brings institutional capital on-chain.',
        DetailedAnalysis:
          'Tracking the growth of real yield protocols that generate sustainable returns from actual economic activity rather than token inflation. Sees Aave and MakerDAO as the blue chips of DeFi with institutional-grade risk profiles.',
        NotableCalls: ['AAVE $300+', 'Long ARB/OP basket'],
      },
      {
        ExpertHandle: 'whale_alert',
        Sentiment: 3,
        KeyTakeaway:
          'On-chain data shows 12,000 BTC moved off exchanges in the past 48 hours — largest outflow since the ETF approval rally.',
        DetailedAnalysis:
          'Exchange balances dropping to 5-year lows as accumulation accelerates. Large wallet addresses (1000+ BTC) increasing their holdings. Mining difficulty at all-time highs suggesting network security and miner confidence remain strong.',
        NotableCalls: ['BTC supply squeeze imminent', 'Watch exchange reserves'],
      },
    ],
    RiskFactors: [
      'Regulatory uncertainty: potential SEC actions against DeFi protocols could trigger broad market selloff',
      'Exchange risk: centralized exchange solvency concerns resurface periodically and can cause panic selling',
      'Smart contract vulnerabilities: DeFi TVL growth increases attack surface for exploits',
      'Macro correlation: crypto remains correlated to risk assets; unexpected Fed hawkishness could trigger deleveraging',
    ],
    Recommendations: [
      {
        Action: 'Maintain core BTC position; accumulate on dips below $92,000',
        RiskLevel: 'MEDIUM',
        Timeframe: '24-72 hours',
        Reasoning:
          'Strong on-chain fundamentals, record ETF inflows, and supply dynamics all point to continued upside in the medium term',
      },
      {
        Action: 'Build ETH position targeting the L2 growth narrative',
        RiskLevel: 'MEDIUM',
        Timeframe: '1-2 weeks',
        Reasoning:
          'ETH/BTC ratio at multi-year support with L2 activity providing fundamental tailwind via fee burns',
      },
      {
        Action: 'Reduce meme coin exposure, rotate into DeFi blue chips',
        RiskLevel: 'LOW',
        Timeframe: '24-72 hours',
        Reasoning:
          'Meme coin momentum fading while real yield protocols showing sustainable growth metrics',
      },
    ],
  },
  TweetData: {
    TotalTweetsCollected: 412,
    ExpertsQueried: [
      { Handle: '100trillionUSD', DisplayName: 'PlanB', Category: 'Quant Analyst' },
      { Handle: 'DefiIgnas', DisplayName: 'Ignas', Category: 'DeFi Researcher' },
      { Handle: 'whale_alert', DisplayName: 'Whale Alert', Category: 'On-Chain Data' },
      { Handle: 'CryptoCobain', DisplayName: 'Cobie', Category: 'Trader' },
      { Handle: 'milesdeutscher', DisplayName: 'Miles Deutscher', Category: 'Crypto Analyst' },
    ],
    DataSource: 'live',
  },
  MarketData: [
    { Symbol: 'BTC', Price: 95_420, Change24hPercent: 2.14, Volume: 38_500_000_000 },
    { Symbol: 'ETH', Price: 3_845, Change24hPercent: 3.67, Volume: 18_200_000_000 },
    { Symbol: 'SOL', Price: 187.32, Change24hPercent: 5.21, Volume: 4_800_000_000 },
    { Symbol: 'AVAX', Price: 42.18, Change24hPercent: 4.33, Volume: 1_200_000_000 },
    { Symbol: 'LINK', Price: 21.45, Change24hPercent: 2.87, Volume: 890_000_000 },
  ],
};
