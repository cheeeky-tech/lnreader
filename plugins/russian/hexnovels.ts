import { CheerioInterface, load as parseHtml } from 'cheerio';
import { fetchApi } from '@libs/fetch';
import { FilterToParse } from '@libs/filterInputs';
import { Plugin } from '@libs/plugin';

class HexNovelsPlugin implements Plugin {
  id = 'hexnovels';
  name = 'HexNovels';
  icon = 'icons/russian/ranobehub.png'; // Берем готовую иконку из официального каталога
  site = 'https://hexnovels.me';
  version = '1.0.1';

  async popularNovels(pageNo: number, options: { filters?: FilterToParse; searchTerm?: string }) {
    if (options.searchTerm) return this.searchNovels(options.searchTerm, pageNo);
    const url = `${this.site}/catalog?page=${pageNo}`;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = parseHtml(body);
    const novels: any[] = [];
    $('.catalog-list .novel-card, .grid .card, a[href*="/novel/"]').each((i, el) => {
      const name = $(el).find('.title, .novel-title, h3').text().trim();
      const cover = $(el).find('img').attr('src') || '';
      const urlAttr = $(el).attr('href') || '';
      const path = urlAttr.replace(this.site, '');
      if (name && path) {
        novels.push({
          name,
          cover: cover.startsWith('http') ? cover : this.site + cover,
          path,
        });
      }
    });
    return novels;
  }

  async parseNovel(novelPath: string) {
    const url = `${this.site}${novelPath}`;
    const result = await fetchApi(url);
    const body = await result.text();
    const $: CheerioInterface = parseHtml(body);
    const novel: any = {
      path: novelPath,
      name: $('.novel-header h1, h1.title').text().trim(),
      cover: $('.novel-cover img, .cover img').attr('src') || '',
      summary: $('.novel-description, .description, #description').text().trim(),
      author: $('.novel-author, .author-name').text().trim() || 'Неизвестен',
      artist: '',
      status: $('.novel-status').text().trim() || 'В процессе',
      genres: '',
    };
    const genresList: string[] = [];
    $('.genres a, .tags a').each((i, el) => { genresList.push($(el).text().trim()) });
    novel.genres = genresList.join(', ');
    const chapters: any[] = [];
    $('.chapters-list a, .chapter-item a, a[href*="/chapter/"]').each((i, el) => {
      const chapterName = $(el).text().trim();
      const chapterUrl = $(el).attr('href') || '';
      const chapterPath = chapterUrl.replace(this.site, '');
      if (chapterName && chapterPath) {
        chapters.push({ name: chapterName, path: chapterPath, releaseTime: null });
      }
    });
    novel.chapters = chapters.reverse();
    return novel;
  }

  async parseChapter(chapterPath: string) {
    const url = `${this.site}${chapterPath}`;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = parseHtml(body);
    $('.ads, .buttons, .comments, script, style').remove();
    return $('.chapter-content, .reader-body, .text-content').html() || 'Текст не найден';
  }

  async searchNovels(searchTerm: string, pageNo: number) {
    const url = `${this.site}/catalog?search=${encodeURIComponent(searchTerm)}&page=${pageNo}`;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = parseHtml(body);
    const novels: any[] = [];
    $('.catalog-list .novel-card, .grid .card, a[href*="/novel/"]').each((i, el) => {
      const name = $(el).find('.title, .novel-title, h3').text().trim();
      const cover = $(el).find('img').attr('src') || '';
      const urlAttr = $(el).attr('href') || '';
      const path = urlAttr.replace(this.site, '');
      if (name && path) {
        novels.push({
          name,
          cover: cover.startsWith('http') ? cover : this.site + cover,
          path,
        });
      }
    });
    return novels;
  }
}

export default new HexNovelsPlugin();
