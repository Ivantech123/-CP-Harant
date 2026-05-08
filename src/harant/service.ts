import * as cheerio from 'cheerio';
import type { ContactInfo, LawyerProfile, LawyerSearchResult } from '../types/lawyer';

const BASE_URL = 'https://harant.ru';
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 25;

const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 HarantMCP/1.0',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.6',
};

export interface SearchLawyersInput {
  city?: string;
  specialization?: string;
  name?: string;
  limit?: number;
  page?: number;
}

export interface GetLawyerProfileInput {
  profileUrl: string;
}

export interface HarantMetadata {
  source: string;
  timestamp: string;
  url: string;
  cached: false;
  appliedFilters?: {
    city?: string;
    specialization?: string;
    name?: string;
    limit: number;
    page: number;
  };
  warnings?: string[];
}

export interface EnrichedLawyerSearchResult extends LawyerSearchResult {
  specializations: string[];
  experience?: string;
  reviewCount?: number;
  caseCount?: number;
  profileKind?: string;
  description?: string;
  servicesPreview?: string[];
}

export interface EnrichedLawyerProfile extends LawyerProfile {
  profileUrl: string;
  profileKind?: string;
  reviewCount?: number;
  caseCount?: number;
  services?: string[];
  workHistory?: string[];
}

export interface SearchLawyersResponse {
  results: EnrichedLawyerSearchResult[];
  total: number;
  metadata: HarantMetadata;
}

export interface LawyerProfileResponse {
  profile: EnrichedLawyerProfile;
  metadata: HarantMetadata;
}

export class HarantServiceError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
    public readonly retryable = false
  ) {
    super(message);
    this.name = 'HarantServiceError';
  }
}

const CITY_SLUGS: Record<string, string> = {
  москва: 'moskva',
  'санкт петербург': 'sankt-peterburg',
  спб: 'sankt-peterburg',
  петербург: 'sankt-peterburg',
  саранск: 'saransk',
  краснодар: 'krasnodar',
  казань: 'kazan',
  екатеринбург: 'ekaterinburg',
  новосибирск: 'novosibirsk',
  'нижний новгород': 'nizhnij-novgorod',
  самара: 'samara',
  уфа: 'ufa',
  пермь: 'perm',
  воронеж: 'voronezh',
  сочи: 'sochi',
  саратов: 'saratov',
  ростов: 'rostov-na-donu',
  'ростов на дону': 'rostov-na-donu',
  челябинск: 'chelyabinsk',
  омск: 'omsk',
  волгоград: 'volgograd',
  красноярск: 'krasnoyarsk',
  тюмень: 'tyumen',
};

const SPECIALIZATION_GUIDE = [
  {
    title: 'Уголовные дела',
    slug: 'ugolovnoe-pravo',
    aliases: ['уголов', 'адвокат по уголов', 'краж', 'мошеннич', 'наркот'],
  },
  {
    title: 'Семейные дела',
    slug: 'semejnye-dela',
    aliases: ['семейн', 'развод', 'брак', 'дет', 'супруг'],
  },
  {
    title: 'Алименты',
    slug: 'alimenty',
    aliases: ['алимент', 'содержание детей'],
  },
  {
    title: 'Раздел имущества',
    slug: 'razdel-imushhestva',
    aliases: ['раздел имущества', 'совместно нажит'],
  },
  {
    title: 'Банкротство физических лиц',
    slug: 'bankrotstvo-fizicheskih-lic',
    aliases: ['банкрот', 'долг', 'списание долгов'],
  },
  {
    title: 'Автоюристы',
    slug: 'avtomobilnye-voprosy',
    aliases: ['дтп', 'авто', 'осаго', 'гибдд'],
  },
  {
    title: 'Трудовое право',
    slug: 'trudovoe-pravo',
    aliases: ['труд', 'увольнен', 'зарплат', 'работодатель'],
  },
  {
    title: 'Жилищные вопросы',
    slug: 'zhilishhnye-voprosy',
    aliases: ['жилищ', 'квартир', 'выселен', 'жкх'],
  },
  {
    title: 'Наследство',
    slug: 'nasledstvo',
    aliases: ['наслед', 'завещан'],
  },
  {
    title: 'Защита прав потребителя',
    slug: 'zashhita-prav-potrebitelej',
    aliases: ['потребител', 'магазин', 'услуг', 'возврат'],
  },
  {
    title: 'Земельные вопросы',
    slug: 'zemelnye-voprosy',
    aliases: ['земл', 'участ', 'межеван'],
  },
  {
    title: 'Арбитраж',
    slug: 'arbitrazh',
    aliases: ['арбитраж', 'бизнес спор'],
  },
  {
    title: 'Взыскание задолженности',
    slug: 'vzyskanie-dolgov',
    aliases: ['взыскание', 'задолж', 'расписк'],
  },
  {
    title: 'Недвижимость',
    slug: 'nedvizhimost',
    aliases: ['недвиж', 'сделк', 'регистрация права'],
  },
  {
    title: 'Административное право',
    slug: 'administrativnoe-pravo',
    aliases: ['административ', 'штраф', 'протокол'],
  },
];

export function getSpecializationGuide() {
  return SPECIALIZATION_GUIDE.map(({ title, slug, aliases }) => ({
    title,
    slug,
    aliases,
    url: `${BASE_URL}/lawyers/${slug}/`,
  }));
}

export async function searchLawyers(input: SearchLawyersInput): Promise<SearchLawyersResponse> {
  const limit = normalizeLimit(input.limit);
  const page = normalizePage(input.page);
  const url = buildSearchUrl({ ...input, limit, page });
  const html = await fetchHtmlWithRetry(url);
  const parsed = parseSearchResults(html, url);
  const filtered = softFilterResults(parsed, input);
  const warnings = parsed.length > 0 && filtered.usedFallback
    ? ['Harant returned results, but strict local filtering found no exact match; returning source results.']
    : undefined;
  const results = filtered.results.slice(0, limit);

  return {
    results,
    total: results.length,
    metadata: {
      source: BASE_URL,
      timestamp: new Date().toISOString(),
      url,
      cached: false,
      appliedFilters: {
        city: input.city,
        specialization: input.specialization,
        name: input.name,
        limit,
        page,
      },
      warnings,
    },
  };
}

export async function getLawyerProfile(
  input: GetLawyerProfileInput
): Promise<LawyerProfileResponse> {
  const profileUrl = normalizeHarantProfileUrl(input.profileUrl);
  const html = await fetchHtmlWithRetry(profileUrl);
  const profile = parseLawyerProfile(html, profileUrl);

  if (!profile.name) {
    throw new HarantServiceError('Could not parse lawyer profile name', 502, false);
  }

  return {
    profile,
    metadata: {
      source: BASE_URL,
      timestamp: new Date().toISOString(),
      url: profileUrl,
      cached: false,
    },
  };
}

export async function getHealth() {
  const startedAt = Date.now();
  const url = `${BASE_URL}/lawyers/`;
  try {
    const html = await fetchHtmlWithRetry(url, { timeoutMs: 10_000, retries: 1 });
    return {
      ok: true,
      source: BASE_URL,
      latencyMs: Date.now() - startedAt,
      reachable: html.length > 0,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      ok: false,
      source: BASE_URL,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
      checkedAt: new Date().toISOString(),
    };
  }
}

export function buildSearchUrl(input: SearchLawyersInput): string {
  const citySlug = resolveCitySlug(input.city);
  const specializationSlug = resolveSpecializationSlug(input.specialization);
  const page = normalizePage(input.page);
  const params = new URLSearchParams();

  if (input.name?.trim()) {
    params.set('keyword', input.name.trim());
  }
  if (page > 1) {
    params.set('page', String(page));
  }

  let path = '/lawyers/';
  if (citySlug && specializationSlug) {
    path = `/lawyers/${citySlug}/cat/${specializationSlug}/`;
  } else if (citySlug) {
    path = `/lawyers/${citySlug}/`;
  } else if (specializationSlug) {
    path = `/lawyers/${specializationSlug}/`;
  } else if (!input.name?.trim()) {
    params.delete('keyword');
  }

  const query = params.toString();
  return `${BASE_URL}${path}${query ? `?${query}` : ''}`;
}

export function parseSearchResults(html: string, sourceUrl = `${BASE_URL}/lawyers/`) {
  const $ = cheerio.load(html);
  const results: EnrichedLawyerSearchResult[] = [];
  const cards = $('.card_jurist.item-wrap, .card_jurist, [class*="lawyer-card"], [class*="lawyer_item"]');

  cards.each((_, element) => {
    const card = $(element);
    const nameAnchor = card.find('.name_card a[href*="/lawyers/"], a.name_card[href*="/lawyers/"], h2 a[href*="/lawyers/"], h3 a[href*="/lawyers/"]').first();
    const rawName = text(nameAnchor.length ? nameAnchor : card.find('.name_card, h2, h3').first());
    const profileUrl = absoluteHarantUrl(nameAnchor.attr('href') || card.find('a[href*="/lawyers/"]').first().attr('href'));
    const name = cleanName(rawName);

    if (!name || !profileUrl || profileUrl.endsWith('/lawyers/')) {
      return;
    }

    const specializations = uniqueStrings(
      card
        .find('.cases_top div, .cases_top a, .cases_top span, [class*="specialization"] a, [class*="spec"] a')
        .map((_, item) => text($(item)))
        .get()
    );

    const profileKind = text(card.find('.profession_card').first()) || undefined;
    const city = cleanupCity(text(card.find('.tag_city').first())) || inferCityFromUrl(profileUrl) || 'Не указан';
    const experience = text(card.find('.tag_experience').first()) || findFirstMatch(text(card), /Стаж[^,.]+/i);
    const caseCount = parseNumber(text(card.find('.tag_work').first()) || findFirstMatch(text(card), /\d+\s+судебн\S*\s+дел\S*/i));
    const reviewCount = parseNumber(text(card.find('.review_card').first()));
    const rating = parseRating(text(card.find('.rating_card').first()));
    const description = stripNoise(text(card.find('.description_card').first())).slice(0, 700) || undefined;
    const servicesPreview = splitCompactList(text(card.find('.price_card .list_price li, .price_card').first())).slice(0, 8);

    results.push({
      name,
      city,
      specialization: specializations[0] || 'Не указана',
      specializations,
      profileUrl,
      rating,
      experience,
      reviewCount,
      caseCount,
      profileKind,
      description,
      servicesPreview,
    });
  });

  if (results.length > 0) {
    return uniqueByProfile(results);
  }

  $('a[href*="/lawyers/"]').each((_, element) => {
    const anchor = $(element);
    const href = absoluteHarantUrl(anchor.attr('href'));
    const name = cleanName(text(anchor));
    if (!href || href.endsWith('/lawyers/') || !looksLikePersonName(name)) {
      return;
    }
    results.push({
      name,
      city: inferCityFromUrl(href) || 'Не указан',
      specialization: 'Не указана',
      specializations: [],
      profileUrl: href,
    });
  });

  return uniqueByProfile(results).map((result) => ({
    ...result,
    description: result.description || `Parsed from ${sourceUrl}`,
  }));
}

export function parseLawyerProfile(html: string, profileUrl: string): EnrichedLawyerProfile {
  const $ = cheerio.load(html);
  const bodyText = text($('body'));
  const name = cleanName(text($('h1').first()) || text($('title')).replace(/[-|].*$/, ''));
  const specializations = uniqueStrings(
    $('a[href*="/cat/"]')
      .map((_, element) => text($(element)))
      .get()
  );
  const contacts = parseContacts($, bodyText);
  const education = splitCompactList(text($('.education_jurist').first())).slice(0, 8);
  const workHistory = splitCompactList(text($('.work_jurist').first())).slice(0, 8);
  const services = splitCompactList(text($('.price_jurist .list_price li, .price_jurist').first())).slice(0, 20);

  return {
    name,
    city: cleanupCity(text($('.tag_city').first())) || inferCityFromUrl(profileUrl) || 'Не указан',
    specialization: specializations.length ? specializations : ['Не указана'],
    experience:
      text($('.tag_experience').first()) ||
      findFirstMatch(bodyText, /Стаж[^,.]+/i) ||
      'Не указан',
    contacts,
    rating: parseRating(text($('.rating_card').first()) || findFirstMatch(bodyText, /\b\d{1,2}[.,]\d\b/)),
    description: stripNoise(text($('.about_jurist').first())).slice(0, 1200) || undefined,
    education,
    achievements: splitCompactList(text($('.case_jurist').first())).slice(0, 8),
    profileUrl,
    profileKind: text($('.profession_card').first()) || undefined,
    reviewCount: parseNumber(text($('.review_card').first())),
    caseCount: parseNumber(text($('.tag_work').first()) || findFirstMatch(bodyText, /\d+\s+судебн\S*\s+дел\S*/i)),
    services,
    workHistory,
  };
}

async function fetchHtmlWithRetry(
  url: string,
  options: { timeoutMs?: number; retries?: number } = {}
) {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchHtml(url, timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await delay(300 * 2 ** attempt);
      }
    }
  }

  if (lastError instanceof HarantServiceError) {
    throw lastError;
  }
  throw new HarantServiceError(
    `Failed to fetch Harant page: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    502,
    true
  );
}

async function fetchHtml(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: REQUEST_HEADERS,
      signal: controller.signal,
      cache: 'no-store',
    });

    if (response.status === 404) {
      throw new HarantServiceError('Harant profile or search page was not found', 404, false);
    }
    if (!response.ok) {
      throw new HarantServiceError(`Harant returned HTTP ${response.status}`, response.status, response.status >= 500);
    }
    return await response.text();
  } catch (error) {
    if (error instanceof HarantServiceError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new HarantServiceError(`Harant request timed out after ${timeoutMs}ms`, 504, true);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeHarantProfileUrl(input: string) {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new HarantServiceError('profileUrl must be a valid URL', 400, false);
  }

  if (url.hostname !== 'harant.ru' && url.hostname !== 'www.harant.ru') {
    throw new HarantServiceError('profileUrl must belong to harant.ru', 400, false);
  }
  if (!url.pathname.startsWith('/lawyers/') || url.pathname === '/lawyers/') {
    throw new HarantServiceError('profileUrl must point to a Harant lawyer profile', 400, false);
  }

  url.hash = '';
  return url.toString();
}

function resolveCitySlug(city?: string) {
  if (!city?.trim()) return undefined;
  const value = city.trim();
  if (/^[a-z0-9-]+$/i.test(value)) return value.toLowerCase();
  const key = normalizeKey(value);
  return CITY_SLUGS[key] || transliterate(value);
}

function resolveSpecializationSlug(specialization?: string) {
  if (!specialization?.trim()) return undefined;
  const value = specialization.trim();
  if (/^[a-z0-9-]+$/i.test(value)) return value.toLowerCase();
  const key = normalizeKey(value);
  const exact = SPECIALIZATION_GUIDE.find((item) => normalizeKey(item.title) === key);
  if (exact) return exact.slug;
  const aliasMatch = SPECIALIZATION_GUIDE.find((item) =>
    item.aliases.some((alias) => key.includes(normalizeKey(alias)))
  );
  return aliasMatch?.slug || transliterate(value);
}

function softFilterResults(results: EnrichedLawyerSearchResult[], input: SearchLawyersInput) {
  const filters = [input.city, input.specialization, input.name].filter(Boolean);
  if (filters.length === 0) {
    return { results, usedFallback: false };
  }

  const filtered = results.filter((result) => {
    const cityMatch = !input.city || normalizeKey(result.city).includes(normalizeKey(input.city));
    const nameMatch = !input.name || normalizeKey(result.name).includes(normalizeKey(input.name));
    const specializationText = [result.specialization, ...result.specializations].join(' ');
    const specializationMatch =
      !input.specialization ||
      normalizeKey(specializationText).includes(normalizeKey(input.specialization)) ||
      resolveSpecializationSlug(input.specialization) === resolveSpecializationSlug(result.specialization);
    return cityMatch && nameMatch && specializationMatch;
  });

  return filtered.length > 0
    ? { results: filtered, usedFallback: false }
    : { results, usedFallback: true };
}

function normalizeLimit(limit?: number) {
  if (!Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.trunc(limit ?? DEFAULT_LIMIT)));
}

function normalizePage(page?: number) {
  if (!Number.isFinite(page)) return 1;
  return Math.max(1, Math.trunc(page ?? 1));
}

function parseContacts($: cheerio.CheerioAPI, bodyText: string): ContactInfo {
  const phoneHref = $('[href^="tel:"]').first().attr('href')?.replace(/^tel:/, '');
  const phone = phoneHref || findFirstMatch(bodyText, /(?:\+7|8)\s?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/);
  const emailHref = $('[href^="mailto:"]').first().attr('href')?.replace(/^mailto:/, '');
  const email = emailHref || findFirstMatch(bodyText, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const telegram = $('a[href*="t.me"], a[href*="telegram"]').first().attr('href');
  const website = $('a[href^="http"]')
    .map((_, element) => $(element).attr('href') || '')
    .get()
    .find((href) => href && !href.includes('harant.ru') && !href.includes('t.me') && !href.includes('whatsapp'));

  return {
    phone: phone ? normalizeWhitespace(phone) : undefined,
    email: email ? normalizeWhitespace(email) : undefined,
    telegram,
    website,
  };
}

function absoluteHarantUrl(href?: string) {
  if (!href) return undefined;
  try {
    return new URL(href, BASE_URL).toString().replace(/#.*$/, '');
  } catch {
    return undefined;
  }
}

function text(element: cheerio.Cheerio<any>) {
  return normalizeWhitespace(element.text());
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function cleanName(value: string) {
  return normalizeWhitespace(
    value
      .replace(/Продвижение профиля.*$/i, '')
      .replace(/Юрист прошел.*$/i, '')
      .replace(/Адвокат прошел.*$/i, '')
  );
}

function cleanupCity(value: string) {
  return normalizeWhitespace(value.replace(/\+\d+$/, ''));
}

function stripNoise(value: string) {
  return normalizeWhitespace(
    value
      .replace(/Читать (еще|далее)/gi, ' ')
      .replace(/Плюсы .*? Минусы/gi, ' ')
      .replace(/Развернуть/gi, ' ')
  );
}

function splitCompactList(value: string) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return [];
  return uniqueStrings(
    normalized
      .split(/(?<=₽)|(?=Консультация)|(?=Представительство)|(?=Составление)|(?=Защита)|(?=Взыскание)|(?=Дата )|(?=Должность )|(?=Название )|(?=\d{4}\s?г\.)/)
      .map(stripNoise)
      .filter((item) => item.length > 2)
  );
}

function parseRating(value?: string) {
  if (!value) return undefined;
  const match = value.replace(',', '.').match(/\b\d{1,2}(?:\.\d)?\b/);
  if (!match) return undefined;
  const rating = Number.parseFloat(match[0]);
  return Number.isFinite(rating) ? rating : undefined;
}

function parseNumber(value?: string) {
  if (!value) return undefined;
  const match = value.replace(/\s+/g, '').match(/\d+/);
  if (!match) return undefined;
  const number = Number.parseInt(match[0], 10);
  return Number.isFinite(number) ? number : undefined;
}

function findFirstMatch(value: string, pattern: RegExp) {
  const match = value.match(pattern);
  return match ? normalizeWhitespace(match[0]) : undefined;
}

function inferCityFromUrl(url: string) {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    if (parts[0] !== 'lawyers' || !parts[1] || parts[1] === 'cat') return undefined;
    return parts[1]
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('-');
  } catch {
    return undefined;
  }
}

function looksLikePersonName(value: string) {
  return /^[А-ЯЁA-Z][а-яёa-z-]+(?:\s+[А-ЯЁA-Z][а-яёa-z-]+){1,3}$/.test(value);
}

function uniqueByProfile(results: EnrichedLawyerSearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.profileUrl)) return false;
    seen.add(result.profileUrl);
    return true;
  });
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  return values
    .map((value) => normalizeWhitespace(value))
    .filter((value) => {
      if (!value || seen.has(value.toLowerCase())) return false;
      seen.add(value.toLowerCase());
      return true;
    });
}

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim();
}

function transliterate(value: string) {
  const map: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'j',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'c',
    ч: 'ch',
    ш: 'sh',
    щ: 'shh',
    ъ: '',
    ы: 'y',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya',
  };

  return value
    .toLowerCase()
    .split('')
    .map((char) => map[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
