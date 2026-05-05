import { useEffect, useState } from 'react';
import { db } from '../supabaseClient';

const FALLBACK_POSTS = [
  {
    id: 1,
    title: 'Що буде на першому прийомі у стоматолога',
    excerpt: 'Коротко про етапи першого візиту і як підготуватися.',
    cover_url: 'https://images.unsplash.com/photo-1588776814546-ec7e57f9f3f9?auto=format&fit=crop&w=1200&q=80',
    published_at: new Date().toISOString(),
    tags: ['гайд', 'перший візит'],
  },
  {
    id: 2,
    title: 'Як підготуватися до імплантації',
    excerpt: '5 практичних кроків, що зменшують тривожність і пришвидшують відновлення.',
    cover_url: 'https://images.unsplash.com/photo-1629904853893-c2c8981a1dc5?auto=format&fit=crop&w=1200&q=80',
    published_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    tags: ['імплантація', 'підготовка'],
  },
];

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await db.getBlogPosts();
      if (mounted) {
        setPosts(data.length ? data : FALLBACK_POSTS);
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="section section--soft">
      <div className="section__heading">
        <h1>Блог ДентаЛюкс</h1>
        <p>Пояснюємо складне простими словами: лікування, профілактика, естетика.</p>
      </div>

      {loading ? (
        <div className="cab-loader">Завантаження статей...</div>
      ) : (
        <div className="blog-grid">
          {posts.map((post) => (
            <article className="blog-card" key={post.id}>
              <img src={post.cover_url} alt={post.title} loading="lazy" />
              <div className="blog-card__body">
                <p className="blog-card__date">{new Date(post.published_at).toLocaleDateString('uk-UA')}</p>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <div className="chips-row">
                  {(post.tags || []).slice(0, 3).map((tag) => (
                    <span className="chip" key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
