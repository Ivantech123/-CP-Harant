import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://harant.ru';

// Map of Russian city names to harant.ru URL slugs
const CITY_SLUGS: Record<string, string> = {
  'москва': 'moskva',
  'санкт-петербург': 'sankt-peterburg',
  'спб': 'sankt-peterburg',
  'питер': 'sankt-peterburg',
  'новосибирск': 'novosibirsk',
  'екатеринбург': 'ekaterinburg',
  'казань': 'kazan',
  'нижний новгород': 'nizhnij-novgorod',
  'челябинск': 'chelyabinsk',
  'самара': 'samara',
  'омск': 'omsk',
  'ростов-на-дону': 'rostov-na-donu',
  'ростов': 'rostov-na-donu',
  'уфа': 'ufa',
  'красноярск': 'krasnoyarsk',
  'воронеж': 'voronezh',
  'пермь': 'perm',
  'волгоград': 'volgograd',
  'краснодар': 'krasnodar',
  'саратов': 'saratov',
  'тюмень': 'tyumen',
  'тольятти': 'tolyatti',
  'ижевск': 'izhevsk',
  'барнаул': 'barnaul',
  'ульяновск': 'ulyanovsk',
  'иркутск': 'irkutsk',
  'хабаровск': 'habarovsk',
  'ярославль': 'yaroslavl',
  'владивосток': 'vladivostok',
  'махачкала': 'mahachkala',
  'томск': 'tomsk',
  'оренбург': 'orenburg',
  'кемерово': 'kemerovo',
  'новокузнецк': 'novokuzneczk',
  'рязань': 'ryazan',
  'астрахань': 'astrahan',
  'набережные челны': 'naberezhnye-chelny',
  'пенза': 'penza',
  'липецк': 'lipeczk',
  'тула': 'tula',
  'киров': 'kirov',
  'чебоксары': 'cheboksary',
  'калининград': 'kaliningrad',
  'брянск': 'bryansk',
  'курск': 'kursk',
  'иваново': 'ivanovo',
  'магнитогорск': 'magnitogorsk',
  'тверь': 'tver',
  'ставрополь': 'stavropol',
  'белгород': 'belgorod',
  'нижний тагил': 'nizhnij-tagil',
  'архангельск': 'arhangelsk',
  'владимир': 'vladimir',
  'сочи': 'sochi',
  'саранск': 'saransk',
  'чита': 'chita',
  'якутск': 'yakutsk',
  'улан-удэ': 'ulan-ude',
  'мурманск': 'murmansk',
  'смоленск': 'smolensk',
  'вологда': 'vologda',
  'череповец': 'cherepovecz',
  'владикавказ': 'vladikavkaz',
  'грозный': 'groznyj',
  'нальчик': 'nalchik',
  'сыктывкар': 'syktyvkar',
  'петрозаводск': 'petrozavodsk',
  'орел': 'oryol',
  'орёл': 'oryol',
  'тамбов': 'tambov',
  'кострома': 'kostroma',
  'йошкар-ола': 'joshkar-ola',
  'псков': 'pskov',
  'великий новгород': 'velikij-novgorod',
  'калуга': 'kaluga',
};

function getCitySlug(city: string): string {
  const lower = city.toLowerCase().trim();
  return CITY_SLUGS[lower] || lower.replace(/\s+/g, '-').replace(/[^a-zа-яё-]/gi, '');
}

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
        city: z.string().optional().describe('Город (например: Москва, Саранск, Краснодар)'),
        specialization: z.string().optional().describe('Специализация (например: уголовное право)'),
        name: z.string().optional().describe('Имя или фамилия юриста для фильтрации'),
      },
      async ({ city, specialization, name }) => {
        try {
          // Build URL: harant.ru/lawyers/{city-slug}/
          let url: string;
          if (city) {
            const slug = getCitySlug(city);
            url = `${BASE_URL}/lawyers/${slug}/`;
          } else {
            url = `${BASE_URL}/lawyers/`;
          }

          const html = await fetchHtml(url);
          const $ = cheerio.load(html);

          const results: Array<{
            name: string;
            city: string;
            specialization: string[];
            profileUrl: string;
            rating?: number;
            experience?: string;
          }> = [];

          // Parse lawyer cards — harant uses <article> or divs with lawyer links
          // Each lawyer has a link like /lawyers/{city}/{slug}/
          const lawyerLinks = new Set<string>();

          $('a[href*="/lawyers/"]').each((_, el) => {
            const href = $(el).attr('href') || '';
            // Match profile URLs: /lawyers/{city}/{name-slug}/
            if (/\/lawyers\/[^/]+\/[^/]+\/$/.test(href) && !href.includes('/cat/')) {
              lawyerLinks.add(href.startsWith('http') ? href : `${BASE_URL}${href}`);
            }
          });

          // For each unique lawyer link, extract info from surrounding context
          $('a[href*="/lawyers/"]').each((_, el) => {
            const href = $(el).attr('href') || '';
            if (!/\/lawyers\/[^/]+\/[^/]+\/$/.test(href) || href.includes('/cat/')) return;

            const profileUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
            const lawyerName = $(el).text().trim();
            if (!lawyerName || lawyerName.length < 3) return;

            // Get parent container for more info
            const container = $(el).closest('article, .lawyer-item, [class*="lawyer"], li, div').first();
            
            // Extract specializations from nearby links
            const specs: string[] = [];
            container.find('a[href*="/cat/"]').each((_, specEl) => {
              const spec = $(specEl).text().trim();
              if (spec) specs.push(spec);
            });

            // Extract rating
            const ratingText = container.find('[class*="rating"], [class*="score"]').first().text().trim();
            const rating = parseFloat(ratingText) || undefined;

            // Extract experience
            const expText = container.text().match(/[Сс]таж\s+(?:более\s+)?(\d+)\s+лет/)?.[0] || '';

            // Filter by name if provided
            if (name) {
              const nameLower = name.toLowerCase();
              if (!lawyerName.toLowerCase().includes(nameLower)) return;
            }

            // Filter by specialization if provided
            if (specialization && specs.length > 0) {
              const specLower = specialization.toLowerCase();
              const hasSpec = specs.some(s => s.toLowerCase().includes(specLower));
              if (!hasSpec) return;
            }

            // Avoid duplicates
            if (results.some(r => r.profileUrl === profileUrl)) return;

            results.push({
              name: lawyerName,
              city: city || 'Не указан',
              specialization: specs.length > 0 ? specs : ['Не указана'],
              profileUrl,
              rating,
              experience: expText || undefined,
            });
          });

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
