import React from 'react';

import { GetStaticProps } from 'next';

import { BlogGallery } from '../components/BlogGallery';
import { Main } from '../components/Main';
import { Meta } from '../components/Meta';
import { IPaginationProps } from '../components/Pagination';
import { Config } from '../lib/Config';
import { PostItems, getAllPopular, getAllPosts } from '../lib/Content';

export type IndexProps = {
  posts: PostItems[];
  popularPosts?: any;
  pagination: IPaginationProps;
};

const Index = (props: IndexProps) => (
  <Main
    meta={(
      <Meta
        title="Made with Next.js, TypeScript, ESLint, Prettier, PostCSS, Tailwind CSS"
        description={Config.description}
      />
    )}
    showInfo
  >
    <h2 className="text-4xl text-black font-bold mb-3">Most Popular</h2>
    <BlogGallery posts={props.popularPosts} pagination={props.pagination} />

    <h2 className="text-4xl text-black font-bold mb-3">All Posts</h2>
    <BlogGallery posts={props.posts} pagination={props.pagination} />
  </Main>
);

export const getStaticProps: GetStaticProps<IndexProps> = async () => {
  const posts = getAllPosts(['title', 'description', 'date', 'slug']);
  const popularPosts = getAllPopular(['title', 'description', 'date', 'slug']);
  const pagination: IPaginationProps = {};

  if (posts.length > Config.pagination_size) {
    pagination.next = '/page2';
  }

  return {
    props: {
      posts: posts.slice(0, Config.pagination_size),
      popularPosts,
      pagination,
    },
  };
};

export default Index;
