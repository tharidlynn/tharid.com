import React from 'react';

import { format } from 'date-fns';
import { GetStaticPaths, GetStaticProps } from 'next';

import { Content } from '../../components/Content';
import { Layout } from '../../components/Layout';
import { Meta } from '../../components/Meta';
import { getAllPosts, getPostBySlug } from '../../lib/Content';
import { markdownToHtml } from '../../lib/Markdown';

type IPostUrl = {
  slug: string;
};

type IPostProps = {
  title: string;
  description: string;
  date: string;
  modified_date: string;
  content: string;
};

const DisplayPost = (props: IPostProps) => (
  <Layout
    meta={(
      <Meta
        title={props.title}
        description={props.description}
        post={{
          date: props.date,
          modified_date: props.modified_date,
        }}
      />
    )}
    showInfo={false}
  >
    <h1 className="text-center font-bold text-3xl text-gray-900">{props.title}</h1>
    <div className="text-center text-sm mb-8">{format(new Date(props.date), 'LLLL d, yyyy')}</div>

    <Content>
      <div
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: props.content }}
      />
    </Content>
  </Layout>
);

export const getStaticPaths: GetStaticPaths<IPostUrl> = async () => {
  const posts = getAllPosts(['slug']);

  return {
    paths: posts.map((post) => ({
      params: {
        slug: post.slug,
      },
    })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<IPostProps, IPostUrl> = async ({ params }) => {
  const post = getPostBySlug(params!.slug, [
    'title',
    'description',
    'date',
    'modified_date',
    'content',
    'slug',
  ]);
  const content = await markdownToHtml(post.content || '');

  return {
    props: {
      title: post.title,
      description: post.description,
      date: post.date,
      modified_date: post.modified_date,
      content,
    },
  };
};

export default DisplayPost;
