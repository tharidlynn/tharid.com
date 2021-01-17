import React from 'react';

import { format } from 'date-fns';
import Link from 'next/link';

import { PostItems } from '../lib/Content';
import { Pagination, IPaginationProps } from './Pagination';

export type IBlogGalleryProps = {
  posts: PostItems[];
  pagination: IPaginationProps;
};

const BlogGallery = (props: IBlogGalleryProps) => (
  <>
    <ul>
      {props.posts.map((elt) => (
        <li key={elt.slug} className="mb-8">
          <div className="flex justify-between">
            <Link href="/posts/[slug]" as={`/posts/${elt.slug}`}>
              <a>
                <h3 className="text-gray-900 text-2xl font-medium hover:text-gray-700">{elt.title}</h3>
              </a>
            </Link>

            <div className="text-sm text-gray-700">{format(new Date(elt.date), 'LLL yy')}</div>
          </div>
          <p className="text-md">{elt.description}</p>
        </li>
      ))}
    </ul>

    <Pagination previous={props.pagination.previous} next={props.pagination.next} />
  </>
);

export { BlogGallery };
