import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE } from "../config";
import { sortPosts } from "../utils";

export async function GET(context) {
  const posts = sortPosts(
    await getCollection("posts", ({ data }) => !data.draft),
  );

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/posts/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: "<language>zh-CN</language>",
  });
}
