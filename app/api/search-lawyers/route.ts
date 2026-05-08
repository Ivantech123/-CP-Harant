import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://harant.ru';

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'ru-RU,ru;q=0.9',
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.text();
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const city = searchParams.get('city') || undefined;
  const specialization = searchParams.get('specialization') || undefined;
  const name = searchParams.get('name') || undefined;

  try {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (specialization) params.set('specialization', specialization);
    if (name) params.set('name', name);

    const url = `${BASE_URL}/lawyers/?${params.toString()}`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    const results: Array<{
      name: string;
      city: string;
      specialization: string;
      profileUrl: string;
      rating?: number;
    }> = [];

    const cardSelectors = [
      '.lawyer-card', '.lawyer-item', '.specialist-card',
      '[class*="lawyer"]', '[class*="specialist"]', '.card'
    ];

    let cards = $('');
    for (const sel of cardSelectors) {
      cards = $(sel);
      if (cards.length > 0) break;
    }

    if (cards.length === 0) {
      $('a[href*="/lawyers/"], a[href*="/specialist/"]').each((_, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();
        if (text && href) {
          results.push({
            name: text,
            city: city || 'Не указан',
            specialization: specialization || 'Не указана',
            profileUrl: href.startsWith('http') ? href : `${BASE_URL}${href}`,
          });
        }
      });
    } else {
      cards.each((_, el) => {
        const card = $(el);
        const nameEl = card.find('[class*="name"], h2, h3, .title').first();
        const cityEl = card.find('[class*="city"], [class*="location"]').first();
        const specEl = card.find('[class*="spec"], [class*="category"]').first();
        const linkEl = card.find('a').first();
        const ratingEl = card.find('[class*="rating"], [class*="score"]').first();

        const lawyerName = nameEl.text().trim();
        const href = linkEl.attr('href') || '';

        if (lawyerName) {
          results.push({
            name: lawyerName,
            city: cityEl.text().trim() || city || 'Не указан',
            specialization: specEl.text().trim() || specialization || 'Не указана',
            profileUrl: href.startsWith('http') ? href : `${BASE_URL}${href}`,
            rating: parseFloat(ratingEl.text()) || undefined,
          });
        }
      });
    }

    return NextResponse.json({
      results,
      total: results.length,
      metadata: { timestamp: new Date().toISOString(), source: 'harant.ru' }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
