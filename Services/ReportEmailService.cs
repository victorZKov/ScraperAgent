using ScraperAgent.Configuration;
using ScraperAgent.Models;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using System.Web;

namespace ScraperAgent.Services;

public class ReportEmailService : IReportEmailService
{
    private readonly ILogger<ReportEmailService> _logger;
    private readonly EmailOptions _emailOptions;

    public ReportEmailService(ILogger<ReportEmailService> logger, IOptions<EmailOptions> emailOptions)
    {
        _logger = logger;
        _emailOptions = emailOptions.Value;
    }

    public async Task<bool> SendMarketReportAsync(MarketReport report, List<string> recipients)
    {
        if (string.IsNullOrEmpty(_emailOptions.Smtp.Host))
        {
            _logger.LogWarning("SMTP host not configured - email will not be sent");
            return false;
        }

        var htmlContent = BuildHtmlReport(report);
        var plainTextContent = BuildPlainTextReport(report);
        var reportLabel = report.Domain == AnalysisDomain.Crypto
            ? "Crypto Intelligence Report"
            : "Market Intelligence Report";
        var subject = $"{reportLabel} - {report.GeneratedAt:MMM dd, yyyy HH:mm} UTC";

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_emailOptions.FromName, _emailOptions.FromEmail));

        foreach (var recipient in recipients)
        {
            if (!string.IsNullOrWhiteSpace(recipient))
                message.Bcc.Add(MailboxAddress.Parse(recipient.Trim()));
        }

        message.Subject = subject;

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = htmlContent,
            TextBody = plainTextContent
        };
        message.Body = bodyBuilder.ToMessageBody();

        try
        {
            using var client = new SmtpClient();
            client.ServerCertificateValidationCallback = (s, c, h, e) => true;

            var secureSocketOptions = _emailOptions.Smtp.EnableSsl
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.None;

            await client.ConnectAsync(_emailOptions.Smtp.Host, _emailOptions.Smtp.Port, secureSocketOptions);

            if (!string.IsNullOrEmpty(_emailOptions.Smtp.Username))
            {
                await client.AuthenticateAsync(_emailOptions.Smtp.Username, _emailOptions.Smtp.Password);
            }

            var response = await client.SendAsync(message);
            _logger.LogInformation("SMTP server response: {Response}", response);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent to {RecipientCount} recipients via {Host}:{Port}. Subject: {Subject}",
                recipients.Count, _emailOptions.Smtp.Host, _emailOptions.Smtp.Port, subject);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending market report email via SMTP");
            return false;
        }
    }

    public async Task<bool> SendNotificationEmailAsync(string to, string subject, string htmlBody)
    {
        if (string.IsNullOrEmpty(_emailOptions.Smtp.Host))
        {
            _logger.LogWarning("SMTP host not configured - notification email will not be sent");
            return false;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_emailOptions.FromName, _emailOptions.FromEmail));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
        message.Body = bodyBuilder.ToMessageBody();

        try
        {
            using var client = new SmtpClient();
            client.ServerCertificateValidationCallback = (s, c, h, e) => true;

            var secureSocketOptions = _emailOptions.Smtp.EnableSsl
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.None;

            await client.ConnectAsync(_emailOptions.Smtp.Host, _emailOptions.Smtp.Port, secureSocketOptions);

            if (!string.IsNullOrEmpty(_emailOptions.Smtp.Username))
            {
                await client.AuthenticateAsync(_emailOptions.Smtp.Username, _emailOptions.Smtp.Password);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Notification email sent to {To}: {Subject}", to, subject);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending notification email to {To}", to);
            return false;
        }
    }

    public string BuildHtmlReport(MarketReport report)
    {
        var data = report.Analysis;
        var tweets = report.TweetData;

        var isCrypto = report.Domain == AnalysisDomain.Crypto;
        var reportTitle = isCrypto ? "Crypto Intelligence Report" : "Market Intelligence Report";
        var headerGradient = isCrypto
            ? "linear-gradient(135deg, #4a148c, #7b1fa2)"
            : "linear-gradient(135deg, #1a237e, #283593)";
        var agentName = isCrypto ? "Crypto Intelligence Agent" : "Market Intelligence Agent";

        var sentimentColor = data.OverallSentiment switch
        {
            MarketSentiment.VeryBullish => "#1b5e20",
            MarketSentiment.Bullish => "#2e7d32",
            MarketSentiment.Neutral => "#f57f17",
            MarketSentiment.Bearish => "#c62828",
            MarketSentiment.VeryBearish => "#b71c1c",
            _ => "#666"
        };

        var sentimentEmoji = data.OverallSentiment switch
        {
            MarketSentiment.VeryBullish => "🟢🟢",
            MarketSentiment.Bullish => "🟢",
            MarketSentiment.Neutral => "🟡",
            MarketSentiment.Bearish => "🔴",
            MarketSentiment.VeryBearish => "🔴🔴",
            _ => "⚪"
        };

        var sentimentChartUrl = BuildSentimentChartUrl(data);
        var sectorChartUrl = data.SectorBreakdown.Any() ? BuildSectorChartUrl(data) : "";

        var signalsHtml = "";
        if (data.TradingSignals.Any())
        {
            signalsHtml = $@"
    <div class='section'>
        <h2>Trading Signals</h2>
        <table class='table'>
            <tr>
                <th>Ticker</th>
                <th>Direction</th>
                <th>Confidence</th>
                <th>Timeframe</th>
                <th>Rationale</th>
            </tr>
            {string.Join("", data.TradingSignals.Select(s =>
            {
                var dirColor = s.Direction switch
                {
                    SignalDirection.StrongBuy => "#1b5e20",
                    SignalDirection.Buy => "#2e7d32",
                    SignalDirection.Hold => "#f57f17",
                    SignalDirection.Sell => "#c62828",
                    SignalDirection.StrongSell => "#b71c1c",
                    _ => "#666"
                };
                var tweetLinksHtml = s.SourceTweetUrls?.Any() == true
                    ? $"<div style='margin-top: 6px;'>{string.Join(" ", s.SourceTweetUrls.Select(url => { var handle = System.Text.RegularExpressions.Regex.Match(url, @"x\.com/([^/]+)").Groups[1].Value; return $"<a href='{url}' style='color: #0288d1; font-size: 11px; text-decoration: none; background: #e1f5fe; padding: 2px 6px; border-radius: 4px; margin-right: 4px;'>@{(string.IsNullOrEmpty(handle) ? "tweet" : handle)}</a>"; }))}</div>"
                    : "";
                return $@"
            <tr>
                <td><strong>${s.Ticker}</strong></td>
                <td style='color: {dirColor}; font-weight: bold;'>{s.Direction}</td>
                <td>{s.Confidence}</td>
                <td>{s.Timeframe}</td>
                <td>{s.Rationale}{tweetLinksHtml}</td>
            </tr>";
            }))}
        </table>
    </div>";
        }

        var recommendationsHtml = "";
        if (data.Recommendations.Any())
        {
            recommendationsHtml = $@"
    <div class='section' style='border-left: 4px solid #1565c0;'>
        <h2>Actionable Recommendations</h2>
        <ol>
            {string.Join("", data.Recommendations.OrderBy(r => r.Priority).Select(r =>
            {
                var riskColor = r.RiskLevel.ToUpperInvariant() switch
                {
                    "LOW" => "#2e7d32",
                    "MEDIUM" => "#f57f17",
                    "HIGH" => "#c62828",
                    _ => "#666"
                };
                return $@"
            <li style='margin: 12px 0;'>
                <strong>{r.Action}</strong><br/>
                <span style='color: {riskColor}; font-size: 12px;'>Risk: {r.RiskLevel}</span>
                <span style='color: #666; font-size: 12px;'> | Timeframe: {r.Timeframe}</span><br/>
                <span style='font-size: 13px; color: #555;'>{r.Reasoning}</span>
            </li>";
            }))}
        </ol>
    </div>";
        }

        var expertSentimentsHtml = "";
        if (data.ExpertSentiments.Any())
        {
            var expertCardsHtml = string.Join("", data.ExpertSentiments.Select(e =>
            {
                var sColor = e.Sentiment switch
                {
                    MarketSentiment.VeryBullish or MarketSentiment.Bullish => "#2e7d32",
                    MarketSentiment.Neutral => "#f57f17",
                    _ => "#c62828"
                };
                var sEmoji = e.Sentiment switch
                {
                    MarketSentiment.VeryBullish => "🟢🟢",
                    MarketSentiment.Bullish => "🟢",
                    MarketSentiment.Neutral => "🟡",
                    MarketSentiment.Bearish => "🔴",
                    MarketSentiment.VeryBearish => "🔴🔴",
                    _ => "⚪"
                };
                var notableCallsHtml = e.NotableCalls.Any()
                    ? $"<div style='margin-top: 8px;'><strong>Notable calls:</strong> {string.Join(", ", e.NotableCalls.Select(c => $"<span style='background: #e8eaf6; padding: 2px 6px; border-radius: 4px; font-size: 12px;'>{c}</span>"))}</div>"
                    : "";
                var detailHtml = !string.IsNullOrEmpty(e.DetailedAnalysis)
                    ? $"<p style='color: #444; font-size: 13px; margin: 8px 0 4px 0;'>{e.DetailedAnalysis}</p>"
                    : "";
                return $@"
            <div style='border: 1px solid #e0e0e0; border-left: 4px solid {sColor}; border-radius: 0 8px 8px 0; padding: 15px; margin-bottom: 12px;'>
                <div style='display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;'>
                    <strong style='font-size: 15px;'>@{e.ExpertHandle}</strong>
                    <span style='color: {sColor}; font-weight: bold;'>{sEmoji} {e.Sentiment}</span>
                </div>
                <div style='background: #f8f9fa; padding: 10px; border-radius: 6px; font-size: 14px; font-style: italic; color: #333;'>
                    {e.KeyTakeaway}
                </div>
                {detailHtml}
                {notableCallsHtml}
            </div>";
            }));

            expertSentimentsHtml = $@"
    <div class='section'>
        <h2>Expert Analysis (by Expert)</h2>
        <p style='color: #666; font-size: 13px; margin-bottom: 15px;'>Detailed breakdown of each expert's position, key tweets, and notable calls — justifying the overall sentiment and recommendations above.</p>
        {expertCardsHtml}
    </div>";
        }

        var risksHtml = "";
        if (data.RiskFactors.Any())
        {
            risksHtml = $@"
    <div class='section' style='background-color: #fff8e1; border-left: 4px solid #ff9800;'>
        <h2>Risk Factors</h2>
        <ul>
            {string.Join("", data.RiskFactors.Select(r => $"<li>{r}</li>"))}
        </ul>
    </div>";
        }

        var sectorChartHtml = !string.IsNullOrEmpty(sectorChartUrl)
            ? $@"
    <div class='section'>
        <h2>Sector Sentiment</h2>
        <div class='chart'>
            <img src='{sectorChartUrl}' alt='Sector Sentiment Chart' />
        </div>
    </div>"
            : "";

        var html = $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }}
        .header {{ background: {headerGradient}; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
        .header h1 {{ margin: 0; font-size: 24px; }}
        .header p {{ margin: 5px 0 0 0; opacity: 0.9; }}
        .metrics {{ display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px; }}
        .metric {{ background: #f8f9fa; border-radius: 8px; padding: 15px; flex: 1; min-width: 150px; text-align: center; }}
        .metric-value {{ font-size: 28px; font-weight: bold; }}
        .metric-label {{ font-size: 12px; color: #666; text-transform: uppercase; }}
        .section {{ background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px; }}
        .section h2 {{ margin-top: 0; color: #1a237e; border-bottom: 2px solid #3f51b5; padding-bottom: 10px; }}
        .chart {{ text-align: center; margin: 20px 0; }}
        .chart img {{ max-width: 100%; height: auto; border-radius: 8px; }}
        .table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
        .table th, .table td {{ padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0; }}
        .table th {{ background: #f8f9fa; font-weight: 600; }}
        .insights {{ background: #e3f2fd; border-left: 4px solid #1565c0; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }}
        .disclaimer {{ background: #fafafa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; font-size: 11px; color: #888; margin-top: 20px; }}
        ul, ol {{ padding-left: 20px; }}
        li {{ margin: 8px 0; }}
    </style>
</head>
<body>
    <div class='header'>
        <h1>{reportTitle} {sentimentEmoji}</h1>
        <p>{report.GeneratedAt:MMMM dd, yyyy HH:mm} UTC | {tweets.TotalTweetsCollected} tweets from {tweets.ExpertsQueried.Count} experts</p>
        <p>Data source: {tweets.DataSource}</p>
    </div>

    <div class='metrics'>
        <div class='metric'>
            <div class='metric-value' style='color: {sentimentColor};'>{data.OverallSentiment}</div>
            <div class='metric-label'>Overall Sentiment</div>
        </div>
        <div class='metric'>
            <div class='metric-value'>{data.SentimentScore:+0.00;-0.00;0.00}</div>
            <div class='metric-label'>Sentiment Score (-1 to +1)</div>
        </div>
        <div class='metric'>
            <div class='metric-value'>{data.TradingSignals.Count}</div>
            <div class='metric-label'>Trading Signals</div>
        </div>
        <div class='metric'>
            <div class='metric-value'>{tweets.TotalTweetsCollected}</div>
            <div class='metric-label'>Tweets Analyzed</div>
        </div>
    </div>

    <div class='section'>
        <h2>Executive Summary</h2>
        <div class='insights'>
            <p>{data.ExecutiveSummary}</p>
        </div>
        {(data.KeyThemes.Any() ? $@"
        <h3>Key Themes</h3>
        <ul>
            {string.Join("", data.KeyThemes.Select(t => $"<li>{t}</li>"))}
        </ul>" : "")}
    </div>

    <div class='section'>
        <h2>Sentiment Overview</h2>
        <div class='chart'>
            <img src='{sentimentChartUrl}' alt='Sentiment Distribution Chart' />
        </div>
    </div>

    {signalsHtml}

    {sectorChartHtml}

    {expertSentimentsHtml}

    {recommendationsHtml}

    {risksHtml}

    <div class='disclaimer'>
        <strong>Disclaimer:</strong> This report is generated automatically based on social media sentiment analysis and does not constitute financial advice.
        Past expert predictions do not guarantee future accuracy. Always perform your own due diligence before making investment decisions.
        This is for informational purposes only.
    </div>

    <div class='footer'>
        <p>Generated by {agentName} v{Models.CommonStatics.Version}</p>
        <p>Report ID: {report.Id}</p>
        <p style='margin-top: 10px; font-size: 11px; color: #999;'>
            You are receiving this because you subscribed to our newsletter.
            <a href='{{{{UNSUBSCRIBE_URL}}}}' style='color: #999; text-decoration: underline;'>Manage subscription</a> |
            <a href='{{{{UNSUBSCRIBE_URL}}}}' style='color: #999; text-decoration: underline;'>Unsubscribe</a>
        </p>
    </div>
</body>
</html>";

        return html;
    }

    private string BuildSentimentChartUrl(MarketAnalysisResult data)
    {
        var bullishCount = data.ExpertSentiments.Count(e =>
            e.Sentiment is MarketSentiment.Bullish or MarketSentiment.VeryBullish);
        var bearishCount = data.ExpertSentiments.Count(e =>
            e.Sentiment is MarketSentiment.Bearish or MarketSentiment.VeryBearish);
        var neutralCount = data.ExpertSentiments.Count(e =>
            e.Sentiment is MarketSentiment.Neutral);

        if (bullishCount == 0 && bearishCount == 0 && neutralCount == 0)
        {
            var score = data.SentimentScore;
            bullishCount = score > 0 ? (int)(score * 10) + 1 : 0;
            bearishCount = score < 0 ? (int)(Math.Abs(score) * 10) + 1 : 0;
            neutralCount = score == 0 ? 1 : 0;
        }

        var config = new
        {
            type = "doughnut",
            data = new
            {
                labels = new[] { "Bullish", "Bearish", "Neutral" },
                datasets = new[]
                {
                    new
                    {
                        data = new[] { bullishCount, bearishCount, neutralCount },
                        backgroundColor = new[] { "#2e7d32", "#c62828", "#f57f17" }
                    }
                }
            },
            options = new
            {
                title = new { display = true, text = "Expert Sentiment Distribution" },
                plugins = new { datalabels = new { display = true, color = "#fff", font = new { weight = "bold" } } }
            }
        };

        var json = Newtonsoft.Json.JsonConvert.SerializeObject(config);
        return $"https://quickchart.io/chart?c={HttpUtility.UrlEncode(json)}&w=350&h=280";
    }

    private string BuildSectorChartUrl(MarketAnalysisResult data)
    {
        var sectors = data.SectorBreakdown.Take(8).ToList();
        var config = new
        {
            type = "horizontalBar",
            data = new
            {
                labels = sectors.Select(s => s.Sector.Length > 15 ? s.Sector[..15] + "..." : s.Sector).ToArray(),
                datasets = new[]
                {
                    new
                    {
                        label = "Sentiment",
                        data = sectors.Select(s => s.Sentiment switch
                        {
                            MarketSentiment.VeryBullish => 2,
                            MarketSentiment.Bullish => 1,
                            MarketSentiment.Neutral => 0,
                            MarketSentiment.Bearish => -1,
                            MarketSentiment.VeryBearish => -2,
                            _ => 0
                        }).ToArray(),
                        backgroundColor = sectors.Select(s => s.Sentiment switch
                        {
                            MarketSentiment.VeryBullish or MarketSentiment.Bullish => "#2e7d32",
                            MarketSentiment.Neutral => "#f57f17",
                            _ => "#c62828"
                        }).ToArray()
                    }
                }
            },
            options = new
            {
                title = new { display = true, text = "Sector Sentiment (-2 Very Bearish to +2 Very Bullish)" },
                scales = new { x = new { min = -2, max = 2 } }
            }
        };

        var json = Newtonsoft.Json.JsonConvert.SerializeObject(config);
        return $"https://quickchart.io/chart?c={HttpUtility.UrlEncode(json)}&w=500&h=300";
    }

    private string BuildPlainTextReport(MarketReport report)
    {
        var data = report.Analysis;
        var tweets = report.TweetData;

        var isCrypto = report.Domain == AnalysisDomain.Crypto;
        var reportTitle = isCrypto ? "CRYPTO INTELLIGENCE REPORT" : "MARKET INTELLIGENCE REPORT";
        var agentName = isCrypto ? "Crypto Intelligence Agent" : "Market Intelligence Agent";

        var signalsText = data.TradingSignals.Any()
            ? $@"
TRADING SIGNALS
---------------
{string.Join("\n", data.TradingSignals.Select(s => { var urls = s.SourceTweetUrls?.Any() == true ? $"\n  Sources: {string.Join(", ", s.SourceTweetUrls)}" : ""; return $"${s.Ticker} | {s.Direction} | Confidence: {s.Confidence} | {s.Timeframe} | {s.Rationale}{urls}"; }))}"
            : "";

        var recsText = data.Recommendations.Any()
            ? $@"
ACTIONABLE RECOMMENDATIONS
--------------------------
{string.Join("\n", data.Recommendations.OrderBy(r => r.Priority).Select(r => $"{r.Priority}. {r.Action} (Risk: {r.RiskLevel}, {r.Timeframe}) - {r.Reasoning}"))}"
            : "";

        return $@"
{reportTitle}
{report.GeneratedAt:MMMM dd, yyyy HH:mm} UTC
Data source: {tweets.DataSource}

SUMMARY
-------
Overall Sentiment: {data.OverallSentiment} (Score: {data.SentimentScore:+0.00;-0.00;0.00})
Tweets Analyzed: {tweets.TotalTweetsCollected}
Experts Included: {tweets.ExpertsQueried.Count}

EXECUTIVE SUMMARY
-----------------
{data.ExecutiveSummary}

KEY THEMES
----------
{string.Join("\n", data.KeyThemes.Select(t => $"- {t}"))}
{signalsText}

EXPERT ANALYSIS (BY EXPERT)
---------------------------
{string.Join("\n\n", data.ExpertSentiments.Select(e =>
{
    var detail = !string.IsNullOrEmpty(e.DetailedAnalysis) ? $"\n  Analysis: {e.DetailedAnalysis}" : "";
    var calls = e.NotableCalls.Any() ? $"\n  Notable calls: {string.Join(", ", e.NotableCalls)}" : "";
    return $"@{e.ExpertHandle}: {e.Sentiment} - {e.KeyTakeaway}{detail}{calls}";
}))}

RISK FACTORS
------------
{string.Join("\n", data.RiskFactors.Select(r => $"- {r}"))}
{recsText}

---
DISCLAIMER: This report is generated automatically based on social media sentiment analysis
and does not constitute financial advice. Always perform your own due diligence.

Generated by {agentName} v{Models.CommonStatics.Version}
Report ID: {report.Id}

Manage your subscription or unsubscribe: {{{{UNSUBSCRIBE_URL}}}}
";
    }
}
