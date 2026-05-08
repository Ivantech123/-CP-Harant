import { createMcpHandler } from 'mcp-handler';
import { z } from 'zod';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://harant.ru';

// ─── City slug mapping ────────────────────────────────────────────────────────
const CITY_SLUGS: Record<string, string> = {
  'москва': 'moskva', 'мск': 'moskva',
  'санкт-петербург': 'sankt-peterburg', 'спб': 'sankt-peterburg', 'питер': 'sankt-peterburg',
  'новосибирск': 'novosibirsk', 'екатеринбург': 'ekaterinburg', 'казань': 'kazan',
  'нижний новгород': 'nizhnij-novgorod', 'нн': 'nizhnij-novgorod',
  'челябинск': 'chelyabinsk', 'самара': 'samara', 'омск': 'omsk',
  'ростов-на-дону': 'rostov-na-donu', 'ростов': 'rostov-na-donu',
  'уфа': 'ufa', 'красноярск': 'krasnoyarsk', 'воронеж': 'voronezh',
  'пермь': 'perm', 'волгоград': 'volgograd', 'краснодар': 'krasnodar',
  'саратов': 'saratov', 'тюмень': 'tyumen', 'тольятти': 'tolyatti',
  'ижевск': 'izhevsk', 'барнаул': 'barnaul', 'ульяновск': 'ulyanovsk',
  'иркутск': 'irkutsk', 'хабаровск': 'habarovsk', 'ярославль': 'yaroslavl',
  'владивосток': 'vladivostok', 'махачкала': 'mahachkala', 'томск': 'tomsk',
  'оренбург': 'orenburg', 'кемерово': 'kemerovo', 'новокузнецк': 'novokuzneczk',
  'рязань': 'ryazan', 'астрахань': 'astrahan', 'набережные челны': 'naberezhnye-chelny',
  'пенза': 'penza', 'липецк': 'lipeczk', 'тула': 'tula', 'киров': 'kirov',
  'чебоксары': 'cheboksary', 'калининград': 'kaliningrad', 'брянск': 'bryansk',
  'курск': 'kursk', 'иваново': 'ivanovo', 'магнитогорск': 'magnitogorsk',
  'тверь': 'tver', 'ставрополь': 'stavropol', 'белгород': 'belgorod',
  'нижний тагил': 'nizhnij-tagil', 'архангельск': 'arhangelsk', 'владимир': 'vladimir',
  'сочи': 'sochi', 'саранск': 'saransk', 'чита': 'chita', 'якутск': 'yakutsk',
  'улан-удэ': 'ulan-ude', 'мурманск': 'murmansk', 'смоленск': 'smolensk',
  'вологда': 'vologda', 'череповец': 'cherepovecz', 'владикавказ': 'vladikavkaz',
  'грозный': 'groznyj', 'нальчик': 'nalchik', 'сыктывкар': 'syktyvkar',
  'петрозаводск': 'petrozavodsk', 'орел': 'oryol', 'орёл': 'oryol',
  'тамбов': 'tambov', 'кострома': 'kostroma', 'йошкар-ола': 'joshkar-ola',
  'псков': 'pskov', 'великий новгород': 'velikij-novgorod', 'калуга': 'kaluga',
};

// ─── Specialization synonyms → harant category slugs ─────────────────────────
const SPEC_SYNONYMS: Record<string, string[]> = {
  'уголовное право': ['уголовка', 'уголовный', 'уголовные дела', 'уголовное', 'криминал', 'убийство', 'кража', 'мошенничество'],
  'семейные дела': ['развод', 'семья', 'семейный', 'алименты', 'брак', 'расторжение брака', 'семейное право'],
  'алименты': ['алименты', 'алиментщик', 'взыскание алиментов'],
  'жилищные вопросы': ['жилье', 'жилищный', 'квартира', 'жкх', 'коммуналка', 'выселение', 'жилищное право'],
  'земельные вопросы': ['земля', 'земельный', 'участок', 'межевание', 'кадастр', 'земельное право'],
  'наследство': ['наследство', 'наследник', 'завещание', 'наследование'],
  'трудовое право': ['труд', 'трудовой', 'увольнение', 'зарплата', 'работа', 'трудовые споры'],
  'административное право': ['административный', 'штраф', 'гибдд', 'административное'],
  'арбитраж': ['арбитраж', 'арбитражный суд', 'бизнес споры'],
  'банкротство физических лиц': ['банкротство', 'банкрот', 'долги', 'списание долгов'],
  'защита прав потребителя': ['потребитель', 'защита прав', 'некачественный товар', 'возврат товара'],
  'возмещение ущерба': ['ущерб', 'компенсация', 'возмещение', 'вред'],
  'раздел имущества': ['раздел имущества', 'имущество', 'раздел', 'совместное имущество'],
  'недвижимость': ['недвижимость', 'дом', 'квартира', 'купля-продажа'],
  'автоюристы': ['авто', 'дтп', 'автомобиль', 'страховка', 'осаго', 'каско', 'автоюрист'],
  'гражданские дела': ['гражданский', 'гражданское право', 'гражданские'],
  'взыскание задолженности': ['долг', 'задолженность', 'взыскание', 'кредит'],
  'уголовные дела': ['уголовное', 'уголовный адвокат'],
};

// ─── Normalize specialization query to canonical form ────────────────────────
function normalizeSpec(query: string): string {
  const q = query.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(SPEC_SYNONYMS)) {
    if (canonical.includes(q) || synonyms.some(s => s.includes(q) || q.includes(s))) {
      return canonical;
    }
  }
  return q;
}

// ─── Fuzzy name matching ──────────────────────────────────────────────────────
function fuzzyNameMatch(lawyerName: string, query: string): number {
  const name = lawyerName.toLowerCase();
  const q = query.toLowerCase().trim();
  const qParts = q.split(/\s+/);
  const nameParts = name.split(/\s+/);

  let score = 0;

  // Exact full match
  if (name === q) return 100;

  // Each query word checked against name parts
  for (const qPart of qParts) {
    if (qPart.length < 2) continue;
    for (const nPart of nameParts) {
      if (nPart === qPart) { score += 30; break; }
      if (nPart.startsWith(qPart)) { score += 20; break; }
      if (nPart.includes(qPart)) { score += 10; break; }
      // Levenshtein-like: allow 1 char difference for words > 4 chars
      if (qPart.length > 4 && levenshtein(nPart, qPart) <= 1) { score += 15; break; }
    }
  }

  return score;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[m][n];
}

function getCitySlug(city: string): string {
  const lower = city.toLowerCase().trim();
  return CITY_SLUGS[lower] || lower.replace(/\s+/g, '-');
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'ru-RU,ru;q=0.9',
    },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.text();
}

// ─── Parse lawyers from a listing page ───────────────────────────────────────
interface LawyerCard {
  name: string;
  city: string;
  specialization: string[];
  profileUrl: string;
  rating?: number;
  experience?: string;
  reviewCount?: number;
  caseCount?: number;
  relevanceScore?: number;
}

function parseLawyerCards($: cheerio.CheerioAPI, cityName: string): LawyerCard[] {
  const results: LawyerCard[] = [];
  const seen = new Set<string>();

  $('a[href*="/lawyers/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (!/\/lawyers\/[^/]+\/[^/]+\/$/.test(href) || href.includes('/cat/')) return;

    const profileUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
    if (seen.has(profileUrl)) return;
    seen.add(profileUrl);

    const lawyerName = $(el).text().trim();
    if (!lawyerName || lawyerName.length < 3) return;

    // Walk up to find the card container
    const container = $(el).closest('article, section, [class*="lawyer"], [class*="card"], li').first()
      || $(el).parent().parent();

    const containerText = container.text();

    // Specializations
    const specs: string[] = [];
    container.find('a[href*="/cat/"]').each((_, specEl) => {
      const s = $(specEl).text().trim();
      if (s && !specs.includes(s)) specs.push(s);
    });

    // Rating — look for decimal number like 9.8 or 10.0
    const ratingMatch = containerText.match(/\b(10\.0|[1-9]\.\d)\b/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

    // Experience
    const expMatch = containerText.match(/[Сс]таж\s+(?:более\s+)?(\d+)\s+лет/);
    const experience = expMatch ? expMatch[0] : undefined;

    // Review count
    const reviewMatch = containerText.match(/(\d+)\s+отзыв/);
    const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : 0;

    // Case count
    const caseMatch = containerText.match(/(\d+)\s+судебн/);
    const caseCount = caseMatch ? parseInt(caseMatch[1]) : 0;

    results.push({
      name: lawyerName,
      city: cityName,
      specialization: specs,
      profileUrl,
      rating,
      experience,
      reviewCount,
      caseCount,
    });
  });

  return results;
}

const handler = createMcpHandler(
  (server) => {

    // ── Tool 1: search_lawyers ──────────────────────────────────────────────
    server.tool(
      'search_lawyers',
      `Умный поиск юристов на портале Harant.ru.
Поддерживает:
- поиск по городу (Москва, Саранск, Краснодар и др.)
- поиск по специализации с синонимами ("развод" → семейные дела, "уголовка" → уголовное право)
- нечёткий поиск по имени (опечатки, частичное совпадение)
- сортировку по рейтингу, отзывам, опыту
- фильтр по минимальному рейтингу и опыту
Возвращает список юристов с рейтингом, специализациями, опытом и ссылками на профили.`,
      {
        city: z.string().optional().describe('Город поиска (например: Москва, Саранск). Если не указан — поиск по всей России'),
        specialization: z.string().optional().describe('Специализация или синоним: "развод", "уголовка", "банкротство", "дтп", "алименты" и т.д.'),
        name: z.string().optional().describe('Имя или фамилия юриста (поддерживает нечёткий поиск)'),
        minRating: z.number().optional().describe('Минимальный рейтинг (например: 8.0)'),
        minExperience: z.number().optional().describe('Минимальный стаж в годах (например: 10)'),
        sortBy: z.enum(['rating', 'reviews', 'cases', 'relevance']).optional().describe('Сортировка: rating (рейтинг), reviews (отзывы), cases (дела), relevance (релевантность)'),
        limit: z.number().optional().describe('Максимальное количество результатов (по умолчанию 20)'),
      },
      async ({ city, specialization, name, minRating, minExperience, sortBy = 'rating', limit = 20 }) => {
        try {
          // Normalize specialization using synonyms
          const normalizedSpec = specialization ? normalizeSpec(specialization) : undefined;

          // Build search URL
          let url: string;
          if (city) {
            const slug = getCitySlug(city);
            if (normalizedSpec) {
              // Try category URL: /lawyers/{city}/cat/{spec-slug}/
              const specSlug = normalizedSpec.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-zа-яё-]/gi, '');
              // First try city page and filter client-side (more reliable)
              url = `${BASE_URL}/lawyers/${slug}/`;
            } else {
              url = `${BASE_URL}/lawyers/${slug}/`;
            }
          } else {
            url = `${BASE_URL}/lawyers/`;
          }

          const html = await fetchHtml(url);
          const $ = cheerio.load(html);
          let results = parseLawyerCards($, city || 'Россия');

          // ── Semantic filtering ──────────────────────────────────────────

          // Filter by name (fuzzy)
          if (name) {
            results = results
              .map(r => ({ ...r, relevanceScore: fuzzyNameMatch(r.name, name) }))
              .filter(r => (r.relevanceScore || 0) > 0);
          }

          // Filter by specialization (semantic)
          if (normalizedSpec) {
            results = results.filter(r => {
              if (r.specialization.length === 0) return true; // no specs = include
              return r.specialization.some(s => {
                const sLow = s.toLowerCase();
                return sLow.includes(normalizedSpec) ||
                  normalizedSpec.includes(sLow) ||
                  // Check synonyms
                  (SPEC_SYNONYMS[normalizedSpec] || []).some(syn => sLow.includes(syn));
              });
            });
          }

          // Filter by minimum rating
          if (minRating !== undefined) {
            results = results.filter(r => r.rating !== undefined && r.rating >= minRating);
          }

          // Filter by minimum experience
          if (minExperience !== undefined) {
            results = results.filter(r => {
              if (!r.experience) return false;
              const years = parseInt(r.experience.match(/(\d+)/)?.[1] || '0');
              return years >= minExperience;
            });
          }

          // ── Sorting ─────────────────────────────────────────────────────
          results.sort((a, b) => {
            if (sortBy === 'reviews') return (b.reviewCount || 0) - (a.reviewCount || 0);
            if (sortBy === 'cases') return (b.caseCount || 0) - (a.caseCount || 0);
            if (sortBy === 'relevance') return (b.relevanceScore || 0) - (a.relevanceScore || 0);
            // Default: rating
            return (b.rating || 0) - (a.rating || 0);
          });

          // Limit results
          const limited = results.slice(0, limit);

          if (limited.length === 0) {
            // Suggest alternatives
            const suggestions: string[] = [];
            if (name) suggestions.push(`Попробуйте только фамилию: "${name.split(' ')[0]}"`);
            if (specialization && normalizedSpec !== specialization)
              suggestions.push(`Специализация нормализована как: "${normalizedSpec}"`);
            if (city) suggestions.push(`Попробуйте поиск без города`);

            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  message: 'Юристы не найдены по заданным критериям',
                  suggestions,
                  results: [],
                  searchUrl: url,
                  appliedFilters: { city, specialization: normalizedSpec, name, minRating, minExperience },
                  metadata: { timestamp: new Date().toISOString(), source: 'harant.ru' }
                }, null, 2)
              }]
            };
          }

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                results: limited,
                total: results.length,
                shown: limited.length,
                appliedFilters: {
                  city,
                  specialization: normalizedSpec,
                  originalSpecialization: specialization,
                  name,
                  minRating,
                  minExperience,
                  sortBy,
                },
                metadata: { timestamp: new Date().toISOString(), source: 'harant.ru' }
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

    // ── Tool 2: get_lawyer_profile ──────────────────────────────────────────
    server.tool(
      'get_lawyer_profile',
      `Получение полного профиля юриста по URL с портала Harant.
Возвращает: имя, город, специализации, опыт, рейтинг, контакты, описание,
судебные дела по категориям, суды в которых участвовал, аналитику.`,
      {
        profileUrl: z.string().url().describe('URL профиля юриста на harant.ru (например: https://harant.ru/lawyers/saransk/naumov-sergej-gennadevich-2/)'),
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
          const bodyText = $('body').text();

          // Name
          const name = $('h1').first().text().trim() ||
            $('[class*="name"]').first().text().trim() ||
            $('title').text().split('—')[0].trim();

          // City — extract from URL or page
          const cityFromUrl = profileUrl.match(/\/lawyers\/([^/]+)\//)?.[1]
            ?.replace(/-/g, ' ') || '';
          const city = $('[class*="city"], [class*="location"]').first().text().trim() || cityFromUrl;

          // Specializations from /cat/ links
          const specialization: string[] = [];
          $('a[href*="/cat/"]').each((_, el) => {
            const t = $(el).text().trim();
            if (t && !specialization.includes(t)) specialization.push(t);
          });

          // Experience
          const expMatch = bodyText.match(/[Сс]таж\s+(?:более\s+)?(\d+)\s+лет/);
          const experience = expMatch ? expMatch[0] : 'Не указан';
          const experienceYears = expMatch ? parseInt(expMatch[1]) : undefined;

          // Rating — look for standalone decimal like "6.8" or "10.0"
          const ratingMatch = bodyText.match(/\b(10\.0|[1-9]\.\d)\b/);
          const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

          // Review count
          const reviewMatch = bodyText.match(/(\d+)\s+отзыв/);
          const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : 0;

          // Case count total
          const totalCasesMatch = bodyText.match(/[Сс]удебных дел[а]?\s*\(?\s*(\d+)/);
          const totalCases = totalCasesMatch ? parseInt(totalCasesMatch[1]) : undefined;

          // Phone
          const phone = $('[href^="tel:"]').first().attr('href')?.replace('tel:', '') || '';

          // Telegram
          const telegram = $('a[href*="t.me"], a[href*="telegram"]').first().attr('href') || '';

          // Description — find longest meaningful text block
          let description = '';
          $('p, [class*="desc"], [class*="about"], [class*="bio"], [class*="text"]').each((_, el) => {
            const t = $(el).text().trim();
            if (t.length > description.length && t.length > 100 && t.length < 2000) {
              description = t;
            }
          });

          // ── Court cases by category ──────────────────────────────────────
          const cases: Record<string, string[]> = {};
          const casePattern = /\b\d+[А-Яа-яRS]*\d*-\d+\/\d{4}/g;

          // Try to find structured case sections
          const allText = bodyText;
          // Extract all case numbers first
          const allCaseNumbers = [...new Set(allText.match(casePattern) || [])];

          // Try to find category → cases structure in DOM
          let currentCat = '';
          $('*').each((_, el) => {
            const $el = $(el);
            if ($el.children().length > 0) return; // leaf nodes only
            const text = $el.text().trim();

            // Category header: Russian text, no numbers, short
            if (text.length > 3 && text.length < 60 &&
                /^[А-Яа-я]/.test(text) &&
                !text.match(/\d+-\d+\/\d{4}/) &&
                !text.includes('₽') && !text.includes('лет') &&
                !text.includes('отзыв')) {
              // Check if parent contains case numbers
              const parentText = $el.parent().text();
              if (parentText.match(casePattern)) {
                currentCat = text;
                if (!cases[currentCat]) cases[currentCat] = [];
              }
            }

            // Case number
            if (text.match(/^\d+[А-Яа-яRS]*\d*-\d+\/\d{4}/) && currentCat) {
              if (!cases[currentCat].includes(text)) {
                cases[currentCat].push(text);
              }
            }
          });

          // Fallback: dump all case numbers if structured parsing failed
          if (Object.keys(cases).length === 0 && allCaseNumbers.length > 0) {
            cases['Судебные дела'] = allCaseNumbers;
          }

          // ── Courts ───────────────────────────────────────────────────────
          const courts: Array<{ name: string; count: number }> = [];
          const courtMatches = bodyText.matchAll(/([А-Яа-я][А-Яа-я\s]+(?:суд|трибунал)[А-Яа-я\s]*?)\s*[—–-]\s*(\d+)/g);
          for (const m of courtMatches) {
            const courtName = m[1].trim();
            if (courtName.length < 60) {
              courts.push({ name: courtName, count: parseInt(m[2]) });
            }
          }

          // ── Case analytics ───────────────────────────────────────────────
          const casesByCategory: Record<string, number> = {};
          for (const [cat, nums] of Object.entries(cases)) {
            casesByCategory[cat] = nums.length;
          }

          const profile = {
            name,
            city,
            specialization,
            experience,
            experienceYears,
            rating,
            reviewCount,
            totalCases,
            contacts: { phone, telegram },
            description: description.slice(0, 800),
            profileUrl,
            cases,
            casesByCategory,
            courts,
          };

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                profile,
                summary: `${name} — юрист из ${city}. Стаж: ${experience}. Рейтинг: ${rating ?? 'н/д'}. Дел: ${totalCases ?? 0}. Специализации: ${specialization.slice(0, 5).join(', ')}.`,
                metadata: { timestamp: new Date().toISOString(), source: 'harant.ru' }
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
