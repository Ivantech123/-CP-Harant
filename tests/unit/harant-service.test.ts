import { describe, expect, it } from 'vitest';
import { buildSearchUrl, parseLawyerProfile, parseSearchResults } from '../../src/harant/service';

describe('Harant service', () => {
  it('builds city and specialization scoped search URLs', () => {
    expect(
      buildSearchUrl({
        city: 'Москва',
        specialization: 'уголовное право',
        name: 'Иванов',
        page: 2,
      })
    ).toBe('https://harant.ru/lawyers/moskva/cat/ugolovnoe-pravo/?keyword=%D0%98%D0%B2%D0%B0%D0%BD%D0%BE%D0%B2&page=2');
  });

  it('parses Harant search cards', () => {
    const html = `
      <div class="card_jurist item-wrap">
        <div class="head_card">
          <div class="info_card"><a class="review_card" href="/lawyers/moskva/ivanov/#comments">12 отзывов</a></div>
          <div class="text_card">
            <div class="profession_card">Адвокат №123</div>
            <div class="name_card item-title">
              <a href="/lawyers/moskva/ivanov/">Иванов Иван Иванович</a>
            </div>
            <div class="tags_card">
              <span class="tag_city">Москва+2</span>
              <span class="tag_experience">Стаж более 15 лет</span>
              <span class="tag_work">33 судебных дела</span>
            </div>
            <div class="cases_top">
              <div>Уголовные дела</div>
              <div>Семейные дела</div>
            </div>
            <div class="description_card">Опытный адвокат. Читать еще</div>
            <div class="price_card"><div class="list_price">Консультация устная от 3 000 ₽</div></div>
          </div>
          <div class="rating_card">9.7</div>
        </div>
      </div>
    `;

    const results = parseSearchResults(html);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: 'Иванов Иван Иванович',
      city: 'Москва',
      specialization: 'Уголовные дела',
      profileUrl: 'https://harant.ru/lawyers/moskva/ivanov/',
      rating: 9.7,
      reviewCount: 12,
      caseCount: 33,
      profileKind: 'Адвокат №123',
    });
    expect(results[0].specializations).toEqual(['Уголовные дела', 'Семейные дела']);
  });

  it('parses detailed Harant profiles', () => {
    const html = `
      <main>
        <h1>Иванов Иван Иванович</h1>
        <div class="profession_card">Юрист №77</div>
        <div class="rating_card">8.5</div>
        <a class="review_card" href="#comments">5 отзывов</a>
        <div class="tags_card">
          <span class="tag_city">Москва+1</span>
          <span class="tag_experience">Стаж более 10 лет</span>
          <span class="tag_work">20 судебных дел</span>
        </div>
        <a href="https://harant.ru/lawyers/moskva/cat/ugolovnoe-pravo/">Уголовные дела</a>
        <a href="https://harant.ru/lawyers/moskva/cat/semejnye-dela/">Семейные дела</a>
        <section class="about_jurist">Об адвокате Надежный специалист Читать далее</section>
        <section class="education_jurist">2009 г. МГУ - Юриспруденция</section>
        <section class="work_jurist">Дата 2010 по настоящее время Должность Адвокат</section>
        <section class="contacts_jurist">
          Эл. почта ivanov@example.com
          Номер телефона +7 (495) 123-45-67
        </section>
        <section class="price_jurist">Консультация устная 5 000 ₽</section>
      </main>
    `;

    const profile = parseLawyerProfile(html, 'https://harant.ru/lawyers/moskva/ivanov/');

    expect(profile).toMatchObject({
      name: 'Иванов Иван Иванович',
      city: 'Москва',
      specialization: ['Уголовные дела', 'Семейные дела'],
      experience: 'Стаж более 10 лет',
      rating: 8.5,
      reviewCount: 5,
      caseCount: 20,
      profileKind: 'Юрист №77',
      profileUrl: 'https://harant.ru/lawyers/moskva/ivanov/',
    });
    expect(profile.contacts.email).toBe('ivanov@example.com');
    expect(profile.contacts.phone).toBe('+7 (495) 123-45-67');
  });
});
