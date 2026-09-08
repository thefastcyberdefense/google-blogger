import { initTheme } from './theme.ts';
import { initNavigation } from './navigation.ts';
import { initSearch } from './search.ts';
import { initRecentPosts } from './feed.ts';
import { initArticle } from './article.ts';
import { initTechnicalContent } from './technical-content.ts';
initTheme(); initNavigation(); initSearch(); initArticle(); initTechnicalContent();
void initRecentPosts();
