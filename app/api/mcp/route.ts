import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
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

const handler = createMcpHandler(
  (server) => {
    // Tool 1: Search lawyers
    server.tool(
      'search_lawyers',
      'Поиск юристов на портале Harant по городу, специализации или имени',
      {
        city: z.string().optional().describe('Город (например: Москва, Санкт-Петербург)'),
        specialization: z.string().optional().describe('Специализация (например: уголовное право)'),
        name: z.string().optional().describe('Имя или фамилия юриста'),
      },
      async ({ city, specialization, name }) => {
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

          // Try multiple selector patterns for robustness
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
            // Fallback: look for links with lawyer-like URLs
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

          if (results.length === 0) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  message: 'Юристы не найдены по заданным критериям',
                  results: [],
                  searchUrl: url,
                  metadata: { timestamp: new Date().toISOString(), source: 'harant.ru' }
                }, null, 2)
              }]
            };
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                results,
                total: results.length,
                metadata: { timestamp: new Date().toISOString(), source: 'harant.ru', cached: false }
              }, null, 2)
            }]
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: 'text', text: `Ошибка поиска: ${message}` }],
            isError: true
          };
        }
      }
    );

    // Tool 2: Get lawyer profile
    server.tool(
      'get_lawyer_profile',
      'Получение детального профиля юриста по URL с портала Harant',
      {
        profileUrl: z.string().url().describe('URL профиля юриста на harant.ru'),
      },
      async ({ profileUrl }) => {
        try {
          if (!profileUrl.includes('harant.ru')) {
            return {
              content: [{ type: 'text', text: 'Ошибка: URL должен быть с сайта harant.ru' }],
              isError: true
            };
          }

          const html = await fetchHtml(profileUrl);
          const $ = cheerio.load(html);

          // Extract profile data with multiple fallback selectors
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

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                profile,
                metadata: { timestamp: new Date().toISOString(), source: 'harant.ru', cached: false }
              }, null, 2)
            }]
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: 'text', text: `Ошибка получения профиля: ${message}` }],
            isError: true
          };
        }
      }
    );
  },
  {},
  { basePath: '/api' }
);

export { handler as GET, handler as POST, handler as DELETE };
