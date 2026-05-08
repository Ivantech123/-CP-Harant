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
  const profileUrl = searchParams.get('profileUrl');

  if (!profileUrl) {
    return NextResponse.json({ error: 'profileUrl parameter is required' }, { status: 400 });
  }

  if (!profileUrl.includes('harant.ru')) {
    return NextResponse.json({ error: 'URL должен быть с сайта harant.ru' }, { status: 400 });
  }

  try {
    const html = await fetchHtml(profileUrl);
    const $ = cheerio.load(html);

    const getName = () =>
      $('h1').first().text().trim() ||
      $('[class*="profile-name"], [class*="lawyer-name"]').first().text().trim() ||
      $('title').text().replace(/[|\-–].*/,'').trim();

    const getCity = () =>
      $('[class*="city"], [class*="location"], [class*="region"]').first().text().trim();

    const getSpecs = () => {
      const specs: string[] = [];
      $('[class*="spec"], [class*="practice"], [class*="category"]').each((_, el) => {
        const t = $(el).text().trim();
        if (t && t.length < 100) specs.push(t);
      });
      return specs.length > 0 ? specs : ['Не указана'];
    };

    const getExperience = () =>
      $('[class*="experience"], [class*="exp"], [class*="years"]').first().text().trim() ||
      'Не указан';

    const getPhone = () =>
      $('[class*="phone"], [href^="tel:"]').first().text().trim() ||
      $('[href^="tel:"]').first().attr('href')?.replace('tel:', '') || '';

    const getEmail = () =>
      $('[class*="email"], [href^="mailto:"]').first().text().trim() ||
      $('[href^="mailto:"]').first().attr('href')?.replace('mailto:', '') || '';

    const getRating = () => {
      const r = $('[class*="rating"], [class*="score"], [class*="stars"]').first().text().trim();
      return parseFloat(r) || undefined;
    };

    const getDescription = () =>
      $('[class*="description"], [class*="about"], [class*="bio"]').first().text().trim().slice(0, 500);

    const profile = {
      name: getName(),
      city: getCity(),
      specialization: getSpecs(),
      experience: getExperience(),
      contacts: {
        phone: getPhone(),
        email: getEmail(),
      },
      rating: getRating(),
      description: getDescription(),
      profileUrl,
    };

    return NextResponse.json({
      profile,
      metadata: { timestamp: new Date().toISOString(), source: 'harant.ru' }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
